'use strict';
const A = require('node:assert/strict');
const {test} = require('node:test');
const {loadInputs, createVerifier} = require('./verify.cjs');
const accepted = loadInputs();
const fresh = () => structuredClone(accepted);
const evidence = type => ({type, confirmed: true});

test('accepted editorial catalog and 86 workflow fixtures pass without activation', () => {
  const receipt = createVerifier(fresh()).run();
  A.equal(receipt.translations, 174);
  A.equal(receipt.scenarios, 86);
  A.equal(receipt.successful, 22);
  A.equal(receipt.blocked, 64);
  A.equal(receipt.productionEnabled, false);
  A.equal(receipt.externalRequests, 0);
});

test('real validator rejects changed text for every canonical key and locale', () => {
  for (const entry of accepted.contract.keys.filter(e => e.origin !== 'reviewAddition')) {
    for (const locale of ['en', 'ru', 'kk']) {
      const input = fresh();
      input.locales[locale].copy[entry.key] = 'UNAPPROVED CANONICAL COPY';
      A.throws(() => createVerifier(input).verifyCatalog(), /Canon unchanged/, locale + '/' + entry.key);
    }
  }
});

test('unknown/missing origin cannot bypass canonical comparison', () => {
  for (const origin of ['misspelledSourceTable', '', null, undefined]) {
    const input = fresh();
    input.contract.keys.find(e => e.key === 'partner.offer').origin = origin;
    input.locales.ru.copy['partner.offer'] = 'UNAPPROVED CANONICAL COPY';
    A.throws(() => createVerifier(input).verifyCatalog(), /Unknown source origin/);
  }
});

test('known origin cannot reclassify a canonical key or promote a review key', () => {
  for (const origin of ['sourceHelp', 'sourceState', 'sourcePolicy', 'reviewAddition']) {
    const input = fresh();
    const entry = input.contract.keys.find(e => e.key === 'partner.offer');
    entry.origin = origin;
    entry.nonBinding = true;
    A.throws(() => createVerifier(input).verifyCatalog(), /canonical identity/);
  }
  const input = fresh();
  input.contract.keys.find(e => e.origin === 'reviewAddition').origin = 'sourceHelp';
  A.throws(() => createVerifier(input).verifyCatalog(), /canonical identity/);
});

test('approved editorial source cannot be redirected', () => {
  const input = fresh();
  input.contract.origin = 'other.md';
  // The pure validator must reject this too, not only the disk loader.
  A.throws(() => createVerifier(input).verifyCatalog(), /Approved editorial source/);
});

test('every transition accepts only matching, explicitly confirmed fixture evidence', () => {
  const {advance} = createVerifier(fresh());
  const types = [...new Set(accepted.states.transitions.map(t => t.evidence))];
  for (const t of accepted.states.transitions) {
    A.deepEqual(advance(t.from, {event:t.event, evidence:evidence(t.evidence)}), {state:t.to, rejected:false});
    const invalid = [true, false, 'false', 'gmailRejected', {}, [], null, undefined,
      {type:t.evidence}, {confirmed:true}, {type:t.evidence, confirmed:false},
      {type:t.evidence, confirmed:'true'}, {type:t.evidence, confirmed:true, fake:true},
      Object.assign(Object.create(evidence(t.evidence)), {fake:1, other:2}),
      ...types.filter(type => type !== t.evidence).map(evidence)];
    for (const proof of invalid) {
      A.deepEqual(advance(t.from, {event:t.event, evidence:proof}), {state:t.from, rejected:true}, t.from + '/' + t.event);
    }
  }
});

test('malformed actions and illegal order preserve the previous state', () => {
  const {advance} = createVerifier(fresh());
  for (const action of [null, undefined, [], true, '', {}]) {
    A.deepEqual(advance('idle', action), {state:'idle', rejected:true});
  }
  A.deepEqual(advance('deliveryUnknown', {event:'deliveryMailAccepted', evidence:evidence('gmailAccepted')}),
    {state:'deliveryUnknown', rejected:true});
});

test('unexpected rejection before a successful reset fails the actual fixture verifier', () => {
  const input = fresh();
  const c = input.fixtures.cases.find(c => c.id === 'ok.applicationRejected.reset');
  c.steps.unshift({event:'NOT_PERMITTED', evidence:evidence('manual'), expectReject:false});
  A.throws(() => createVerifier(input).verifyFixtures(), /Unexpected step permission/);
});

test('every step requires an explicit expected outcome', () => {
  const input = fresh();
  delete input.fixtures.cases[0].steps[0].expectReject;
  A.throws(() => createVerifier(input).verifyFixtures(), /Expected rejection for each step/);
});

test('intended rejection followed by a valid reset keeps the aggregate blocked classification', () => {
  const input = fresh();
  const c = input.fixtures.cases.find(c => c.id === 'ok.applicationRejected.reset');
  c.steps.unshift({event:'NOT_PERMITTED', evidence:evidence('manual'), expectReject:true});
  c.expectReject = true;
  const receipt = createVerifier(input).verifyFixtures();
  A.equal(receipt.successful, 21);
  A.equal(receipt.blocked, 65);
});

test('CSV review index stays aligned with executable fixtures', () => {
  const fs = require('node:fs'), path = require('node:path');
  const rows = fs.readFileSync(path.join(__dirname, 'scenarios.csv'), 'utf8').trim().split('\n');
  const expected = accepted.fixtures.cases.map(c => [c.id, c.group, c.kind,
    c.kind === 'transition' ? (c.expectReject ? 'blocked:' : 'accepted:') + c.expectedState :
      (c.expectedAllowed ? 'allowed' : 'blocked')].join(','));
  A.deepEqual(rows.slice(1), expected);
});
