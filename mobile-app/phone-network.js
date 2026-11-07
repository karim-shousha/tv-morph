/* Only staged into Morph TV phone. Never injected into TV products. */
(function(){var mode='light';try{mode=JSON.parse(NetworkNative.settingsJson()).phoneAppearance==='dark'?'dark':'light';}catch(e){}document.documentElement.dataset.appAppearance=mode;document.documentElement.style.colorScheme=mode;document.documentElement.setAttribute('data-phone-network','');})();
