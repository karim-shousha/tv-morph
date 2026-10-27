(function(C) {
  "use strict";
  var timeout = null, controlsTimer = null, watchTimer = null, watchToken = 0, starting = false;
  function wake() {
    clearTimeout(controlsTimer);
    document.body.classList.remove("controls-asleep");
    controlsTimer = setTimeout(function() {
      if (C.Inputs.state.watching) {
        document.body.classList.add("controls-asleep");
      }
    }, 7e3);
  }
  function notify() {
    if (C.inputsChanged) {
      C.inputsChanged(C.Inputs.state);
    }
  }
  function label(s) {
    return s.type === "TV" ? "Live TV" : s.number > 0 ? s.type + " " + s.number : s.title || s.type;
  }
  function same(a, b) {
    return a && b && (a.id && b.id ? a.id === b.id : a.type === b.type && a.number === b.number);
  }
  function current() {
    var state = C.Inputs.state;
    try {
      state.current = tizen.tvwindow.getSource();
    } catch (e) {
      state.current = null;
    }
    state.channel = null;
    state.program = null;
    if (state.current && state.current.type === "TV" && typeof tizen.tvchannel !== "undefined") {
      try {
        state.channel = tizen.tvchannel.getCurrentChannel();
        state.program = tizen.tvchannel.getCurrentProgram();
      } catch (e) {
        state.guideError = "Programme information is unavailable on this TV.";
      }
    }
  }
  C.Inputs = {
    state: { sources: [], current: null, channel: null, program: null, loading: false, error: "", watching: false, guideError: "" },
    label,
    same,
    load: function() {
      var state = this.state;
      if (typeof tizen === "undefined") {
        state.error = "Connect to a Samsung TV to read its HDMI inputs.";
        notify();
        return;
      }
      state.loading = true;
      state.error = "";
      current();
      notify();
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        state.loading = false;
        state.error = "Inputs did not respond. Try Refresh inputs.";
        notify();
      }, 8e3);
      try {
        tizen.systeminfo.getPropertyValue("VIDEOSOURCE", function(info) {
          clearTimeout(timeout);
          state.loading = false;
          var sources = [];
          ["connected", "disconnected"].forEach(function(group) {
            (info[group] || []).forEach(function(s) {
              if (s.type === "HDMI" || s.type === "TV" || s.type === "AV" || s.type === "COMP") {
                if (!sources.some(function(v) {
                  return same(v, s);
                })) {
                  sources.push({ type: s.type, number: s.number, connected: group === "connected", native: s });
                }
              }
            });
          });
          state.sources = sources.sort(function(a, b) {
            return a.type === b.type ? a.number - b.number : a.type === "TV" ? -1 : b.type === "TV" ? 1 : a.type.localeCompare(b.type);
          });
          current();
          notify();
        }, function(error) {
          clearTimeout(timeout);
          state.loading = false;
          state.error = "Inputs are unavailable (" + error.name + ").";
          notify();
        });
      } catch (e) {
        clearTimeout(timeout);
        state.loading = false;
        state.error = "This TV does not provide input controls.";
        notify();
      }
    },
    watch: function(source) {
      var state = this.state;
      if (typeof tizen === "undefined") {
        C.toast("Input playback is available on the television.");
        return;
      }
      if (state.watching || starting) {
        return;
      }
      if (C.Prayer && !C.Prayer.allowLaunch()) return;
      starting = true;
      var token = ++watchToken;
      watchTimer = setTimeout(function() {
        if (token === watchToken) {
          watchToken++;
          fail();
        }
      }, 12e3);
      function fail() {
        clearTimeout(watchTimer);
        starting = false;
        state.watching = false;
        document.body.classList.remove("watching");
        document.documentElement.style.background = "";
        C.toast("Could not open " + label(source) + ". Check the device and cable.");
        notify();
      }
      try {
        tizen.tvwindow.setSource(source.native || source, function() {
          if (token !== watchToken) {
            return;
          }
          state.current = source;
          tizen.tvwindow.show(function() {
            if (token !== watchToken) {
              return;
            }
            clearTimeout(watchTimer);
            starting = false;
            state.watching = true;
            if (C.rememberHdmi) C.rememberHdmi(source);
            wake();
            document.body.classList.add("watching");
            document.documentElement.style.background = "transparent";
            current();
            if (C.watchStarted) {
              C.watchStarted();
            }
            notify();
          }, fail, ["0px", "0px", "1920px", "1080px"], "MAIN", "FRONT");
        }, fail);
      } catch (e) {
        fail();
      }
    },
    stop: function() {
      if (!this.state.watching) {
        return;
      }
      try {
        tizen.tvwindow.hide(function() {
        }, function() {
        });
      } catch (e) {
      }
      this.state.watching = false;
      clearTimeout(controlsTimer);
      document.body.classList.remove("controls-asleep");
      document.body.classList.remove("watching");
      document.documentElement.style.background = "";
      if (C.watchStopped) {
        C.watchStopped();
      }
      this.load();
    },
    refreshProgramme: function() {
      if (typeof tizen !== "undefined") {
        current();
        notify();
      }
    }
  };
  document.addEventListener("keydown", function(e) {
    if (!C.Inputs.state.watching) return;
    if (e.keyCode === 10009 || e.keyCode === 27) {
      e.stopImmediatePropagation();
      e.preventDefault();
      C.Inputs.stop();
      return;
    }
    wake();
    if (e.keyCode === 13 || e.keyCode >= 37 && e.keyCode <= 40) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
  document.addEventListener("visibilitychange", function() {
    if (!document.hidden) {
      C.Inputs.load();
    }
  });
})(window.ClearTV);
