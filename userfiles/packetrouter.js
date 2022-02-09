// Javascript flow scripting.
/**
 * Description: This script handles the data packets received from devices from Australian and UK MQTT servers.
 * Create Author/Date: 
 * Modified Author/Date: 
 * Version: 
 */


var devices = {};
var FullRange = 1000000;
var baitTakenChanel= 0; 
var ErrorCodes = {};

Script.on("load", function () {
    GetErrors();
});

/**
 * Populates the ErrorCodes object from the database
 */
function GetErrors() {
    var selectTraps = [
        {
            "TableName": "ErrorCodes", // Specify the primary table used to construct the join request
            "Join": 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
            "Columns":
            [
            "CodeId",
            "OOB", 
            "Id",
            "Description",
            "ModelId"
            ], // Specify the list of columns to take from the reference table.

        }];


    var readRecord = Database.readCompound("rodent", "ErrorCodes", selectTraps);
    //Break if device isn't associated with a trap within the relational database.

    var oldRecord = JSON.parse(readRecord);

    for(var item in oldRecord.data) {
        var current = {};
        current.ErrorCode = oldRecord.data[item][0];
        current.OOB = oldRecord.data[item][1];
        current.Id = oldRecord.data[item][2];
        current.Description = oldRecord.data[item][3];
        current.ModelId = oldRecord.data[item][4];
        // Check the ErrorCodes table in rodent.db3 to see each ErrorCode value
        // The key for the ErrorCodes object is the CodeId field in the database
        // ErrorCodes[oldRecord.data[item][0]] = current;

        // Needs to be redone with ModelId being the key to another obj with codeId
        // ErrorCodes = {
        //     ModelId1: {
        //         CodeId1: current1,
        //         CodeId2: current2
        //     },
        //     Model2: {
        //         CodeId1: current1,
        //         CodeId2L current2
        //     }
        // }
        let modelId = oldRecord.data[item][4];
        let codeId = oldRecord.data[item][0];
        if (!(modelId in ErrorCodes)) {
            ErrorCodes[modelId] = {};
        }
        ErrorCodes[modelId][codeId] = current;
    } 
}

/**
 * Response to incoming flow message. eventData object passed in with:
 * eventData.value - incoming data value (string)
 * eventData.startCh - state of channel that initiated the flow and the channel details (Object. Members {channel}, {value})
 * @return {string} return a value to continue the flow or to cancel flow return null
 */
Script.on("flow", function (eventData) {
    var result;
    var mainDataPacket = JSON.parse(eventData.value);
    var dataPacket = mainDataPacket.uplink_message.decoded_payload;

    var selected;
    selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);
    
    baitTakenChanel = 0;
    var devUpdate = false;
    var k;
    var ignoreReading = false;
    var BaitTaken = 0;
    var hueristicsPacket = 0;
    var RangeWeight1 = 0;
    var RangeWeight2 = 0;
    var Tilt;
    var IRLeft1 = 0;
    var IRRigth1 =  0;
    var IRLeft2 = 0;
    var IRRigth2 = 0;
    var counterTotal = 0;
    var cycleTotal = 0;
    var impact = 0;
    var sendingErrorEmail = false;
    var allowPublishBait = false;
    var SelectedError;
    var lcell3 = 0;
    var activeStateLeft = 0;
    var activeStateRight = 0;
    var activeCycleLeft = 0; 
    var activeCycleRight = 0; 
    var heartbeat = 0;

    // PacketType 0 - Device has turned on or off, initial packet sent to establish connection
    if (dataPacket.PacketType === 0) {
        selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);

        if (selected.DeviceBattery === undefined) {
            selected.DeviceBattery = 0;
        }

        selected.PacketType = 0;
        selected.DeviceBattery = parseInt(dataPacket.Battery)/100;
        selected.IsYellow = 1;
        selected.IsRed = 1;
        selected.Expiry = "";
        // Device just started communicating, clear out previous errors (if any)
        // if(selected.ErrorCodeFlag == 1) {
        //     selected.ErrorCodeFlag = 0;
        // }
        
        if (parseInt(dataPacket.Battery) < parseInt(ErrorCodes[selected.ModelId][13].OOB)) {
            sendingErrorEmail = true;
            SelectedError = ErrorCodes[selected.ModelId][13];
            RiseError(ErrorCodes[selected.ModelId][13].Id, selected, selected.DeviceBattery);
        }
        
        var dBm = parseInt(mainDataPacket.uplink_message.rx_metadata[0].rssi);
        //This is the lora signal strenght so it has a negative "DBM"
        var quality;
        quality = ConvertDbm(dBm);
        
        selected.SignalStrenght = quality;
        var trapId = selected.Id.toString();
        Database.saveRecordParam("Rodent", "Devices", {
            trapId: selected
        }, function (data) {

        }); 
    }
    
    // PacketType 1 - Zero calibration
    // Sets all values to default
    if (dataPacket.PacketType === 1) {
        selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);

        selected.PacketType = 1;
        selected.ClibrationRange =  dataPacket.LoadCell;
        selected.WeightConsumed = "";
        selected.WeightLeft = "";
        selected.FullRange = "1000000";
        selected.RebaitRange = "5000";
        selected.GhostWeight = 0;
        selected.TareWeight =  0;
        selected.DeviceRange = 0;
        selected.PState = 1;
        selected.Hours = "";
        selected.CalculatedWeight = "";
        selected.Address = "";
        selected.P1Weight = dataPacket.LoadCell;
        selected.BaitEnalbed = 1;
        selected.UpdateTime = "";
        selected.Expiry = "";
        allowPublishBait = true;

        // Device just started communicating, clear out previous errors (if any)
        // if(selected.ErrorCodeFlag == 1) {
        //     selected.ErrorCodeFlag = 0;
        // }

        
        var trapId = selected.Id.toString();
        Database.saveRecordParam("Rodent", "Devices", {
            trapId: selected
        }, function (data) {

        });
    }

    // PacketType 2 - Full Weight
    // Device has been baited
    if (dataPacket.PacketType === 2) {
        selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);
        selected.BaitEnalbed = 0;
        allowPublishBait = true;
        
        selected.P2Weight = dataPacket.LoadCell;
        if (selected.DeviceBattery === undefined) {
            selected.DeviceBattery = 0;
        }

        if (parseInt(dataPacket.Battery) < parseInt(ErrorCodes[selected.ModelId][13].OOB)) {
            // if(parseInt(selected.CommunicationError) !== 2) {
            //     sendingErrorEmail = true;
            // }
            if (parseInt(selected.ErrorCodeFlag) !== 1) {	
                sendingErrorEmail = true;
            }
            SelectedError = ErrorCodes[selected.ModelId][13];
            RiseError(ErrorCodes[selected.ModelId][13].Id, selected, selected.DeviceBattery);
        }
        
        // if (selected.CommunicationError === "1") {
        //     selected.CommunicationError = 0;
        // }
        // if(selected.ErrorCodeFlag == 1) {
        //     selected.ErrorCodeFlag = 0;
        // }
        
    
        selected.PacketType = 2;
        selected.DeviceRange = (parseInt(dataPacket.LoadCell)  - parseInt(selected.ClibrationRange));
        selected.FullRange = parseInt(dataPacket.LoadCell);
        selected.BaitEnalbed = 0;
        Tilt = dataPacket.Tilt;
        selected.WeightConsumed = 0;

        var trapId = selected.Id.toString();

        Database.saveRecordParam("Rodent", "Devices", {
            trapId: selected
        }, function (data) {

        });
    }
    // PacketType 3 - Heartbeat packet, this is sent on an hourly interval. Evaluate Delta Count for out-of-bound load cell.
    // Receives weight left, bait taken, temperature, tilt channels.
    // Updates battery, signal strength, last communication time
    if (dataPacket.PacketType === 3) {
        selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);
        Tilt = dataPacket.Tilt;
        lcell3 = dataPacket.LoadCell;
        heartbeat = 1;
        selected.DeviceBattery = parseInt(dataPacket.Battery) / 100;
        if (selected.PacketType === "-1") {
            selected.PacketType = -1;
        } else {
            selected.PacketType = 3;	
        }

        // if (selected.CommunicationError === "1") {
        //     selected.CommunicationError = 0;
        // }
        // if(selected.ErrorCodeFlag == 1) {
        //     selected.ErrorCodeFlag = 0;
        // }
        
        if (parseInt(dataPacket.Battery) < parseInt(ErrorCodes[selected.ModelId][13].OOB)) {
            // console.log("selected.CommunicationError "+ selected.CommunicationError); 
            // if(selected.CommunicationError != "2")
            // {	
            //     sendingErrorEmail = true;
            // }
            if (parseInt(selected.ErrorCodeFlag) !== 1) {	
                sendingErrorEmail = true;
            }
            SelectedError = ErrorCodes[selected.ModelId][13];
            RiseError(ErrorCodes[selected.ModelId][13].Id, selected, selected.DeviceBattery);
        }
        
        var trapId = selected.Id.toString();
        Database.saveRecordParam("Rodent", "Devices", {
            trapId: selected
        }, function (data) {

        });

    }
    
    // PacketType 4 - IR sensors have been triggered. The device enters an active state
    // Evaluates the current count for out-of-bound load cell
    // Posts the sum of IR Left/Right to motion channels
    // Update last communication time
    if (dataPacket.PacketType === 4) {
        selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);
        selected.TareWeight = "d"; //dataPacket.data.weight1;
        if(isNaN(parseInt(selected.Hours))) {
            selected.Hours = 0;
        }
        if (isNaN(parseInt(selected.MotionCounters))) {
            selected.MotionCounters = 0;
        }
        
        selected.PacketType = 4;
        var p4Irs = (parseInt(dataPacket.IRLeft) + parseInt(dataPacket.IRRigth));

        if (p4Irs < parseInt(ErrorCodes[selected.ModelId][12].OOB)) {
            counterTotal = p4Irs;
            IRLeft1 = parseInt(dataPacket.IRLeft);
            IRRigth1 = parseInt(dataPacket.IRRigth);
            selected.MotionCounters = parseInt(selected.MotionCounters) + (parseInt(dataPacket.IRLeft) + parseInt(dataPacket.IRRigth));

            var overrideLoadCell = dataPacket.LoadCellOLC;
            console.log("overrideLoadCell: " + overrideLoadCell);
            
            if (overrideLoadCell !== undefined && overrideLoadCell > 0) {
                selected.OLC = overrideLoadCell; 
            } else {
                selected.OLC = 0;
                overrideLoadCell = 0;
            }

            if (parseInt(dataPacket.IRLeft) > 0) {
                activeCycleLeft = 1;
                selected.Hours =  parseInt(selected.Hours) + 1; // parseInt(dataPacket.IRLeft);
                cycleTotal += 1;
            } else {
                activeCycleRight = 1;
                selected.Hours =  parseInt(selected.Hours) + 1; // parseInt(dataPacket.IRRigth);
                cycleTotal += 1;
            }
            
            // if (selected.CommunicationError === "1") {
            //     selected.CommunicationError = 0;
            // }
            // if(selected.ErrorCodeFlag == 1) {
            //     selected.ErrorCodeFlag = 0;
            // }
            
            var trapId = selected.Id.toString();
            selected.UpdateTime = new Date().getTime();

            Database.saveRecordParam("Rodent", "Devices", {
                trapId: selected
            }, function (data) {

            });
        }
        else {
            // console.log("selected.CommunicationError "+ selected.CommunicationError);
            // if(parseInt(selected.CommunicationError) !== 2)
            // {	
            //     sendingErrorEmail = true;
            // }
            if (parseInt(selected.ErrorCodeFlag) !== 1) {	
                sendingErrorEmail = true;
            }
            SelectedError = ErrorCodes[selected.ModelId][12];
            RiseError(ErrorCodes[selected.ModelId][12].Id, selected, p4Irs);
        }

    }
    
    // PacketType 5 - Interim Delta, delta count from motion counters. Sent during active state until no activity is detected.
    // Unpack and process each packet in order. These packet types will arrive as multiple delta values
    // captured over a specific period. These can be evaluated to determine if they are representative of
    // the actual rodent activity - future implementation
    if (dataPacket.PacketType === 5) {
        selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);

        if(isNaN(parseInt(selected.MotionCounters))) {
            selected.MotionCounters = 0;
        }
        selected.PacketType = 5;

        var irs = (parseInt(dataPacket.IRLeft1) + parseInt(dataPacket.IRRigth1));// + (parseInt(dataPacket.IRLeft2) + parseInt(dataPacket.IRRigth2));

        if (irs < parseInt(ErrorCodes[selected.ModelId][12].OOB)) {
            IRLeft1 = 0;
            IRRigth1 = 0;
            if(dataPacket.IRLeft1 !== "0") {
                IRLeft1 += parseInt(dataPacket.IRLeft1);
                counterTotal += IRLeft1;
                if(dataPacket.IRLeft1 !== "0")
                {
                    activeStateLeft = 1;
                }
            }
            //if (dataPacket.IRLeft2 !== "0") {
            //	IRLeft1 += parseInt(dataPacket.IRLeft2);
            //	counterTotal += parseInt(dataPacket.IRLeft2);
            //	if(dataPacket.IRLeft2 !== "")
            //	{
            //		activeStateLeft = 1;
            //	}
            //}
            
            if (dataPacket.IRRigth1 !== "0") {
                IRRigth1 += parseInt(dataPacket.IRRigth1);
                counterTotal += parseInt(dataPacket.IRRigth1);
                if(dataPacket.IRRigth1 !== "")
                {
                    activeStateRight = 1;
                }

            }
            //if (dataPacket.IRRigth2 !== "0") {
            //	IRRigth1 += parseInt(dataPacket.IRRigth2);
            //	counterTotal += parseInt(dataPacket.IRRigth2);
            //	if(dataPacket.IRRigth2 !== "")
            //	{
            //		activeStateRight = 1;
            //	}
            //}
            
            selected.TareWeight =  dataPacket.LoadCell;
            selected.UpdateTime = new Date().getTime();
            selected.MotionCounters =  parseInt(selected.MotionCounters) + irs;
            
            // if (selected.CommunicationError === "1") {
            //     selected.CommunicationError = 0;
            // }
            // if(selected.ErrorCodeFlag == 1) {
            //     selected.ErrorCodeFlag = 0;
            // }
            var trapId = selected.Id.toString();
    
            Database.saveRecordParam("Rodent", "Devices", {
                trapId: selected
            }, function (data) {

            });
        } else {
            // console.log("selected.CommunicationError "+ selected.CommunicationError);
            // if(parseInt(selected.CommunicationError) !== 2)
            // {	
            //     sendingErrorEmail = true;
            // }
            if (parseInt(selected.ErrorCodeFlag) !== 1) {	
                sendingErrorEmail = true;
            }
            SelectedError = ErrorCodes[selected.ModelId][12];
            RiseError(ErrorCodes[selected.ModelId][12].Id, selected, irs);
        }
    // hueristicsPacket = dataPacket.data.weight1;
    }
    
    // PacketType 6 - Final Delta, end active state. Sent after activity stops
    // Evaluate Delta Count for out-of-bound load cell
    // Calculate weight taken (using rebate range formulae)
    // Post sum of IR Left/Right to motion channels and app
    // update last communication time
    if (dataPacket.PacketType === 6) {
        selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);

        if (selected.PState === "" || selected.PState === null || selected.PState === undefined) {
            selected.PState = 1;
        } else {
            selected.PState = parseInt(selected.PState) + 1;
        }
        selected.PacketType = 6;
        selected.L1 = parseInt(dataPacket.l1);
        selected.L2 = parseInt(dataPacket.l2);
        allowPublishBait = true;
        selected.BaitEnalbed = 1;
        console.log("selected.OLC: " + selected.OLC);

        if (parseInt(selected.OLC) > 0) {
            var olcL2Difference = parseInt(selected.OLC) -  parseInt(dataPacket.l2);
            console.log("olcL2Difference: " +olcL2Difference);

            if (olcL2Difference > parseFloat(selected.RebaitRangeDelimiter)) {
                selected.L1 = parseInt(selected.OLC);
                console.log("OLC Bigger than Rebait Range delimiter");
            } else if (olcL2Difference <  (parseFloat(selected.RebaitRangeDelimiter) *-1)) {
                selected.L1 = parseInt(selected.OLC);
                console.log("OLC Less than Rebait Range delimiter");
            }
            selected.OLC = 0;
        }
        console.log("selected.L1: " +selected.L1);
        selected.L1 = parseInt(dataPacket.l1);
        BaitTaken = selected.L1 - selected.L2;
        BaitTaken = BaitTaken / parseFloat(selected.RebaitRange);
        console.log("BaitTaken" +BaitTaken);
        
        if (BaitTaken > 0) {
            // Bait taken is positive result, post to respective channel
            // Update the percentage and consumed values on the app
            var takenVale = BaitTaken / (parseInt(selected.EnteredWeight) -11) * 100;

            if (takenVale < parseInt(ErrorCodes[selected.ModelId][11].OOB)) {
                selected.WeightConsumed = (BaitTaken) + parseFloat(selected.WeightConsumed);

                if (selected.WeightConsumed > (parseInt(selected.EnteredWeight) - 11)) {
                    selected.WeightConsumed = parseInt(selected.EnteredWeight) - 11;
                }

                if (BaitTaken > 0) {
                    if ((parseInt(selected.WeightLeft) - (BaitTaken)) < 0) {
                        BaitTaken = selected.WeightLeft;
                        selected.WeightLeft = 0;
                    } else {
                        selected.WeightLeft = parseFloat(selected.WeightLeft) - (BaitTaken);
                    }
            
                }
                baitTakenChanel = BaitTaken;

                if (isNaN(selected.WeightLeft)) {
                    selected.CalculatedWeight = 0;
                } else {
                    if (Math.round(BaitTaken) > 0) {
                        selected.CalculatedWeight = (parseFloat(selected.WeightLeft) / (parseInt(selected.EnteredWeight) -11)) * 100;
                    }
                }

                if (selected.CalculatedWeight < 0 ) {
                    selected.CalculatedWeight = 0; 
                }
                var TakenChannel = System.getChannelValue("BaitTaken");
                // if (selected.CommunicationError === "1") {
                //     selected.CommunicationError = 0;
                // }
                // if(selected.ErrorCodeFlag == 1) {
                //     selected.ErrorCodeFlag = 0;
                // }
                selected.GhostWeight = parseFloat(selected.GhostWeight) - (BaitTaken);
                devices[mainDataPacket.sid] = selected;
                var trapId = selected.Id.toString();

                Database.saveRecordParam("Rodent", "Devices", {
                    trapId: selected
                }, function (data) {

                });
            } else {
                // console.log("selected.CommunicationError "+ selected.CommunicationError);
                // if(parseInt(selected.CommunicationError) !== 2)
                // {	
                //     sendingErrorEmail = true;
                // }
                if (parseInt(selected.ErrorCodeFlag) !== 1) {
                    sendingErrorEmail = true;
                }
                SelectedError = ErrorCodes[selected.ModelId][11];
                
                RiseError(ErrorCodes[selected.ModelId][11].Id, selected, BaitTaken);
            }

        } else {
            SaveDevice(selected.Id.toString(), selected);
        }
    }
    // PacketType 7 - Impact detected
    if(dataPacket.PacketType === 7) {
        impact = 1;
    }

    // PacketType 9 - Error received, typically during IR malfunction
    // Raises error with the given code
    if (dataPacket.PacketType === 9) {
        selected = GetDeviceData(mainDataPacket.end_device_ids.dev_eui);
        // console.log("selected.CommunicationError "+ selected.CommunicationError);
        // if (parseInt(selected.CommunicationError) !== 2) {
        //     sendingErrorEmail = true;
        // }
        if (parseInt(selected.ErrorCodeFlag) !== 1) {
            sendingErrorEmail = true;
        }
        SelectedError = ErrorCodes[selected.ModelId][dataPacket.Error];
        RiseError(ErrorCodes[selected.ModelId][dataPacket.Error].Id, selected, "");
    }
    
    let weightPacket = {
        "WeightConsumed": parseFloat(selected.WeightConsumed),
        "WeightLeft": parseFloat(selected.WeightLeft), 
        "WeightLeftIndividual":parseFloat(baitTakenChanel),
        "CalculatedWeight":parseInt(selected.CalculatedWeight),
        "RangeWeight1":RangeWeight1,
        "RangeWeight2":RangeWeight2,
        "EnteredWeight": selected.EnteredWeight,		
    }
    
    let devicePacket = {
        "lcell3":lcell3,
        "IRLeft1":IRLeft1,
        "IRRight1":IRRigth1,
        "CounterTotal":counterTotal,
        "CycleTotal":cycleTotal,
        "Impact":impact,
        "DeviceNumber":selected.DeviceNumber,
        "PacketType":dataPacket.PacketType,
        "activeStateRight":activeStateRight,
        "activeStateLeft":activeStateLeft,
        "activeCycleLeft":activeCycleLeft,
        "activeCycleRight":activeCycleRight,
        "heartbeat":heartbeat,
    }
    
    let miscPacket = {
        "Packet": dataPacket.packet,
        "data": dataPacket.data,  
        "HeuristicsPacket": parseInt(hueristicsPacket),
    }
    
    // Return the packet to be parsed by flows and sent to respective channels and email handlers
    return JSON.stringify({
            "sid": mainDataPacket.end_device_ids.dev_eui,
            "WeightLeftIndividual":parseFloat(baitTakenChanel),
            "SetTime":selected.SetTime,
            "EnteredWeight": selected.EnteredWeight, 
            "BaitEnalbed":selected.BaitEnalbed,
            "BaitTaken":baitTakenChanel, 
            "allowPublishBait":allowPublishBait,
            "sendingErrorEmail":sendingErrorEmail,
            "DeviceNumber":selected.DeviceNumber,
            "SelectedError":SelectedError,
            "Owner":selected.Owner,
            "weightPacket": weightPacket,
            "devicePacket": devicePacket
        });
});


/**
 * 
 * @param {*} id 
 * @param {*} deviceData 
 */
function SaveDevice(id, deviceData) {
    var trapId = id;
    Database.saveRecordParam("Rodent", "Devices", {
        trapId: deviceData
    });
}

function RiseError(errorCode, selected, value) {
    var lastId = Database.readLastPrimaryKey("Rodent","ErrorTransactions",function(eventData){
    
    });
    if(isNaN(lastId)) {
        lastId = 0;
    }
    
    var getErrorLogs = [{
        "TableName": "ErrorTransactions", // Specify the primary table used to construct the join request
        "Join": 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
        "Columns":
        [
            "Id",
            "DeviceId", 
            "IsActive"
        ], // Specify the list of columns to take from the reference table.
        "Filters": // Filter options in case they are needed.
        [
            {
                "Column": "DeviceId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                "ParamName": "DeviceId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                "Value":selected.Id// Value that you want to pass for comparison (any object)
            },
            {
                "Column": "IssueId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                "ParamName": "IssueId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                "Value":errorCode// Value that you want to pass for comparison (any object)
            }
        ]
    }];


    var transactionRecord = Database.readCompound("rodent", "IssueTransactions", getErrorLogs);
    //Break if device isn't associated with a trap within the relational database.

    var transactionRecordOld = JSON.parse(transactionRecord);
    var currentFoundTransaction;

    for (var item in transactionRecordOld.data) {
        currentFoundTransaction = {};
        currentFoundTransaction.Id = transactionRecordOld.data[item][0];
    }
    
    
    var trapId = parseInt(lastId)+1;
    
    if (currentFoundTransaction !== undefined) {
        trapId = currentFoundTransaction.Id;
    }
    
    console.log("######### ERRORTRANSACTION INFO ", trapId, selected.Id, errorCode, value);
    
    Database.saveRecordParam("Rodent", "ErrorTransactions", {
        trapId: {
            "Id":trapId,
            "DeviceId":selected.Id,
            "State":3,
            "IssueId":errorCode,
            "CreatedBy":"System Flow",
            "CreatedAt":new Date().getTime(),
            "TransactionValue": value == undefined ? "" : value,
            "IsActive": 1
        }
    
    }, function (data) {

    });

    // selected.CommunicationError = 2;
    selected.ErrorCodeFlag = 1;
    var deviceTrap = selected.Id;
    Database.saveRecordParam("Rodent", "Devices", {
        deviceTrap: selected
    }, function (data) {

    });
    
    return errorCode;
}

function GetDeviceData(id) {
    var selectTraps = [
        {
            "TableName": "Devices", // Specify the primary table used to construct the join request
            "Join": 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
            "Columns":
                [
                    "Id",
                    "Sid",
                    "EnteredWeight",
                    "WeightConsumed",
                    "WeightLeft",
                    "ClibrationRange",
                    "EnteredRange",
                    "GhostWeight",
                    "DeviceRange",
                    "TareWeight",
                    "FullRange",
                    "RebaitRange",
                    "Hours",
                    "PState",
                    "SetTime",
                    "CalculatedWeight",
                    "BaitEnalbed",
                    "CommunicationError",
                    "DeviceBattery",
                    "DeviceNumber",
                    "Owner",
                    "MotionCounters",
                    "RebaitRangeDelimiter",
                    "OLC",
                    "ModelId",
                    "ErrorCodeFlag"
                ], // Specify the list of columns to take from the reference table.
                "Filters": // Filter options in case they are needed.
                [
                    {
                        "Column": "Sid", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                        "ParamName": "sid", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                        "Value":id.toString()// Value that you want to pass for comparison (any object)
                    }
                ]
        }];

    var readRecord = Database.readCompound("rodent", "Traps", selectTraps);
    //Break if device isn't associated with a trap within the relational database.

    var selected;
    var oldRecord = JSON.parse(readRecord);
    var result;
    for (var row in oldRecord.data) {
        selected = oldRecord.data[row];

        result =  {
            "Id": selected[0],
            "ClibrationRange": selected[5],
            "EnteredWeight": selected[2],
            "WeightConsumed": selected[3],
            "WeightLeft": selected[4],
            "EnteredRange":selected[6],
            "GhostWeight":selected[7],
            "DeviceRange":selected[8],
            "TareWeight":selected[9],
            "FullRange":selected[10],
            "RebaitRange":selected[11],
            "Hours":selected[12],
            "PState":selected[13],
            "SetTime":selected[14],
            "CalculatedWeight":selected[15],
            "BaitEnalbed":selected[16],
            "CommunicationError":selected[17],
            "DeviceBattery":selected[18],
            "DeviceNumber":selected[19],
            "Owner": selected[20],
            "MotionCounters":selected[21],
            "RebaitRangeDelimiter":selected[22],
            "OLC": selected[23],
            "ModelId": selected[24],
            "ErrorCodeFlag": selected[25]
        };
    }
    
    return result;
}

function SetValues(data, id) {
    var updateItem = {
        "Id": id,
        "ClibrationRange": "1000000",
    };
    return updateItem;
}


function ConvertDbm(dBm) {
    if (dBm < -120) {
        return 10;
    }

    if (dBm < -115) {
        return 20;
    }

    if (dBm < -111) {
        return 30;
    }

    if (dBm < -107) {
        return 40;
    }

    if (dBm < -101) {
        return 50;
    }

    if (dBm < -95) {
        return 60;
    }

    if (dBm < -90) {
        return 70;
    }

    if (dBm > -90) {
        return 100;
    }
}