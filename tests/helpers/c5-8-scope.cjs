'use strict';
// Exact C5-8 normalization ONLY for frozen historical consumers. No runtime use.
const A=require('node:assert/strict'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const file='nomad360_calculator_ui.css',base='050bce789259867096d2d312e5b0dbea51454d5d';
const original=execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:24e6});
const edits=[
 ['background:#fff;border-radius:50%;box-shadow:0 6px 22px rgba(0,0,0,.14)','background:#fff;border-radius:50%'],
 ['.nomad-embed-b2b-logo-mask img{display:block;width:100%;height:100%;object-fit:contain}','.nomad-embed-b2b-logo-mask img{display:block;width:100%;height:100%}'],
 ['grid-template-columns:minmax(0,1fr) 64px;gap:16px;padding:22px','gap:16px;padding:22px']
];
let candidate=original;for(const [old,next]of edits){A.equal(candidate.split(old).length,2);candidate=candidate.replace(old,next);}
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
function restore(name,source){if(name!==file)return source;const s=source.toString();if(s!==candidate)return source;return Buffer.isBuffer(source)?Buffer.from(original):original;}
function normalizeResource(row){if(row.path!==file)return row;if(row.bytes===Buffer.byteLength(candidate)&&row.sha256===sha(candidate))return {...row,bytes:Buffer.byteLength(original),sha256:sha(original)};return row;}
function restoreStandalone(html){if(html.includes(candidate)){A.equal(html.split(candidate).length,2,'Single embedded C5-8 source');return html.replace(candidate,original);}return html;}
module.exports={base,file,original,candidate,edits,restore,normalizeResource,restoreStandalone};
