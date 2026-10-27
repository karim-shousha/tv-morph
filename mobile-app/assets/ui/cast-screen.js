(function(){'use strict';
 var $=function(id){return document.getElementById(id);},opening=false;
 function english(){return document.documentElement.lang!=='ar';}
 function text(ar,en){return english()?en:ar;}
 function labels(){
  $('cast-title').textContent=text('مشاركة الشاشة','Cast Screen');
  $('cast-intro').textContent=text('اعرض شاشة الموبايل على جهاز متوافق، وتحكّم فيها من الموبايل. الاختيار والاتصال بيتمّوا من خدمة مشاركة الشاشة في موبايلك.','Show your phone screen on a compatible display and control it from your phone. Your phone’s screen-sharing service handles selection and connection.');
  $('cast-open').textContent=text('فتح مشاركة الشاشة في الموبايل','Open phone Cast settings');
  $('cast-steps-title').textContent=text('توصّل إزاي؟','How to connect');
  var steps=[text('فعّل Screen Mirroring أو استقبال الكاست على التلفزيون أو الرسيفر.','Enable Screen Mirroring or casting reception on your TV or receiver.'),text('وصّل الجهازين بنفس شبكة Wi-Fi، ثم افتح مشاركة الشاشة واختار جهازك ووافق على طلب الاتصال.','Connect both devices to the same Wi-Fi, open screen sharing, select your display and approve the connection.'),text('ارجع لـMorph TV بعد الاتصال. الشاشة هتعرض واجهة الموبايل نفسها؛ لو فتحت معاينة التصميم، هتظهر المعاينة.','Return to Morph TV after connecting. The display mirrors the phone interface; opening the design preview shows that preview.')];
  $('cast-steps').textContent='';steps.forEach(function(value){var li=document.createElement('li');li.textContent=value;$('cast-steps').appendChild(li);});
  $('cast-stop').textContent=text('للإيقاف: افتح Smart View / Cast من الاختصارات السريعة في الموبايل واضغط قطع الاتصال. التوافق وشكل العرض بيعتمدوا على الجهازين؛ المحتوى المحمي ممكن ما يظهرش.','To stop: open Smart View / Cast in your phone’s Quick Settings and disconnect. Compatibility and aspect ratio depend on both devices; protected content may not appear.');
  $('cast-difference-title').textContent=text('مشاركة شاشة ولا تثبيت؟','Mirroring or installation?');
  $('cast-difference').textContent=text('مشاركة الشاشة لا تثبّت ملف APK، ولا تحوّل Morph TV للانشر على الرسيفر. إرسال فيديو بـDLNA مختلف: بيعرض ملف المحتوى فقط، مش واجهة التطبيق. استخدم قسم DLNA لإرسال رابط محتوى مباشر.','Screen sharing does not install an APK or make Morph TV the receiver’s launcher. DLNA media casting is different: it displays media, not the app interface. Use the DLNA section to send a direct media URL.');
  $('cast-receivers').textContent=text('Ecast وM-Screen: الدعم يعتمد على موديل الرسيفر وسوفت الجهاز؛ القسم ده لا يضمن دعم بروتوكولاتهم.','Ecast and M-Screen depend on receiver model and firmware; this section does not guarantee support for their protocols.');
  $('cast-back').textContent=text('رجوع للتصميم','Back to design');
 }
 $('cast-open').onclick=async function(){if(opening)return;opening=true;this.disabled=true;try{var result=await MorphNative.call('openCastSettings');$('cast-status').textContent=result.opened?text('تم فتح إعدادات المشاركة؛ اختار جهازك هناك. لم يتم تأكيد اتصال من Morph TV.','Sharing settings opened. Select your display there. Morph TV has not confirmed a connection.'):text('موبايلك لا يوفّر صفحة Cast مباشرة. اسحب الاختصارات السريعة وافتح Smart View أو Cast / مشاركة الشاشة يدويًا.','Your phone does not expose a direct Cast page. Open Quick Settings and choose Smart View or Cast / Screen sharing manually.');}catch(e){$('cast-status').textContent=text('فتح إعدادات المشاركة متاح من تطبيق أندرويد. لو الخيار مش ظاهر استخدم Smart View / Cast من الاختصارات السريعة.','Opening sharing settings is available in the Android app. Otherwise use Smart View / Cast in Quick Settings.');}finally{opening=false;this.disabled=false;}};
 labels();new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
