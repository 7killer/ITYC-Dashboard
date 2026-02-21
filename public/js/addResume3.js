window.addEventListener("load", function () {
  const dataHolder = document.createElement("div");
  dataHolder.setAttribute("id", "itycNDashId");
  document.body.appendChild(dataHolder);


  document.getElementById('itycNDashId').setAttribute('ver', chrome.runtime.getManifest().version);
  document.getElementById('itycNDashId').setAttribute('extId',    chrome.runtime.id);
});