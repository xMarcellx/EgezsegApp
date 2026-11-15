function wt(){
 const l=[...S.weights].sort((a,b)=>a.date<b.date?1:-1);
 $("#app").innerHTML=`<div class="card"><h2>Heti mérés</h2><div class="row">
 <label>Dátum<input type="date" id="wdt" value="${today()}"></label>
 <label>Testsúly (kg)<input type="number" min="10" max="500" step="0.1" id="wkg"></label>
 <button class="btn" onclick="addWt()">Mentés</button></div><p id="weightStatus" class="mute" role="status" aria-live="polite"></p></div>
 <div class="card"><h2>Alakulás</h2><div class="cv"><canvas id="w1"></canvas></div></div>
 <div class="card scroll"><table><tr><th>Dátum</th><th>kg</th><th>Változás</th><th></th></tr>
 ${l.map((x,i)=>{const p=l[i+1],d=p?x.kg-p.kg:null;return`<tr><td>${x.date}</td><td>${f(x.kg)}</td><td class="${d>0?"pos":"neg"}">${d==null?"–":(d>0?"+":"")+f(d)}</td>
 <td><button class="x" onclick="delWt('${x.date}')">✕</button></td></tr>`}).join("")}</table></div>`;
 const a=[...S.weights].sort((a,b)=>a.date<b.date?-1:1);
 mk("w1",{type:"line",data:{labels:a.map(x=>short(x.date)),datasets:[ds("kg",a.map(x=>x.kg),css("--a"))]}});
}
function addWt(){
 const k=num($("#wkg").value),status=$("#weightStatus");
 if(k==null||k<10||k>500){status.textContent="A testsúly 10 és 500 kg közé essen.";return}
 const d=$("#wdt").value||today();
 S.weights=S.weights.filter(x=>x.date!==d);S.weights.push({date:d,kg:k});save();wt();
 $("#weightStatus").textContent="A testsúly elmentve.";
}
function delWt(d){S.weights=S.weights.filter(x=>x.date!==d);save();wt()}

// ---- Navy módszer
function navyCalc(sex,h,n,w,hp){
 if(!h||!n||!w||(sex==="f"&&!hp))return null;
 const L=Math.log10;let bf;
 if(sex==="m"){if(w<=n)return null;bf=495/(1.0324-0.19077*L(w-n)+0.15456*L(h))-450}
 else{if(w+hp<=n)return null;bf=495/(1.29579-0.35004*L(w+hp-n)+0.221*L(h))-450}
 return bf>0&&bf<70?bf:null}
function cat(sex,b){const t=sex==="m"?[[6,"Esszenciális"],[14,"Sportoló"],[18,"Fitt"],[25,"Átlagos"]]:[[14,"Esszenciális"],[21,"Sportoló"],[25,"Fitt"],[32,"Átlagos"]];
 for(const[m,n]of t)if(b<m)return n;return"Magas"}
function bf(){
 const l=[...S.navy].sort((a,b)=>a.date<b.date?1:-1);
 $("#app").innerHTML=`<div class="card"><h2>Navy testzsír-kalkulátor</h2>
 <p class="mute">Centiméterben mérj: a nyakat a gégefő alatt, a derekat férfiaknál a köldök magasságában, nőknél a legkeskenyebb ponton, a csípőt a legszélesebb ponton.</p>
 <div class="row"><label>Nem<select id="ns" onchange="nv()"><option value="m" ${S.prof.sex==="m"?"selected":""}>Férfi</option><option value="f" ${S.prof.sex==="f"?"selected":""}>Nő</option></select></label>
 <label>Magasság (cm)<input type="number" id="nh" value="${S.prof.h}" oninput="nv()"></label>
 <label>Nyak (cm)<input type="number" step="0.1" id="nn" oninput="nv()"></label>
 <label>Derék (cm)<input type="number" step="0.1" id="nw" oninput="nv()"></label>
 <label id="hl">Csípő (cm)<input type="number" step="0.1" id="nhp" oninput="nv()"></label></div>
 <div style="margin:16px 0"><div class="big" id="nr">–</div><div id="nx" class="mute">Töltsd ki a mezőket.</div></div>
 <button class="btn" onclick="addN()">Mentés a mai dátummal</button></div>
 <div class="card"><h2>Alakulás</h2><div class="cv"><canvas id="n1"></canvas></div></div>
 <div class="card scroll"><table><tr><th>Dátum</th><th>Testzsír</th><th>Derék</th><th>Nyak</th><th></th></tr>
 ${l.map(x=>`<tr><td>${x.date}</td><td>${f(x.bf)}%</td><td>${x.w}</td><td>${x.n}</td><td><button class="x" onclick="delN('${x.id}')">✕</button></td></tr>`).join("")}</table></div>`;
 nv(1);const a=[...l].reverse();
 mk("n1",{type:"line",data:{labels:a.map(x=>short(x.date)),datasets:[ds("%",a.map(x=>x.bf),css("--c"))]}});
}
function nvals(){return{sex:$("#ns").value,h:num($("#nh").value),n:num($("#nn").value),w:num($("#nw").value),hp:num($("#nhp").value)}}
function nv(){const v=nvals();$("#hl").style.display=v.sex==="f"?"":"none";
 const b=navyCalc(v.sex,v.h,v.n,v.w,v.hp);
 if(b==null){$("#nr").textContent="–";$("#nx").textContent="Töltsd ki a mezőket.";return}
 $("#nr").textContent=f(b)+"%";
 const w=[...S.weights].sort((a,b)=>a.date<b.date?-1:1).at(-1);let t="Kategória: "+cat(v.sex,b);
 if(w){const fm=w.kg*b/100;t+=` · zsírtömeg ${f(fm)} kg · zsírmentes tömeg ${f(w.kg-fm)} kg · BMI ${f(w.kg/Math.pow(v.h/100,2))}`}
 $("#nx").textContent=t}
function addN(){const v=nvals(),b=navyCalc(v.sex,v.h,v.n,v.w,v.hp);if(b==null)return;
 S.prof={sex:v.sex,h:v.h};S.navy.push({id:uid(),date:today(),sex:v.sex,h:v.h,n:v.n,w:v.w,hp:v.hp,bf:b});save();bf()}
function delN(id){S.navy=S.navy.filter(x=>x.id!==id);save();bf()}
