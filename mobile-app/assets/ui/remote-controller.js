/* Remote control behavior. Presentation lives in remote-visual.js / remote.css.
 * The host supplies transport, progress UI, selected platform and reconnection reporting.
 */
(function (window) {
  'use strict';

  window.MorphRemoteController = {
    create: function (context) {
      const $ = selector => document.querySelector(selector);
      const call = context.call;
      const operation = context.operation;
      let remoteReady = false,
        remoteNative = false,
        remoteBusy = false;
      function remoteButtons() {
        document.querySelectorAll('[data-remote-key]').forEach(b => b.disabled = !remoteReady || remoteBusy || b.hasAttribute('data-native-only') && !remoteNative || b.hasAttribute('data-volume') && !remoteNative && context.platform() !== 'android' || b.hasAttribute('data-library-only') && context.platform() !== 'android' || b.hasAttribute('data-playback') && !remoteNative && context.platform() !== 'android');
        $('#remote-send').disabled = !remoteReady || remoteBusy;
        $('#remote-connect').disabled = !['samsung', 'android', 'lg'].includes(context.platform());
        $('#remote-mode').querySelector('[value=native]').disabled = context.platform() !== 'samsung';
      }
      window.resetMorphRemote = () => {
        if (context.platform() !== 'samsung') $('#remote-mode').value = 'internal';
        remoteReady = false;
        remoteNative = false;
        $('#remote-status').textContent = 'الريموت غير متصل. وصّله للتلفزيون المحدد.';
        remoteButtons();
      };
      $('#remote-mode').onchange = () => window.resetMorphRemote();
      async function connectRemote(quiet) {
        try {
          const connect = () => call('remoteConnect', {
            mode: $('#remote-mode').value
          });
          const r = await (quiet ? connect() : operation('توصيل الريموت', connect));
          remoteReady = !!r.ready;
          remoteNative = !!r.native;
          if (remoteReady) $('#reconnect-notice').hidden = true;
          $('#remote-status').textContent = (remoteReady ? 'متصل · ' : 'غير متصل · ') + r.scope;
          $('#remote-device').textContent = $('#device-chip span').textContent;
          remoteButtons();
          return remoteReady;
        } catch (e) {
          window.resetMorphRemote();
          context.needsReconnect(e.message);
          return false;
        }
      }
      $('#remote-connect').onclick = () => connectRemote(false);
      window.connectMorphKeyboard = () => remoteReady ? Promise.resolve(true) : connectRemote(true);
      async function remoteSend(action, payload) {
        if (!remoteReady || remoteBusy) return;
        remoteBusy = true;
        remoteButtons();
        try {
          await call(action, payload);
          $('#remote-status').textContent = 'تم إرسال الأمر · ' + (remoteNative ? 'Samsung الشبكي' : 'داخل Morph TV');
        } catch (e) {
          context.needsReconnect(e.message);
        } finally {
          remoteBusy = false;
          remoteButtons();
        }
      }
      document.querySelectorAll('[data-remote-key]').forEach(b => b.onclick = () => remoteSend('remoteKey', {
        key: b.dataset.remoteKey
      }));
      $('#remote-send').onclick = () => {
        const text = $('#remote-text').value;
        if (text) remoteSend('remoteText', {
          text
        });
      };
      remoteButtons();
      let favoriteTimer = null,
        skipRemoteClick = false;
      const okButton = document.querySelector('[data-remote-key=ENTER]');
      if (okButton) {
        okButton.onpointerdown = () => {
          if (context.platform() === 'android' && remoteReady) favoriteTimer = setTimeout(() => {
            skipRemoteClick = true;
            remoteSend('remoteKey', {
              key: 'FAVORITE'
            });
          }, 650);
        };
        okButton.onpointerup = () => clearTimeout(favoriteTimer);
        okButton.onpointercancel = () => clearTimeout(favoriteTimer);
        okButton.onclick = () => {
          if (skipRemoteClick) {
            skipRemoteClick = false;
            return;
          }
          remoteSend('remoteKey', {
            key: 'ENTER'
          });
        };
      }
      return {
        disconnect: function () {
          clearTimeout(favoriteTimer);
          skipRemoteClick = false;
          remoteReady = false;
          remoteNative = false;
          remoteButtons();
        }
      };
    }
  };
})(window);
