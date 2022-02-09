
var TakenData;
var DeviceData;
var bindingData;
var MotionData; 

onmessage = function(current)
{
    TakenData = current.data.TakenData;
    DeviceData = current.data.DeviceData;
    bindingData = current.data.bindingData;
    MotionData = current.data.MotionData;
     
    switch(current.data.type)
    {
         case 1:
            AddBaitTaken(current.data.data,current.data.device);
            postMessage({
                TakenData:TakenData,
                DeviceData:DeviceData,
                bindingData:bindingData,
                MotionData:MotionData,
                Type:1
            });
         break;
         case 2:
            AddCounter(current.data.data,current.data.device);
            postMessage({
                TakenData:TakenData,
                DeviceData:DeviceData,
                bindingData:bindingData,
                MotionData:MotionData,
                Type:2
            });
         break;
     }
} 

function AddBaitTaken(data, device)
{
    var takenData= {};

      
    data.forEach(x=>{
        var date = (new Date(x[0]).getTime() / 1000).toString();
        if(parseInt(x[1]) > 0)
        {
            TakenData[date] = {
                Device:device,
                Value:x[1],
                DataType:"Taken"
            };
            
            if(DeviceData[device] === undefined)
            {
                DeviceData[device] = {
                    data:[{
                        value: parseFloat(x[1]),
                        date: x[0],
                        type:0
                    }]
                 };
            }
            else
            {
                DeviceData[device].data.push({
                        value: parseFloat(x[1]),
                        date: x[0],
                        type:0
                    });
            }

            if(bindingData[date] === undefined)
            {
                bindingData[date] = Math.round(parseFloat(x[1]));
            
            }
            else
            {
                bindingData[date] += Math.round(parseFloat(x[1]));
                TakenData[date] += parseFloat(x[1]);
            }
        }
        else
        {
            TakenData[date] = {
                Device:device,
                Value:x[1],
                DataType:"Taken"
            };


            if(DeviceData[device] === undefined)
            {
                DeviceData[device] = {
                    data:[{
                        value: parseFloat(x[1]),
                        date: x[0],
                        type:0
                    }]
                 };
            }
            else
            {
                DeviceData[device].data.push({
                        value: parseFloat(x[1]),
                        date: x[0],
                        type:0
                    });
            }

            if(bindingData[date] === undefined)
            {
                bindingData[date] = 0;
            }
            else
            {
                bindingData[date] += 0;
            }
        }
    })

}


function AddCounter(data, device)
{
    var motionData ={};
     
    data.forEach(x=>{

        var date = (new Date(x[0]).getTime() / 1000).toString();
        if(parseInt(x[1]) > 0)
        {
            MotionData[date] = {
                Device:device,
                Value:x[1],
                DataType:"Motion"
            };

            if(DeviceData[device] === undefined)
            {
                DeviceData[device] = {
                    data:[{
                        value: parseInt(x[1]),
                        date: x[0],
                        type:1
                    }]
                 };
            }
            else
            {
                DeviceData[device].data.push({
                        value: parseInt(x[1]),
                        date: x[0],
                        type:1
                    });
            }

            if(bindingData[date] === undefined)
            {
                bindingData[date] = Math.round(parseFloat(x[1]));
            }
            else
            {
                bindingData[date] += Math.round(parseFloat(x[1]));
                motionData[date] += parseInt(x[1]);
            }
        }
        else
        {
            MotionData[date] = {
                Device:device,
                Value:x[1],
                DataType:"Motion"
            };

            if(DeviceData[device] === undefined)
            {
                DeviceData[device] = {
                    data:[{
                        value: parseInt(x[1]),
                        date: x[0],
                        type:1
                    }]
                 };
            }
            else
            {
                DeviceData[device].data.push({
                        value: parseInt(x[1]),
                        date: x[0],
                        type:1
                    });
            }


            if(bindingData[date] === undefined)
            {
                bindingData[date] = 0;
            }
            else
            {
                bindingData[date] += 0;
            }
        }
    })
}