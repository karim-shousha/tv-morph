(function() {
  "use strict";
  const $ = (id) => document.getElementById(id), T = (ar, en) => MorphLocale.t(ar, en);
  let kind = "live", category = "", page = 0, total = 0, favoriteOnly = false, request = 0, pending = {}, generation = 0, categoryGeneration = 0, posterObserver = null, items = [], favorites = [], favoriteKey = "", settings = { language: "ar", scale: "fit", resume: true }, held = null, lastFocus = "", detailItem = null, detailGeneration = 0;
  let prefs = { density: "comfortable", sort: "provider", motion: false }, prefKey = "tvmorph.iptv.view.default", accountInfo = {}, epgItem = null, epgGeneration = 0, guideMode = false;
  let continueOnly = false, recentOnly = false, historyKey = "", watchHistory = [], seriesContext = null, dashboardOrigin = null;
  function remember(item) {
    if (!historyKey || !["live", "vod", "episode"].includes(item.kind)) return;
    const clean = {};
    ["id", "kind", "name", "icon", "ext", "category", "seriesName"].forEach((k) => {
      if (typeof item[k] === "string") clean[k] = item[k].slice(0, k === "icon" ? 2e3 : 250);
    });
    clean.watchedAt = Date.now();
    watchHistory = watchHistory.filter((x) => key(x) !== key(clean));
    watchHistory.unshift(clean);
    const counts = {};
    watchHistory = watchHistory.filter((x) => {
      counts[x.kind] = (counts[x.kind] || 0) + 1;
      return counts[x.kind] <= 66;
    });
    try {
      localStorage.setItem(historyKey, JSON.stringify(watchHistory));
    } catch (e) {
    }
  }
  function fitRows() {
    if (document.documentElement.hasAttribute("data-tv-library")) {
      const height2 = $("items").clientHeight;
      if (height2 > 0) $("items").style.setProperty("--tv-poster-row", Math.max(120, Math.floor((height2 - 14 - (prefs.density === "compact" ? 28 : 14)) / (prefs.density === "compact" ? 3 : 2))) + "px");
      return;
    }
    const height = $("items").clientHeight - 16;
    if (height > 0) $("items").style.setProperty("--poster-row", Math.max(140, Math.floor((height - (height > 520 ? 22 : 0)) / (height > 520 ? 2 : 1))) + "px");
  }
  function paintSpecial() {
    const entries = { all: ["\u0643\u0644 \u0627\u0644\u0645\u062D\u062A\u0648\u0649", "All content"], recent: ["\u0623\u064F\u0636\u064A\u0641 \u062D\u062F\u064A\u062B\u064B\u0627", "Recently added"], continue: ["\u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629", "Continue watching"], favorites: ["\u0627\u0644\u0645\u0641\u0636\u0644\u0629", "Favourites"] };
    Object.keys(entries).forEach((k) => {
      const b = $("browse-" + k);
      if (b) {
        b.textContent = T(...entries[k]);
        b.classList.toggle("active", k === "continue" ? continueOnly : k === "recent" ? recentOnly : k === "favorites" ? favoriteOnly : !continueOnly && !recentOnly && !favoriteOnly && !category);
      }
    });
    if ($("browse-continue")) $("browse-continue").hidden = kind === "live";
  }
  function special(mode) {
    continueOnly = mode === "continue";
    recentOnly = mode === "recent";
    favoriteOnly = mode === "favorites";
    if (kind === "all" || kind === "episode") {
      kind = mode === "continue" ? "vod" : "live";
      document.body.dataset.kind = kind;
    }
    category = "";
    page = 0;
    $("search").value = "";
    showLibrary();
    chrome();
    paintSpecial();
    load();
  }
  const specialNav = document.createElement("div");
  specialNav.id = "library-special";
  ["all", "favorites", "recent", "continue"].forEach((mode) => {
    const b = document.createElement("button");
    b.id = "browse-" + mode;
    b.onclick = () => special(mode);
    specialNav.appendChild(b);
  });
  $("categories").before(specialNav);
  window.addEventListener("resize", fitRows);
  paintSpecial();
  function applyPrefs() {
    document.body.dataset.density = prefs.density;
    document.body.classList.toggle("reduce-motion", !!prefs.motion);
  }
  function showLibrary() {
    if (document.activeElement.closest("#dashboard")) dashboardOrigin = document.activeElement;
    $("dashboard").hidden = true;
    document.querySelector("main").hidden = false;
    $("home-open").classList.remove("active");
    const entry = $("browse-all");
    if (entry) entry.focus();
  }
  function home() {
    generation++;
    categoryGeneration++;
    document.querySelector("main").hidden = true;
    $("dashboard").hidden = false;
    $("home-open").classList.add("active");
    portalText();
    updateWatchHero();
    $("dashboard").scrollTop = 0;
    restorePortal();
    if (dashboardOrigin && dashboardOrigin.isConnected && !dashboardOrigin.hidden) dashboardOrigin.focus();
  }
  function portalText() {
    $("unified-open").textContent = T("\u2315 \u0627\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0643\u0644", "\u2315 Search all");
    $("search").placeholder = T("\u0627\u0628\u062D\u062B \u0641\u064A \u0643\u0644 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0642\u0633\u0645\u2026", "Search every title in this section\u2026");
    $("search-go").textContent = T("\u2315 \u0628\u062D\u062B", "\u2315 Search");
    $("unified-go").textContent = T("\u0627\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0643\u0644", "Search all");
    $("unified-query").placeholder = T("\u0642\u0646\u0627\u0629 \u0623\u0648 \u0641\u064A\u0644\u0645 \u0623\u0648 \u0645\u0633\u0644\u0633\u0644\u2026", "Search channels, movies and series");
    $("home-open").textContent = T("\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629", "Home");
    $("welcome-title").textContent = T("\u0643\u0644 \u0627\u0644\u0644\u064A \u0628\u062A\u062D\u0628 \u062A\u0634\u0648\u0641\u0647.", "Your next great watch.");
    $("welcome-copy").textContent = T("\u0642\u0646\u0648\u0627\u062A\u0643 \u0648\u0623\u0641\u0644\u0627\u0645\u0643 \u0648\u0645\u0633\u0644\u0633\u0644\u0627\u062A\u0643 \u0641\u064A \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F.", "Live moments. Movie nights. One library.");
    const labels = { live: [T("\u0627\u0644\u0642\u0646\u0648\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629", "Live TV"), T("\u0634\u0627\u0647\u062F \u0642\u0646\u0648\u0627\u062A \u0627\u0634\u062A\u0631\u0627\u0643\u0643", "Watch your channels")], vod: [T("\u0627\u0644\u0623\u0641\u0644\u0627\u0645", "Movies"), T("\u0627\u062E\u062A\u0627\u0631 \u0641\u064A\u0644\u0645\u0643 \u0627\u0644\u062C\u0627\u064A", "Find your next movie")], series: [T("\u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062A", "Series"), T("\u062D\u0644\u0642\u0629 \u0648\u0631\u0627 \u062D\u0644\u0642\u0629", "One episode after another")] };
    Object.keys(labels).forEach((k) => {
      const b = document.querySelector('[data-open="' + k + '"]');
      b.querySelector("strong").textContent = labels[k][0];
      b.querySelector("small").textContent = labels[k][1];
    });
    $("home-favorites").querySelector("strong").textContent = T("\u0627\u0644\u0645\u0641\u0636\u0644\u0629", "Favorites");
    $("home-favorites").querySelector("small").textContent = T("\u0627\u0644\u0639\u0646\u0627\u0648\u064A\u0646 \u0627\u0644\u0644\u064A \u062D\u0641\u0638\u062A\u0647\u0627", "Your saved titles");
    $("home-settings").textContent = T("\u2699 \u0625\u0639\u062F\u0627\u062F\u0627\u062A IPTV", "\u2699 IPTV settings");
    $("home-account").textContent = T("\u25CE \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643", "\u25CE Account information");
    $("home-refresh").textContent = T("\u21BB \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u062D\u062A\u0648\u0649", "\u21BB Update content");
    $("settings-title").textContent = T("\u0625\u0639\u062F\u0627\u062F\u0627\u062A IPTV", "IPTV settings");
    $("playback-label").textContent = T("\u0627\u0644\u062A\u0634\u063A\u064A\u0644", "Playback");
    $("library-label").textContent = T("\u0627\u0644\u0645\u0643\u062A\u0628\u0629", "Library");
    $("density-label").textContent = T("\u062D\u062C\u0645 \u0627\u0644\u0628\u0648\u0633\u062A\u0631\u0627\u062A", "Poster size");
    $("sort-label").textContent = T("\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0639\u0646\u0627\u0648\u064A\u0646", "Title order");
    $("motion-label").textContent = T("\u062A\u0642\u0644\u064A\u0644 \u0627\u0644\u062D\u0631\u0643\u0629", "Reduce motion");
    $("cache-clear").textContent = T("\u062A\u062D\u062F\u064A\u062B \u0643\u0627\u0634 \u0627\u0644\u0645\u0643\u062A\u0628\u0629", "Refresh library cache");
    $("cache-note").textContent = T("\u0625\u0639\u0627\u062F\u0629 \u062A\u062D\u0645\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0645\u0639 \u0627\u0644\u0627\u062D\u062A\u0641\u0627\u0638 \u0628\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0648\u0627\u0644\u0645\u0641\u0636\u0644\u0629.", "Re-downloads catalog data. Keeps your account and favorites.");
    const options = [["setting-density", "comfortable", T("\u0645\u0631\u064A\u062D", "Comfortable")], ["setting-density", "compact", T("\u0635\u063A\u064A\u0631", "Compact")], ["setting-sort", "provider", T("\u062A\u0631\u062A\u064A\u0628 \u0627\u0644\u0645\u0632\u0648\u0651\u062F", "Provider order")], ["setting-sort", "az", T("\u0623 \u2190 \u064A (\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629)", "A \u2192 Z (this page)")], ["setting-sort", "za", T("\u064A \u2190 \u0623 (\u0627\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629)", "Z \u2192 A (this page)")]];
    options.forEach((v) => $(v[0]).querySelector('[value="' + v[1] + '"]').textContent = v[2]);
  }
  let heroItems = { live: null, vod: null, episode: null }, heroGeneration = 0, lastWatchFocus = null;
  const historyWords = { ar: ["\u0622\u062E\u0631 \u0642\u0646\u0627\u0629", "\u0622\u062E\u0631 \u0641\u064A\u0644\u0645", "\u0622\u062E\u0631 \u0645\u0633\u0644\u0633\u0644", "\u0644\u0633\u0647 \u0645\u0627 \u0641\u062A\u062D\u062A\u0634 \u0642\u0646\u0627\u0629", "\u0644\u0633\u0647 \u0645\u0627 \u0641\u062A\u062D\u062A\u0634 \u0641\u064A\u0644\u0645", "\u0644\u0633\u0647 \u0645\u0627 \u0641\u062A\u062D\u062A\u0634 \u0645\u0633\u0644\u0633\u0644", "\u0627\u0641\u062A\u062D \u0627\u0644\u0642\u0646\u0627\u0629", "\u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629", "\u0634\u0627\u0647\u062F \u0645\u0646 \u062C\u062F\u064A\u062F", "\u062A\u0635\u0641\u0651\u062D"], en: ["Last channel", "Last movie", "Last series", "No channel watched yet", "No movie watched yet", "No series watched yet", "Open channel", "Continue watching", "Watch again", "Browse"], fr: ["Derni\xE8re cha\xEEne", "Dernier film", "Derni\xE8re s\xE9rie", "Aucune cha\xEEne regard\xE9e", "Aucun film regard\xE9", "Aucune s\xE9rie regard\xE9e", "Ouvrir la cha\xEEne", "Continuer", "Revoir", "Parcourir"], zh: ["\u4E0A\u6B21\u9891\u9053", "\u4E0A\u6B21\u7535\u5F71", "\u4E0A\u6B21\u5267\u96C6", "\u5C1A\u672A\u89C2\u770B\u9891\u9053", "\u5C1A\u672A\u89C2\u770B\u7535\u5F71", "\u5C1A\u672A\u89C2\u770B\u5267\u96C6", "\u6253\u5F00\u9891\u9053", "\u7EE7\u7EED\u89C2\u770B", "\u91CD\u65B0\u89C2\u770B", "\u6D4F\u89C8"], ja: ["\u524D\u56DE\u306E\u30C1\u30E3\u30F3\u30CD\u30EB", "\u524D\u56DE\u306E\u6620\u753B", "\u524D\u56DE\u306E\u30C9\u30E9\u30DE", "\u30C1\u30E3\u30F3\u30CD\u30EB\u306E\u5C65\u6B74\u306F\u3042\u308A\u307E\u305B\u3093", "\u6620\u753B\u306E\u5C65\u6B74\u306F\u3042\u308A\u307E\u305B\u3093", "\u30C9\u30E9\u30DE\u306E\u5C65\u6B74\u306F\u3042\u308A\u307E\u305B\u3093", "\u30C1\u30E3\u30F3\u30CD\u30EB\u3092\u958B\u304F", "\u7D9A\u304D\u3092\u898B\u308B", "\u3082\u3046\u4E00\u5EA6\u898B\u308B", "\u63A2\u3059"] };
  const watchNodes = { live: ["watch-live-title", "watch-live-copy", "watch-live-label", "watch-live-art", "watch-live-open"], vod: ["welcome-title", "welcome-copy", "watch-label", "watch-art", "watch-resume"], episode: ["watch-series-title", "watch-series-copy", "watch-series-label", "watch-series-art", "watch-series-open"] };
  function drawWatchHero() {
    const w = historyWords[MorphLocale.get()] || historyWords.en;
    ["live", "vod", "episode"].forEach((kind2, index) => {
      const item = heroItems[kind2], ids = watchNodes[kind2], card = document.querySelector('[data-watch-kind="' + kind2 + '"]'), image = $(ids[3]), src = item ? safeImage(item.icon) : "";
      $(ids[2]).textContent = w[index];
      $(ids[0]).textContent = item ? item.seriesName || item.name : w[index + 3];
      $(ids[1]).textContent = item ? item.seriesName ? item.name : item.resumeMs > 0 ? stamp(item.resumeMs) : "" : "";
      $(ids[4]).textContent = !item ? w[9] : kind2 === "live" ? w[6] : item.resumeMs > 0 ? w[7] : w[8];
      card.classList.toggle("empty", !item);
      card.classList.toggle("has-art", !!src);
      image.hidden = false;
      const target = src || "icon-" + (kind2 === "episode" ? "series" : kind2) + ".svg";
      if (image.getAttribute("src") !== target) image.src = target;
    });
  }
  async function updateWatchHero() {
    const gen = ++heroGeneration;
    drawWatchHero();
    let rows = watchHistory.slice();
    try {
      const result = await call("history");
      if (Array.isArray(result.items)) rows = rows.concat(result.items);
    } catch (e) {
    }
    if (gen !== heroGeneration) return;
    rows = rows.filter((x) => x && x.id && x.name && ["live", "vod", "episode"].includes(x.kind)).sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0));
    ["live", "vod", "episode"].forEach((k) => heroItems[k] = rows.find((x) => x.kind === k) || null);
    drawWatchHero();
    const latest = Object.values(heroItems).filter(Boolean);
    if (latest.length) try {
      const result = await call("progress", { items: latest });
      if (gen !== heroGeneration) return;
      (result.items || []).forEach((item) => {
        if (heroItems[item.kind] && key(heroItems[item.kind]) === key(item)) heroItems[item.kind] = Object.assign({}, heroItems[item.kind], item);
      });
      drawWatchHero();
    } catch (e) {
    }
  }
  Object.keys(watchNodes).forEach((kind2) => {
    const ids = watchNodes[kind2], button = $(ids[4]), card = button.closest(".watch-card");
    $(ids[3]).onerror = function() {
      this.hidden = true;
      card.classList.remove("has-art");
    };
    button.onclick = () => {
      lastWatchFocus = button;
      const item = heroItems[kind2];
      if (!item) {
        change(kind2 === "episode" ? "series" : kind2);
        return;
      }
      call("play", item).catch((e) => {
        $("dashboard-status").textContent = e.message;
      });
    };
    card.onclick = (e) => {
      if (!e.target.closest("button")) button.click();
    };
  });
  $("home-open").onclick = home;
  document.querySelectorAll("[data-open]").forEach((b) => b.onclick = () => change(b.dataset.open));
  $("home-favorites").onclick = () => {
    showLibrary();
    favoriteOnly = true;
    $("only-favorites").classList.add("active");
    load();
  };
  $("home-settings").onclick = openSettings;
  $("home-refresh").onclick = async () => {
    $("dashboard-status").textContent = T("\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u062F\u064A\u062B\u2026", "Updating\u2026");
    try {
      await call("refresh");
      $("dashboard-status").textContent = T("\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0643\u062A\u0628\u0629.", "Library updated.");
    } catch (e) {
      $("dashboard-status").textContent = e.message;
    }
  };
  $("home-account").onclick = () => {
    $("dashboard-status").textContent = (accountInfo.name || "My TV") + " \xB7 " + T("\u0645\u062D\u062A\u0648\u0627\u0643 \u0645\u0646 \u0627\u0634\u062A\u0631\u0627\u0643\u0643 \u0627\u0644\u062E\u0627\u0635. \u0644\u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0641\u062A\u062D Morph TV \u0639\u0644\u0649 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644.", "Content comes from your subscription. Manage your account in Morph TV on your phone.");
  };
  $("cache-clear").onclick = async () => {
    try {
      await call("refresh");
      $("settings-status").textContent = T("\u062A\u0645 \u0645\u0633\u062D \u0643\u0627\u0634 \u0627\u0644\u0645\u0643\u062A\u0628\u0629.", "Library cache refreshed.");
    } catch (e) {
      $("settings-status").textContent = e.message;
    }
  };
  $("account-open").onclick = () => {
    $("account-panel").hidden = !$("account-panel").hidden;
    if (!$("account-panel").hidden) $("account-server").focus();
  };
  $("account-save").onclick = async () => {
    const server = $("account-server").value.trim(), username = $("account-user").value.trim(), password = $("account-password").value;
    if (!server || !username || !password) {
      $("account-status").textContent = T("\u0643\u0645\u0651\u0644 \u0627\u0644\u0631\u0627\u0628\u0637 \u0648\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0633\u0631.", "Enter the server, username and password.");
      return;
    }
    $("account-save").disabled = true;
    $("account-status").textContent = T("\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u2026", "Checking your subscription\u2026");
    try {
      await call("connect", { server, username, password, name: $("account-name").value.trim() || "My TV", format: $("account-format").value, live: true, vod: true, series: true });
      $("account-password").value = "";
      window.location.reload();
    } catch (e) {
      $("account-status").textContent = T("\u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0631\u0628\u0637. \u0631\u0627\u062C\u0639 \u0627\u0644\u0631\u0627\u0628\u0637 \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0648\u0627\u0644\u0627\u062A\u0635\u0627\u0644.", "Could not connect. Check the server, credentials and network.");
    } finally {
      $("account-save").disabled = false;
    }
  };
  function goKindSearch(k, q) {
    change(k, q);
  }
  async function unifiedSearch(query) {
    query = String(query || "").trim().slice(0, 100);
    if (!query) {
      home();
      $("unified-query").focus();
      return;
    }
    showLibrary();
    kind = "all";
    document.body.dataset.kind = "all";
    favoriteOnly = false;
    continueOnly = false;
    recentOnly = false;
    paintSpecial();
    $("search").value = query;
    const gen = ++generation;
    ++categoryGeneration;
    $("categories").textContent = "";
    $("section-tag").textContent = T("\u0628\u062D\u062B \u0645\u0648\u062D\u0651\u062F", "UNIFIED SEARCH");
    $("section-title").textContent = T("\u0646\u062A\u0627\u0626\u062C \u0643\u0644 \u0627\u0644\u0623\u0642\u0633\u0627\u0645", "Across your library");
    status(T("\u062C\u0627\u0631\u064A \u0627\u0644\u0628\u062D\u062B \u0641\u064A \u0627\u0644\u0642\u0646\u0648\u0627\u062A \u0648\u0627\u0644\u0623\u0641\u0644\u0627\u0645 \u0648\u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062A\u2026", "Searching channels, movies and series\u2026"));
    $("items").textContent = "";
    const sections = ["live", "vod", "series"].filter((k) => accountInfo[k] !== false);
    const found = await Promise.all(sections.map(async (k) => {
      try {
        return { kind: k, result: await call("list", { kind: k, category: "", page: 0, search: query }) };
      } catch (e) {
        return { kind: k, error: true };
      }
    }));
    if (gen !== generation) return;
    items = [];
    total = 0;
    const names = { live: T("\u0627\u0644\u0642\u0646\u0648\u0627\u062A", "Live TV"), vod: T("\u0627\u0644\u0623\u0641\u0644\u0627\u0645", "Movies"), series: T("\u0627\u0644\u0645\u0633\u0644\u0633\u0644\u0627\u062A", "Series") };
    found.forEach((row) => {
      let button = document.createElement("button");
      if (row.error) {
        button.textContent = names[row.kind] + T(" \xB7 \u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u0628\u062D\u062B\u060C \u062C\u0631\u0651\u0628 \u062A\u0627\u0646\u064A", " \xB7 Search failed, retry");
        button.onclick = () => unifiedSearch(query);
      } else {
        items = items.concat(row.result.items.slice(0, 20));
        total += row.result.total;
        button.textContent = names[row.kind] + " \xB7 " + row.result.total;
        button.onclick = () => goKindSearch(row.kind, query);
      }
      $("categories").appendChild(button);
    });
    render();
    $("prev").hidden = true;
    $("next").hidden = true;
    $("page-number").textContent = T("\u062D\u062A\u0649 \u0662\u0660 \u0646\u062A\u064A\u062C\u0629 \u0644\u0643\u0644 \u0642\u0633\u0645 \xB7 \u0627\u062E\u062A\u0631 \u0627\u0644\u0642\u0633\u0645 \u0644\u0639\u0631\u0636 \u0627\u0644\u0628\u0627\u0642\u064A", "Up to 20 per section \xB7 choose a section for all results");
    status(total + T(" \u0646\u062A\u064A\u062C\u0629 \xB7 \u0627\u0644\u0628\u062D\u062B \u0628\u0627\u0644\u0627\u0633\u0645 \u0641\u064A \u0643\u0644 \u0645\u0643\u062A\u0628\u062A\u0643", " results \xB7 title search across your library"));
  }
  let searchEditing = false;
  function editSearch() {
    searchEditing = true;
    const input = $("unified-query");
    input.focus();
    if (typeof IptvNative.showKeyboard === "function") {
      IptvNative.showKeyboard(input.id, input.value);
      return;
    }
    input.click();
  }
  function submitSearch() {
    if (!$("unified-query").value.trim()) {
      editSearch();
      return;
    }
    searchEditing = false;
    if (typeof IptvNative.hideKeyboard === "function") IptvNative.hideKeyboard();
    unifiedSearch($("unified-query").value);
  }
  $("unified-go").onclick = submitSearch;
  $("unified-query").onclick = () => {
    searchEditing = true;
    if (typeof IptvNative.showKeyboard === "function") IptvNative.showKeyboard("unified-query", $("unified-query").value);
  };
  $("unified-query").onkeydown = (e) => {
    if (e.keyCode === 13) {
      if (typeof IptvNative.showKeyboard === "function") {
        e.preventDefault();
        if (searchEditing && $("unified-query").value.trim()) submitSearch();
        else editSearch();
      }
    } else if (e.keyCode === 65376) {
      e.preventDefault();
      submitSearch();
    }
  };
  $("unified-open").onclick = editSearch;
  function closeEpg() {
    epgGeneration++;
    $("epg-panel").hidden = true;
    epgItem = null;
    restoreOrigin(epgOrigin);
  }
  async function openEpg(item) {
    if (!item || item.kind !== "live") {
      status(T("\u062D\u062F\u062F \u0642\u0646\u0627\u0629 \u0645\u0628\u0627\u0634\u0631\u0629 \u0623\u0648\u0644\u064B\u0627\u060C \u062B\u0645 \u0627\u0641\u062A\u062D EPG.", "Focus a live channel first, then open EPG."));
      return;
    }
    epgOrigin = document.activeElement;
    epgItem = item;
    const gen = ++epgGeneration;
    $("epg-panel").hidden = false;
    $("epg-title").textContent = "EPG \xB7 " + item.name;
    $("epg-list").textContent = "";
    $("epg-status").textContent = T("\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0628\u0631\u0627\u0645\u062C \u0645\u0646 \u0627\u0644\u0645\u0632\u0648\u0651\u062F\u2026", "Loading your provider\u2019s programme guide\u2026");
    $("epg-play").textContent = T("\u0634\u0627\u0647\u062F \u0627\u0644\u0642\u0646\u0627\u0629", "Watch channel");
    $("epg-close").textContent = T("\u0631\u062C\u0648\u0639", "Back");
    $("epg-close").focus();
    try {
      let result = await call("epg", { id: item.id });
      if (gen !== epgGeneration) return;
      const rows = result.items || [];
      rows.forEach((row) => {
        const line = document.createElement("article"), time = document.createElement("time"), title = document.createElement("h3"), description = document.createElement("p");
        const start = new Date(Number(row.start) * 1e3), end = new Date(Number(row.end) * 1e3);
        time.textContent = start.toLocaleString() + " \u2014 " + end.toLocaleTimeString();
        title.textContent = row.title;
        description.textContent = row.description || "";
        line.tabIndex = 0;
        line.className = Date.now() >= start.getTime() && Date.now() < end.getTime() ? "epg-now" : "";
        line.append(time, title, description);
        $("epg-list").appendChild(line);
      });
      $("epg-status").textContent = rows.length ? T("\u0627\u0644\u062A\u0648\u0642\u064A\u062A \u062D\u0633\u0628 \u0633\u0627\u0639\u0629 \u0627\u0644\u062A\u0644\u0641\u0632\u064A\u0648\u0646 \xB7 \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0645\u0646 \u0627\u0644\u0645\u0632\u0648\u0651\u062F", "TV local time \xB7 schedules supplied by your provider") : T("\u0627\u0644\u0645\u0632\u0648\u0651\u062F \u0644\u0645 \u064A\u0648\u0641\u0651\u0631 \u0645\u0648\u0627\u0639\u064A\u062F \u0628\u0631\u0627\u0645\u062C \u0644\u0647\u0630\u0647 \u0627\u0644\u0642\u0646\u0627\u0629.", "Your provider has no programme guide for this channel.");
    } catch (e) {
      if (gen === epgGeneration) $("epg-status").textContent = T("\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u062F\u0644\u064A\u0644 \u0627\u0644\u0628\u0631\u0627\u0645\u062C. \u062C\u0631\u0651\u0628 \u062A\u0627\u0646\u064A.", "Programme guide could not load. Please retry.");
    }
  }
  $("epg-open").onclick = () => {
    if (!$("dashboard").hidden || kind !== "live") {
      change("live");
      guideMode = true;
      return;
    }
    let tile = document.querySelector(".tile:focus") || Array.from(document.querySelectorAll(".tile")).find((b) => b.dataset.key === lastFocus) || document.querySelector(".tile");
    openEpg(tile && tile._item);
  };
  $("epg-close").onclick = closeEpg;
  $("epg-play").onclick = () => {
    if (epgItem) call("play", epgItem).catch(() => {
      $("epg-status").textContent = T("\u062A\u0639\u0630\u0651\u0631 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0642\u0646\u0627\u0629.", "Could not start the channel.");
    });
  };
  document.addEventListener("focusin", (e) => {
    if (e.target.classList && e.target.classList.contains("tile")) lastFocus = e.target.dataset.key;
  });
  function call(action, payload = {}) {
    if (action === "refresh" || action === "connect") clearPageCache();
    return new Promise((resolve, reject) => {
      if (action === "play") remember(payload);
      const id = String(++request);
      pending[id] = { resolve, reject };
      IptvNative.request(id, action, JSON.stringify(payload));
    });
  }
  window.iptvResult = (id, ok, value) => {
    if (pending[id]) {
      ok ? pending[id].resolve(value) : pending[id].reject(new Error(value));
      delete pending[id];
    }
  };
  function key(item) {
    return item.kind + ":" + item.id;
  }
  function save() {
    localStorage.setItem(favoriteKey, JSON.stringify(favorites.slice(0, 200)));
  }
  function status(value) {
    $("status").textContent = value;
  }
  function safeImage(value) {
    try {
      let url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch (e) {
      return "";
    }
  }
  function stamp(ms) {
    let sec = Math.floor(ms / 1e3);
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }
  function toggle(item) {
    const focusKey = key(item), index = favorites.findIndex((f) => key(f) === focusKey);
    if (index < 0) {
      if (favorites.length >= 200) {
        status(T("\u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0645\u0645\u062A\u0644\u0626\u0629: \u0662\u0660\u0660 \u0639\u0646\u0648\u0627\u0646.", "Favorites limit: 200 titles."));
        return;
      }
      favorites.push(item);
    } else favorites.splice(index, 1);
    save();
    render();
    let tile = Array.from(document.querySelectorAll(".tile")).find((t) => t.dataset.key === focusKey);
    if (tile) tile.focus();
    status(index < 0 ? T("\u0627\u062A\u0636\u0627\u0641 \u0644\u0644\u0645\u0641\u0636\u0644\u0629: ", "Added to favorites: ") + item.name : T("\u0627\u062A\u0634\u0627\u0644 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629: ", "Removed from favorites: ") + item.name);
  }
  function drawDetails() {
    if (!detailItem) return;
    const item = detailItem;
    $("detail-title").textContent = (item.seriesName ? item.seriesName + " \xB7 " : "") + item.name;
    const src = safeImage(item.icon);
    $("detail-poster").hidden = !src;
    $("detail-poster").src = src;
    $("detail-meta").textContent = [item.released, item.genre, item.duration, item.rating ? T("\u0627\u0644\u062A\u0642\u064A\u064A\u0645: ", "Rating: ") + item.rating : ""].filter(Boolean).join(" \xB7 ");
    $("detail-plot").textContent = item.plot || T("\u0644\u0645 \u064A\u0648\u0641\u0651\u0631 \u0627\u0644\u0645\u0632\u0648\u0651\u062F \u0648\u0635\u0641\u064B\u0627 \u0644\u0647\u0630\u0627 \u0627\u0644\u0639\u0646\u0648\u0627\u0646.", "Your provider has not supplied a description for this title.");
    $("detail-cast").hidden = !item.cast;
    $("detail-cast").textContent = item.cast ? T("\u0628\u0637\u0648\u0644\u0629: ", "Cast: ") + item.cast : "";
    $("detail-director").hidden = !item.director;
    $("detail-director").textContent = item.director ? T("\u0625\u062E\u0631\u0627\u062C: ", "Director: ") + item.director : "";
    $("detail-position").textContent = item.resumeMs > 0 ? T("\u0622\u062E\u0631 \u0645\u0648\u0636\u0639 \u0645\u0634\u0627\u0647\u062F\u0629: ", "Last watched position: ") + stamp(item.resumeMs) : "";
    $("detail-resume").textContent = T("\u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629", "Resume");
    $("detail-start").textContent = T("\u0627\u0628\u062F\u0623 \u0645\u0646 \u0627\u0644\u0623\u0648\u0644", "Start from beginning");
    $("detail-episodes").textContent = T("\u0639\u0631\u0636 \u0627\u0644\u062D\u0644\u0642\u0627\u062A", "View episodes");
    $("detail-close").textContent = T("\u0631\u062C\u0648\u0639 \u0644\u0644\u0645\u0643\u062A\u0628\u0629", "Back to library");
    $("detail-resume").hidden = item.kind === "series" || !(item.resumeMs > 0);
    $("detail-start").hidden = item.kind === "series";
    $("detail-episodes").hidden = item.kind !== "series";
    if (window.TvIptvLayout) TvIptvLayout.details(item);
  }
  async function openDetails(item) {
    detailItem = Object.assign({}, item);
    const gen = ++detailGeneration;
    $("details-panel").hidden = false;
    drawDetails();
    (item.kind === "series" ? $("detail-episodes") : item.resumeMs > 0 ? $("detail-resume") : $("detail-start")).focus();
    try {
      const value = await call("details", item);
      if (gen !== detailGeneration || !detailItem) return;
      detailItem = Object.assign(detailItem, value);
      drawDetails();
    } catch (e) {
      if (gen === detailGeneration) $("detail-plot").textContent = T("\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644. \u064A\u0645\u0643\u0646\u0643 \u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644.", "Details could not be loaded. You can still try playback.");
    }
  }
  function closeDetails() {
    if (window.TvIptvLayout) TvIptvLayout.closeDetails();
    detailGeneration++;
    $("details-panel").hidden = true;
    detailItem = null;
    const tile = Array.from(document.querySelectorAll(".tile")).find((t) => t.dataset.key === lastFocus);
    if (tile) tile.focus();
    else if (!$("dashboard").hidden) (lastWatchFocus && lastWatchFocus.isConnected ? lastWatchFocus : $("watch-resume")).focus();
  }
  function activate(item) {
    lastFocus = key(item);
    if (item.kind === "live" && guideMode) {
      openEpg(item);
      return;
    }
    if (item.kind === "live") call("play", item).catch((e) => status(e.message));
    else openDetails(item);
  }
  function playDetail(startOver) {
    if (!detailItem) return;
    call("play", Object.assign({}, detailItem, { startOver })).catch((e) => {
      $("detail-position").textContent = e.message;
    });
  }
  $("detail-resume").onclick = () => playDetail(false);
  $("detail-start").onclick = () => playDetail(true);
  $("detail-close").onclick = closeDetails;
  $("detail-episodes").onclick = () => {
    const item = detailItem;
    seriesContext = item;
    closeDetails();
    kind = "episode";
    document.body.dataset.kind = kind;
    category = item.id;
    page = 0;
    $("section-tag").textContent = "EPISODES";
    $("section-title").textContent = item.name;
    load();
  };
  function render() {
    paintSpecial();
    let list = favoriteOnly ? favorites.filter((i) => i.name.toLowerCase().includes($("search").value.trim().toLowerCase())) : items;
    if (prefs.sort !== "provider") list = list.slice().sort((a, b) => a.name.localeCompare(b.name) * (prefs.sort === "za" ? -1 : 1));
    if (posterObserver) posterObserver.disconnect();
    posterObserver = window.IntersectionObserver ? new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.src = entry.target.dataset.src;
        posterObserver.unobserve(entry.target);
      }
    }), { root: $("items"), rootMargin: "160px" }) : null;
    $("items").textContent = "";
    list.forEach((item) => {
      let row = document.createElement("div");
      row.className = "item";
      row.dataset.kind = item.kind;
      let tile = document.createElement("button");
      tile.className = "tile" + (item.resumeMs > 0 ? " saved" : "");
      tile.dataset.key = key(item);
      tile._item = item;
      let src = safeImage(item.icon);
      if (src) {
        let img = document.createElement("img");
        img.decoding = "async";
        if (posterObserver) {
          img.dataset.src = src;
          posterObserver.observe(img);
        } else img.src = src;
        img.alt = "";
        img.onerror = () => img.hidden = true;
        tile.appendChild(img);
      } else {
        let icon = document.createElement("span");
        icon.className = "placeholder";
        icon.textContent = item.kind === "live" ? "\u25A3" : "\u25B6";
        tile.appendChild(icon);
      }
      let label = document.createElement("strong");
      label.dataset.noTranslate = "";
      label.textContent = (item.seriesName ? item.seriesName + " \xB7 " : "") + item.name;
      tile.appendChild(label);
      if (kind === "all") {
        let badge = document.createElement("small");
        badge.textContent = { live: T("\u0642\u0646\u0627\u0629 \u0645\u0628\u0627\u0634\u0631\u0629", "Live TV"), vod: T("\u0641\u064A\u0644\u0645", "Movie"), series: T("\u0645\u0633\u0644\u0633\u0644", "Series") }[item.kind] || "";
        tile.appendChild(badge);
      }
      if (item.resumeMs > 0) {
        let resume = document.createElement("small");
        resume.className = "resume-tag";
        resume.textContent = T("\u0627\u0633\u062A\u0643\u0645\u0627\u0644 ", "Continue ") + stamp(item.resumeMs);
        tile.appendChild(resume);
      }
      let pointerTimer = null, suppress = false, anchor = null;
      tile.onclick = (e) => {
        if (suppress) {
          suppress = false;
          e.preventDefault();
          return;
        }
        activate(item);
      };
      tile.onpointerdown = (e) => {
        if (e.button !== 0) return;
        suppress = false;
        anchor = { x: e.clientX, y: e.clientY };
        pointerTimer = setTimeout(() => {
          suppress = true;
          toggle(item);
        }, 650);
      };
      const cancel = () => {
        clearTimeout(pointerTimer);
        pointerTimer = null;
      };
      tile.onpointermove = (e) => {
        if (anchor && Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y) > 12) cancel();
      };
      tile.onpointerup = cancel;
      tile.onpointercancel = cancel;
      tile.oncontextmenu = (e) => {
        e.preventDefault();
        cancel();
        if (!suppress) {
          suppress = true;
          toggle(item);
        }
      };
      tile.classList.toggle("favorite", favorites.some((f) => key(f) === key(item)));
      tile.setAttribute("aria-label", item.name + T(" \xB7 \u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0644\u064B\u0627 \u0644\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0641\u0636\u0644\u0629", " \xB7 Hold OK to toggle favorite"));
      row.append(tile);
      $("items").appendChild(row);
    });
    requestAnimationFrame(fitRows);
    if (!list.length) status(favoriteOnly ? T("\u0627\u0636\u063A\u0637 \u0645\u0637\u0648\u0651\u0644\u064B\u0627 \u0639\u0644\u0649 \u0623\u064A \u0639\u0646\u0648\u0627\u0646 \u0644\u0625\u0636\u0627\u0641\u062A\u0647 \u0647\u0646\u0627.", "Long-press any title to add it here.") : continueOnly ? T("\u0627\u0628\u062F\u0623 \u0641\u064A\u0644\u0645\u064B\u0627 \u0623\u0648 \u062D\u0644\u0642\u0629\u060C \u0648\u0647\u062A\u0638\u0647\u0631 \u0647\u0646\u0627 \u0628\u0639\u062F \u062D\u0641\u0638 \u0645\u0648\u0636\u0639 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629.", "Start a movie or episode. It appears here after playback progress is saved.") : T("\u0645\u0641\u064A\u0634 \u0645\u062D\u062A\u0648\u0649 \u0645\u0637\u0627\u0628\u0642 \u0644\u0644\u0628\u062D\u062B \u0623\u0648 \u0627\u0644\u062A\u0635\u0646\u064A\u0641.", "No titles match your search or category."));
    $("prev").hidden = favoriteOnly || continueOnly || page === 0;
    $("next").hidden = favoriteOnly || continueOnly || page * 60 + items.length >= total;
    $("page-number").textContent = favoriteOnly ? favorites.length + T(" \u0645\u0641\u0636\u0644\u0629", " favorites") : total ? T("\u0635\u0641\u062D\u0629 ", "Page ") + (page + 1) + " \xB7 " + total + T(" \u0639\u0646\u0648\u0627\u0646", " titles") : "";
  }
  function pageCacheKey() {
    return favoriteKey ? favoriteKey.replace(".favorites.", ".pages.") : "";
  }
  function cachedPage(query, value) {
    const bucket = pageCacheKey();
    if (!bucket) return null;
    try {
      let all = JSON.parse(localStorage.getItem(bucket) || "{}"), id = JSON.stringify(query);
      if (value) {
        if (!Array.isArray(value.items) || value.items.length > 60) return null;
        const clean = { items: value.items.map((item) => {
          const copy = Object.assign({}, item);
          delete copy.resumeMs;
          return copy;
        }), total: value.total, page: value.page, hasMore: value.hasMore };
        if (JSON.stringify(clean).length > 25e4) return null;
        all[id] = { at: Date.now(), data: clean };
        let keys = Object.keys(all).sort((a, b) => all[b].at - all[a].at);
        keys.slice(12).forEach((k) => delete all[k]);
        while (JSON.stringify(all).length > 15e5 && keys.length > 1) delete all[keys.pop()];
        localStorage.setItem(bucket, JSON.stringify(all));
        return clean;
      }
      const entry = all[id];
      return entry && Date.now() - entry.at < 6048e5 && Array.isArray(entry.data.items) ? entry.data : null;
    } catch (e) {
      return null;
    }
  }
  function clearPageCache() {
    const bucket = pageCacheKey();
    if (bucket) try {
      localStorage.removeItem(bucket);
    } catch (e) {
    }
  }
  function cacheStatus(offline) {
    const words = { ar: ["\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0623\u062D\u062F\u062B \u0645\u062D\u062A\u0648\u0649\u2026", "\u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0645\u062A\u0627\u062D\u061B \u062A\u0639\u0630\u0651\u0631 \u0627\u0644\u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u064A\u064B\u0627."], en: ["Checking for new content\u2026", "Your library is available; updates are temporarily unavailable."], fr: ["Recherche de nouveaut\xE9s\u2026", "Votre biblioth\xE8que est disponible ; mise \xE0 jour momentan\xE9ment indisponible."], zh: ["\u6B63\u5728\u68C0\u67E5\u65B0\u5185\u5BB9\u2026", "\u7247\u5E93\u4ECD\u53EF\u6D4F\u89C8\uFF0C\u6682\u65F6\u65E0\u6CD5\u66F4\u65B0\u3002"], ja: ["\u65B0\u3057\u3044\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u78BA\u8A8D\u4E2D\u2026", "\u30E9\u30A4\u30D6\u30E9\u30EA\u306F\u5229\u7528\u3067\u304D\u307E\u3059\u3002\u73FE\u5728\u3001\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3002"] };
    return (words[MorphLocale.get()] || words.en)[offline ? 1 : 0];
  }
  async function load() {
    var _a;
    if (kind === "all" && !favoriteOnly) {
      unifiedSearch($("search").value);
      return;
    }
    const selected = (_a = document.activeElement) == null ? void 0 : _a.dataset.key;
    if (selected) lastFocus = selected;
    const gen = ++generation;
    let hadCachedPage = false;
    status(T("\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0645\u0643\u062A\u0628\u0629\u2026", "Loading your library\u2026"));
    $("items").textContent = "";
    try {
      if (continueOnly) {
        let candidates = watchHistory;
        try {
          const nativeHistory = await call("history");
          if (Array.isArray(nativeHistory.items)) {
            const merged = /* @__PURE__ */ new Map();
            watchHistory.concat(nativeHistory.items).forEach((i) => merged.set(key(i), i));
            candidates = Array.from(merged.values()).sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0)).slice(0, 200);
          }
        } catch (e) {
        }
        if (gen !== generation) return;
        const result2 = await call("progress", { items: candidates });
        if (gen !== generation) return;
        items = (result2.items || []).filter((i) => i.resumeMs > 0 && ["vod", "episode"].includes(i.kind) && i.name.toLowerCase().includes($("search").value.trim().toLowerCase()));
        total = items.length;
        render();
        if (total) status(total + T(" \u0639\u0646\u0648\u0627\u0646 \u062A\u0642\u062F\u0631 \u062A\u0643\u0645\u0651\u0644\u0647", " titles ready to resume"));
        return;
      }
      if (favoriteOnly) {
        render();
        const result2 = await call("progress", { items: favorites });
        if (gen !== generation) return;
        if (Array.isArray(result2.items)) favorites = result2.items;
        render();
        status(T("\u0645\u0641\u0636\u0644\u062A\u0643", "Your favorites"));
        return;
      }
      const listQuery = { kind, category: kind !== "episode" && $("search").value.trim() ? "" : category, page, search: $("search").value.trim(), order: recentOnly ? "recent" : "provider" }, saved = cachedPage(listQuery);
      if (saved) {
        hadCachedPage = true;
        items = saved.items;
        total = saved.total;
        render();
        status(cacheStatus(false));
      }
      const result = await call("list", listQuery);
      if (gen !== generation) return;
      cachedPage(listQuery, result);
      const activeKey = document.activeElement && document.activeElement.dataset.key;
      if (activeKey) lastFocus = activeKey;
      items = result.items;
      if (kind === "episode" && seriesContext) items = items.map((i) => Object.assign({}, i, { icon: i.icon || seriesContext.icon, seriesName: seriesContext.name }));
      total = result.total;
      render();
      if (lastFocus && $("settings-panel").hidden && (document.activeElement === document.body || document.activeElement.closest("#items"))) {
        const selected2 = Array.from(document.querySelectorAll(".tile")).find((t) => t.dataset.key === lastFocus);
        if (selected2) selected2.focus();
      }
      if (items.length && guideMode) {
        status(T("\u0627\u062E\u062A\u0627\u0631 \u0642\u0646\u0627\u0629 \u0644\u0639\u0631\u0636 \u0645\u0648\u0627\u0639\u064A\u062F \u0628\u0631\u0627\u0645\u062C\u0647\u0627.", "Choose a channel to view its programme guide."));
      } else if (items.length) status(total + T(" \u0639\u0646\u0648\u0627\u0646 \xB7 \u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0644\u0644\u062A\u0634\u063A\u064A\u0644", " titles \xB7 choose a title to play"));
    } catch (e) {
      if (gen === generation) status(hadCachedPage ? cacheStatus(true) : e.message);
    }
  }
  async function categories() {
    const gen = ++categoryGeneration;
    $("categories").textContent = "";
    let all = document.createElement("button");
    all.textContent = T("\u0643\u0644 \u0627\u0644\u062A\u0635\u0646\u064A\u0641\u0627\u062A", "All categories");
    all.onclick = () => {
      continueOnly = false;
      recentOnly = false;
      favoriteOnly = false;
      category = "";
      page = 0;
      load();
    };
    $("categories").appendChild(all);
    try {
      const result = await call("categories", { kind });
      if (gen !== categoryGeneration) return;
      result.items.forEach((item) => {
        let button = document.createElement("button");
        button.dataset.noTranslate = "";
        button.dataset.category = String(item.category_id);
        button.textContent = item.category_name;
        button.onclick = () => {
          continueOnly = false;
          recentOnly = false;
          favoriteOnly = false;
          category = String(item.category_id);
          page = 0;
          $("search").value = "";
          load();
        };
        $("categories").appendChild(button);
      });
    } catch (e) {
      status(e.message);
    }
  }
  function chrome() {
    if (continueOnly) {
      $("section-tag").textContent = "CONTINUE WATCHING";
      $("section-title").textContent = T("\u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629", "Continue watching");
      return;
    }
    if (kind === "episode" || kind === "all") return;
    $("section-tag").textContent = { live: "LIVE TV", vod: "CINEMA", series: "SERIES" }[kind];
    $("section-title").textContent = { live: T("\u0643\u0644 \u0642\u0646\u0648\u0627\u062A\u0643. \u0645\u0643\u0627\u0646 \u0648\u0627\u062D\u062F.", "All your channels. One place."), vod: T("\u0644\u064A\u0644\u062A\u0643\u060C \u0641\u064A\u0644\u0645\u0643.", "Your evening. Your movie."), series: T("\u062D\u0644\u0642\u0629 \u0648\u0631\u0627 \u062D\u0644\u0642\u0629.", "One episode after another.") }[kind];
  }
  let phoneMoreBusy = false;
  async function phoneLoadMore() {
    if (phoneMoreBusy || kind === "all" || favoriteOnly || continueOnly || items.length >= total || !items.length) return;
    phoneMoreBusy = true;
    const gen = generation, next = page + 1, top = $("items").scrollTop;
    try {
      const query = { kind, category: kind !== "episode" && $("search").value.trim() ? "" : category, page: next, search: $("search").value.trim(), order: recentOnly ? "recent" : "provider" };
      const result = await call("list", query);
      if (gen !== generation) return;
      cachedPage(query, result);
      if (!result.items.length) {
        total = items.length;
        return;
      }
      page = next;
      let incoming = result.items;
      if (kind === "episode" && seriesContext) incoming = incoming.map((i) => Object.assign({}, i, { icon: i.icon || seriesContext.icon, seriesName: seriesContext.name }));
      items = items.concat(incoming);
      total = result.total;
      render();
      $("items").scrollTop = top;
    } catch (e) {
      if (gen === generation) status(e.message);
    } finally {
      phoneMoreBusy = false;
    }
  }
  async function change(next, query = "") {
    guideMode = false;
    continueOnly = false;
    recentOnly = false;
    showLibrary();
    kind = next;
    document.body.dataset.kind = kind;
    category = "";
    page = 0;
    favoriteOnly = false;
    $("search").value = query;
    $("only-favorites").classList.remove("active");
    ["live", "vod", "series"].forEach((k) => $("kind-" + k).classList.toggle("active", k === kind));
    chrome();
    categories();
    load();
  }
  ["live", "vod", "series"].forEach((k) => $("kind-" + k).onclick = () => change(k));
  $("only-favorites").onclick = () => {
    showLibrary();
    continueOnly = false;
    recentOnly = false;
    favoriteOnly = !favoriteOnly;
    $("only-favorites").classList.toggle("active", favoriteOnly);
    page = 0;
    load();
  };
  $("search-go").onclick = () => {
    page = 0;
    load();
  };
  $("search").onkeydown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
      page = 0;
      load();
    }
  };
  $("prev").onclick = () => {
    page--;
    load();
  };
  $("next").onclick = () => {
    page++;
    load();
  };
  async function refresh() {
    status(T("\u062C\u0627\u0631\u064A \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0642\u0646\u0648\u0627\u062A \u0645\u0646 \u0627\u0644\u0645\u0632\u0648\u0651\u062F\u2026", "Refreshing content from your provider\u2026"));
    try {
      await call("refresh");
      if (kind !== "episode") categories();
      page = 0;
      load();
    } catch (e) {
      status(e.message);
    }
  }
  $("refresh").onclick = refresh;
  async function openSettings() {
    settingsOrigin = document.activeElement;
    try {
      settings = Object.assign(settings, await call("settings"));
    } catch (e) {
    }
    $("setting-language").value = settings.language;
    $("setting-scale").value = settings.scale;
    $("setting-resume").checked = settings.resume;
    $("setting-density").value = prefs.density;
    $("setting-sort").value = prefs.sort;
    $("setting-motion").checked = prefs.motion;
    $("settings-panel").hidden = false;
    $("settings-status").textContent = "";
    $("setting-language").focus();
  }
  function closeSettings() {
    $("settings-panel").hidden = true;
    restoreOrigin(settingsOrigin);
  }
  $("settings-open").onclick = openSettings;
  $("settings-close").onclick = closeSettings;
  $("settings-save").onclick = async () => {
    try {
      prefs = { density: $("setting-density").value, sort: $("setting-sort").value, motion: $("setting-motion").checked };
      localStorage.setItem(prefKey, JSON.stringify(prefs));
      applyPrefs();
      settings = await call("saveSettings", { language: $("setting-language").value, scale: $("setting-scale").value, resume: $("setting-resume").checked });
      MorphLocale.set(settings.language);
      closeSettings();
      load();
    } catch (e) {
      $("settings-status").textContent = e.message;
    }
  };
  $("clear-progress").onclick = async () => {
    try {
      await call("clearProgress");
      $("settings-status").textContent = T("\u0627\u062A\u0645\u0633\u062D\u062A \u0645\u0648\u0627\u0636\u0639 \u0627\u0644\u0627\u0633\u062A\u0643\u0645\u0627\u0644.", "Playback positions cleared.");
    } catch (e) {
      $("settings-status").textContent = e.message;
    }
  };
  function back() {
    if (window.PhoneIptvNavigation && window.PhoneIptvNavigation.back()) return;
    if (!$("epg-panel").hidden) {
      closeEpg();
      return;
    }
    if (!$("details-panel").hidden) closeDetails();
    else if (!$("settings-panel").hidden) closeSettings();
    else if (kind === "episode") change("series");
    else if ($("dashboard").hidden) home();
    else IptvNative.exit();
  }
  $("back").onclick = back;
  let lastPortal = null, settingsOrigin = null, epgOrigin = null;
  function restorePortal() {
    const target = lastPortal && lastPortal.isConnected && !lastPortal.hidden ? lastPortal : document.querySelector(".portal-grid button:not([hidden])");
    if (target) target.focus();
  }
  function restoreOrigin(node) {
    if (node && node.isConnected && node.offsetWidth && !node.closest("[hidden]")) node.focus();
    else if (!$("dashboard").hidden) restorePortal();
    else {
      const tile = document.querySelector(".tile");
      if (tile) tile.focus();
    }
  }
  document.addEventListener("focusin", (e) => {
    if (e.target.closest(".portal-grid button")) lastPortal = e.target.closest(".portal-grid button");
  });
  function dashboardMove(code, current) {
    if ($("dashboard").hidden || !$("settings-panel").hidden || !$("details-panel").hidden || !$("epg-panel").hidden) return false;
    const portals = Array.from(document.querySelectorAll(".portal-grid button")).filter((b) => !b.hidden), cards = Array.from(document.querySelectorAll(".watch-card button")), search = $("unified-query"), tools = Array.from(document.querySelectorAll(".portal-tools button"));
    function focus(node) {
      if (node) {
        node.focus();
        node.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      return true;
    }
    function horizontal(nodes) {
      const ordered = nodes.slice().sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left), index = ordered.indexOf(current);
      return focus(ordered[Math.max(0, Math.min(ordered.length - 1, index + (code === 39 ? 1 : -1)))]);
    }
    if (portals.includes(current)) {
      lastPortal = current;
      if (code === 38) {
        const k = current.dataset.open === "series" ? "episode" : current.dataset.open;
        return focus(k && watchNodes[k] ? $(watchNodes[k][4]) : lastWatchFocus || cards[0]);
      }
      if (code === 40) return focus(tools[0]);
      if (code === 37 || code === 39) return horizontal(portals);
    }
    if (cards.includes(current)) {
      lastWatchFocus = current;
      if (code === 40) {
        const k = current.closest(".watch-card").dataset.watchKind;
        return focus(document.querySelector('[data-open="' + (k === "episode" ? "series" : k) + '"]') || portals[0]);
      }
      if (code === 38) return focus(search);
      if (code === 37 || code === 39) return horizontal(cards);
    }
    if (code === 40 && current.closest("header")) return focus(lastWatchFocus || cards[0]);
    if (code === 38 && tools.includes(current)) return focus(lastPortal && lastPortal.isConnected && !lastPortal.hidden ? lastPortal : portals[0]);
    return false;
  }
  function move(code) {
    var _a;
    if (window.TvIptvLayout && TvIptvLayout.move(code)) return;
    if (dashboardMove(code, document.activeElement)) return;
    const scope = !$("epg-panel").hidden ? $("epg-panel") : !$("details-panel").hidden ? $("details-panel") : $("settings-panel").hidden ? document : $("settings-panel");
    let all = Array.from(scope.querySelectorAll('button,input,select,[tabindex="0"]')).filter((e) => e.offsetWidth && !e.disabled && !e.closest("[hidden]")), current = document.activeElement;
    if (!all.includes(current)) {
      if (!$("dashboard").hidden) restorePortal();
      else (_a = scope.querySelector(".tile") || all[0]) == null ? void 0 : _a.focus();
      return;
    }
    let a = current.getBoundingClientRect(), ax = a.x + a.width / 2, ay = a.y + a.height / 2, best = null, score = Infinity;
    all.forEach((e) => {
      if (e === current) return;
      let b = e.getBoundingClientRect(), dx = b.x + b.width / 2 - ax, dy = b.y + b.height / 2 - ay;
      if (code === 37 && dx >= -2 || code === 39 && dx <= 2 || code === 38 && dy >= -2 || code === 40 && dy <= 2) return;
      let horizontal = code === 37 || code === 39, cost = Math.abs(horizontal ? dx : dy) + Math.abs(horizontal ? dy : dx) * 3;
      if (cost < score) {
        score = cost;
        best = e;
      }
    });
    if (best) {
      best.focus();
      best.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented) return;
    if ([27, 10009, 461].includes(e.keyCode)) {
      e.preventDefault();
      back();
    } else if (e.keyCode >= 37 && e.keyCode <= 40) {
      if (document.activeElement.tagName === "SELECT") return;
      e.preventDefault();
      move(e.keyCode);
    } else if (e.keyCode === 13 && document.activeElement.tagName === "BUTTON") {
      e.preventDefault();
      let target = document.activeElement;
      if (target.classList.contains("tile")) {
        if (!held) {
          held = { target, long: false, timer: setTimeout(() => {
            if (held) {
              held.long = true;
              toggle(target._item);
            }
          }, 650) };
        }
      } else if (!e.repeat) target.click();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.keyCode === 13 && held) {
      e.preventDefault();
      let press = held;
      held = null;
      clearTimeout(press.timer);
      if (!press.long && press.target.isConnected) press.target.click();
    }
  });
  window.IptvTvBridge = { call, openEpg, openDetails, closeDetails, toggle, key, translate: T, setSort: (mode) => {
    if (!["provider", "az", "za"].includes(mode)) return;
    prefs.sort = mode;
    try {
      localStorage.setItem(prefKey, JSON.stringify(prefs));
    } catch (e) {
    }
    load();
  }, getState: () => ({ kind, category, favorites, seriesContext, detailItem, items, sort: prefs.sort }) };
  window.IptvUI = { keyboardResult: (id, text) => {
    if (id !== "unified-query") return;
    $(id).value = text;
    $(id).focus();
    if (text.trim()) unifiedSearch(text);
  }, phoneLoadMore, back, refresh, settings: openSettings, resume: () => {
    call("settings").then((value) => {
      settings = Object.assign(settings, value);
      if (MorphLocale.get() !== settings.language) MorphLocale.set(settings.language);
      if (detailItem) {
        const gen = detailGeneration;
        call("progress", { items: [detailItem] }).then((r) => {
          if (gen === detailGeneration && detailItem) {
            detailItem = Object.assign(detailItem, r.items[0]);
            drawDetails();
          }
        }).catch(() => {
        });
      } else if (!$("dashboard").hidden) updateWatchHero();
      else if (kind !== "live") load();
    }).catch(() => {
    });
  }, remote: (method, value) => {
    if (method === "text") {
      if (document.activeElement === $("unified-query")) {
        $("unified-query").value = value;
        return { sent: true };
      }
      if (document.activeElement !== $("search")) return { sent: false, error: T("\u062D\u062F\u062F \u062E\u0627\u0646\u0629 \u0628\u062D\u062B \u0627\u0644\u0645\u0643\u062A\u0628\u0629 \u0627\u0644\u0623\u0648\u0644.", "Focus the library search field first.") };
      $("search").value = value;
      return { sent: true };
    }
    if (value === "FAVORITE") {
      let target = document.activeElement;
      if (target == null ? void 0 : target._item) {
        toggle(target._item);
        return { sent: true };
      }
      return { sent: false, error: T("\u062D\u062F\u062F \u0642\u0646\u0627\u0629 \u0623\u0648 \u0641\u064A\u0644\u0645\u064B\u0627 \u0623\u0648 \u0645\u0633\u0644\u0633\u0644\u064B\u0627 \u0627\u0644\u0623\u0648\u0644.", "Focus a channel, movie or series first.") };
    }
    if (value === "SETTINGS") {
      openSettings();
      return { sent: true };
    }
    if (value === "ENTER") {
      let target = document.activeElement;
      if (target === $("unified-query")) {
        editSearch();
      } else if (target === $("search")) {
        page = 0;
        load();
      } else if ((target == null ? void 0 : target.tagName) === "BUTTON") target.click();
      return { sent: true };
    }
    const codes = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, RETURN: 27, HOME: 27 };
    if (!codes[value]) return { sent: false };
    let e = new Event("keydown", { bubbles: true, cancelable: true });
    Object.defineProperty(e, "keyCode", { value: codes[value] });
    (document.activeElement || document).dispatchEvent(e);
    return { sent: true };
  } };
  window.addEventListener("morphLanguage", () => {
    chrome();
    render();
    drawDetails();
    portalText();
    drawWatchHero();
    paintSpecial();
  });
  call("settings").then((value) => {
    settings = Object.assign(settings, value);
    MorphLocale.set(settings.language);
  }).catch(() => {
  });
  call("summary").then((info) => {
    favoriteKey = "tvmorph.iptv.favorites." + (info.profileId || "default") + (info.viewerId && info.viewerId !== "default" ? "@" + info.viewerId : "");
    try {
      favorites = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
    } catch (e) {
      favorites = [];
    }
    historyKey = favoriteKey.replace(".favorites.", ".history.");
    try {
      watchHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
      if (!Array.isArray(watchHistory)) watchHistory = [];
    } catch (e) {
      watchHistory = [];
    }
    $("playlist-name").textContent = info.name || "My TV";
    $("account-note").textContent = T("\u0645\u062D\u062A\u0648\u0649 \u0627\u0634\u062A\u0631\u0627\u0643\u0643 \u0627\u0644\u062E\u0627\u0635", "Your subscription content") + (info.viewerName ? " \xB7 " + info.viewerName : "");
    ["live", "vod", "series"].forEach((k) => $("kind-" + k).hidden = info[k] === false);
    ["live", "vod", "series"].forEach((k) => document.querySelector('[data-open="' + k + '"]').hidden = info[k] === false);
    accountInfo = info;
    $("epg-open").hidden = info.live === false;
    prefKey = "tvmorph.iptv.view." + (info.profileId || "default") + (info.viewerId && info.viewerId !== "default" ? "@" + info.viewerId : "");
    try {
      Object.assign(prefs, JSON.parse(localStorage.getItem(prefKey) || "{}"));
    } catch (e) {
    }
    applyPrefs();
    home();
  }).catch((e) => {
    status(T("\u0623\u0636\u0641 \u0627\u0634\u062A\u0631\u0627\u0643\u0643 \u0645\u0646 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A.", "Add your subscription in settings."));
    home();
    openSettings().then(() => {
      $("account-panel").hidden = false;
      $("account-server").focus();
    });
  });
})();
