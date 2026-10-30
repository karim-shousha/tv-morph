# Android TV 0.8.228 manual test

Includes the reviewed OpenCode IptvStore page-token revalidation and category derivation changes. Built with the existing signing key and package local.tvmorph.tv, versionCode 228. This can update an existing installation without clearing saved accounts.

Build/signature verification passed. Executed actual native IptvStore on a desktop JVM with 71,000 injected rows and framework preferences mocked: global sort, bounded pages, exact revalidation, page/search/revision invalidation and category derivation passed. This does not test provider download/parse, Android runtime, playback or a physical TV.

No Android TV is connected to ADB. Exact crash class and cold-loading timeout cause remain unconfirmed. This is a manual test candidate, not a stability release. No timeout values changed. Mobile, Samsung, LG, public catalogue, updater feeds and default download aliases remain at their previous versions.
