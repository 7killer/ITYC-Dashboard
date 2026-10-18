function installItycDashId() {
  if(document.getElementById('itycDashId')) return;

  const dataHolder = document.createElement("div");
  dataHolder.setAttribute("id", "itycDashId");
  (document.body || document.documentElement).appendChild(dataHolder);


  document.getElementById('itycDashId').setAttribute('ver', chrome.runtime.getManifest().version);
  document.getElementById('itycDashId').setAttribute('extId',    chrome.runtime.id);
}

if(document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", installItycDashId);
  window.addEventListener("load", installItycDashId);
} else {
  installItycDashId();
}
