
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
    try {
    	//var reqdata = {"usrmeta":"getFileList","sysmeta":{"source":"widgets/settings"},"value":"SYSTEM"};
        //request via ini management channel
        var value = "SYSTEM";
        var sysmeta = {
            source: "widget/settings"
        };
        var usrmeta = "getFileList";
        
	  	Script.publishToChannel("$sys/inimgmt/request/data", "string", value, usrmeta); 
    } catch (ex) {
        console.log('Script initialisation error: ' + ex);
    }
    return payload;
});

/**
 * Response to message from server channel
 * @param {payload} Event data received (payload.channel, payload.data.value, payload.data.usrmeta).
 */
Script.on("server", function(payload) {
    try {
      switch (payload.usrmeta.toUpperCase()) {
        case "GETFILELIST":
 			Script.sendToWidget("ConfName", "receive clear", payload.label, payload.value, payload.sysmeta, payload.usrmeta);
          	break;
        case "CS":
            fw.func("loadCM", "<b>C# Code Editor</b>");
 			Script.sendToWidget("FileEditor", "receive value", payload.label, payload.value, payload.sysmeta, payload.usrmeta);
          	fw.func("status", "Editing configuration");
          	break;
        case "JS":
            fw.func("loadCM", "<b>Javascript Code Editor</b>");
 			Script.sendToWidget("FileEditor", "receive value", payload.label, payload.value, payload.sysmeta, payload.usrmeta);
          	System.status("Editing configuration");
          	break;
        case "INI":
            fw.func("loadCM", "<b>INI Configuration Editor</b>");
              //need to do this because scripting.html and IniEditor are out of sync with standards
 			Script.sendToWidget("FileEditor", "receive value", payload.label, payload.value, payload.sysmeta, payload.usrmeta);
          	System.status("Editing configuration");
          	break;
      }
    } catch (ex) {
       console.log('Script server channel error: ' + ex);
    }
    return payload;
});

/**
 * Response to message on client channel
 * @param {payload} Event data received (payload.channel, payload.data.value, payload.data.usrmeta).
 */
Script.on("client", function(payload) {
    try {
      	var reqdata;
      	switch (payload.sysmeta.source) {
      		// Request server for list for the settings dropdown from type selected
      		case "widget/ConfType":
    			//reqdata = {"usrmeta":"getFileList","sysmeta":{"source":"widgets/settings"},"value":payload.value};
	  			var usrmeta = "getFileList";
                var value = payload.value;
                System.publishToChannel("$sys/inimgmt/request/data", "string", value, usrmeta);
        		break;
  			// Request server for list for the settings dropdown from type selected
            case "widget/reload":
          	case "widget/open":
    			//reqdata = {"usrmeta":"getFile","sysmeta":{"source":"widgets/settings"},"value":payload.value};
	  			var usrmeta = "getFile";
                var value = payload.value;
                System.publishToChannel("$sys/inimgmt/request/data","string", value, usrmeta);
            	break;           
  			// Request server for list for the settings dropdown from type selected
          	case "widget/save":
    			////This is now handled by the client events.
                //reqdata = {"usrmeta":"saveFile","sysmeta":{"source":"widgets/settings"},"value":payload.value};
	  			//System.publishToChannel("$sys/inimgmt/request/data", reqdata);
                break;
        	case "widget/restart":
				if (confirm("WARNING - Please confirm you want to restart the server. This will logout all users and reset the server.")) {
          			System.status("Resetting server, refresh the browser in 20 seconds to reconnect...");
    				reqdata = {"usrmeta":"restart","sysmeta":{"source":"widgets/settings"},"value":"restart"};
	  				var value = "restart";
                    var usrmeta = "restart";
                    System.publishToChannel("$sys/inimgmt/request/data", "string", value, usrmeta);
        		} else {
          			System.status("Server reset cancelled.");
                }
          		break;
      		}
      	return payload;
    } catch (ex) {
       	console.log('Script client channel error: ' + ex);
    }
});