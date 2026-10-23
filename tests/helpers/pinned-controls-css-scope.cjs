'use strict';
// Exact frozen calculator presentation code; only the appended scoped nav rules may differ.
const A=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
const file='nomad360_calculator_ui.css';
const baseline=cp.execFileSync('git',['show','origin/main:'+file],{encoding:'utf8',maxBuffer:8e6});
const present=require('./cleanup-logo-mask-scope.cjs').restore(file,fs.readFileSync(file,'utf8'));
const marker='\n/* PINNED-CONTROLS-01: desktop header and mobile floating navigation, no financial layout changes. */';
A.equal(present.split(marker).length,2,'exactly one appended nav-only section');
const withoutLogo=require('./task10-logo-scope.cjs').stripTask10Logo(file,present);
A.equal(withoutLogo,require('./task10-logo-scope.cjs').stripTask10Logo(file,baseline),'approved CSS must be byte-identical outside the frozen LOGO-01 tail on both sides');
const scoped=withoutLogo.slice(withoutLogo.indexOf(marker)+marker.length);
A.match(scoped,/#nomad360-header/);
A.doesNotMatch(scoped,/portfolio|cash.flow|sales.tax|localStorage|tax|price.export/i);
console.log('PINNED_CSS_SCOPE_GREEN');
