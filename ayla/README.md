# AYLA — independent Nomad360 AI Marketer module

**Scope:** This directory is the canonical module entry point for Ayla, the developing AI marketer and fictional public persona inside the **single Nomad360 Business Solutions project**.

**Relationship to Calculator:** Ayla is a **sibling subsystem**, not a calculator plugin, page widget, V1/V2 feature or dependency. Currently she does marketing for Nomad360's working Calculator product, but her own persona, life, memory, research, content pipeline, connectors and runtime do not live in and must not depend on the calculator.

## Repository boundaries

    repository root/
    ├── Marketing_calc.HTML, portfolio_v2_*.js, nomad360_*.js, ...  # Existing Calculator app — untouched
    ├── docs/                                                  # Shared / legacy documentation
    │   ├── nomad360-codex-task-map.md                          # Calculator-specific task map
    │   └── ayla/                                               # Earlier approved/draft contracts, referenced
    └── ayla/                                                   # Independent Ayla module
        ├── README.md                                           # Canonical module entry point
        ├── docs/
        │   └── AYLA-LIFE-03-human-creator-triangulation.md      # Creator-observation, life synthesis, tests
        ├── contracts/
        │   └── life-synthesis.schema.json                        # Machine-readable draft contract
        └── assets/
            └── (canonical portrait awaiting binary Git upload)

**The ayla/ directory is canonical for Ayla's own technical development.** The older docs in docs/ayla/ remain normative until deliberately migrated in a separate documentation change. Reference links below preserve a single source of truth rather than copying and diverging duplicate specs.

## Approved Persona & visual reference

- [AYLA-CORE-01 — Persona & Life Engine, approved](../docs/ayla/AYLA-CORE-01-persona-life-engine.md)
- [AYLA-VISUAL-01 — approved exact face and original checksum](../docs/ayla/AYLA-VISUAL-01-approved-reference.md). The owner approved the exact image, but binary Git upload is **not yet proven**; this document does not claim the JPEG is present.
- [AYLA-PERSONA-02 — Audience Values & Aspirational Life, draft](../docs/ayla/AYLA-PERSONA-02-audience-aspirational-life.md)

## Her Job — marketing specifications awaiting review

- [AYLA-JOB-01 — Marketing Operations](../docs/ayla/AYLA-JOB-01-marketing-operations.md)
- [AYLA-JOB-02 — Formal Functional Specification](../docs/ayla/AYLA-JOB-02-functional-specification.md)
- [AYLA-JOB-03 — Content Production & Feedback Loop](../docs/ayla/AYLA-JOB-03-content-production-feedback-loop.md)

## Life Engine — creator observation and composition

- **[AYLA-LIFE-03 — Human Creator Pattern Learning & Triangulated Life Synthesis](docs/AYLA-LIFE-03-human-creator-triangulation.md)** — design draft: study real human bloggers within the same geographical and lifestyle context, extract abstractions, combine independent patterns and produce original Ayla life episodes anchored in canonical memory.
- [life-synthesis.schema.json](contracts/life-synthesis.schema.json) — machine-readable draft data contract.

## Architectural rules

1. No importing calculator UI/finance modules into Ayla runtime; no Ayla execution inside calculator JS by default.
2. Separate Ayla DB, memory/canon, media library, social credentials, queue, model inference and permission boundaries.
3. Her Job may read **public versioned Nomad360 product facts** via a read-only adapter when needed. It must not read visitors' financial inputs, saved portfolios or calculations.
4. Ayla's life and publishing history persist independently of calculator availability.
5. One project/owner, but **separate deployability, tests, release process and fault isolation**.
6. Third-party post texts, photos, intimate details and distinctive stories are not transplanted into Ayla's life. Study abstract patterns rather than impersonating an individual creator.
7. A design document is not evidence of an implemented connector, autonomous LLM runtime or published social media activity.

**Status:** architecture and design only, **not an implemented application**. The approved portrait binary remains pending a separately verified Git upload.
