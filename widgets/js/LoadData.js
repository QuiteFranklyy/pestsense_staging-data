
var SensaCollection;

var DeviceData;
var endDate;
var DevicesData; 
var bindingData;
var TakenData;
var MotionData;
onmessage = function(current)
{
     
    dynamicallyLoadScript
    DeviceData = current.data.DeviceData;
    DevicesData = current.data.DevicesData;
    bindingData = current.data.bindingData;
    TakenData  = current.data.TakenData;
    MotionData = current.data.MotionData;
    SensaCollection = current.data.sensaApi;
    postMessage(LoadData(current.data.data,null, current.data.Collection, current.data.domain));
} 

function LoadData(currentDate, data, currentCollection, domain)
{
    console.log(date);
    console.log(data);
    var startDate = currentDate;
    var publishData = {};
    var id = 1;
    var collection = currentCollection;
    //collection.sysmeta.label = "sensacollection";
    var totalMotionForDay = 0;
    var totalTakenForDay = 0;
    var isFirst = true;
    var lastIterated;
    var lastDate;
    var currentDevice;
     
    var type;

    switch(domain)
    {

        case "month":
        type = true;
        break;
        default:
        type = false;
        break;
    }
    var condition;
    
    var dates = {};
    for(var currentData in DeviceData)
    {
        var deviceData = DeviceData[currentData];
        var totalBait = 0;
        deviceData.data.forEach(x=>{
            var dateTime = new Date(x.date);
            var dFormated = formatDate(dateTime, "MM/dd/yy H:00");
            
            if(dates[currentData+"_"+dFormated] === undefined)
            {
                dates[currentData+"_"+dFormated] = {};
                dates[currentData+"_"+dFormated].totalBait = 0;
                dates[currentData+"_"+dFormated].totalMotion = 0;
                dates[currentData+"_"+dFormated].date = x.date;
                dates[currentData+"_"+dFormated].device = currentData;

                if(x.type === 0)
                {
                    dates[currentData+"_"+dFormated].totalBait = x.value;
                }
                else
                {
                    dates[currentData+"_"+dFormated].totalMotion = x.value;

                }
            }
            else
            {
                dates[currentData+"_"+dFormated].date = x.date;
                dates[currentData+"_"+dFormated].device = currentData;

                if(x.type === 0)
                {
                    dates[currentData+"_"+dFormated].totalBait += x.value;
                }
                else
                {
                    dates[currentData+"_"+dFormated].totalMotion += x.value;
                }
            }
        });
    }

    if(type)
    {
        endDate = startDate.addDays(10);
    } 
    else
    {
        var transformDate = formatDate(new Date(currentDate), "MM/dd/yy H:00");
        var startdate = new Date(Date.parse(transformDate));

        var transfromStart = formatDate(startdate, "MM/dd/yy H:00");
        var parseStart = new Date(Date.parse(transfromStart));
        var endDate = parseStart.addHours(1);
         
        var starTime = startdate.getTime();
        var endTime = endDate.getTime();
    }
    


    for(var selectedDate in dates)
    {
        var item = dates[selectedDate];
        
        if(type)
        {
             condition = new Date(item.date).getTime() >= startDate.getTime() && new Date(item.date).getTime() <= endDate.getTime();
        } 
        else
        {
            var transformRecord = formatDate(new Date(item.date), "MM/dd/yy H:mm");
            var recordTime = new Date(Date.parse(transformRecord)).getTime();
            
            condition = recordTime >= starTime && recordTime < endTime;

        }

        if(condition)
        {
            
      
            
            
            if(item.totalMotion > 0 || Math.round(item.totalBait))
            {
                
                var dateDeseriliazed = selectedDate.split("_")[1];
                var dateParsed = Date.parse(dateDeseriliazed);
                var dateFormatedDD = formatDate(new Date(dateParsed), "dd/MM/yyyy H:00");
                var obj = {};
                var date = new Date(parseInt(lastIterated) * 1000);
                obj["Id"] = id.toString();
                obj["date time"] = dateFormatedDD;
                obj["device name"] =  item.device;
                obj["location name"] = DevicesData[item.device.toUpperCase()].LocationName;
                obj["location details"] = DevicesData[item.device.toUpperCase()].Description;
                obj["motion count"] = item.totalMotion;
                obj["bait taken"] = Math.round(item.totalBait);
                obj["timestamp"] = item.date;
                collection.data[id]= obj;

                id++;
            }
            
        }
    }

    for(var currentData in bindingData)
    {
        var currentDataDate =  new Date(parseInt(currentData) * 1000);

        if(type)
        {
            endDate = startDate.addDays(10);
            condition = currentDataDate.getTime() >= startDate.getTime() && currentDataDate.getTime() <= endDate.getTime();
        } 
        else
        {
            
            var transformDate = formatDate(currentDate, "MM/dd/yy H:00");
            var startdate = new Date(Date.parse(transformDate));
            var transfromStart = formatDate(startdate, "MM/dd/yy H:00");
            var parseStart = new Date(Date.parse(transfromStart));
            var endDate = parseStart.addHours(1);

           // console.log("parseInt(currentData) > startdate.getTime()/1000:"+ parseInt(currentData) + ">" + startdate.getTime()/1000);
          //  console.log("parseInt(currentData) < endDate.getTime()/1000:"+ parseInt(currentData) + "<>>" + endDate.getTime()/1000);

            condition = currentDataDate.getTime() >= startdate.getTime() && currentDataDate.getTime() <= endDate.getTime();


        }
        
        if(condition)
        {
            publishData[currentData] = bindingData[currentData];
        }
    }
    
     
    return  {
        startDate:startDate,
        endDate: date,
        data: publishData,
        TakenData: TakenData,
        MotionData: MotionData,
        DevicesData: DevicesData,
        DeviceData: DeviceData,
        TableData: collection,
        currentDate:currentDate
     };
  }


function formatDate(date, format, utc) {
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
};


Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.addHours = function(h) {
    var date = new Date(this.valueOf());
    date.setTime(this.getTime() + (h*60*60*1000));
    return date;
}

Date.prototype.substractDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() - days);
    return date;
}

function dynamicallyLoadScript(url) {
     
    var script = document.createElement("script");  // create a script DOM node
    script.src = url;  // set its src to the provided URL

    document.head.appendChild(script);  // add it to the end of the head section of the page (could change 'head' to 'body' to add it to the end of the body section instead)
}