/* Preview-only lifecycle. No credentials, persistence, calculator or network. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Nomad360PartnerPreviewModel=Object.freeze(api);})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const phases=Object.freeze(['idle','applicationAccepted','verificationAccepted','emailVerified','preparing','archiveReady','deliveryAccepted','deliveryUnknown','expiredConfirmation']);
const transitions=Object.freeze({
 idle:{applicationAccepted:'applicationAccepted'},
 applicationAccepted:{verificationAccepted:'verificationAccepted'},
 verificationAccepted:{emailVerified:'emailVerified',expiredConfirmation:'expiredConfirmation'},
 expiredConfirmation:{verificationAccepted:'verificationAccepted'},
 emailVerified:{preparing:'preparing'},
 preparing:{archiveReady:'archiveReady'},
 archiveReady:{deliveryAccepted:'deliveryAccepted',deliveryUnknown:'deliveryUnknown'},
 deliveryUnknown:{deliveryAccepted:'deliveryAccepted'}
});
const initial=()=>Object.freeze({phase:'idle',hasWebsite:false,emailVerified:false});
function advance(state,event){
 if(!phases.includes(state?.phase)||!event||typeof event!=='object')throw Error('Invalid preview event');
 const phase=transitions[state.phase]?.[event.type];if(!phase)throw Error('Invalid preview transition');
 if(['applicationAccepted','verificationAccepted','deliveryAccepted'].includes(event.type)&&event.accepted!==true)
  throw Error('Provider acceptance is required');
 return Object.freeze({phase,hasWebsite:state.hasWebsite||(event.type==='applicationAccepted'&&event.hasWebsite===true),
  emailVerified:state.emailVerified||event.type==='emailVerified'});
}
return {phases,transitions,initial,advance};
});
