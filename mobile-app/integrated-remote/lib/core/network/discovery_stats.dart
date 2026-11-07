/// Mutable counters + stage timeline for one discovery session.
/// Surfaced in the diagnostics screen; never contains secrets.
class DiscoveryStats {
  int ssdpProbesSent = 0;
  int ssdpResponses = 0;
  int mdnsServicesResolved = 0;
  int sweepScanned = 0;
  int sweepSamsung = 0;
  int sweepCompanion = 0;
  int rokuFound = 0;
  int sonyFound = 0;
  int candidatesAccepted = 0;
  int publishedToUi = 0;
  final List<String> rejected = [];
  final List<String> _stages = [];
  int _t0 = 0;
  bool multicastLockHeld = false;
  String note = '';

  /// Stage entry with elapsed-ms timestamp. Call at EVERY discovery
  /// stage so a stuck scan shows exactly where it stopped.
  void stage(String name) {
    final ms = DateTime.now().millisecondsSinceEpoch;
    if (_stages.isEmpty) {
      _t0 = ms;
      _stages.add('t+0ms $name');
    } else {
      _stages.add('t+${ms - _t0}ms $name');
    }
    if (_stages.length > 60) _stages.removeAt(0);
  }

  List<String> get stages => List.unmodifiable(_stages);

  void reject(String what, String reason) {
    if (rejected.length < 30) {
      rejected.add('$what — $reason');
    }
  }

  String summary() {
    final b = StringBuffer()
      ..writeln('Multicast lock: ${multicastLockHeld ? "HELD" : "NOT HELD"}')
      ..writeln('Sweep scanned: $sweepScanned '
          '(Samsung: $sweepSamsung, Morph TV: $sweepCompanion)')
      ..writeln('SSDP probes sent: $ssdpProbesSent')
      ..writeln('SSDP responses: $ssdpResponses')
      ..writeln('mDNS resolved: $mdnsServicesResolved')
      ..writeln('Roku candidates: $rokuFound')
      ..writeln('Sony candidates: $sonyFound')
      ..writeln('TVs accepted: $candidatesAccepted / published to UI: $publishedToUi')
      ..writeln('Rejected: ${rejected.length}');
    for (final r in rejected) {
      b.writeln('  - $r');
    }
    if (_stages.isNotEmpty) {
      b.writeln('Stages:');
      for (final s in _stages) {
        b.writeln('  $s');
      }
    }
    if (note.isNotEmpty) b.writeln('Note: $note');
    return b.toString();
  }
}

/// Cooperative cancellation for discovery sessions.
class DiscoveryCancel {
  bool _cancelled = false;
  bool get isCancelled => _cancelled;
  void cancel() => _cancelled = true;
}
