import 'dart:async';
import 'package:audio_service/audio_service.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:rxdart/rxdart.dart';
class HerAudioEntry {
  const HerAudioEntry({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.source,
    this.isAsset = false,
    this.isFile = false,
    this.artUrl,
  });

  final String id;
  final String title;
  final String subtitle;
  final String source;
  final bool isAsset;
  final bool isFile;
  final String? artUrl;

  MediaItem get mediaItem => MediaItem(
    id: id,
    title: title,
    album: subtitle,
    artUri:
        Uri.tryParse(artUrl ?? '') ??
        Uri.parse('android.resource://com.her.wellbeing/mipmap/ic_launcher'),
  );
}

class AdhanStartReport {
  const AdhanStartReport({
    required this.sourceRequested,
    required this.runtimeSource,
    required this.contextSet,
    required this.focusGranted,
    required this.playCalled,
    required this.volumeBefore,
    required this.volumeAfter,
    required this.stateAfterPlay,
    required this.positionMsEarly,
    required this.positionMsLate,
    required this.positionsKnown,
    required this.positionAdvances,
    required this.durationMs,
    required this.error,
  });

  /// Asset key requested by the app layer (e.g. sounds/azan.mp3).
  final String sourceRequested;

  /// Exact source handed to the player at runtime
  /// (e.g. AssetSource(path: sounds/azan.mp3) — audioplayers extracts the
  /// Flutter asset to a local temp file and opens file:// under the hood).
  final String runtimeSource;
  final bool contextSet;
  final bool focusGranted;
  final bool playCalled;
  final double? volumeBefore;
  final double? volumeAfter;
  final String stateAfterPlay;
  final int? positionMsEarly;
  final int? positionMsLate;
  final bool positionsKnown;
  final bool positionAdvances;
  final int? durationMs;

  /// Exact engine error, or null when the start verified.
  final String? error;

  bool get verified => error == null;
}

class HerAudioService {static final dynamic handler=MorphFaithAudioHandler();static Future<void> initialize()async{}}
class MorphFaithAudioHandler {
 final player=AudioPlayer();final mediaItem=BehaviorSubject<MediaItem?>.seeded(null);String collection='';bool adhanActive=false;String? adhanLastError;AdhanStartReport? adhanLastReport;dynamic onAdhanInterrupted;
 Future<void> stopForCollectionChange(String next)async{if(collection!=next)await stop();collection=next;}
 Future<void> playEntries(List<HerAudioEntry> entries,int index,{String collection=''})async{final e=entries[index];this.collection=collection;mediaItem.add(e.mediaItem);await player.play(e.isFile?DeviceFileSource(e.source):e.isAsset?AssetSource(e.source):UrlSource(e.source));}
 Future<void> pause()=>player.pause();Future<void> stop()=>player.stop();Future<void> stopFullAdhan()async{}
}
