(function(C) {
  "use strict";
  var names = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"], root = null, days = [], generation = 0, signature = "", lastTick = Date.now(), foreground = true, audio = null, previous = null, oldBack = null, loading = false, error = "", cached = false;
  var words = { ar: ["\u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629", "\u0627\u0644\u0641\u062C\u0631", "\u0627\u0644\u0634\u0631\u0648\u0642", "\u0627\u0644\u0638\u0647\u0631", "\u0627\u0644\u0639\u0635\u0631", "\u0627\u0644\u0645\u063A\u0631\u0628", "\u0627\u0644\u0639\u0634\u0627\u0621", "\u0627\u0644\u0635\u0644\u0627\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629", "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0635\u0644\u0627\u0629", "\u0627\u0644\u0645\u062F\u064A\u0646\u0629", "\u0627\u0628\u062D\u062B \u0639\u0646 \u0645\u062F\u064A\u0646\u0629", "\u0628\u062D\u062B", "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062D\u0633\u0627\u0628", "\u0627\u0644\u0647\u064A\u0626\u0629 \u0627\u0644\u0645\u0635\u0631\u064A\u0629 \u0644\u0644\u0645\u0633\u0627\u062D\u0629", "\u0623\u0645 \u0627\u0644\u0642\u0631\u0649 \xB7 \u0645\u0643\u0629", "\u0623\u0645\u0631\u064A\u0643\u0627 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629 \xB7 ISNA", "\u0631\u0627\u0628\u0637\u0629 \u0627\u0644\u0639\u0627\u0644\u0645 \u0627\u0644\u0625\u0633\u0644\u0627\u0645\u064A", "\u0623\u0630\u0627\u0646 \u0645\u0635\u0631", "\u0623\u0630\u0627\u0646 \u0627\u0644\u062D\u0631\u0645 \u0627\u0644\u0645\u0643\u064A", "\u0635\u0648\u062A \u0627\u0644\u0623\u0630\u0627\u0646", "\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0623\u0630\u0627\u0646", "\u0625\u064A\u0642\u0627\u0641 \u0627\u0644\u0623\u0630\u0627\u0646", "\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0635\u0648\u062A", "\u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0623\u0630\u0627\u0646 \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627", "\u0645\u0641\u0639\u0651\u0644", "\u0645\u062A\u0648\u0642\u0641", "\u0627\u0644\u0645\u0630\u0647\u0628 \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0635\u0631", "\u0627\u0644\u062C\u0645\u0647\u0648\u0631", "\u062D\u0646\u0641\u064A", "\u0631\u062C\u0648\u0639", "\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0648\u0627\u0642\u064A\u062A", "\u0627\u062E\u062A\u0627\u0631 \u0645\u062F\u064A\u0646\u0629 \u0644\u0636\u0628\u0637 \u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629.", "\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0648\u0627\u0642\u064A\u062A\u2026", "\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0648\u0627\u0642\u064A\u062A. \u062C\u0631\u0651\u0628 \u0627\u0644\u062A\u062D\u062F\u064A\u062B.", "\u0645\u0648\u0627\u0642\u064A\u062A \u0645\u062D\u0641\u0648\u0638\u0629", "\u0627\u0644\u0645\u0648\u0642\u0639 \u062A\u0642\u0631\u064A\u0628\u064A\u061B \u0627\u062E\u062A\u0627\u0631 \u0645\u062F\u064A\u0646\u062A\u0643 \u0644\u0644\u062A\u0623\u0643\u062F.", "\u0627\u0644\u0623\u0630\u0627\u0646 \u064A\u0639\u0645\u0644 \u0623\u062B\u0646\u0627\u0621 \u0638\u0647\u0648\u0631 Morph TV \u0641\u0642\u0637\u061B \u0644\u0627 \u064A\u0639\u0645\u0644 \u0648\u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646 \u0645\u063A\u0644\u0642 \u0623\u0648 \u062F\u0627\u062E\u0644 \u062A\u0637\u0628\u064A\u0642 \u0622\u062E\u0631.", "\u0627\u0644\u0645\u0648\u0627\u0642\u064A\u062A \u062D\u0633\u0628 AlAdhan\u061B \u0631\u0627\u062C\u0639 \u062A\u0642\u0648\u064A\u0645 \u0645\u0633\u062C\u062F\u0643 \u0627\u0644\u0645\u062D\u0644\u064A.", "\u0644\u0627 \u062A\u0648\u062C\u062F \u0646\u062A\u0627\u0626\u062C", "\u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u0645\u062F\u064A\u0646\u0629 \u0648\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 \u0642\u0628\u0644 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0623\u0630\u0627\u0646.", "\u0627\u0644\u0635\u0648\u062A \u063A\u064A\u0631 \u0645\u062A\u0627\u062D. \u062C\u0631\u0651\u0628 \u062A\u0634\u063A\u064A\u0644\u0647 \u0645\u0646 \u0632\u0631 \u0627\u0644\u062A\u062C\u0631\u0628\u0629.", "\u0627\u0644\u0635\u0648\u062A", "\u0645\u0635\u0631", "\u0645\u0643\u0629", "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0642\u0633 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D\u0629", "\u0627\u0644\u0645\u062A\u0628\u0642\u064A", "\u0627\u0644\u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0645\u062D\u0644\u064A"], en: ["Prayer times", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Next prayer", "Prayer settings", "City", "Search for a city", "Search", "Calculation method", "Egyptian General Authority", "Umm Al-Qura \xB7 Makkah", "North America \xB7 ISNA", "Muslim World League", "Egypt Adhan", "Makkah Haram Adhan", "Adhan voice", "Preview Adhan", "Stop Adhan", "Volume", "Automatic Adhan", "On", "Off", "Asr calculation", "Standard", "Hanafi", "Back", "Refresh times", "Choose a city to set prayer times.", "Loading prayer times\u2026", "Prayer times could not load. Try refreshing.", "Saved times", "Approximate location; choose your city to confirm.", "Adhan plays only while Morph TV is visible; not in other apps or while the TV is off.", "Times from AlAdhan; compare with your local mosque calendar.", "No results", "Confirm your city and calculation method before enabling Adhan.", "Audio unavailable. Try the preview button.", "Audio", "Egypt", "Makkah", "Weather unavailable", "Remaining", "Local time"], fr: ["Horaires de pri\xE8re", "Fajr", "Lever du soleil", "Dhuhr", "Asr", "Maghrib", "Isha", "Prochaine pri\xE8re", "R\xE9glages de pri\xE8re", "Ville", "Rechercher une ville", "Rechercher", "M\xE9thode de calcul", "Autorit\xE9 \xE9gyptienne", "Umm Al-Qura \xB7 La Mecque", "Am\xE9rique du Nord \xB7 ISNA", "Ligue islamique mondiale", "Adhan d\u2019\xC9gypte", "Adhan du Haram de La Mecque", "Voix de l\u2019adhan", "\xC9couter l\u2019adhan", "Arr\xEAter l\u2019adhan", "Volume", "Adhan automatique", "Activ\xE9", "D\xE9sactiv\xE9", "Calcul du Asr", "Standard", "Hanafite", "Retour", "Actualiser les horaires", "Choisissez une ville pour les horaires.", "Chargement des horaires\u2026", "Impossible de charger les horaires. R\xE9essayez.", "Horaires enregistr\xE9s", "Position approximative ; confirmez votre ville.", "L\u2019adhan fonctionne uniquement lorsque Morph TV est visible, pas dans une autre application ni lorsque la TV est \xE9teinte.", "Horaires AlAdhan ; comparez avec le calendrier de votre mosqu\xE9e.", "Aucun r\xE9sultat", "Confirmez la ville et la m\xE9thode avant d\u2019activer l\u2019adhan.", "Audio indisponible. Essayez le bouton d\u2019\xE9coute.", "Audio", "\xC9gypte", "La Mecque", "M\xE9t\xE9o indisponible", "Temps restant", "Heure locale"], zh: ["\u793C\u62DC\u65F6\u95F4", "\u6668\u793C", "\u65E5\u51FA", "\u664C\u793C", "\u6661\u793C", "\u660F\u793C", "\u5BB5\u793C", "\u4E0B\u4E00\u6B21\u793C\u62DC", "\u793C\u62DC\u8BBE\u7F6E", "\u57CE\u5E02", "\u641C\u7D22\u57CE\u5E02", "\u641C\u7D22", "\u8BA1\u7B97\u65B9\u6CD5", "\u57C3\u53CA\u6D4B\u7ED8\u603B\u5C40", "\u4E4C\u59C6\u53E4\u62C9 \xB7 \u9EA6\u52A0", "\u5317\u7F8E \xB7 ISNA", "\u4E16\u754C\u7A46\u65AF\u6797\u8054\u76DF", "\u57C3\u53CA\u5BA3\u793C", "\u9EA6\u52A0\u7981\u5BFA\u5BA3\u793C", "\u5BA3\u793C\u58F0\u97F3", "\u8BD5\u542C\u5BA3\u793C", "\u505C\u6B62\u5BA3\u793C", "\u97F3\u91CF", "\u81EA\u52A8\u5BA3\u793C", "\u5F00\u542F", "\u5173\u95ED", "\u6661\u793C\u8BA1\u7B97", "\u6807\u51C6", "\u54C8\u4E43\u6590", "\u8FD4\u56DE", "\u5237\u65B0\u65F6\u95F4", "\u8BF7\u9009\u62E9\u57CE\u5E02\u4EE5\u8BBE\u7F6E\u793C\u62DC\u65F6\u95F4\u3002", "\u6B63\u5728\u52A0\u8F7D\u793C\u62DC\u65F6\u95F4\u2026", "\u65E0\u6CD5\u52A0\u8F7D\u65F6\u95F4\uFF0C\u8BF7\u5237\u65B0\u3002", "\u5DF2\u4FDD\u5B58\u65F6\u95F4", "\u4F4D\u7F6E\u4E3A\u4F30\u7B97\u503C\uFF0C\u8BF7\u786E\u8BA4\u57CE\u5E02\u3002", "\u4EC5\u5F53 Morph TV \u53EF\u89C1\u65F6\u64AD\u653E\u5BA3\u793C\uFF1B\u7535\u89C6\u5173\u95ED\u6216\u4F7F\u7528\u5176\u4ED6\u5E94\u7528\u65F6\u4E0D\u64AD\u653E\u3002", "\u65F6\u95F4\u7531 AlAdhan \u63D0\u4F9B\uFF0C\u8BF7\u4E0E\u5F53\u5730\u6E05\u771F\u5BFA\u65E5\u5386\u6838\u5BF9\u3002", "\u65E0\u7ED3\u679C", "\u542F\u7528\u5BA3\u793C\u524D\u8BF7\u786E\u8BA4\u57CE\u5E02\u548C\u8BA1\u7B97\u65B9\u6CD5\u3002", "\u97F3\u9891\u4E0D\u53EF\u7528\uFF0C\u8BF7\u5C1D\u8BD5\u8BD5\u542C\u6309\u94AE\u3002", "\u97F3\u9891", "\u57C3\u53CA", "\u9EA6\u52A0", "\u5929\u6C14\u4E0D\u53EF\u7528", "\u5269\u4F59\u65F6\u95F4", "\u5F53\u5730\u65F6\u95F4"], ja: ["\u793C\u62DD\u6642\u523B", "\u30D5\u30A1\u30B8\u30E5\u30EB", "\u65E5\u306E\u51FA", "\u30BA\u30D5\u30EB", "\u30A2\u30B9\u30EB", "\u30DE\u30B0\u30EA\u30D6", "\u30A4\u30B7\u30E3\u30FC", "\u6B21\u306E\u793C\u62DD", "\u793C\u62DD\u8A2D\u5B9A", "\u90FD\u5E02", "\u90FD\u5E02\u3092\u691C\u7D22", "\u691C\u7D22", "\u8A08\u7B97\u65B9\u6CD5", "\u30A8\u30B8\u30D7\u30C8\u6E2C\u91CF\u5E81", "\u30A6\u30F3\u30E0\u30FB\u30A2\u30EB\u30AF\u30E9\u30FC \xB7 \u30E1\u30C3\u30AB", "\u5317\u7C73 \xB7 ISNA", "\u4E16\u754C\u30A4\u30B9\u30E9\u30E0\u9023\u76DF", "\u30A8\u30B8\u30D7\u30C8\u306E\u30A2\u30B6\u30FC\u30F3", "\u30E1\u30C3\u30AB\u8056\u30E2\u30B9\u30AF\u306E\u30A2\u30B6\u30FC\u30F3", "\u30A2\u30B6\u30FC\u30F3\u306E\u58F0", "\u30A2\u30B6\u30FC\u30F3\u3092\u8A66\u8074", "\u30A2\u30B6\u30FC\u30F3\u3092\u505C\u6B62", "\u97F3\u91CF", "\u81EA\u52D5\u30A2\u30B6\u30FC\u30F3", "\u30AA\u30F3", "\u30AA\u30D5", "\u30A2\u30B9\u30EB\u306E\u8A08\u7B97", "\u6A19\u6E96", "\u30CF\u30CA\u30D5\u30A3\u30FC\u6D3E", "\u623B\u308B", "\u6642\u523B\u3092\u66F4\u65B0", "\u793C\u62DD\u6642\u523B\u3092\u8A2D\u5B9A\u3059\u308B\u90FD\u5E02\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002", "\u793C\u62DD\u6642\u523B\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026", "\u6642\u523B\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3002\u66F4\u65B0\u3057\u3066\u304F\u3060\u3055\u3044\u3002", "\u4FDD\u5B58\u6E08\u307F\u306E\u6642\u523B", "\u63A8\u5B9A\u4F4D\u7F6E\u3067\u3059\u3002\u90FD\u5E02\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002", "Morph TV \u304C\u8868\u793A\u4E2D\u306E\u307F\u518D\u751F\u3057\u307E\u3059\u3002\u4ED6\u306E\u30A2\u30D7\u30EA\u4F7F\u7528\u4E2D\u3084\u30C6\u30EC\u30D3\u306E\u96FB\u6E90\u30AA\u30D5\u6642\u306B\u306F\u518D\u751F\u3057\u307E\u305B\u3093\u3002", "AlAdhan \u306E\u6642\u523B\u3067\u3059\u3002\u5730\u5143\u306E\u30E2\u30B9\u30AF\u306E\u66A6\u3068\u7167\u5408\u3057\u3066\u304F\u3060\u3055\u3044\u3002", "\u7D50\u679C\u304C\u3042\u308A\u307E\u305B\u3093", "\u81EA\u52D5\u518D\u751F\u306E\u524D\u306B\u90FD\u5E02\u3068\u8A08\u7B97\u65B9\u6CD5\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002", "\u97F3\u58F0\u3092\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u8A66\u8074\u30DC\u30BF\u30F3\u3092\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002", "\u97F3\u58F0", "\u30A8\u30B8\u30D7\u30C8", "\u30E1\u30C3\u30AB", "\u5929\u6C17\u60C5\u5831\u304C\u3042\u308A\u307E\u305B\u3093", "\u6B8B\u308A\u6642\u9593", "\u73FE\u5730\u6642\u523B"] };
  function lang() {
    return window.MorphLocale ? MorphLocale.get() : "en";
  }
  function t(n) {
    return (words[lang()] || words.en)[n];
  }
  function cfg() {
    return C.settings.prayer || { method: 5, school: 0, voice: "egypt", volume: 60, enabled: false, breakEnabled: false, location: null };
  }
  function save(patch) {
    var value = cfg();
    Object.keys(patch).forEach(function(k) {
      value[k] = patch[k];
    });
    C.settings.prayer = value;
    C.saveSettings();
    stop();
    signature = "";
    load(false);
    render();
  }
  var breakWords = { ar: ["\u0627\u0633\u062A\u0631\u0627\u062D\u0629 \u0627\u0644\u0635\u0644\u0627\u0629 \xB7 10 \u062F\u0642\u0627\u0626\u0642", "\u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0645\u062A\u0648\u0642\u0641\u0629 \u0645\u0624\u0642\u062A\u064B\u0627 \u0644\u0644\u0635\u0644\u0627\u0629", "\u064A\u0641\u062A\u062D \u0627\u0644\u062A\u0637\u0628\u064A\u0642\u0627\u062A \u0645\u0646 \u062C\u062F\u064A\u062F \u0628\u0639\u062F \u0627\u0646\u062A\u0647\u0627\u0621 \u0627\u0644\u0639\u062F\u0651 \u0627\u0644\u062A\u0646\u0627\u0632\u0644\u064A. \u0627\u0644\u0645\u0646\u0639 \u062F\u0627\u062E\u0644 Morph TV \u0641\u0642\u0637 \u0648\u064A\u062A\u0637\u0644\u0628 \u0645\u0648\u0627\u0642\u064A\u062A \u0635\u062D\u064A\u062D\u0629.", "\u0625\u063A\u0644\u0627\u0642"], en: ["Prayer break \xB7 10 minutes", "Apps are paused for prayer", "Apps unlock when the countdown ends. Applies inside Morph TV only and requires valid prayer times.", "Close"], fr: ["Pause pri\xE8re \xB7 10 minutes", "Applications en pause pour la pri\xE8re", "Les applications seront disponibles \xE0 la fin du compte \xE0 rebours. Uniquement dans Morph TV, avec des horaires valides.", "Fermer"], zh: ["\u793C\u62DC\u4F11\u606F \xB7 10 \u5206\u949F", "\u793C\u62DC\u671F\u95F4\u6682\u505C\u6253\u5F00\u5E94\u7528", "\u5012\u8BA1\u65F6\u7ED3\u675F\u540E\u6062\u590D\u3002\u4EC5\u9002\u7528\u4E8E Morph TV \u5185\u90E8\uFF0C\u9700\u6709\u6548\u793C\u62DC\u65F6\u95F4\u3002", "\u5173\u95ED"], ja: ["\u793C\u62DD\u4F11\u61A9 \xB7 10 \u5206", "\u793C\u62DD\u306E\u305F\u3081\u30A2\u30D7\u30EA\u3092\u4E00\u6642\u505C\u6B62", "\u30AB\u30A6\u30F3\u30C8\u30C0\u30A6\u30F3\u7D42\u4E86\u5F8C\u306B\u518D\u958B\u3057\u307E\u3059\u3002Morph TV \u5185\u306E\u307F\u3067\u6709\u52B9\u3001\u6B63\u78BA\u306A\u793C\u62DD\u6642\u523B\u304C\u5FC5\u8981\u3067\u3059\u3002", "\u9589\u3058\u308B"] };
  function bt(i) {
    return (breakWords[lang()] || breakWords.en)[i];
  }
  function breakState() {
    var now = Date.now(), until = 0, name = "";
    if (C.settings.showPrayer !== false && cfg().breakEnabled === true) days.forEach(function(day) {
      day.items.forEach(function(item) {
        if (item.adhan && now >= item.at && now < item.at + 6e5 && item.at + 6e5 > until) {
          until = item.at + 6e5;
          name = item.name;
        }
      });
    });
    return { active: until > now, until, name, remainingMs: Math.max(0, until - now) };
  }
  var breakOverlay = null, breakPrevious = null, breakShownUntil = 0, previewUntil = 0;
  var pauseWords = { ar: ["\u0644\u0627 \u062A\u062C\u0639\u0644 \u0634\u064A\u0626\u064B\u0627 \u064A\u0644\u0647\u064A\u0643 \u0639\u0646 \u0627\u0644\u0635\u0644\u0627\u0629", "\u0645\u0639\u0627\u064A\u0646\u0629 \u0634\u0627\u0634\u0629 \u0627\u0644\u0635\u0644\u0627\u0629", "\u062D\u0627\u0646 \u0648\u0642\u062A \u0627\u0644\u0635\u0644\u0627\u0629"], en: ["Let nothing distract you from prayer", "Preview prayer screen", "It is time for prayer"], fr: ["Ne laissez rien vous distraire de la pri\xE8re", "Aper\xE7u de la pause pri\xE8re", "Il est temps de prier"], zh: ["\u4E0D\u8981\u8BA9\u4EFB\u4F55\u4E8B\u7269\u4F7F\u4F60\u5FFD\u7565\u793C\u62DC", "\u9884\u89C8\u793C\u62DC\u753B\u9762", "\u793C\u62DC\u65F6\u95F4\u5230\u4E86"], ja: ["\u4F55\u4E8B\u306B\u3082\u793C\u62DD\u3092\u59A8\u3052\u3089\u308C\u306A\u3044\u3088\u3046\u306B", "\u793C\u62DD\u753B\u9762\u3092\u30D7\u30EC\u30D3\u30E5\u30FC", "\u793C\u62DD\u306E\u6642\u9593\u3067\u3059"] };
  function pt(i) {
    return (pauseWords[lang()] || pauseWords.en)[i];
  }
  function closeBreak() {
    if (!breakOverlay) return;
    breakOverlay.remove();
    breakOverlay = null;
    previewUntil = 0;
    C.Focus.setScope(root && !root.hidden ? root : document);
    C.Focus.focus(breakPrevious);
  }
  function renderBreak() {
    if (!breakOverlay) return;
    var state = previewUntil > Date.now() ? { active: true, remainingMs: previewUntil - Date.now(), name: "" } : breakState();
    if (!state.active) {
      closeBreak();
      return;
    }
    var seconds = Math.ceil(state.remainingMs / 1e3);
    breakOverlay.querySelector("time").textContent = String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0");
    breakOverlay.querySelector("h2").textContent = pt(0);
    breakOverlay.querySelector(".pause-prayer-name").textContent = pt(2) + (state.name ? " \xB7 " + t(names.indexOf(state.name) + 1) : "");
    breakOverlay.querySelector("p").textContent = bt(2);
    breakOverlay.querySelector("button").textContent = bt(3);
    breakOverlay.querySelector("section").dir = lang() === "ar" ? "rtl" : "ltr";
  }
  function showBreak(preview) {
    if (preview) previewUntil = Date.now() + 3e4;
    if (!breakOverlay) {
      breakPrevious = document.activeElement;
      breakOverlay = C.el("div", "overlay");
      breakOverlay.id = "prayer-break-overlay";
      breakOverlay.setAttribute("data-no-translate", "");
      breakOverlay.innerHTML = '<section class="prayer-break-dialog" role="dialog" aria-modal="true"><div class="pause-prayer-name"></div><h2></h2><time dir="ltr"></time><p></p><button class="primary"></button></section>';
      document.body.appendChild(breakOverlay);
      breakOverlay.querySelector("button").onclick = closeBreak;
      C.Focus.setScope(breakOverlay);
      C.Focus.focus(breakOverlay.querySelector("button"));
    }
    renderBreak();
  }
  function allowLaunch() {
    if (!breakState().active) return true;
    previewUntil = 0;
    showBreak(false);
    return false;
  }
  document.addEventListener("keydown", function(e) {
    if (breakOverlay && (e.keyCode === 27 || e.keyCode === 10009)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      closeBreak();
    }
  }, true);
  document.addEventListener("click", function(e) {
    var button2 = e.target.closest("[data-app-id],[data-favourite-id],#home-store,#home-internet,#home-inputs,#open-iptv,#nav-iptv");
    if (!button2) return;
    var id = button2.dataset.appId || button2.dataset.favouriteId;
    if (id === "local.tvmorph.tv.prayer") return;
    if (!allowLaunch()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  function loc() {
    return cfg().location || (C.settings.locationMode === "manual" ? C.settings.manualLocation : null) || C.Weather.state.location;
  }
  function parts(epoch, zone) {
    if (window.moment && moment.tz.zone(zone)) {
      var m = moment.tz(epoch, zone);
      return { year: m.year(), month: m.month() + 1, day: m.date(), hour: m.hour(), minute: m.minute(), second: m.second() };
    }
    var result = {};
    new Intl.DateTimeFormat("en-GB", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(new Date(epoch)).forEach(function(p) {
      if (p.type !== "literal") result[p.type] = Number(p.value);
    });
    if (result.hour === 24) result.hour = 0;
    return result;
  }
  function stamp(p) {
    return Date.UTC(p.year, p.month - 1, p.day, p.hour || 0, p.minute || 0, p.second || 0);
  }
  function dateKey(p) {
    return String(p.day).padStart(2, "0") + "-" + String(p.month).padStart(2, "0") + "-" + p.year;
  }
  function timeAt(date, value, zone) {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value || "")) {
      var pieces = date.split("-"), expected = pieces[2] + "-" + pieces[1] + "-" + pieces[0];
      var epoch = Date.parse(value);
      return value.slice(0, 10) === expected && isFinite(epoch) ? epoch : NaN;
    }
    var match = /^(\d{2}):(\d{2})/.exec(value || "");
    if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return NaN;
    var a = date.split("-").map(Number), target = Date.UTC(a[2], a[1] - 1, a[0], Number(match[1]), Number(match[2])), guess = target;
    for (var i = 0; i < 4; i++) {
      var delta = target - stamp(parts(guess, zone));
      guess += delta;
      if (!delta) break;
    }
    var p = parts(guess, zone);
    return p.year === a[2] && p.month === a[1] && p.day === a[0] && p.hour === Number(match[1]) && p.minute === Number(match[2]) ? guess : NaN;
  }
  function model(data, date) {
    if (!data || !data.timings || !data.meta || !data.meta.timezone || !data.date || !data.date.gregorian || data.date.gregorian.date !== date) throw Error("Invalid prayer response");
    var zone = data.meta.timezone;
    var items = names.map(function(name) {
      var time = data.timings[name], at = timeAt(date, time, zone);
      if (!isFinite(at)) throw Error("Prayer time unavailable");
      return { name, time: (String(time).match(/(?:T|^)(\d{2}:\d{2})/) || ["", "\u2014:\u2014"])[1], at, adhan: name !== "Sunrise" };
    });
    return { date, zone, items, hijri: data.date && data.date.hijri };
  }
  function key(location, date) {
    return [location.latitude.toFixed(4), location.longitude.toFixed(4), cfg().method || 5, cfg().school || 0, location.timezone || "", date].join("|");
  }
  function requestDay(location, date, force, callback) {
    var cache = C.read("prayerCacheV1", {}), id = key(location, date);
    if (!force && cache[id]) {
      try {
        callback(null, model(cache[id], date), true);
        return;
      } catch (e) {
        delete cache[id];
      }
    }
    var url = "https://api.aladhan.com/v1/timings/" + date + "?latitude=" + encodeURIComponent(location.latitude) + "&longitude=" + encodeURIComponent(location.longitude) + "&method=" + (cfg().method || 5) + "&school=" + (cfg().school || 0) + "&iso8601=true";
    if (location.timezone) url += "&timezonestring=" + encodeURIComponent(location.timezone);
    C.request(url, function(err, response) {
      try {
        if (err) throw err;
        if (!response || response.code !== 200) throw Error("Prayer service unavailable");
        var value = model(response.data, date);
        cache[id] = response.data;
        var keys = Object.keys(cache);
        while (keys.length > 8) delete cache[keys.shift()];
        C.write("prayerCacheV1", cache);
        callback(null, value, false);
      } catch (e) {
        if (cache[id]) {
          try {
            callback(null, model(cache[id], date), true);
            return;
          } catch (ignore) {
          }
        }
        callback(e);
      }
    });
  }
  function load(force) {
    if (C.settings.showPrayer === false) return;
    var location = loc();
    if (!location || !isFinite(location.latitude) || !isFinite(location.longitude)) {
      days = [];
      error = t(31);
      render();
      return;
    }
    var zone = location.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    var today;
    try {
      today = parts(Date.now(), zone);
    } catch (e) {
      days = [];
      error = t(33);
      render();
      return;
    }
    var signatureNext = key(location, dateKey(today));
    if (!force && signatureNext === signature) return;
    signature = signatureNext;
    var seq = ++generation;
    loading = true;
    error = "";
    days = [];
    render();
    requestDay(location, dateKey(today), force, function(err, first, wasCached) {
      if (seq !== generation) return;
      loading = false;
      if (err) {
        signature = "";
        error = t(33);
        render();
        return;
      }
      days = [first];
      cached = wasCached;
      var localDate = parts(Date.now(), first.zone);
      if (dateKey(localDate) !== first.date) {
        location = Object.assign({}, location, { timezone: first.zone });
        signature = "";
        C.settings.prayer = Object.assign({}, cfg(), { location });
        load(false);
        return;
      }
      var tomorrow = new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day + 1)), next = { year: tomorrow.getUTCFullYear(), month: tomorrow.getUTCMonth() + 1, day: tomorrow.getUTCDate() };
      requestDay(location, dateKey(next), force, function(e, d) {
        if (seq !== generation) return;
        if (!e) days.push(d);
        else error = t(33);
        render();
      });
      render();
    });
  }
  var audioLimit = null, audioRun = 0, lastAudioStart = -1e4;
  function stop() {
    clearTimeout(audioLimit);
    audioLimit = null;
    audioRun++;
    var previousAudio = audio;
    audio = null;
    if (previousAudio) {
      previousAudio.onended = null;
      previousAudio.onerror = null;
      previousAudio.pause();
      if (previousAudio.removeAttribute) previousAudio.removeAttribute("src");
      if (previousAudio.load) previousAudio.load();
    }
    if (root) root.classList.remove("adhan-playing");
  }
  function play() {
    window.dispatchEvent(new Event("morphAudioExclusive"));
    var now = Date.now();
    if (audio && now - lastAudioStart < 1e3) return;
    stop();
    lastAudioStart = now;
    var current = new Audio(), run = ++audioRun;
    audio = current;
    current.loop = false;
    current.autoplay = false;
    current.onended = function() {
      if (run === audioRun) stop();
    };
    current.onerror = function() {
      if (run !== audioRun) return;
      stop();
      error = t(40);
      render();
    };
    current.src = "assets/prayer-" + (cfg().voice === "makka" ? "makka" : "egypt") + ".mp3";
    current.volume = Math.max(0, Math.min(1, (Number(cfg().volume) || 0) / 100));
    audioLimit = setTimeout(function() {
      if (run === audioRun) stop();
    }, 27e4);
    var result = current.play();
    if (result && result.catch) result.catch(function() {
      if (run !== audioRun) return;
      stop();
      error = t(40);
      render();
    });
    if (root) root.classList.add("adhan-playing");
  }
  var firedMemory = {};
  function claimAdhan(p) {
    var id = p.name + "|" + p.at, stored = C.read("adhanFiredV2", []);
    if (firedMemory[id] || stored.indexOf(id) >= 0) return false;
    firedMemory[id] = true;
    stored.push(id);
    C.write("adhanFiredV2", stored.slice(-48));
    return true;
  }
  function nextPrayer(now) {
    var items = [];
    days.forEach(function(d) {
      items = items.concat(d.items);
    });
    return items.filter(function(p) {
      return p.adhan && p.at > now;
    }).sort(function(a, b) {
      return a.at - b.at;
    })[0];
  }
  var homeWidget;
  function renderHome() {
    if (!homeWidget) return;
    var next = nextPrayer(Date.now()), seconds = next ? Math.max(0, Math.floor((next.at - Date.now()) / 1e3)) : 0;
    homeWidget.dataset.ready = next ? "true" : "false";
    homeWidget.dir = lang() === "ar" ? "rtl" : "ltr";
    homeWidget.querySelector("small").textContent = t(7);
    homeWidget.querySelector("strong").textContent = next ? t(names.indexOf(next.name) + 1) : t(31);
    homeWidget.querySelector("time").textContent = next ? [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(function(n) {
      return String(n).padStart(2, "0");
    }).join(":") : "\u2014:\u2014:\u2014";
  }
  function tick() {
    var pause = breakState();
    if (pause.active && pause.until !== breakShownUntil && foreground && !document.hidden && !document.getElementById("view-home").hidden) {
      breakShownUntil = pause.until;
      showBreak(false);
    }
    renderBreak();
    renderHome();
    var now = Date.now(), gap = now - lastTick;
    var active = foreground && !document.hidden && !document.body.classList.contains("watching") && !document.getElementById("samsung-media-frame");
    if (C.settings.showPrayer !== false && cfg().enabled && active && gap > 0 && gap < 9e4) {
      days.forEach(function(d) {
        d.items.forEach(function(p) {
          if (!p.adhan || p.at <= lastTick || p.at > now || now - p.at > 9e4) return;
          if (!claimAdhan(p)) return;
          play();
        });
      });
    }
    lastTick = now;
    if (root && !root.hidden) {
      renderClock();
      if (C.Duas) C.Duas.tick(now);
    }
    if (!loading && loc()) {
      var zone = days[0] && days[0].zone || loc().timezone;
      try {
        if (zone && days[0] && dateKey(parts(now, zone)) !== days[0].date) {
          signature = "";
          load(false);
        }
      } catch (e) {
      }
    }
  }
  function button(id, text, action) {
    var b = C.el("button", "prayer-button", text);
    b.id = id;
    b.onclick = action;
    return b;
  }
  function make() {
    root = C.el("section", "prayer-screen");
    root.id = "prayer-screen";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("data-no-translate", "");
    root.innerHTML = '<div class="prayer-content" data-scroll="vertical"><header class="prayer-header"><div><span class="eyebrow">MORPH TV</span><h1 id="prayer-heading"></h1><p id="prayer-place"></p></div><div id="prayer-actions"></div></header><div id="prayer-error" role="status"></div><div class="prayer-overview"><article class="prayer-glass prayer-weather"><div id="prayer-weather-icon"></div><strong id="prayer-weather-temp"></strong><p id="prayer-weather-description"></p></article><article class="prayer-glass prayer-clock"><div id="prayer-clock"></div><p id="prayer-date"></p><p id="prayer-hijri"></p><div class="prayer-countdown"><span id="prayer-next"></span><strong id="prayer-countdown"></strong></div></article></div><div id="prayer-times" class="prayer-times"></div><div id="prayer-settings" class="prayer-glass" hidden><h2 id="prayer-settings-title"></h2><div class="prayer-location-search"><input id="prayer-city" maxlength="100"><button id="prayer-search"></button></div><div id="prayer-city-results"></div><div id="prayer-options" class="prayer-options"></div><label for="prayer-volume" id="prayer-volume-label"></label><input id="prayer-volume" type="range" min="0" max="100" step="5"><p id="prayer-confirm"></p></div><footer><p id="prayer-audio-note"></p><p id="prayer-source"></p></footer></div>';
    document.body.appendChild(root);
    var settingsPanel = document.querySelector("#prayer-settings");
    settingsPanel.hidden = true;
    settingsPanel.className = "prayer-settings-panel";
    settingsPanel.setAttribute("data-no-translate", "");
    var grid = document.querySelector("#view-settings .settings-grid");
    var settingsGroup = C.el("section", "settings-panel prayer-settings-section");
    settingsGroup.id = "prayer-settings-section";
    settingsGroup.setAttribute("data-no-translate", "");
    var entry = button("prayer-settings-entry", t(8), function() {
      expandSettings();
    });
    entry.className = "setting";
    settingsGroup.appendChild(entry);
    settingsGroup.appendChild(settingsPanel);
    grid.insertBefore(settingsGroup, grid.firstChild);
    var backButton = button("prayer-settings-back", t(29), function() {
      collapseSettings(true);
    });
    settingsPanel.insertBefore(backButton, document.querySelector("#prayer-settings-title").nextSibling);
    var place = C.el("p");
    place.id = "prayer-settings-place";
    settingsPanel.insertBefore(place, document.querySelector(".prayer-location-search"));
    var status = C.el("p");
    status.id = "prayer-settings-status";
    status.setAttribute("role", "status");
    settingsPanel.insertBefore(status, place.nextSibling);
    document.querySelector("#prayer-actions").appendChild(button("prayer-settings-open", "", openSettings));
    document.querySelector("#prayer-actions").appendChild(button("prayer-refresh", "", function() {
      load(true);
    }));
    document.querySelector("#prayer-actions").appendChild(button("prayer-stop", "", stop));
    document.querySelector("#prayer-actions").appendChild(button("prayer-back", "", close));
    document.querySelector("#prayer-search").onclick = searchCity;
    document.querySelector("#prayer-city").onkeydown = function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopImmediatePropagation();
        searchCity();
      }
    };
    var options = document.querySelector("#prayer-options");
    options.appendChild(button("prayer-method", "", function() {
      var methods = [5, 4, 2, 3], index = methods.indexOf(cfg().method || 5);
      save({ method: methods[(index + 1) % methods.length] });
    }));
    options.appendChild(button("prayer-school", "", function() {
      save({ school: cfg().school ? 0 : 1 });
    }));
    options.appendChild(button("prayer-voice", "", function() {
      save({ voice: cfg().voice === "makka" ? "egypt" : "makka" });
    }));
    options.appendChild(button("prayer-enable", "", function() {
      if (!loc() || !days.length) {
        error = t(39);
        render();
        return;
      }
      save({ enabled: !cfg().enabled });
    }));
    options.appendChild(button("prayer-preview", "", play));
    options.appendChild(button("prayer-settings-stop", "", stop));
    options.appendChild(button("prayer-settings-refresh", "", function() {
      load(true);
    }));
    document.querySelector("#prayer-volume").oninput = function(e) {
      var c = cfg();
      c.volume = Number(e.target.value);
      C.settings.prayer = c;
      C.saveSettings();
      if (audio) audio.volume = c.volume / 100;
      renderLabels();
    };
  }
  function searchCity() {
    var term = document.querySelector("#prayer-city").value;
    var results = document.querySelector("#prayer-city-results");
    results.textContent = t(32);
    var seq = ++searchCity.generation;
    C.Weather.search(term, function(err, rows) {
      if (seq !== searchCity.generation) return;
      results.textContent = err ? t(33) : rows.length ? "" : t(38);
      (rows || []).forEach(function(location) {
        results.appendChild(button("", location.name + " \xB7 " + location.country, function() {
          save({ location, enabled: false });
          C.Weather.choose(location);
          results.textContent = "";
          document.querySelector("#prayer-city").value = location.name;
        }));
      });
    });
  }
  searchCity.generation = 0;
  function renderLabels() {
    if (!root) return;
    if (C.Duas) C.Duas.refresh();
    var breakButton = document.querySelector("#prayer-break-toggle");
    if (!breakButton) {
      breakButton = button("prayer-break-toggle", "", function() {
        save({ breakEnabled: !cfg().breakEnabled });
      });
      document.querySelector("#prayer-options").appendChild(breakButton);
      var note = C.el("p", "", bt(2));
      note.id = "prayer-break-note";
      document.querySelector("#prayer-settings").appendChild(note);
    }
    var preview = document.getElementById("prayer-screen-preview");
    if (!preview) {
      preview = button("prayer-screen-preview", "", function() {
        showBreak(true);
      });
      document.querySelector("#prayer-options").appendChild(preview);
    }
    preview.textContent = pt(1);
    breakButton.textContent = bt(0) + " \xB7 " + t(cfg().breakEnabled ? 24 : 25);
    breakButton.setAttribute("aria-pressed", cfg().breakEnabled ? "true" : "false");
    document.querySelector("#prayer-break-note").textContent = bt(2);
    root.dir = lang() === "ar" ? "rtl" : "ltr";
    document.querySelector("#prayer-settings").dir = root.dir;
    document.querySelector("#prayer-settings-entry").textContent = t(8);
    document.querySelector("#prayer-settings-back").textContent = { ar: "\u0631\u062C\u0648\u0639 \u0644\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A", en: "Back to Settings", fr: "Retour aux param\xE8tres", zh: "\u8FD4\u56DE\u8BBE\u7F6E", ja: "\u8A2D\u5B9A\u306B\u623B\u308B" }[lang()] || "Back to Settings";
    var labels = { "prayer-heading": 0, "prayer-settings-title": 8, "prayer-settings-open": 8, "prayer-back": 29, "prayer-refresh": 30, "prayer-stop": 21, "prayer-settings-stop": 21, "prayer-settings-refresh": 30, "prayer-search": 11, "prayer-preview": 20, "prayer-audio-note": 36, "prayer-source": 37, "prayer-confirm": 39 };
    Object.keys(labels).forEach(function(id) {
      document.querySelector("#" + id).textContent = t(labels[id]);
    });
    document.querySelector("#prayer-city").placeholder = t(10);
    document.querySelector("#prayer-volume-label").textContent = t(22) + " \xB7 " + (cfg().volume == null ? 60 : cfg().volume) + "%";
    document.querySelector("#prayer-method").textContent = t(12) + " \xB7 " + t({ 5: 13, 4: 14, 2: 15, 3: 16 }[cfg().method || 5]);
    document.querySelector("#prayer-school").textContent = t(26) + " \xB7 " + t(cfg().school ? 28 : 27);
    document.querySelector("#prayer-voice").textContent = t(19) + " \xB7 " + t(cfg().voice === "makka" ? 18 : 17);
    document.querySelector("#prayer-enable").textContent = t(23) + " \xB7 " + t(cfg().enabled ? 24 : 25);
    document.querySelector("#prayer-enable").setAttribute("aria-pressed", cfg().enabled ? "true" : "false");
    document.querySelector("#prayer-volume").value = cfg().volume == null ? 60 : cfg().volume;
  }
  function render() {
    renderHome();
    if (!root) return;
    Object.keys(words).some(function(language) {
      var i = words[language].indexOf(error);
      if (i >= 0) {
        error = t(i);
        return true;
      }
      return false;
    });
    renderLabels();
    var location = loc(), message = error || (loading ? t(32) : !location ? t(31) : cached ? t(34) : "");
    document.querySelector("#prayer-error").textContent = message;
    document.querySelector("#prayer-place").textContent = location ? location.name + " \xB7 " + (location.country || "") + (location.approximate ? " \xB7 " + t(35) : "") : t(31);
    document.querySelector("#prayer-settings-place").textContent = document.querySelector("#prayer-place").textContent;
    document.querySelector("#prayer-settings-status").textContent = message === t(31) ? "" : message;
    var weather = C.Weather.state, data = weather.data, same = location && weather.location && Math.abs(location.latitude - weather.location.latitude) < 0.1 && Math.abs(location.longitude - weather.location.longitude) < 0.1;
    document.querySelector("#prayer-weather-icon").innerHTML = C.icon(data && same ? C.Weather.condition(data.current.weather_code, data.current.is_day).icon : "location");
    document.querySelector("#prayer-weather-temp").textContent = data && same ? Math.round(data.current.temperature_2m) + "\xB0" : "\u2014";
    document.querySelector("#prayer-weather-description").textContent = data && same ? weather.location.name || "" : t(44);
    var list = document.querySelector("#prayer-times");
    list.textContent = "";
    names.forEach(function(name, index) {
      var item = days[0] && days[0].items[index], card = C.el("article", "prayer-glass prayer-time");
      card.dataset.prayer = name;
      card.appendChild(C.el("span", "", t(index + 1)));
      card.appendChild(C.el("strong", "", item ? item.time : "\u2014:\u2014"));
      list.appendChild(card);
    });
    renderClock();
    if (C.Duas) C.Duas.tick(Date.now());
  }
  function renderClock() {
    if (!root || root.hidden) return;
    var now = Date.now(), zone = days[0] && days[0].zone || loc() && loc().timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    var locale = { ar: "ar-EG", en: "en-GB", fr: "fr-FR", zh: "zh-CN", ja: "ja-JP" }[lang()] || "en-GB";
    try {
      var displayDate = new Date(stamp(parts(now, zone)));
      document.querySelector("#prayer-clock").textContent = displayDate.toLocaleTimeString(locale, { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: !C.settings.clock24 });
      document.querySelector("#prayer-date").textContent = displayDate.toLocaleDateString(locale, { timeZone: "UTC", weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch (e) {
    }
    var hijri = days[0] && days[0].hijri;
    document.querySelector("#prayer-hijri").textContent = hijri ? hijri.day + " " + (lang() === "ar" ? hijri.month.ar : hijri.month.en) + " " + hijri.year : "";
    var next = nextPrayer(now);
    document.querySelector("#prayer-next").textContent = next ? t(7) + " \xB7 " + t(names.indexOf(next.name) + 1) : t(7);
    var seconds = next ? Math.max(0, Math.floor((next.at - now) / 1e3)) : 0;
    document.querySelector("#prayer-countdown").textContent = next ? [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(function(n) {
      return String(n).padStart(2, "0");
    }).join(":") : "\u2014:\u2014:\u2014";
    root.querySelectorAll(".prayer-time").forEach(function(card) {
      card.classList.toggle("next", !!next && card.dataset.prayer === next.name);
    });
  }
  function launch() {
    if (window.TVNative && TVNative.launch) TVNative.launch("local.tvmorph.tv.prayer");
    else open();
  }
  function expandSettings() {
    document.querySelector("#prayer-settings-title").textContent = t(8);
    document.getElementById("view-settings").classList.add("prayer-settings-mode");
    document.querySelector("#prayer-settings").hidden = false;
    document.querySelector("#view-settings").scrollTop = 0;
    C.Focus.setScope(document);
    C.Focus.focus(document.querySelector("#setting-prayer-visibility"));
  }
  function collapseSettings(focus) {
    var view = document.getElementById("view-settings");
    var panel = document.getElementById("prayer-settings");
    if (!view || !panel) return false;
    var opened = !panel.hidden;
    panel.hidden = true;
    view.classList.remove("prayer-settings-mode");
    view.scrollTop = 0;
    if (focus) {
      if (C.SettingsNav) {
        C.SettingsNav.home();
        C.Focus.focus(document.getElementById("settings-category-prayer-entry"));
      } else C.Focus.focus(document.getElementById("prayer-settings-entry"));
    }
    return opened;
  }
  function openSettings() {
    if (!root) make();
    if (!root.hidden) close();
    C.showView("settings");
    if (C.SettingsNav) C.SettingsNav.open("prayer");
    else expandSettings();
  }
  function open() {
    if (C.settings.showPrayer === false) return;
    if (!root) make();
    if (!root.hidden) return;
    previous = document.activeElement;
    oldBack = C.back;
    document.body.classList.add("prayer-open");
    root.hidden = false;
    C.Focus.setScope(root);
    C.back = close;
    render();
    load(false);
    C.Focus.focus(document.querySelector("#prayer-settings-open"));
  }
  function close() {
    if (!root) return;
    root.hidden = true;
    document.body.classList.remove("prayer-open");
    stop();
    C.Focus.setScope(document);
    if (oldBack) C.back = oldBack;
    oldBack = null;
    C.Focus.focus(previous);
  }
  var visibilityButton, lastVisibility;
  var unusedSettingsGroups = { ar: ["\u0627\u0644\u0645\u0648\u0642\u0639 \u0648\u0627\u0644\u062D\u0633\u0627\u0628", "\u0627\u0644\u0623\u0630\u0627\u0646 \u0648\u0627\u0644\u0635\u0648\u062A", "\u0627\u0644\u0625\u0638\u0647\u0627\u0631 \u0648\u0627\u0633\u062A\u0631\u0627\u062D\u0629 \u0627\u0644\u0635\u0644\u0627\u0629"], en: ["Location & calculation", "Adhan & audio", "Visibility & prayer break"], fr: ["Lieu et calcul", "Adhan et audio", "Affichage et pause"], zh: ["\u4F4D\u7F6E\u4E0E\u8BA1\u7B97", "\u5BA3\u793C\u4E0E\u97F3\u9891", "\u663E\u793A\u4E0E\u793C\u62DC\u6682\u505C"], ja: ["\u5834\u6240\u3068\u8A08\u7B97", "\u30A2\u30B6\u30FC\u30F3\u3068\u97F3\u58F0", "\u8868\u793A\u3068\u793C\u62DD\u4F11\u61A9"] };
  var visibilityWords = { ar: ["\u0625\u0638\u0647\u0627\u0631 \u0645\u0648\u0627\u0642\u064A\u062A \u0627\u0644\u0635\u0644\u0627\u0629", "\u062A\u0634\u063A\u064A\u0644", "\u0625\u064A\u0642\u0627\u0641"], en: ["Show prayer times", "On", "Off"], fr: ["Afficher les pri\xE8res", "Activ\xE9", "D\xE9sactiv\xE9"], zh: ["\u663E\u793A\u7948\u7977\u65F6\u95F4", "\u5F00\u542F", "\u5173\u95ED"], ja: ["\u793C\u62DD\u6642\u523B\u3092\u8868\u793A", "\u30AA\u30F3", "\u30AA\u30D5"] };
  function syncVisibility() {
    var visible = C.settings.showPrayer !== false;
    document.body.classList.toggle("hide-prayer", !visible);
    document.querySelectorAll('#open-prayer,#home-next-prayer,#prayer-setting,[data-app-id="local.tvmorph.tv.prayer"],[data-favourite-id="local.tvmorph.tv.prayer"]').forEach(function(node) {
      node.hidden = !visible;
    });
    if (visibilityButton) {
      var w = visibilityWords[lang()] || visibilityWords.en;
      visibilityButton.textContent = w[0] + " \xB7 " + w[visible ? 1 : 2];
      visibilityButton.setAttribute("aria-pressed", String(visible));
    }
    if (lastVisibility !== visible) {
      lastVisibility = visible;
      if (!visible) {
        generation++;
        loading = false;
        signature = "";
        days = [];
        stop();
        closeBreak();
        if (root && !root.hidden) close();
      } else {
        signature = "";
        load(false);
      }
    }
    if (C.fitRails) C.fitRails();
    if (C.refreshRecentApps) C.refreshRecentApps();
  }
  window.addEventListener("load", function() {
    visibilityButton = button("setting-prayer-visibility", "", function() {
      C.settings.showPrayer = C.settings.showPrayer === false;
      C.saveSettings();
      syncVisibility();
    });
    visibilityButton.className = "setting";
    visibilityButton.setAttribute("data-no-translate", "");
    if (!root) make();
    var panel = document.querySelector("#prayer-settings");
    panel.insertBefore(visibilityButton, document.querySelector("#prayer-settings-place"));
    syncVisibility();
    render();
  });
  window.addEventListener("morphLanguage", syncVisibility);
  window.addEventListener("morphViewer", syncVisibility);
  C.Prayer = { context: function(now) {
    var location = loc(), zone = days[0] && days[0].zone || location && location.timezone, local;
    try {
      local = parts(now, zone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch (e) {
      local = { hour: new Date(now).getHours() };
    }
    var day = days.filter(function(d) {
      try {
        return dateKey(parts(now, d.zone)) === d.date;
      } catch (e) {
        return false;
      }
    })[0];
    return { now, zone, hour: local.hour, items: day ? day.items.map(function(p) {
      return { name: p.name, at: p.at, adhan: p.adhan };
    }) : [] };
  }, showSettings: expandSettings, settingsEntered: function() {
    collapseSettings(false);
  }, backSettings: function() {
    return !document.getElementById("view-settings").hidden && !document.getElementById("prayer-settings").hidden && collapseSettings(true);
  }, openSettings, syncVisibility, breakState, allowLaunch, open, close, refresh: function() {
    signature = "";
    load(true);
  }, timeAt, next: function() {
    return nextPrayer(Date.now());
  }, setVisible: function(value) {
    foreground = !!value;
    lastTick = Date.now();
    if (!foreground) stop();
  } };
  window.addEventListener("load", function() {
    var launchApp = C.Catalog.launch;
    C.Catalog.launch = function(app) {
      if (app && app.id !== "local.tvmorph.tv.prayer" && !allowLaunch()) return;
      return launchApp.call(this, app);
    };
    homeWidget = button("home-next-prayer", "", launch);
    homeWidget.classList.add("home-next-prayer");
    homeWidget.setAttribute("data-no-translate", "");
    homeWidget.innerHTML = C.icon("moon") + '<small></small><strong></strong><time dir="ltr"></time>';
    document.getElementById("view-home").appendChild(homeWidget);
    renderHome();
    var tools = document.querySelector(".home-tools");
    if (tools) {
      var b = button("open-prayer", "", launch);
      b.classList.add("tool");
      b.innerHTML = C.icon("moon") + "<span>" + t(0) + "</span>";
      tools.insertBefore(b, tools.firstChild);
      window.addEventListener("morphLanguage", function() {
        b.querySelector("span").textContent = t(0);
      });
    }
    load(false);
  });
  window.addEventListener("morphLanguage", render);
  window.addEventListener("morphViewer", function() {
    stop();
    signature = "";
    days = [];
    load(false);
  });
  document.addEventListener("visibilitychange", function() {
    lastTick = Date.now();
    if (document.hidden) stop();
    else load(false);
  });
  setInterval(tick, 1e3);
  var weatherChanged = C.weatherChanged;
  C.weatherChanged = function(state) {
    if (weatherChanged) weatherChanged(state);
    if (!loading) load(false);
    render();
  };
})(window.ClearTV);
