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
	var collection = new SensaCollection(["inc", "network", "category", "className", "instance", "scope"], "inc");
	Script.getChannels(function(eventData) {
		var channels = eventData.value;
		for (var i = 0; i < channels.length; i++) {
			var item = channels[i];
			item.inc = i;
			collection.add(item);
		}

		// Send to the table.
		var table = Script.getWidget("channelTable");
		table.receiveValue(collection);
		table.subscribe("selected", function(data) {
			// Get first item
			var first = data.value.getFirst();
			Script.setForm("channelForm", first);
		});
	});	

	var delBtn = Script.getWidget("deleteChannelIcon");
	delBtn.subscribe("pressed", function() {
		var form = Script.getFormByKey("channelForm");
		var table = Script.getWidget("channelTable");
		
		if (form == null) {
			alert("Please fill out all channel inputs.");
			return;
		}
		
		form.className = form.classname;
		delete form.classname;
		
		if (confirm("Are you sure you want to delete these channel?")) {
			Script.removeChannel(form);
			alert("Channel removed");
			Script.clearForm("channelForm");
			
			table.deleteAllRows(true);		
			
			Script.getChannels(function(eventData) {
				var channels = eventData.value;
				for (var i = 0; i < channels.length; i++) {
					var item = channels[i];
					item.inc = i;
					collection.add(item);
				}

				// Send to the table.
				var table = Script.getWidget("channelTable");
				table.receiveValue(collection);
				table.subscribe("selected", function(data) {
					// Get first item
					var first = data.value.getFirst();
					Script.setForm("channelForm", first);

					Script.removeChannel(form);
				});
			});			
		}
	});
});