import Promise from 'bluebird';
import newDebug from 'debug';

import broadcastHelpers from './helpers';
import formatterFactory from '../formatter';
import operations from './operations';
import SMOKEApi from '../api';
import SMOKEAuth from '../auth';
import { camelCase } from '../utils';

const debug = newDebug('SMOKE:broadcast');
const noop = function() {}
const formatter = formatterFactory(SMOKEApi);

const SMOKEBroadcast = {};

// Base transaction logic -----------------------------------------------------

/**
 * Sign and broadcast transactions on the SMOKE network
 */

SMOKEBroadcast.send = function SMOKEBroadcast$send(tx, privKeys, callback) {
  const resultP = SMOKEBroadcast._prepareTransaction(tx)
    .then((transaction) => {
      debug(
        'Signing transaction (transaction, transaction.operations)',
        transaction, transaction.operations
      );
      return Promise.join(
        transaction,
        SMOKEAuth.signTransaction(transaction, privKeys)
      );
    })
    .spread((transaction, signedTransaction) => {
      debug(
        'Broadcasting transaction (transaction, transaction.operations)',
        transaction, transaction.operations
      );
      return SMOKEApi.broadcastTransactionSynchronousAsync(
        signedTransaction
      ).then((result) => {
        return Object.assign({}, result, signedTransaction);
      });
    });

  resultP.nodeify(callback || noop);
};

SMOKEBroadcast._prepareTransaction = function SMOKEBroadcast$_prepareTransaction(tx) {
  const propertiesP = SMOKEApi.getDynamicGlobalPropertiesAsync();
  return propertiesP
    .then((properties) => {
      // Set defaults on the transaction
      const chainDate = new Date(properties.time + 'Z');
      const refBlockNum = (properties.last_irreversible_block_num - 1) & 0xFFFF;
      return SMOKEApi.getBlockAsync(properties.last_irreversible_block_num).then((block) => {
        const headBlockId = block.previous;
        return Object.assign({
          ref_block_num: refBlockNum,
          ref_block_prefix: new Buffer(headBlockId, 'hex').readUInt32LE(4),
          expiration: new Date(
            chainDate.getTime() +
            600 * 1000
          ),
        }, tx);
      });
    });
};

// Generated wrapper ----------------------------------------------------------

// Generate operations from operations.json
operations.forEach((operation) => {
  const operationName = camelCase(operation.operation);
  const operationParams = operation.params || [];

  const useCommentPermlink =
    operationParams.indexOf('parent_permlink') !== -1 &&
    operationParams.indexOf('parent_permlink') !== -1;

  SMOKEBroadcast[`${operationName}With`] =
    function SMOKEBroadcast$specializedSendWith(wif, options, callback) {
      debug(`Sending operation "${operationName}" with`, {options, callback});
      const keys = {};
      if (operation.roles && operation.roles.length) {
        keys[operation.roles[0]] = wif; // TODO - Automatically pick a role? Send all?
      }
      return SMOKEBroadcast.send({
        extensions: [],
        operations: [[operation.operation, Object.assign(
          {},
          options,
          options.json_metadata != null ? {
            json_metadata: toString(options.json_metadata),
          } : {},
          useCommentPermlink && options.permlink == null ? {
            permlink: formatter.commentPermlink(options.parent_author, options.parent_permlink),
          } : {}
        )]],
      }, keys, callback);
    };

  SMOKEBroadcast[operationName] =
    function SMOKEBroadcast$specializedSend(wif, ...args) {
      debug(`Parsing operation "${operationName}" with`, {args});
      const options = operationParams.reduce((memo, param, i) => {
        memo[param] = args[i]; // eslint-disable-line no-param-reassign
        return memo;
      }, {});
      const callback = args[operationParams.length];
      return SMOKEBroadcast[`${operationName}With`](wif, options, callback);
    };
});

const toString = obj => typeof obj === 'object' ? JSON.stringify(obj) : obj;
broadcastHelpers(SMOKEBroadcast);

Promise.promisifyAll(SMOKEBroadcast);

exports = module.exports = SMOKEBroadcast;
