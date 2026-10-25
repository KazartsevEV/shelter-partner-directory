'use strict';
// Conservative planning limits, NOT measured traffic capacity or an active deployment.
// Tune through R4/R5 load measurements and the hosting provider's quotas.
const POLICY=Object.freeze({
 register:Object.freeze({public:true,action:'partner_register',maxBody:16384,perActor:6,perActorWindowMs:600000,global:300,globalWindowMs:60000,budget:150,budgetWindowMs:86400000}),
 confirm_email:Object.freeze({public:true,action:'partner_confirm',maxBody:2048,perActor:15,perActorWindowMs:600000,global:500,globalWindowMs:60000}),
 resend_code:Object.freeze({public:true,action:'partner_resend',maxBody:2048,perActor:3,perActorWindowMs:3600000,global:100,globalWindowMs:60000,budget:50,budgetWindowMs:86400000}),
 prepare_zip:Object.freeze({public:false,maxBody:4096,perActor:2,perActorWindowMs:3600000,global:30,globalWindowMs:60000,budget:25,budgetWindowMs:86400000}),
 deliver_zip:Object.freeze({public:false,maxBody:4096,perActor:2,perActorWindowMs:3600000,global:30,globalWindowMs:60000,budget:25,budgetWindowMs:86400000})
});
module.exports={POLICY};
