// Run after Playwright Chromium is installed: node tests/marketing_calc_prefilled_demo.test.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const htmlUrl = pathToFileURL(path.join(__dirname, '..', 'Marketing_calc.HTML')).href;
const tol = (a, b, label, epsilon=0.012) =>
    assert.ok(Number.isFinite(a) && Math.abs(a-b) <= epsilon,
        label + ': browser=' + a + ', hand=' + b);
const production = ((1000+470)/100+2)/.95;
const delivery = (200+production)*.08*1.05;
const dayStorage = .5*100*125/2;
const baseCapital = 21200+production*100+1000+dayStorage+delivery*100+
    (1020+1000)*125/30;
const reserve = baseCapital*.10;
const principal = baseCapital+reserve;
const unitCost = 212+production+10+dayStorage/100+delivery;
const priceCash = (unitCost+900/24+reserve/100)/.70;
const taxPriceFactor = .89/.83;
const rates = { commission: .11, turnoverTax: .06 };

async function demo(browser, financing) {
    const page = await browser.newPage({locale:'ru-RU',viewport: {width: 390,height:844}});
    const faults = [];
    page.on('pageerror', e=>faults.push(e.message));
    // External CSS/font assets are deliberately blocked for this offline file test;
    // only genuine JS errors and non-network console errors are defects.
    page.on('console', m=>{if(m.type()==='error' && !/Failed to load resource: net::ERR_FAILED/.test(m.text()))faults.push(m.text())});
    await page.route(/^https?:\/\//, route=>route.abort());
    await page.goto(htmlUrl+'?demo=shopper&finance='+financing,
        {waitUntil:'domcontentloaded'});
    await page.locator('#product-demo-banner').waitFor({state:'visible',timeout:10000});
    const title = await page.locator('#product-demo-banner').textContent();
    assert.match(title,/ДЕМО: калькулятор заполнен/);
    const data = await page.evaluate(()=>{
        const product = productPortfolio[0];
        const model = calculateProductPortfolio();
        const cf = calculateProductCashFlow(model);
        const cycle=aggregatePlanMetrics(product);
        const pl=calculatePriceListRange(product);
        const wage = id => document.getElementById(id)?.textContent;
        return {
            productName:product.name,
            materialCount:product.materialsBatchQty,
            productionCount:product.productionQty,
            stockCount:product.logisticsQty,
            saleCount:product.salesQty,
            workerMode:productionLaborMode,
            wageGross:wage('own-production-workers-gross-total'),
            wageCharges:wage('own-production-workers-taxes-total'),
            wageTotal:wage('own-production-workers-total'),
            country:document.getElementById('own-production-workers-country').value,
            unitCost:model.items[0].unitCost,
            funding:product.planning.fundingMode,
            targetMargin:product.planning.targetMarginPct,
            discount:product.planning.maxDiscountPct,
            minMargin:product.planning.minimumMarginPct,
            rate:document.getElementById('own-business-tax-pct').value,
            taxType:productBusinessTaxType,
            vat:document.getElementById('own-sales-vat-pct').value,
            capital:cycle.requiredCapital,
            baseCapital:cycle.nonRevenueCosts,
            reserve:cycle.reserveAmount,
            sellThrough:cycle.sellThroughDays,
            period:cf.horizonDays,
            saleEnd:cf.saleEndDays,
            months:cf.months,
            cash:cf,
            price:model.items[0].price,
            list:pl,
            credit:calculateAggregateCredit(product),
            summaryText:document.getElementById('product-portfolio-business-summary').textContent
        };
    });
    assert.match(data.productName,/шоппер/i);
    assert.equal(data.materialCount,106);
    assert.equal(data.productionCount,100);
    assert.equal(data.stockCount,100);
    assert.equal(data.saleCount,100);
    assert.equal(data.country,'KZ');
    assert.equal(data.workerMode,'workers');
    assert.match(data.wageGross,/400,00/);
    assert.match(data.wageCharges,/70,00/);
    assert.match(data.wageTotal,/470,00/);
    assert.equal(data.funding,financing);
    assert.equal(data.taxType,'turnover');
    assert.equal(Number(data.rate),6);
    assert.equal(Number(data.vat),12);
    assert.equal(Number(data.discount),20);
    assert.equal(Number(data.minMargin),10);
    assert.equal(Number(data.targetMargin),30);
    tol(data.baseCapital,baseCapital,'Cycle capital without reserve');
    tol(data.reserve,reserve,'Locked reserve');
    tol(data.capital,principal,'Full capital');
    tol(data.unitCost,unitCost,'Per-product unit cost');
    tol(data.sellThrough,125,'Last sale relative to launch');
    tol(data.saleEnd,142,'Last sale from day zero');
    tol(data.period,financing==='credit'?180:142,'Cash flow horizon');
    assert.equal(data.months.length,financing==='credit'?6:5);
    assert.match(data.summaryText,new RegExp('Cash flow по месяцам — '+data.months.length+' месяцев'));
    assert.match(data.summaryText,/Период: со дня 0 до дня/);
    assert.match(data.summaryText,/ЖИВЫЕ ДЕНЬГИ/);
    assert.equal(data.list.ready,true);
    const expectedInterest=financing==='credit'?principal*.01*6:0;
    const basePrice=(unitCost+900/24+reserve/100+expectedInterest/100)/.7;
    tol(data.price,basePrice,'Sale price with financing');
    const load=unitCost+900/24+1120/24+reserve/100+expectedInterest/100;
    const floor=Math.ceil(load/(1-.11-.06-.1)*1.12/.8*100)/100;
    const ceiling=Math.ceil(load/(1-.11-.06-.3)*1.12/.8*100)/100;
    tol(data.list.minPrice,floor,'List floor',1e-7);
    tol(data.list.maxPrice,ceiling,'List target',1e-7);
    // Recover the entire cash-flow series independently from daily events.
    let accumulated=0;
    data.months.forEach((m,i)=>{
        const dayA=Math.max(17,i*30),dayB=Math.min(142,(i+1)*30);
        const sold=Math.max(0,dayB-dayA)*.8;
        const revenue=sold*basePrice*taxPriceFactor;
        const saleActive=Math.max(0,dayB-dayA);
        const funding=i===0?principal:0;
        const expectedInflow=revenue+funding;
        let expectedOutflow=revenue*(rates.commission+rates.turnoverTax)+
            sold*delivery+(1020+1000)/30*saleActive;
        if(saleActive){
            const t0=dayA-17,t1=dayB-17;
            expectedOutflow+=.5*(100*(t1-t0)-.8*(t1*t1-t0*t0)/2);
        }
        if(i===0)expectedOutflow+=21200+production*100+1000;
        if(financing==='credit'){
            expectedOutflow+=principal*.01;
            if(i===5)expectedOutflow+=principal;
        }
        accumulated+=expectedInflow-expectedOutflow;
        tol(m.inflow,expectedInflow,'Month '+(i+1)+' revenue+funding');
        tol(m.outflow,expectedOutflow,'Month '+(i+1)+' all outgoing payments');
        tol(m.cumulative,accumulated,'Month '+(i+1)+' accumulated');
        tol(m.freeCumulative,accumulated-reserve,'Month '+(i+1)+' truly free cash');
    });
    tol(data.cash.freeCumulativeEnd,accumulated-reserve,'Final spendable cash');
    if(financing==='credit'){
       tol(data.months[5].principalRepaid,principal,'Bullet principal repaid month 6');
       tol(data.credit.totalInterest,principal*.01*6,'Six interest payments');
    }
    // On a phone viewport, demo controls and previously entered fields remain accessible.
    await page.getByRole('button',{name:/Все заполненные поля/}).click();
    assert.equal(await page.locator('#own-materials-cost').inputValue(),'200');
    assert.equal(await page.locator('#own-production-worker-gross').inputValue(),'200');
    await page.getByRole('button',{name:/Cash flow по месяцам/}).click();
    assert.equal(await page.locator('#product-portfolio-business-summary').isVisible(),true);
    assert.deepEqual(faults,[],'JS errors in demo loading');
    console.log('PREFILLED_DEMO_GREEN',JSON.stringify({
        financing,periodDays:data.period,months:data.months.length,
        initialMaterials:106,workers:2,wages:470,
        capital:principal,reserve,price:basePrice,priceFloor:floor,
        priceTarget:ceiling,freeCash:data.cash.freeCumulativeEnd
    }));
    await page.close();
}
(async()=>{
    const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    try{
        await demo(browser,'cash');
        await demo(browser,'credit');
        const normal=await browser.newPage({locale:'ru-RU'});
        await normal.goto(htmlUrl,{waitUntil:'domcontentloaded'});
        assert.equal(await normal.locator('#product-demo-banner').isVisible(),false,
            'Ordinary calculator URL must remain untouched');
        assert.equal(await normal.evaluate(()=>productPortfolio.length),0);
        await normal.close();
        console.log('NORMAL_MODE_UNCHANGED_GREEN');
    } finally {await browser.close();}
})().catch(e=>{console.error('PREFILLED_DEMO_RED',e.stack||e);process.exitCode=1});
