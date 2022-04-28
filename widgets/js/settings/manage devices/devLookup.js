/**
 * Description: Lookup M2M SIM details
 * Create Author/Date: Dean Dobson 27/6/20
 * Modified Author/Date Date: 
 * Version: 
 */

//TODO: Put this somewhere more secure
var APIKey = "YnJlbmRhbndpbGxpYW1zb24xOmEzM2E1MTg3LTJkMjgtNDA5My1iMTgwLTJiZjBhN2YyN2VhZQ==";
//89610180003439854330

ClientEvents.subscribe("DevActivateSim", function () {
	var iccid = checkICCID();
	if (iccid) {
		Client.sendXmlHttpRequest("PUT", "https://restapi10.jasper.com/rws/api/v1/devices/" + iccid,
			{ type: "text", data: JSON.stringify({ status: "ACTIVATED" }), headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Basic " + APIKey } }, function () {
				if (this.readyState == 4) {
					if (this.status == 200) {
						Client.invokeModal("OK", "Cellular SIM ICCID " + iccid, "SIM has been activated. Status: " + this.responseText);
					} else {
						Client.invokeModal("OK", "Cellular details for ICCID " + iccid, "Error returned status: " + this.status + ", error: " + this.responseText);
					}
				}
			}
		);
	}
});

ClientEvents.subscribe("DevDeactivateSim", function () {
	var iccid = checkICCID();
	if (iccid) {
		System.sendXmlHttpRequest("PUT", "https://restapi10.jasper.com/rws/api/v1/devices/" + iccid,
			{ type: "text", data: JSON.stringify({ status: "DEACTIVATED" }), headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Basic " + APIKey } }, async function () {
				if (this.readyState == 4) {
					if (this.status == 200) {
						await Client.alert("SIM has been deactivated. Status: " + this.responseText, "Cellular SIM ICCID " + iccid);
					} else {
						await Client.alert("Error returned status: " + this.status + ", error: " + this.responseText, "Cellular details for ICCID " + iccid);
					}
				}
			}
		);
	}
});

ClientEvents.subscribe("LookupIMEI", function () {
	var iccid = checkICCID();
	if (iccid) {
		Client.sendXmlHttpRequest("GET", "https://restapi10.jasper.com/rws/api/v1/devices/" + iccid,
			{ type: "text", data: null, headers: { Accept: "application/json", Authorization: "Basic " + APIKey } }, async function () {
				if (this.readyState == 4) {
					if (this.status == 200) {
						sendToInputs(this.responseText);
					} else {
						await Client.alert("Error returned status: " + this.status + ", error: " + this.responseText, "Cellular details for ICCID " + iccid);
					}
				}
			}
		);
	}
});

ClientEvents.subscribe("DevLookupCellStats", function () {
	var iccid = checkICCID();
	if (iccid) {
		Client.sendXmlHttpRequest("GET", "https://restapi10.jasper.com/rws/api/v1/devices/" + iccid + "/ctdUsages",
			{ type: "text", data: null, headers: { Accept: "application/json", Authorization: "Basic " + APIKey } }, async function () {
				if (this.readyState == 4) {
					if (this.status == 200) {
						formatResponse(this.responseText, iccid);
					} else {
						await Client.alert("Error returned status: " + this.status + ", error: " + this.responseText, "Cellular details for ICCID " + iccid);
					}
				}
			}
		);
	}
});

async function checkICCID() {
	var formData = Script.getForm("DevForm");
	if (formData.DevICCID === "") {
		await Client.alert("Please enter an ICCID in the form before looking up device cellular data", "No ICCID Specified");
		return;
	}
	var iccid = formData.DevICCID;
	Client.status("Looking up data for ICCID " + iccid + "...");
	return iccid;
}

function sendToInputs(response) {
	var jsonData = JSON.parse(response);
	ClientEvents.publish("DevIMEISetVal", jsonData.imei);
	ClientEvents.publish("DevNumberSetVal", jsonData.msisdn);
	Client.setDirtyFlag();
	//ClientEvents.publish("DevAPN","XX");
}

async function formatResponse(response, iccid) {
	var text = "Server responded with the following details:<br><br>";
	var jsonData = JSON.parse(response);
	Object.keys(jsonData).forEach(function (key) {
		text = text + "&nbsp;&nbsp;&nbsp;&nbsp;<b>" + key + ":</b>&nbsp;&nbsp;" + jsonData[key] + "<br>";
	});
	await Client.alert(text, "Cellular details for ICCID " + iccid);
}