//# sourceURL=dynamic-script.js
/**
 * Description: Handles bussiness logic related to update/create advisory.
 * Create Author/Date: Kristifor Milcbev 8/20/2020 
 * Modified Author/Date Date: 
 * Version: 0.1
 */

/**
 * Initialise script state (run once at startup)
 */

//varible declarations
var ImageSelected = [];
var SelectedAdvisory = 3;
var stateModel = {};
var mode;
var Mode;
var TrapId;
var SelectedArea;
var AssignedAdvisory = "Customer";
var command;
var Customer;
var AdvStatus = "0";
var Caller = "Recommendation List";
var ImageGuid;
var lastId = 0;
var persistence;
var _UpdatePersistance;

Script.on('init', function() {
	//Script.setState("CallbaackPage", "New Report");
	
 
});


Script.on('load', function() {
	   
	persistence = Script.getState("rodent-persistance");

	SelectedArea = persistence.LocationId; 	
	TrapId =  persistence.SiteId;
	Customer = persistence.CustomerId;
	 
	try{
	_UpdatePersistance = Script.getState("UpdatePersistance");
	 persistence.LastScreen = "Recommendation Form";
	_UpdatePersistance(persistence);
	}
	catch(e)
	{
		 setTimeout(function(){ 	
			 fw.func("JUMPSCREEN", "Initialisation");
		 }, 3000);	
	}
	//Setting init styles
	var bgContainer =  Script.getScriptElement("bgContainer");
	var lineTemplate =  Script.getScriptElement("bookAdvisoriesLine");

	var cardTemplate =  Script.getScriptElement("StatusTEmplate");
	var sidebarContent =  Script.getScriptElement("SidebarTemplate");
	var iconSvg = Script.getScriptElement("IconSvg");
	
	ClientEvents.publish("clear-fix-line",lineTemplate ,false);
 	ClientEvents.publish("setTitleColor","color:#6ec4f7ff;",false);
	ClientEvents.publish("SetImage", "../images/blank.png");
	ClientEvents.publish("thumb-clear", "");


	//ClientEvents.publish("setTitleColor","font-size:12px;",false);

	
	ClientEvents.publish("setDateColor","color:#6ec4f7ff;",false);

	//ClientEvents.publish("SetColor","#e01d1d");
 	ClientEvents.publish("setCss", bgContainer,false);

	ClientEvents.publish("setDeleteColor",{Property: "width",PropertyValue:"100%"},false);
	ClientEvents.publish("setDeleteColor",{Property: "height",PropertyValue:"100%"},false);
	ClientEvents.publish("setDeleteColor",{Property: "color",PropertyValue:"white"},false);
	ClientEvents.publish("setDeleteColor",{Property: "background-color",PropertyValue:"#d12d1b"},false);

	
	
	ClientEvents.publish("setbtn1Color",{Property: "width",PropertyValue:"100%"},false);
	ClientEvents.publish("setbtn1Color",{Property: "height",PropertyValue:"100%"},false);
	ClientEvents.publish("setbtn1Color",{Property: "color",PropertyValue:"white"},false);
	ClientEvents.publish("setbtn1Color",{Property: "background-color",PropertyValue:"#6ec3f6ff"},false);
	
	ClientEvents.publish("setCancelColor",{Property: "width",PropertyValue:"100%"},false);
	ClientEvents.publish("setCancelColor",{Property: "height",PropertyValue:"100%"},false);
	ClientEvents.publish("setCancelColor",{Property: "color",PropertyValue:"white"},false);
	ClientEvents.publish("setCancelColor",{Property: "background-color",PropertyValue:"#6ec3f6ff"},false);
	
//	ClientEvents.publish("setSubmitColor",{Property: "width",PropertyValue:"96%"},false);
	ClientEvents.publish("setSubmitColor",{Property: "height",PropertyValue:"100%"},false);
	ClientEvents.publish("setSubmitColor",{Property: "color",PropertyValue:"white"},false);
	ClientEvents.publish("setSubmitColor",{Property: "background-color",PropertyValue:"#6ec3f6ff"},false);
 	
	ClientEvents.publish("setContent",cardTemplate,false);
	ClientEvents.publish("setContentSidebar",sidebarContent,false);
	ClientEvents.publish("set-icon-svg",iconSvg,false);
    debugger;
	var date = new Date();
    var formated = formatDate(date, "MM/dd/yy H:mm")


	ClientEvents.publish("AdvisoryDate",formated);
 	ClientEvents.publish("BtnSubmit","save");
 	ClientEvents.publish("AdvisoryTitle","SITE EVENTS");
	
	//End edit styles
	
	
	SelectedArea = Script.getState("SelectedArea"); 
	// get the mode of the advisory, this is defined in the initialisation screen, in MenuTemplateRodent
	// a 0 indicates a recommendation, a 1 indicates an incident
	Mode = Script.getState("AdvisorySelected");
    console.log(Mode);
	SelectType("minor");
	if(Mode === null || Mode === "0")
	{
		fw.func("HIDEWIDGET","btnDelete"); // Hides the delete button
		Mode = "0";
		Database.readLastPrimaryKey("Rodent","SiteEvents",function(eventData){
			lastId = eventData.value;
		});
        ClientEvents.publish("setEventType","Recommendation");
        stateModel.AdvType = "Recommendation";
	} 
    else if (Mode === null || Mode === "-1")
    {
        fw.func("HIDEWIDGET","btnDelete"); // Hides the delete button
        Mode = "0";
        Database.readLastPrimaryKey("Rodent", "SiteEvents", function(eventData) {
            lastId = eventData.value;
        });
        ClientEvents.publish("setEventType","Incident");
        stateModel.AdvType = "Incident";
    }

    UpdatePersistance();
	
	
	if(Mode !== "0" && Mode !== "-1")
	{
		fw.func("SHOWWIDGET","btnDelete"); // Shows the delete button
		ClientEvents.publish("AdvisoryTitle","RECOMMENDATION");
		LoadAdvisoryData(Mode);
	}
	
	//Script.setState("CallbaackPage", "New Report");
 	stateModel = {};
	
	if(persistence.FormData !== '')
	{
		stateModel = JSON.parse(persistence.FormData);
		if(typeof stateModel === 'object' && stateModel !== null)
		{
			if(stateModel.title !== undefined)
			{
				ClientEvents.publish("SetAddress",stateModel.title,false);
			}
			if(stateModel.Code !== undefined)
			{
				ClientEvents.publish("SetCode",stateModel.Code,false);
			}
			if(stateModel.Reason !== undefined)
			{
				ClientEvents.publish("SetReason",stateModel.Reason,false);
			}
			if(stateModel.ResolutionNotes !== undefined)
			{
				ClientEvents.publish("SetResolution",stateModel.ResolutionNotes,false);
			}
			if(stateModel.AssignedAdvisory !== undefined)
			{
				ClientEvents.publish("selectAssignee",stateModel.AssignedAdvisory,false);
			}
			if(stateModel.AdvStatus !== undefined)
			{
				ClientEvents.publish("statusChanged",stateModel.AdvStatus,false);
				
				switch(stateModel.Priority)
				{
					case "1":
						SelectType("urgent");
					break;

					case "2":
						SelectType("important");
					break;

					case "3":
						SelectType("minor");
					break;

				}
			}
			if(stateModel.ImageGuid !== undefined)
			{
				get_carousel_images(stateModel.ImageGuid);
			}
		}
		else
		{
			stateModel = {};
		}
 	}
	 ClientEvents.publish("toggle-switch", "1",false);
});
 
  
ClientEvents.subscribe("cancelAction", function(data) {
	
	Script.setState("AdvisorySelected","0");
	Mode = null;
	persistence.FormData = "";
	persistence.AdvisoryId = "0";
	_UpdatePersistance(persistence);
	fw.func("JUMPSCREEN", Caller);
});

ClientEvents.subscribe("EventTypeChanged", function(data) {
    debugger;
    stateModel.AdvType = data.value;
    UpdatePersistance();
});
 
ClientEvents.subscribe("AddressChanged", function(data) {
 stateModel.title = data.value;
 UpdatePersistance();
});

ClientEvents.subscribe("CodeChanged", function(data) {
  stateModel.Code = data.value;
  UpdatePersistance();
});
ClientEvents.subscribe("CodeChanged", function(data) {
  stateModel.Code = data.value;
  UpdatePersistance();
});

ClientEvents.subscribe("CommentChanged", function(data) {
  stateModel.Comment = data.value;
  UpdatePersistance();
});
ClientEvents.subscribe("ReasonChanged", function(data) {
  stateModel.Reason = data.value;
  UpdatePersistance();
});
ClientEvents.subscribe("ResolutionChanged", function(data) {
  stateModel.ResolutionNotes = data.value;
  UpdatePersistance();
});

ClientEvents.subscribe("Status", function(data) {
  stateModel.Status = data.value;
  UpdatePersistance();
});

ClientEvents.subscribe("ContextChanged", function(data) {
  stateModel.Context = data.value;
  UpdatePersistance();
});

ClientEvents.subscribe("AssigneeChanged", function(data) {
    AssignedAdvisory = data.value;
    stateModel.AssignedAdvisory = data.value;
    UpdatePersistance();
});

ClientEvents.subscribe("statusChecked", function(data) {
	 
    AdvStatus = data.value;
	stateModel.AdvStatus = data.value;
    UpdatePersistance();
});


ClientEvents.subscribe("TakePhoto", function(currentData) 
{
		var base64String = null;
		var reader = new FileReader();
		var data = null;
		var imageName;
		Client.selectFiles(".png,.jpg,.jpeg,.gif",function(fileData){ 			
			data = fileData;
			reader.readAsDataURL(data[0]);
			Client.startLoadingSpinner();
		});
		 
		reader.onloadend = function (file) 
		{
			 
 			console.log(reader.result);
			base64String = reader.result;

			if(base64String === null)
			{
				return;
			}
			var dto = {};
			dto.imagebase64 = base64String;
			dto.data = data;
			dto.fileName = new Date().getTime() + "_" + dto.data[0].name;
 			Client.saveImage(dto.imagebase64,function(current)
			{
				  
				var packet = {
					method: "append",
					src: "../userfiles/" +  current.value
				};
				ClientEvents.publish("ReceiveImage", packet, false);
				ClientEvents.publish("SetImage",packet.src);
				 
				ImageSelected.push(current.value);
				UpdatePersistance()

				Client.stopLoadingSpinner();
			},
			{
					location: "userfiles",
					fileType: "IMAGE",
					fileName: dto.fileName,
			}); 
			
		};

 
 // ImageSelected =  

});

 
 
function getImage() {

    var reader = new FileReader();
    var f = document.getElementById("file-select").files;

    reader.onloadend = function () {
        console.log(reader.result);
    };
    reader.readAsDataURL(f[0]);

}


ClientEvents.subscribe("thumb-pressed", function(data) 
{
	 
 	var getLast = data.value.src.split("/");
	var last = getLast[getLast.length-1];
   ClientEvents.publish("SetImage","../userfiles/"+last);
   UpdatePersistance();
});




ClientEvents.subscribe("SaveChanges", function(data) {
	 
	 if(Mode === "0")
	 {
		 SaveNewReport();
	 }
	 else
	 {
		 UpdateSiteAdvisory();
	 }

});


ClientEvents.subscribe("CancelChanges", function(data) {
	 
	Script.setState("AdvisorySelected","0");
	Mode = null;
	persistence.FormData = "";
	persistence.AdvisoryId = "0";
	_UpdatePersistance(persistence);
 	fw.func("JUMPSCREEN", Caller);
});

ClientEvents.subscribe("DeleteAdvisory", function(data) {
	 
	var result = Client.confirm("Are you sure you want to delete this record?", "Delete Recommendation");
	result.then(result => {
		if(result)
		{
			 var paramDelete = [{
				Sql: "Delete from SiteEvents where Id = $Id",
				Data: [{
					Column: "$Id",
					value: Mode
				}]
			}];
			Database.cudParam("Rodent","SiteEvents",paramDelete, function (data){
				fw.func("JUMPSCREEN", Caller);
			});
		}
	});
});


function LoadAdvisoryData(id)
{
 	var getAdvisory =
	[{
		"TableName" : "SiteEvents", // Specify the primary table used to construct the join request
		"Join" : 1, // Join type 1 - Inner Join, 2 - Outer Join, 3 - Left join, 4 - Right Join.
		"Columns" :
		[
			"Id",
		    "Context",
			"location",
			"reason",
			"title",
			"SiteEventType",
			"SiteEventPriority",
			"assigned",
			"SiteEventStatus",
			"Images",
			"SiteEventDate",
            "ResolutionNotes"
		], // Specify the list of columns to take from the reference table.
		"Filters" : // Filter options in case they are needed.
		[
			{
				"Column" : "Id",
				"ParamName" : "AdvId",
				"Value": id  
			}	
		]
	}];
	Database.readCompound("rodent","SiteEvents",getAdvisory, function(currentData)					 
    {
		 
		var advisoryData;
		for(var item in currentData.value.data)
		{
			advisoryData = currentData.value.data[item];
        }
		 
		if(advisoryData === undefined)
		{
			return;
		}
		
		 
		stateModel.Code = advisoryData[1];
	    stateModel.Reason = advisoryData[2];
 		stateModel.title = advisoryData[3];
		stateModel.AdvType = advisoryData[4];
		stateModel.Priority = advisoryData[5];
        stateModel.AssignedAdvisory = advisoryData[6];
		stateModel.AdvStatus = advisoryData[7];
		stateModel.ImageGuid = advisoryData[8];
		stateModel.SetDate = advisoryData[9];
        stateModel.ResolutionNotes = advisoryData[10];
		
		SelectedAdvisory = advisoryData[5];
        AssignedAdvisory = advisoryData[6];
		ImageGuid = advisoryData[8];
		if(stateModel.AdvType !== undefined)
		{
			ClientEvents.publish("SetEventType", stateModel.AdvType, false);
		}
		if(stateModel.title !== undefined)
		{
			ClientEvents.publish("SetAddress",stateModel.title,false);
		}
		if(stateModel.Code !== undefined)
		{
			ClientEvents.publish("SetCode",stateModel.Code,false);
		}
		if(stateModel.Reason !== undefined)
		{
			ClientEvents.publish("SetReason",stateModel.Reason,false);
		}
        if(stateModel.ResolutionNotes !== undefined)
		{
			ClientEvents.publish("SetResolution",stateModel.ResolutionNotes,false);
		}
		if(stateModel.AssignedAdvisory !== undefined)
		{
			ClientEvents.publish("selectAssignee",stateModel.AssignedAdvisory,false);
		}
		if(stateModel.SetDate !== undefined)
		{
            debugger
			var date = new Date(parseInt(stateModel.SetDate));
            var formated = formatDate(date, "MM/dd/yy H:mm")

			ClientEvents.publish("AdvisoryDate",formated);
		}
		if(stateModel.AdvStatus !== undefined)
		{
			ClientEvents.publish("statusChanged",stateModel.AdvStatus,false);
		}
		 
		if(stateModel.Priority !== undefined)
	    {
		    switch(stateModel.Priority)
			{
				case "1":
					SelectType("urgent");
				break;

				case "2":
					SelectType("important");
				break;

				case "3":
					SelectType("minor");
				break;

			}
	    }
		if(stateModel.ImageGuid !== undefined)
		{
			get_carousel_images(stateModel.ImageGuid);
		}
 	});
}


function SaveNewReport()
{
	debugger;
    var imageKey = Script.generateGUID(); 
    stateModel.ImageGuid = imageKey;
    UpdatePersistance();
	var dbVal = {};
	var date = new Date();
	
	if(!Validate())
	{
		
		return;
	}
	  
	dbVal["Id"] =
	{
		"Id":lastId+1,
  		"reason": stateModel.Reason,
        "ResolutionNotes": stateModel.ResolutionNotes,
		"location":stateModel.Code,
		"title": stateModel.title,
		//"comment": stateModel.Comment,
		//"context": stateModel.Context,
		"assigned":AssignedAdvisory,
        "SiteEventType" : stateModel.AdvType,
		"SiteEventPriority" : SelectedAdvisory,
		"SiteEventStatus": AdvStatus,
		"SiteId": TrapId,
		"CustomerId":Customer,
		"CompanyId":persistence.CompanyId,
		"LocationId": persistence.LocationId,
		"SiteEventDate":date.getTime(),
		"Images": imageKey
	};

	Database.saveRecordParam("Rodent","SiteEvents",dbVal, function(result)
	{
		 
 		if(ImageSelected.length === 0)
		{
		    stateModel = "";
			Script.setState("AdvisorySelected","0");
			Mode = null;
			persistence.FormData = "";
			persistence.AdvisoryId = "0";
			_UpdatePersistance(persistence);
			fw.func("JUMPSCREEN", Caller);
		}
		Database.readLastPrimaryKey("Rodent","photos",function(response){
 			 lastId = response.value;
			 for(var key in ImageSelected)
			 {
				lastId += 1;
				var image = ImageSelected[key];
				var imageQuery = {};
				imageQuery["Id"] =
				{
					"Id":lastId,
					"key":imageKey,
					"value":image,
				};    

				Database.saveRecordParam("Rodent","photos",imageQuery, function(result)
				{
                        stateModel = "";
						Script.setState("AdvisorySelected","0");
						Mode = null;
						persistence.FormData = "";
						persistence.AdvisoryId = "0";
						_UpdatePersistance(persistence);
  						fw.func("JUMPSCREEN", Caller);
		
				});
			 }
		});
	});
	 
	
	
 }



function UpdateSiteAdvisory()
{
	 
 
	if(!Validate())
	{
		
		return;
	}
	  
	
	var dbVal = {};
	dbVal["Id"] =
	{
		"Id":Mode,
		"reason": stateModel.Reason,
        "ResolutionNotes": stateModel.ResolutionNotes,
		"title":stateModel.title,
		"location": stateModel.Code,
		//"comment": stateModel.Comment,
		//"context": stateModel.Context,
		"assigned":AssignedAdvisory,
        "SiteEventType" : stateModel.AdvType,
		"SiteEventStatus": AdvStatus,
		"SiteEventPriority" : SelectedAdvisory,
 	};    

	Database.saveRecordParam("Rodent","SiteEvents",dbVal, function(result)
	{
		 
		persistence.FormData = "";
		persistence.AdvisoryId = "0";
		_UpdatePersistance(persistence);
		Database.readLastPrimaryKey("Rodent","photos",function(response){
			lastId = response.value;
			 
			if(ImageSelected.length === 0)
			{
					Script.setState("AdvisorySelected","0");
					fw.func("JUMPSCREEN", Caller);
			}
			 for(var key in ImageSelected)
			 {
				lastId += 1;
				var image = ImageSelected[key];
				var imageQuery = {};
				imageQuery["Id"] =
				{
					"Id":lastId,
					"key":ImageGuid,
					"value":image,
				};    

				Database.saveRecordParam("Rodent","photos",imageQuery, function(result)
				{
					 
                    stateModel = "";
					persistence.FormData = "";
					persistence.AdvisoryId = "0";
					_UpdatePersistance(persistence);
					Script.setState("AdvisorySelected","0");
					fw.func("JUMPSCREEN", Caller);
				});
			 }
		});
	});
	 
	
}
ClientEvents.subscribe("GenericActionMessage", function(data) {
 	var msg = data.split("|");
	switch(msg[0])
	{
		case "ActivateDeactivate":
			SelectType(msg[1]);
			break;
	}
	
});
	
function SelectType(type)
{
	switch(type)
	{
		case "urgent":
			SelectedAdvisory = "1";
			
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"CurrentContent|sidebarContent",
				"Value": "btnUrgent"
			};
			ClientEvents.publish("SidebarAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|urgent",
				"Value": "dot btnUrgent"
			};
			ClientEvents.publish("setSelectorAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|important",
				"Value": "dot"
			};
			ClientEvents.publish("setSelectorAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|minor",
				"Value": "dot"
			};
			ClientEvents.publish("setSelectorAction",command,true);

			break;
		case "important":
			SelectedAdvisory = "2";
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"CurrentContent|sidebarContent",
				"Value": "btnImportant"
			};
			ClientEvents.publish("SidebarAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|urgent",
				"Value": "dot"
			};
			ClientEvents.publish("setSelectorAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|important",
				"Value": "dot btnImportant"
			};
			ClientEvents.publish("setSelectorAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|minor",
				"Value": "dot"
			};
			ClientEvents.publish("setSelectorAction",command,true);
			break;
		case "minor":
			SelectedAdvisory = "3";
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"CurrentContent|sidebarContent",
				"Value": "btnMinor"
			};
			ClientEvents.publish("SidebarAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|urgent",
				"Value": "dot"
			};
			ClientEvents.publish("setSelectorAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|important",
				"Value": "dot"
			};
			ClientEvents.publish("setSelectorAction",command,true);
			command = 
			{
				"Action":"setElementClass",
				"Compoent":"widget",
				"Id":"BtnContent|minor",
				"Value": "dot btnMinor"
			};
			ClientEvents.publish("setSelectorAction",command,true);
			break;
	}
}


 


function populate_carousel(value){
 
	var keys = Object.keys(value.data);
	var len = keys.length;

	keys.forEach(function (key, index) {
		 
		var data = value.data[key];
		var packet = {
			method: "append",
			src: "../userfiles/" +data[0],
			//label: new Date(parseInt(data.datetime * 1000)).toLocaleString("en-AU").replace(",", ""),
		};
		ClientEvents.publish("ReceiveImage", packet);
	});
}


function get_carousel_images(guid){
	ClientEvents.publish("SetImage", "../images/blank.png");
	var getPhotos =
	[{
		"TableName" : "photos", // Specify the primary table used to construct the join request
 		"Columns" :
		[
			"value"
		], // Specify the list of columns to take from the reference table.
		"Filters" : // Filter options in case they are needed.
		[
			{
				"Column" : "key",
				"ParamName" : "Akey",
				"Value": guid  
			}	
		]
	}];
	
	Database.readCompound("rodent","photos",getPhotos, function(dbResponse)					 
    {
		  
		var first = GetFirst(dbResponse.value.data);
		if(first !== undefined)
		{
			ClientEvents.publish("SetImage", "../userfiles/"+first);
		}
		
		populate_carousel(dbResponse.value);
 	});
 
}


function GetFirst(data)
{
	var element;
	for(var index in data)
	{
		element = index;
		break;
	}
	return element;
}

function UpdatePersistance()
{
 	 persistence.FormData = JSON.stringify(stateModel);
	_UpdatePersistance(persistence);
}


function Validate()
{
	if(stateModel.title === "" || stateModel.title === undefined)
	{
		//error
		Client.alert("Title cannot be empty!");
 		return false;
	}
	
	if(stateModel.Code === "" || stateModel.Code === undefined)
	{
		Client.alert("Location/Floor cannot be empty!");
 		return false;
	}
	
	if(AssignedAdvisory === "" || AssignedAdvisory === undefined)
	{
		Client.alert("Assigner user cannot be empty!");
		return false;
	}
	
	if(AdvStatus === "" || AdvStatus === undefined)
	{
		Client.alert("Advisory type must be selected from the radio box!");
 		return false;
	}
	
	if(SelectedAdvisory === "" || SelectedAdvisory === undefined)
	{
		//error
		Client.alert("Please select state for the advisory!");
 		return false;
	}
 	
	return true;
}

function formatDate (date, format, utc) {
    var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    function ii(i, len) { var s = i + ""; len = len || 2; while (s.length < len) s = "0" + s; return s; }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
}