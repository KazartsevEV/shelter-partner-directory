// Run: node --test tests/marketing_calc_regressions.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'Marketing_calc.HTML'), 'utf8');

function sliceBetween(from, to) {
    const start = html.indexOf(from);
    const end = html.indexOf(to, start);
    assert.ok(start >= 0 && end > start, 'Expected calculator function markers');
    return html.slice(start, end);
}

const pricingCode = sliceBetween(
    'function priceListRequiredCustomerPrice(',
    'function updatePriceListRange(item) {'
);
function calculator(model, vat, businessTaxType, taxPct) {
    return new Function(
        'calculateProductPortfolio', 'aggregatePricingMetrics',
        'productBusinessTaxType', 'productNumber',
        pricingCode + '; return calculatePriceListRange;'
    )(() => model, () => vat, businessTaxType, () => taxPct);
}

const portfolio = {
    items: [{ id: 1, unitCost: 100, baseCac: 5, creditServicePerUnit: 2 }],
    sharedBusinessCosts: 30,
    totalForecastOrders: 10,
    pricingReady: true
};
const item = {
    id: 1,
    planning: { maxDiscountPct: 20, minimumMarginPct: 10, targetMarginPct: 30 },
    salesVariablePct: 10,
    penaltiesPct: 1
};
const vat = { salesVatChoice: 'yes', vatReady: true, vatPct: 20 };
const noVat = { salesVatChoice: 'no', vatReady: false, vatPct: 0 };

test('Price-list floor preserves net margin after discount, commissions, tax, credit and fixed costs', () => {
    const range = calculator(portfolio, vat, 'turnover', 5)(item);
    assert.equal(range.ready, true);
    assert.ok(range.maxPrice >= range.minPrice);
    const realizedExVat = range.minPrice * 0.8 / 1.2;
    const netMargin = (realizedExVat * (1 - 0.11 - 0.05) - 110) / realizedExVat;
    assert.ok(netMargin >= 0.1 - 1e-12);
    assert.ok(Math.abs(range.minPrice * 100 - Math.round(range.minPrice * 100)) < 1e-8);
});

test('Profit-based business tax is included in minimum net margin', () => {
    const range = calculator(portfolio, noVat, 'profit', 20)(item);
    assert.equal(range.ready, true);
    const realizedRevenue = range.minPrice * 0.8;
    const profitBeforeTax = realizedRevenue * (1 - 0.11) - 110;
    assert.ok(profitBeforeTax * 0.8 / realizedRevenue >= 0.1 - 1e-12);
});

test('Incomplete or unprofitable settings cannot produce a misleading list price', () => {
    const calculate = calculator(portfolio, noVat, 'turnover', 0);
    const modified = changes => ({ ...item, planning: { ...item.planning, ...changes } });
    assert.equal(calculate({ ...item, salesVariablePct: 95 }).ready, false);
    assert.equal(calculate(modified({ maxDiscountPct: 100 })).ready, false);
    assert.equal(calculate(modified({ minimumMarginPct: 0 })).ready, false);
    assert.equal(calculate(modified({ minimumMarginPct: 40 })).ready, false);
    assert.equal(calculator(portfolio, { ...vat, vatReady: false }, 'turnover', 5)(item).ready, false);
    assert.equal(calculator({ ...portfolio, pricingReady: false }, noVat, 'turnover', 0)(item).ready, false);
});

test('Creating a new product after editing SKU 1 never overwrites saved SKU 2', () => {
    const navigation = sliceBetween('function addAnotherProduct() {', 'function submitProductIntro(');
    const nodes = new Map();
    const plain = {
        classList: { add() {}, remove() {} },
        scrollIntoView() {},
        closest() { return plain; }
    };
    const document = {
        getElementById(id) {
            if (!nodes.has(id)) nodes.set(id, {
                ...plain,
                value: id === 'own-business-tax-pct' ? '8'
                    : id === 'own-sales-vat-pct' ? '12' : '',
                textContent: ''
            });
            return nodes.get(id);
        }
    };
    const choices = { salesVat: 'yes' };
    const boot = new Function('document', 'productPortfolio', 'productOwnChoices',
        navigation + [
            'let currentProductSequence = 1;',
            "let productBusinessTaxType = 'turnover';",
            'const history = [];',
            'function requireAdditionalProductName() { return true; }',
            "function saveCurrentProductToPortfolio() { history.push('save'); }",
            "function freezeCurrentProductOnPage() { history.push('freeze'); }",
            'function resetCurrentProductForNext() {',
            "history.push('reset');",
            'productBusinessTaxType = null;',
            'productOwnChoices.salesVat = null;',
            "document.getElementById('own-business-tax-pct').value = '0';",
            "document.getElementById('own-sales-vat-pct').value = '0';",
            '}',
            'return {run:addAnotherProduct,id:()=>currentProductSequence,tax:()=>productBusinessTaxType,history};'
        ].join('\n')
    );
    const app = boot(document, [{ id: 1 }, { id: 2 }], choices);
    assert.equal(app.run(), true);
    assert.equal(app.id(), 3);
    assert.equal(app.tax(), 'turnover');
    assert.equal(choices.salesVat, 'yes');
    assert.equal(document.getElementById('own-business-tax-pct').value, '8');
    assert.equal(document.getElementById('own-sales-vat-pct').value, '12');
    assert.deepEqual(app.history, ['save', 'freeze', 'reset']);
});

test('The final screen still has contact, donation and list-price controls', () => {
    for (const label of [
        'Будете давать скидки?', 'Максимальная скидка',
        'Минимальная маржинальность', 'Диапазон цены для прайс-листа',
        'Добавить продукт', 'Поддержать проект',
        'nomad260393@gmail.com', '+7 777 129 56 93', '+7 977 986 74 41'
    ]) assert.ok(html.includes(label), label);
});
