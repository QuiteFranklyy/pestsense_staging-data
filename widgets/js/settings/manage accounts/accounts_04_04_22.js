/**
 * Description: 
 * Create Author/Date: 
 * Modified Author/Date Date: 
 * Version: 
 */

var accountInfo;
var userInfo;
var compamyCollection;
var globalAdmins;

/**
 * Initialise script state (run once at startup)
 */
Script.on('load', function () {
    var newAccountIcon = Script.getWidget("newAccountIcon");
    newAccountIcon.subscribe("pressed", newAccount);

    var newUserIcon = Script.getWidget("newUserIcon");
    newUserIcon.subscribe("pressed", newUser);

    var accDrop = Script.getWidget("accountDrop");
    accDrop.subscribe("selected", updateTable);

    var table = Script.getWidget("allAccUsersTable");
    table.subscribe("pressed", rowSelected);

    var accountInfoIcon = Script.getWidget("accountInfoIcon");
    accountInfoIcon.subscribe("pressed", viewAccountInfo);

    Database.readRecords("Directory", "users", users);
    console.log("Users read from the database are: " + JSON.stringify(users, null, 4));
});

function viewAccountInfo() {
    Client.jumpToScreen("Account Details");
}

function newAccount() {
    Client.jumpToScreen("New Account");
}

function newUser(eventData) {
    var account = Script.getFormByKey("accountManagementForm").drop;
    Script.setState("newUserAccount", account);
    Client.jumpToScreen("New User");
}

function accounts(eventData) {
    accountInfo = SensaCollection.load(eventData.value);
    var accountsArray = accountInfo.getColumn("accountname");
    var accDrop = Script.getWidget("accountDrop");
    accDrop.receiveList(accountsArray);
    var acc = Script.getState("newUserAccount");

    var firstAccount;
    // Get first accounts users.
    if (acc !== null) {
        // The "first" account will be the last selected one
        accDrop.receiveValue(acc);
        firstAccount = accountInfo.query((record, pk) => {
            if (record.accountname.trim() == acc) return true;
        }).getFirst();
    } else {
        firstAccount = accountInfo.getFirst();
    }

    var accountid = firstAccount.accountid;

    // Update enabled to yes or no
    userInfo.forEach(function (record, pk) {
        record.status = record.status == 0 ? "No" : "Yes";
        userInfo.set(record);
    });

    var accountUsers = userInfo.query(function (record, pk) {
        if (record.accountid == accountid) return true;
    });

    Script.setState("accountInfo", accountInfo);

    Script.setState("selectedAccount", firstAccount);

    var table = Script.getWidget("allAccUsersTable");
    // Replace column names for different table row columns
    let userIndex = accountUsers.columns.indexOf("username");
    let emailIndex = accountUsers.columns.indexOf("email");
    accountUsers.columns[userIndex] = "email username";
    accountUsers.columns[emailIndex] = "email address";

    // Replace email address with email username if not provided
    accountUsers.getColumn("email username").forEach((user) => {
        if (accountUsers.data[user][emailIndex] == "") {
            accountUsers.data[user][emailIndex] = accountUsers.data[user][userIndex];
        }
    });

    Database.readRecords("rodent", "Companies", function (eventData) {
        compamyCollection = SensaCollection.load(eventData.value);
        Script.setState("compamyCollection", compamyCollection);
    });

    // var isGlobalFilger = {
    //     columns: "username, isglobaladmin",
    //     //filter: "CompanyId = " + CompanyId
    // };

    // Database.readRecords("Directory", "users", function (eventData) {
    //     globalAdmins = SensaCollection.load(eventData.value);
    //     Script.setState("globalAdmins", globalAdmins); //.getColumn("isglobaladmin")
    // }, isGlobalFilger);



    accountUsers.pk = "email username";
    table.receiveValue(accountUsers);
}

function users(eventData) {
    userInfo = eventData.value;
    // Only set accounts if the user info has been set
    Database.readRecords("Directory", "account", accounts, { filter: `status=1` });
}

function updateTable(eventData) {
    var accountName = eventData.value;
    var accountDetails = accountInfo.query(function (record, pk) {
        if (accountName == record.accountname.trim()) return true;
    }).getFirst();
    var accountid = accountDetails.accountid;

    Script.setState("selectedAccount", accountDetails);

    var accountUsers = userInfo.query(function (record, pk) {
        if (record.accountid == accountid) return true;
    });
    // Check if account actually has users
    if (Object.keys(accountUsers.data).length > 0) {
        let userIndex = accountUsers.columns.indexOf("username");
        let emailIndex = accountUsers.columns.indexOf("email");
        accountUsers.columns[userIndex] = "email username";
        accountUsers.columns[emailIndex] = "email address";

        accountUsers.getColumn("email username").forEach((user) => {
            if (accountUsers.data[user][emailIndex] == "") {
                accountUsers.data[user][emailIndex] = accountUsers.data[user][userIndex];
            }
        });
    }
    accountUsers.pk = "email username";

    // Clear table;
    var table = Script.getWidget("allAccUsersTable");
    table.deleteAllRows("");
    table.receiveValue(accountUsers);
}

function rowSelected(eventData) {
    // Replace column names with what is consistent on the database
    let userIndex = eventData.value.columns.indexOf("email username");
    let emailIndex = eventData.value.columns.indexOf("email address");

    eventData.value.columns[userIndex] = "username";
    eventData.value.columns[emailIndex] = "email";
    eventData.value.pk = "username";

    var record = eventData.value.getFirst();
    console.log("Use details are " + JSON.stringify(record, null, 4));
    Script.setState("userRecord", eventData.value);
    Script.setState("user", record.username);
    Client.jumpToScreen("User Details");
}