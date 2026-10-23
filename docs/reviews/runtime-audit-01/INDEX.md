# Runtime audit: generated index

Frozen application revision: `c4536e9edd60003efb0a9087ec60915d4c070bdd`. This index contains observations, not permission to remove code.

## Source census

| Metric | Count |
| --- | --- |
| files | 73 |
| bytes | 3805851 |
| functions | 2368 |
| globalDeclarationAndAssignmentSites | 509 |
| callSites | 13813 |
| eventSites | 450 |
| dynamicEventSites | 6 |
| asyncSources | 48 |
| styleWriteSites | 46 |
| selectorSites | 1416 |
| dynamicSelectorSites | 171 |
| domConstructionSites | 939 |
| cssRules | 2972 |
| importantDeclarations | 5290 |
| exactDuplicateCssGroups | 11 |
| cascadeOverrideGroups | 224 |

## Largest application files

| File | Bytes | Gzip bytes | Brotli bytes | Lines |
| --- | --- | --- | --- | --- |
| US_Retail_Demo.HTML | 516208 | 100827 | 73988 | 7662 |
| Marketing_calc.HTML | 516150 | 100792 | 74033 | 7666 |
| nomad360_locale_core.js | 483009 | 143112 | 108154 | 2447 |
| nomad360_palette.css | 282757 | 18076 | 13509 | 744 |
| nomad360_calculator_ui.css | 282155 | 190277 | 187496 | 688 |
| ru/help/index.html | 222554 | 50817 | 40886 | 975 |
| kk/help/index.html | 214018 | 45702 | 37344 | 975 |
| en/help/index.html | 132322 | 39365 | 32675 | 975 |
| nomad360_v1_engine.js | 114003 | 22323 | 18745 | 2054 |
| nomad360_design_system.css | 90336 | 17705 | 14871 | 2438 |
| nomad360_header.js | 76549 | 23238 | 19333 | 1165 |
| portfolio_v2_us_demo_ui.js | 63099 | 19162 | 15751 | 554 |
| portfolio_v2_linked_ui.js | 56935 | 17134 | 14628 | 685 |
| portfolio_v2_linked_engine.js | 52074 | 14842 | 13009 | 783 |
| portfolio_v2_ui.js | 42121 | 14051 | 11912 | 474 |
| nomad360_hero_banner.css | 39191 | 7893 | 6611 | 899 |
| nomad360_calculator_ui.js | 34201 | 11496 | 9721 | 520 |
| nomad360_about_banner.css | 30394 | 7067 | 5876 | 728 |

These sizes are individual source-file measurements, not a claim that all files load together. Generated standalone and vendor fingerprints are separate in summary.json.

## Browser baseline

18 load cases; 358 case rows; 430 heap/listener samples. 1412 selectors observed; 2677 not observed; 64 not supported by the DOM query probe.

| Metric | Min | Median | Max |
| --- | --- | --- | --- |
| labReadyWallMs | 3389.154319000023 | 3880.176841999986 | 4484.2420700000075 |
| domContentLoadedMs | 1096.7000000029802 | 1229.3000000044703 | 1480 |
| initialResourceBytes | 6203808 | 8484485 | 8486746 |
| heapUsedBytes | 839432 | 9540590 | 16936404 |
| jsEventListeners | 3 | 306 | 344 |
| domNodes | 1834 | 3956 | 4638 |

Measurements use local HTTP, blocked external resources, the pinned local utility CSS, DevTools profiling and GC before heap samples. This is a lab comparison protocol, not production Core Web Vitals or a timing SLA.

## Duplicate CSS candidates

| File | Selectors | Occurrences | Cascade context |
| --- | --- | --- | --- |
| nomad360_about_banner.css | #nomad360-information #nomad360-about | 141@6933; 616@25988 | @media (max-width:700px) |
| nomad360_about_banner.css | #nomad360-information.nomad-information::before | 531@22412; 578@24286 | @media (min-width:1001px) |
| nomad360_calculator_ui.css | .nomad-seo-logo-mask | 565@274241; 684@281979 | @media (max-width:600px) |
| nomad360_design_system.css | body #full-service-screen .nd-full-service-inputs | 1483@53897; 1681@60761 | unlayered |
| nomad360_palette.css | body:has(#home-screen) .nomad-seo-tagline span+span | 52@27394; 52@31768 | @layer nomad360-palette |
| nomad360_palette.css | body:has(#home-screen) | 58@37896; 60@46367 | @layer nomad360-palette |
| nomad360_palette.css | body:has(#home-screen) #nomad360-hero h1 | 60@47863; 60@58242 | @layer nomad360-palette |
| nomad360_palette.css | body:has(#home-screen) #nomad360-calculation-list li | 60@48374; 60@52538 | @layer nomad360-palette |
| nomad360_palette.css | body:has(#home-screen) #nomad360-home-secondary .nomad-example-link | 60@51299; 60@56285 | @layer nomad360-palette |
| nomad360_palette.css | body:has(#home-screen) #full-service-screen .nd-full-service-label | 86@73136; 86@76438 | @layer nomad360-palette |
| nomad360_palette.css | body:has(#home-screen) #full-service-screen .nd-full-service-secondary | 86@74145; 86@79015 | @layer nomad360-palette |

Identical rules may restore values after intervening overrides. Source generator, all scenarios and computed styles must be checked before deletion. Offsets disambiguate repeated minified rules on the same line.

## Repeated navigation

| Language | Width | JSEventListeners after each of five round trips |
| --- | --- | --- |
| en | 320 | 304 → 304 → 304 → 304 → 304 |
| ru | 320 | 304 → 304 → 304 → 304 → 304 |
| kk | 320 | 304 → 304 → 304 → 304 → 304 |
| en | 360 | 304 → 304 → 304 → 304 → 304 |
| ru | 360 | 304 → 304 → 304 → 304 → 304 |
| kk | 360 | 304 → 304 → 304 → 304 → 304 |
| en | 390 | 304 → 304 → 304 → 304 → 304 |
| ru | 390 | 304 → 304 → 304 → 304 → 304 |
| kk | 390 | 304 → 304 → 304 → 304 → 304 |
| en | 430 | 304 → 304 → 304 → 304 → 304 |
| ru | 430 | 304 → 304 → 304 → 304 → 304 |
| kk | 430 | 304 → 304 → 304 → 304 → 304 |
| en | 768 | 304 → 304 → 304 → 304 → 304 |
| ru | 768 | 304 → 304 → 304 → 304 → 304 |
| kk | 768 | 304 → 304 → 304 → 304 → 304 |
| en | 1280 | 304 → 304 → 304 → 304 → 304 |
| ru | 1280 | 304 → 304 → 304 → 304 → 304 |
| kk | 1280 | 304 → 304 → 304 → 304 → 304 |

## Machine-readable maps

- [Summary and fingerprints](summary.json).

- [Full AST/HTML/CSS inventory](runtime-inventory.json.gz): files, resources/dependency edges, function/call/global sites, handlers, observers/timers, inline style writes, selectors, generated DOM, cascade layers, overrides and exact duplicates.

- [Full browser baseline](runtime-browser.json.gz): case metrics, runtime listener descriptors, load resources, numeric leaves, restore checks, fresh standalone manifest, observed selectors and coverage.

No code is approved for removal by this report. Dynamic or unobserved cases remain review-required.
