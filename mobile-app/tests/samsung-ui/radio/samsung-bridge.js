window.SamsungStations = [
  {
    "id": "quran_cairo",
    "name": "\u0625\u0630\u0627\u0639\u0629 \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645 \u0645\u0646 \u0627\u0644\u0642\u0627\u0647\u0631\u0629",
    "category": "\u0642\u0631\u0622\u0646 \u0643\u0631\u064A\u0645",
    "streamUrl": "https://stream.radiojar.com/8s5u5tpdtwzuv",
    "verified": true,
    "contentType": "audio/mpeg",
    "nameEn": "Quran Radio \xB7 Cairo"
  },
  {
    "id": "nagham_fm_1053",
    "name": "Nagham FM 105.3",
    "category": "FM",
    "streamUrl": "https://ahmsamir.radioca.st/stream",
    "verified": true,
    "contentType": "audio/mpeg",
    "nameEn": "Nagham FM 105.3"
  },
  {
    "id": "nogoum_fm",
    "name": "Nogoum FM",
    "category": "FM",
    "streamUrl": "https://stream-159.zeno.fm/qb1zvsykm98uv",
    "verified": true,
    "contentType": "audio/mpeg",
    "nameEn": "Nogoum FM"
  },
  {
    "id": "elradio_9090",
    "name": "El Radio 9090",
    "category": "FM",
    "streamUrl": "https://9090streaming.mobtada.com/9090FMEGYPT",
    "verified": true,
    "contentType": "audio/mpeg",
    "nameEn": "El Radio 9090"
  },
  {
    "id": "groove_salad",
    "name": "SomaFM \xB7 Groove Salad",
    "category": "FM",
    "streamUrl": "https://ice5.somafm.com/groovesalad-128-mp3",
    "verified": true,
    "contentType": "audio/mpeg",
    "nameEn": "SomaFM \xB7 Groove Salad"
  },
  {
    "id": "secret_agent",
    "name": "SomaFM \xB7 Secret Agent",
    "category": "FM",
    "streamUrl": "https://ice5.somafm.com/secretagent-128-mp3",
    "verified": true,
    "contentType": "audio/mpeg",
    "nameEn": "SomaFM \xB7 Secret Agent"
  },
  {
    "id": "quran_mishary_alafasy",
    "name": "\u0625\u0630\u0627\u0639\u0629 \u0645\u0634\u0627\u0631\u064A \u0627\u0644\u0639\u0641\u0627\u0633\u064A",
    "category": "\u0642\u0631\u0622\u0646 \u0643\u0631\u064A\u0645",
    "streamUrl": "https://qurango.net/radio/mishary_alafasi",
    "verified": true,
    "contentType": "audio/mpeg",
    "nameEn": "Mishary Alafasy"
  },
  {
    "id": "quran_tafsir",
    "name": "\u0625\u0630\u0627\u0639\u0629 \u062A\u0641\u0633\u064A\u0631 \u0627\u0644\u0642\u0631\u0622\u0646 \u0627\u0644\u0643\u0631\u064A\u0645",
    "category": "\u0642\u0631\u0622\u0646 \u0643\u0631\u064A\u0645",
    "streamUrl": "https://radio.quranradiotafsir.com/9992/stream",
    "verified": true,
    "contentType": "audio/mpeg",
    "nameEn": "Quran Tafsir Radio"
  },
  {
    "id": "on_sport_fm",
    "name": "\u0623\u0648\u0646 \u0633\u0628\u0648\u0631\u062A FM 93.7",
    "nameEn": "ON Sport FM 93.7",
    "category": "Sports",
    "streamUrl": "https://carina.streamerr.co:2020/stream/OnSportFM",
    "verified": false,
    "available": false,
    "unavailableReason": "stream-offline",
    "contentType": "audio/mpeg",
    "sourceUrl": "https://www.youtube.com/@ONsportFM"
  },
  {
    "id": "talksport",
    "name": "talkSPORT \xB7 \u0631\u064A\u0627\u0636\u0629 \u0628\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629",
    "nameEn": "talkSPORT",
    "category": "Sports",
    "streamUrl": "https://radio.talksport.com/stream",
    "verified": true,
    "contentType": "audio/aac",
    "sourceUrl": "https://radio.talksport.com/stream"
  },
  {
    "id": "talksport_2",
    "name": "talkSPORT 2 \xB7 \u0631\u064A\u0627\u0636\u0629 \u0628\u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629",
    "nameEn": "talkSPORT 2",
    "category": "Sports",
    "streamUrl": "https://radio.talksport.com/stream2",
    "verified": true,
    "contentType": "audio/aac",
    "sourceUrl": "https://radio.talksport.com/stream2"
  },
  {
    "id": "rmc",
    "name": "RMC \xB7 \u0631\u064A\u0627\u0636\u0629 \u0648\u062D\u0648\u0627\u0631 \u0628\u0627\u0644\u0641\u0631\u0646\u0633\u064A\u0629",
    "nameEn": "RMC \xB7 Sports & Talk (French)",
    "category": "Sports",
    "streamUrl": "https://audio.bfmtv.com/rmcradio_128.mp3",
    "verified": true,
    "contentType": "audio/mpeg",
    "sourceUrl": "https://rmc.bfmtv.com/"
  }
];
(function() {
  "use strict";
  var media = parent.SamsungMedia;
  if (location.pathname.indexOf("/radio/") >= 0) {
    window.RadioNative = { catalogJson: function() {
      return JSON.stringify(window.SamsungStations);
    }, favoritesJson: function() {
      return localStorage.getItem("morph.radio.favorites" + (parent.ClearTV.Profiles.active() === "default" ? "" : "@" + parent.ClearTV.Profiles.active())) || "[]";
    }, favorite: function(id, on) {
      var all = JSON.parse(this.favoritesJson()), i = all.indexOf(id);
      if (on && i < 0) all.push(id);
      if (!on && i >= 0) all.splice(i, 1);
      localStorage.setItem("morph.radio.favorites" + (parent.ClearTV.Profiles.active() === "default" ? "" : "@" + parent.ClearTV.Profiles.active()), JSON.stringify(all));
    }, play: function(id) {
      window.radioStation = id;
      var s = SamsungStations.filter(function(s2) {
        return s2.id === id;
      })[0];
      media.radio(id, s.streamUrl);
    }, toggle: function() {
      media.radioToggle(window.radioStation);
    }, stop: media.radioStop, exit: function() {
      media.exit(false);
    }, initialStation: function() {
      return "";
    } };
  } else {
    window.IptvNative = { request: function(id, action, payload) {
      media.action(action, JSON.parse(payload)).then(function(result) {
        window.iptvResult(id, true, result);
      }, function(error) {
        window.iptvResult(id, false, error.message);
      });
    }, settingsJson: function() {
      return JSON.stringify(media.settings());
    }, exit: media.exit };
    document.addEventListener("keydown", function(e) {
      if (e.keyCode === 10009) {
        e.preventDefault();
        IptvUI.back();
      }
    }, false);
  }
  window.addEventListener("load", function() {
    document.querySelector("button").focus();
  });
})();
