# R1 · 67 review scenarios

All transitions are synthetic and have no side effects. For an accepted transition, the fixture supplies synthetic `evidence:true`; that is **not** real provider evidence. Missing-evidence cases assert fail-closed behavior. Scenario IDs also appear in `scenarios.json`.

| Scenario | Group | Expected |
| --- | --- | --- |
| `ok.idle.applicationProviderAccepted` | acceptedTransitions | Accepted → applicationAccepted |
| `reject.missingEvidence.idle.applicationProviderAccepted` | missingEvidence | Blocked → idle |
| `ok.idle.applicationProviderRejected` | acceptedTransitions | Accepted → applicationRejected |
| `reject.missingEvidence.idle.applicationProviderRejected` | missingEvidence | Blocked → idle |
| `ok.applicationRejected.reset` | acceptedTransitions | Accepted → idle |
| `reject.missingEvidence.applicationRejected.reset` | missingEvidence | Blocked → applicationRejected |
| `ok.applicationAccepted.verificationMailAccepted` | acceptedTransitions | Accepted → verificationAccepted |
| `reject.missingEvidence.applicationAccepted.verificationMailAccepted` | missingEvidence | Blocked → applicationAccepted |
| `ok.applicationAccepted.verificationMailUnknown` | acceptedTransitions | Accepted → verificationUnknown |
| `reject.missingEvidence.applicationAccepted.verificationMailUnknown` | missingEvidence | Blocked → applicationAccepted |
| `ok.verificationUnknown.operatorConfirmsSent` | acceptedTransitions | Accepted → verificationAccepted |
| `reject.missingEvidence.verificationUnknown.operatorConfirmsSent` | missingEvidence | Blocked → verificationUnknown |
| `ok.verificationUnknown.operatorConfirmsNotSent` | acceptedTransitions | Accepted → applicationAccepted |
| `reject.missingEvidence.verificationUnknown.operatorConfirmsNotSent` | missingEvidence | Blocked → verificationUnknown |
| `ok.verificationAccepted.emailCodeValid` | acceptedTransitions | Accepted → emailVerified |
| `reject.missingEvidence.verificationAccepted.emailCodeValid` | missingEvidence | Blocked → verificationAccepted |
| `ok.verificationAccepted.emailCodeExpired` | acceptedTransitions | Accepted → expiredConfirmation |
| `reject.missingEvidence.verificationAccepted.emailCodeExpired` | missingEvidence | Blocked → verificationAccepted |
| `ok.expiredConfirmation.operatorStartsFreshConfirmation` | acceptedTransitions | Accepted → applicationAccepted |
| `reject.missingEvidence.expiredConfirmation.operatorStartsFreshConfirmation` | missingEvidence | Blocked → expiredConfirmation |
| `ok.emailVerified.archiveBuildSucceeded` | acceptedTransitions | Accepted → archiveReady |
| `reject.missingEvidence.emailVerified.archiveBuildSucceeded` | missingEvidence | Blocked → emailVerified |
| `ok.emailVerified.archiveBuildFailed` | acceptedTransitions | Accepted → archiveFailed |
| `reject.missingEvidence.emailVerified.archiveBuildFailed` | missingEvidence | Blocked → emailVerified |
| `ok.archiveFailed.operatorAuthorizesRebuild` | acceptedTransitions | Accepted → emailVerified |
| `reject.missingEvidence.archiveFailed.operatorAuthorizesRebuild` | missingEvidence | Blocked → archiveFailed |
| `ok.archiveReady.deliveryMailAccepted` | acceptedTransitions | Accepted → deliveryAccepted |
| `reject.missingEvidence.archiveReady.deliveryMailAccepted` | missingEvidence | Blocked → archiveReady |
| `ok.archiveReady.deliveryMailUnknown` | acceptedTransitions | Accepted → deliveryUnknown |
| `reject.missingEvidence.archiveReady.deliveryMailUnknown` | missingEvidence | Blocked → archiveReady |
| `ok.archiveReady.deliveryMailRejected` | acceptedTransitions | Accepted → deliveryRejected |
| `reject.missingEvidence.archiveReady.deliveryMailRejected` | missingEvidence | Blocked → archiveReady |
| `ok.deliveryUnknown.operatorConfirmsAccepted` | acceptedTransitions | Accepted → deliveryAccepted |
| `reject.missingEvidence.deliveryUnknown.operatorConfirmsAccepted` | missingEvidence | Blocked → deliveryUnknown |
| `ok.deliveryUnknown.operatorConfirmsRejected` | acceptedTransitions | Accepted → deliveryRejected |
| `reject.missingEvidence.deliveryUnknown.operatorConfirmsRejected` | missingEvidence | Blocked → deliveryUnknown |
| `ok.deliveryRejected.operatorAuthorizesRetry` | acceptedTransitions | Accepted → archiveReady |
| `reject.missingEvidence.deliveryRejected.operatorAuthorizesRetry` | missingEvidence | Blocked → deliveryRejected |
| `reject.illegal.idle.deliveryMailAccepted` | illegalOrder | Blocked → idle |
| `reject.illegal.applicationAccepted.deliveryMailAccepted` | illegalOrder | Blocked → applicationAccepted |
| `reject.illegal.applicationRejected.deliveryMailAccepted` | illegalOrder | Blocked → applicationRejected |
| `reject.illegal.verificationAccepted.deliveryMailAccepted` | illegalOrder | Blocked → verificationAccepted |
| `reject.illegal.verificationUnknown.deliveryMailAccepted` | illegalOrder | Blocked → verificationUnknown |
| `reject.illegal.emailVerified.deliveryMailAccepted` | illegalOrder | Blocked → emailVerified |
| `reject.illegal.expiredConfirmation.deliveryMailAccepted` | illegalOrder | Blocked → expiredConfirmation |
| `reject.illegal.archiveReady.archiveBuildSucceeded` | illegalOrder | Blocked → archiveReady |
| `reject.illegal.archiveFailed.deliveryMailAccepted` | illegalOrder | Blocked → archiveFailed |
| `reject.illegal.deliveryAccepted.deliveryMailAccepted` | illegalOrder | Blocked → deliveryAccepted |
| `reject.illegal.deliveryUnknown.deliveryMailAccepted` | illegalOrder | Blocked → deliveryUnknown |
| `reject.illegal.deliveryRejected.deliveryMailAccepted` | illegalOrder | Blocked → deliveryRejected |
| `form.validNoSite` | applicationValidation | Allowed |
| `form.validNoDirectoryConsent` | applicationValidation | Allowed |
| `form.withDirectory` | applicationValidation | Allowed |
| `form.noConsent` | applicationValidation | Blocked |
| `form.invalidMail` | applicationValidation | Blocked |
| `form.blankEmail` | applicationValidation | Blocked |
| `form.whitespaceMail` | applicationValidation | Blocked |
| `form.noEntry` | applicationValidation | Blocked |
| `form.noFields` | applicationValidation | Blocked |
| `transport.screenshotDisabled` | productionGates | Blocked |
| `transport.screenshotCannotForce` | productionGates | Blocked |
| `transport.whiteLabelDisabled` | productionGates | Blocked |
| `transport.whiteLabelCannotForce` | productionGates | Blocked |
| `transport.intakeDisabled` | productionGates | Blocked |
| `transport.intakeCannotForce` | productionGates | Blocked |
| `transport.noAutomaticResend` | productionGates | Blocked |
| `transport.legacyDownloadNoChange` | productionGates | Blocked |
