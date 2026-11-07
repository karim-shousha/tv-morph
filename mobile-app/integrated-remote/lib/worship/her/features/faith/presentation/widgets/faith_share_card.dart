import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

/// Shares faith content as plain text only. This avoids social apps treating
/// the app link as a promotional card and keeps the shared content readable.
Future<void> shareFaithCard({
  required BuildContext context,
  required String title,
  required String body,
  String? reference,
}) async {
  final source = reference == null || reference.trim().isEmpty
      ? ''
      : '\n\n$reference';
  try {
    await Share.share('$title\n\n$body$source', subject: title);
  } catch (_) {
    if (!context.mounted) return;
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(
      const SnackBar(content: Text('تعذر فتح المشاركة الآن. حاول مرة أخرى.')),
    );
  }
}
