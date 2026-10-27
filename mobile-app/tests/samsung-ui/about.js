window.addEventListener("load", function() {
  var b = document.getElementById("setting-about");
  if (!b) return;
  b.onclick = function() {
    var C = ClearTV, overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = '<section class="modal" role="dialog" aria-modal="true"><div class="eyebrow">MORPH TV</div><h2>About us</h2><p style="font-size:30px;line-height:1.8">Developed by<br><strong>Karim Aboushousha</strong><br>&amp; <strong>Hassan Shehata</strong></p><p>Make your TV your own.</p><button class="primary">' + (document.documentElement.lang === "ar" ? "\u0625\u063A\u0644\u0627\u0642" : "Close") + "</button></section>";
    var version = document.createElement("p");
    version.textContent = "Morph TV \xB7 " + (document.body.getAttribute("data-build-version") || "Preview");
    overlay.querySelector("section").insertBefore(version, overlay.querySelector("button"));
    var credit = document.createElement("p");
    credit.textContent = "Argentina 2022 line-up: Hossein Zohrevand / Tasnim News Agency, CC BY 4.0. Source: https://commons.wikimedia.org/wiki/File:ARG_Line-up_-_ARG_vs_MEX_for_2022_FIFA_WC.jpg License: https://creativecommons.org/licenses/by/4.0/ Converted to WebP; displayed with CSS fade.";
    credit.style.cssText = "font-size:14px;overflow-wrap:anywhere";
    overlay.querySelector("section").insertBefore(credit, overlay.querySelector("button"));
    document.body.appendChild(overlay);
    var previous = document.activeElement;
    C.Focus.setScope(overlay);
    var close = overlay.querySelector("button");
    function done() {
      overlay.remove();
      C.Focus.setScope(document);
      C.Focus.focus(previous);
      document.removeEventListener("keydown", back, true);
    }
    function back(e) {
      if (e.keyCode === 27 || e.keyCode === 10009) {
        e.preventDefault();
        e.stopImmediatePropagation();
        done();
      }
    }
    close.onclick = done;
    document.addEventListener("keydown", back, true);
    C.Focus.focus(close);
  };
});
