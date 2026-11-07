import 'package:flutter/widgets.dart';

/// Minimal EN/AR localization without codegen so the app stays
/// lightweight and works offline. Supports RTL via [textDirection].
class MorphStrings {
  final Locale locale;
  const MorphStrings(this.locale);

  bool get isArabic => locale.languageCode == 'ar';
  TextDirection get textDirection =>
      isArabic ? TextDirection.rtl : TextDirection.ltr;

  static const _en = <String, String>{
    'appName': 'Morph Remote',
    'tagline': 'Universal Smart TV Remote',
    'headline': 'Your TV. One Remote.',
    'welcomeBody':
        'Discover your Samsung, LG or Android TV on Wi-Fi and control it with a beautiful premium remote. No account needed.',
    'findMyTv': 'Find My TV',
    'connectManually': 'Connect Manually',
    'discoveryTitle': 'Find Your TV',
    'discoverySubtitle': 'Scanning your network for available TVs…',
    'scanAgain': 'Scan Again',
    'stop': 'Stop',
    'manualTitle': 'Connect Manually',
    'ipHint': 'TV IP address (e.g. 192.168.1.15)',
    'connect': 'Connect',
    'cancel': 'Cancel',
    'retry': 'Retry',
    'pair': 'Pair',
    'connected': 'Connected',
    'connecting': 'Connecting…',
    'disconnected': 'Disconnected',
    'pairingTitle': 'Pair with your TV',
    'pairingSamsungBody':
        'A permission popup should appear on your Samsung TV. Select “Allow” with your TV remote to finish pairing.',
    'pairingLgBody':
        'A pairing prompt should appear on your LG TV. Press “Allow” / “OK” on the TV to approve Morph Remote.',
    'pairingAtvBody':
        'Your Android / Google TV should show a 6-digit PIN. Enter it below to pair securely.',
    'pinHint': 'Enter 6-digit PIN',
    'wrongPin': 'Wrong code. Check the TV and try again.',
    'timeout':
        'Pairing timed out. Make sure the TV is on and on the same Wi-Fi, then retry.',
    'permissionDenied':
        'Pairing was declined on the TV. Please try again and Allow.',
    'fireTvReady': 'Ready to connect to Fire TV',
    'fireTvSetup':
        'Enable ADB Debugging in Settings → My Fire TV → Developer Options. If Morph TV is covering the approval prompt, switch to Fire TV Home first. Then connect here, choose “Always allow” on the TV, and return to your launcher.',
    'fireTvWait':
        'Keep this screen open. On the Fire TV prompt, choose Allow and “Always allow” if shown.',
    'fireTvConnect': 'Connect to Fire TV',
    'remoteTitle': 'Remote',
    'devicesTitle': 'My TVs',
    'settingsTitle': 'Settings',
    'troubleTitle': 'Connection Troubleshooting',
    'forget': 'Forget',
    'remove': 'Remove',
    'nickname': 'Nickname',
    'lastConnected': 'Last connected',
    'noDevices':
        'No TVs found yet. Make sure your TV and phone share the same Wi-Fi.',
    'power': 'Power',
    'haptics': 'Button vibration',
    'theme': 'Appearance',
    'language': 'Language',
    'contactSupport': 'Contact & support',
    'contactUs': 'Contact us',
    'supportEmail': 'Email support',
    'supportPrompt':
        'Enjoying the app? If it helps, please consider supporting its development.',
    'supportOptional': 'Optional support • one-time donation',
    'developedBy': 'Developed by Karim Aboushousha',
    'supportWith': 'Choose a way to support',
    'supportInstaPay': 'InstaPay',
    'supportStripe': 'Stripe',
    'supportPayPal': 'PayPal',
    'linkOpenFailed': 'Could not open this link.',
    'dark': 'Dark',
    'light': 'Light',
    'wakeOnLan': 'Wake-on-LAN (power on)',
    'ok': 'OK',
  };

  static const _ar = <String, String>{
    'appName': 'مورف ريموت',
    'tagline': 'ريموت عالمي للتلفزيون الذكي',
    'headline': 'تلفازك. ريموت واحد.',
    'welcomeBody':
        'اكتشف تلفاز سامسونج أو إل جي أو أندرويد على شبكة الواي فاي وتحكم به بريموت أنيق. بدون حساب.',
    'findMyTv': 'اعثر على تلفازي',
    'connectManually': 'اتصال يدوي',
    'discoveryTitle': 'اعثر على تلفازك',
    'discoverySubtitle': 'جارٍ فحص الشبكة بحثًا عن أجهزة التلفاز…',
    'scanAgain': 'إعادة الفحص',
    'stop': 'إيقاف',
    'manualTitle': 'اتصال يدوي',
    'ipHint': 'عنوان IP للتلفاز (مثال: 192.168.1.15)',
    'connect': 'اتصال',
    'cancel': 'إلغاء',
    'retry': 'إعادة المحاولة',
    'pair': 'إقران',
    'connected': 'متصل',
    'connecting': 'جارٍ الاتصال…',
    'disconnected': 'غير متصل',
    'pairingTitle': 'إقران مع التلفاز',
    'pairingSamsungBody':
        'ستظهر نافذة إذن على تلفاز سامسونج. اختر "سماح" بريموت التلفاز لإتمام الإقران.',
    'pairingLgBody':
        'ستظهر رسالة إقران على تلفاز إل جي. اضغط "سماح" / "موافق" على التلفاز للموافقة.',
    'pairingAtvBody':
        'سيعرض تلفاز أندرويد / جوجل رمز PIN من 6 أرقام. أدخله أدناه للإقران الآمن.',
    'pinHint': 'أدخل رمز PIN المكوّن من 6 أرقام',
    'wrongPin': 'رمز خاطئ. تحقق من التلفاز وحاول مجددًا.',
    'timeout':
        'انتهت مهلة الإقران. تأكد أن التلفاز يعمل وعلى نفس الشبكة ثم أعد المحاولة.',
    'permissionDenied': 'تم رفض الإقران على التلفاز. حاول مجددًا واضغط سماح.',
    'fireTvReady': 'جاهز للاتصال بتلفزيون Fire TV',
    'fireTvSetup':
        'فعّل ADB Debugging من Settings → My Fire TV → Developer Options. لو Morph TV مغطي رسالة الموافقة، ارجع مؤقتًا لشاشة Fire TV الرئيسية. اضغط اتصال هنا، ثم اختر «السماح دائمًا» على التلفزيون، وبعدها ارجع للانشر.',
    'fireTvWait':
        'اترك الشاشة مفتوحة. على رسالة Fire TV اختر «سماح» و«السماح دائمًا» لو ظهرت.',
    'fireTvConnect': 'اتصال بـ Fire TV',
    'remoteTitle': 'الريموت',
    'devicesTitle': 'أجهزتي',
    'settingsTitle': 'الإعدادات',
    'troubleTitle': 'حل مشاكل الاتصال',
    'forget': 'نسيان',
    'remove': 'إزالة',
    'nickname': 'الاسم المستعار',
    'lastConnected': 'آخر اتصال',
    'noDevices':
        'لم يتم العثور على تلفاز بعد. تأكد أن الهاتف والتلفاز على نفس الواي فاي.',
    'power': 'الطاقة',
    'haptics': 'اهتزاز الأزرار',
    'theme': 'المظهر',
    'language': 'اللغة',
    'contactSupport': 'تواصل ودعم',
    'contactUs': 'تواصل معنا',
    'supportEmail': 'راسل الدعم',
    'supportPrompt':
        'لو التطبيق عجبك، ياريت تدعمني عشان أقدر أكمّل تطويره وتحسينه.',
    'supportOptional': 'دعم اختياري • تبرّع مرة واحدة',
    'developedBy': 'Developed by Karim Aboushousha',
    'supportWith': 'اختار طريقة الدعم المناسبة',
    'supportInstaPay': 'InstaPay',
    'supportStripe': 'Stripe',
    'supportPayPal': 'PayPal',
    'linkOpenFailed': 'تعذّر فتح الرابط.',
    'dark': 'داكن',
    'light': 'فاتح',
    'wakeOnLan': 'التنبيه عبر الشبكة (تشغيل)',
    'ok': 'موافق',
  };

  String get(String key) {
    final map = isArabic ? _ar : _en;
    return map[key] ?? _en[key] ?? key;
  }
}

class MorphLocalizations extends InheritedWidget {
  final MorphStrings strings;
  const MorphLocalizations({
    super.key,
    required this.strings,
    required super.child,
  });

  static MorphStrings of(BuildContext context) {
    final w = context.dependOnInheritedWidgetOfExactType<MorphLocalizations>();
    assert(w != null, 'MorphLocalizations not found in tree');
    return w!.strings;
  }

  @override
  bool updateShouldNotify(MorphLocalizations old) =>
      old.strings.locale != strings.locale;
}
