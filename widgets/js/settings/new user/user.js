/**
 * Description: 
 * Create Author/Date: 
 * Modified Author/Date Date: 
 * Version: 
 */

/**
 * Initialise script state (run once at startup)
 */
 var accountCollection = null;
 Script.on('load', function() {
     // System accounts 
     // TODO Locdown to current user account later.
     Database.readRecords("directory", "account", function(eventData) {
         var accountCollection = SensaCollection.load(eventData.value);
         var accDropdownCol = accountCollection.filter(["accountid", "accountname"]);
         accDropdownCol.setColumns(["value", "text"]);
         var accountDrop = Script.getWidget("newUserAccDrop");
         accountDrop.receiveTextValues(accDropdownCol);
                 
         var acc = Script.getState("newUserAccount");
         if (acc !== null) {
             accountDrop.receiveValue(acc);
         }
     });
     
     Database.readRecords("directory", "dash", function(eventData) {
         var dashCollection = eventData.value.getColumn("name");
         var dashDrop = Script.getWidget("dashboardDropdown");
         dashDrop.receiveList(dashCollection);
     });
     
     // Set permisisons on table.
     var permissionsCollection = new SensaCollection(["permission"], "permission");
     var permissions = Object.keys(Directory.permissions);
     for (var i = 0; i < permissions.length; i++) {
         permissionsCollection.add({
             permission: permissions[i]
         });
     }
 
     ClientEvents.publish("permissionsTable", permissionsCollection);
 });

// TODO confirm can add in Directory.js 
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
 
 ClientEvents.subscribe("addNewUserBtn", function() {
    var formObj = Script.getFormByKey("newUserForm");
    if (formObj == undefined) {
        alert("Please fill out all required fields");
        return;
    }
    var perms = formObj.tablePerms.getColumn("permission");

    if (!validateEmail(formObj.username)) { 
        Script.getWidget("username").setValidityMessage("Valid email address is required."); 
        return;
    }

    if (!validateEmail(formObj.email)) {
        Script.getWidget("EmailInput").setValidityMessage("Valid email address is required."); 
        return;
    }
    
    if (formObj.password !== formObj.confirmPassword) {
        Script.getWidget("confirm").setValidityMessage("Passwords did not match.");
        return;
    }

    if (formObj.mobile == undefined || formObj.mobile == "" || isNaN(formObj.mobile)) {
        Script.getWidget("mobile").setValidityMessage("Mobile number is required.");
        return;
    }
    
    var strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})");
    
    // Check strength of password.
    if (!strongRegex.test(formObj.password)) {
        Script.getWidget("password").setValidityMessage("Password too weak! The password must be: \n\t At least 8 characters long \n\t Contain at least 1 uppercase alphabetical character \n\t Contain atleast 1 lowercase alphabetical character \n\t Contain at least 1 numeric character");
        return;
    }
    
    if (perms.length == 0) {
        alert("At least one permission must be assigned to the user.");
        return;
    }

    Directory.addUser(formObj, formObj.accountid, perms, formObj.dashboard, function (eventData) {
        if (eventData.value.account == false) {
            alert("An error occured trying to make a new user. The username may already exist. Please try again.");
            return;
        }
        Client.jumpToScreen("Manage Users");
    });
 });