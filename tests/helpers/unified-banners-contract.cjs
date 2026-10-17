'use strict';
// Exact reviewed presentation-only hunks, not a generic exemption for renderers.
const edits=require('../fixtures/unified-banners/presentation-edits.json');
function stripBanners(file,source){
 for(const {before,after} of edits[file]||[])if(source.includes(after))source=source.replace(after,before);
 return source;
}
module.exports={stripBanners};
