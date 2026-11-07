import 'package:flutter/material.dart';

/// The approved launcher wave, shared visually with the phone host and IPTV.
class NavyWavePainter extends CustomPainter {
  const NavyWavePainter();
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF16243D);
    final wave = Path()..moveTo(0, size.height * .77)
      ..cubicTo(size.width * .3, size.height * .58, size.width * .8,
          size.height * .64, size.width, size.height * .36)
      ..lineTo(size.width, size.height)..lineTo(0, size.height)..close();
    canvas.drawPath(wave, paint);
    paint.color = const Color(0xFF101C31);
    final lower = Path()..moveTo(0, size.height * .88)
      ..cubicTo(size.width * .35, size.height * .72, size.width * .8,
          size.height * .77, size.width, size.height * .62)
      ..lineTo(size.width, size.height)..lineTo(0, size.height)..close();
    canvas.drawPath(lower, paint);
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
