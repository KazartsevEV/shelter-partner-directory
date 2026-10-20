// Run after Playwright Chromium is installed: node tests/marketing_calc_prefilled_demo.test.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const htmlUrl = process.env.NOMAD360_TEST_URL || pathToFileURL(path.join(__dirname, '..', 'Marketing_calc.HTML')).href;
const {verify}=require('./shopper_v1_oracle.cjs');
async function demo(browser, financing) {
    const page = await browser.newPage({locale:'ru-RU',viewport: {width: 390,height:844}});
    // This legacy fixture tests RU copy explicitly; default first-visit UI is English.
    await page.addInitScript(()=>{try{localStorage.setItem('nomad360PreferredLanguage','ru')}catch(_){}});
    const faults = [];
    page.on('pageerror', e=>faults.push(e.message));
    // External CSS/font assets are deliberately blocked for this offline file test;
    // only genuine JS errors and non-network console errors are defects.
    page.on('console', m=>{if(m.type()==='error' && !/Failed to load resource: net::ERR_FAILED/.test(m.text()))faults.push(m.text())});
    await page.route(/^https?:\/\//, route=>process.env.NOMAD360_TEST_URL && route.request().url().startsWith(new URL(htmlUrl).origin+'/')?route.continue():route.abort());
    await page.goto(htmlUrl+'?demo=shopper&finance='+financing,
        {waitUntil:'domcontentloaded'});
    await page.locator('#product-demo-banner').waitFor({state:'visible',timeout:10000});
    const title = await page.locator('#product-demo-banner').textContent();
    assert.match(title,/шоппер.*Казахстан/i);
    const data = await page.evaluate(()=>{
        const product = productPortfolio[0];
        const model = calculateProductPortfolio();
        const cf = calculateProductCashFlow(model);
        const cycle=aggregatePlanMetrics(product);
        const pl=calculatePriceListRange(product);
        const wage = id => document.getElementById(id)?.textContent;
        return {
            productName:product.name,
            product,model,currency:Nomad360Currency.get(),cycle,priceList:pl,
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
            summaryText:document.getElementById('product-portfolio-business-summary').textContent,
            funnelForecast:model.items[0]?.forecastSales,
            v1DomOrder:(()=>{
                const report=document.getElementById('product-v1-aggregate-report');
                const saves=document.getElementById('product-v1-export-buttons');
                const v2=document.getElementById('product-v2-portfolio-gateway');
                const before=(left,right)=>!!(left.compareDocumentPosition(right)&Node.DOCUMENT_POSITION_FOLLOWING);
                return {reportBeforeExports:before(report,saves),
                    exportsBeforeV2:before(saves,v2),
                    reportBeforeV2:before(report,v2),
                    sameTaxSection:report.closest('#product-tax-details')===v2.closest('#product-tax-details')};
            })(),
            screenCashRows:[...document.querySelectorAll('#product-portfolio-business-summary table tbody tr')]
              .map(row=>[...row.querySelectorAll('[data-nomad-display-money]')]
                .map(el=>Number(el.dataset.nomadDisplayNumber)))
        };
    });
    assert.match(data.productName,/шоппер/i);
    assert.equal(data.materialCount,516);
    assert.equal(data.productionCount,500);
    assert.equal(data.stockCount,500);
    assert.equal(data.saleCount,500);
    assert.equal(data.country,'KZ');
    assert.equal(data.workerMode,'workers');
    assert.match(data.wageGross,/230[ \u00a0\u202f]000,00/);
    assert.match(data.wageCharges,/40[ \u00a0\u202f]250,00/);
    assert.match(data.wageTotal,/270[ \u00a0\u202f]250,00/);
    assert.equal(data.funding,financing);
    assert.equal(data.taxType,'profit');
    assert.equal(Number(data.rate),20);
    assert.equal(Number(data.vat),16);
    assert.equal(Number(data.discount),10);
    assert.equal(Number(data.minMargin),10);
    assert.equal(Number(data.targetMargin),20);
    const expected=verify(data,financing);
    assert.match(data.summaryText,/Cash Flow/i);
    assert.deepEqual(data.v1DomOrder,{
        reportBeforeExports:true,exportsBeforeV2:true,reportBeforeV2:true,sameTaxSection:true
    },'V1 results, monthly Cash Flow and export must precede the V2 continuation');
    assert.equal(data.funnelForecast,150,'Sales forecast must come from the advertising funnel, not stock quantity');
    const expectedCashKeys=['inflow','outflow','taxPaid','interestPaid',
        'principalRepaid','cashFlow','cumulative','freeCumulative'];
    assert.equal(data.screenCashRows.length,expectedCashKeys.length,
        'visible month-by-month cash ledger has all canonical lines');
    data.screenCashRows.forEach((cells,i)=>{
        assert.deepEqual(cells,data.months.map(m=>m[expectedCashKeys[i]]),
            'displayed V1 Cash Flow matches numeric source for '+expectedCashKeys[i]);
    });
    // On a phone viewport, demo controls and previously entered fields remain accessible.
    await page.getByRole('button',{name:/Все заполненные поля/}).click();
    assert.equal(await page.locator('.material-cost-row').count(),4);
    assert.equal(await page.locator('.material-cost-price').first().inputValue(),'1000');
    assert.equal(await page.locator('#own-production-worker-gross').inputValue(),'230000');
    await page.getByRole('button',{name:/Cash flow по месяцам/}).click();
    assert.equal(await page.locator('#product-portfolio-business-summary').isVisible(),true);
    assert.deepEqual(faults,[],'JS errors in demo loading');
    console.log('PREFILLED_DEMO_GREEN',JSON.stringify({financing,periodDays:expected.horizon,months:expected.months.length,capital:expected.capital,priceFloor:expected.listMin,priceTarget:expected.listMax,freeCash:expected.freeCumulativeEnd}));
    await page.close();
}
(async()=>{
    const browser=await chromium.launch({headless:true,executablePath:process.env.NOMAD360_CHROMIUM_PATH||undefined,args:['--no-sandbox']});
    try{
        await demo(browser,'cash');
        await demo(browser,'credit');
        const normal=await browser.newPage({locale:'ru-RU'});
        // This legacy fixture tests RU copy explicitly; default first-visit UI is English.
        await normal.addInitScript(()=>{try{localStorage.setItem('nomad360PreferredLanguage','ru')}catch(_){}});
        await normal.goto(htmlUrl,{waitUntil:'domcontentloaded'});
        assert.equal(await normal.locator('#product-demo-banner').isVisible(),false,
            'Ordinary calculator URL must remain untouched');
        assert.equal(await normal.evaluate(()=>productPortfolio.length),0);
        await normal.evaluate(()=>updateProductPortfolioBusinessSummary());
        const hint=normal.locator('#product-portfolio-business-summary');
        assert.match(await hint.textContent(),/Прогноз продаж рассчитывается автоматически по рекламной воронке/);
        assert.doesNotMatch(await hint.textContent(),/Заполните цену товара, сроки, прогноз продаж и налог/);
        await normal.locator('#nomad360-lang-select').selectOption('en');
        assert.match(await hint.textContent(),/The sales forecast is calculated automatically/);
        await normal.locator('#nomad360-lang-select').selectOption('kk');
        assert.match(await hint.textContent(),/Сату болжамы жарнама воронкасы бойынша автоматты түрде/);
        await normal.close();
        console.log('NORMAL_MODE_UNCHANGED_GREEN');
    } finally {await browser.close();}
})().catch(e=>{console.error('PREFILLED_DEMO_RED',e.stack||e);process.exitCode=1});
