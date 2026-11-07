import 'dart:convert';
import 'dart:typed_data';

import 'package:basic_utils/basic_utils.dart';
import 'package:crypto/crypto.dart';

/// Persistent mTLS identity used by Android TV Remote v2.
class AndroidTvIdentity {
  final String certificatePem;
  final String privateKeyPem;

  const AndroidTvIdentity(this.certificatePem, this.privateKeyPem);

  String serialize() => jsonEncode({
    'v': 1,
    'certificate': certificatePem,
    'privateKey': privateKeyPem,
  });

  static AndroidTvIdentity? tryParse(String? value) {
    if (value == null || value.isEmpty) return null;
    try {
      final map = jsonDecode(value) as Map<String, dynamic>;
      final cert = map['certificate'] as String;
      final key = map['privateKey'] as String;
      if (!cert.contains('BEGIN CERTIFICATE') ||
          !key.contains('BEGIN PRIVATE KEY')) {
        return null;
      }
      return AndroidTvIdentity(cert, key);
    } catch (_) {
      return null;
    }
  }

  static Future<AndroidTvIdentity> generate() async {
    final pair = CryptoUtils.generateRSAKeyPair(keySize: 2048);
    final privateKey = pair.privateKey as RSAPrivateKey;
    final publicKey = pair.publicKey as RSAPublicKey;
    final csr = X509Utils.generateRsaCsrPem(
      {'CN': 'Morph Remote'},
      privateKey,
      publicKey,
    );
    final cert = X509Utils.generateSelfSignedCertificate(
      privateKey,
      csr,
      3650,
      cA: true,
      pathLenConstraint: 0,
      serialNumber: DateTime.now().microsecondsSinceEpoch.toString(),
    );
    return AndroidTvIdentity(
      cert,
      CryptoUtils.encodeRSAPrivateKeyToPem(privateKey),
    );
  }

  /// Android TV pairing hash uses unsigned big-endian RSA integers and the
  /// last four hex PIN characters as bytes.
  Uint8List pairingSecret(String pin, String serverCertificatePem) {
    final client = X509Utils.x509CertificateFromPem(certificatePem);
    final server = X509Utils.x509CertificateFromPem(serverCertificatePem);
    final clientInfo = client.tbsCertificate!.subjectPublicKeyInfo;
    final serverInfo = server.tbsCertificate!.subjectPublicKeyInfo;
    final material = <int>[
      ..._unsignedBytes(X509Utils.getModulusFromRSAX509Pem(certificatePem)),
      ..._unsignedBytes(BigInt.from(clientInfo.exponent!)),
      ..._unsignedBytes(
        X509Utils.getModulusFromRSAX509Pem(serverCertificatePem),
      ),
      ..._unsignedBytes(BigInt.from(serverInfo.exponent!)),
      ..._hexBytes(pin.substring(2)),
    ];
    final digest = sha256.convert(material).bytes;
    return Uint8List.fromList(digest);
  }

  static List<int> _hexBytes(String value) => [
    for (var i = 0; i + 1 < value.length; i += 2)
      int.parse(value.substring(i, i + 2), radix: 16),
  ];

  static List<int> _unsignedBytes(BigInt value) {
    if (value == BigInt.zero) return [0];
    var hex = value.toRadixString(16);
    if (hex.length.isOdd) hex = '0$hex';
    return _hexBytes(hex);
  }
}
