(function(w) {
  "use strict";
  var manifest = w.TVThemePackManifest, packs = manifest.packs, urls = {}, installed = {}, jobs = {}, db;
  var blank = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E';
  var titles = { en: ["Egypt pack", "European clubs", "Hockey pack", "Court & field", "National teams"], ar: ["\u062D\u0632\u0645\u0629 \u0645\u0635\u0631", "\u0627\u0644\u0623\u0646\u062F\u064A\u0629 \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064A\u0629", "\u062D\u0632\u0645\u0629 \u0627\u0644\u0647\u0648\u0643\u064A", "\u0627\u0644\u0645\u0644\u0627\u0639\u0628", "\u0627\u0644\u0645\u0646\u062A\u062E\u0628\u0627\u062A"], fr: ["Pack \xC9gypte", "Clubs europ\xE9ens", "Pack hockey", "Sports", "\xC9quipes nationales"], zh: ["\u57C3\u53CA\u4E3B\u9898\u5305", "\u6B27\u6D32\u4FF1\u4E50\u90E8", "\u51B0\u7403\u4E3B\u9898\u5305", "\u7403\u573A\u8FD0\u52A8", "\u56FD\u5BB6\u961F"], ja: ["\u30A8\u30B8\u30D7\u30C8\u30D1\u30C3\u30AF", "\u6B27\u5DDE\u30AF\u30E9\u30D6", "\u30DB\u30C3\u30B1\u30FC\u30D1\u30C3\u30AF", "\u7403\u6280\u30D1\u30C3\u30AF", "\u4EE3\u8868\u30C1\u30FC\u30E0"] };
  function emit() {
    w.dispatchEvent(new Event("morphPacks"));
  }
  function pack(id) {
    return packs.filter(function(p) {
      return p.id === id;
    })[0];
  }
  function forTheme(theme) {
    return packs.filter(function(p) {
      return p.themes.indexOf(theme) >= 0;
    })[0];
  }
  function stamp(p) {
    return p.version + ":" + p.files.map(function(f) {
      return f.sha256;
    }).join(":");
  }
  function hash(buffer) {
    var input = new Uint8Array(buffer), n = input.length, padded = new Uint8Array(n + 9 + 63 >> 6 << 6);
    padded.set(input);
    padded[n] = 128;
    var view = new DataView(padded.buffer);
    view.setUint32(padded.length - 8, Math.floor(n / 536870912));
    view.setUint32(padded.length - 4, n * 8 >>> 0);
    var h = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225], k = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298], a = new Int32Array(64);
    function r(x2, s) {
      return x2 >>> s | x2 << 32 - s;
    }
    for (var offset = 0; offset < padded.length; offset += 64) {
      var i;
      for (i = 0; i < 16; i++) a[i] = view.getInt32(offset + i * 4);
      for (i = 16; i < 64; i++) {
        var x = a[i - 15], y = a[i - 2];
        a[i] = (r(x, 7) ^ r(x, 18) ^ x >>> 3) + (r(y, 17) ^ r(y, 19) ^ y >>> 10) + a[i - 7] + a[i - 16] | 0;
      }
      var v = h.slice();
      for (i = 0; i < 64; i++) {
        var t1 = v[7] + (r(v[4], 6) ^ r(v[4], 11) ^ r(v[4], 25)) + (v[4] & v[5] ^ ~v[4] & v[6]) + k[i] + a[i] | 0, t2 = (r(v[0], 2) ^ r(v[0], 13) ^ r(v[0], 22)) + (v[0] & v[1] ^ v[0] & v[2] ^ v[1] & v[2]) | 0;
        v = [t1 + t2 | 0, v[0], v[1], v[2], v[3] + t1 | 0, v[4], v[5], v[6]];
      }
      for (i = 0; i < 8; i++) h[i] = h[i] + v[i] | 0;
    }
    return h.map(function(x2) {
      return ("00000000" + (x2 >>> 0).toString(16)).slice(-8);
    }).join("");
  }
  function hashCooperative(buffer) {
    return new Promise(function(resolve) {
      var input = new Uint8Array(buffer), n = input.length, padded = new Uint8Array(n + 9 + 63 >> 6 << 6);
      padded.set(input);
      padded[n] = 128;
      var view = new DataView(padded.buffer);
      view.setUint32(padded.length - 8, Math.floor(n / 536870912));
      view.setUint32(padded.length - 4, n * 8 >>> 0);
      var h = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225], k = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298], a = new Int32Array(64);
      function r(x, s) {
        return x >>> s | x << 32 - s;
      }
      var offset = 0;
      function chunk() {
        var until = Math.min(padded.length, offset + 16384);
        for (; offset < until; offset += 64) {
          var i;
          for (i = 0; i < 16; i++) a[i] = view.getInt32(offset + i * 4);
          for (i = 16; i < 64; i++) {
            var x = a[i - 15], y = a[i - 2];
            a[i] = (r(x, 7) ^ r(x, 18) ^ x >>> 3) + (r(y, 17) ^ r(y, 19) ^ y >>> 10) + a[i - 7] + a[i - 16] | 0;
          }
          var v = h.slice();
          for (i = 0; i < 64; i++) {
            var t1 = v[7] + (r(v[4], 6) ^ r(v[4], 11) ^ r(v[4], 25)) + (v[4] & v[5] ^ ~v[4] & v[6]) + k[i] + a[i] | 0, t2 = (r(v[0], 2) ^ r(v[0], 13) ^ r(v[0], 22)) + (v[0] & v[1] ^ v[0] & v[2] ^ v[1] & v[2]) | 0;
            v = [t1 + t2 | 0, v[0], v[1], v[2], v[3] + t1 | 0, v[4], v[5], v[6]];
          }
          for (i = 0; i < 8; i++) h[i] = h[i] + v[i] | 0;
        }
        if (offset < padded.length) {
          setTimeout(chunk, 0);
          return;
        }
        resolve(h.map(function(x2) {
          return ("00000000" + (x2 >>> 0).toString(16)).slice(-8);
        }).join(""));
      }
      chunk();
    });
  }
  function hashAsync(buffer) {
    if (w.crypto && w.crypto.subtle) return w.crypto.subtle.digest("SHA-256", buffer).then(function(result) {
      return Array.prototype.map.call(new Uint8Array(result), function(n) {
        return ("0" + n.toString(16)).slice(-2);
      }).join("");
    }, function() {
      return hashCooperative(buffer);
    });
    return hashCooperative(buffer);
  }
  function activate(record, verified) {
    var p = pack(record.id);
    if (!p || record.stamp !== stamp(p)) return;
    p.files.forEach(function(f) {
      var bytes = record.files[f.name];
      if (!bytes || bytes.byteLength !== f.bytes || !verified && hash(bytes) !== f.sha256) throw Error("Cached pack integrity check failed");
    });
    p.files.forEach(function(f) {
      if (urls[f.name]) URL.revokeObjectURL(urls[f.name]);
      urls[f.name] = URL.createObjectURL(new Blob([record.files[f.name]], { type: "image/webp" }));
    });
    installed[p.id] = true;
  }
  function activateAsync(record) {
    var p = pack(record.id);
    if (!p || record.stamp !== stamp(p)) return Promise.resolve();
    return p.files.reduce(function(chain, f) {
      return chain.then(function() {
        var bytes = record.files[f.name];
        if (!bytes || bytes.byteLength !== f.bytes) throw Error("Cached pack size mismatch");
        return hashAsync(bytes).then(function(value) {
          if (value !== f.sha256) throw Error("Cached pack integrity check failed");
        });
      });
    }, Promise.resolve()).then(function() {
      activate(record, true);
    });
  }
  var displayResolve, displayReady = new Promise(function(resolve) {
    displayResolve = resolve;
  });
  var ready = new Promise(function(resolve) {
    try {
      var request = indexedDB.open("tvmorph-theme-packs", 1);
      request.onupgradeneeded = function() {
        request.result.createObjectStore("packs", { keyPath: "id" });
      };
      request.onerror = request.onblocked = function() {
        displayResolve();
        resolve();
      };
      request.onsuccess = function() {
        db = request.result;
        db.onversionchange = function() {
          db.close();
          db = null;
        };
        var tx = db.transaction("packs"), records = [], cursor = tx.objectStore("packs").openCursor();
        cursor.onsuccess = function() {
          var c = cursor.result;
          if (c) {
            records.push(c.value);
            c.continue();
          }
        };
        tx.onerror = function() {
          displayResolve();
          resolve();
        };
        tx.oncomplete = function() {
          var theme = w.ClearTV && w.ClearTV.settings.theme, selected = forTheme(theme), active = selected && records.filter(function(r) {
            return r.id === selected.id;
          })[0];
          function background() {
            return records.filter(function(r) {
              return r !== active;
            }).reduce(function(chain, record) {
              return chain.then(function() {
                return activateAsync(record).catch(function() {
                });
              }).then(function() {
                emit();
              });
            }, Promise.resolve());
          }
          Promise.resolve(active ? activateAsync(active) : null).catch(function() {
          }).then(function() {
            displayResolve();
            emit();
            setTimeout(function() {
              background().then(resolve, resolve);
            }, 100);
          });
        };
      };
    } catch (e) {
      displayResolve();
      resolve();
    }
  });
  function fetchFile(f, onProgress) {
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", manifest.baseURL + f.file, true);
      xhr.responseType = "arraybuffer";
      xhr.timeout = 45e3;
      xhr.onload = function() {
        var b = xhr.response;
        if (xhr.status !== 200 || !b || b.byteLength !== f.bytes || hash(b) !== f.sha256) {
          reject(Error("Pack download failed verification"));
          return;
        }
        resolve(b);
      };
      xhr.onprogress = function(e) {
        if (onProgress) onProgress(Math.min(e.loaded, f.bytes));
        if (e.loaded > f.bytes) {
          xhr.abort();
          reject(Error("Pack response too large"));
        }
      };
      xhr.onerror = xhr.ontimeout = xhr.onabort = function() {
        reject(Error("Pack download unavailable. Check internet and retry."));
      };
      xhr.send();
    });
  }
  function status(id) {
    return { id, installed: !!installed[id], state: installed[id] ? "installed" : jobs[id] ? jobs[id].state : "missing", percent: jobs[id] ? jobs[id].percent : 0, error: jobs[id] ? jobs[id].error : "" };
  }
  function download(id) {
    var p = pack(id);
    if (!p) return Promise.reject(Error("Unknown theme pack"));
    if (jobs[id] && jobs[id].state === "downloading") return jobs[id].promise;
    var job = jobs[id] = { state: "downloading", percent: 0, error: "" };
    job.promise = ready.then(function() {
      if (installed[id]) return;
      if (!db) throw Error("Theme storage unavailable");
      var files = {}, done = 0;
      return p.files.reduce(function(chain, f) {
        return chain.then(function() {
          return fetchFile(f, function(loaded) {
            var next = Math.min(99, Math.floor((done + loaded) / p.bytes * 100));
            if (next !== job.percent) {
              job.percent = next;
              emit();
            }
          }).then(function(bytes) {
            files[f.name] = bytes;
            done += f.bytes;
            job.percent = Math.min(99, Math.floor(done / p.bytes * 100));
            emit();
          });
        });
      }, Promise.resolve()).then(function() {
        return new Promise(function(resolve, reject) {
          var record = { id, stamp: stamp(p), files }, tx = db.transaction("packs", "readwrite");
          tx.objectStore("packs").put(record);
          tx.oncomplete = function() {
            try {
              activate(record);
              resolve();
            } catch (e) {
              reject(e);
            }
          };
          tx.onerror = tx.onabort = function() {
            reject(Error("Not enough theme storage. Remove a pack and retry."));
          };
        });
      });
    }).then(function() {
      job.state = "installed";
      job.percent = 100;
      emit();
      return status(id);
    }).catch(function(e) {
      job.state = "error";
      job.error = e.message;
      emit();
      throw e;
    });
    emit();
    return job.promise;
  }
  function remove(id) {
    if (jobs[id] && jobs[id].state === "downloading") return Promise.reject(Error("Wait for the download to finish"));
    return ready.then(function() {
      if (!db) throw Error("Theme storage unavailable");
      return new Promise(function(resolve, reject) {
        var tx = db.transaction("packs", "readwrite");
        tx.objectStore("packs").delete(id);
        tx.oncomplete = function() {
          var p = pack(id);
          if (p) p.files.forEach(function(f) {
            if (urls[f.name]) URL.revokeObjectURL(urls[f.name]);
            delete urls[f.name];
          });
          delete installed[id];
          delete jobs[id];
          emit();
          resolve();
        };
        tx.onerror = function() {
          reject(Error("Could not remove pack"));
        };
      });
    });
  }
  function src(value) {
    if (!value || /^(data:|blob:|https?:)/.test(value)) return value;
    var name = value.split("/").pop(), matched = packs.some(function(p) {
      return p.files.some(function(f) {
        return f.name === name;
      });
    });
    return matched ? urls[name] || blank : value;
  }
  w.ThemePacks = { ready, displayReady, list: packs, forTheme, download, remove, src, blank, hash, status, title: function(id) {
    var l = w.MorphLocale ? w.MorphLocale.get() : "en";
    return (titles[l] || titles.en)[packs.indexOf(pack(id))] || id;
  }, command: function(payload) {
    var p = pack(payload.id);
    if (!p) return { state: "error", error: "Unknown theme pack" };
    if (payload.action === "download" && !installed[p.id]) download(p.id).catch(function() {
    });
    return status(p.id);
  } };
})(window);
