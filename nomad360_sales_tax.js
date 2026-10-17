/* Nomad360 SALES-TAX-07B, stage 7B-1: pure calculation for the NEW regime only.
 * No DOM, storage, network, locale, VAT or purchase-tax accounting dependencies.
 * Existing VAT calculations MUST remain in their original engines.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.Nomad360SalesTax = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const MODES = Object.freeze(['vat', 'sales_tax', 'none']);

  function mode(value) {
    // Missing field in an old save means its original VAT logic, including VAT=0.
    if (value === undefined || value === null) return 'vat';
    if (!MODES.includes(value)) throw new RangeError('Invalid sales tax mode');
    return value;
  }

  function amount(value, field) {
    // Do not quietly reinterpret empty/invalid user-entered taxes or prices.
    if (value === '' || (typeof value === 'string' && value.trim() === '') ||
        value === null || value === undefined ||
        (typeof value !== 'number' && typeof value !== 'string') ||
        !Number.isFinite(Number(value)) || Number(value) < 0)
      throw new RangeError('Invalid '+field);
    return Number(value);
  }

  function quote(options) {
    if (!options || typeof options !== 'object') throw new TypeError('Expected tax quote options');
    const selected=mode(options.mode);
    if (selected === 'vat')
      throw new RangeError('VAT calculations belong to the existing V1/V2 engines');

    const enteredPrice=amount(options.enteredPrice,'enteredPrice');
    const discountPct=options.discountPct === undefined ? 0 : amount(options.discountPct,'discountPct');
    if (discountPct > 100) throw new RangeError('Discount exceeds 100%');

    // Mode=none never applies the stale Sales Tax rate retained by the UI.
    const ratePct=selected === 'sales_tax' ? amount(options.ratePct,'ratePct') : 0;
    const factor=1+ratePct/100;
    if (!Number.isFinite(factor) || factor <= 0) throw new RangeError('Invalid ratePct');

    const priceBasis=options.priceBasis === undefined ? 'exclusive' : options.priceBasis;
    if (priceBasis !== 'exclusive' && priceBasis !== 'inclusive')
      throw new RangeError('Invalid priceBasis');

    const netBeforeDiscount=priceBasis === 'inclusive' ? enteredPrice/factor : enteredPrice;
    const net=netBeforeDiscount*(1-discountPct/100);
    const tax=selected === 'sales_tax' ? net*(ratePct/100) : 0;
    const customerTotal=net+tax;
    if (![netBeforeDiscount,net,tax,customerTotal].every(Number.isFinite))
      throw new RangeError('Tax quote overflow');

    return Object.freeze({
      mode:selected,priceBasis,enteredPrice,discountPct,ratePct,
      netBeforeDiscount,net,tax,customerTotal
    });
  }

  return Object.freeze({MODES,mode,quote});
});
