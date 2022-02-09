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

 var Caller;
 var _initializer;
 var _handleGeneric;
 var _publishCommand;
 var _gotoPage;
 var _UpdatePersistance;
 var selectedLevel;
 var persistence;
 Script.on('load', function(){
     
     persistence = 	Script.getState("rodent-persistance");
     //persistence.LastScreen = "Device Level";
     Script.setState("Caller", persistence.LastScreen);
     selectedLevel = Script.getState("getSite");
   
     try{
         _initializer = Script.getState("Initializer");
         _handleGeneric = Script.getState("HandleGeneric");
         _publishCommand = Script.getState("PublishCommand");
         _gotoPage = Script.getState("GotoPage");
         _UpdatePersistance = Script.getState("UpdatePersistance");
     }
     catch(e)
     {
          setTimeout(function(){ 	
              fw.func("JUMPSCREEN", "Initialisation");
          }, 3000);	
     }
      var seleceted = Script.getState("SelectedName");
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
          "Action": "setVisible",
          "Compoent": "AddReport",
          "Value": "none",
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
         "Action":"setVal",
         "Compoent":"RightPanel",
         "Value": seleceted,
         "Id": "PageName",
     };
     _publishCommand(command, "SetTopAction");	
      command = 
     {
         "Action":"SetActiveDeactivate",
         "Compoent":"RightPanel",
         "Value": "dot|dot active",
         "Id": "Statuses|Active1|Active3",
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
         "Action":"HideIndex"
     };
     _publishCommand(command, "activateGeneric");
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
         "Compoent":"MaintnanceModeRow",
         "Value": "none",
      };
     _publishCommand(command, "SetTopAction");	
      var col = new SensaCollection(["id","setTime", "TimeLeft", "Reason", "Technician" ], "id");
     
      
      
     var compoundQeury = [
     {
         "TableName" : "Locations", // Specify the primary table used to construct the join request
         "Join" :2, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "Id",
             "Name", 
             "Description"
         ], // Specify the list of columns to take from the reference table.
         "JoinOn": ["Locations"],
         "JoinTable":"SiteEvents",
         "CompoundTables" : // List of tables that you want joined over the reference table (Takes in a List<CompoundTable> etc the current structure for a lever of inheritence.
         [
             {
                 "Columns": ["count(*)"],
                 "TableName": "SiteEvents",
                 "CustomName": "Urgent",
                 "JoinTable":"SiteEvents",
                 "Filters":[
                     {
                         "Column" : "SiteEvents.LocationId", 
                         "ParamName" : "Parent1",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                     {
                         "Column" : "SiteEventPriority", 
                         "ParamName" : "AdvisoryType1",  
                         "Value": 1,
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "SiteEventStatus", 
                         "ParamName" : "Status1",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "SiteEventType", 
                         "ParamName" : "Type1",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "SiteEvents",
                 "CustomName": "Important",
                 "JoinTable":"SiteEvents",
                 "Filters":[
                     {
                         "Column" : "SiteEvents.LocationId", 
                         "ParamName" : "",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                     {
                         "Column" : "SiteEventPriority", 
                         "ParamName" : "AdvisoryType2",  
                         "Value": 2,
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "SiteEventStatus", 
                         "ParamName" : "Status2",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "SiteEventType", 
                         "ParamName" : "Type2",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "SiteEvents",
                 "CustomName": "Minor",
                 "JoinTable":"SiteEvents",
                 "Filters":[
                     {
                         "Column" : "SiteEvents.LocationId", 
                         "ParamName" : "Parent3",  
                         "Value": "Locations.Id",
                         "IsParentRelated": true
                     },
                     {
                         "Column" : "SiteEventPriority", 
                         "ParamName" : "AdvisoryType3",  
                         "Value": 3,
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "SiteEventStatus", 
                         "ParamName" : "Status3",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                     {
                         "Column" : "SiteEventType", 
                         "ParamName" : "Type3",  
                         "Value": "1",
                         "IsParentRelated": false
                     },
                 ]
             },
             
         ],  
         "Filters" : // Filter options in case they are needed.
         [
             {
                 "Column" : "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "SiteId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": persistence.LocationId // Value that you want to pass for comparison (any object) THIS SHOULD BE SiteId but that breaks it......
             }	
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
              
         ]
     }];

     if (persistence.LastScreen === "Site Report List") {
         compoundQeury[0].Filters.ParamName = "LocationId";
         compoundQeury[0].Filters.Value = persistence.SiteId;
     }

     debugger;
     
     
    Database.readSubQuery("rodent","Locations",compoundQeury, function(data)					 
     {
         persistence.LastScreen = "Recommendation List";
         debugger;
         _UpdatePersistance(persistence);
         var cardTemplate =  Script.getScriptElement("ReportsTemplate");
         console.log(JSON.stringify(data));
         ClientEvents.publish("SetHeaderTemplate", cardTemplate,false);	
         ClientEvents.publish("SetReports", data,false);	
         ClientEvents.publish("toggleCard", persistence.LocationId, false);
  
     });


    // Database.readRecords("rodent", "Locations", function (eventData) {
    //     persistence.LastScreen = "Recommendation List";
    //     debugger;
    //     _UpdatePersistance(persistence);
    //     var cardTemplate =  Script.getScriptElement("ReportsTemplate");
    //     eventData.value.filter(["Id", "Name", "Description", ""])
    //     ClientEvents.publish("SetHeaderTemplate", cardTemplate,false);	
    //     ClientEvents.publish("SetReports", eventData,false);	
    //     ClientEvents.publish("toggleCard", persistence.LocationId, false);
    // }, {filter: `RelativeId='${persistence.SiteId}'`})
    //  Database.readRecords("rodent", "SiteEvents", function (eventData) {
    //     console.log("ass");
    //     persistence.LastScreen = "Recommendation List";
    //      debugger;
    //      _UpdatePersistance(persistence);
    //      var cardTemplate =  Script.getScriptElement("ReportsTemplate");
    //      console.log(JSON.stringify(eventData));
    //      ClientEvents.publish("SetHeaderTemplate", cardTemplate,false);	
    //      ClientEvents.publish("SetReports", eventData,false);	
    //      ClientEvents.publish("toggleCard", persistence.LocationId, false);
    //  }, {filter: `SiteId='${persistence.SiteId}'`});

      if(selectedLevel !== undefined)
     {		 
         GetParentName(persistence.LocationId);
      }
 });
 
  
 
 ClientEvents.subscribe("GenericActionMessage", function(data) 
 {  
      Script.setState("rodent-persistance",persistence);
     _handleGeneric(data);
 });
 
 ClientEvents.subscribe("GnericCardChildPressed", function(data) 
 { 
     Script.setState("AdvisorySelected",data);
     fw.func("JUMPSCREEN", "Recommendation Form");
 });
  
 ClientEvents.subscribe("BackToTraps", function(data) {
      fw.func("JUMPSCREEN", persistence.LastScreen);//"Device Level");
 });
 ClientEvents.subscribe("GnericCardPressed", function(data) {
       
     var selectAdvisories = [
     {
         "TableName" : "SiteEvents", // Specify the primary table used to construct the join request
         "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "Id",
             "Context",
             "location",
             "reason",
             "title",
             "SiteEventPriority",
             "assigned",
             "SiteEventStatus",
             "SiteEventType"
         ], // Specify the list of columns to take from the reference table.
         "Filters" : // Filter options in case they are needed.
         [
             {
                 "Column" : "LocationId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "SiteId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": data // Value that you want to pass for comparison (any object)
             }	
         ]
     }];
     Database.readCompound("rodent","SiteEvents",selectAdvisories, function(currentData)					 
     {
         var cardTemplate =  Script.getScriptElement("ReportAdvisories");
         ClientEvents.publish("SetValueTemplate", cardTemplate,false);	
         ClientEvents.publish("SetChildren", currentData,false);	
         ClientEvents.publish("sort-advisories", "advisoriessort",false);	
 
      });
 });
 
 
  
 
 
 function GetParentName(id)

 {
     var compoundQeury = [
     {
         "TableName" : "Sites", // Specify the primary table used to construct the join request
         "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "SiteName"
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
     Database.readCompound("rodent","Sites",compoundQeury, function(packet)					 
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