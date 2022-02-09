//# sourceURL=dynamic-script.js
/**
 * Description: 
 * Create Kristifor Milchev
 * Modified Author/Date Date: 
 * Version: 
 */

/**
 * Initialise script state (run once at startup)
 */
 var Sites= [];
 var ActiveDataSource;
 var DefaultFloor;
 var Packet;
 var selectedLevel;
 var _initializer;
 var _handleGeneric;
 var _publishCommand;
 var _gotoPage;
 var activeFilter;
 var persistence;
 var _UpdatePersistance;
 
 
 Script.on('init', function() {
     ClientEvents.publish("animals", ["Fox", "Wild hog", "Dog", "Deer", "Feral Cat"]);
 
 
 
 });
 Script.on('load', function() {
       
	 
	 try{
		 
		 persistence = 	Script.getState("rodent-persistance");
		 _UpdatePersistance = Script.getState("UpdatePersistance");
		  persistence.LastScreen = "Device Level";
		 _UpdatePersistance(persistence);
		 LoadTresholds();
		LoadCompanyProducts();
		 Script.setState("Caller", "Levels");
	 }
	 catch(e)
	 {
		 setTimeout(function(){ 	
			 fw.func("JUMPSCREEN", "Initialisation");
		 }, 3000); 
	 }
      
     _initializer = Script.getState("Initializer");
     _handleGeneric = Script.getState("HandleGeneric");
     _publishCommand = Script.getState("PublishCommand");
     _gotoPage = Script.getState("GotoPage");
     var seleceted = Script.getState("OldState");
     var cardTemplate =  Script.inheritScript("MenuTemplateRodent");
     _initializer(cardTemplate, "SetHtml");
 
     var topMenuTemplate = Script.inheritScript("Menu");
     _initializer(topMenuTemplate, "setTopHtml");
      var command = 
     {
         "Action":"Hide",
         "Compoent":"RightPanel",
         "Value": true
     };
     _publishCommand(command, "activateGeneric");
     command = 
     {
         "Action":"Hide",
         "Compoent":"LeftPanel",
         "Value": true
     };
     _publishCommand(command, "activateGeneric");	
     command = 
     {
         "Action":"setVisible",
         "Compoent":"AddAdvisory",
         "Value": "",
      };
     _publishCommand(command, "activateGeneric");

     command = 
     {
         "Action":"setVal",
         "Compoent":"RightPanel",
         "Value": " ",
         "Id": "PageName",
     };
     _publishCommand(command, "SetTopAction");	
      
      command = 
     {
         "Action":"Change Generic Action",
         "Compoent":"status",
         "Value": "RodentGrid",
      };
     _publishCommand(command, "SetTopAction");	
	  command = 
    {
        "Action":"setVisible",
        "Compoent":"siteVisits",
        "Value": "none",
    };
    _publishCommand(command, "SetTopAction");	
     command = 
	{
		"Action":"setVisible",
		"Compoent":"AddReport",
		"Value": "none",
 	};
	_publishCommand(command, "activateGeneric");	
	 command = 
    {
        "Action":"HideIndex"
    };
    _publishCommand(command, "activateGeneric");
   command = 
	{
		"Action":"setVisibility",
		"Compoent":"maintenanceModeContainer",
		"Value": "hidden",
 	};
	_publishCommand(command, "SetTopAction");	
	 
     selectedLevel = persistence.LocationId;
      
     DefaultFloor = "Floor 1";
     var GetSites = Script.getState("selectedSites");
      
     if(GetSites !== undefined && GetSites.length > 0)
     {
         Sites = [persistence.LocationId]; 
         ClientEvents.publish("CleanRodentCotent", "",false);	
         GetParentName(persistence.LocationId);
         LoadSites(Sites);
     }
	 Script.setState("EnableProvisioning", "True");

 });

ClientEvents.subscribe("ChildCardToggled", function(data) 
{
	
	ClientEvents.publish("devsel", data.value);
});

 ClientEvents.subscribe("LoadCardTraps", function(data) 
 {
     LoadDevices(data,"Floor 1");
 });
 ClientEvents.subscribe("CardAdvisoryClicked", function(data) 
 {
      
     var selectAdvisories = [
     {
         "TableName" : "Advisories", // Specify the primary table used to construct the join request
         "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "Id",
             "Context",
             "Location",
             "Comment",
             "title",
             "AdvisoryType",
             "assigned"
 
         ], // Specify the list of columns to take from the reference table.
         "Filters" : // Filter options in case they are needed.
         [
             {
                 "Column" : "TrapId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "TrapId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": data.value // Value that you want to pass for comparison (any object)
             }	
         ]
     }];
     Database.readCompound("rodent","Advisories",selectAdvisories, function(currentData)					 
     {
          
         Script.setState("SelectedAdvisories", currentData.value.data);
         Script.setState("AdvisoryListCaller",  "Device Level");
         fw.func("JUMPSCREEN", "Rommendation List");
     });
 });
 
 
 
 ClientEvents.subscribe("AreaAdvisoriesClicked", function(data) 
 {
     
     var currentArea = Script.getState("SelectedArea");
     var selectAdvisories = [
     {
         "TableName" : "Advisories", // Specify the primary table used to construct the join request
         "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "Id",
             "Context",
             "Location",
             "Comment",
             "title",
             "AdvisoryType",
             "assigned",
             "reason"
 
         ], // Specify the list of columns to take from the reference table.
         "Filters" : // Filter options in case they are needed.
         [
             {
                 "Column" : "LocationId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "AreaId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": currentArea // Value that you want to pass for comparison (any object)
             }	
         ]
     }];
     Database.readCompound("rodent","Advisories",selectAdvisories, function(currentData)					 
     {
         Script.setState("SelectedAdvisories", currentData);
         Script.setState("AdvisoryListCaller",  "Device Level");
         fw.func("JUMPSCREEN", "Recommendation List");
     });
 });
 
 ClientEvents.subscribe("FloorSelected", function(data) 
 {
      
     var bindingData = SetActiveFloorData(ActiveDataSource, data.value); 
     Packet.value.data = bindingData;
     ClientEvents.publish("test", Packet);
 });
 
 ClientEvents.subscribe("BackToAreas", function(data) 
 {
     
      fw.func("JUMPSCREEN", "Levels");
 });
 
 ClientEvents.subscribe("children-populated", function(data) 
 {
       
     var getSelectedBarcodeId = Script.getState("barcodeId");
     if(getSelectedBarcodeId !== null && getSelectedBarcodeId !== undefined || getSelectedBarcodeId === "0")
     {
         ClientEvents.publish("open-child", getSelectedBarcodeId);
     }
 });
 ClientEvents.subscribe("ChildCardToggled", function(data) 
{
	
	ClientEvents.publish("devsel", data.value);
});

ClientEvents.subscribe("ChangeBait", function(data) 
{
	 
	
 	var id = data.value.ID;
	  var compoundQeury = [
     {
         "TableName" : "Devices", // Specify the primary table used to construct the join request
          "Columns" :
         [
             "Id",
             "DeviceRange", 
             "FullRange",
             "BaitEnalbed"
             
			 
         ],
         "Filters" : // Filter options in case they are needed.
         [
             {
                 "Column" : "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "Id", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": id // Value that you want to pass for comparison (any object)
             }	
         ],
          
     }];
     
     
     Database.readCompound("rodent","Devices",compoundQeury, function(packet)					 
     {	
           
		  var current;
		  for(var item in packet.value.data)
		  {
			  var current = packet.value.data[item];
		  }
		 var resultValue= {
			Event: data.value.Event,
			ID: data.value.ID,
			Form: data.value.form,
			DeviceRange:current[1],
            FullRange:current[2],
            BaitEnalbed:current[3]
		 };
		 ClientEvents.publish("AddBait", resultValue);
     }); 
	
	//ClientEvents.publish("devsel", data.value);
});
 
ClientEvents.subscribe("DeviceDetails", function(data) 
{
	 
	 
 	var id = data.value;
    var compoundQeury = [
     {
         "TableName" : "Devices", // Specify the primary table used to construct the join request
          "Columns" :
         [
             "Id",
             "DeviceRange", 
             "PacketType",
             "P1Weight",
             "P2Weight",
             "RebaitRange",
             "L1",
             "L2",
             "PState"
			 
         ],
         "Filters" : // Filter options in case they are needed.
         [
             {
                 "Column" : "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "Id", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": id // Value that you want to pass for comparison (any object)
             }	
         ],
          
     }];
     
     
     Database.readCompound("rodent","Devices",compoundQeury, function(packet)					 
     {	
         
        var current;
        for(var item in packet.value.data)
        {
            var current = packet.value.data[item];
        }
        var resultValue= {
            ID: id,
            DeviceRange:current[1],
            PacketType:current[2],
            P1Weight:current[3],
            P2Weight:current[4],
            RebaitRange:current[5],
            L1:current[6],
            L2:current[7],
            PState:current[8]
        };
        ClientEvents.publish("setDeviceDetails", resultValue);
     }); 

     
        var errorCodeQuery = [{
            Sql: "select it.Id, it.DeviceId, it.IssueId, it.CreatedAt, ec.Description, tf.FileLocation from ErrorTransactions it join ErrorCodes ec on it.IssueId = ec.Id left join TroubleshootingFiles tf on tf.Id = ec.TroubleshootingHelp where it.DeviceId = $DeviceId AND it.IsActive = $isActive",
            Data: [
                {
                    Column: "$DeviceId",
                    value: id
                },
                {
                    Column: "$isActive",
                    value: '1'
                }
            ]
        }];
        Database.ReadRecordsParam("Rodent","ErrorTransactions",errorCodeQuery, function (packet){
             
            var current;
            var result = [];
            for(var item in packet.value.data)
            {
                var current = packet.value.data[item];
                result.push({
                    Id: current[0],
                    IssueId:current[2],
                    CreatedAt:current[3],
                    Description:current[4],
					TroubleshootingHelp: current[5]
                });
            }
            ClientEvents.publish("setDeviceErrors",result);
        });

	//ClientEvents.publish("devsel", data.value);
});

 function LoadSites(sites)
 {
      
     var filters = [];
     for(var site in sites)
     {
         var siteID = sites[site];
         filters.push({
             "Column" : "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
             "ParamName" : "Location"+siteID, // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
             "Value": siteID // Value that you want to pass for comparison (any object)
         });
         
     }
     var compoundQeury = [
     {
         "TableName" : "Locations", // Specify the primary table used to construct the join request
          "Columns" :
         [
			  "Id",
			  "Name", 
			  "Description"
              
         ], // Specify the list of columns to take from the reference table.
         "JoinOn": ["Locations"],		
         "CompoundTables" : // List of tables that you want joined over the reference table (Takes in a List<CompoundTable> etc the current structure for a lever of inheritence.
         [
             {
                 "Columns": ["count(*)"],
                 "TableName": "Advisories",
                 "CustomName": "Urgent",
                 "JoinTable":"Advisories",
                 "Filters":[
                     {
                         "Column" : "LocationId", 
                         "ParamName" : "Parent1",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                     {
                         "Column" : "AdvisoryType", 
                         "ParamName" : "AdvisoryType1",  
                         "Value": 1,
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "Status", 
                         "ParamName" : "Status1",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "Advisories",
                 "CustomName": "Important",
                 "JoinTable":"Advisories",
                 "Filters":[
                     {
                         "Column" : "LocationId", 
                         "ParamName" : "",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                     {
                         "Column" : "AdvisoryType", 
                         "ParamName" : "AdvisoryType2",  
                         "Value": 2,
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "Status", 
                         "ParamName" : "Status2",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "Advisories",
                 "CustomName": "Minor",
                 "JoinTable":"Advisories",
                 "Filters":[
                     {
                         "Column" : "LocationId", 
                         "ParamName" : "Parent3",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                     {
                         "Column" : "AdvisoryType", 
                         "ParamName" : "AdvisoryType3",  
                         "Value": 3,
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "Status", 
                         "ParamName" : "Status3",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                     
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "Devices",
                 "CustomName": "Danger",
                 "JoinTable":"Devices",
                 "Filters":[
                     {
                         "Column" : "Devices.LocationId", 
                         "ParamName" : "Parent4",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                      
                     {
                         "Column" : "State", 
                         "ParamName" : "State1",  
                         "Value": 3,
                         "IsParentRelated": false
                     },
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "Devices",
                 "CustomName": "Attention",
                 "JoinTable":"Devices",
                 "Filters":[
                     {
                         "Column" : "Devices.LocationId", 
                         "ParamName" : "Parent5",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                  
                     {
                         "Column" : "State", 
                         "ParamName" : "State2",  
                         "Value": 4,
                         "IsParentRelated": false
                     },
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "Devices",
                 "CustomName": "NoAction",
                 "JoinTable":"Devices",
                 "Filters":[
                     {
                         "Column" : "Devices.LocationId", 
                         "ParamName" : "Parent6",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                     {
                         "Column" : "State", 
                         "ParamName" : "State3",  
                         "Value": 2,
                         "IsParentRelated": false
                     },
                 ]
             },
             
         ],  
         "CustomColumnNames":
         [
             {
                 "Index":1,
                 "BindingName": "CardName"
             },
             {
                 "Index":2,
                 "BindingName": "CardAddress"
             },
              
         ],
         "Filters" : filters // Filter options in case they are needed.
     }];
     
     Database.readSubQuery("rodent","Sites",compoundQeury, function(packet)					 
     {	
          
          ClientEvents.publish("SetHeaders", packet,false);
         ClientEvents.publish("toggleCard",selectedLevel,false);
 
     }); 	
 }
 
 function LoadDevices(siteId,floor)
 {
	 
     var compoundQeury = [
     {
         "TableName" : "Devices", // Specify the primary table used to construct the join request
          "Columns" :
         [
             "Id",
             "Status", 
             "BaitRate",
             "Hours",
             "State",
             "SetTime",
             "TriggerTime", 
             "Alert",
             "CompanyProductId",
             "SignalStatus",
             "emptyBy",
			 "DeviceName",
             "SignalStrenght",
             "UpdateTime",
             "DeviceType",
             "Sid",
             "DeviceNumber",
             "Address",
             "Expiry",
             "FoodDate",
             "DeviceBattery", 
             "CommunicationError",
			 "CalculatedWeight",
			 "DeviceRange",
			 "WeightConsumed",
			 "RebaitRange",
			 "EnteredWeight",
			 "StationId",
 			 "Location",
			 "PacketType"
			

			 
         ], // Specify the list of columns to take from the reference table.
         "CustomColumnNames":
         [
             {
                 "Index":29,
                 "BindingName": "BaitTypeName"
             },
             
             
         ],
         "Filters" : // Filter options in case they are needed.
         [
             {
                 "Column" : "LocationId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "LocationId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": siteId // Value that you want to pass for comparison (any object)
             }	
         ],
         "JoinOn": ["CompanyProducts","Locations"],
         "CompoundTables" : // List of tables that you want joined over the reference table (Takes in a List<CompoundTable> etc the current structure for a lever of inheritence.
         [
             {
                 "Columns": ["Name"],
                 "TableName": "CompanyProducts",
                 "JoinTable":"Devices",
             }  
         ]  
     }];
     
     
     Database.readCompound("rodent","Devices",compoundQeury, function(packet)					 
     {	
         ClientEvents.publish("loadChildren", packet,false);	
         GetVisibleFilter();
         ClientEvents.publish("changeVisibleCounter",1,false);
         ClientEvents.publish("view-pointer-changed",1,false);
     }); 	
 }
 
 
 
 
 function SetActiveFloorData(activeSource, floor){
     var bindingData = [];
     for(var item in activeSource)
     {
         var currentItem = activeSource[item];
         if(currentItem[17] === floor)
         {
             bindingData.push(currentItem);
         }
     }
     return bindingData;
 }
 
 
 //region Initialization Queries
 function LoadTresholds()
 {
     var compoundQeury = [
     {
         "TableName" : "Lookups", // Specify the primary table used to construct the join request
         "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "Key",
             "Value"
         ],
          
     }];
     Database.readComposite("rodent","Lookups", compoundQeury,  [
         {
             "Column": "Key",
             "Value": "thresholds"
         }
     ], function(packet) {
          ClientEvents.publish("loadTreshold", packet,false);
     });
 
     
  
 }
 
  


 
 function LoadCompanyProducts()
 {
    var companyIdQuery = [{
        Sql: "select c.Id, l.name from Locations as l join Sites as s on l.RelativeId = s.id join Customers as cu on s.RelativeId = cu.Id Join Branches as b on cu.RelativeId = b.Id join Companies as c on b.RelativeId = c.Id where l.Id = $LocationId",
        Data: [
            {
                Column: "$LocationId",
                value: persistence.LocationId
            } 
        ]
    }];
    Database.ReadRecordsParam("Rodent","Locations",companyIdQuery, function (packet){
        var current;
        for(var item in packet.value.data)
        {
            var current = packet.value.data[item];
            
        }

        var compoundQeury = [
            {
                "TableName" : "CompanyProducts", // Specify the primary table used to construct the join request
                "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
                "Columns" :
                [
                    "Id",
                    "Name",
                    "Expiry",
                    "LowerThreshold",
                    "UpperThreshold",
                    "WeightPerBlock"
                ],
                 "Filters" : // Filter options in case they are needed.
                [
                    {
                        "Column" : "CompanyId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                        "ParamName" : "CompanyId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                        "Value": current[0] // Value that you want to pass for comparison (any object)
                    },
                    {
                        "Column" : "Status", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                        "ParamName" : "Status", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                        "Value": 1// Value that you want to pass for comparison (any object)
                    }
                ],
            }];
            Database.readCompound("rodent","CompanyProducts",compoundQeury, function(packet)					 
            { 
                 
                var current;
                var outgoingSource = [];
                for(var val in packet.value.data)
                {
                      
                    current =  packet.value.data[val];
                    outgoingSource.push({
                        Id:current[0],
                        Name:current[1],
                        Expiry:current[2],
                        LowerThreshold:current[3],
                        UpperThreshold:current[4],
                        WeightPerBlock:current[5]
                    });
                }
                 ClientEvents.publish("baitTypes",outgoingSource,false);
            });
     });
     	
 }
  
 //end region
 
  
 
 function GetParentName(id)
 {
     var compoundQeury = [
     {
         "TableName" : "Locations", // Specify the primary table used to construct the join request
         "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "Name"
         ],
         "Filters":
         [
             {
                 "Column" : "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "Id", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": id // Value that you want to pass for comparison (any object)
             }
         ]// Specify the list of columns to take from the reference table.
     }];
     Database.readCompound("rodent","Locations",compoundQeury, function(packet)					 
     { 
         
         var current;
         for(var val in packet.value.data)
         {
             current =  packet.value.data[val];
         }
         var command = 
         {
             "Action":"setVal",
             "Compoent":"RightPanel",
             "Value": current[0],
             "Id": "PageName",
         };
         _publishCommand(command, "SetTopAction");	
     });	
 }
 
 
 function GetVisibleFilter()
 {
     
     activeFilter = Script.getState("changeVisibleCounterVal");
     if(activeFilter === null)
     {
         Script.setState("changeVisibleCounterVal",1);
         activeFilter =1;
     } 
 }


ClientEvents.subscribe("EventTransaction", function(data) 
{ 
	Database.readLastPrimaryKey("Rodent","EventLogs",function(eventData){
		 
		var lastId = parseInt(eventData.value);
		var Id = lastId + 1;
		var dbVal = {};
	    dbVal[Id] = {
			"Id": Id,
			"DeviceId": data.value.ID,
			"EventTypeId": data.value.EventType,
			"CompanyProductId": data.value.CompanyProductId,
			"Value": data.value.Value,
			"CreatedOn" : data.value.CreatedOn,
			"CreatedBy": data.value.CreatedBy,
			"Owner": data.value.Owner
		};
		// Update a record's values, Fails if the record does not exist.
		Database.saveRecordParam("Rodent", "EventLogs", dbVal, function (data) {

		});

		
	});
});

ClientEvents.subscribe("GenericActionMessage", function(data) 
{ 
	 if(data ==="GoBack|null")
    {
		Script.setState("ReturningFromDevices", true, false);
	}
	  _handleGeneric(data);
});

ClientEvents.subscribe("HandleGenericMessage", function (data) {
     let dataType = data.split("|")[0];
     switch (dataType) {
         case "SearchFor":
            ClientEvents.publish("fCard", data.split("|")[1], false);
            break;
	     case "AdjustSize":
			 ClientEvents.publish("setPosition", data.split("|")[1], false);
            break;
     }
 });