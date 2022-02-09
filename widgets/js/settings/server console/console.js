Script.on("init", function() {
	Client.setScreenVisible("New User", false);
	Client.setScreenVisible("New Account", false);
	Client.setScreenVisible("Account Details", false);
	Client.setScreenVisible("User Details", false);
});

/**
* Initialise script state (run once at startup)
* @param {payload} Event data received (payload.channel, payload.data.value, payload.data.usrmeta).
*/
Script.on("load", function(payload) {
  //var reqdata = {"usrmeta":"","sysmeta":{"source":"widgets/settings"},"value":""};
  //var value = ""
  var channel = {
	  category: "$sys",
	  className: "console",
	  instance: "logs",
	  scope: "request",
	  label: "string",
	  value: ""
  };
  Script.publishToChannel(channel);
  return payload;
});

// Process keystrokes for console input
Script.on("keypress", function(keycode) {
  	var reqdata = {"usrmeta":"","sysmeta":{"source":"widgets/settings"},"value":keycode.toString()};
	var value = keycode.toString();
	var channel = {
		category: "$sys",
		className: "console",
		instance: "logs",
		scope: "key",
		value: value
	};
	
    Script.publishToChannel(channel);  
});


/**
 * Response to message from server channel
 * @param {payload} Event data received (payload.channel, payload.data.value, payload.data.usrmeta).
 */
Script.on("Server", function(payload) {
  	var value = new SensaCollection( ["time", "module", "type", "message"], "time");
    var label = "sensacollection";
    
  	var jsTime = new Date(payload.value.time);
	jsTime = jsTime.toLocaleTimeString([], {"hour12": false}) + "." + jsTime.getMilliseconds();

	payload.value.time = jsTime;
	value.add(payload.value);
	/*
    value.data[time] = [];
    value.data[time][0] = jsTime.toLocaleTimeString([], {"hour12": false}) + "." + jsTime.getMilliseconds();
    value.data[time][1] = payload.value.module;
    value.data[time][2] = payload.value.type;
    value.data[time][3] = payload.value.message;
	*/
  	
    var color = "grey";

  	switch (payload.value.type.toUpperCase()) {
 	  case "INFORMATION":
  		color = "#347C2C";
        break;
      case "WARNING":
  		color = "#D4A017";
        break;
      case "ERROR":
  		color = "#8C001A";
        break;
      case "CRITICAL":
  		color = "red";
        break;
    }
    
	var console = Script.getWidget("console");
	console.setTextColor(color);
	console.receiveValue(value);
	
	//Script.sendToWidget("console", "set text color", "string", color);
  	//Script.sendToWidget("console", "receive value", label, value);
    return payload;
});

/**
 * Response to message on client channel
 * @param {payload} Event data received (payload.channel, payload.data.value, payload.data.usrmeta).
 */
Script.on("client", function(payload) {
    return payload;
});