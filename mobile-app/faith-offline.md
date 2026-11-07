# Morph TV optional worship corner

The opt-in lives in Settings. It is off on a fresh installation. Enabling it adds
My Worship at the physical right of the navigation and centers Devices. Disabling
it hides its pages, stops Adhan and cancels prayer alarms; reading/counter history
is retained privately on the phone. IPTV account and TV-pairing stores are separate.

## Local content and presentation

`assets/ui/worship-phone.js` uses HER's bundled content, exported by
`.tools/export-her-faith.dart`. The 114 surahs / 6,236 ayahs are split into local
surah scripts and loaded only when opened. The Uthmani text is unchanged. The 61
adhkar and 32 supplications retain their source references. Quran credit appears
in the reader. UI instructions use masculine Arabic; do not rewrite quoted Quran
or hadith to perform a gender audit.

There are no HER accounts, remote-content requests, groups, challenges, ads,
online Quran audio or geocoding in this corner. Reading position, bookmarks,
tasbih, daily dhikr counts and completed prayers stay in phone-local storage.
Reader day/night surfaces have independent ink roles; changing the reader does
not change the rest of the application theme.

## Prayer times and audio

`FaithPrayerMath` uses Batoul Apps Adhan Java 1.2.1, pinned at
`5e633fd892493d28f1eab78b62872fc95b476225`; its MIT notice is bundled under
`assets/ui/faith/licenses/`. City presets come from HER's local fallback list.
Coordinates and timezone can also be entered manually. No timing server is used.
`FaithPrayer` owns explicit notification/exact-alarm consent, per-method settings,
Asr school, minute offsets, reboot/clock-change recovery and the next OS alarm.
Reminder-only and full-Adhan settings are separate. Sunrise never produces an Adhan.
`PhoneFaithAudio` reuses the shared player's pause/resume contract. Phone IPTV's
legacy TV schedule cannot bypass the phone worship opt-in or produce duplicate audio.

Only Egypt is bundled in the APK. The six remaining approved recordings are an
optional `Morph-TV-Adhan-Voices-v1.zip`. Users can import it through Android's file
picker or explicitly download the static archive once. Import verifies bounded
sizes, known filenames and approved SHA-256 hashes before replacing the private
voice directory. Removing the pack preserves Egypt and all worship history.
Neither prayer computation nor scheduled audio needs a network connection.

## Matches

The phone schedule uses the same `/api/matches` normalized feed as the launcher and
standalone IPTV. Phone presentation is `matches-phone.js/css`; native transport and
the full page are `MatchSchedule` / `MatchesActivity`. The entry is under the IPTV
header, not a bottom-navigation slot. Limited/free coverage, old cache and missing
service states are explicit; scores and dates are never invented.

## Verification

`tests/worship-matches-check.cjs` checks DOM/geometry, opt-in, persistence, contrast
and interaction without screenshots. `tests/FaithPhoneInstrumentation.java` checks
the installed Android WebView, bundled and imported recordings, real OS alarms,
background notifications, playback and unchanged IPTV accounts. Prayer astronomy
is independently compared with HER's `adhan_dart` across DST transition cases.
