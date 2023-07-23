var titleUrlBarH = 0;
var titleUrlBarD = false;

window.addEventListener("load", function () {
  if(titleUrlBarD)
  {
    var currentHeight =window.innerHeight|| document.documentElement.clientHeight|| 
    document.body.clientHeight;
    titleUrlBarH = 310-currentHeight;
    if(titleUrlBarH<0)titleUrlBarH=0;
    titleUrlBarD = true;
  }
});


function callInfoCourse() {
  var currentHeight =window.innerHeight|| document.documentElement.clientHeight|| 
  document.body.clientHeight;
  currentHeight += titleUrlBarH; //title / url bar
  console.log("W_Height :"+currentHeight);
  if (window.getComputedStyle(document.getElementById("tb_infocourse")).display == 'none') {
    document.getElementById("tb_infocourse").style="display:normal;";
     var newInfoHeight = document.getElementById("tb_infocourse").offsetHeight;
     var racebtHeight = document.getElementById("bt_infocourse").offsetHeight;
     var newHeight = currentHeight + newInfoHeight + racebtHeight;
     console.log("NW_Height :"+newHeight);
     window.resizeTo(400, newHeight);
  } else {
     var newInfoHeight = document.getElementById("tb_infocourse").offsetHeight;
     var racebtHeight = document.getElementById("bt_infocourse").offsetHeight;
     var newHeight = currentHeight - newInfoHeight +4;
     document.getElementById("tb_infocourse").style="display:none;";
     console.log("NW_Height :"+newHeight);
     window.resizeTo(400, newHeight);
  }
}

function callCopyValue() {
  var CopyText = document.getElementById("pos_v");
  CopyText.select();
  navigator.clipboard.writeText(CopyText.value);
}

document.getElementById("bt_infocourse").addEventListener("click", callInfoCourse);
document.getElementById("pos_v").addEventListener("click", callCopyValue);

