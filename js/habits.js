const WA=()=>S.water=S.water||[],SL=()=>S.sleep=S.sleep||[],asc=(a,b)=>a.date<b.date?-1:1;
let hd=today();
const waterOn=d=>(WA().find(x=>x.date===d)||{ml:0}).ml;
const wGoal=()=>S.prof.wg||2500;
const hm=m=>Math.floor(m/60)+' ó '+String(m%60).padStart(2,'0')+' p';
const sleepAvg=()=>{const a=[...SL()].sort(asc).slice(-7);return a.length?Math.round(avg(a.map(x=>x.min))):null};
const lit=n=>f(n/1000,2)+' l';
function hb(){
 const d=hd,g=wGoal(),ml=waterOn(d),sd=SL().find(x=>x.date===d)||{},wl=[...WA()].sort(asc).reverse(),sl=[...SL()].sort(asc).reverse();
 $('#app').innerHTML=`<div class='card'><div class='row'><label>Nap<input type='date' value='${d}' onchange='hd=this.value||today();hb()'></label><span class='mute'>A víz és az alvás (az ébredés napja) erre a napra mentődik.</span></div></div>
 <div class='card'><h2>Víz</h2><div class='big'>${lit(ml)}</div>
 <div class='mute'>Cél: <input type='number' step='100' value='${g}' style='width:84px' onchange='setWG(this.value)'> ml</div>
 <div style='height:10px;background:var(--bg);border-radius:5px;margin:10px 0;overflow:hidden'><div style='height:100%;width:${Math.min(100,ml/g*100)}%;background:var(--a)'></div></div>
 <div class='row'><button class='btn' onclick='addWa(250)'>+250 ml</button><button class='btn' onclick='addWa(500)'>+500 ml</button><button class='btn ghost' onclick='addWa(-250)'>−250 ml</button>
 <label>Egyéb (ml)<input type='number' id='wam'></label><button class='btn ghost' onclick='addWc()'>Hozzáadás</button></div></div>
 <div class='card'><h2>Alvás</h2><div class='row'><label>Lefekvés<input type='time' id='sf' value='${sd.from||'23:00'}'></label><label>Ébredés<input type='time' id='se' value='${sd.to||'07:00'}'></label><button class='btn' onclick='addSl()'>Mentés</button></div>
 <p class='mute'>${sd.min?'Erre a napra: '+hm(sd.min)+'. ':''}Átlag az utolsó 7 éjszakán: ${sleepAvg()==null?'–':hm(sleepAvg())}.</p></div>
 <div class='grid2'><div class='card'><h2>Víz, utolsó 14 nap (ml)</h2><div class='cv'><canvas id='h1'></canvas></div></div>
 <div class='card'><h2>Alvás, utolsó 14 éjszaka (óra)</h2><div class='cv'><canvas id='h2'></canvas></div></div></div>
 <div class='grid2'><div class='card scroll'><table><tr><th>Nap</th><th>Víz (ml)</th><th></th></tr>${wl.slice(0,14).map(x=>`<tr><td>${x.date}</td><td><input type='number' value='${x.ml}' data-d='${x.date}' onchange='setWa(this.dataset.d,this.value)'></td><td><button class='x' data-d='${x.date}' onclick='delWa(this.dataset.d)'>✕</button></td></tr>`).join('')}</table></div>
 <div class='card scroll'><table><tr><th>Nap</th><th>Alvás</th><th>Idő</th><th></th></tr>${sl.slice(0,14).map(x=>`<tr><td>${x.date}</td><td>${x.from} – ${x.to}</td><td>${hm(x.min)}</td><td><button class='x' data-d='${x.date}' onclick='delSl(this.dataset.d)'>✕</button></td></tr>`).join('')}</table></div></div>`;
 const w14=[...WA()].sort(asc).slice(-14),s14=[...SL()].sort(asc).slice(-14),goal=(l,n,c)=>ds(l,n,c,{type:'line',pointRadius:0,borderDash:[5,4]});
 mk('h1',{type:'bar',data:{labels:w14.map(x=>short(x.date)),datasets:[ds('ml',w14.map(x=>x.ml),css('--a')),goal('Cél',w14.map(()=>g),css('--b'))]}});
 mk('h2',{type:'bar',data:{labels:s14.map(x=>short(x.date)),datasets:[ds('Óra',s14.map(x=>+(x.min/60).toFixed(1)),css('--g')),goal('Cél (8 óra)',s14.map(()=>8),css('--b'))]}});
}
function addWa(n){if(!n)return;const a=WA();let e=a.find(x=>x.date===hd);if(!e){e={date:hd,ml:0};a.push(e)}e.ml=Math.max(0,e.ml+n);save();hb()}
function addWc(){addWa(num($('#wam').value))}
function setWa(d,v){const e=WA().find(x=>x.date===d);if(e){e.ml=Math.max(0,num(v)||0);save();hb()}}
function delWa(d){S.water=WA().filter(x=>x.date!==d);save();hb()}
function setWG(v){S.prof.wg=num(v)||2500;save();hb()}
function addSl(){const t=s=>{const[h,m]=s.split(':').map(Number);return h*60+m},fr=$('#sf').value,to=$('#se').value;if(!fr||!to)return;const min=(t(to)-t(fr)+1440)%1440;if(!min)return;
 S.sleep=SL().filter(x=>x.date!==hd);S.sleep.push({date:hd,from:fr,to:to,min});save();hb()}
function delSl(d){S.sleep=SL().filter(x=>x.date!==d);save();hb()}
