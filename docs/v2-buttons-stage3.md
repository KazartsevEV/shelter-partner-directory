# V2 stage 3 — button hierarchy

Baseline: merged main `3de135c1df5444cb065ca9bdbc73b56ae05a9f9d`.
PR #129 and PR #130 were merged in order with explicit user authorization.
This stage has a separate branch from that main commit.

The existing standalone, linked, basket and observed-history templates receive
named action classes. Only class attributes change in runtime JavaScript.
No labels, actions, navigation, handlers, state, formulas or storage contracts
change. V1, home, header/footer and full-service V1 remain protected.

Orange `#ED8E63` with navy `#16375A` text: save calculation/portfolio and approve
an observed scenario into the forecast. Blue `#31577C` with white text: add SKU,
resource, offer or offer item. Outlines: back/home, new portfolio, remove and
template downloads. Light cards use navy outlines; dark cards use white outlines.
The native file chooser button uses the secondary blue palette.

Actions have 44 px minimum tap area, wrapped labels, modest radius, explicit
hover/active states and a two-color focus ring visible on light and dark surfaces.
Native disabled buttons keep their existing logic with an opaque muted palette.
No additional confirmation dialogs or custom controls are introduced.

Acceptance: 162 scenarios before and after, standalone and linked RU/EN/KK,
320/360/390/430/768/1280 px, including ready/unready, cash/credit, dropship,
observed/mapped/unmapped history and full-service source data. Check actual
action foreground/background, composited contrast >=4.5, text bounds, tap area,
overlap, field geometry, document overflow and one-line financial values.
Financial output and saved state must match the merged baseline in every case.
Source guards protect all business modules; UI copy/logic must match after
removing class attributes. Seven cases run without optional utility CSS.

A separate test checks 36 hover/active/focus cases across the same six widths,
all three languages and both routes. Six before/after interaction traces exercise
save, add/remove, new portfolio, back/resume, template downloads, file upload,
manual-overlap gating, forecast approval and disabled actions. Enter and Space
exercise native keyboard activation. Compare state and financial results after
every action against the baseline. Screenshots and JSON are uploaded to CI.

Submit this stage for review as a draft PR. Stage 4 resource semantics and
stage 5 financial-result hierarchy remain subsequent tasks.
