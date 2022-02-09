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
 var persistence;
 var _UpdatePersistance;
 Script.on('load', function() {
     
     persistence = 	Script.getState("rodent-persistance");
     Script.setState("Caller", "Levels");
     Script.setState("ReturningFromDevices",true,false);
     
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
         "Id": "Statuses|Active1|Active2",
     };
     _publishCommand(command, "SetTopAction");
     
     command = 
     {
         "Action":"Change Generic Action",
         "Compoent":"status",
         "Value": "Reports Status",
     };
     _publishCommand(command, "SetTopAction");	
     command = 
     {
         "Action":"HideIndex"
     };
     _publishCommand(command, "activateGeneric");
   //  command = 
  //   {
   //      "Action":"setVisible",
 //        "Compoent":"Advisories",
  //       "Value": "none",
  //   };
    // _publishCommand(command, "SetTopAction");	
     command = 
     {
         "Action":"setVisible",
         "Compoent":"AddReport",
         "Value": "",
     };
     _publishCommand(command, "activateGeneric");
      command = 
     {
         "Action":"setVisible",
         "Compoent":"AddAdvisory",
         "Value": "none",
     };
     _publishCommand(command, "activateGeneric");
     command = 
     {
         "Action":"setVisible",
         "Compoent":"MaintnanceModeRow",
         "Value": "none",
      };
     _publishCommand(command, "SetTopAction");	
     var selectedSite =persistence.SiteId;
     if(selectedSite === null)
     {
         selectedSite = 1;
     }
     
     if(selectedSite !== undefined)
     {		 
         GetParentName(persistence.CustomerId);
     }
     
     var compoundQeury = [
     {
         "TableName" : "Sites", // Specify the primary table used to construct the join request
         "Join" :2, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
         "Id",
         "Name", 
         "Address"
         ], // Specify the list of columns to take from the reference table.
         "JoinOn": ["Sites"],
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
                         "Column" : "SiteEvents.SiteId", 
                         "ParamName" : "Parent1",  
                         "Value": "Sites.Id",
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
                         "Column" : "ReportId", 
                         "ParamName" : "ReportId1",  
                         "Value": null,
                         "IsParentRelated": false,
                         "IsNull": false,
 
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
                         "Column" : "SiteEvents.SiteId", 
                         "ParamName" : "",  
                         "Value": "Sites.Id",
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
                         "Column" : "ReportId", 
                         "ParamName" : "ReportId2",  
                         "Value": null,
                         "IsParentRelated": false,
                         "IsNull": false,
 
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
                         "Column" : "SiteEvents.SiteId", 
                         "ParamName" : "Parent3",  
                         "Value": "Sites.Id",
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
                         "Column" : "ReportId", 
                         "ParamName" : "ReportId3",  
                         "Value": null,
                         "IsParentRelated": false,
                         "IsNull": false,
 
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
         "Filters" :
         [
             {
                 "Column" : "Id", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "SiteIdPk", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": persistence.SiteId // Value that you want to pass for comparison (any object)
             }
         ] // Filter options in case they are needed.
     }];
     
     Database.readSubQuery("rodent","Areas",compoundQeury, function(packet)					 
     {	
         
         persistence.LastScreen = "Site Report List";
         _UpdatePersistance(persistence);
         ClientEvents.publish("clearLanding",  "",false);
         
         var cardTemplate =  Script.getScriptElement("ReportsHeader");
         ClientEvents.publish("setHeaderTemplate", cardTemplate, false);	
         ClientEvents.publish("SetSource", packet, false);	
         ClientEvents.publish("toggleCard", selectedSite, false);
         //ClientEvents.publish("view-pointer-changed",2,false);
     }); 
     
 
 });
 
 ClientEvents.subscribe("GnericCardPressed", function(data) 
 { 
     LoadAreaSites(data);
 });
 
 ClientEvents.subscribe("GnericCardChildPressed", function(data) 
 { 
     
     Script.setState("SelectedReportPk",data);
 
     Script.setState("GetReportId",data);
     fw.func("JUMPSCREEN", "Site Report Form");
 });
 
 
 function LoadAreaSites(areaId)
 {
     var compoundQeury = [
     {
         "TableName" : "Reports", // Specify the primary table used to construct the join request
         "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "Id",
             "SetDate",
             "VisitReason", 
             
         ], // Specify the list of columns to take from the reference table.
         "JoinOn": ["Reports"],
         "JoinTable":"SiteEvents",
         "CompoundTables" : // List of tables that you want joined over the reference table (Takes in a List<CompoundTable> etc the current structure for a lever of inheritence.
         [
             {
                 "Columns": ["Name"],
                 "TableName": "Employees",
                 "CustomName": "CardAddress",
                 "JoinTable":"Reports",
                 "Filters":[
                     {
                         "Column" : "Id", 
                         "ParamName" : "Parent1",  
                         "Value": "Reports.TechnicianId",
                         "IsParentRelated": true
                     },
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "SiteEvents",
                 "CustomName": "Urgent",
                 "JoinTable":"SiteEvents",
                 "Filters":[
                     {
                         "Column" : "ReportId", 
                         "ParamName" : "Parent1",  
                         "Value": "Reports.Id",
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
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "SiteEvents",
                 "CustomName": "Important",
                 "JoinTable":"SiteEvents",
                 "Filters":[
                     {
                         "Column" : "ReportId", 
                         "ParamName" : "Parent1",  
                         "Value": "Reports.Id",
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
                 ]
             },
             {
                 "Columns": ["count(*)"],
                 "TableName": "SiteEvents",
                 "CustomName": "Minor",
                 "JoinTable":"SiteEvents",
                 "Filters":[
                     {
                         "Column" : "ReportId", 
                         "ParamName" : "Parent1",  
                         "Value": "Reports.Id",
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
                 ]
             },
             
         ],  
         "CustomColumnNames":
         [
             {
                 "Index":2,
                 "BindingName": "CardName"
             }
         ],
         "Filters" :
         [
             {
                 "Column" : "SiteId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "SiteIdPk", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value": areaId  // Value that you want to pass for comparison (any object)
             }
         ] // Filter options in case they are needed.
     }];
     
     Database.readSubQuery("rodent","Reports",compoundQeury, function(packet)					 
     {	
         
         var cardChildrenTemplate = Script.getScriptElement("ReportsChildren");
         ClientEvents.publish("setChildrenTemplate", cardChildrenTemplate,false);	
         ClientEvents.publish("setAreas", packet,false);	
     }); 	
 }
 
 ClientEvents.subscribe("GenericActionMessage", function(data) 
 { 
     _handleGeneric(data);
 });
 
 function GetParentName(id)
 {
      
     var compoundQeury = [
     {
         "TableName" : "Sites", // Specify the primary table used to construct the join request
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
                 "Value": persistence.SiteId // Value that you want to pass for comparison (any object)
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