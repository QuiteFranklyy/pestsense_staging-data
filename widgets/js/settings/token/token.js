
/**
* Initialise script state (run once at startup)
* @param {payload} Event data received (payload.channel, payload.data.value, payload.data.usrmeta).
*/
Script.on("load", function(payload) {
    return payload;
});

Script.on("server", function(payload) {
    var channelSplit = payload.sysmeta.channel.split("/");
    switch (channelSplit[channelSplit.length - 2].toUpperCase()) {
            case "SENSORTOKEN":
			ClientEvents.publish("TokenDisplay", payload.value);    // Update the result
			Client.clearDirtyFlag();
            break;
    }
    return payload;
});

// Generate button
ClientEvents.subscribe("generate", function (value) {
	// Get values in form
	var catClass = Script.getForm("CatClass");
    Devices.generateSensorToken(catClass["TokenInpCat"], catClass["TokenInpClass"]);
});