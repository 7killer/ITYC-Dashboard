// Sélectionner les éléments HTML
const updateButton = document.getElementById('updateButton');
const contentDiv = document.getElementById('content');

// Ajouter un événement au clic sur le bouton
updateButton.addEventListener('click', () => {
  // Générer du contenu aléatoire ou changer dynamiquement
  const newContent = `Contenu mis à jour à ${new Date().toLocaleTimeString()}`;
  
  // Modifier le contenu de la div
  contentDiv.textContent = newContent;
});

// Référence à l'élément de contenu

// Écouter les messages depuis le background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateContent') {
    // Mettre à jour dynamiquement le contenu du panel
    contentDiv.textContent = message.content;
  }
});