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
Script.on("load", function () {
	var newAccountButton = Script.getWidget("newAccountBtn");
	newAccountButton.subscribe("pressed", createAccount);
});

ClientEvents.subscribe("fillAddress", function (eventData) {
	console.log(eventData);
	// var formObj = Script.getFormByKey("newUserForm");
	// if (formObj === null) return;
	// TODO consider having formObj not be null when a value is empty
	let addrName = "";
	for (const component of eventData.value.address_components) {
		const componentType = component.types[0];

		switch (componentType) {
			case "street_number":
				addrName = `${component.long_name}`;
			case "route":
				Script.getWidget("AddressInput").receiveValue(`${addrName} ${component.long_name}`);
				break;
			case "postal_code":
				Script.getWidget("PostCodeInput").receiveValue(`${component.long_name}`);
				// formObj.pcode = `${component.long_name}`;
				break;
			case "administrative_area_level_1":
				Script.getWidget("StateInput").receiveValue(`${component.long_name}`);
				// formObj.state = `${component.short_name}`;
				break;
			case "locality":
				Script.getWidget("CityInput").receiveValue(`${component.long_name}`);
				// formObj.pcode = `${component.long_name}`;
				break;
		}
	}
});

async function createAccount() {
	var formObj = Script.getFormByKey("newUserForm");
	if (formObj === null) return;

	Directory.createAccount(formObj, async function (eventData) {
		if (eventData.value == 1) {
			Client.jumpToScreen("Manage Users");
		} else {
			await Client.alert("An error occured creating a new account. Please contact your system administrator.", "An Error Occured");
		}
	});
}
