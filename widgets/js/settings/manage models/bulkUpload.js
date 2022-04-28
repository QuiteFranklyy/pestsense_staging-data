/**
 * Description: 
 * Create Author/Date: 
 * Modified Author/Date Date: 
 * Version: 
 */

/**
 * Initialise script state (run once at startup)
 */
Script.on('load', function() {
    ClientEvents.subscribe("bulkUploadChannel", function(event) {
        var reader = new FileReader();
        reader.onload = function () {
            // output results
            var dataLines = reader.result.split(/\r\n|\n/);
            const distributor = Script.getForm("devtemplate").TempDist;
            const model = Script.getForm("devtemplate").TempModels;

            const defaults = {
                account : Script.getForm("devtemplate").TempAccount,
                application : Script.getForm("devtemplate").TempApplication,
                group : Script.getForm("devtemplate").TempGroup,
                make : Script.getForm("devtemplate").TempMake,
                status : Script.getForm("devtemplate").TempStatus,
                owner : Script.getForm("devtemplate").TempOwner,
                version : Script.getForm("devtemplate").TempVersion,
                type : Script.getForm("devtemplate").TempType,
                location : Script.getForm("devtemplate").TempLocation,
                department : Script.getForm("devtemplate").TempDepartment,
                branch : Script.getForm("devtemplate").TempBranch,
                apn : Script.getForm("devtemplate").TempAPN,
                url : Script.getForm("devtemplate").TempURL,
                notes : Script.getForm("devtemplate").TempNotes,
                image  : Script.getForm("devtemplate").TempImage
            };
            
            // Start from index one to avoid including column headers
            for (var i = 1; i < dataLines.length; i++) {
                var row = dataLines[i].split(",");
                if (row.length > 1 && row[0] != "") {
                    // Ensure row is not blank

                    // Save to db
                    var dbRec = {};
                    dbRec.serialnum = row[0];
                    dbRec.name = row[1];
                    dbRec.application = row[2] != "" ? row[2] : defaults.application;
                    dbRec.version = row[3] != "" ? row[3] : defaults.version;
                    dbRec.lastserviced = row[4];
                    dbRec.location = row[5] != "" ? row[5] : defaults.location;
                    dbRec.groupname = row[6] != "" ? row[6] : defaults.group;
                    dbRec.department = row[7] != "" ? row[7] : defaults.department;
                    dbRec.branch = row[8] != "" ? row[8] : defaults.branch;
                    dbRec.status = row[9] != "" ? row[9] : defaults.status;
                    dbRec.account = row[10] != "" ? row[10] : defaults.account;
                    dbRec.owner = row[11] != "" ? row[11] : defaults.owner;
                    dbRec.notes = row[12] != "" ? row[12] : defaults.notes;
                    dbRec.lastseen = row[13];
                    dbRec.iccid = row[14];
                    dbRec.imei = row[15];
                    dbRec.apn = row[16] != "" ? row[16] : defaults.apn;
                    dbRec.number = row[17];
                    dbRec.lastvalue = row[18];
                    dbRec.connections = row[19];
                    dbRec.whenadded = row[20];
                    dbRec.whoadded = row[21];
                    dbRec.whenmodified = row[22];
                    dbRec.whomodified = row[23];
                    dbRec.whendisabled = row[24];
                    dbRec.whodisabled = row[25];
                    dbRec.whenenabled = row[26];
                    dbRec.whoenabled = row[27];
                    dbRec.long = row[28];
                    dbRec.lat = row[29];
                    dbRec.signal = row[30];
                    dbRec.battery = row[31];

                    var dbReq = {};
                    dbReq[dbRec.serialnum] = dbRec;
                    
                    // Models table
                    Devices.manageDevices("save", distributor, model, async function (data) {
                        if (data.value > 0) {
                            Client.clearDirtyFlag();
                            Client.status("Device '" + selectedRec + "' (" + selectedModel + ") saved.");

                            // Check if account is different. If so delete all device channels
                            // Get prev device
                            var oldData = allData.get(formData.DevSerial);

                            // If account has changed delete all previous channels
                            if (oldData && formData.DevAccount !== oldData.account) {
                                Log.info(`Device moved between accounts. Deleting old channels for device '${formData.DevSerial}'`);
                                Devices.deleteDeviceChannels(selectedDistrib, selectedModel, formData.DevSerial, function () {
                                    Log.info(`Channels deleted.`);
                                });
                            }
                            Client.clearDirtyFlag();
                        } else {
                            await Client.alert("Device template '" + selectedRec + "' didn't save correctly. Please check input.", "Save Record");
                            Client.status("WARNING - Device template '" + selectedRec + "' didn't save correctly. Please check input.", "IMPORTANT");
                        }
                    },
				    {data: dbReq});
                    
                    Client.status(`Uploaded ${i}/${dataLines.length - 2}`, true);
                }
            }
            Client.status("Finshed Bulk Upload", true);
            alert("Finshed Bulk Upload");
        };
        reader.readAsBinaryString(event.value);
        
    });
});