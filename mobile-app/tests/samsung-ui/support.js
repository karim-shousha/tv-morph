(function() {
  "use strict";
  window.addEventListener("load", function() {
    var credit = document.querySelector("#view-home footer .credit") || document.querySelector("footer .credit");
    if (!credit) return;
    var wrap = document.createElement("span");
    wrap.className = "support-credit";
    credit.parentNode.insertBefore(wrap, credit);
    wrap.appendChild(credit);
    var button = document.createElement("button");
    button.className = "support-button";
    button.textContent = "\u2665 Support Morph TV \xB7 \u0627\u062F\u0639\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0642";
    wrap.insertBefore(button, credit);
    button.onclick = function() {
      var C = window.ClearTV, previous = document.activeElement, overlay = document.createElement("div");
      overlay.className = "overlay";
      overlay.innerHTML = '<section class="modal support-modal" role="dialog" aria-modal="true" aria-label="Support Morph TV"><h2>Support Morph TV \xB7 \u0627\u062F\u0639\u0645 \u0627\u0644\u062A\u0637\u0628\u064A\u0642</h2><p>\u062F\u0639\u0645 \u0627\u062E\u062A\u064A\u0627\u0631\u064A \u0644\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u062A\u0637\u0628\u064A\u0642 \u2014 \u0627\u062E\u062A\u0631 \u0627\u0644\u0645\u0628\u0644\u063A \u0628\u0646\u0641\u0633\u0643\u060C \u0628\u062F\u0648\u0646 \u0627\u0634\u062A\u0631\u0627\u0643.<br>Optional one-time support. Choose your amount in CAD.</p><div class="support-codes"><div><strong>Stripe</strong><img src="assets/support-stripe.webp" width="300" height="300" alt="Scan with your phone to support Morph TV through Stripe"></div><div><strong>PayPal</strong><img src="assets/support-paypal.webp" width="300" height="300" alt="Scan to support Morph TV through PayPal"></div></div><p>\u0627\u0645\u0633\u062D \u0627\u0644\u0643\u0648\u062F \u0628\u0643\u0627\u0645\u064A\u0631\u0627 \u0627\u0644\u0645\u0648\u0628\u0627\u064A\u0644 \u0644\u0641\u062A\u062D \u0635\u0641\u062D\u0629 \u0627\u0644\u062F\u0639\u0645.<br>Scan with your phone to open a support page.</p><button class="primary">Close \xB7 \u0625\u063A\u0644\u0627\u0642</button></section>';
      document.body.appendChild(overlay);
      var close = overlay.querySelector("button");
      C.Focus.setScope(overlay);
      C.Focus.focus(close);
      function done() {
        overlay.remove();
        C.Focus.setScope(document);
        C.Focus.focus(previous);
        document.removeEventListener("keydown", back, true);
      }
      function back(e) {
        if (e.key === "Escape" || e.keyCode === 27 || e.keyCode === 10009 || e.keyCode === 461) {
          e.preventDefault();
          e.stopImmediatePropagation();
          done();
        }
      }
      close.onclick = done;
      document.addEventListener("keydown", back, true);
    };
  });
})();
