# Morph TV 0.8.219

## IPTV Home startup correction
- Ready movie/live rows render without waiting for a stalled series request. UI paints are batched, and focus restoration is retained.
- Live-only libraries fall back to real Live Channels when no sports channels are available; ordinary channels are not mislabeled as sports.
- Last nonempty Home snapshots persist across document/app restarts, scoped to account and family viewer, bounded to three saved contexts. Incomplete snapshots remain eligible for refresh.
- A failed/empty load displays a usable retry/browse state instead of empty rails being treated as loaded content.
- Initial loading cover dismisses only for actual cards, an explicit failure state, or navigation/settings.
- A forced refresh arriving during a request is queued rather than dropped.

## Verification
Automated native-bridge fixture matrix: stalled series with available movies/live, live-only non-sports subscription, first-request failure recovery, persisted cold restart, all requests failing and remote-accessible recovery controls. No real Fire TV/projector playback/performance claim.

No account, favorite, player or theme logic is replaced. Existing 0.8.218 visual/performance changes are retained.
