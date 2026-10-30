# Morph TV 0.8.225

- Home navigation reuses focus groups and horizontal positions until controls or viewport change.
- Hero updates wait 160 ms for card focus to settle, avoiding repeated DOM work and detail scheduling during fast D-pad movement.
- Category navigation measures only the next eligible item and keeps focus visible, rather than measuring every provider category on every press.
- Hero account metadata no longer copies watch history and favourites on each focus.

Automated test: 16,000 titles, 1,200 categories. Thirty category moves: 36,180 to 31 width reads. Twenty Home moves: 1,032 to 44 rectangle reads. Focus stays visible. Signed Android/phone builds and webOS packaging passed. No physical Samsung performance verification.
