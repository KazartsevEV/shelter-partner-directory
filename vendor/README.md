# ExcelJS browser distribution

Version: **4.4.0**, MIT. Upstream: https://github.com/exceljs/exceljs/releases/tag/v4.4.0

`exceljs-4.4.0.min.js` is copied unchanged from the npm `exceljs@4.4.0` package, `dist/exceljs.min.js`.
SHA256: `7e49da68588e250dbb8bba190d2caa8ab3787cc0284bda1d8b2f805c4df742c9`.
License is preserved in `exceljs-LICENSE.txt`.

The static calculator and its downloaded HTML include this local distribution. No CDN, remote workbook service or API is used to generate XLSX. Names/IDs are assigned as literal strings, prices as existing numeric engine outputs; formulas, hyperlinks and external connections are not generated.

The build-free repository uses the upstream UMD browser bundle. The npm package is used only to obtain that pinned bundle; runtime does not install or request npm dependencies.
