If you found this repo useful, consider clicking the sponsor button near the top :) Sponsoring via GitHub is as little as $1/month and if you do not use banks or credit cards, there are crypto links included :)<br /><br />
![](https://i.imgur.com/4rPWDFs.png)
---

TO INTALL SMOKE KEYCHAIN:

Clone this repo

In chrome, go to chrome://extensions

enable developer mode

load unpacked extension

the download directory

Woo-smoke.zip

https://goo.gl/Z5y6VC

Add <script src='https://tradeitforweed.io/steem.min.js%27%3E </script> <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js%22%3E</script>
in header
use simple custom js plugin
	
Now uses CoinMarketCap to calculcate USD/SMOKE value (assumes woocommerce uses $USD)

Putting private keys directly into websites is not safe or secure. Even ones run by SMOKEIt, Inc. Yet this is currently how nearly every SMOKE-based site or service currently works. On top of that, most SMOKE users likely use their master password which is even worse

The Vessel desktop wallet software is a secure alternative, but it is too difficult to use for the majority of SMOKE users and does not easily interact with websites - which is SMOKE's primary use case.

On Ethereum, you never have to enter your private key into a website to use a dApp, you can just use a browser extension like Metamask, which dApp websites can interface with to securely store your keys and broadcast transactions to the blockchain.

Smoke Keychain aims to bring the security and ease-of-use of Metamask to the SMOKE blockchain platform.

## Features
The Smoke Keychain extension includes the following features:
- Store an unlimited number of SMOKE account keys, encrypted with AES
- View balances, transaction history, voting power, and more
- Send SMOKE and SBD transfers right from the extension
- Securely interact with SMOKE-based websites that have integrated with Smoke Keychain
- Manage transaction confirmation preferences by account and by website
- Locks automatically on browser shutdown or manually using the lock button

## Website Integration
Websites can currently request the Smoke Keychain extension to perform the following functions / broadcast operations:
- Send a handshake to make sure the extension is installed
- Decrypt a message encrypted by a SMOKE account private key (commonly used for "logging in")
- Post a comment (top level or reply)
- Broadcast a vote
- Broadcast a custom JSON operation
- Send a transfer

## Example

An example of a web page that interacts with the extension is included in the "example" folder in the repo. You can test it by running a local HTTP server and going to http://localhost:1337/main.html in your browser.

`cd example`
`python -m http.server 1337 //or any other method to run a static server`

NOTE: On localhost, it will only run on port 1337.

## API Documentation

The Smoke Keychain extension will inject a "steem_keychain" JavaScript into all web pages opened in the browser while the extension is running. You can therefore check if the current user has the extension installed using the following code:

```
if(window.steem_keychain) {
    // Smoke Keychain extension installed...
} else {
    // Smoke Keychain extension not installed...
}
```

### Handshake

Additionally, you can request a "handshake" from the extension to further ensure it's installed and that your page is able to connect to it:

```
steem_keychain.requestHandshake(function() {
    console.log('Handshake received!'); 
});
```

### Transfer

Sites can request that the extension sign and broadcast a transfer operation for SMOKE or SBD. Note that a confirmation will always be shown to the user for transfer operations and they cannot be disabled.

```
steem_keychain.requestTransfer(account_name, to_account, amount, memo, currency, function(response) {
	console.log(response);
});
```

### Decode Memo / Verify Key

Sites can request that the extension decode a memo encrypted by the Memo, Posting, or Active key for a particular SMOKE account. This is messaged to the user as "Verify Key" since it is typically used to verify that they have access to the private key for an account in order to "log them in".

```
steem_keychain.requestVerifyKey(account_name, encrypted_message, key_type, function(response) {
    console.log(response);
});
```

The values for "key_type" can be: "Memo", "Posting", or "Active".

### Comment Operation

Sites can request that the extension sign and broadcast a "comment" operation (which can be a top-level post or a reply).

```
steem_keychain.requestPost(account_name, title, body, parent_permlink, parent_author, json_metadata, permlink, function(response) {
	console.log(response);
});
```

### Vote

Sites can request that the extension sign and broadcast a "vote" operation:

```
steem_keychain.requestVote(account_name, permlink, author, weight, function(response) {
	console.log(response);
});
```

### Custom JSON

Sites can request that the extension sign and broadcast a "custom_json" operation using either the posting or active key for the account:

```
steem_keychain.requestCustomJson(account_name, custom_json_id, key_type, json, display_name, function(response) {
	console.log(response);
});
```

Where "key_type" can be "Posting" or "Active" and "display_name" is a user-friendly name of the operation to be shown to the user so they know what operation is being broadcast (ex. "SMOKE Monsters Card Transfer").
