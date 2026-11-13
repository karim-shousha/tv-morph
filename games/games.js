"use strict";

const games = [
  { id: "winning", name: "Winning Eleven 3 Final Ver.", aliases: "ويننج اليفن وينينج إليفن كرة قدم", genre: "رياضة", year: 1998, region: "اليابان", bytes: 172203069, packed: true, description: "اختار منتخبك والعب مباريات كرة القدم في إصدار Final Version الياباني من Winning Eleven 3." },
  { id: "ctr", name: "Crash Team Racing", aliases: "كراش سي تي آر ctr سباق", genre: "سباقات", year: 1999, region: "أمريكا", bytes: 318012564, description: "سابق بشخصيات Crash على حلبات كارتينج، واستخدم الانزلاق والأدوات عشان تسبق المنافسين." },
  { id: "jackie", name: "Jackie Chan Stuntmaster", aliases: "جاكي شان قتال", genre: "أكشن", year: 2000, region: "أمريكا", bytes: 413815682, description: "العب بشخصية جاكي شان واجمع بين القتال والحركات البهلوانية خلال مغامرة في نيويورك." },
  { id: "pepsiman", name: "Pepsiman", aliases: "بيبسي مان بيبسي بيبسي مان", genre: "أكشن", year: 1999, region: "اليابان", bytes: 114920747, packed: true, description: "اجري في الشوارع، تفادى العقبات واجمع علب البيبسي قبل نهاية المرحلة." }
];

const find = id => document.getElementById(id);
const input = find("search");
const library = find("library-view");
const detail = find("detail");
const genres = ["الكل", ...new Set(games.map(game => game.genre))];
const years = new Intl.NumberFormat("ar-EG", { useGrouping: false });
const numbers = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 1 });
let genre = genres[0];
let lastCard = "";
let previousScroll = 0;
let viewingGame = false;

function size(game) {
  return numbers.format(game.bytes / 1000000) + " م.ب";
}

function normalize(text) {
  return text.toLowerCase().replace(/[أإآ]/g, "ا").replace(/ـ|[\u064b-\u065f]/g, "").trim();
}

function renderCards() {
  const words = normalize(input.value).split(/\s+/).filter(Boolean);
  const results = games.filter(game => {
    const searchable = normalize([game.name, game.aliases, game.genre, game.region, game.year, "PS1", "PlayStation"].join(" "));
    return (genre === genres[0] || game.genre === genre) && words.every(word => searchable.includes(word));
  });
  find("count").textContent = "عدد الألعاب: " + numbers.format(results.length);
  find("empty").hidden = results.length > 0;
  find("cards").innerHTML = results.map(game =>
    '<a class="card" id="card-' + game.id + '" href="#game/' + game.id + '">' +
    '<span class="cover"><img width="256" height="230" src="' + game.id + '.png" alt=""></span>' +
    '<h3 dir="ltr">' + game.name + '</h3><span class="meta"><span>' + game.genre +
    ' · <bdi>PS1</bdi></span><span>' + size(game) + '</span></span></a>'
  ).join("");
  find("filters").querySelectorAll("button").forEach(button =>
    button.setAttribute("aria-pressed", String(button.textContent === genre))
  );
}

function displayRoute() {
  const match = location.hash.match(/^#game\/([a-z0-9-]+)$/);
  const game = match && games.find(item => item.id === match[1]);
  library.hidden = Boolean(game || match);
  detail.hidden = !game && !match;
  document.title = game ? game.name + " · Morph Games" : "Morph Games · Morph TV";
  if (!game && !match) {
    if (viewingGame) {
      find("card-" + lastCard)?.focus({preventScroll: true});
      if (location.hash === "#library") find("library").scrollIntoView({behavior: "instant"});
      else window.scrollTo({top: previousScroll, behavior: "instant"});
    }
    viewingGame = false;
    return;
  }
  viewingGame = true;
  if (!game) {
    detail.innerHTML = '<a class="button" href="#library">→ مكتبة الألعاب</a><h1 id="game-title" tabindex="-1">اللعبة غير موجودة</h1>';
  } else {
    const specs = [
      ["المنصة", "<bdi>PlayStation (PS1)</bdi>"], ["النوع", game.genre],
      ["سنة الإصدار", years.format(game.year)], ["النسخة", game.region],
      [game.packed ? "حجم الحزمة" : "حجم ملف اللعبة", size(game)]
    ];
    detail.innerHTML = '<a class="button" href="#library">→ مكتبة الألعاب</a>' +
      '<article class="detail-panel"><div class="cover"><img width="310" height="310" src="' + game.id + '.png" alt="غلاف اللعبة"></div><div>' +
      '<h1 id="game-title" tabindex="-1" dir="ltr">' + game.name + '</h1><p>' + game.description + '</p>' +
      '<dl class="specs">' + specs.map(([label, value]) => '<div><dt>' + label + '</dt><dd>' + value + '</dd></div>').join("") +
      '</dl><p class="detail-status">التنزيل غير متاح حالياً.</p></div></article>';
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  find("game-title").focus({preventScroll: true});
}

for (const value of genres) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = value;
  button.addEventListener("click", () => { genre = value; renderCards(); });
  find("filters").append(button);
}
input.addEventListener("input", renderCards);
find("clear").addEventListener("click", () => { input.value = ""; genre = genres[0]; renderCards(); input.focus(); });
find("cards").addEventListener("click", event => {
  const card = event.target.closest(".card");
  if (card) {
    lastCard = card.id.slice(5);
    previousScroll = window.scrollY;
  }
});
window.addEventListener("hashchange", displayRoute);
renderCards();
displayRoute();
