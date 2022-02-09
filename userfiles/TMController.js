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
 var Caller = "Caller";
 var menuLeft = false;
 var menuRight = false;
 var ds1;
 var ds2;
 
 
 var _initializer = function Load(template, channel)
 {
     ClientEvents.publish(channel, template);
         
 };
 
 
 var _handleGeneric = function HandleGeneric(data)
 {
      var command;
      var split = data.split('|');
      switch(split[0])
      {
          case "GoBack":
              Caller = Script.getState("Caller");
              if(Caller !== "null")
              {
                 fw.func("JUMPSCREEN", Caller);
              }
              break;
          case "GoTo":
              _gotoPage(split);
              break;
          case "AddMenu":
             command = 
             {
                 "Action":"setVisible",
                 "Compoent":split[2],
                 "Value":"none"
              };
              _publishCommand(command,split[3]);
              command = 
             {
                 "Action":"setVisible",
                 "Compoent":split[1],
                 "Value":""
               };
              _publishCommand(command,split[3]);
              OpenPopupMenu(split[4]);
              break;
          case "ClosePanel":
              
  
              command = 
             {
                 "Action":"setVisible",
                 "Compoent":split[2],
                 "Value":"none"
               };
             _publishCommand(command,split[3]);
             command = 
             {
                 "Action":"display",
                 "Compoent":split[1],
               };
             _publishCommand(command,split[3]);
             
              ClosePopupMenu(split[4]);
              break;
          case "SetAction":
              command = 
             {
                 "Action":split[1],
                 "Compoent":split[2],
                 "Value": split[3]
              };
              _publishCommand(command,split[4]);
              break;
          case "PublishCommand":
             command = 
             {
                 "Action":split[1],
                 "Compoent":split[2],
                 "Value": split[3]
             };
             _publishCommand(command,split[4]);
             break;
          case "ShowFilterComponents":
             command = 
             {
                 "Action":"setVisible",
                 "Compoent":"HideFilters",
                 "Value":""
               };
             _publishCommand(command,"SetTopAction");
             command = 
             {
                 "Action":"setVisible",
                 "Compoent":"ShowFilters",
                 "Value":"none"
             };
              _publishCommand(command,"SetTopAction");
               fw.func("SETPROPERTY", split[1], "z-index", "120");
              fw.func("SETPROPERTY", split[1], "display", "");
              
              fw.func("SETPROPERTY", split[2], "z-index", "130");
              fw.func("SETPROPERTY", split[2], "display", "");
              
              fw.func("SETPROPERTY", split[3], "z-index", "130");
              fw.func("SETPROPERTY", split[3], "display", "");
              break;
           case "HideFilterComponents":
               command = 
             {
                 "Action":"setVisible",
                 "Compoent":"HideFilters",
                 "Value":"none"
               };
             _publishCommand(command,"SetTopAction");
             command = 
             {
                 "Action":"setVisible",
                 "Compoent":"ShowFilters",
                 "Value":""
             };
             _publishCommand(command,"SetTopAction");
               fw.func("SETPROPERTY", split[1], "z-index", "-1");
              fw.func("SETPROPERTY", split[1], "display", "none");
 
              fw.func("SETPROPERTY", split[2], "z-index", "-1");
              fw.func("SETPROPERTY", split[2], "display", "none");
              
              fw.func("SETPROPERTY", split[3], "z-index", "-1");
              fw.func("SETPROPERTY", split[3], "display", "none");
              break;
      }
 };
 
 var _publishCommand = function PublishCommand(command, channel)
 {	  
     ClientEvents.publish(channel, command, false);	 	
 };
 
 var _gotoPage = function GotoPage(page)
 {
     if(page[2] !== undefined)
     {
         Script.setState(page[2],page[3]);
     }
      Script.setState("SelectedName",page[0]);
     fw.func("JUMPSCREEN", page[1]);
 };
 
 var _UpdatePersistance = function UpdatePersistance(persistance)
 {
     var id = fw.func("GETUSER");
     var packet = {};
 
     packet = 
     [
         {
             "TableName":"PlatformPersistence",
             "OnConflict":
             [
                 {
                     "Column":"User",
                     "ParamName":"conf1",
                     "Value":id
                 },
                 {
                     "Column":"SessionId",
                     "ParamName":"conf2",
                     "Value":persistance.SessionId
                 },
                 {
                     "Column":"LocationId",
                     "ParamName":"LocationId1",
                     "value":persistance.LocationId === undefined ? "" : persistance.LocationId 
                 },
                 {
                     "Column":"CompanyId",
                     "ParamName":"CompanyId1",
                     "value":persistance.CompanyId === undefined ? "" : persistance.CompanyId
                 },
                 {
                     "Column":"CustomerId",
                     "ParamName":"CustomerId1",
                     "value":persistance.CustomerId === undefined ? "" : persistance.CustomerId
                 },
                 {
                     "Column":"SiteId",
                     "ParamName":"SiteId1",
                     "value":persistance.SiteId === undefined ? "" : persistance.SiteId
                 },
                 {
                     "Column":"LastScreen",
                     "ParamName":"LastScreen1",
                     "value":persistance.LastScreen === undefined ? "" : persistance.LastScreen
                 },
                 {
                     "Column":"ReportId",
                     "ParamName":"ReportId1",
                     "value": persistance.ReportId === undefined ? "" : persistance.ReportId
                 },
                 {
                     "Column":"AdvisoryId",
                     "ParamName":"AdvisoryId1",
                     "value": persistance.AdvisoryId === undefined ? "" : persistance.AdvisoryId
                 },
                 {
                     "Column":"FormData",
                     "ParamName":"FormData1",
                     "value": persistance.FormData === undefined ? "" : persistance.FormData 
                 },
                 {
                    "Column":"BranchId",
                    "ParamName":"BranchId1",
                    "value": persistance.BranchId === undefined ? "" : persistance.BranchId 
                 }
             ],
             "data":
             [
                 {
                     "Column":"User",
                     "ParamName":"option1",
                     "value":id
                 },
                 {
                     "Column":"SessionId",
                     "ParamName":"val1",
                     "value":persistance.SessionId === undefined ? "" : persistance.SessionId
                 },
                 {
                     "Column":"LocationId",
                     "ParamName":"LocationId",
                     "value":persistance.LocationId === undefined ? "" : persistance.LocationId 
                 },
                 {
                     "Column":"CompanyId",
                     "ParamName":"CompanyId",
                     "value":persistance.CompanyId === undefined ? "" : persistance.CompanyId
                 },
                 {
                     "Column":"CustomerId",
                     "ParamName":"CustomerId",
                     "value":persistance.CustomerId === undefined ? "" : persistance.CustomerId
                 },
                 {
                     "Column":"SiteId",
                     "ParamName":"SiteId",
                     "value":persistance.SiteId === undefined ? "" : persistance.SiteId
                 },
                 {
                     "Column":"LastScreen",
                     "ParamName":"LastScreen",
                     "value":persistance.LastScreen === undefined ? "" : persistance.LastScreen
                 },
                 {
                     "Column":"ReportId",
                     "ParamName":"ReportId",
                     "value": persistance.ReportId === undefined ? "" : persistance.ReportId
                 },
                 {
                     "Column":"AdvisoryId",
                     "ParamName":"AdvisoryId",
                     "value": persistance.AdvisoryId === undefined ? "" : persistance.AdvisoryId
                 },
                 {
                     "Column":"FormData",
                     "ParamName":"FormData",
                     "value": persistance.FormData === undefined ? "" : persistance.FormData 
                 },
                 {
                    "Column":"BranchId",
                    "ParamName":"BranchId",
                    "value": persistance.BranchId === undefined ? "" : persistance.BranchId 
                 }
                  
             ],
             "Filters":
             [
                 {
                     "Column":"User",
                     "ParamName":"option1",
                     "value":id
                 },
                 {
                     "Column":"SessionId",
                     "ParamName":"val1",
                     "value":persistance.SessionId
                 }
             ]
         }
     ];
 
     Database.saveComposite(
         "Rodent",
         "PlatformPersistence",
         packet,
         function (dbResponse) {
             Script.setState("rodent-persistance",persistance);
         }
     );
 };
 
 function OpenPopupMenu(menu)
 {
     if(menu === "LeftPanel")
     {
         menuLeft = true;
     }
     else
     {
         menuRight = true;
     }
         
     var command = 
     {
         "Action":"display",
         "Compoent":menu,
         "Value": true
     };
     ClientEvents.publish("activateGeneric", command, false);	
 }
 
 function ClosePopupMenu(menu)
 {
     if(menu === "LeftPanel")
     {
         menuLeft = false;
     }
     else
     {
         menuRight = false;
     }
     
      var command = 
     {
         "Action":"Hide",
         "Compoent":menu,
         "Value": true
     };
     _publishCommand(command, "activateGeneric");	
     
     if(menuLeft === false && menuRight === false)
     {
         command = 
         {
             "Action":"HideIndex"
         };
         _publishCommand(command, "activateGeneric");	
     
     }
 }
 
 Script.on('load', function() 
 {
	 LoadPersistence();
      
 });

 Script.on('init', function() 
 {
	 var user = fw.func("GETUSER");
	 if(user !== "admin")
	 {
		fw.func("HIDEWIDGET","minButtonTag");
		fw.func("HIDEWIDGET","touchButton");
		fw.func("HIDEWIDGET","minButton");
		fw.func("HIDEWIDGET","sidebar");
		fw.func("TOGGLESIDEBAR",true);

		 
 	 }
	 


    ClientEvents.publish("set-welcome", fw.func("GETUSER"));
 });
 
 ClientEvents.subscribe("GenericActionMessage", function(data) 
 { 
       _handleGeneric(data);
 });
 
 function LoadPersistence()
 {
      
     var user = JSON.parse(sessionStorage.getItem("user"));
     
     var compoundQeury = [
     {
         "TableName" : "PlatformPersistence", // Specify the primary table used to construct the join request
         "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
         "Columns" :
         [
             "User",
             "SessionId",
             "LocationId",
             "CompanyId",
             "CustomerId",
             "SiteId",
             "LastScreen",
             "ReportId",
             "AdvisoryId",
             "FormData",
             "LevelAccess",
             "BranchId",
			 "IsAdmin"
             
         ],
         "Filters":
         [
             {
                 "Column" : "User", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "User", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value":fw.func("GETUSER")  // Value that you want to pass for comparison (any object)
             },
             {
                 "Column" : "SessionId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                 "ParamName" : "SessionId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                 "Value":user.sessionToken  // Value that you want to pass for comparison (any object)
             }
         ]// Specify the list of columns to take from the reference table.
     }];
     Database.readCompound("rodent","PlatformPersistence",compoundQeury, function(packet)					 
     { 
            
             ds1 = packet;
             CheckJumpScreen();
         
     });	
     compoundQeury = [
         {
             "TableName" : "UserRoles", // Specify the primary table used to construct the join request
             "Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
             "Columns" :
             [
                 "User",
                 "CompanyId"
             ],
             "Filters":
             [
                 {
                     "Column" : "User", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
                     "ParamName" : "User", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
                     "Value":fw.func("GETUSER")  // Value that you want to pass for comparison (any object)
                 },
                  
             ]// Specify the list of columns to take from the reference table.
         }];
         Database.readCompound("rodent","UserRoles",compoundQeury, function(packet)					 
         { 
			 
             ds2 = [];
             var current;
             for(var val in packet.value.data)
             {
                 current =  packet.value.data[val];
                 ds2.push(current[1]);
				 
             }
             CheckJumpScreen();
         });	
     
 }
 
 function CheckJumpScreen()
 {
      
     if(ds1 !== undefined && ds2 !== undefined)
     {
         JumpUser();
     }
 }
 
 
 function JumpUser()
 {
    var user = JSON.parse(sessionStorage.getItem("user"));
 
    var persistence;
    var current;
    var outgoingSource = [];
    for(var val in ds1.value.data)
    {
        current =  ds1.value.data[val];
    }
    
    Script.setState("Initializer",_initializer);
    Script.setState("HandleGeneric",_handleGeneric);
    Script.setState("PublishCommand",_publishCommand);
    Script.setState("UpdatePersistance",_UpdatePersistance);
  
 
    persistence = current;
  
    if(persistence === undefined)
    {
        persistence = {};
        Script.setState("rodent-persistance",persistence);
        persistence.UserRights = ds2;
        persistence.User = fw.func("GETUSER");
        persistence.SessionId = user.sessionToken;
	    persistence.LocationId = "";
        persistence.CompanyId = "";
        persistence.CustomerId = "";
        persistence.SiteId = "";
        persistence.LastScreen = "";
        persistence.ReportId = "";
        persistence.AdvisoryId = "";
        persistence.FormData = "";
        persistence.LevelAccess = 1;
        persistence.BranchId = "";
        _UpdatePersistance(persistence);
        fw.func("JUMPSCREEN", "Levels");
 
    }
    else
    {
		  
        persistence = {};
        persistence.User = current[0];
        persistence.SessionId = current[1];
        persistence.LocationId = current[2];
        persistence.CompanyId = current[3];
        persistence.CustomerId = current[4];
        persistence.SiteId = current[5];
        persistence.LastScreen = current[6];
        persistence.ReportId = current[7];
        persistence.AdvisoryId = current[8];
        persistence.FormData = current[9];
        persistence.LevelAccess = current[10];
        persistence.BranchId = current[11];
		persistence.IsAdmin = current[12];
        persistence.UserRights = ds2;
		
		Database.readRecords("rodent", "UserRoles", function(eventData) {
			persistence.IsAdmin = `${eventData.value.getColumn("IsAdmin")[0]}`;
			Script.setState("SelectedCustomer", persistence.CustomerId);
			Script.setState("SelectedArea",persistence.LocationId);
			Script.setState("selectedSite", persistence.SiteId);
			Script.setState("getSite", persistence.SiteId);
			Script.setState("rodent-persistance",persistence);
			
			Script.setState("GotoPage",_gotoPage);
			var command = 
			{
				"Action":"setVal",
				"Compoent":"RightPanel",
				"Value": " ",
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
			if(persistence.LastScreen === "Device Level")
			{
				var selectSites = [
				{
					"TableName" : "Locations", // Specify the primary table used to construct the join request
					"Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
					"Columns" :
					[
						"Id",

					], // Specify the list of columns to take from the reference table.
					"Filters" : // Filter options in case they are needed.
					[
						{
							"Column" : "RelativeId", //Column that will be applied (don't include table name will be resolved if its contained within the reference table.
							"ParamName" : "RelativeId", // Parameter name, must be unique and should not contain $ as its resolved by the mapper. 
							"Value": persistence.SiteId // Value that you want to pass for comparison (any object)
						}	
					]
				}];
				Database.readCompound("rodent","Sites",selectSites, function(currentData)					 
				{

					var selectedSites = [];
					var areas;	
					for(var item in currentData.value.data)
					{
						areas = currentData.value.data[item];
						selectedSites.push(areas[0]);
					}

					if(current !== undefined)
					{
						Script.setState("selectedSites", selectedSites);	 
						fw.func("JUMPSCREEN", persistence.LastScreen);
					}
					else
					{
						fw.func("JUMPSCREEN", "Levels");
					}
				});
			}
			else if(persistence.LastScreen === "")
			{
				fw.func("JUMPSCREEN", "Levels");
			}
			 else
			{

				if(persistence.LastScreen !== "Recommendation Form")
				{
					persistence.AdvisoryId = "";				
					_UpdatePersistance(persistence);
				}
				if(persistence.LastScreen !== "Site Report Form")
				{
					persistence.ReportId = "";
					_UpdatePersistance(persistence);
				}

				if(persistence.LastScreen !== "Recommendation Form" && persistence.LastScreen !== "Site Report Form")
				{
					persistence.FormData = "";
					_UpdatePersistance(persistence);
				}

				fw.func("JUMPSCREEN", persistence.LastScreen);
			}
		}, {filter: `User='${Client.getUser()}'`});
    }
 }