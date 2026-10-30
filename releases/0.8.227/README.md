# Morph TV 0.8.227

- Large IPTV catalogues normalize in cooperative batches, use a bounded sorting worker with a compatibility fallback, and persist in 500-row IndexedDB chunks.
- Exact page/version revalidation reuses cached pages while refreshing viewing progress. Existing six-hour catalogue freshness remains unchanged.
- Closing IPTV removes parent window subscriptions; native Android IPTV scripts target the older supported engine and avoid Promise.finally.
- Matched desktop fixture with 71,000 movies reduced warm section P95 from 1,002 ms to 171 ms. This measures section loading, not a claimed D-pad speed improvement.
- A 15-minute desktop run completed 12,646 inputs, 63 mocked playback cycles and three reopens with no JavaScript or sampled off-screen focus errors. Native playback and physical TVs remain unverified. Continuous-run memory acceptance is inconclusive because test ElementHandles retained detached documents; the isolated listener lifecycle test passed.
- Large category lists still cause some long tasks. Visuals and feature controls are preserved. Legacy Tizen 2/3 candidates remain unchanged. Samsung installer certificate/file-upload features are not included.
