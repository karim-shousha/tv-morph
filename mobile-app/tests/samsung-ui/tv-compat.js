(function() {
  "use strict";
  function define(target, name, value) {
    if (!target[name]) Object.defineProperty(target, name, { value, configurable: true, writable: true });
  }
  define(Object, "values", function(o) {
    return Object.keys(o).map(function(k) {
      return o[k];
    });
  });
  define(Object, "entries", function(o) {
    return Object.keys(o).map(function(k) {
      return [k, o[k]];
    });
  });
  define(Object, "assign", function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      if (source != null) Object.keys(source).forEach(function(k) {
        target[k] = source[k];
      });
    }
    return target;
  });
  define(Array.prototype, "includes", function(value, from) {
    var n = this.length, start = Number(from) || 0;
    if (start < 0) start = Math.max(0, n + start);
    for (var i = start; i < n; i++) if (this[i] === value || this[i] !== this[i] && value !== value) return true;
    return false;
  });
  define(Array.prototype, "find", function(fn, context) {
    for (var i = 0; i < this.length; i++) if (fn.call(context, this[i], i, this)) return this[i];
  });
  define(String.prototype, "includes", function(value, start) {
    return this.indexOf(value, start || 0) !== -1;
  });
  define(String.prototype, "startsWith", function(value, start) {
    return this.substr(start || 0, String(value).length) === String(value);
  });
  define(String.prototype, "endsWith", function(value) {
    value = String(value);
    return this.slice(-value.length) === value;
  });
  define(String.prototype, "padStart", function(length, value) {
    var s = String(this), pad = value === void 0 ? " " : String(value);
    if (!pad) return s;
    while (s.length < length) s = pad + s;
    return s.slice(-Math.max(length, String(this).length));
  });
  if (window.NodeList) define(NodeList.prototype, "forEach", Array.prototype.forEach);
  if (window.Element) {
    define(Element.prototype, "matches", Element.prototype.webkitMatchesSelector || Element.prototype.msMatchesSelector);
    define(Element.prototype, "closest", function(selector) {
      var el = this;
      while (el && el.nodeType === 1) {
        if (el.matches(selector)) return el;
        el = el.parentElement;
      }
      return null;
    });
    define(Element.prototype, "remove", function() {
      if (this.parentNode) this.parentNode.removeChild(this);
    });
    define(Element.prototype, "prepend", function() {
      var fragment = document.createDocumentFragment();
      for (var i = 0; i < arguments.length; i++) fragment.appendChild(arguments[i] instanceof Node ? arguments[i] : document.createTextNode(String(arguments[i])));
      this.insertBefore(fragment, this.firstChild);
    });
    define(Element.prototype, "append", function() {
      for (var i = 0; i < arguments.length; i++) this.appendChild(arguments[i] instanceof Node ? arguments[i] : document.createTextNode(String(arguments[i])));
    });
  }
})();
