/* Builds the portable calculator edition. No UI state or financial model access. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.Nomad360Delivery=Object.freeze(api);
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';

  async function buildStandalone(base){
    const textCache=new Map(),binaryCache=new Map();
    const get=async path=>{
      const response=await root.fetch(new URL(path,base),{cache:'no-store'});
      if(!response.ok)throw new Error('Unable to fetch '+path+': '+response.status);
      return response;
    };
    const dataUrl=blob=>new Promise((resolve,reject)=>{
      const reader=new root.FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=()=>reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const text=path=>{
      if(!textCache.has(path))textCache.set(path,get(path).then(response=>response.text()));
      return textCache.get(path);
    };
    const binary=path=>{
      if(!binaryCache.has(path))binaryCache.set(path,get(path).then(response=>response.blob()).then(dataUrl));
      return binaryCache.get(path);
    };
    const html=await text('Marketing_calc.HTML');
    const doc=new root.DOMParser().parseFromString(html,'text/html');
    if(!doc.querySelector('#home-screen')||!doc.querySelector('#portfolio-v2-screen'))
      throw new Error('Calculator HTML is incomplete');
    const logo=await binary('nomad360_wolf_open_circle.png');
    for(const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"][href^="./"]'))){
      const filename=link.getAttribute('href');
      let css=await text(filename);
      // Keep the original CONSULTING artwork contract and bundle every local
      // CSS image/font so the exported file works on another origin.
      if(filename==='./nomad360_consulting_banner.css'){
        const scenicUrls=[
          './assets/nomad360-banners/consulting-horizontal-desktop-3200x941.svg',
          './assets/nomad360-banners/consulting-horizontal-mobile-1200x1671.svg'
        ];
        if(!scenicUrls.every(path=>css.includes(path)))
          throw new Error('Consulting artwork URL contract changed');
      }
      const localUrls=[...new Set([...css.matchAll(/url\(\s*(['"]?)(\.\/[^'"\)]+)\1\s*\)/g)]
        .map(match=>match[2]))];
      for(const path of localUrls){
        css=css.replaceAll(path,await binary(path));
      }
      const inline=doc.createElement('style');
      inline.setAttribute('data-nomad-bundled',filename);
      inline.textContent=css.replace(/<\/style/gi,'<\\/style');
      link.replaceWith(inline);
    }
    // A partner's own origin must not advertise shortcuts to the original host.
    doc.documentElement.setAttribute('data-nomad-embedded','');
    doc.querySelector('script[src$="nomad360_return.js"]')?.remove();
    for(const old of Array.from(doc.querySelectorAll('script[src^="./"]'))){
      const filename=old.getAttribute('src');
      let code=await text(filename);
      if(filename==='./nomad360_header.js')
        code=code.replaceAll('./nomad360_wolf_open_circle.png',logo);
      const inline=doc.createElement('script');
      inline.setAttribute('data-nomad-bundled',filename);
      inline.textContent=code.replace(/<\/script/gi,'<\\/script');
      old.replaceWith(inline);
    }
    return '<!DOCTYPE html>\n'+doc.documentElement.outerHTML;
  }

  return {buildStandalone};
});
