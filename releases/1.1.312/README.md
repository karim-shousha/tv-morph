Morph Launcher / Morph IPTV 1.1.312

- Keep IPTV favourites in the order added, independent of library sorting.
- Persist launcher theme/settings across Android process restarts; loading artwork no longer overwrites selected settings.
- Automatic foreground Adhan handles short scheduling gaps; missing saved volume defaults audibly; TV calculation methods expanded to12.
- Manage saved IPTV accounts with editable server/name/credentials and stable account identity.
- Fix asynchronous Samsung/LG USB browser discovery; Android local playback can try the alternate decoder once.
- Improve4K track capability selection and bound first-picture recovery; unsupported customer codecs remain hardware-dependent.
- LiveOK opens channels without pausing; show channel name in the playback dock; Android volume keys change one system step;10-second seeks retained.
- Samsung dedicated Play/Pause acts even with hidden controls; LG starts the channel drawer on its categories.
- Retry temporary provider authentication failures at most twice; retain explicit401/403 errors and desktop playback denial feedback.
- Actual Windows and Android emulator playback tests passed for live/movie/episode controls. Physical TCL/Samsung/LG and the unknown customer4K source were not available.
- Fix shared IPTV system keyboard activation on Android and editable system inputs on web TV/desktop. Real Android phone and TV typing and search submission verified.
- Phone Adhan: persist per-prayer mute settings, respect them in scheduling/playback and provide a direct Stop Adhan button.
- Phone Android TV remote no longer negotiates permanent remote IME; paired-phone text inside Morph keeps its independent authenticated path.
- Android Media Player uses the system document picker directly where available; a bounded centered file-manager selector avoids OEM resolver clipping and excludes placeholder/photo-only handlers.
- Series episodes: the latest resumable episode has a persistent contrasting background and Continue watching label, independent of remote focus; reopening uses current saved playback progress.