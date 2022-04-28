/**
 * Description: 
 * Create Author/Date: 
 * Modified Author/Date Date: 
 * Version: 
 */

/**
 * Initialise script state (run once at startup)
 */
 var accountDetails;
 Script.on('load', function() {
     var accountScreenIcon = Script.getWidget("accountScreenIcon");
     accountScreenIcon.subscribe("pressed", accountsScreen);
     accountDetails = Script.getState("selectedAccount");
     Script.setForm("newUserForm", accountDetails);
     
     var saveAccoutnDetailsIcon = Script.getWidget("saveAccoutnDetailsIcon");
     saveAccoutnDetailsIcon.subscribe("pressed", saveAccountDetails);
 });

ClientEvents.subscribe("fillAccountAddress", function (eventData) {
    let addrName = "";
	for (const component of eventData.value.address_components) {
		const componentType = component.types[0];

		switch (componentType) {
			case "street_number":
				addrName = `${component.long_name}`;
			case "route":
				Script.getWidget("AccountAddressInput").receiveValue(`${addrName} ${component.long_name}`);
				break;
			case "postal_code":
				Script.getWidget("AccountPostCodeInput").receiveValue(`${component.long_name}`);
				// formObj.pcode = `${component.long_name}`;
				break;
			case "administrative_area_level_1":
				Script.getWidget("AccountStateInput").receiveValue(`${component.long_name}`);
				// formObj.state = `${component.short_name}`;
				break;
			case "locality":
				Script.getWidget("AccountCityInput").receiveValue(`${component.long_name}`);
				// formObj.pcode = `${component.long_name}`;
				break;
		}
	}
 });
 
 function accountsScreen() {
     Client.jumpToScreen("Manage Users");
 }
 
 function saveAccountDetails() {
     var formInfo = Script.getFormByKey("newUserForm");
     formInfo.accountid = accountDetails.accountid;
     var dbReq = {};
     
     Database.updateRecord("Directory", "account", dbReq[formInfo], function() {
         alert("Updated");
     });
     
 }