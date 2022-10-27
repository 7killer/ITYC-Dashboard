window.addEventListener("load", function () {
  const dataHolder = document.createElement("div");
  dataHolder.setAttribute("id", "itycDashId");
  document.body.appendChild(dataHolder);


  document.getElementById('itycDashId').setAttribute('ver', chrome.runtime.getManifest().version);
  document.getElementById('itycDashId').setAttribute('extId',    chrome.runtime.id);
});