(function () {
  "use strict";
  // Frond: helper injected into script-enabled HTML views (htmlview.rs). It runs inside the
  // document, so the app treats every message as untrusted. Keep this file ASCII only: it is
  // inserted into pages whose text encoding is unknown.
  if (window.parent === window || window.parent !== window.top) return;
  var post = function (message) {
    message.frond = 1;
    window.parent.postMessage(message, "*");
  };
  var KEYS = /^(s|o|p|w|t|f|h|d|e|tab|pagedown|pageup|[0-9]|=|\+|-|\/|\?|\\|,)$/;
  window.addEventListener(
    "keydown",
    function (event) {
      if (event.isComposing || event.keyCode === 229) return;
      var key = String(event.key || "").toLowerCase();
      var ctrl = event.ctrlKey || event.metaKey;
      if (!((ctrl && KEYS.test(key)) || key === "f5")) return;
      event.preventDefault();
      post({
        type: "key",
        key: event.key,
        code: event.code,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
      });
    },
    true,
  );
  // Bubble phase: page handlers run first; a click they cancel stays with the page.
  window.addEventListener("click", function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    var target = event.target;
    var anchor = target && target.closest ? target.closest("a[href]") : null;
    if (!anchor) return;
    var url;
    try {
      url = new URL(anchor.href, document.baseURI);
    } catch (error) {
      return;
    }
    if (url.protocol === "javascript:") return;
    var here = new URL(location.href);
    if (url.origin === here.origin && url.pathname === here.pathname && url.search === here.search && url.hash) return;
    event.preventDefault();
    // raw: the attribute as written, so the app resolves relative links (../a.md) against the
    // document folder exactly like the safe view does
    post({ type: "link", href: url.href, raw: anchor.getAttribute("href") });
  });
  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    var message = event.data;
    if (!message || message.frond !== 1) return;
    if (message.type === "print") window.print();
  });
  post({ type: "ready" });
})();
