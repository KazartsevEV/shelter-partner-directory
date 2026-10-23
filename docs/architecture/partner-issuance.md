# Partner issuance v1 — private operator and Google Workspace boundary

This follows merged #241/#242. The owner selected Gmail
`nomad260393@gmail.com` and a private Google Sheet on their Drive. A private
registry and archive folder were created in that account; their IDs are private
deployment settings, not source-code constants. There is no public release of
the partnership download process in this change.

## Implemented process

1. Import the actual Formspree application JSON, preserving its application ID,
   independent consent choices/version/time and language. Review one explicit
   package configuration. The same ID cannot silently change recipient, consent
   or configuration. Store the application in the private Google Sheet.
2. Send a 256-bit, one-time confirmation code to that email. Only a successful
   Gmail acknowledgement advances to `awaiting_email`. The code expires after
   24 hours and is consumed on confirmation; five incorrect attempts block it.
   Confirmation is an explicit operator command, not a GET link consumed by an
   email security scanner. No public confirmation endpoint exists yet.
3. Review the intended deployment origin and record an operator reference.
   This is a manual review, not automatic DNS/website ownership verification or
   a browser domain restriction. An unverified email cannot be approved.
4. Build through the accepted complete calculator packer. Preserve its exact
   Git revision, configuration digest, resource digests and HTML digest. Produce
   a genuine WinZip AES-256 ZIP containing the HTML and original manifest.
5. Store the encrypted ZIP in an owner-only Google Drive folder. Mail the ZIP
   attachment and its random 192-bit password after the private state confirms
   that the archive exists. The mail is localized EN/RU/KK. A prepared package
   is delivered once; a changed/partial archive cannot pass the integrity check.
6. Record Gmail's message ID and `delivery_accepted`. This means Gmail accepted
   the send; it is not a claim of recipient inbox delivery. A delivery timeout or
   missing acknowledgement becomes `send_unknown`, never “code delivered”.

The approved complete build profile is preserved; neither configuration nor
issuance changes financial formulas, currencies, drafts or feature availability.

## Modules

| Module | Responsibility |
| --- | --- |
| `archive.cjs` | Validate bundle/config provenance; encrypt both ZIP entries |
| `vault.cjs` | Bind secrets to an application/purpose using AES-256-GCM |
| `file-store.cjs` | Private, atomic single-host transaction and archive adapter |
| `service.cjs` | Explicit state transitions, confirmation, review and delivery |
| `messages.cjs` | Canonical EN mail and RU/KK equivalents |
| `registry.cjs` | Allowlisted Google Sheet projections and literal cell values |
| `google-workspace.cjs` | Gmail/Drive owner checks and bounded Google API calls |
| `operator.cjs` | Explicit private command execution; no public web handler |

The ports separate durable state, archive storage, mail delivery and package
building. The operator currently uses a private local state directory as well
as the owner's Google registry. Its minimal delivery records contain the email,
configuration, consent receipt and encrypted secrets. Original application
details stay in Formspree/Google Sheets. A local test directory is not a deployed
website backend. No Google/GitHub public artifact contains applicant data.

This adapter supports **one operator host**, with exclusive per-application
transactions. Lock files are not automatically stolen after a crash. Inspect a
stale lock and provider evidence before removing it. Multiple independent worker
hosts require an explicitly implemented transactional repository; Google Sheet
read-then-write is not a distributed lock. Preserve the service port/transition
contract when implementing that repository.

## Private setup

Install pinned dependencies:

```sh
npm ci --prefix scripts/partners/issuance --ignore-scripts
```

Keep the settings, token, vault key, application JSON and state directory outside
the checkout, with directory mode `0700` and private file mode `0600`. The vault
key is exactly 32 random bytes; back it up privately. Losing the key prevents
secret recovery. Do not commit a sample containing actual deployment IDs.

Settings fields (use actual private paths/IDs, not the placeholders):

```json
{
  "stateDirectory": "/private/nomad360/state",
  "vaultKeyFile": "/private/nomad360/vault.secret",
  "googleAccessTokenFile": "/private/nomad360/google-oauth.secret",
  "spreadsheetId": "PRIVATE_NATIVE_SHEET_ID",
  "archiveFolderId": "PRIVATE_OWNER_ONLY_FOLDER_ID"
}
```

The token file must contain an OAuth access token for the selected owner with
Gmail send/read, Drive file/private-folder and Sheets access. The adapter checks
both Gmail and Drive identities before writes, keeps TLS verification enabled,
rejects redirects, and does not log credentials or provider error bodies. The
token is supplied externally; this change does **not** acquire refresh tokens,
start interactive OAuth, deploy a server or schedule a worker. Expired tokens
fail closed. Chat connector authorization cannot be extracted or reused as an
unattended worker credential.

Example invocation (the input file holds private JSON, never codes in argv):

```sh
NOMAD_PARTNER_SETTINGS=/private/nomad360/settings.json \
  node scripts/partners/issuance/operator.cjs register /private/nomad360/input.json
```

Commands and input shapes:

| Command | Private input |
| --- | --- |
| `register` | `application`: original JSON payload from P2; `config`: reviewed v1 package config; optional `formspreeId` |
| `send-verification` | `applicationId` |
| `confirm-email` | `applicationId`, `code` |
| `approve-domain` | `applicationId`, `review`: `{origin, reviewReference}` |
| `prepare` | `applicationId` |
| `send-archive` | `applicationId` |
| `reconcile-mail` | `applicationId`, provider `evidence`: `{operationId, messageId, outcome}` |
| `status` | `applicationId`; safely re-project current private state to Sheets |

The checkout must be committed and clean before package assembly. A registration
is not sendable until its application row is saved on Google Sheets. The sheet
schema uses three native tables: `Заявки`, `Выдачи`, `Журнал`; headers must match
the versioned projection contract. The private operator grows table ranges as
rows are added. The initial bounded capacity is 999 data rows; extend it
explicitly before exceeding that limit. The schema deliberately stores no
confirmation code, ZIP password, vault key or OAuth token. Values starting `=`
are written as strings, never spreadsheet formulas.

## Retry and crash recovery

The service persists `verification_sending`/`archive_sending` before contacting
Gmail. Concurrent or repeated sends are rejected. Gmail send does not provide
transactional idempotency, so there are **no automatic send retries**. Every mail
has a stable Message-ID derived from its operation ID. Use `findSent` and actual
provider evidence to reconcile an uncertain operation, then explicitly unlock
only a confirmed non-accepted send. Never infer failure from an HTTP timeout.

An interrupted build or ambiguous Drive upload also stays blocked. Do not delete
the record or fabricate a successful status to bypass recovery. Inspect the
private archive and provider result, retain its trusted digest, and perform a
reviewed recovery rather than rebuilding a second independent issuance.

## ZIP compatibility and limits

The archive uses WinZip AES-256, not legacy ZipCrypto. Passwords are generated
with cryptographic randomness. ZIP entry names remain visible; the contents of
both HTML and manifest are encrypted. Use an archive tool explicitly supporting
WinZip AES, such as 7-Zip. Native Windows Explorer compatibility is not claimed.
CI independently reads the archive with pyzipper, rejects a wrong password on
both entries, checks AES strength and proves exact HTML/manifest bytes.

The adapter limits a mailed ZIP to 15 MiB before MIME encoding. It does not claim
that every future calculator package fits Gmail's message limit. The current
tested bundle fits. Sending the attachment and password in the same mailbox is
delivery convenience, not protection against access to that mailbox.

## Release boundary still open

The technical owner-mailbox test used the connected tools to upload a real
encrypted calculator to private Drive and send its private link/password to the
owner. Inbox presence was read back. It is **not** proof that this Node worker
has production OAuth or that Formspree automatically feeds the new registry.

Before closing P3: configure permanent private runtime authorization and
trusted Formspree ingestion, exercise a real external recipient's confirmation
and permitted domain review, then perform/reconcile that exact worker's Google
API send. These require configured services; no credentials are available in the
execution environment yet. Public confirmation UI, download gating, Help and
the final privacy policy follow the release in P4. The current website must not
promise automatic code delivery until this boundary is closed.
