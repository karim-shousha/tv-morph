(function() {
  "use strict";
  if (!/width=1920/.test(document.querySelector("meta[name=viewport]").content)) return;
  document.documentElement.setAttribute("data-tv-library", "");
  const $ = (id) => document.getElementById(id), api = window.IptvTvBridge, t = api.translate;
  const section = document.querySelector("main>section");
  const preview = document.createElement("aside");
  preview.id = "tv-live-preview";
  preview.innerHTML = '<div class="tv-preview-art"><img id="tv-channel-logo" alt=""><span>\u25B6</span></div><span class="eyebrow" id="tv-preview-label"></span><h2 id="tv-channel-name" dir="auto"></h2><p id="tv-preview-hint"></p><button id="tv-channel-play"></button><button id="tv-channel-guide"></button><button id="tv-channel-favorite"></button>';
  section.appendChild(preview);
  let channel = null, lastChannel = null, detailId = "", episodePage = 0, episodeGeneration = 0, episodeRows = [];
  const episodePanel = document.createElement("section");
  episodePanel.id = "tv-series-episodes";
  episodePanel.hidden = true;
  episodePanel.innerHTML = '<div class="tv-episode-toolbar"><h3 id="tv-episodes-title"></h3><label for="tv-season" id="tv-season-label"></label><select id="tv-season"></select><button id="tv-episodes-prev"></button><button id="tv-episodes-next"></button></div><p id="tv-episodes-status" role="status"></p><div id="tv-episode-list"></div>';
  document.querySelector(".details-dialog").appendChild(episodePanel);
  const detailFavorite = document.createElement("button");
  detailFavorite.id = "tv-detail-favorite";
  document.querySelector(".detail-actions").appendChild(detailFavorite);
  detailFavorite.onclick = () => {
    const item = api.getState().detailItem;
    if (item) {
      api.toggle(item);
      detailFavorite.textContent = favoriteLabel(item);
      focus(detailFavorite);
    }
  };
  function favoriteLabel(item) {
    return (api.getState().favorites.some((f) => api.key(f) === api.key(item)) ? "\u2665 " : "\u2661 ") + t("\u0627\u0644\u0645\u0641\u0636\u0644\u0629", "Favourite");
  }
  function image(node, value) {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw Error();
      node.src = url.href;
      node.hidden = false;
    } catch (e) {
      node.removeAttribute("src");
      node.hidden = true;
    }
    node.onerror = () => {
      node.hidden = true;
    };
  }
  function focus(node) {
    if (node) {
      node.focus();
      node.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    return true;
  }
  function selectChannel(item) {
    channel = item;
    lastChannel = api.key(item);
    image($("tv-channel-logo"), item.icon);
    $("tv-channel-name").textContent = item.name;
    $("tv-preview-label").textContent = t("\u0627\u0644\u0642\u0646\u0648\u0627\u062A \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629", "LIVE TV");
    $("tv-preview-hint").textContent = t("\u0627\u0636\u063A\u0637 OK \u0639\u0644\u0649 \u0627\u0644\u0642\u0646\u0627\u0629 \u0644\u0644\u062A\u0634\u063A\u064A\u0644 \u0628\u0645\u0644\u0621 \u0627\u0644\u0634\u0627\u0634\u0629", "Press OK on a channel to play full screen");
    $("tv-channel-play").textContent = t("\u25B6 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u0642\u0646\u0627\u0629", "\u25B6 Play channel");
    $("tv-channel-guide").textContent = t("\u062F\u0644\u064A\u0644 \u0627\u0644\u0628\u0631\u0627\u0645\u062C", "Programme guide");
    $("tv-channel-favorite").textContent = (api.getState().favorites.some((f) => api.key(f) === api.key(item)) ? "\u2605 " : "\u2606 ") + t("\u0627\u0644\u0645\u0641\u0636\u0644\u0629", "Favourite");
  }
  $("tv-channel-play").onclick = () => {
    if (channel) api.call("play", channel).catch((e) => {
      $("tv-preview-hint").textContent = e.message;
    });
  };
  $("tv-channel-guide").onclick = () => {
    if (channel) api.openEpg(channel);
  };
  $("tv-channel-favorite").onclick = () => {
    if (channel) {
      api.toggle(channel);
      selectChannel(channel);
    }
  };
  function decorate() {
    const state = api.getState();
    document.querySelectorAll("#categories button").forEach((b) => {
      const active = !!b.dataset.category && b.dataset.category === state.category;
      b.classList.toggle("active", active);
      b.setAttribute("aria-current", active ? "true" : "false");
      if (active) $("section-title").textContent = b.textContent;
    });
    document.querySelectorAll("#items .tile").forEach((b) => {
      const item = b._item;
      if (!item) return;
      b.dir = "auto";
      if (item.kind === "live") {
        b.classList.toggle("tv-selected-channel", api.key(item) === lastChannel);
        let favorite = b.parentElement.querySelector(".tv-live-favorite");
        if (!favorite) {
          favorite = document.createElement("button");
          favorite.className = "tv-live-favorite";
          b.parentElement.appendChild(favorite);
          favorite.onclick = () => {
            api.toggle(item);
            decorate();
            const replacement = Array.from(document.querySelectorAll("#items .tile")).find((tile) => api.key(tile._item) === api.key(item));
            focus(replacement ? replacement.parentElement.querySelector(".tv-live-favorite") : document.querySelector("#items .tile") || $("browse-favorites"));
          };
        }
        const saved = state.favorites.some((f) => api.key(f) === api.key(item));
        favorite.textContent = saved ? "\u2605" : "\u2606";
        favorite.setAttribute("aria-pressed", String(saved));
        favorite.setAttribute("aria-label", (saved ? t("\u0625\u0632\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u0641\u0636\u0644\u0629: ", "Remove from favorites: ") : t("\u0625\u0636\u0627\u0641\u0629 \u0644\u0644\u0645\u0641\u0636\u0644\u0629: ", "Add to favorites: ")) + item.name);
      } else if (item.rating && !b.querySelector(".tv-rating")) {
        const badge = document.createElement("span");
        badge.className = "tv-rating";
        badge.textContent = "\u2605 " + item.rating;
        b.appendChild(badge);
      }
    });
    if (state.kind === "live") {
      const visibleTiles = Array.from(document.querySelectorAll("#items .tile")), first = visibleTiles[0];
      if (first && (!channel || !visibleTiles.some((b) => api.key(b._item) === lastChannel))) selectChannel(first._item);
      if (!first) {
        channel = null;
        $("tv-channel-name").textContent = t("\u0627\u062E\u062A\u0631 \u0642\u0646\u0627\u0629", "Choose a channel");
        $("tv-channel-logo").hidden = true;
      }
      ["tv-channel-play", "tv-channel-guide", "tv-channel-favorite"].forEach((id) => {
        $(id).disabled = !channel;
      });
    }
  }
  new MutationObserver(decorate).observe($("items"), { childList: true });
  new MutationObserver(decorate).observe($("categories"), { childList: true });
  document.addEventListener("focusin", (e) => {
    const tile = e.target.closest(".tile");
    if (tile && tile._item && tile._item.kind === "live") {
      selectChannel(tile._item);
      decorate();
    }
  });
  async function loadEpisodes(item) {
    const generation = ++episodeGeneration;
    $("tv-episode-list").textContent = "";
    $("tv-episodes-status").textContent = t("\u062C\u0627\u0631\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062D\u0644\u0642\u0627\u062A\u2026", "Loading episodes\u2026");
    $("tv-episodes-prev").disabled = true;
    $("tv-episodes-next").disabled = true;
    try {
      const season = $("tv-season").value;
      const result = await api.call("list", { kind: "episode", category: item.id, page: episodePage, search: season ? "S" + season + " \xB7 " : "" });
      if (generation !== episodeGeneration || detailId !== item.id) return;
      episodeRows = result.items || [];
      episodeRows.forEach((episode) => {
        const row = document.createElement("button");
        row.className = "tv-episode";
        row.dir = "auto";
        const art = document.createElement("img");
        art.alt = "";
        image(art, episode.icon || item.icon);
        const copy = document.createElement("span"), name = document.createElement("strong"), meta = document.createElement("small"), plot = document.createElement("span");
        name.textContent = episode.name;
        meta.textContent = [episode.duration, episode.rating ? "\u2605 " + episode.rating : "", episode.resumeMs > 0 ? t("\u0627\u0633\u062A\u0643\u0645\u0627\u0644 \u0627\u0644\u0645\u0634\u0627\u0647\u062F\u0629", "Continue watching") : ""].filter(Boolean).join(" \xB7 ");
        plot.textContent = episode.plot || "";
        plot.className = "tv-episode-plot";
        copy.append(name, meta, plot);
        row.append(art, copy);
        row.onclick = () => api.call("play", Object.assign({}, episode, { icon: episode.icon || item.icon, seriesName: item.name })).catch((e) => {
          $("tv-episodes-status").textContent = e.message;
        });
        $("tv-episode-list").appendChild(row);
      });
      $("tv-episodes-status").textContent = result.total ? result.total + t(" \u062D\u0644\u0642\u0629", " episodes") : t("\u0627\u0644\u0645\u0632\u0648\u0651\u062F \u0644\u0645 \u064A\u0648\u0641\u0651\u0631 \u062D\u0644\u0642\u0627\u062A \u0644\u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0633\u0645.", "Your provider has no episodes for this season.");
      $("tv-episodes-prev").disabled = episodePage === 0;
      $("tv-episodes-next").disabled = !result.hasMore;
    } catch (e) {
      if (generation === episodeGeneration) $("tv-episodes-status").textContent = t("\u062A\u0639\u0630\u0651\u0631 \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u062D\u0644\u0642\u0627\u062A. \u0627\u0633\u062A\u062E\u062F\u0645 \u0639\u0631\u0636 \u0627\u0644\u062D\u0644\u0642\u0627\u062A \u0644\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u0643\u062A\u0628\u0629.", "Could not load episodes. Use View episodes to try from the library.");
    }
  }
  $("tv-season").onchange = () => {
    episodePage = 0;
    loadEpisodes(api.getState().detailItem);
  };
  $("tv-episodes-prev").onclick = () => {
    if (episodePage > 0) {
      episodePage--;
      loadEpisodes(api.getState().detailItem);
    }
  };
  $("tv-episodes-next").onclick = () => {
    episodePage++;
    loadEpisodes(api.getState().detailItem);
  };
  window.TvIptvLayout = {
    closeDetails() {
      detailId = "";
      ++episodeGeneration;
      episodeRows = [];
      episodePanel.hidden = true;
      document.querySelector(".details-dialog").classList.remove("tv-series-detail");
    },
    details(item) {
      detailFavorite.textContent = favoriteLabel(item);
      const series = item.kind === "series";
      episodePanel.hidden = !series;
      document.querySelector(".details-dialog").classList.toggle("tv-series-detail", series);
      if (!series) return;
      $("tv-episodes-title").textContent = t("\u0627\u0644\u062D\u0644\u0642\u0627\u062A", "Episodes");
      $("tv-season-label").textContent = t("\u0627\u0644\u0645\u0648\u0633\u0645", "Season");
      $("tv-episodes-prev").textContent = t("\u0627\u0644\u0633\u0627\u0628\u0642", "Previous");
      $("tv-episodes-next").textContent = t("\u0627\u0644\u062A\u0627\u0644\u064A", "Next");
      const newItem = detailId !== item.id;
      if (newItem) {
        detailId = item.id;
        episodePage = 0;
        $("tv-season").textContent = "";
      }
      const seasons = Array.isArray(item.seasons) ? item.seasons : [];
      const signature = JSON.stringify(seasons);
      if (newItem || $("tv-season").dataset.signature !== signature) {
        const selected = $("tv-season").value;
        $("tv-season").textContent = "";
        const all = document.createElement("option");
        all.value = "";
        all.textContent = t("\u0643\u0644 \u0627\u0644\u0645\u0648\u0627\u0633\u0645", "All seasons");
        $("tv-season").appendChild(all);
        seasons.forEach((s) => {
          const option = document.createElement("option");
          option.value = String(s);
          option.textContent = t("\u0627\u0644\u0645\u0648\u0633\u0645 ", "Season ") + s;
          $("tv-season").appendChild(option);
        });
        $("tv-season").value = selected;
        $("tv-season").dataset.signature = signature;
      }
      if (newItem) loadEpisodes(item);
    },
    move(code) {
      const current = document.activeElement;
      if (!$("details-panel").hidden) {
        const rows = Array.from(document.querySelectorAll(".tv-episode")), index2 = rows.indexOf(current);
        if (index2 >= 0 && (code === 38 || code === 40)) return focus(code === 38 ? rows[index2 - 1] || $("tv-season") : rows[index2 + 1] || rows[index2]);
        if (code === 40 && (current.closest(".detail-actions") || current === $("tv-season"))) return rows.length ? focus(rows[0]) : false;
        return false;
      }
      if (!$("settings-panel").hidden || !$("epg-panel").hidden || !$("dashboard").hidden) return false;
      const tiles = Array.from(document.querySelectorAll("#items .tile"));
      if (code === 38 && tiles.includes(current)) {
        const rowTop = current.parentElement.offsetTop;
        if (!tiles.some((tile) => tile.parentElement.offsetTop < rowTop - 2)) return focus($("unified-query"));
      }
      if (code === 40 && (current === $("unified-query") || current === $("unified-go"))) return focus(tiles.find((b) => api.key(b._item) === lastChannel) || tiles[0]);
      if (current.classList.contains("tv-live-favorite")) {
        const tile = current.parentElement.querySelector(".tile"), index2 = tiles.indexOf(tile);
        if (code === 37) return focus(tile);
        if (code === 39) return focus($("tv-channel-favorite"));
        if (code === 38 || code === 40) {
          const next = tiles[index2 + (code === 38 ? -1 : 1)];
          return focus(next ? next.parentElement.querySelector(".tv-live-favorite") : code === 38 ? $("unified-query") : current);
        }
      }
      if (api.getState().kind === "live" && tiles.includes(current)) {
        const index2 = tiles.indexOf(current);
        if (code === 38 || code === 40) return focus(tiles[index2 + (code === 38 ? -1 : 1)] || (code === 38 ? $("unified-query") : current));
        if (code === 39) return focus(current.parentElement.querySelector(".tv-live-favorite"));
        if (code === 37) return focus(document.querySelector("#categories button.active") || $("browse-all"));
      }
      if (current.closest("#tv-live-preview") && code === 37) return focus(tiles.find((b) => api.key(b._item) === lastChannel) || tiles[0]);
      const rail = Array.from(document.querySelectorAll("#library-special button,#categories button")).filter((b) => b.offsetWidth && !b.hidden);
      const index = rail.indexOf(current);
      if (index >= 0) {
        if (code === 38 || code === 40) return focus(rail[index + (code === 38 ? -1 : 1)] || (code === 38 ? $("home-open") : current));
        if (code === 39 && tiles.length) return focus(tiles[0]);
      }
      return false;
    }
  };
})();
