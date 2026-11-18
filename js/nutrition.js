function fd(){
 const l=[...S.food].sort((a,b)=>a.date<b.date?1:-1);
 $("#app").innerHTML=`<div class="card"><h2>Napi kalória</h2><div class="row">
 <label>Dátum<input type="date" id="fdt" value="${today()}"></label>
 <label>Bevitt kcal<input type="number" id="fin" min="0" max="20000" oninput="if(this.value<0)this.value=0" placeholder="2200"></label>
 <label>Elégetett kcal<input type="number" id="fout" min="0" max="20000" oninput="if(this.value<0)this.value=0" placeholder="2600"></label>
 <button class="btn" onclick="addF()">Mentés</button></div>
 <p id="foodStatus" class="mute" role="status" aria-live="polite"></p>
 <p class="mute">Ha ugyanarra a napra újra mentesz, felülírja az előzőt. Negatív egyenleg = kalóriadeficit.</p></div>
 <div class="card"><h2>Utolsó 21 nap</h2><div class="cv"><canvas id="f1"></canvas></div></div>
 <div class="card scroll"><table><tr><th>Nap</th><th>Bevitt</th><th>Elégetett</th><th>Egyenleg</th><th></th></tr>
 ${l.map(x=>{const b=x.out!=null?x.in-x.out:null;return`<tr><td>${x.date}</td><td>${x.in}</td><td>${x.out??"–"}</td>
 <td class="${b>0?"pos":"neg"}">${b==null?"–":(b>0?"+":"")+b}</td><td><button class="x" onclick="delF('${x.date}')">✕</button></td></tr>`}).join("")}</table></div>`;
 const a=[...S.food].sort((a,b)=>a.date<b.date?-1:1).slice(-21);
 mk("f1",{type:"line",data:{labels:a.map(x=>short(x.date)),datasets:[ds("Bevitt",a.map(x=>x.in),css("--b")),ds("Elégetett",a.map(x=>x.out),css("--c")),
  ds("Egyenleg",a.map(x=>x.out!=null?x.in-x.out:null),css("--a"),{borderDash:[5,4]})]}});
}
function addF(){
 const status=$("#foodStatus"),i=num($("#fin").value),o=$("#fout").value===""?null:num($("#fout").value),d=$("#fdt").value||today();
 if(i==null||i<0||i>20000){status.textContent="A bevitt kalória 0 és 20 000 kcal közé essen.";return}
 if(o!=null&&(o<0||o>20000)){status.textContent="Az elégetett kalória 0 és 20 000 kcal közé essen.";return}
 S.food=S.food.filter(x=>x.date!==d);S.food.push({date:d,in:i,out:o});save();fd();
 $("#foodStatus").textContent="A napi adat elmentve.";
}
function delF(d){S.food=S.food.filter(x=>x.date!==d);save();fd()}
