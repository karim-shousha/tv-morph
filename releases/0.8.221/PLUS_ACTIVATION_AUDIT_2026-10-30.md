# Plus activation audit — 2026-10-30

## Confirmed code-level causes

The server allowed packaged LG origins for activation/status but excluded device-list and device-removal endpoints. A customer at the seat limit could therefore fail activation and also fail to manage old seats from that application. The same strict packaged-origin allowlist now covers these two code-authenticated endpoints. Checkout/admin endpoints remain excluded; all license validation and seat limits remain enforced.

Device identity is a secure random identifier persisted in local storage. Removing the application/data or changing its application origin can create a new identity; the previous seat remains assigned. Existing activation on the same identifier is idempotent. Users can explicitly remove the old seat through device management. No automatic removal, capacity bypass or customer database edits were made.

Copied codes could include Unicode dashes, whitespace or bidirectional marks and fail the strict ASCII validator. The input now normalizes these presentation characters before strict validation. Secure random generation remains required; there is no insecure fallback.

## Validation

Disposable local nginx/API integration: packaged-origin activation, authenticated device listing/removal, seat transfer and old-token rejection passed. Unknown origins and unpaid requests remain rejected. License fixtures cover fulfillment, family concurrency, revocation, expiry/signature checks and phone-versus-TV slots. These tests do not use customer codes or production purchases.

## Remaining uncertainties

No production customer request traces or affected-device storage were inspected. Transient network/TLS/date failures and storage loss remain distinguishable causes, not universally fixed incidents. Online license verification is still required. Physical LG/Tizen activation and production payment behavior are unverified by this audit.
