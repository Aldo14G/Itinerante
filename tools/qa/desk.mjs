import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const URL_ = process.argv[2];
const port = 9600 + Math.floor(Math.random()*50);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-d-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t; for (let i=0;i<40;i++){ try{ t=await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if(t.length)break;}catch{} await sleep(250);} 
const ws = new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl); await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0; const pend=new Map(); const errs=[]; const reqs=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)} else if(m.method==='Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text); else if(m.method==='Network.requestWillBeSent') reqs.push(m.params.request.url.split('/').pop());});
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async x=>(await send('Runtime.evaluate',{expression:x,awaitPromise:true,returnByValue:true})).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
for (const [name,w,h,mobile] of [['escritorio',1280,800,false],['móvil',390,844,true],['móvil→escritorio',390,844,true]]) {
  reqs.length=0; errs.length=0;
  await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile});
  await send('Page.navigate',{url:URL_}); await sleep(5000);
  if (name==='móvil→escritorio') { await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false}); await sleep(3000); }
  await ev(`scrollTo(0,400)`); await sleep(2500);
  const o=await ev(`(()=>{const cv=document.querySelector('.entry-canvas'); let drawn=null; try{ const d=cv.getContext('2d').getImageData(Math.floor(cv.width/2),Math.floor(cv.height/2),1,1).data; drawn=[...d]; }catch(e){drawn=String(e)} return {motion:document.documentElement.classList.contains('motion'), live:document.querySelector('.entry').classList.contains('is-live'), cw:cv.width, drawn, wm:getComputedStyle(document.querySelector('.wordmark .ch')).transform!=='none'}})()`);
  console.log(name, JSON.stringify(o), 'scenes-desktop:', reqs.includes('scenes-desktop.js'), 'frames:', reqs.filter(r=>/^[fm]\d{3}\.webp/.test(r)).length, 'errores:', JSON.stringify(errs));
}
chrome.kill(); process.exit(0);
