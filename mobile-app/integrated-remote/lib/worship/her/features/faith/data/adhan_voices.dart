class AdhanVoice {
  const AdhanVoice(this.id, this.name, this.file, this.sound, this.seconds);
  final String id, name, file, sound;
  final int seconds;
  String get asset => 'sounds/azan/$file.mp3';
}

const adhanVoices = [
  AdhanVoice('beautiful-cc0', 'مصر — الأذان الرئيسي', 'egypt', 'azan', 173),
  AdhanVoice('masr', 'مصر — صوت آخر', 'masr', 'azan_masr', 245),
  AdhanVoice('algeria', 'الجزائر', 'algeria', 'azan_algeria', 174),
  AdhanVoice('ezeldeen', 'عز الدين', 'ezeldeen', 'azan_ezeldeen', 243),
  AdhanVoice('makka', 'مكة', 'makka', 'azan_makka', 205),
  AdhanVoice('qatar', 'قطر', 'Qatar', 'azan_qatar', 256),
  AdhanVoice('tarekahmed', 'طارق أحمد', 'tarekahmed', 'azan_tarekahmed', 165),
];

AdhanVoice adhanVoiceFor(String id) => adhanVoices.firstWhere(
  (voice) => voice.id == id,
  orElse: () => adhanVoices.first,
);
