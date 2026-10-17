# PINNED-CONTROLS-01 — review
Date: 2026-10-17

## Scope
- Desktop >=1200px: `#nomad360-header` stays visible with `position:sticky`.
- Widths <1200px: only `.nomad-burger` remains fixed at the top right; the menu is a viewport-constrained floating panel, maintaining original navigation handlers, Escape/focus and languages.
- Report widget: `#nomad360-bug-dock` anchored bottom-right; on <=600px starts as a 48px megaphone. Drag left opens its label, drag right collapses. A discrete control collapses by click, arrow keys provide non-touch alternatives; icon opens the same native dialog. Short taps must not be stolen by pointer capture.
- No calculator models, form payload, persistence, tax, prices, credits or banner redesign.

## Acceptance matrix
- [x] Task 09 original browser flow: run [39016701914](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/39016701914) GREEN; 18 widths/locales and mocked Formspree.
- [x] New mobile+desktop pinned/sweep flow: run [39016701973](https://github.com/KazartsevEV/shelter-partner-directory/actions/runs/39016701973) GREEN; RU/EN/KK x 320/390/768/1280, scrolling, menu, Escape, swipes, keyboard, accessible megaphone target and no page JS exceptions. Inspect 12 screenshot artifacts from that run.
- [x] CSS-only diff guard against `origin/main` in the new workflow.
- [ ] L0 localization inventory rebuilt for new UI code.
- [ ] Follow-on SEO/marketing/RET/TYPE02/numeric overall CI on latest HEAD.
- [ ] Owner visual approval on mobile screen and desktop header.
- [ ] Production deploy only after explicit merge permission.

## Notes
The first L0-dependent jobs red on initial PR head due `Stale L0 inventory: summary.json`. The strict SEO phase-A changed-file allowlist also needed to include this narrowly tested UI task. Do not describe the initial head as all GREEN. The current `main` still contains the pre-banner calculator after rollback of PR #175.
