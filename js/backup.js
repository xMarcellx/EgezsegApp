function ex(){
 $("#app").innerHTML=`<div class="card"><h2>Adatok mentése és visszatöltése</h2>
 <p class="mute">${SYNC?"A szinkron be van kapcsolva: ugyanazzal a Claude-fiókkal megnyitva a telefonodon és a gépeden ugyanazt látod. A fájlba mentés plusz biztonsági másolatnak jó.":"A szinkron most nem elérhető (jelentkezz be a Claude-fiókodba ezen az eszközön), ezért az adatok csak ebben a böngészőben vannak. Készíts rendszeresen mentést."}</p>
 <p><button class="btn" onclick="dl()">Mentés fájlba</button></p>
 <label>Visszatöltés mentett fájlból<input type="file" accept=".json" onchange="up(this.files[0])"></label>
 <p id="em" class="mute" role="status" aria-live="polite"></p></div>
 <div class="card"><h2>Összefoglaló exportálása</h2><p class="mute">Töltsd le a naplódat táblázatként, heti vagy havi bontásban.</p>
 <div class="row"><button class="btn ghost" onclick="downloadReport('week')">Heti CSV</button><button class="btn ghost" onclick="downloadReport('month')">Havi CSV</button></div>
 <p id="reportStatus" class="mute" role="status" aria-live="polite"></p></div>
 ${aiPanel()}
 ${reminderPanel()}
 <div class="card"><h2>Telepítés a telefonra</h2><p class="mute">iPhone: nyisd meg Safariban, majd Megosztás, Főképernyőhöz adás. Android: Chrome menü, Hozzáadás a kezdőképernyőhöz. Utána külön appként, teljes képernyőn indul.</p></div>`}
function dl(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:"application/json"}));a.download="forma-mentes.json";a.click()}
function reportDateRange(period){
 const current=new Date(today()+"T12:00:00");
 if(period==="week"){
  const start=mon(today()),end=new Date(start+"T12:00:00");
  end.setDate(end.getDate()+6);
  return{start,end:end.toISOString().slice(0,10)};
 }
 const start=new Date(current.getFullYear(),current.getMonth(),1,12);
 const end=new Date(current.getFullYear(),current.getMonth()+1,0,12);
 return{start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)};
}
function csvCell(value,text=false){
 let result=String(value??"");
 if(text&&/^\s*[=+\-@]/.test(result))result="'"+result;
 return`"${result.replace(/"/g,'""')}"`;
}
function downloadReport(period){
 const status=$("#reportStatus"),range=reportDateRange(period);
 const dates=[...new Set([
  ...(S.workouts||[]).map(item=>item.date),
  ...(S.food||[]).map(item=>item.date),
  ...(S.weights||[]).map(item=>item.date),
  ...(S.water||[]).map(item=>item.date),
  ...(S.sleep||[]).map(item=>item.date)
 ].filter(date=>date>=range.start&&date<=range.end))].sort();
 if(!dates.length){status.textContent="Ebben az időszakban még nincs exportálható adat.";return}
 const rows=[["Dátum","Edzések","Elvégzett gyakorlatok","Edzés","Bevitt kcal","Elégetett kcal (napló)","Egyenleg kcal","Testsúly kg","Víz ml","Alvás perc"]];
 for(const date of dates){
  const workouts=(S.workouts||[]).filter(item=>item.date===date);
  const exercises=workouts.flatMap(item=>(item.items||[]).filter(entry=>entry.type==="ex"&&entry.done));
  const food=(S.food||[]).find(item=>item.date===date);
  const balance=food&&food.out!=null?Number(food.in)-Number(food.out):"";
  const weight=[...(S.weights||[])].filter(item=>item.date===date).at(-1)?.kg??"";
  const water=(S.water||[]).find(item=>item.date===date)?.ml??"";
  const sleep=(S.sleep||[]).find(item=>item.date===date)?.min??"";
  const details=workouts.flatMap(workout=>(workout.items||[])
   .filter(item=>item.type==="ex"&&item.done)
   .map(item=>`${item.n}${item.kg!=null?` ${item.kg} kg`:""} · ${item.s}×${item.r}`)).join("; ");
  rows.push([date,workouts.length,exercises.length,details,food?.in??"",food?.out??"",balance,weight,water,sleep]);
 }
 const content="\uFEFF"+rows.map((row,index)=>row.map(value=>csvCell(value,index===0||typeof value==="string")).join(",")).join("\r\n");
 const link=document.createElement("a");
 link.href=URL.createObjectURL(new Blob([content],{type:"text/csv;charset=utf-8"}));
 link.download=`forma-${period}-${range.start}.csv`;
 link.click();
 setTimeout(()=>URL.revokeObjectURL(link.href),1000);
 status.textContent=`Elkészült az összefoglaló (${range.start} – ${range.end}).`;
}
function up(file){
 if(!file)return;
 const reader=new FileReader();
 reader.onerror=()=>{$("#em").textContent="A mentésfájl olvasása nem sikerült."};
 reader.onload=()=>{
  try{
   const data=JSON.parse(reader.result);
   if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("invalid_backup");
   for(const key of ["workouts","food","weights","navy"]){
    if(data[key]!=null&&!Array.isArray(data[key]))throw new Error("invalid_backup");
   }
   if(data.workouts?.some(item=>!item||!Array.isArray(item.items)))throw new Error("invalid_backup");
   S=Object.assign(S,data);
   if(!Array.isArray(S.templates))S.templates=[];
   if(!S.reminders||typeof S.reminders!=="object")S.reminders={enabled:false,type:"water",time:"20:00",lastDate:""};
   save();ex();$("#em").textContent="Sikeres visszatöltés.";
  }catch(e){$("#em").textContent="A mentésfájl hibás vagy nem a Forma alkalmazásból származik."}
 };
 reader.readAsText(file);
}
