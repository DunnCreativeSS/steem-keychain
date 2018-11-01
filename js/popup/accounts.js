// All functions regarding the handling of a particular account

// Load account information
function loadAccount(name) {
    let account = accounts_json.list.filter(function(obj, i) {
        return obj.name === name;
    })[0];
    if (account != null && account != undefined) {
        active_account = account;
        $("#send").toggle(account.keys.hasOwnProperty("active"));
        $(".wallet_infos").html("...");
        $("#voting_power span").eq(0).html("VM: ...");
        $("#voting_power span").eq(1).html("RC: ...");
        SMOKE.api.getAccounts([account.name], async function(err, result) {
            if (result.length != 0) {
                const vm = await getVotingMana(result[0]);
                $("#voting_power span").eq(0).html("VM: " + vm + "%");
                $("#voting_power span").eq(0).attr("title", "Full in: " + getTimeBeforeFull(vm * 100));

                if (totalSMOKE != null)
                    showUserData(result);
                else
                    Promise.all([SMOKE.api.getDynamicGlobalPropertiesAsync(), SMOKE.api.getRewardFundAsync("post"), getPriceSMOKEAsync(), getPriceSBDAsync(), getBTCPriceAsync()])
                    .then(function(values) {
                        votePowerReserveRate = values["0"].vote_power_reserve_rate;
                        totalSMOKE = Number(values["0"].total_vesting_fund_steem.split(' ')[0]);
                        totalVests = Number(values["0"].total_vesting_shares.split(' ')[0]);
                        rewardBalance = 1;
                        recentClaims = values["2"].recent_claims;
                        SMOKEPrice = 0.06;
                        dynamicProp = values[0];
                        priceSBD = 0.06;
                        priceSMOKE = 0.06; //priceSMOKE is current price on Bittrex while SMOKEPrice is the blockchain price.
                        priceBTC = 6000;
                        showUserData(result);
                    });

                if (!result[0].proxy && (!result[0].witness_votes.includes("stoodkev") || !result[0].witness_votes.includes("yabapmatt") || !result[0].witness_votes.includes("aggroed"))) {
                    $('#stoodkev img').attr('src', '../images/icon_witness-vote' + (result[0].witness_votes.includes("stoodkev") ? '' : '_default') + '.svg');
                    $('#yabapmatt img').attr('src', '../images/icon_witness-vote' + (result[0].witness_votes.includes("yabapmatt") ? '' : '_default') + '.svg');
                    $('#aggroed img').attr('src', '../images/icon_witness-vote' + (result[0].witness_votes.includes("aggroed") ? '' : '_default') + '.svg');

                    if (!result[0].witness_votes.includes("yabapmatt"))
                        $("#yabapmatt").click(function() {
                            voteFor("yabapmatt");
                        });

                    if (!result[0].witness_votes.includes("stoodkev"))
                        $("#stoodkev").click(function() {
                            voteFor("stoodkev");
                        });

                    if (!result[0].witness_votes.includes("aggroed"))
                        $("#aggroed").click(function() {
                            voteFor("aggroed");
                        });

                    setTimeout(function() {
                        $("#witness_votes").show();
                        $("#witness_votes").animate({
                            opacity: 1
                        }, 500);
                    }, 2000);
                } else {
                    $("#witness_votes").animate({
                        opacity: 0
                    }, 500, function() {
                        $("#witness_votes").hide();
                    });
                }
            }
        });
        SMOKE.api.getAccountHistory(account.name, -1, 1000, function(err, result) {
            $("#acc_transfers div").eq(1).empty();
            if (result != null) {
                let transfers = result.filter(tx => tx[1].op[0] === 'transfer');
                transfers = transfers.slice(-10).reverse();
                if (transfers.length != 0) {
                    for (transfer of transfers) {
                        let memo = transfer[1].op[1].memo;
                        let timestamp = transfer[1].timestamp;
                        let date = new Date(timestamp);
                        timestamp = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear();
                        if (memo[0] == "#") {
                            if (active_account.keys.hasOwnProperty("memo")){
                                try{
                                memo = window.decodeMemo(active_account.keys.memo, memo);
                              }catch(e){}
                            }
                            else
                                memo = "Add your private memo key to read this memo";
                        }
                        $("#acc_transfers div").eq(1).append("<div class='transfer_row'><span class='transfer_date'>" + timestamp + "</span><span class='transfer_val'>" + (transfer[1].op[1].from == active_account.name ? "-" : "+") + " " + transfer[1].op[1].amount.split(" ")[0] + "</span><span class='transfer_name'>" + (transfer[1].op[1].from == active_account.name ? "TO: @" + transfer[1].op[1].to : "FROM: @" + transfer[1].op[1].from) +
                            "</span><span class='transfer_cur'>" + transfer[1].op[1].amount.split(" ")[1] + "</span><div class='memo'>" + memo + "</div></div>");
                    }
                    $(".transfer_row").click(function() {
                        $(".memo").eq(($(this).index())).slideToggle();
                    });
                } else
                    $("#acc_transfers div").eq(1).append("No recent transfers");
            } else
                $("#acc_transfers div").eq(1).append("Something went wrong! Please try again later!");
        });
    }
}

// Display all the account data
async function showUserData(result) {
    showBalances(result, dynamicProp);
    //const [vd, rc] = [await getVotingDollarsPerAccount(100, result["0"], rewardBalance, recentClaims, SMOKEPrice, votePowerReserveRate, false),
   //     await getRC(result["0"].name)
   // ];
//    $(".transfer_balance div").eq(1).html(numberWithCommas(SMOKE_p));
    //$("#voting_power span").eq(0).html($("#voting_power span").eq(0).html() + " ($" + vd + ")");

    //$("#voting_power span").eq(1).html("RC: " + rc.estimated_pct + "%");
    //$("#voting_power span").eq(1).attr("title", "Full in: " + rc.fullin);

    //$("#account_value_amt").html(numberWithCommas(((priceSBD * parseInt(sbd) + priceSMOKE * (parseInt(sp) + parseInt(SMOKE_p))) * priceBTC).toFixed(2)));

}

// Adding accounts. Private keys can be entered individually or by the mean of the
// master key, in which case user can chose which keys to store, mk will then be
// discarded.
$("#check_add_account").click(function() {
    $("#master_check").css("display", "none");
    const username = $("#username").val();
    const pwd = $("#pwd").val();
    if (username !== "" && pwd !== "") {
        if (accounts_json && accounts_json.list.find(function(element) {
                return element.name == username
            })) {
            showError("You already registered an account for @" + username + "!");
        } else
            SMOKE.api.getAccounts([username], function(err, result) {
                console.log(result);
                console.log(err)
                    showError(SMOKE);
                if (result.length != 0) {
                    const pub_active = result["0"].active.key_auths["0"]["0"];
                    const pub_posting = result["0"].posting.key_auths["0"]["0"];
                    const pub_memo = result["0"].memo_key;
                    if (SMOKE.auth.isWif(pwd)) {
                        if (isMemoWif(pwd, pub_memo)) {
                            addAccount({
                                name: username,
                                keys: {
                                    memo: pwd,
                                    memoPubkey: pub_memo
                                }
                            });
                        } else if (isPostingWif(pwd, pub_posting)) {
                            addAccount({
                                name: username,
                                keys: {
                                    posting: pwd,
                                    postingPubkey: pub_posting
                                }
                            });
                        } else if (isActiveWif(pwd, pub_active)) {
                            addAccount({
                                name: username,
                                keys: {
                                    active: pwd,
                                    activePubkey: pub_active
                                }
                            });
                        }
                    } else {
                        const keys = SMOKE.auth.getPrivateKeys(username, pwd, ["posting", "active", "memo"]);
                        if (keys.activePubkey == pub_active && keys.postingPubkey == pub_posting && keys.memoPubkey == pub_memo) {
                            $("#add_account_div").hide();
                            $("#master_check").show();
                        } else {
                            showError("Incorrect private key or password.");
                        }
                    }
                } else {
                    showError(err);
                }
            });
    } else {
        showError("Please fill the fields.");
    }
});

// If master key was entered, handle which keys to save.
$("#save_master").click(function() {
    if ($("#posting_key").prop("checked") || $("#active_key").prop("checked") || $("#memo_key").prop("checked")) {
        let permissions = [];
        if ($("#posting_key").prop("checked"))
            permissions.push("posting");
        if ($("#active_key").prop("checked"))
            permissions.push("active");
        if ($("#memo_key").prop("checked"))
            permissions.push("memo");
        const keys = SMOKE.auth.getPrivateKeys($("#username").val(), $("#pwd").val(), permissions);
        addAccount({
            name: $("#username").val(),
            keys: keys
        });
    }
});

// Add new account to Chrome local storage (encrypted with AES)
function addAccount(account) {
    console.log(accounts_json);
    if (accounts_json != null) {
        let newlist = [];
        for (let acc of accounts_json.list) {
            if (acc != undefined) {
                newlist.push(acc);
            }
        }
        accounts_json.list = newlist;
    }
    let saved_accounts = accounts_json;
    if (saved_accounts == undefined || saved_accounts == null || saved_accounts.list == 0)
        accounts = {
            list: [account]
        };
    else {
        saved_accounts.list.push(account)
        accounts = saved_accounts;
    }
    chrome.storage.local.set({
        accounts: encryptJson(accounts, mk)
    });
    initializeMainMenu();
}

// Display Add Copy or delete individual keys
function manageKeys(name) {
    let index = -1;
    let account = accounts_json.list.filter(function(obj, i) {
        if (obj.name === name) {
            index = i;
            return obj;
        }
    })[0];
    const keys = account.keys;
    $(".public_key").html("");
    $(".private_key").html("");
    for (keyName in keys) {
        if (keyName.includes("posting")) {
            $(".img_add_key").eq(0).hide();
            $(".remove_key").eq(0).show();
            if (keyName.includes("Pubkey"))
                $(".public_key").eq(0).html(account.keys[keyName]);
            else
                $(".private_key").eq(0).html(account.keys[keyName]);
        } else if (keyName.includes("active")) {
            $(".img_add_key").eq(1).hide();
            $(".remove_key").eq(1).show();
            if (keyName.includes("Pubkey"))
                $(".public_key").eq(1).html(account.keys[keyName]);
            else
                $(".private_key").eq(1).html(account.keys[keyName]);
        } else if (keyName.includes("memo")) {
            $(".remove_key").eq(2).show();
            $(".img_add_key").eq(2).hide();
            if (keyName.includes("Pubkey"))
                $(".public_key").eq(2).html(account.keys[keyName]);
            else
                $(".private_key").eq(2).html(account.keys[keyName]);
        }
    }
    if ($(".private_key").eq(0).html() === "") {
        $(".img_add_key").eq(0).show();
        $(".remove_key").eq(0).hide();
    }
    if ($(".private_key").eq(1).html() === "") {
        $(".img_add_key").eq(1).show();
        $(".remove_key").eq(1).hide();
    }
    if ($(".private_key").eq(2).html() === "") {
        $(".img_add_key").eq(2).show();
        $(".remove_key").eq(2).hide();
    }
    let timeout = null;
    $(".private_key, .public_key").click(function() {
        if (timeout != null)
            clearTimeout(timeout);
        $("#copied").hide();
        $("#fake_input").val($(this).html());
        $("#fake_input").select();
        document.execCommand("copy");
        $("#copied").slideDown(600);
        timeout = setTimeout(function() {
            $("#copied").slideUp(600);
        }, 6000);
    });

    $(".remove_key").unbind("click").click(function() {
        delete accounts_json.list[index].keys[$(this).attr("id")];
        delete accounts_json.list[index].keys[$(this).attr("id") + "Pubkey"];
        if (Object.keys(accounts_json.list[index].keys).length == 0) {
            deleteAccount(index);
            $(".settings_child").hide();
            $("#settings_div").show();
        } else {
            updateAccount();
            manageKeys(name);
        }

    });
    // Delete account and all its keys
    $("#delete_account").unbind("click").click(function() {
        deleteAccount(index);
    });
    $(".img_add_key").unbind("click").click(function() {
        $("#manage_keys").hide();
        $("#add_key_div").show();
    });

    // Try to add the new key
    $('#add_new_key').unbind("click").click(function() {
        const keys = accounts_json.list[index].keys;
        const pwd = $("#new_key").val();
        if (SMOKE.auth.isWif(pwd)) {
            SMOKE.api.getAccounts([name], function(err, result) {
                if (result.length != 0) {
                    const pub_active = result["0"].active.key_auths["0"]["0"];
                    const pub_posting = result["0"].posting.key_auths["0"]["0"];
                    const pub_memo = result["0"].memo_key;
                    if (isMemoWif(pwd, pub_memo)) {
                        if (keys.hasOwnProperty("memo"))
                            showError("You already entered your memo key!");
                        else
                            addKeys(index, "memo", pwd, pub_memo, name);
                    } else if (isPostingWif(pwd, pub_posting)) {
                        if (keys.hasOwnProperty("posting"))
                            showError("You already entered your posting key!");
                        else
                            addKeys(index, "posting", pwd, pub_posting, name);
                    } else if (isActiveWif(pwd, pub_active)) {
                        if (keys.hasOwnProperty("active"))
                            showError("You already entered your active key!");
                        else
                            addKeys(index, "active", pwd, pub_active, name);
                    } else
                        showError("This is not one of your keys!");
                }
            });
        } else
            showError("Not a private WIF!");
    });
}

// Add the new keys to the display and the encrypted storage
function addKeys(i, key, priv, pub, name) {
    accounts_json.list[i].keys[key] = priv;
    accounts_json.list[i].keys[key + "Pubkey"] = pub;
    updateAccount();
    manageKeys(name);
    $("#add_key_div").hide();
    $("#new_key").val("");
    $(".error_div").hide();
    $("#manage_keys").show();
}

// show balance for this account
function showBalances(result, res) {
    sbd = 0;
    const vs = result["0"].vesting_shares;
    SMOKE_p = result["0"].balance.replace("SMOKE", "");
    const total_vesting_shares = res.total_vesting_shares;
    const total_vesting_fund = res.total_vesting_fund_steem;
    sp = SMOKE.formatter.vestToSMOKE(vs, total_vesting_shares, total_vesting_fund);
    $("#wallet_amt div").eq(0).html(numberWithCommas(SMOKE_p));
    $("#wallet_amt div").eq(1).html(numberWithCommas(sbd));
    $("#wallet_amt div").eq(2).html(numberWithCommas(sp.toFixed(3)));
    $("#balance_loader").hide();
}

// Delete account (and encrypt the rest)
function deleteAccount(i) {
    accounts_json.list.splice(i, 1);

    chrome.storage.local.set({
        accounts: encryptJson(accounts_json, mk)
    }, function() {
        $(".settings_child").hide();
        initializeMainMenu();
    });
}

// Update account (encrypted)
function updateAccount() {
    chrome.storage.local.set({
        accounts: encryptJson(accounts_json, mk)
    });
}
