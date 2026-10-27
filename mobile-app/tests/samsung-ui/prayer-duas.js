(function(C) {
  "use strict";
  var panel = null, last = "", buttons = {}, words = { ar: ["\u0623\u0630\u0643\u0627\u0631 \u0627\u0644\u0635\u0628\u0627\u062D", "\u0623\u0630\u0643\u0627\u0631 \u0627\u0644\u0645\u0633\u0627\u0621", "\u062A\u0630\u0643\u064A\u0631 \u0628\u0623\u0630\u0643\u0627\u0631 \u0645\u0627 \u0628\u0639\u062F \u0627\u0644\u0635\u0644\u0627\u0629", "\u062F\u0639\u0627\u0621 \u0628\u064A\u0646 \u0627\u0644\u0635\u0644\u0648\u0627\u062A", "\u062F\u0639\u0627\u0621 \u0627\u0644\u064A\u0648\u0645", "\u0623\u062F\u0639\u064A\u0629 \u0648\u0623\u0630\u0643\u0627\u0631 \u0627\u0644\u0634\u0627\u0634\u0629", "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062F\u0639\u0627\u0621 \u0643\u0644", "\u062A\u0630\u0643\u064A\u0631 \u0628\u0639\u062F \u0645\u0648\u0639\u062F \u0627\u0644\u0635\u0644\u0627\u0629 \u0628\u0640", "\u062B\u0627\u0646\u064A\u0629", "\u062F\u0642\u064A\u0642\u0629", "\u0645\u0641\u0639\u0651\u0644", "\u0645\u062A\u0648\u0642\u0641", "\u0627\u0644\u0645\u0639\u0646\u0649", "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0623\u062F\u0639\u064A\u0629 \u062D\u0633\u0628 \u062A\u0648\u0642\u064A\u062A \u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u0635\u0644\u0627\u0629. \u062A\u0630\u0643\u064A\u0631 \u0645\u0627 \u0628\u0639\u062F \u0627\u0644\u0635\u0644\u0627\u0629 \u064A\u0628\u062F\u0623 \u0628\u0639\u062F \u0645\u0648\u0639\u062F \u0627\u0644\u0623\u0630\u0627\u0646 \u0628\u0627\u0644\u0645\u062F\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629\u061B \u0644\u0627 \u064A\u0643\u062A\u0634\u0641 \u0627\u0646\u062A\u0647\u0627\u0621 \u0635\u0644\u0627\u062A\u0643. \u0645\u062F\u0629 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0646\u0635 \u0625\u0639\u062F\u0627\u062F \u0639\u0631\u0636 \u0648\u0644\u064A\u0633\u062A \u0639\u062F\u062F\u064B\u0627 \u0634\u0631\u0639\u064A\u064B\u0627 \u0644\u0644\u062A\u0643\u0631\u0627\u0631."], en: ["Morning remembrance", "Evening remembrance", "After-prayer remembrance reminder", "Supplication between prayers", "Daily supplication", "On-screen duas & remembrance", "Change text every", "Reminder after prayer time", "seconds", "minutes", "On", "Off", "Meaning", "Selection follows the prayer city\u2019s time. After-prayer reminders start after the configured delay from Adhan; prayer completion is not detected. Text rotation is a display setting, not a prescribed recitation count."], fr: ["\xC9vocations du matin", "\xC9vocations du soir", "Rappel apr\xE8s la pri\xE8re", "Invocation entre les pri\xE8res", "Invocation du jour", "Invocations \xE0 l\u2019\xE9cran", "Changer le texte toutes les", "Rappel apr\xE8s l\u2019heure de pri\xE8re", "secondes", "minutes", "Activ\xE9", "D\xE9sactiv\xE9", "Sens", "Le choix suit l\u2019heure de la ville de pri\xE8re. Le rappel commence apr\xE8s le d\xE9lai depuis l\u2019adhan, sans d\xE9tecter la fin de votre pri\xE8re. La rotation est un r\xE9glage d\u2019affichage, pas un nombre de r\xE9citations prescrit."], zh: ["\u6668\u95F4\u8BB0\u5FF5", "\u665A\u95F4\u8BB0\u5FF5", "\u793C\u62DC\u540E\u7684\u8BB0\u5FF5\u63D0\u9192", "\u793C\u62DC\u4E4B\u95F4\u7684\u7948\u7977", "\u65E5\u5E38\u7948\u7977", "\u5C4F\u5E55\u7948\u7977\u4E0E\u8BB0\u5FF5", "\u6587\u5B57\u5207\u6362\u95F4\u9694", "\u793C\u62DC\u65F6\u95F4\u540E\u7684\u63D0\u9192\u5EF6\u8FDF", "\u79D2", "\u5206\u949F", "\u5F00\u542F", "\u5173\u95ED", "\u542B\u4E49", "\u6309\u793C\u62DC\u57CE\u5E02\u7684\u65F6\u95F4\u9009\u62E9\u5185\u5BB9\u3002\u793C\u62DC\u540E\u63D0\u9192\u5728\u5BA3\u793C\u540E\u7ECF\u8FC7\u8BBE\u5B9A\u7684\u5EF6\u8FDF\u5F00\u59CB\uFF0C\u5E76\u4E0D\u68C0\u6D4B\u5B9E\u9645\u793C\u62DC\u662F\u5426\u7ED3\u675F\u3002\u6587\u5B57\u8F6E\u6362\u4EC5\u4E3A\u663E\u793A\u8BBE\u7F6E\uFF0C\u4E0D\u662F\u89C4\u5B9A\u7684\u8BF5\u8BFB\u6B21\u6570\u3002"], ja: ["\u671D\u306E\u7948\u5FF5", "\u5915\u306E\u7948\u5FF5", "\u793C\u62DD\u5F8C\u306E\u7948\u5FF5\u30EA\u30DE\u30A4\u30F3\u30C0\u30FC", "\u793C\u62DD\u306E\u9593\u306E\u7948\u9858", "\u65E5\u3005\u306E\u7948\u9858", "\u753B\u9762\u306E\u7948\u9858\u3068\u7948\u5FF5", "\u8868\u793A\u306E\u5207\u308A\u66FF\u3048\u9593\u9694", "\u793C\u62DD\u6642\u523B\u304B\u3089\u306E\u9045\u5EF6", "\u79D2", "\u5206", "\u30AA\u30F3", "\u30AA\u30D5", "\u610F\u5473", "\u793C\u62DD\u90FD\u5E02\u306E\u6642\u523B\u306B\u5F93\u3063\u3066\u9078\u3073\u307E\u3059\u3002\u5BA3\u793C\u304B\u3089\u8A2D\u5B9A\u6642\u9593\u5F8C\u306B\u8868\u793A\u3057\u3001\u5B9F\u969B\u306E\u793C\u62DD\u7D42\u4E86\u306F\u691C\u77E5\u3057\u307E\u305B\u3093\u3002\u8868\u793A\u9593\u9694\u306F\u5B97\u6559\u4E0A\u306E\u5531\u3048\u308B\u56DE\u6570\u3092\u5B9A\u3081\u308B\u3082\u306E\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002"] };
  function lang() {
    return window.MorphLocale ? MorphLocale.get() : "en";
  }
  function w() {
    return words[lang()] || words.en;
  }
  function cfg() {
    return C.settings.prayer || {};
  }
  function number(value, fallback, allowed) {
    return allowed.indexOf(Number(value)) >= 0 ? Number(value) : fallback;
  }
  function selection(context, settings) {
    var now = context.now, items = context.items || [], delay = number(settings.duaAfterMinutes, 15, [10, 15, 20, 30]) * 6e4;
    var prayers = items.filter(function(p) {
      return p.adhan && isFinite(p.at);
    }).sort(function(a, b) {
      return a.at - b.at;
    }), previous = prayers.filter(function(p) {
      return p.at <= now;
    }).pop(), next = prayers.filter(function(p) {
      return p.at > now;
    })[0];
    if (previous && now >= previous.at + delay && now < previous.at + delay + 18e5) return "after";
    function at(name) {
      var p = items.filter(function(p2) {
        return p2.name === name && isFinite(p2.at);
      })[0];
      return p && p.at;
    }
    var fajr = at("Fajr"), rise = at("Sunrise"), asr = at("Asr"), isha = at("Isha");
    if (fajr && rise && now >= fajr && now < rise + 36e5) return "morning";
    if (asr && isha && now >= asr && now < isha) return "evening";
    if (!items.length) {
      if (context.hour >= 5 && context.hour < 10) return "morning";
      if (context.hour >= 16 && context.hour < 21) return "evening";
    }
    return previous && next ? "between" : "general";
  }
  function save(key, value) {
    var settings = cfg();
    settings[key] = value;
    C.settings.prayer = settings;
    C.saveSettings();
    last = "";
    refresh();
    tick(Date.now());
  }
  function cycle(key, values, fallback) {
    var current = number(cfg()[key], fallback, values);
    save(key, values[(values.indexOf(current) + 1) % values.length]);
  }
  function ensure() {
    var root = document.getElementById("prayer-screen");
    if (!root) return false;
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "prayer-dua";
      panel.dataset.noTranslate = "";
      panel.innerHTML = '<div class="dua-meta"><strong id="dua-category"></strong><small id="dua-source"></small></div><p id="dua-arabic" lang="ar" dir="rtl"></p><p id="dua-meaning"></p>';
      document.getElementById("prayer-times").after(panel);
      var options = document.getElementById("prayer-options");
      [["enable", function() {
        save("duasEnabled", cfg().duasEnabled === false);
      }], ["interval", function() {
        cycle("duaSeconds", [30, 60, 120], 60);
      }], ["delay", function() {
        cycle("duaAfterMinutes", [10, 15, 20, 30], 15);
      }]].forEach(function(entry) {
        var b = document.createElement("button");
        b.id = "prayer-dua-" + entry[0];
        b.className = "prayer-button";
        b.dataset.noTranslate = "";
        b.onclick = entry[1];
        options.appendChild(b);
        buttons[entry[0]] = b;
      });
      var note = document.createElement("p");
      note.id = "prayer-dua-note";
      note.dataset.noTranslate = "";
      document.getElementById("prayer-settings").appendChild(note);
    }
    return true;
  }
  function refresh() {
    if (!ensure()) return;
    var a = w(), settings = cfg();
    buttons.enable.textContent = a[5] + " \xB7 " + a[settings.duasEnabled === false ? 11 : 10];
    buttons.enable.setAttribute("aria-pressed", String(settings.duasEnabled !== false));
    buttons.interval.textContent = a[6] + " " + number(settings.duaSeconds, 60, [30, 60, 120]) + " " + a[8];
    buttons.delay.textContent = a[7] + " " + number(settings.duaAfterMinutes, 15, [10, 15, 20, 30]) + " " + a[9];
    document.getElementById("prayer-dua-note").textContent = a[13];
    panel.hidden = settings.duasEnabled === false;
    document.getElementById("prayer-screen").classList.toggle("has-duas", !panel.hidden);
  }
  function tick(now) {
    var root = document.getElementById("prayer-screen");
    if (!root || root.hidden || document.hidden || !ensure()) return;
    var settings = cfg();
    panel.hidden = settings.duasEnabled === false;
    if (panel.hidden) return;
    var context = C.Prayer.context(now), group = selection(context, settings), pool = window.MorphDuaCatalog.filter(function(item2) {
      return item2.groups.indexOf(group) >= 0;
    }), seconds = number(settings.duaSeconds, 60, [30, 60, 120]), index = Math.floor(now / (seconds * 1e3)) % pool.length, item = pool[index], key = group + "|" + item.id + "|" + lang();
    if (key === last) return;
    last = key;
    var a = w(), category = { morning: 0, evening: 1, after: 2, between: 3, general: 4 }[group];
    document.getElementById("dua-category").textContent = a[category];
    document.getElementById("dua-source").textContent = lang() === "ar" ? item.source.replace("Abu Dawud", "\u0623\u0628\u0648 \u062F\u0627\u0648\u062F").replace("Muslim", "\u0635\u062D\u064A\u062D \u0645\u0633\u0644\u0645").replace("Quran", "\u0627\u0644\u0642\u0631\u0622\u0646") : item.source;
    document.getElementById("dua-source").dir = "ltr";
    document.getElementById("dua-arabic").textContent = item.ar;
    var meaning = document.getElementById("dua-meaning");
    meaning.hidden = lang() === "ar";
    meaning.textContent = lang() === "ar" ? "" : a[12] + ": " + (item[lang()] || item.en);
    meaning.dir = lang() === "ar" ? "rtl" : "ltr";
    panel.dataset.group = group;
    panel.dataset.dua = item.id;
  }
  C.Duas = { select: selection, refresh, tick };
  window.addEventListener("morphLanguage", function() {
    last = "";
    refresh();
    tick(Date.now());
  });
  window.addEventListener("morphViewer", function() {
    last = "";
    refresh();
    tick(Date.now());
  });
})(window.ClearTV);
