'use strict';
// Optional real Chromium acceptance pass. No npm packages or persisted browser profile.
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const http=require('node:http');
const {spawn}=require('node:child_process');const {once}=require('node:events');
const root=path.resolve(__dirname,'..');
const chrome=process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const runtime=path.join(root,'.qa-runtime');fs.mkdirSync(runtime,{recursive:true});
const profile=fs.mkdtempSync(path.join(runtime,'chrome-'));
const server=http.createServer((req,res)=>{
  const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/questions.js':'questions.js','/styles.css':'styles.css'};
  const file=files[req.url];if(!file){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(root,file)));
});
let browser;let serial=0;let buffer='';const pending=new Map();const exceptions=[];let sessionId;let loads=0;
function cdp(method,params={},session=sessionId){return new Promise((resolve,reject)=>{
  const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error(`CDP timeout: ${method}`));},15000);
  pending.set(id,{resolve,reject,timer});browser.stdio[3].write(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})})+'\0');
});}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function ready(){for(let i=0;i<100;i++){if(await evaluate('document.readyState === "complete" && typeof Sentinel !== "undefined" && !!document.getElementById("start-session")'))return;await new Promise(r=>setTimeout(r,40));}throw Error('page not ready');}
async function navigate(method,params={}){const before=loads;await cdp(method,params);for(let i=0;i<150;i++){if(loads>before){await ready();return;}await new Promise(r=>setTimeout(r,40));}throw Error('navigation load event missing');}
const click=id=>evaluate(`document.getElementById(${JSON.stringify(id)}).click()`);
const saved=()=>evaluate('JSON.parse(localStorage.getItem(Sentinel.STORAGE_KEY))');
async function submit(correct=true,confidence=2){return evaluate(`(()=>{
  const state=JSON.parse(localStorage.getItem(Sentinel.STORAGE_KEY));
  const q=Sentinel.QUESTION_BANK.find(q=>q.id===state.session.deck[state.session.index]);
  const b=[...document.querySelectorAll('#answer-options button')].find(b=>(b.textContent===q.answer)===${correct});b.click();
  document.querySelector('input[name="confidence"][value="${confidence}"]').click();
  document.getElementById('lock-answer').click();return q.id;
})()`);}
async function main(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=spawn(chrome,['--headless=new','--remote-debugging-pipe',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-component-update','--disable-sync','--disable-default-apps','about:blank'],{stdio:['ignore','ignore','pipe','pipe','pipe']});
  browser.on('error',err=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(err);}pending.clear();});
  browser.stdio[4].on('data',data=>{
    buffer+=data.toString();let index;
    while((index=buffer.indexOf('\0'))!==-1){const raw=buffer.slice(0,index);buffer=buffer.slice(index+1);if(!raw)continue;const msg=JSON.parse(raw);
      if(msg.method==='Runtime.exceptionThrown')exceptions.push(msg.params.exceptionDetails);
      if(msg.method==='Page.loadEventFired'&&msg.sessionId===sessionId)loads++;
      if(pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result);}
    }
  });
  const version=await cdp('Browser.getVersion',{},null);
  const target=await cdp('Target.createTarget',{url:'about:blank'},null);
  sessionId=(await cdp('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
  await cdp('Runtime.enable');await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  const url=`http://127.0.0.1:${server.address().port}/`;
  await navigate('Page.navigate',{url});
  assert.match(await evaluate('document.title'),/Sentinel/);
  assert.equal(await evaluate('document.getElementById("arena").hidden'),true);
  // Exercise keyboard activation, not only JavaScript clicks.
  await evaluate('document.getElementById("start-session").focus()');
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal((await saved()).session.mode,'mixed');
  assert.equal(await evaluate('document.getElementById("lock-answer").disabled'),true);
  assert.equal(await evaluate('document.getElementById("feedback").querySelectorAll("li").length'),0);
  const first=await submit(false,3);const beforeReload=await saved();
  assert.equal(beforeReload.history.length,1);
  assert.equal(await evaluate('document.getElementById("feedback").querySelectorAll("li").length'),4);
  await navigate('Page.reload');
  assert.equal(await evaluate('document.getElementById("lock-answer").disabled'),true);
  assert.equal((await saved()).history.length,1);
  await click('next-button');assert.notEqual((await saved()).session.deck[(await saved()).session.index],first);
  await submit();await click('next-button');assert.notEqual((await saved()).session.deck[(await saved()).session.index],first);
  await submit();await click('next-button');assert.equal((await saved()).session.deck[(await saved()).session.index],first);
  let iterations=0;while(!(await saved()).session.complete){await submit();await click('next-button');assert.ok(++iterations<60);}
  assert.equal(await evaluate('document.getElementById("completion").hidden'),false);
  assert.equal((await saved()).session.boss.shields,4);assert.equal((await saved()).session.boss.bonus,200);
  await click('share-report');assert.match(await evaluate('document.getElementById("report-text").value'),/Confident misses: 1/);
  // Narrow viewport: real layout, touch targets, reduced-motion styles, tab focus.
  await cdp('Emulation.setDeviceMetricsOverride',{width:375,height:812,deviceScaleFactor:1,mobile:true});
  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await evaluate('document.getElementById("domain-select").value="4"');await click('start-session');
  const mobile=await evaluate(`({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    targets:[...document.querySelectorAll('button,select,summary,.confidence-options label')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent.trim().slice(0,40),height:e.getBoundingClientRect().height})),
    transition:getComputedStyle(document.getElementById('start-session')).transitionDuration})`);
  assert.ok(mobile.scrollWidth<=mobile.width,JSON.stringify(mobile));
  assert.ok(mobile.targets.every(t=>t.height>=44),JSON.stringify(mobile.targets));
  assert.equal(mobile.transition,'0s');
  await evaluate('document.querySelector("#answer-options button").focus()');
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate('document.querySelector("#answer-options button").getAttribute("aria-pressed")'),'true');
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'),'solid');
  const miss=await submit(false,3);await click('next-button');
  // Confirm is stubbed only for intentional local reset/replay; no external forms.
  await evaluate('window.confirm=()=>true');await click('replay-missed');
  assert.deepEqual((await saved()).session.deck,[miss]);await submit();await click('next-button');
  assert.equal((await saved()).session.complete,true);
  assert.equal(await evaluate('document.getElementById("replay-missed").disabled'),true);
  await click('reset-progress');assert.equal((await saved()).xp,0);
  // Missing feedback alone must not reopen a scored decision after reload.
  await click('start-session');await submit();
  const scored=await saved();assert.equal(scored.history.length,1);assert.equal(scored.xp,120);
  await evaluate('(()=>{const s=JSON.parse(localStorage.getItem(Sentinel.STORAGE_KEY));s.session.feedback=null;localStorage.setItem(Sentinel.STORAGE_KEY,JSON.stringify(s));})()');
  await navigate('Page.reload');
  assert.equal(await evaluate('document.getElementById("arena").hidden'),true);
  assert.equal(await evaluate('document.getElementById("xp").textContent'),'0');
  await click('lock-answer');assert.equal((await saved()).history.length,1);
  await click('start-session');await submit();
  assert.equal((await saved()).history.length,1);assert.equal((await saved()).xp,120);
  await evaluate('window.confirm=()=>true');await click('reset-progress');
  // Real browser migration and getter-denied storage initialization.
  await evaluate(`localStorage.removeItem(Sentinel.STORAGE_KEY);localStorage.setItem(Sentinel.LEGACY_KEY,JSON.stringify({score:480,answered:5,correct:3,missed:{'stop-and-wait':2}}))`);
  await navigate('Page.reload');assert.equal(await evaluate('document.getElementById("xp").textContent'),'480');
  assert.match(await evaluate('document.getElementById("legacy-note").textContent'),/stop-and-wait/);
  await cdp('Page.addScriptToEvaluateOnNewDocument',{source:'Object.defineProperty(window,"localStorage",{get(){throw new Error("blocked for test")}})'});
  await navigate('Page.reload');assert.match(await evaluate('document.getElementById("storage-status").textContent'),/not being saved/);
  await click('start-session');assert.equal(await evaluate('document.getElementById("arena").hidden'),false);
  assert.deepEqual(exceptions,[]);
  console.log(JSON.stringify({result:'PASS',browser:version.product,desktop:'1280×900',mobile:'375×812',checks:['keyboard launch and answer','question-first confidence gate','four option explanations','reload lock','tampered feedback safe rejection without duplicate XP','two-question deferred retry','mixed completion and four-shield bonus','manual report','mobile no horizontal overflow','44px visible touch targets','reduced motion','visible keyboard focus','domain selection','replay and reset','legacy migration','blocked storage getter'],uncaughtExceptions:exceptions.length},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  for(const p of pending.values())clearTimeout(p.timer);
  if(browser&&browser.exitCode===null){
    try {await cdp('Browser.close',{},null);} catch (_) {browser.kill();}
    if(browser.exitCode===null) await Promise.race([once(browser,'exit'),new Promise(r=>setTimeout(r,3000))]);
  }
  server.close();fs.rmSync(profile,{recursive:true,force:true,maxRetries:20,retryDelay:100});try{fs.rmdirSync(runtime);}catch(_){}
});
