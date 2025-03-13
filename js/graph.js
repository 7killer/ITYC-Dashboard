
const labelsChartWinds = [5 , 10 , 15 ,20 , 25, 30,35,40,45,50,55,60,65,70,80];
const labelsChartTWA = [0 , 10  ,20 , 30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180];
const sailNames = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
                     // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                     "Auto", "Jib Ⓐ", "Spi Ⓐ", "Stay Ⓐ", "LJ Ⓐ", "C0 Ⓐ", "HG Ⓐ", "LG Ⓐ"];

var twsChart = undefined;
var twaChart = undefined;
var twdChart = undefined;
var hdgChart = undefined;
var bsChart = undefined;
var staminaChart = undefined;


class CustomLineChart extends Chart.LineController {
	draw() {
	  super.draw();
    if(!this.chart.tooltip) return;
	  let tooltip = this.chart.tooltip._active
	  if (tooltip && tooltip.length) {
		let	rightX = this.chart.scales.x.left,
		leftX = this.chart.scales.x.right ,      
		topY = this.chart.scales.y.top,
		bottomY = this.chart.scales.y.bottom,
		x = tooltip[0].element.x,
		ctx = this.chart.ctx;
		ctx.save();
		// Render line on canvas
		//draw vertical axis
		ctx.beginPath();
		ctx.moveTo(x, bottomY);
		ctx.lineTo(x, topY);
		ctx.lineWidth = 1;
		ctx.strokeStyle = '#b4b4b4';
		ctx.stroke();
		
		//draw a horizontal for every graph
		for(let id in tooltip)
		{
			let y = tooltip[id].element.y;

			ctx.beginPath();
			ctx.moveTo(leftX, y);
			ctx.lineTo(rightX, y);
			ctx.lineWidth = 1;
			ctx.strokeStyle = tooltip[id].element.options.borderColor;
			ctx.stroke();
		} 
		ctx.restore();
	  }
	}
}

CustomLineChart.id = 'CustomLineChart';
CustomLineChart.defaults = Chart.LineController.defaults;

//= On DOM Ready ==================//
function onLoad() {
    Number.prototype.fix = function(n, pad) {
        if (pad === undefined) pad = false;
    
        if (pad === true)
        return this.toFixed(n ? n : 2);
        else
        return Number.parseFloat(this.toFixed(n ? n : 2));
    };
    
    Chart.register(CustomLineChart);
};
    


function drawTWSChart(ts,tws,sail) {


    var gridColor = Chart.defaults.borderColor;
    if(document.documentElement.getAttribute("data-theme") =='dark')
      gridColor = 'rgba(255, 255, 255, 0.2)';

    const dataChart = {
        labels: ts,
        datasets: [
            {
            label: "True Wind Speed",
            data: tws,
            yAxisID: 'y',
            colors :                    sail.color,
            pointBorderColor:          sail.color,
            pointBackgroundColor:      sail.color,
            pointHoverBackgroundColor: sail.color,
            pointHoverBorderColor:     sail.color,
            pointStyle: 'line',
            //backgroundColor: drawData.pointColor,
            segment: {
              borderColor: function(ctx) {
                return	sail.color[ctx.p0DataIndex];
              },
            },
            //borderColor: 'green',
            //backgroundColor: 'green',
            },
        ]
    };

    const zoomOptions = {
     /* limits: {
        x: {min: 0, max:350, minRange: 20}
      },*/
      pan: {
        enabled: true,
        mode: 'x',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'x',
        speed: 0.05
      }
    };
    const configChart = {
      type: 'CustomLineChart',
      data: dataChart,
      options: {
        responsive: true,
        maintainAspectRatio : false,        
        interaction: {
          mode: 'index',
          intersect: false,
        }, 
/*        legend: {
          labels: {
            fontColor: 'white'
          }
        },*/
        plugins: {
          zoom: zoomOptions,
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {					
              title: function(tooltipItems, data) {
                let title = tooltipItems[0].label || '';
                return "Time : " + buildDate(title);
              },
              label: function(context) {
                let label = context.dataset.label || '';
  
                if (label) {
                  label += ' : ';
                }
                if (context.parsed.y !== null) {
                  label += parseFloat(Number(context.parsed.y).toFixed(3)) + " nds" ;
                  if(context.dataIndex>1){
                    let d = parseFloat(Number(tws[context.dataIndex]-tws[context.dataIndex-1]).toFixed(3));
                    label += " " + (d>0?("+"+d):d); 
                  } 
                  label += " (" + sailNames[sail.id[context.dataIndex]] +")";
                }
                return label;
              },
            }
          }		   
        },

        stacked: false,
        elements: {
          point:{
              radius: 0
          }
        
      },
        scales: {
          x: {
            ticks: {
              stepSize: 1,
              callback: function(value, index, values) {           
                return dynamicTimeAxisTicks(value,values,ts);
              }
            },
          },
          y: {
            grid: {
              color: gridColor
            },
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {                
              stepSize: 1,
             callback: function(value, index, values) {
              if(value===0)
                return value;
              else
                return parseFloat(Number(value).toFixed(3))+"nds"; 
              }
              
            },
            title : {
              display:true,
              text:"True Wind Speed"
            }
          },
        }
      },
    };

    if(twsChart) twsChart.destroy();
    var ctx = document.getElementById('twsChart');
    twsChart = new Chart(ctx, configChart);
}

function drawTWAChart(ts,twa,sail) {
  
  var gridColor = Chart.defaults.borderColor;
  if(document.documentElement.getAttribute("data-theme") =='dark')
    gridColor = 'rgba(255, 255, 255, 0.2)';
    const dataChart = {
        labels: ts,
        datasets: [
            {
            label: "True Wind Angle",
            data: twa,
            yAxisID: 'y',
            colors :                   sail.color,
            pointBorderColor:          sail.color,
            pointBackgroundColor:      sail.color,
            pointHoverBackgroundColor: sail.color,
            pointHoverBorderColor:     sail.color,
            pointStyle: 'line',
            //backgroundColor: drawData.pointColor,
            segment: {
              borderColor: function(ctx) {
                return	sail.color[ctx.p0DataIndex];
              },
            },
            },
        ]
    };

    const zoomOptions = {
     /* limits: {
        x: {min: 0, max:350, minRange: 20}
      },*/
      pan: {
        enabled: true,
        mode: 'x',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'x',
        speed: 0.05
      }
    };
    const configChart = {
      type: 'CustomLineChart',
      data: dataChart,
      options: {
        responsive: true,
        maintainAspectRatio : false,
        interaction: {
          mode: 'index',
          intersect: false,
        }, 
         
        legend: {
          labels: {
            fontColor: 'white'
          }
        },
        plugins: {
          zoom: zoomOptions,
          legend: {
            display: true,

          },
          tooltip: {
            callbacks: {					
              title: function(tooltipItems, data) {
                let title = tooltipItems[0].label || '';
                return "Time : " + buildDate(title);
              },
              label: function(context) {
                let label = context.dataset.label || '';
  
                if (label) {
                  label += ' : ';
                }
                if (context.parsed.y !== null) {
                  label += parseFloat(Number(context.parsed.y).toFixed(3)) + " °";
                  if(context.dataIndex>1){
                    let d = parseFloat(Number(twa[context.dataIndex]-twa[context.dataIndex-1]).toFixed(3));
                    label += " " + (d>0?("+"+d):d); 
                  } 
                  label += " (" + sailNames[sail.id[context.dataIndex]] +")";
                }
                return label;
              },
            }
          }		   
        },

        stacked: false,
        elements: {
          point:{
              radius: 0
          }
      },
        scales: {
          x: {
            ticks: {
              stepSize: 1,
              callback: function(value, index, values) {
                return dynamicTimeAxisTicks(value,values,ts);
              }
            },
          },
          y: {
            grid: {
              color: gridColor
            },
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {                
              stepSize: 1,
              callback: function(value, index, values) {
                if(value===0)
                  return value;
                else
                  return parseFloat(Number(value).toFixed(3))+"°"; 
                }

             /* callback: function(value, index, values) {
                if(labelsChartTime.find(element => element==value))
                  return buildTimeTxt2(value);
                
              }*/
              
            },
            title : {
              display:true,
              text:"True Wind Angle"
            }
          },
        }
      },
    };

    if(twaChart) twaChart.destroy();
    var ctx = document.getElementById('twaChart');
    twaChart = new Chart(ctx, configChart);
}

function drawTWDChart(ts,twd,sail) {
  
  var gridColor = Chart.defaults.borderColor;
  if(document.documentElement.getAttribute("data-theme") =='dark')
    gridColor = 'rgba(255, 255, 255, 0.2)';
    const dataChart = {
        labels: ts,
        datasets: [
            {
            label: "True Wind Direction",
            data: twd,
            yAxisID: 'y',
            colors :                   sail.color,
            pointBorderColor:          sail.color,
            pointBackgroundColor:      sail.color,
            pointHoverBackgroundColor: sail.color,
            pointHoverBorderColor:     sail.color,
            pointStyle: 'line',
            //backgroundColor: drawData.pointColor,
            segment: {
              borderColor: function(ctx) {
                return	sail.color[ctx.p0DataIndex];
              },
            },
            },
        ]
    };

    const zoomOptions = {
     /* limits: {
        x: {min: 0, max:350, minRange: 20}
      },*/
      pan: {
        enabled: true,
        mode: 'x',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'x',
        speed: 0.05
      }
    };
    const configChart = {
      type: 'CustomLineChart',
      data: dataChart,
      options: {
        responsive: true,
        maintainAspectRatio : false,
        interaction: {
          mode: 'index',
          intersect: false,
        }, 
         
        legend: {
          labels: {
            fontColor: 'white'
          }
        },
        plugins: {
          zoom: zoomOptions,
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {					
              title: function(tooltipItems, data) {
                let title = tooltipItems[0].label || '';
                return "Time : " + buildDate(title);
              },
              label: function(context) {
                let label = context.dataset.label || '';
  
                if (label) {
                  label += ' : ';
                }
                if (context.parsed.y !== null) {
                  label += parseFloat(Number(context.parsed.y).toFixed(3)) + " °";
                  if(context.dataIndex>1){
                    let d = parseFloat(Number(twd[context.dataIndex]-twd[context.dataIndex-1]).toFixed(3));
                    label += " " + (d>0?("+"+d):d); 
                  } 
                  label += " (" + sailNames[sail.id[context.dataIndex]] +")";
                }
                return label;
              },
            }
          }		   
        },

        stacked: false,
        elements: {
          point:{
              radius: 0
          }
      },
        scales: {
          x: {
            ticks: {
              stepSize: 1,
              callback: function(value, index, values) {
                return dynamicTimeAxisTicks(value,values,ts);
              }
            },
          },
          y: {
            grid: {
              color: gridColor
            },
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {                
              stepSize: 1,
              callback: function(value, index, values) {
                if(value===0)
                  return value;
                else
                  return parseFloat(Number(value).toFixed(3))+"°"; 
                }
              
            },
            title : {
              display:true,
              text:"True Wind Direction"
            }
          },
        }
      },
    };

    if(twdChart) twdChart.destroy();
    var ctx = document.getElementById('twdChart');
    twdChart = new Chart(ctx, configChart);
}

function drawHDGChart(ts,hdg,sail) {
  
  var gridColor = Chart.defaults.borderColor;
  if(document.documentElement.getAttribute("data-theme") =='dark')
    gridColor = 'rgba(255, 255, 255, 0.2)';
    const dataChart = {
        labels: ts,
        datasets: [
            {
            label: "Boat heading",
            data: hdg,
            yAxisID: 'y',
            colors :                   sail.color,
            pointBorderColor:          sail.color,
            pointBackgroundColor:      sail.color,
            pointHoverBackgroundColor: sail.color,
            pointHoverBorderColor:     sail.color,
            pointStyle: 'line',
            //backgroundColor: drawData.pointColor,
            segment: {
              borderColor: function(ctx) {
                return	sail.color[ctx.p0DataIndex];
              },
            },
            },
        ]
    };

    const zoomOptions = {
     /* limits: {
        x: {min: 0, max:350, minRange: 20}
      },*/
      pan: {
        enabled: true,
        mode: 'x',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'x',
        speed: 0.05
      }
    };
    const configChart = {
      type: 'CustomLineChart',
      data: dataChart,
      options: {
        responsive: true,
        maintainAspectRatio : false,
        interaction: {
          mode: 'index',
          intersect: false,
        }, 
         
        legend: {
          labels: {
            fontColor: 'white'
          }
        },
        plugins: {
          zoom: zoomOptions,
          legend: {
            display: true,
          },
          tooltip: {
            callbacks: {					
              title: function(tooltipItems, data) {
                let title = tooltipItems[0].label || '';
                return "Time : " + buildDate(title);
              },
              label: function(context) {
                let label = context.dataset.label || '';
  
                if (label) {
                  label += ' : ';
                }
                if (context.parsed.y !== null) {
                  label += parseFloat(Number(context.parsed.y).toFixed(3)) + " °";
                  if(context.dataIndex>1){
                    let d = parseFloat(Number(hdg[context.dataIndex]-hdg[context.dataIndex-1]).toFixed(3));
                    label += " " + (d>0?("+"+d):d); 
                  } 
                  label += " (" + sailNames[sail.id[context.dataIndex]] +")";
                }
                return label;
              },
            }
          }		   
        },

        stacked: false,
        elements: {
          point:{
              radius: 0
          }
      },
        scales: {
          x: {
            ticks: {
              stepSize: 1,
              callback: function(value, index, values) {
                return dynamicTimeAxisTicks(value,values,ts);
              }
            },
          },
          y: {
            grid: {
              color: gridColor
            },
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {                
              stepSize: 1,
              callback: function(value, index, values) {
                if(value===0)
                  return value;
                else
                  return parseFloat(Number(value).toFixed(3))+"°"; 
                }
              
            },
            title : {
              display:true,
              text:"Boat heading"
            }
          },
        }
      },
    };

    if(hdgChart) hdgChart.destroy();
    var ctx = document.getElementById('hdgChart');
    hdgChart = new Chart(ctx, configChart);
}

function drawBoatSpeedChart(ts,bs,sail) {
  
  var gridColor = Chart.defaults.borderColor;
  if(document.documentElement.getAttribute("data-theme") =='dark')
    gridColor = 'rgba(255, 255, 255, 0.2)';
    const dataChart = {
        labels: ts,
        datasets: [
            {
            label: "Boat Speed",
            data: bs,
            yAxisID: 'y',
            colors :                   sail.color,
            pointBorderColor:          sail.color,
            pointBackgroundColor:      sail.color,
            pointHoverBackgroundColor: sail.color,
            pointHoverBorderColor:     sail.color,
            pointStyle: 'line',
            //backgroundColor: drawData.pointColor,
            segment: {
              borderColor: function(ctx) {
                return	sail.color[ctx.p0DataIndex];
              },
            },
            },
        ]
    };

    const zoomOptions = {
     /* limits: {
        x: {min: 0, max:350, minRange: 20}
      },*/
      pan: {
        enabled: true,
        mode: 'x',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'x',
        speed: 0.05
      }
    };
    const configChart = {
      type: 'CustomLineChart',
      data: dataChart,
      options: {
        responsive: true,
        maintainAspectRatio : false,

        legend: {
            labels: {
              fontColor: 'white'
            }
        },

        interaction: {
          mode: 'index',
          intersect: false,
        }, 
        plugins: {
          zoom: zoomOptions,
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {					
              title: function(tooltipItems, data) {
                let title = tooltipItems[0].label || '';
                return "Time : " + buildDate(title);
              },
              label: function(context) {
                let label = context.dataset.label || '';
  
                if (label) {
                  label += ' : ';
                }
                if (context.parsed.y !== null) {
                  label += parseFloat(Number(context.parsed.y).toFixed(3)) + " nds";
                  if(context.dataIndex>1){
                    let d = parseFloat(Number(bs[context.dataIndex]-bs[context.dataIndex-1]).toFixed(3));
                    label += " " + (d>0?("+"+d):d); 
                  } 
                  label += " (" + sailNames[sail.id[context.dataIndex]] +")";
                }
                return label;
              },
            }
          }		   
        },

        stacked: false,
        elements: {
          point:{
              radius: 0
          }
      },
        scales: {

          x: {
            ticks: {
              stepSize: 1,
              callback: function(value, index, values) {
                return dynamicTimeAxisTicks(value,values,ts);
              }
            },
          },
          y: {
            grid: {
              color: gridColor
            },
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {                
              stepSize: 1,
              callback: function(value, index, values) {
                if(value===0)
                  return value;
                else
                  return parseFloat(Number(value).toFixed(3))+"nds"; 
                }
              
            },
            title : {
              display:true,
              text:"Boat Speed"
            }
          },
        }
      },
    };

    if(bsChart) bsChart.destroy();
    var ctx = document.getElementById('bsChart');
    bsChart = new Chart(ctx, configChart);
}

function drawStaminaChart(ts,stamina,sail) {
  
  var gridColor = Chart.defaults.borderColor;
  if(document.documentElement.getAttribute("data-theme") =='dark')
    gridColor = 'rgba(255, 255, 255, 0.2)';
    const dataChart = {
        labels: ts,
        datasets: [
            {
            label: "Stamina",
            data: stamina,
            yAxisID: 'y',
            colors :                   sail.color,
            pointBorderColor:          sail.color,
            pointBackgroundColor:      sail.color,
            pointHoverBackgroundColor: sail.color,
            pointHoverBorderColor:     sail.color,
            pointStyle: 'line',
            //backgroundColor: drawData.pointColor,
            segment: {
              borderColor: function(ctx) {
                return	sail.color[ctx.p0DataIndex];
              },
            },
            },
        ]
    };

    const zoomOptions = {
     /* limits: {
        x: {min: 0, max:350, minRange: 20}
      },*/
      pan: {
        enabled: true,
        mode: 'x',
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        pinch: {
          enabled: true
        },
        mode: 'x',
        speed: 0.05
      }
    };
    const configChart = {
      type: 'CustomLineChart',
      data: dataChart,
      options: {
        responsive: true,
        maintainAspectRatio : false,

        interaction: {
          mode: 'index',
          intersect: false,
        }, 
        plugins: {
          zoom: zoomOptions,
          legend: {
            display: true
          },
          tooltip: {
            callbacks: {					
              title: function(tooltipItems, data) {
                let title = tooltipItems[0].label || '';
                return "Time : " + buildDate(title);
              },
              label: function(context) {
                let label = context.dataset.label || '';
  
                if (label) {
                  label += ' : ';
                }
                if (context.parsed.y !== null) {
                  label += parseFloat(Number(context.parsed.y).toFixed(3)) + " %"
                  if(context.dataIndex>1){
                    let d = parseFloat(Number(stamina[context.dataIndex]-stamina[context.dataIndex-1]).toFixed(3));
                    label += " " + (d>0?("+"+d):d); 
                  } 
                  label += " (" + sailNames[sail.id[context.dataIndex]] +")";
                }
                return label;
              },
            }
          }		   
        },

        stacked: false,
        elements: {
          point:{
              radius: 0
          }
      },
        scales: {
          x: {
            ticks: {
              stepSize: 1,
              callback: function(value, index, values) {
                return dynamicTimeAxisTicks(value,values,ts);
              }
            },
          },
          y: {
            grid: {
              color: gridColor
            },
            type: 'linear',
            display: true,
            position: 'left',
            ticks: {                
              stepSize: 1,
              callback: function(value, index, values) {
                if(value===0)
                  return value;
                else
                  return value+"%"; 
                }
              
            },
            title : {
              display:true,
              text:"Stamina"
            }
          },
        }
      },
    };

    if(staminaChart) staminaChart.destroy();
    var ctx = document.getElementById('staminaChart');
    staminaChart = new Chart(ctx, configChart);
}

function upDateGraph(data, autoUpdate = false) {
  if(data == null) 
  {
    if(twsChart) twsChart.destroy();
    if(twaChart) twaChart.destroy();
    if(twdChart) twdChart.destroy();
    if(hdgChart) hdgChart.destroy();
    if(bsChart) bsChart.destroy();
    if(staminaChart) staminaChart.destroy();
    return;
  }
  drawTWSChart(data.ts,data.tws,data.sail);
  drawTWAChart(data.ts,data.twa,data.sail);
  drawTWDChart(data.ts,data.twd,data.sail);
  drawHDGChart(data.ts,data.hdg,data.sail);
  drawBoatSpeedChart(data.ts,data.bs,data.sail);
  drawStaminaChart(data.ts,data.stamina,data.sail);

  if (autoUpdate) {
    setTimeout(autoUpdateCharts, 2000);
  }
}

function autoUpdateCharts() {
  twsChart.update('none');
  twaChart.update('none');
  twdChart.update('none');
  hdgChart.update('none');
  bsChart.update('none');
  staminaChart.update('none');
}

function buildDate(tps) {
    var a = new Date(Number(tps));
 /*   var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();*/
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();

    if(hour<10) hour = "0"+hour;
    if(min<10) min = "0"+min;
    if(sec<10) sec = "0"+sec;
    
    var pDate = /*date + ' ' + month + ' ' + year + ' ' + */hour + 'h' + min;
    if(sec!=0) pDate += ':' + sec ;
    return pDate;
}

function dynamicTimeAxisTicks(value,values,axisValue)
{
	//1 min max values	
	var min = 999999999999999999999;
	var max = 0;
  const min2ms = (60*1000);
	values.forEach(element => {
		var ws = Number(axisValue[element.value]);
		if(ws < min) min = ws ;
		if(ws  > max) max = ws ;
	});
	
	//2 delta donne modulo
	var delta = max-min;
	var mod = 10*min2ms;
	if(delta <= 10*min2ms) mod = min2ms;
	else if(delta <= 20*min2ms) mod = 2*min2ms;
	else if(delta <= 60*min2ms) mod = 5*min2ms;

	
	//return value;
	//3 build xref table
	var xref = [];
	for(var i=min;i<=max;) {
		xref.push(i);
		i += mod;
	}
	
	//4 test is value in ref table
	if(xref.find(element => element==axisValue[value]))
		return buildDate(axisValue[value]);
	else if(value===0)
		return value;
	
}

    export {
        onLoad,upDateGraph
    
    };