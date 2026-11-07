(function () {
 'use strict';
 var timer = null, ambient = false;
 var days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
 var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
 function pad(n) { return (n < 10 ? '0' : '') + n; }
 function update() {
  var now;
  try { now = tizen.time.getCurrentDateTime(); } catch (e) { now = new Date(); }
  document.getElementById('time').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  document.getElementById('date').textContent = days[now.getDay()] + ' / ' + pad(now.getDate()) + ' ' + months[now.getMonth()];
  if (ambient) {
   var shift = (now.getMinutes() % 5) - 2;
   document.querySelector('.clock').style.transform = 'translate(' + shift + 'px,' + (-shift) + 'px)';
  } else { document.querySelector('.clock').style.transform = ''; }
 }
 function battery(info) {
  if (typeof info.level !== 'number') { return; }
  var percent = Math.max(0, Math.min(100, Math.round(info.level * 100)));
  document.getElementById('battery').textContent = percent + '%';
  document.getElementById('charge').style.width = percent + '%';
 }
 function schedule() {
  clearTimeout(timer);
  if (document.hidden && !ambient) { return; }
  update();
  timer = setTimeout(schedule, 60000 - (Date.now() % 60000) + 50);
 }
 document.addEventListener('visibilitychange', function () { document.body.classList.toggle('paused',document.hidden);schedule(); });
 window.addEventListener('ambientmodechanged', function (event) {
  ambient = !!event.detail.ambientMode;
  document.body.classList.toggle('ambient',ambient);
  schedule();
 });
 window.addEventListener('timetick', update);
 try {
  tizen.systeminfo.getPropertyValue('BATTERY', battery, function () {});
  tizen.systeminfo.addPropertyValueChangeListener('BATTERY', battery);
  tizen.time.setTimezoneChangeListener(schedule);
 } catch (e) { /* Browser preview leaves unavailable readings blank. */ }
 schedule();
}());
