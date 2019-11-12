/**
IMPORTANT: DO NOT DELETE THIS FILE...MRHORSE GOES CRAZY AND IT **WILL** BREAK ALL PRE/POST HANDLERS
*/
const dummyPolicy = (_request, h) => h.continue;
dummyPolicy.applyPoint = 'onPreHandler';
module.exports = dummyPolicy;
