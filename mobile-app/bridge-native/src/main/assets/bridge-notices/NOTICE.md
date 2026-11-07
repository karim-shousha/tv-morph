# scrcpy server attribution

Bundled asset: android-host/app/src/main/assets/scrcpy-server-v5.0.1
Upstream: https://github.com/Genymobile/scrcpy
Version: v5.0.1, official unmodified release server.
License: Apache License 2.0 (LICENSE in this directory).
Source: https://github.com/Genymobile/scrcpy/tree/v5.0.1/server
SHA-256: 764eb6f79811d5211fe9df341120882ba9994c7a61b897d7bf3fb662e53bc536
The asset was checked against the upstream SHA256SUMS.txt included here.

AppBridge implements its own on-device Shizuku launcher, descriptor transport,
packet reader, MP4 muxer and TV UI. No scrcpy desktop client is bundled or
required for normal operation. The server is configured with new_display;
there is no display-0 fallback. Audio and clipboard synchronization are disabled.

## AppBridge UID-filtered audio server

A second asset, scrcpy-audio-appbridge.jar, is built from source/scrcpy-5.0.1.
It is a modified version of scrcpy 5.0.1, not the upstream release binary:
- Options accepts audio_target_uid and Server passes it to AudioPlaybackCapture.
- AudioPlaybackCapture requires that UID and matches only its media/game/unknown
  playback. Loopback-only routing is used, never microphone capture.
- The local build uses AGP 8.5.2 / Gradle 8.7 available in this workspace.
The modified source and upstream LICENSE are retained in this directory.
