# Morph TV 0.8.226

- IPTV rails use explicit 18px card margins so spacing also works on older Samsung engines without flex gap. Navigation icons have 6px margins from their text.
- Phone DLNA selection checks AVTransport connectivity without starting playback. SetURI waits for transitional renderer state before Play. Local files send their actual MIME type and title.
- Choose a phone video, audio file or photo before or after connecting. Send file shares only that file with the chosen receiver; native HTTP streaming supports HEAD and 64-bit byte ranges without copying the whole file into memory. Stop, replacement and application destruction close sharing. Keep the app open while streaming.
- Desktop fixture checks passed for SOAP transitions/faults, escaped metadata, HTTP range requests above 4GB, explicit send, file selection before pairing, failed connection state and IPTV D-pad navigation. Android APK signatures verified; webOS build completed.

Physical DLNA receiver playback is not verified. Device codecs remain receiver-dependent; no transcoding or DRM bypass is implemented. Legacy Tizen 2/3 candidates remain unchanged. Other previously reported issues are not claimed fixed by this release.
