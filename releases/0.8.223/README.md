# Morph TV 0.8.223 — Samsung IPTV load / offline Adhan

## Changes
- Samsung provider requests run sequentially with an event-loop yield, reducing simultaneous full-catalog JSON allocations. Exit aborts the active request and cancels queued requests from the old session.
- IndexedDB catalog pruning uses key-only cursors, avoiding loading every stored catalog value during each write. Retains at most 12 cache records; expired records remain rejected on read. No accounts, favorites or progress deleted.
- TVs without IntersectionObserver load Home artwork only inside the visible rows, including horizontal bounds; scrolling reveals more artwork.
- Low-memory / Tizen 6 and older disable expensive backdrop blur and glow even if a Quality preset was saved.
- Prayer calendar caches the current and following Gregorian month for offline operation. Bundled Egypt/Makkah audio remains local. Initial location/calendar setup still needs Internet; playback requires Morph TV running/visible, not a powered-off TV.

## Validation
- Samsung actual backend fixture: 48,000 catalog items, 60-item pages, correct newest order, maximum one provider request at a time, 3 key-only cursors and 0 value cursors during catalog writes.
- Samsung search/order regression fixture passed.
- Offline calendar fixture: 61 days via 2 month requests, cached next-month day retrieved offline without network; both local audio files exist.
- JavaScript syntax validation passed.
- Physical Samsung device not connected; these changes address confirmed allocation/rendering inefficiencies, but the reported process exit is not yet device-verified fixed. No crash log available.
