# Morph Sports — API integration

## Provider selection

API-Football was selected for the implemented adapter because its league discovery, fixture/live status, standings and embedded match-detail endpoints fit the requested feature. IDs are read from responses, never a hardcoded competition-ID map. The requested Egyptian, Saudi, CAF/AFC, European and international tournaments are prioritised when present in current league discovery; unsupported or absent seasons are not advertised. No authenticated discovery occurred during this task, so there is no verified supported-competition list yet.

Sources checked on 2026-10-28:
- [API-Football documentation](https://www.api-football.com/documentation_v3)
- [API-Football pricing](https://www.api-football.com/pricing)
- [API-Football terms](https://www.api-football.com/terms)
- [football-data.org coverage](https://www.football-data.org/coverage) and [pricing](https://www.football-data.org/pricing)
- [TheSportsDB API](https://api.thesportsdb.com/api.php)

API-Football lists 100 daily requests on its free plan and 7,500 on the $19/month plan, with restricted available seasons on free. TheSportsDB advertises a $9/month supporter API including two-minute livescores. football-data.org's listed free competitions favour European leagues and major international tournaments and do not list the requested Egyptian/Saudi domestic leagues. These are selection inputs, not purchases or guarantees of coverage.

API-Football's terms describe application use and restrict direct data resale. Public API access is not treated as unrestricted commercial/logo licensing. The operator must confirm the account's permitted intended use and any separate artwork rights; logos default to disabled. No paid service was provisioned.

## Deployment architecture

TV XHR → existing `https://morphtv.herroshetta.com/api/sports/` → existing Nginx `/api/` proxy → existing `community/server.py` process → `sports.Sports` → API-Football v3.

The existing Dockerfile now includes `sports.py` and unified admin assets. Persistent `sports.sqlite3` lives in the existing `/data` volume. No new process or port is required. `ClearTV.config.sportsURL` can override the public API base for controlled staging builds. Never put the provider key there or into any TV asset.

Backend-only configuration:

| Environment variable | Purpose |
| --- | --- |
| `MORPH_SPORTS_API_KEY` | Private API-Football direct API-Sports key |
| `MORPH_SPORTS_DATA_APPROVED=1` | Enable provider calls after verifying account/usage permission |
| `MORPH_SPORTS_DAILY_BUDGET` | Shared UTC-day request ceiling; defaults to 90 to retain headroom under a 100/day plan |
| `MORPH_SPORTS_LOGOS_APPROVED=1` | Optional explicit artwork-rights approval; off by default |

Set these using the existing server/container secret configuration, then restart the existing API process as part of an approved deployment. Do not commit an actual key or place it in a downloadable asset. Without key and approval, Sports returns `configuration_required` and the complete TV UI stays usable. The unified admin uses the existing `MORPH_ADMIN_PASSWORD_HASH`; there is no new admin account/password system.

## Public read API

| Route under `/api/sports/` | Contract |
| --- | --- |
| `competitions` | Current supported league IDs, provider names/country, season and standings coverage |
| `fixtures?date=YYYY-MM-DD` | UTC-day fixtures, normalized teams/scores/status/venue/details |
| `match?id=…` | One fixture with provider-supplied embedded events/lineups/statistics |
| `teams?league=…&season=…` | Teams for a discovered current competition |
| `standings?league=…&season=…` | Grouped tables only when discovery reports standings coverage |

Successful responses include `data`, `updatedAt`, `stale`, `refreshAfter`, and provider attribution. Error codes include `configuration_required`, `invalid_request`, `unsupported`, `rate_limited`, and `provider_unavailable`. Query IDs are bounded positive integers; team/table queries must match discovered current season metadata. Fixture dates are restricted to ±32 UTC days; the UI's ±30 local-day calendar plus its next-day preview fit that window.

Team-logo URLs are filtered to the provider's media origin and suppressed unless logo approval is enabled. No betting, streaming or broadcast endpoints are called.

## Timezones and caching

Each selected local TV day combines three or four UTC-day cache entries and filters kickoff timestamps in the TV's own timezone. Local timestamps use the device's locale/timezone and DST behavior; no Egypt/Canada timezone is hardcoded. Duplicate fixture IDs are removed before bounded rendering.

| Data | Server cache |
| --- | --- |
| In-play or scheduled within two hours of kickoff | 90 seconds |
| Other upcoming schedules / empty fixture days | 1 hour |
| Completed fixture data | 6 hours |
| Standings | 6 hours |
| Competition discovery / teams | 24 hours |

One shared-process lock coalesces concurrent misses across devices; SQLite persists the cache and UTC-day budget across restart. This matches the current single-process backend deployment. Multiple API replicas would require an external/shared coordination layer; none was added.

Every actual provider attempt consumes the configured daily budget. Quota responses trigger a shared 15-minute cooldown. Cached data up to seven days old may be returned explicitly stale during outages/limits; older records are discarded on successful maintenance. Provider calls use a fixed upstream host and timeout, not a client-controlled proxy URL.

The TV keeps at most 12 local cache entries with a seven-day stale ceiling. Offline/outage fallback is visibly labelled; configuration/rate-limit errors remain visible alongside fallback data. TV refresh follows server guidance, with a 90-second minimum. Requests are aborted and timers cancelled on view exit/background; late responses cannot repaint a newer screen.

The default free-plan budget cannot sustain continuous all-day live polling. Select an adequate existing provider plan and budget before promising continuous live updates. Coverage, detail availability and delay remain provider/competition dependent.
