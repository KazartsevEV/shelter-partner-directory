'use strict';
const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const page=fs.readFileSync(path.join(root,'Marketing_calc.HTML'),'utf8');
const css=fs.readFileSync(path.join(root,'nomad360_design_system.css'),'utf8');
const i18n=fs.readFileSync(path.join(root,'nomad360_locale_core.js'),'utf8');

test('agent chooser and output distinguish agent from principal',()=>{
  A.match(page,/<section id="agent-screen"[^>]*nd-agent-screen/);
  for(const label of ['Я — агент','Как зарабатываю я?','Экономика агента',
    'Как зарабатывает принципал','Если его модель бизнеса эффективна, он сможет оплачивать ваши услуги.']){
    A.ok(page.includes(label),'missing agent role label: '+label);
  }
  A.match(page,/id="agent-owner-summary"[^>]*hidden/);
  A.match(page,/id="agent-principal-context"[^>]*hidden/);
  A.match(page,/node.hidden=!agentView/);
  A.match(css,/#calculator-screen\\.nd-v1-service \\.nd-agent-principal/);
  A.match(css,/#agent-screen\\.nd-agent-screen/);
});

test('agent V2 action is role-specific; approved adapter still imports commission only',()=>{
  A.match(page,/agentView\\?'Добавить модель агента в портфель V2'/);
  A.match(page,/agentView\\?'Перенести экономику агента в V2/);
  A.match(page,/LinkedPortfolioOnlineAdapter\\.build\\(\\{\\.\\.\\.onlineV1PortfolioSnapshot/);
  const adapter=fs.readFileSync(path.join(root,'portfolio_v2_online_adapter.js'),'utf8');
  A.match(adapter,/incomePerDeal=mode==='agent'\\?partnerGrossPerDeal\\*commissionRate/);
  for(const str of ['Я — агент','Экономика агента','Как зарабатывает принципал','Добавить модель агента в портфель V2']){
    A.ok(i18n.includes(str),'missing translated role string: '+str);
  }
});
