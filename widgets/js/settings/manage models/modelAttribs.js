/**
 * Description: Manage the template attribs
 * Create Author/Date: Dean Dobson 24/05/20
 * Modified Author/Date: 
 * Version: 1.0
 */

//TODO: Distributor name selected
var tableName = "templates";
var selectedAttrib = "";
var currAttribs;
initCurrAttribs();

function initCurrAttribs() {
	currAttribs = {};
	currAttribs.data = {};
	currAttribs.headers = ["attribute", "value"];
	currAttribs.pk = "attribute";
	currAttribs.label = "sensacollection";
}

// Save button pressed
ClientEvents.subscribe("AttribSave", async function (value) {
	currAttribs = Script.getState("currAttribs"); // from record load in main script
	//if (currAttribs === null || currAttribs.value === null) {
	if (currAttribs === null) {
		initCurrAttribs();
	} //else {
	//	currAttribs = currAttribs.value;
	//}
	var formData = Script.getForm("attribs");
	selectedAttrib = formData["TempAttrib"];
	if (typeof selectedAttrib !== "undefined" && selectedAttrib !== "") {
		currAttribs.data[selectedAttrib] = [selectedAttrib, formData["TempValue"]];
		ClientEvents.publish("TempAttribsDelRows","");
		ClientEvents.publish("TempAttribsSetValues",currAttribs);
		Script.setState("currAttribs", currAttribs); // Share with main script
		Client.status("Attribute '" + selectedAttrib + "' added.");
		Client.setDirtyFlag();
	} else {
		await Client.alert("No attribute has been updated due to no key entered.", "Update Key");
	}
});

// Row in table selected event
ClientEvents.subscribe("SelectedAttrib", function (selected) {
	selectedAttrib = Object.keys(selected.value.data)[0];
	ClientEvents.publish("KeySetValue", selectedAttrib);
	ClientEvents.publish("ValueSetValue", selected.value.data[selectedAttrib][1]);
});

// Delete button
ClientEvents.subscribe("AttribDelete", async function () {
	currAttribs = Script.getState("currAttribs");
	var formData = Script.getForm("attribs");
	selectedAttrib = formData["TempAttrib"];
	if (!(selectedAttrib in currAttribs.data)) {
		var delKey = selectedAttrib;
		if (delKey === "") {
			delKey = "[nothing]";
		}
		await Client.alert("The key '" + delKey + "' does not exist as a custom attribute. Check key and try again", "Delete Key");
	} else {
		delete currAttribs.data[selectedAttrib];
		ClientEvents.publish("TempAttribsDelRows","");
		ClientEvents.publish("TempAttribsSetValues",currAttribs);
		Script.setState("currAttribs", currAttribs);
		Client.status("Attribute '" + selectedAttrib + "' deleted.", "IMPORTANT");
	}
});