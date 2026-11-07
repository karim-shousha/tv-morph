# TV Morph theme commerce preparation

The user selected one-time theme sales at USD 1 per theme, not subscriptions. Premium subscription plans were discarded. Collections cover Egyptian/European teams, Champions League, hockey, basketball and American football. Only current theme assets are displayed as available previews; unbuilt sport collections are marked coming soon. Bundle prices are not set.

`catalog.json` defines proposed non-consumable Google Play product IDs. They are not created or activated in Play Console, and no purchases, billing client or server-authoritative trials are active in the public preview. Current functionality stays available for testing; UI must not claim that a user has purchased or started a protected trial.

For paid release: register the app and configure one-time products in the user's Play Console; integrate current Play Billing with product prices fetched from Play; authenticate an account; verify purchase tokens on a secure backend, acknowledge verified purchases and process revocations; store one 72-hour trial per account/product using server time; enforce entitlement on TV as well as phone, preserving an accessible free fallback theme on expiry. No subscription auto-renewal is part of the model. A local timestamp is not an anti-reset trial system.

The phone preview targets API 30 and uses the legacy workspace build pipeline; it is not yet a Play-ready AAB. Current store requirements require a build/toolchain and target API migration before submission. Club logo/commercial artwork rights have not been established; review licensing before selling themed assets. Do not publish private signing keys, account credentials or IPTV data.

References:
- https://developer.android.com/google/play/billing/integrate
- https://developer.android.com/google/play/billing/lifecycle/one-time
- https://developer.android.com/google/play/billing/security
- https://support.google.com/googleplay/android-developer/answer/11926878
