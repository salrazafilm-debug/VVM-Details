const assert=require('assert'); const Module=require('module');
process.env.SQUARE_ACCESS_TOKEN='x'; delete process.env.URL; process.env.MIN_NOTICE_HOURS='0';
const calls={forms:0,holds:0}; let formStatus=303, formThrows=false;
const dayStr=(()=>{const d=new Date(Date.now()+5*864e5);return d.toISOString().slice(0,10)})();
const cat={V1:{id:'V1',item:'Exterior Reset',label:'Sedan',kind:'exterior',priceCents:12000,durationMin:90,transitionMin:0,version:1,bookable:true,teamMemberId:'T'},
  V2:{id:'V2',item:'Maintenance Plan',label:'Sedan',kind:'full',priceCents:15000,durationMin:255,transitionMin:0,version:1,bookable:true,teamMemberId:'T'}};
const realLoad=Module._load;
Module._load=function(req,...a){
  if(req==='../lib/square'||req.endsWith('/square')){const real=realLoad.call(this,req,...a);return {...real,loadCatalog:async()=>cat,blocksByDay:async()=>({}),getLocationId:async()=>'L'}}
  if(req==='../lib/holds'||req.endsWith('/holds')){const real=realLoad.call(this,req,...a);return {...real,blocksWithHolds:async(e,d)=>d,addHold:async()=>{calls.holds++}}}
  return realLoad.call(this,req,...a)};
global.fetch=async(u,o)=>{calls.forms++; if(formThrows) throw new Error('net'); return {status:formStatus}};
const {handler}=require('../netlify/functions/book.js');
const body={name:'Test Person',phone:'2405550100',email:'t@e.com',vehicle:'2022 Lexus',date:dayStr,time:'09:00',variationId:'V1',notes:'x'};
const ev=(h)=>({httpMethod:'POST',headers:h,body:JSON.stringify(body)});
(async()=>{
  let r=await handler(ev({host:'site.netlify.app'})); assert.equal(r.statusCode,200,r.body); assert.equal(calls.forms,1); assert.equal(calls.holds,1);           // success: email sent THEN hold saved
  formStatus=500; r=await handler(ev({host:'site.netlify.app'})); assert.equal(r.statusCode,502); assert.equal(calls.holds,1);                                      // email failed: customer told, NO hold added
  formStatus=303; formThrows=true; r=await handler(ev({host:'site.netlify.app'})); assert.equal(r.statusCode,502); assert.equal(calls.holds,1);                    // network error: same
  formThrows=false; r=await handler(ev({})); assert.equal(r.statusCode,503); assert.equal(calls.holds,1);                                                          // no origin: loud failure, not silent
  r=await handler({httpMethod:'POST',headers:{host:'site.netlify.app'},body:JSON.stringify({...body,variationId:'V2'})}); assert.equal(r.statusCode,400); assert.equal(calls.holds,1);   // Maintenance Plan is clients-only: never bookable on the site
  const {isPublic}=require('../netlify/lib/square'); assert.equal(isPublic(cat.V1),true); assert.equal(isPublic(cat.V2),false);
  console.log('book.js tests passed:',JSON.stringify(calls));
})().catch(e=>{console.error('FAIL',e.message);process.exit(1)});
