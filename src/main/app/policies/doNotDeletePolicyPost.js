/**
IMPORTANT: DO NOT DELETE THIS FILE...MRHORSE GOES CRAZY AND IT **WILL** BREAK ALL PRE/POST HANDLERS
*/
const dummyPolicy = (request, h) => h.continue;
dummyPolicy.applyPoint = 'onPostHandler';
module.exports = dummyPolicy;
