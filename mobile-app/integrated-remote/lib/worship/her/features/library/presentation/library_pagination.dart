import 'package:flutter/material.dart';

class LibraryTextPage {
  const LibraryTextPage(this.span, this.start, this.end);
  final TextSpan span;
  final int start;
  final int end;
}

/// Splits native rich text at measured word boundaries, retaining every code
/// unit and editorial style. Page offsets remain stable when the layout changes.
List<LibraryTextPage> paginateLibraryText(
  TextSpan source, {
  required double width,
  required double height,
  TextScaler textScaler = TextScaler.noScaling,
  List<int> sectionStarts = const [],
}) {
  final runs = <TextSpan>[];
  void flatten(TextSpan node, TextStyle inherited) {
    final style = inherited.merge(node.style);
    if (node.text?.isNotEmpty == true) {
      runs.add(TextSpan(text: node.text, style: style));
    }
    for (final child in node.children ?? const <InlineSpan>[]) {
      if (child is TextSpan) flatten(child, style);
    }
  }

  flatten(source, const TextStyle());
  final text = source.toPlainText();
  TextSpan slice(int start, int end) {
    var offset = 0;
    final children = <TextSpan>[];
    for (final run in runs) {
      final next = offset + run.text!.length;
      if (next > start && offset < end) {
        children.add(
          TextSpan(
            text: run.text!.substring(
              (start - offset).clamp(0, run.text!.length),
              (end - offset).clamp(0, run.text!.length),
            ),
            style: run.style,
          ),
        );
      }
      offset = next;
      if (offset >= end) break;
    }
    return TextSpan(children: children);
  }

  final pages = <LibraryTextPage>[];
  var start = 0;
  while (start < text.length) {
    var low = start + 1;
    var high = (start + 5000).clamp(0, text.length);
    var fit = start;
    while (low <= high) {
      final middle = (low + high) ~/ 2;
      final painter = TextPainter(
        text: slice(start, middle),
        textDirection: TextDirection.rtl,
        textAlign: TextAlign.right,
        textScaler: textScaler,
      )..layout(maxWidth: width);
      final fits = painter.height <= height;
      painter.dispose();
      if (fits) {
        fit = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    var end = fit > start ? fit : start + 1;
    for (final boundary in sectionStarts) {
      if (boundary > start && boundary < end) {
        end = boundary;
        break;
      }
    }
    if (end < text.length) {
      final whitespace = text.lastIndexOf(RegExp(r'\s'), end - 1);
      if (whitespace > start) end = whitespace + 1;
      // Never split a UTF-16 surrogate pair in a long unbroken token.
      if (end > start &&
          text.codeUnitAt(end - 1) >= 0xD800 &&
          text.codeUnitAt(end - 1) <= 0xDBFF) {
        end--;
      }
      if (end <= start) end = (start + 2).clamp(0, text.length);
    }
    pages.add(LibraryTextPage(slice(start, end), start, end));
    start = end;
  }
  return pages;
}

/// Nearest page at/after [from] whose rendered text is non-blank, falling
/// back to the closest non-blank page before it. The reader uses this so a
/// fresh open (or a stale saved offset) never lands on a visually empty page
/// while resume-to-a-valid-page stays exactly where the user stopped.
int firstReadableLibraryPage(List<LibraryTextPage> pages, int from) {
  if (pages.isEmpty) return 0;
  final clamped = from.clamp(0, pages.length - 1);
  for (var i = clamped; i < pages.length; i++) {
    if (pages[i].span.toPlainText().trim().isNotEmpty) return i;
  }
  for (var i = clamped - 1; i >= 0; i--) {
    if (pages[i].span.toPlainText().trim().isNotEmpty) return i;
  }
  return clamped;
}
