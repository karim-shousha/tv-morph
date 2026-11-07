import 'dart:convert';
import 'dart:typed_data';

/// Small protobuf wire codec for Android TV Remote v2. Only protocol fields
/// needed for pairing and key injection are implemented here.
class AndroidTvProtocol {
  // Remote IME (mask 0x04) replaces the TV keyboard with the phone-input banner.
  // Morph text uses its authenticated host channel; normal remote pairing must
  // leave the device's own keyboard available.
  static const remoteImeFeature = 0x04;
  static int deviceKeyboardFeatures(int features) => features & ~remoteImeFeature;
  static const defaultFeatures = 1 | 2 | 32 | 64 | 512;

  static Uint8List varint(int value) {
    final out = <int>[];
    var n = value;
    while (n >= 0x80) {
      out.add((n & 0x7f) | 0x80);
      n >>= 7;
    }
    out.add(n);
    return Uint8List.fromList(out);
  }

  static Uint8List fieldVarint(int field, int value) =>
      Uint8List.fromList([...varint(field << 3), ...varint(value)]);

  static Uint8List fieldBytes(int field, List<int> value) => Uint8List.fromList(
    [...varint((field << 3) | 2), ...varint(value.length), ...value],
  );

  static Uint8List fieldString(int field, String value) =>
      fieldBytes(field, utf8.encode(value));

  static Uint8List join(Iterable<List<int>> values) =>
      Uint8List.fromList(values.expand((e) => e).toList());

  static Uint8List envelope(List<int> payload, {int status = 200}) => join([
    fieldVarint(1, 2), // Protocol version
    fieldVarint(2, status),
    payload,
  ]);

  static Uint8List frame(List<int> protobuf) =>
      Uint8List.fromList([...varint(protobuf.length), ...protobuf]);

  static Uint8List framePairing(List<int> envelope) => frame(envelope);

  static Uint8List pairingRequest(String name) => envelope(
    fieldBytes(10, join([fieldString(1, 'atvremote'), fieldString(2, name)])),
  );

  static Uint8List pairingAck(int field, List<int> value) =>
      envelope(fieldBytes(field, value));

  static Uint8List inputOptions({
    bool includeEncoding = true,
    bool asEnvelope = true,
  }) {
    final encoding = join([fieldVarint(1, 3), fieldVarint(2, 6)]);
    final options = includeEncoding
        ? join([fieldBytes(1, encoding), fieldVarint(3, 1)])
        : join([fieldVarint(3, 1)]);
    final field = fieldBytes(20, options);
    return asEnvelope ? envelope(field) : field;
  }

  static Uint8List inputConfiguration({bool asEnvelope = true}) {
    final encoding = join([fieldVarint(1, 3), fieldVarint(2, 6)]);
    final configuration = join([fieldBytes(1, encoding), fieldVarint(2, 1)]);
    final field = fieldBytes(30, configuration);
    return asEnvelope ? envelope(field) : field;
  }

  static Uint8List secret(List<int> bytes, {bool asEnvelope = true}) {
    final field = fieldBytes(40, fieldBytes(1, bytes));
    return asEnvelope ? envelope(field) : field;
  }

  static Uint8List key(int keyCode, {bool asEnvelope = false, int direction = 3}) {
    final payload = fieldBytes(
      10,
      join([
        fieldVarint(1, keyCode),
        fieldVarint(2, direction), // RemoteDirection: down=1, up=2, short=3
      ]),
    );
    return frame(asEnvelope ? envelope(payload) : payload);
  }

  /// Android TV Remote v2 app-link launch request (RemoteMessage field 90).
  static Uint8List launchApp(String appLink) =>
      frame(fieldBytes(90, fieldString(1, appLink)));

  static Uint8List remoteConfigureReply(int supportedFeatures) {
    final info = join([
      fieldVarint(3, 1),
      fieldString(4, '1'),
      fieldString(5, 'com.morphremote.app'),
      fieldString(6, '1.0.1'),
    ]);
    final configure = join([
      fieldVarint(1, deviceKeyboardFeatures(supportedFeatures)),
      fieldBytes(2, info),
    ]);
    return frame(fieldBytes(1, configure));
  }

  static Uint8List remoteSetActive(int features) =>
      frame(fieldBytes(2, fieldVarint(1, deviceKeyboardFeatures(features))));

  static Uint8List pingResponse(int value) =>
      frame(fieldBytes(9, fieldVarint(1, value)));

  /// Reads length-delimited protobuf messages, preserving incomplete frames.
  static List<Uint8List> takeFrames(List<int> buffer) {
    final messages = <Uint8List>[];
    var offset = 0;
    while (offset < buffer.length) {
      final parsed = _readVarint(buffer, offset);
      if (parsed == null) break;
      final (length, bodyOffset) = parsed;
      if (length < 0 || length > 1024 * 1024) {
        throw const FormatException('Invalid Android TV protobuf frame');
      }
      if (buffer.length < bodyOffset + length) break;
      messages.add(
        Uint8List.fromList(buffer.sublist(bodyOffset, bodyOffset + length)),
      );
      offset = bodyOffset + length;
    }
    if (offset > 0) buffer.removeRange(0, offset);
    return messages;
  }

  /// Returns the length-delimited payloads for the requested protobuf field.
  static List<Uint8List> bytesFields(List<int> message, int field) {
    final out = <Uint8List>[];
    var offset = 0;
    while (offset < message.length) {
      final key = _readVarint(message, offset);
      if (key == null) break;
      offset = key.$2;
      final wire = key.$1 & 7;
      final number = key.$1 >> 3;
      if (wire == 0) {
        final value = _readVarint(message, offset);
        if (value == null) break;
        offset = value.$2;
      } else if (wire == 2) {
        final size = _readVarint(message, offset);
        if (size == null) break;
        offset = size.$2;
        if (offset + size.$1 > message.length) break;
        if (number == field) {
          out.add(
            Uint8List.fromList(message.sublist(offset, offset + size.$1)),
          );
        }
        offset += size.$1;
      } else if (wire == 1) {
        offset += 8;
      } else if (wire == 5) {
        offset += 4;
      } else {
        throw const FormatException('Unsupported protobuf wire type');
      }
    }
    return out;
  }

  static List<int> varintFields(List<int> message, int field) {
    final out = <int>[];
    var offset = 0;
    while (offset < message.length) {
      final key = _readVarint(message, offset);
      if (key == null) break;
      offset = key.$2;
      final wire = key.$1 & 7;
      final number = key.$1 >> 3;
      if (wire == 0) {
        final value = _readVarint(message, offset);
        if (value == null) break;
        if (number == field) out.add(value.$1);
        offset = value.$2;
      } else if (wire == 2) {
        final size = _readVarint(message, offset);
        if (size == null) break;
        offset = size.$2 + size.$1;
      } else if (wire == 1) {
        offset += 8;
      } else if (wire == 5) {
        offset += 4;
      } else {
        throw const FormatException('Unsupported protobuf wire type');
      }
    }
    return out;
  }

  static (int, int)? _readVarint(List<int> bytes, int start) {
    var result = 0;
    var shift = 0;
    var offset = start;
    while (offset < bytes.length && shift < 64) {
      final byte = bytes[offset++];
      result |= (byte & 0x7f) << shift;
      if ((byte & 0x80) == 0) return (result, offset);
      shift += 7;
    }
    return null;
  }
}
