(function() {
  "use strict";
  var labels = { "ar": ["\u0627\u0646\u062A\u0647\u0649 \u0648\u0642\u062A \u0627\u0644\u0634\u0627\u0634\u0629 \u064A\u0627 \u0628\u0637\u0644!", "\u0623\u062D\u0633\u0646\u062A! \u062D\u0627\u0646 \u0648\u0642\u062A \u0627\u0644\u0644\u0639\u0628 \u0648\u0627\u0644\u062D\u0631\u0643\u0629 \u0628\u0639\u064A\u062F\u064B\u0627 \u0639\u0646 \u0627\u0644\u0634\u0627\u0634\u0629.", "\u0627\u0637\u0644\u0628 \u0645\u0646 \u0648\u0627\u0644\u062F\u064A\u0643 \u062A\u062D\u062F\u064A\u062F \u0648\u0642\u062A \u062C\u062F\u064A\u062F \u0639\u0646\u062F\u0645\u0627 \u064A\u0643\u0648\u0646 \u0645\u0646\u0627\u0633\u0628\u064B\u0627.", "\u0627\u0644\u0631\u062C\u0648\u0639 \u0644\u0644\u0631\u0626\u064A\u0633\u064A\u0629", "\u0644\u0644\u0623\u0647\u0644: \u0648\u0642\u062A \u062C\u062F\u064A\u062F", "\u0642\u0641\u0644 \u0628\u0631\u0642\u0645 \u0633\u0631\u064A \u062E\u0627\u0635", "\u0625\u0644\u063A\u0627\u0621 \u0642\u0641\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642", "\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u0633\u0645\u0648\u062D", "\u062A\u062D\u0631\u064A\u0643 \u0627\u0644\u062A\u0637\u0628\u064A\u0642", "\u0625\u063A\u0644\u0627\u0642"], "en": ["Screen time is up, superstar!", "Great job! It is time to play and move away from the screen.", "Ask your parents for more time when it is a good moment.", "Back to Home", "Parents: add time", "Set an app PIN", "Unlock this app", "Set time allowance", "Move app", "Close"], "fr": ["Le temps d\u2019\xE9cran est termin\xE9, champion !", "Bravo ! Place aux jeux et au mouvement, loin de l\u2019\xE9cran.", "Demande \xE0 tes parents du temps suppl\xE9mentaire au bon moment.", "Retour \xE0 l\u2019accueil", "Parents : ajouter du temps", "D\xE9finir le PIN de l\u2019application", "D\xE9verrouiller cette application", "D\xE9finir le temps autoris\xE9", "D\xE9placer l\u2019application", "Fermer"], "zh": ["\u5C0F\u660E\u661F\uFF0C\u5C4F\u5E55\u65F6\u95F4\u5230\u5566\uFF01", "\u505A\u5F97\u597D\uFF01\u73B0\u5728\u53BB\u73A9\u800D\u548C\u8FD0\u52A8\uFF0C\u8BA9\u773C\u775B\u4F11\u606F\u4E00\u4E0B\u3002", "\u9700\u8981\u66F4\u591A\u65F6\u95F4\u65F6\uFF0C\u8BF7\u548C\u5BB6\u957F\u5546\u91CF\u3002", "\u8FD4\u56DE\u4E3B\u9875", "\u5BB6\u957F\uFF1A\u589E\u52A0\u65F6\u95F4", "\u8BBE\u7F6E\u5E94\u7528 PIN", "\u89E3\u9501\u6B64\u5E94\u7528", "\u8BBE\u7F6E\u53EF\u7528\u65F6\u957F", "\u79FB\u52A8\u5E94\u7528", "\u5173\u95ED"], "ja": ["\u30B9\u30AF\u30EA\u30FC\u30F3\u30BF\u30A4\u30E0\u306F\u304A\u3057\u307E\u3044\uFF01", "\u3088\u304F\u3067\u304D\u307E\u3057\u305F\uFF01\u753B\u9762\u304B\u3089\u96E2\u308C\u3066\u3001\u904A\u3093\u3060\u308A\u4F53\u3092\u52D5\u304B\u3057\u305F\u308A\u3057\u307E\u3057\u3087\u3046\u3002", "\u3082\u3063\u3068\u4F7F\u3044\u305F\u3044\u3068\u304D\u306F\u3001\u304A\u3046\u3061\u306E\u4EBA\u3068\u76F8\u8AC7\u3057\u307E\u3057\u3087\u3046\u3002", "\u30DB\u30FC\u30E0\u306B\u623B\u308B", "\u4FDD\u8B77\u8005\uFF1A\u6642\u9593\u3092\u8FFD\u52A0", "\u30A2\u30D7\u30EA\u306E PIN \u3092\u8A2D\u5B9A", "\u3053\u306E\u30A2\u30D7\u30EA\u306E\u30ED\u30C3\u30AF\u3092\u89E3\u9664", "\u5229\u7528\u6642\u9593\u3092\u8A2D\u5B9A", "\u30A2\u30D7\u30EA\u3092\u79FB\u52D5", "\u9589\u3058\u308B"] };
  function words(lang) {
    return labels[lang] || labels.en;
  }
  window.FamilyScreens = { words, timeUp: function(options) {
    var w = words(options.language), root = document.createElement("div");
    root.id = "family-time-overlay";
    root.className = "family-time-overlay";
    root.setAttribute("data-no-translate", "");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.dir = options.language === "ar" ? "rtl" : "ltr";
    root.innerHTML = '<section class="family-time-card"><div class="family-stars" aria-hidden="true">\u2726 \u2605 \u2726</div><div class="family-planet" aria-hidden="true">\u2605</div><h1></h1><strong class="family-app-name"></strong><p class="family-play-message"></p><p class="family-parent-message"></p><div class="family-time-actions"><button class="family-home"></button><button class="family-parent"></button></div></section>';
    root.querySelector("h1").textContent = w[0];
    root.querySelector(".family-app-name").textContent = options.name || "";
    root.querySelector(".family-play-message").textContent = w[1];
    root.querySelector(".family-parent-message").textContent = w[2];
    root.querySelector(".family-home").textContent = w[3];
    root.querySelector(".family-parent").textContent = w[4];
    root.querySelector(".family-home").onclick = options.home;
    root.querySelector(".family-parent").onclick = options.parents;
    root.addEventListener("keydown", function(e) {
      if (e.keyCode === 27 || e.keyCode === 10009) {
        e.preventDefault();
        e.stopImmediatePropagation();
        options.home();
      } else if (e.keyCode >= 37 && e.keyCode <= 40) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var buttons = root.querySelectorAll("button");
        (document.activeElement === buttons[0] ? buttons[1] : buttons[0]).focus();
      } else if (e.keyCode === 13) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.repeat && document.activeElement.tagName === "BUTTON") document.activeElement.click();
      }
    }, true);
    document.body.appendChild(root);
    root.querySelector("button").focus();
    return root;
  } };
})();
