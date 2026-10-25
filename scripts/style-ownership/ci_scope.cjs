'use strict';
/* Choose the relevant browser oracle. Old C4/C5 paired snapshots describe owned
   stylesheet cleanup, not arbitrary additions to the application after C6. All
   source/numeric/export checks remain unconditional in the calling workflow. */
const fs=require('node:fs'),cp=require('node:child_process');
const self='scripts/style-ownership/ci_scope.cjs';
const ownedStyles=Object.freeze(['nomad360_calculator_ui.css','nomad360_bug_report.css',
 'nomad360_payments.css','nomad360_design_system.css','nomad360_palette.css',
 'assets/nomad360-seo.css','assets/nomad360-legal.css','assets/nomad360-help.css']);
function needsHistory(changed,existingStyles=ownedStyles){
 const styles=new Set(existingStyles);
 return changed.some(name=>styles.has(name)||
  (name!==self&&['scripts/style-ownership/','scripts/palette/','scripts/cleanup-palette/'].some(prefix=>name.startsWith(prefix))));
}
function inspect(event=process.env.GITHUB_EVENT_NAME,git=(...args)=>cp.execFileSync('git',args,{encoding:'utf8'})){
 if(event!=='pull_request')return {historical:true,reason:'explicit-or-unknown-run'};
 const parents=git('rev-list','--parents','-n','1','HEAD').trim().split(/\s+/);
 if(parents.length!==3)throw Error('Stylesheet selection requires a PR test-merge commit');
 const changed=git('diff','--no-renames','--name-only','HEAD^1','HEAD','--').trim().split('\n').filter(Boolean);
 const historical=needsHistory(changed);
 return {historical,reason:historical?'owned-styles-or-cleanup-tools-changed':'existing-styles-unchanged',changed:changed.length};
}
if(require.main===module){
 const result=inspect();
 if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,'STYLE_HISTORY_SCOPE='+result.historical+'\n');
 console.log('STYLE_BROWSER_SCOPE',JSON.stringify(result));
}
module.exports={ownedStyles,needsHistory,inspect};
