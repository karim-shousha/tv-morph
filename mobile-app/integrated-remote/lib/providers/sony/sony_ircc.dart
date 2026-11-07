/// Sony Bravia IRCC-IP command codes.
///
/// Source: official Sony BRAVIA Professional Displays documentation
/// (pro-bravia.sony.net IRCC-IP + getRemoteControllerInfo spec) and
/// community runtime dumps. The provider ALWAYS prefers codes discovered
/// at runtime via getRemoteControllerInfo; this table is the fallback and
/// each entry is pending hardware confirmation (see device docs).
const sonyIrccFallback = <String, String>{
  'Power': 'AAAAAQAAAAEAAAAVAw==',
  'Input': 'AAAAAQAAAAEAAAAlAw==',
  'Num0': 'AAAAAQAAAAEAAAAJAw==',
  'Num1': 'AAAAAQAAAAEAAAAAAw==',
  'Num2': 'AAAAAQAAAAEAAAABAw==',
  'Num3': 'AAAAAQAAAAEAAAACAw==',
  'Num4': 'AAAAAQAAAAEAAAADAw==',
  'Num5': 'AAAAAQAAAAEAAAAEAw==',
  'Num6': 'AAAAAQAAAAEAAAAFAw==',
  'Num7': 'AAAAAQAAAAEAAAAGAw==',
  'Num8': 'AAAAAQAAAAEAAAAHAw==',
  'Num9': 'AAAAAQAAAAEAAAAIAw==',
  'Up': 'AAAAAQAAAAEAAAB0Aw==',
  'Down': 'AAAAAQAAAAEAAAB1Aw==',
  'Right': 'AAAAAQAAAAEAAAAzAw==',
  'Left': 'AAAAAQAAAAEAAAA0Aw==',
  'Confirm': 'AAAAAQAAAAEAAABlAw==',
  'Back': 'AAAAAgAAAJcAAAAjAw==',
  'Home': 'AAAAAQAAAAEAAABgAw==',
  'Options': 'AAAAAgAAAJcAAAA2Aw==',
  'VolumeUp': 'AAAAAQAAAAEAAAASAw==',
  'VolumeDown': 'AAAAAQAAAAEAAAATAw==',
  'Mute': 'AAAAAQAAAAEAAAAUAw==',
  'ChannelUp': 'AAAAAQAAAAEAAAAQAw==',
  'ChannelDown': 'AAAAAQAAAAEAAAARAw==',
  'Play': 'AAAAAgAAAJcAAAAaAw==',
  'Pause': 'AAAAAgAAAJcAAAAZAw==',
  'Stop': 'AAAAAgAAAJcAAAAYAw==',
  'Prev': 'AAAAAgAAAJcAAAA8Aw==',
  'Next': 'AAAAAgAAAJcAAAA9Aw==',
};
