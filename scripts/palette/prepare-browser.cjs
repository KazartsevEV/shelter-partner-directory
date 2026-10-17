'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'artifacts/task10-palette');fs.mkdirSync(out,{recursive:true});
const input=path.join(out,'input.css'),output=path.join(out,'utilities.css');fs.writeFileSync(input,'@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
execFileSync(process.execPath,[require.resolve('tailwindcss/lib/cli.js'),'-i',input,'-o',output,'--content','Marketing_calc.HTML,nomad360_*.js,portfolio_v2*ui.js','--minify'],{cwd:root,stdio:'inherit'});
fs.mkdirSync(path.join(root,'artifacts/sales-tax-7b'),{recursive:true});fs.copyFileSync(output,path.join(root,'artifacts/sales-tax-7b/utilities.css'));
