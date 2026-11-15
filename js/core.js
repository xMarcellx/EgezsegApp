const TABS=[["ov","Főoldal","📊"],["wo","Edzés","🏋️"],["fd","Étrend","🍽️"],["wt","Testsúly","⚖️"],["bf","Zsír%","📏"],["hb","Szokások","💧"],["ex","Mentés","💾"]];
let S={workouts:[],food:[],weights:[],navy:[],templates:[],reminders:{enabled:false,type:"water",time:"20:00",lastDate:""},prof:{sex:"m",h:""}};
try{const r=localStorage.getItem("forma1");if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
if(!Array.isArray(S.templates))S.templates=[];
if(!S.reminders||typeof S.reminders!=="object")S.reminders={enabled:false,type:"water",time:"20:00",lastDate:""};
let SYNC=false,ref=null,pt=null;
const blank=()=>({workouts:[],food:[],weights:[],navy:[],templates:[],reminders:{enabled:false,type:"water",time:"20:00",lastDate:""},prof:{sex:"m",h:""}});
const loc=()=>{try{localStorage.setItem("forma1",JSON.stringify(S))}catch(e){}};
const save=()=>{S._t=Date.now();loc();if(ref){clearTimeout(pt);pt=setTimeout(()=>ref.set({s:JSON.stringify(S),t:S._t}).catch(()=>{}),600)}};
function mergeS(a,b){const m=blank();m.prof=Object.assign({},a.prof,b.prof);
 const un=(k,key)=>{const mp=new Map();[...(a[k]||[]),...(b[k]||[])].forEach(x=>mp.set(key(x),x));return[...mp.values()]};
 m.workouts=un('workouts',x=>x.id);m.food=un('food',x=>x.date);m.weights=un('weights',x=>x.date);m.navy=un('navy',x=>x.id);m.templates=un('templates',x=>x.id);m.reminders=Object.assign({},a.reminders,b.reminders);m.water=un('water',x=>x.date);m.sleep=un('sleep',x=>x.date);return m}
async function pull(){if(!ref)return;try{const sn=await ref.get(),rt=sn.exists?(sn.data().t||0):0,lt=S._t||0;
 if(sn.exists&&!S._sy){S=mergeS(JSON.parse(sn.data().s),S);S._sy=1;save();const a0=document.activeElement;if(!(a0&&/INPUT|TEXTAREA/.test(a0.tagName)))go(tab);return}
 S._sy=1;
 if(rt>lt){S=Object.assign(blank(),JSON.parse(sn.data().s));loc();const a=document.activeElement;if(!(a&&/INPUT|TEXTAREA/.test(a.tagName)))go(tab)}
 else if(lt>rt)ref.set({s:JSON.stringify(S),t:lt})}catch(e){}}
async function initSync(){try{if(!window.claude)return;const[u,d]=await Promise.all([claude.use("user"),claude.use("db")]);if(!u||!d)return;const id=await u.id();if(!id)return;
 ref=d.doc("data/users/"+id+"/forma");SYNC=true;await pull();if(tab==="ex")ex();if(typeof initReminders==="function")initReminders()}catch(e){}}
const $=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const uid=()=>Math.random().toString(36).slice(2,9);
const mon=d=>{const t=new Date(d+"T12:00:00");const k=(t.getDay()+6)%7;t.setDate(t.getDate()-k);return t.toISOString().slice(0,10)};
const num=v=>{const n=parseFloat(String(v).replace(",","."));return isNaN(n)?null:n};
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const f=(n,d=1)=>n==null?"–":n.toFixed(d).replace(".",",");
let tab="ov",charts={};
function mk(id,cfg){if(charts[id])charts[id].destroy();const el=document.getElementById(id);if(!el)return;
 const mute=css("--mute"),line=css("--line");
 cfg.options=Object.assign({responsive:true,maintainAspectRatio:false,interaction:{mode:"index",intersect:false},
  scales:{x:{ticks:{color:mute,maxTicksLimit:7},grid:{display:false}},y:{ticks:{color:mute},grid:{color:line}}},
  plugins:{legend:{labels:{color:mute},display:cfg.data.datasets.length>1}}},cfg.options||{});
 charts[id]=new Chart(el,cfg)}
const ds=(label,data,color,o={})=>Object.assign({label,data,borderColor:color,backgroundColor:color,tension:.25,pointRadius:3,borderWidth:2},o);
const short=d=>d.slice(5).replace("-",".");
