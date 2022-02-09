/**
 * Description: Manage the template data
 * Create Author/Date: Dean Dobson 24/05/20
 * Modified Author/Date: DD 27/9/20
 * Version: 1.3 Adjusted for mapped dropdown & accountID
 */

//TODO: get distributor name, update logic for new distributor selected
var distribs = [];
var selectedDistrib = "";
var tableName = "_models";
var accMap = {};
var selectedRec = "";
var currList = [];
var imageName;
var imageBin;
var accountCollection = null;

Script.on("init", function() {
	Client.setScreenVisible("New User", false);
	Client.setScreenVisible("New Account", false);
	Client.setScreenVisible("Account Details", false);
	Client.setScreenVisible("User Details", false);
});

/**
 * Initialise script state (run once at startup)
 */
Script.on('load', function() {
	// Get the distributor and model names
	Client.getTenants(function (data) {
		distribs = data.value;
		selectedDistrib = distribs[0];
		ClientEvents.publish("DistribNameList", distribs);    // Update the distributor name dropdown
		updateModelDrop();
	});
	
	// Get the account details
	Database.readRecords("directory", "account", function(eventData) {
		accountCollection = SensaCollection.load(eventData.value);
		var accountCol = accountCollection.filter(["accountid", "accountname"]);
		accountCol.setColumns(["value", "text"]);
		accMap = accountCol;   // Save for mapping ID to name later
		var accountDrop = Script.getWidget("TempAccount");
		accountDrop.receiveTextValues(accountCol);
	});
});

// Clear form
ClientEvents.subscribe("ModelClear", async function (selected) {
	if (Client.checkDirtyFlag()) {
			let res = await Client.confirm("OK","Confirm Clear Record","Items on this form have changed, please confirm that you want to clear the fields and ignore changes.", { confirmText: "Clear"});
			if (res) {
				Script.clearForm("devtemplate");
			}
	} else {
		Script.clearForm("devtemplate");
	}
});

function clearForm() {
	ClientEvents.publish("Clear", "");
	Client.clearDirtyFlag();
	imageBin = null;
}

// New distributor selected
ClientEvents.subscribe("DistributorSelected", async function (selected) {
	if (Client.checkDirtyFlag()) {
		let res = await Client.confirm("Items on this form have changed, please confirm that you want to select a new distributor and ignore changes to the form.", "Confirm Changing Record");
		if (res) {
			selectedDistrib = selected.value;
			updateModelDrop();
		}
	} else {
		selectedDistrib = selected.value;
		updateModelDrop();
	}
});

function updateModelDrop() {
	Devices.manageModels("read", selectedDistrib,"", function (data) {
		var models = Object.keys(data.value.data);
		ClientEvents.publish("ModelNameList", models);    // Update the model name dropdown
		if (models.length !== 0) {
			currList = models.slice();
			modelSelected(currList[0], {"columns":"*","filter":"model='" + currList[0] + "'"});
		} else {
			Script.clearForm("devtemplate");
		}
	},{"columns":"model"});
}

// New model selected
ClientEvents.subscribe("ModelSelected", async function (selected) {
	if (Client.checkDirtyFlag()) {
		let res = await Client.confirm("Items on this form have changed, please confirm that you want to select a new model and ignore changes to the form.", "Confirm Changing Record", { confirmText: "Change" });
		if (res) {
			modelSelected(selected.value, {"columns":"*","filter":"model='" + selected.value + "'"});
		} else {
			ClientEvents.publish("TempModNameUpd", selectedRec); // Select old record
		}
	} else {
		modelSelected(selected.value, {"columns":"*","filter":"model='" + selected.value + "'"});
	}
});

function modelSelected(model, options) {
	Devices.manageModels("read", selectedDistrib, model, function (data) {
		Object.keys(data.value.data).forEach(function (item) {
			selectedRec = item;
			populateFields(data.value.data[item]);
		});
		Client.clearDirtyFlag();
	}, options);
}

// Save button
ClientEvents.subscribe("ModelSave", function (value) {
	// Get values in form
	var formData = Script.getForm("devtemplate");
	selectedRec = formData.TempModels;
	saveRecs(formData);
});

// Delete button
ClientEvents.subscribe("ModelDelete", async function (value) {
	// Get values in form
	var formData = Script.getForm("devtemplate");
	selectedRec = formData.TempModels;
	if (formData.TempModels !== "") {
		Client.status("Deleting model '" + selectedRec + "'...", "IMPORTANT");
		let res =  await Client.confirm("Please confirm that you want to delete model '"+ selectedRec + "'. <br><br>NOTE - All devices associated with the model will also be deleted. Are you sure?", "Confirm Delete", { confirmText: "Delete" });
		if (res) {
			//TODO: Propose removing the need to add '' to the filter, the database.cs file should do that, or use filter as a full where clause (security??).
			Devices.manageModels("delete", selectedDistrib, "", async function (data) {
				if (data.value > 0) {
					Client.status("Device template '" + selectedRec + "' deleted.", "IMPORTANT");
					// refresh the dropdown & the fields
					Devices.manageModels("read", selectedDistrib, "*", function (data) {
						var models = Object.keys(data.value.data);
						ClientEvents.publish("ModelNameList", models);    // Update the model name dropdown
						currList = models.slice();
					}, {"columns":"model"});
					//TODO: Delete the model table from the database
				} else {
					var delMsg = "Unknown error with delete.";
					if (data.value == -1) {
						delMsg = "didn't delete correctly. Please check input and retry.";
					}
					if (data.value == 0) {
						delMsg = "No records were found to delete. Please check input and retry.";
					}
					await Client.alert("Device template '" + selectedRec + "' " + delMsg, "Delete Record");
				}
			}, {"columns":"model", "filter":"'" + selectedRec + "'"});
			Script.clearForm("devtemplate");
			imageBin = null;
		}
	} else {
		System.status("WARNING - Can't perform model delete, no model selected, select a model name and try again....", "IMPORTANT");
	}
});

/**
 * Response to message from server channel
 */
Script.on('server', function(eventData) {
});

// Save form to database
async function saveRecs(formData) {
	if (formData.TempModels !== "") {
		Client.status("Saving device template '" + selectedRec + "'...");
		var status = 0;
		switch (formData.TempStatus) {
			case "Enabled":
				status = 1;
				break;
			case "Inactive":
				status = 2;
				break;
		}
		// Populate a dbRequest object to send to server
		var dbRec = {};
		dbRec.model = formData.TempModels;
		dbRec.account = formData.TempAccount;
		dbRec.make = formData.TempMake;
		dbRec.version = formData.TempVersion;
		dbRec.location = formData.TempLocation;
		dbRec.groupname = formData.TempGroup;
		dbRec.branch = formData.TempBranch;
		dbRec.department = formData.TempDepartment;
		dbRec.imagename = imageName;
		dbRec.application = formData.TempApplication;
		dbRec.url = formData.TempURL;
		dbRec.status = status;
		dbRec.owner = formData.TempOwner;
		dbRec.type = formData.TempType;
		dbRec.notes = formData.TempNotes;
		dbRec.apn = formData.TempAPN;
		var dbReq = {};
		dbReq[formData.TempModels] = dbRec;
		Devices.manageModels("save", selectedDistrib, dbRec.model, async function (result) {
			if (result.value > 0) {
				Client.status("Device template '" + selectedRec + "' saved.");
				if (currList.indexOf(selectedRec) === -1) {
					// Add the new record to the dropdown list
					ClientEvents.publish("ModelAddList",selectedRec);
					currList.push(selectedRec);
				}
				Client.clearDirtyFlag();
				Client.status("Record '" + selectedRec + "' saved successfully.", "IMPORTANT");
				// Now save the image file
				if (imageBin !== null) {
					var usrmeta = {
						fileName: imageName,
						fileType: "image",
						location: "images/devices/" + selectedDistrib
					};
					//Client.publishToChannel("$SYS/FILES/REQUEST/UPLOAD", "string", imageBin, usrmeta);
					Client.saveImage(imageBin, function(){}, usrmeta);				
				}
			} else {
				await Client.alert("Device template '" + selectedRec + "' didn't save correctly. Please check input.", "Save Record");
			}		
		}, {"data":dbReq});
	} else {
		await Client.alert("OK","Save Record", "NOTE - Can't perform model save, no model selected, select or enter a model name and try again...");
	}
}

// populate the widget fields from data returned from server
function populateFields(coll) {
	Script.clearForm("devtemplate");
	const newForm = {};
	newForm.dist = selectedDistrib;
	newForm.model = coll[0];
	newForm.app = coll[1];
	newForm.make = coll[2];
	newForm.version = coll[3];
	newForm.location = coll[4];
	newForm.group = coll[5];
	newForm.branch = coll[6];
	newForm.department = coll[7];

	imageName = coll[8];
	ClientEvents.publish("TempLoadImage","../images/devices/" + selectedDistrib + "/" + imageName);
	imageBin = null;

	var recStatus = "Disabled";
	switch (coll[9]) { // Status
		case "1":
			recStatus = "Enabled";
			break;
		case "2":
			recStatus = "Inactive";
			break;
	}
	newForm.status = recStatus;
	newForm.notes = coll[11];
	newForm.owner = coll[12];
	newForm.type = coll[13];
	newForm.apn = coll[14];
	newForm.url = coll[15];

	Script.setForm("devtemplate", newForm);
	
	//ClientEvents.publish("AccountSetValue",accMap.filter(["value", "text"], [coll[10]]));
	// var drop = Script.getWidget("TempAccount");
	// drop.receiveTextValues(accMap.filter(["value", "text"], [coll[10]]));
	newForm.acct = coll[10];
	
	ClientEvents.publish("AttribsDelAll","");
	ClientEvents.publish("KeySetValue","");
	ClientEvents.publish("ValueSetValue","");
	ClientEvents.publish("TempAttribsDelRows","");
	//if (coll[14] !== "null" && coll[14] !== "") { // Custom attribs
	//	var currAttribs = JSON.parse(coll[14]);
	//	if (currAttribs) {
	//		ClientEvents.publish("TempAttribsSetValues",currAttribs);
	//		Script.setState("currAttribs",currAttribs); // Save to statestore for attrib script
	//	}
	//}
}

ClientEvents.subscribe("UploadFirmware", async function (eventdata, channel) {
	//Client.setDirtyFlag();
	await Client.alert("Currently not supported in this version of Sensahub. Coming soon...", "Upload Firmware");
});

ClientEvents.subscribe("ModelImgUpload", function (eventData, channel) {
	//TODO: Convert this to system API blob function
	Client.selectFiles("image/*", function (files) {
		var reader = new FileReader();
		reader.onload = function (e) {
			imageBin = e.target.result;
			imageName = selectedRec + "." + files[0].name.split('.').pop();
			ClientEvents.publish("TempLoadImage", imageBin);
			Client.setDirtyFlag();
		};
		if (reader.readAsDataURL) {
			reader.readAsDataURL(files[0]);
		}
	});
});