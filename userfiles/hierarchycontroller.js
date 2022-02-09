//# sourceURL=dynamic-script.js
/**
 * Description: 
 * Create Author/Date: 
 * Modified Author/Date Date: 
 * Version: 
 */

/**
 * Initialise script state (run once at startup)
 */
 var activeFilter1;
 var CompanyId;
 
 var _initializer;
 var _handleGeneric;
 var _publishCommand;
 var _gotoPage;
 var _UpdatePersistance;
 var persistence;
 var activeLevel;
 var activeFilter;
 var lastId;
 var parentId;
 var levels = {
     "Companies":
     {
         Header: {
             table: "Companies",
             columns: [
                 "Id",
                 "Name",
                 "Address"
             ],
             Subquery1: {
                 column: "CompanyId",
                 value: "Companies.Id"
             },
             Subquery2: {
                 column: "Devices.CompanyId",
                 value: "Companies.Id"
             },
             Icon: "CompaniesIcon"
         },
         Children: {
             table: "Branches",
             columns: [
                 "Id",
                 "Name",
                 "Address"
             ],
             Subquery1: {
                 column: "BranchId",
                 value: "Branches.Id"
             },
             Subquery2: {
                 column: "Devices.BranchId",
                 value: "Branches.Id"
             },
             Icon: "BranchesIcon",
             HeaderVal: "Companies"
         },
         Next: "Branches",
         LevelIndex: 1
     },
     "Branches":
     {
         Header: {
             table: "Branches",
             columns: [
                 "Id",
                 "Name",
                 "Address"
             ],
             Subquery1: {
                 column: "BranchId",
                 value: "Branches.Id"
             },
             Subquery2: {
                 column: "Devices.BranchId",
                 value: "Branches.Id"
             },
             Icon: "BranchesIcon"
         },
         Children: {
             table: "Customers",
             columns: [
                 "Id",
                 "Name",
                 "Address"
             ],
             Subquery1: {
                 column: "CustomerId",
                 value: "Customers.Id"
             },
             Subquery2: {
                 column: "Devices.CustomerId",
                 value: "Customers.Id"
             },
             Icon: "CustomersIcon"
         },
         Next: "Customers",
         Prev: "Companies",
         LevelIndex: 2
     },
     "Customers":
     {
         Header: {
             table: "Customers",
             columns: [
                 "Id",
                 "Name",
                 "Address"
             ],
             Subquery1: {
                 column: "CustomerId",
                 value: "Customers.Id"
             },
             Subquery2: {
                 column: "Devices.CustomerId",
                 value: "Customers.Id"
             },
             Icon: "CustomersIcon"
         },
         Children: {
             table: "Sites",
             columns: [
                 "Id",
                 "Name",
                 "Address"
             ],
             Subquery1: {
                 column: "SiteId",
                 value: "Sites.Id"
             },
             Subquery2: {
                 column: "Devices.SiteId",
                 value: "Sites.Id"
             },
             Icon: "SitesIcon"
         },
         Next: "Sites",
         Prev: "Branches",
         LevelIndex: 3
     },
     "Sites":
     {
         Header: {
             table: "Sites",
             columns: [
                 "Id",
                 "Name",
                 "Address"
             ],
             Subquery1: {
                 column: "SiteId",
                 value: "Sites.Id"
             },
             Subquery2: {
                 column: "Devices.SiteId",
                 value: "Sites.Id"
             },
             Icon: "SitesIcon"
         },
         Children: {
             table: "Locations",
             columns: [
                 "Id",
                 "Name",
                 "Description"
             ],
             Subquery1: {
                 column: "LocationId",
                 value: "Locations.Id"
             },
             Subquery2: {
                 column: "Devices.LocationId",
                 value: "Locations.Id"
             },
             Icon: "LocationsIcon"
         },
         Next: "Device Level",
         Prev: "Customers",
         Location: true,
 
         LevelIndex: 4
 
     },
     "Device Level": {
 
     }
 };
 var backHidden = true;
 var DeviceLevel = false;
 var locationName;
 var description;
 Script.on('load', function () {
	 
	 try{
		 persistence = Script.getState("rodent-persistance");
		 _initializer = Script.getState("Initializer");
		 _handleGeneric = Script.getState("HandleGeneric");
		 _publishCommand = Script.getState("PublishCommand");
		 _UpdatePersistance = Script.getState("UpdatePersistance");
		 _gotoPage = Script.getState("GotoPage");
		 var seleceted = Script.getState("OldState");
		 var cardTemplate = Script.inheritScript("MenuTemplateRodent");
		 _initializer(cardTemplate, "SetHtml");
		 ClientEvents.publish("ignore-rows", persistence.UserRights, false);
	 }
	 catch(e)
	 {
		 setTimeout(function(){ 	
			 fw.func("JUMPSCREEN", "Initialisation");
		 }, 200);

	 }

     HideReporting();
     var topMenuTemplate = Script.inheritScript("Menu");
     _initializer(topMenuTemplate, "setTopHtml");
     HideAll();
     if (persistence === null) {
         persistence = {
             "LocationId": 0,
             "CompanyId": 0,
             "CustomerId": 0,
             "SiteId": 0,
             "LastScreen": "Levels"
         };
     }
     else {
         var goingBack = Script.getState("ReturningFromDevices");
         var goingBackFromMaintenance = Script.getState("ReturningFromMaintenance");
         var actualLevel = persistence.LevelAccess !== undefined ? GetUserAccess(parseInt(persistence.LevelAccess)) : GetUserAccess(1);
         if (parseInt(persistence.LevelAccess) > 1)
         {
             ClientEvents.publish("set-ignore-enabled", false, false);
         }
         activeLevel = levels[actualLevel.name];
 
 
         if (parseInt(persistence.LevelAccess) < activeLevel.LevelIndex) 
         {
             ShowBackButton();
         }
         else 
         {
             HideBackButton();
         }
		  
         if (goingBack !== undefined && goingBack === true)
         {
             DeviceLevel = true;
             activeSiteControl();
             ClientEvents.publish("set-ignore-enabled", false, false);
             actualLevel = GetUserAccess(4);
             activeLevel = levels[actualLevel.name];
             Script.setState("ReturningFromDevices", false, false);
             lastId = actualLevel.id;
         }
         else if (goingBackFromMaintenance !== undefined && goingBackFromMaintenance === true) 
         {
             var mLevel = Script.getState("ReturningFromMaintenanceLevel");
             ClientEvents.publish("set-ignore-enabled", false, false);
             var nextLevelRecordId = Script.getState("SelectedEditId");
             var mMode = Script.getState("MaitnanceMode");
			 var cancelState = 	Script.getState("matinanceCanceled");
             if(mMode === "0")
             {
                var command =
                {
                    "Action": "SetToggle",
                    "Value": "1",
                };
                _publishCommand(command, "SetTopAction");
             }
             else
             {
                var command =
                {
                    "Action": "SetToggle",
                    "Value": "0",
                };
                _publishCommand(command, "SetTopAction");
             }
             if(mLevel < 4 && cancelState !== "1")
             {
                actualLevel = GetUserAccess(mLevel+1);
             }
             else
             {
                actualLevel = GetUserAccess(mLevel);
             }
             activeLevel = levels[actualLevel.name];
             if(mLevel < 4 && cancelState !== "1")
             {
                actualLevel.id = nextLevelRecordId;
             }
             Script.setState("ReturningFromMaintenanceLevel", false, false);
             lastId = actualLevel.id;
             
         }
         LoadHeaders(activeLevel.Header, actualLevel.id);
         if(parentId !== undefined)
         {
             GetParentName(parentId, activeLevel);
         }
		 var command1;
		 if(persistence.User === "admin" || persistence.IsAdmin === "1")
		 {
			 command1= 
			{
				"Action":"setVisible",
				"Compoent":"MaintnanceModeRow",
				"Value": "",
			};
			_publishCommand(command1, "SetTopAction");	
		 }
		 else  
		 {
			 command1= 
			{
				"Action":"setVisible",
				"Compoent":"MaintnanceModeRow",
				"Value": "none",
			};
			_publishCommand(command1, "SetTopAction");	  
	    }
	 
     }
	 Script.setState("EnableProvisioning", "False");
	 var startDate = new Date();
	 var endDate = startDate.addDays(7);
		var result = {
			startDate: startDate,
			endDate: endDate,
			locationName:"",
			description: "",
			data:[]
		}

		ClientEvents.publish("receive-data", result, false);

 });
 
 
 function LoadHeaders(level, id) {
	 
     var compoundQeury = ComposeQuery(level, id, 1);
     var tempId = id;
     if (parseInt(persistence.LevelAccess) < activeLevel.LevelIndex) 
     {
         ShowBackButton();
     }
     Database.readSubQuery("rodent", level.table, compoundQeury, function (packet) {
		 if (level.table === "Companies") {
			 ClientEvents.publish("set-ignore-enabled", true, false);
		 }
		 
		 ClientEvents.publish("clearLanding", "", false);
         var cardTemplate = Script.getScriptElement("header");
         var icon = Script.getScriptElement(level.Icon);
         cardTemplate.querySelector("[data-info='headerIcon']").appendChild(icon);
         ClientEvents.publish("setHeaderTemplate", cardTemplate, false);
         ClientEvents.publish("SetSource", packet, false);
 
         if (_publishCommand === undefined)
         {
             GetVisibleFilter();
             ClientEvents.publish("changeVisibleCounter", activeFilter1, false);
             ClientEvents.publish("view-pointer-changed", activeFilter1, false);
         }
         else if (activeFilter1 !== null && activeFilter1 !== undefined) {
             ClientEvents.publish("changeVisibleCounter", activeFilter1, false);
             ClientEvents.publish("view-pointer-changed", activeFilter1, false);
         }
         else 
         {
             ClientEvents.publish("changeVisibleCounter", 1, false);
             ClientEvents.publish("view-pointer-changed", 1, false);
         }
 
         if (lastId !== undefined) 
         {
             ClientEvents.publish("toggleCard", lastId, false);
         }
 
         SetPersistanceVal(level.table, tempId);
		 ClientEvents.publish("set-ignore-enabled", false, false);
		 //ClientEvents.publish("ignore-rows", persistence.UserRights, false);
     });
 }
 
 function LoadChildren(level, id) {
     var tempId = id;
     var compoundQeury = ComposeQuery(level, id, 0);
     Database.readSubQuery("rodent", level.table, compoundQeury, function (packet) {
		 ClientEvents.publish("set-ignore-enabled", false, false);
         var cardChildrenTemplate = Script.getScriptElement("child");
         var icon = Script.getScriptElement(level.Icon);
         cardChildrenTemplate.querySelector("[data-info='childIcon']").append(icon);
         ClientEvents.publish("setChildrenTemplate", cardChildrenTemplate, false);
         ClientEvents.publish("setCustomers", packet, false);
         ClientEvents.publish("change-new-icon", icon, false);
 
 
         if (_publishCommand === undefined) {
             GetVisibleFilter();
             ClientEvents.publish("changeVisibleCounter", activeFilter1, false);
             ClientEvents.publish("view-pointer-changed", activeFilter1, false);
 
         }
         else if (activeFilter1 !== null && activeFilter1 !== undefined) {
             ClientEvents.publish("changeVisibleCounter", activeFilter1, false);
             ClientEvents.publish("view-pointer-changed", activeFilter1, false);
 
         }
         else {
 
             ClientEvents.publish("changeVisibleCounter", 1, false);
             ClientEvents.publish("view-pointer-changed", 1, false);
         }
         if (level.HeaderVal !== undefined) {
             SetPersistanceVal("Companies", tempId);
         }
         else {
             SetPersistanceVal(level.table, tempId);
         }
     });
 }
 
 function SetPersistanceVal(item, data) {
 
     switch (item) {
         case "Companies":
             persistence.CompanyId = data;
 
             break;
         case "Branches":
             persistence.BranchId = data;
 
             break;
         case "Customers":
             persistence.CustomerId = data;
            break;
         case "Sites":
             persistence.SiteId = data;      
             break;
         case "Locations":
            LoadHeatmapData(null);

            ShowReporting();
            persistence.LocationId = data;
 
             break;
     }
 
     _UpdatePersistance(persistence);
     Script.setState("rodent-persistance", persistence);
 }
 
 function ComposeQuery(level, id, isParent) {
 
     var compoundQeury = [
         {
             "TableName": level.table, // Specify the primary table used to construct the join request
             "Join": 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
             "Columns": level.columns,
             "JoinOn": [level.table],
             "JoinTable": "SiteEvents",
             "CompoundTables": // List of tables that you want joined over the reference table (Takes in a List<CompoundTable> etc the current structure for a lever of inheritence.
                 [
                     {
                         "Columns": ["count(*)"],
                         "TableName": "SiteEvents",
                         "CustomName": "Urgent",
                         "JoinTable": "SiteEvents",
                         "Filters": [
                             {
                                 "Column": level.Subquery1.column,
                                 "ParamName": "Parent1",
                                 "Value": level.Subquery1.value,
                                 "IsParentRelated": true
 
                             },
                             {
                                 "Column": "SiteEventPriority",
                                 "ParamName": "AdvisoryType1",
                                 "Value": 1,
                                 "IsParentRelated": false
                             },
                             {
                                 "Column": "SiteEventStatus",
                                 "ParamName": "Status1",
                                 "Value": "1",
                                 "IsParentRelated": false
                             },
                         ]
                     },
                     {
                         "Columns": ["count(*)"],
                         "TableName": "SiteEvents",
                         "CustomName": "Important",
                         "JoinTable": "SiteEvents",
                         "Filters": [
                             {
                                 "Column": level.Subquery1.column,
                                 "ParamName": "Parent2",
                                 "Value": level.Subquery1.value,
                                 "IsParentRelated": true
                             },
                             {
                                 "Column": "SiteEventPriority",
                                 "ParamName": "AdvisoryType2",
                                 "Value": 2,
                                 "IsParentRelated": false
                             },
                             {
                                 "Column": "SiteEventStatus",
                                 "ParamName": "Status2",
                                 "Value": "1",
                                 "IsParentRelated": false
                             },
                         ]
                     },
                     {
                         "Columns": ["count(*)"],
                         "TableName": "SiteEvents",
                         "CustomName": "Minor",
                         "JoinTable": "SiteEvents",
                         "Filters": [
                             {
                                 "Column": level.Subquery1.column,
                                 "ParamName": "Parent3",
                                 "Value": level.Subquery1.value,
                                 "IsParentRelated": true
 
                             },
                             {
                                 "Column": "SiteEventPriority",
                                 "ParamName": "AdvisoryType3",
                                 "Value": 3,
                                 "IsParentRelated": false
                             },
                             {
                                 "Column": "SiteEventStatus",
                                 "ParamName": "Status3",
                                 "Value": "1",
                                 "IsParentRelated": false
                             },
                         ]
                     },
                     {
                         "Columns": ["count(*)"],
                         "TableName": "Devices",
                         "CustomName": "Danger",
                         "JoinTable": "Devices",
                         "Filters": [
                             {
                                 "Column": level.Subquery2.column,
                                 "ParamName": "Parent4",
                                 "Value": level.Subquery2.value,
                                 "IsParentRelated": true
                             },
 
                             {
                                 "Column": "State",
                                 "ParamName": "State1",
                                 "Value": 3,
                                 "IsParentRelated": false
                             },
 
                         ]
                     },
                     {
                         "Columns": ["count(*)"],
                         "TableName": "Devices",
                         "CustomName": "Attention",
                         "JoinTable": "Devices",
                         "Filters": [
                             {
                                 "Column": level.Subquery2.column,
                                 "ParamName": "Parent5",
                                 "Value": level.Subquery2.value,
                                 "IsParentRelated": true
                             },
 
                             {
                                 "Column": "State",
                                 "ParamName": "State2",
                                 "Value": 4,
                                 "IsParentRelated": false
                             },
                         ]
                     },
                     {
                         "Columns": ["count(*)"],
                         "TableName": "Devices",
                         "CustomName": "NoAction",
                         "JoinTable": "Devices",
                         "Filters": [
                             {
                                 "Column": level.Subquery2.column,
                                 "ParamName": "Parent6",
                                 "Value": level.Subquery2.value,
                                 "IsParentRelated": true
                             },
 
                             {
                                 "Column": "State",
                                 "ParamName": "State3",
                                 "Value": 2,
                                 "IsParentRelated": false
                             },
                         ]
                     },
                 ],
             "CustomColumnNames":
                 [
                     {
                         "Index": 1,
                         "BindingName": "CardName"
                     },
                     {
                         "Index": 2,
                         "BindingName": "CardAddress"
                     },
 
                 ],
 
         }];
 
     //We apply filters if we are lower in the hierarchy
     if (id !== undefined) {
         if (isParent == 1) {
             compoundQeury[0]["Filters"] = [{
                 "Column": "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName": "PK", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": id  // Value that you want to pass for comparison (any object)
             }];
         }
         else {
             compoundQeury[0]["Filters"] = [{
                 "Column": "RelativeId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName": "RelativeIdPk", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": id  // Value that you want to pass for comparison (any object)
             }];
         }
     }
     return compoundQeury;
 }
 
 ClientEvents.subscribe("GnericCardPressed", function (data) {
     persistence.LastScreen = "Levels";
 
     _UpdatePersistance(persistence);
     activeFilter = Script.getState("changeVisibleCounterVal");
 
     activeFilter = data;
     parentId = data;
     if(activeLevel === undefined)
     {
        LoadHeatmapData(null);
     }
     else
     {
        LoadChildren(activeLevel.Children, data);
     }
 });
  
 
 ClientEvents.subscribe("publishData", function (data) {
    ClientEvents.publish("clear-table", true, false);
    ClientEvents.publish("receive-data", data.value, false);
    var collection = new SensaCollection(["Id", "date time","device name","location name", "location details","motion count","bait taken","timestamp"], "Id");
  
    for(var item in data.value.TableData.data)
    {
          var itemTpm = data.value.TableData.data[item];
          var obj = {};
           obj["Id"] = itemTpm.Id;
          obj["date time"] = itemTpm["date time"];
          obj["device name"] =  itemTpm["device name"];
          obj["location name"] = itemTpm["location name"];
          obj["location details"] = itemTpm["location details"];
          obj["motion count"] = itemTpm["motion count"];
          obj["bait taken"] = itemTpm["bait taken"];
          obj["timestamp"] = itemTpm["timestamp"];
          collection.add(obj);
  
    }
       
    ClientEvents.publish("receive-table-data", collection, false);
    //ClientEvents.publish("sort-table",  {
    // col:"date time",
    //  asc:false
    //}, false);
	ClientEvents.publish("sort-table", {sortFunction: tableSortingFunction, col: "date time"});
  
    
  
   
   });

	function tableSortingFunction(a,b) {
		// Provide column index manually
		 a = a.children[0].innerHTML.toUpperCase();
		 b = b.children[0].innerHTML.toUpperCase();
		 a = a.split(" ")[0].split("/").reverse().join('') + a.split(" ")[1].split(":");
		 b = b.split(" ")[0].split("/").reverse().join('') + b.split(" ")[1].split(":");
		 return a > b ? 1 : a < b ? -1 : 0;
	}
   
   ClientEvents.subscribe("publishDatacascade", function (data) {
    
    ClientEvents.publish("clear-table", true, false);
   var collection = new SensaCollection(["Id", "date time","device name","location name", "location details","motion count","bait taken","timestamp"], "Id");
  
    for(var item in data.value.TableData.data)
    {
          var itemTpm = data.value.TableData.data[item];
          var obj = {};
           obj["Id"] = itemTpm.Id;
          obj["date time"] = itemTpm["date time"];
          obj["device name"] =  itemTpm["device name"];
          obj["location name"] = itemTpm["location name"];
          obj["location details"] = itemTpm["location details"];
          obj["motion count"] = itemTpm["motion count"];
          obj["bait taken"] = itemTpm["bait taken"];
          obj["timestamp"] = itemTpm["timestamp"];
          collection.add(obj);
  
    }
    ClientEvents.publish("receive-table-data", collection, false);
    ClientEvents.publish("sort-table",  {
      col:"date time",
      asc:false
    }, false);
  
    
  
   
   });
 
 ClientEvents.subscribe("GnericCardChildPressed", function (data) {
 
 
 
     ClientEvents.publish("set-ignore-enabled", false, false);
     Script.setState("SlectedCustomer", data);
     activeFilter = Script.getState("changeVisibleCounterVal");
     persistence.LastScreen = "Levels";
     lastId = data;

    //  if (activeLevel.Next === undefined || activeLevel.Next === "Device Level") {
    //      DeviceLevel = true;
    //  }
     
    if(activeLevel !== undefined)
    {
        activeLevel = levels[activeLevel.Next];
    }
     
    HideReporting();

    if (DeviceLevel === true) {
         persistence.LocationId = data;
             
          ShowReporting();
         _UpdatePersistance(persistence);
         Script.setState("rodent-persistance", persistence);
         LoadHeatmapData(data);
        //
     }
     else {
         if (activeLevel.Next === "Device Level") {
             DeviceLevel = true;
         }
 
         if (activeLevel.Location != undefined && activeLevel.Location === true) {
             activeSiteControl();
         }
         else {
             DeactivateSiteControls();
         }
 
         LoadHeaders(activeLevel.Header, data);
         GetParentName(parentId, activeLevel);
 
     }
 
 });
 
 ClientEvents.subscribe("ChildMaitnancePressed", function (data) {
 
     Script.setState("rodent-maitnanceId", data);
 
     switch (activeLevel.Children.table) {
         case "Branches":
             fw.func("JUMPSCREEN", "Branch Form", false);
             break;
         case "Customers":
             fw.func("JUMPSCREEN", "Customer Form", false);
             break;
         case "Sites":
             fw.func("JUMPSCREEN", "Site Form", false);
             break;
         case "Locations":
             fw.func("JUMPSCREEN", "Location Form", false);
             break;
     }
 
 
 });
 ClientEvents.subscribe("SortBySelected", function (data) {
     switch (data.value) {
         case "Status":
             ClientEvents.publish("SortBy", "sstatus", false);
             break;
         case "Advisories":
             ClientEvents.publish("SortBy", "sstatus", false);
             break;
     }
 });
 
 ClientEvents.subscribe("FilterBySelected", function (data) {
 
 });
 
 function GetVisibleFilter() {
 
     if (_publishCommand === undefined) {
         return;
     }
 
     activeFilter1 = Script.getState("changeVisibleCounterVal");
     if (activeFilter1 === null) {
         Script.setState("changeVisibleCounterVal", 1);
         activeFilter1 = 1;
     }
 
     if (activeFilter === 1) {
         var command =
         {
             "Action": "SetActiveDeactivate",
             "Compoent": "Statuses",
             "Value": "dot|dot active",
             "Id": "Statuses|Active3|Active1",
         };
         _publishCommand(command, "SetTopAction");
     }
     else {
         var cmd =
         {
             "Action": "SetActiveDeactivate",
             "Compoent": "Statuses",
             "Value": "dot|dot active",
             "Id": "Statuses|Active1|Active3",
         };
         _publishCommand(cmd, "SetTopAction");
     }
 }
 
 function LoadRodentGrid(id) {
    var compoundQeury = [
    {
        "TableName": "Locations", // Specify the primary table used to construct the join request
        "Join": 3, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
        "Columns":
        [
            "Id",
            "Name",
            "Description"
        ],
        "Filters":
        [
            {
                "Column": "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                "ParamName": "Id", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                "Value": id // Value that you want to pass for comparison (any object)
            }
        ]// Specify the list of columns to take from the reference table.
    }];
     Database.readCompound("rodent", "Locations", compoundQeury, function (packet) {
 
         var ids = [];
         for (var item in packet.value.data) {
             var id = packet.value.data[item][0];
             locationName = packet.value.data[item][1];
             description = packet.value.data[item][2];
             ids.push(id);
        }
	      //Important to get the selected status
          GetVisibleFilter();
        

        Script.setState("selectedSites", ids);
        if (activeFilter === 2) {
            fw.func("JUMPSCREEN", "Recommendation List", false);
        }
        else {
            fw.func("JUMPSCREEN", "Device Level", false);
        }
         
     });

 }

 function LoadHeatmapData(id)
 {
     
        var paramsData;
        var query 
        if(id === null)
        {
            query = "Select D.Id, D.DeviceNumber, L.Name, L.Description From Devices as D join Locations as L on D.LocationId = L.Id where D.SiteId = $SiteId";
            paramsData =[{
                Column: "$SiteId",
                value: persistence.SiteId
            }]
        }
        else
        {
            paramsData =[{
                Column: "$SiteId",
                value: persistence.SiteId
            },
            {
                Column: "$LocationId",
                value: persistence.LocationId
            }]
            query = "Select D.Id, D.DeviceNumber, L.Name, L.Description From Devices as D join Locations as L on D.LocationId = L.Id where D.SiteId = $SiteId and D.LocationId = $LocationId";

        }
        var sqlParam = [{
            Sql: query,
            Data: paramsData
        }];
        Database.ReadRecordsParam("rodent", "Locations", sqlParam, function (currentPacket) {
              
            var devices = [];
            for (var item in currentPacket.value.data) {
                var device = currentPacket.value.data[item][1];
                var locationName = currentPacket.value.data[item][2];
                var description = currentPacket.value.data[item][3];
                devices.push({
                    Device: device,
                    LocationName: locationName,
                    Description: description
                });
           }

            var startDate = new Date(new Date().getFullYear(), 0, 1);
            var result = {

                startDate: startDate,
                endDate: new Date(),
                locationName:locationName,
                description: description,
                data:devices
            }
			
			ClientEvents.publish("clear-table", true, false);
            ClientEvents.publish("subscribe-data", result, false);

            
        });
 }


ClientEvents.subscribe("DeviceLevelActivated", function (data) {
    if(DeviceLevel)
    {
        DeviceLevel = false;
        persistence.LocationId = data;
        _UpdatePersistance(persistence);
        LoadRodentGrid(data);
    }
 });


 
 function GetUserAccess(userLevel) {
     var result;
     switch (userLevel) {
         case 1:
             result = { name: "Companies", id: undefined };
             var command =
             {
                 "Action": "setVal",
                 "Compoent": "RightPanel",
                 "Value": "",
                 "Id": "PageName",
             };
             _publishCommand(command, "SetTopAction");
             break;
         case 2:
             result = { name: "Branches", id: persistence.BranchId };
             parentId = persistence.CompanyId;
             break;
         case 3:
             result = { name: "Customers", id: persistence.CustomerId };
             parentId = persistence.BranchId;
             break;
         case 4:
             ShowReporting();
             result = { name: "Sites", id: persistence.SiteId };
             parentId = persistence.CustomerId;
             break;
     }
     lastId = result.id;
     return result;
 }
 
 
 ClientEvents.subscribe("GenericActionMessage", function (data) {
 
     if (data === "GoBack|null") {
        ClientEvents.publish("clear-table", true, false);
        ClientEvents.publish("clearheatmap", true, false);
        
         DeviceLevel = false;
         DeactivateSiteControls();
         var id;
         if(activeLevel === undefined)
         {
            ReturnToCustomers();

            return;
         }
		 
         switch (activeLevel.Prev) {
             case "Companies":
                 backHidden = true;
                 HideBackButton();
                 var command =
                 {
                     "Action": "setVal",
                     "Compoent": "RightPanel",
                     "Value": "",
                     "Id": "PageName",
                 };
                 _publishCommand(command, "SetTopAction");
                 //id = persistence.CompanyId;
                 break;
             case "Branches":
                 id = persistence.BranchId;
                 parentId = persistence.CompanyId;
                HideReporting();
                 break;
             case "Customers":
                 id = persistence.CustomerId;
                 parentId = persistence.BranchId;
                 HideReporting();
                 break;
             case "Sites":
                 id = persistence.LocationId;
                 parentId = persistence.SiteId;
                ShowReporting();
                 break;
            default:
                ReturnToCustomers();
                return;
         }
         lastId = id;
         activeLevel = levels[activeLevel.Prev];
         if (parseInt(persistence.LevelAccess) < activeLevel.LevelIndex) {
             ShowBackButton();
         }
         else {
             HideBackButton();
         }
         LoadHeaders(activeLevel.Header, id);
         GetParentName(parentId, activeLevel);
     }
     else {
         _handleGeneric(data);
     }
 });

ClientEvents.subscribe("HandleGenericMessage", function (data) {
     let dataType = data.split("|")[0];
     switch (dataType) {
         case "SearchFor":
            ClientEvents.publish("filterCards", data.split("|")[1], false);
            break;
		 case "AdjustSize":
			 ClientEvents.publish("setPosition", data.split("|")[1], false);
            break;
     }
 });
 
 ClientEvents.subscribe("EditCard", function (data) {
  
     ClientEvents.publish("EnableEdit", data.value, false);
 
 });
 
function ReturnToCustomers()
{
    lastId = persistence.CustomerId;
    parentId = persistence.BranchId;
    HideReporting();
  
    activeLevel = levels["Customers"];
    LoadHeaders({
        "table": "Customers",
        "columns": [
            "Id",
            "Name",
            "Address"
        ],
        "Subquery1": {
            "column": "CustomerId",
            "value": "Customers.Id"
        },
        "Subquery2": {
            "column": "Devices.CustomerId",
            "value": "Customers.Id"
        },
        "Icon": "CustomersIcon"
    }, lastId);
    GetParentName(parentId, activeLevel);
}

 function GetParentName(id, level) {
     var compoundQeury = [
         {
             "TableName": level.Next, // Specify the primary table used to construct the join request
             "Join": 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
             "Columns":
                 [
                     "Name"
                 ],
             "Filters":
                 [
                     {
                         "Column": "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                         "ParamName": "Id", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                         "Value": id // Value that you want to pass for comparison (any object)
                     }
                 ]// Specify the list of columns to take from the reference table.
         }];
     Database.readCompound("rodent", level.Next, compoundQeury, function (packet) {
         
         var current;
         for (var val in packet.value.data) {
             current = packet.value.data[val];
         }
         var command =
         {
             "Action": "setVal",
             "Compoent": "RightPanel",
             "Value": current[0],
             "Id": "PageName",
         };
         _publishCommand(command, "SetTopAction");
     });
 }
 
 //Menu Related options
 function HideAll() {
     var command =
     {
         "Action": "Hide",
         "Compoent": "RightPanel",
         "Value": true
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "Hide",
         "Compoent": "LeftPanel",
         "Value": true
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "setVisible",
         "Compoent": "siteVisits",
         "Value": "none",
     };
     _publishCommand(command, "SetTopAction");
 
     command =
     {
         "Action": "setVal",
         "Compoent": "RightPanel",
         "Value": " ",
         "Id": "PageName",
     };
     _publishCommand(command, "SetTopAction");
     command =
     {
         "Action": "setVisible",
         "Compoent": "siteVisits",
         "Value": "none",
     };
     _publishCommand(command, "SetTopAction");
     command =
     {
         "Action": "Change Generic Action",
         "Compoent": "status",
         "Value": "Status",
     };
     _publishCommand(command, "SetTopAction");
     command =
     {
         "Action": "Change Generic Action",
         "Compoent": "Advisories",
         "Value": "Advisory",
     };
     _publishCommand(command, "SetTopAction");
     command =
     {
         "Action": "HideIndex"
     };
     _publishCommand(command, "activateGeneric");
 
     command =
     {
         "Action": "setVisible",
         "Compoent": "OpenBtn",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "setVisible",
         "Compoent": "CloseBtn",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "setVisible",
         "Compoent": "OpenNavigation",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "setVisible",
         "Compoent": "BackButton",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "setVisible",
         "Compoent": "AddAdvisory",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "setVisible",
         "Compoent": "AddReport",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
 
 }
 
 function ShowBackButton() {
     var command =
     {
         "Action": "setVisible",
         "Compoent": "BackButton",
         "Value": "",
     };
     _publishCommand(command, "activateGeneric");
 }
 
 function ShowAdvisory() {
     var command =
     {
         "Action": "setVisible",
         "Compoent": "AddAdvisory",
         "Value": "",
     };
     _publishCommand(command, "activateGeneric");
 }
 
 function ShowOpenBtn() {
 
     var command =
     {
         "Action": "setVisible",
         "Compoent": "OpenBtn",
         "Value": "",
     };
     _publishCommand(command, "activateGeneric");
 }
 
 function ShowMenuBtn() {
     var command =
     {
         "Action": "setVisible",
         "Compoent": "OpenNavigation",
         "Value": "",
     };
     _publishCommand(command, "activateGeneric");
 }
 function ShowSiteReports() {
     var command =
     {
         "Action": "setVisible",
         "Compoent": "AddReport",
         "Value": "",
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "setVisible",
         "Compoent": "siteVisits",
         "Value": "",
     };
     _publishCommand(command, "SetTopAction");
 
 }
 
 function HideOpenBtn() {
 
     var command =
     {
         "Action": "setVisible",
         "Compoent": "OpenBtn",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
 }
 
 function HideMenuBtn() {
     var command =
     {
         "Action": "setVisible",
         "Compoent": "OpenNavigation",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
 }
 
 function HideSiteReports() {
     var command =
     {
         "Action": "setVisible",
         "Compoent": "AddReport",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
     command =
     {
         "Action": "setVisible",
         "Compoent": "siteVisits",
         "Value": "none",
     };
     _publishCommand(command, "SetTopAction");
 
 }
 function HideBackButton() {
     var command =
     {
         "Action": "setVisible",
         "Compoent": "BackButton",
         "Value": "None",
     };
     _publishCommand(command, "activateGeneric");
 }
 
 function activeSiteControl() {
     ShowOpenBtn();
     ShowMenuBtn();
     ShowSiteReports();
 }
 function DeactivateSiteControls() {
     HideOpenBtn();
     HideMenuBtn();
     HideSiteReports();
 }

  Date.prototype.addDays = function (days) {
            var date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        };

// Hides the two cascading heatmap calendars and data table
function HideReporting()
{
    fw.func("HIDEWIDGET","mainMap");
    fw.func("HIDEWIDGET","cascadeMap");
    fw.func("HIDEWIDGET","datatable");
}

// Shows the two cascading heatmap calendars and data table
function ShowReporting()
{
    fw.func("SHOWWIDGET","mainMap");
    fw.func("SHOWWIDGET","cascadeMap");
    fw.func("SHOWWIDGET","datatable");
}