const REMINDER_OPTIONS=[
 ["workout","Edzés"],
 ["water","Víz"],
 ["sleep","Alvásnapló"],
 ["measurement","Testsúlymérés"],
 ["backup","Adatmentés"]
];
let reminderTimer=null,reminderVisibilityBound=false;

function reminderPanel(){
 const reminder=S.reminders||{enabled:false,type:"water",time:"20:00"};
 return `<div class="card"><h2>Napi emlékeztető</h2>
 <p class="mute">Állíts be egy napi értesítést; az adatmentési emlékeztető vasárnap érkezik. Az alkalmazásnak nyitva kell lennie, bezárt böngésző mellett nem jelez.</p>
 <div class="row"><label>Téma<select id="reminderType">${REMINDER_OPTIONS.map(([value,label])=>`<option value="${value}" ${reminder.type===value?"selected":""}>${label}</option>`).join("")}</select></label>
 <label>Időpont<input id="reminderTime" type="time" value="${esc(reminder.time||"20:00")}"></label>
 <button class="btn" onclick="enableReminder()">Emlékeztető bekapcsolása</button>
 ${reminder.enabled?`<button class="btn ghost" onclick="disableReminder()">Kikapcsolás</button>`:""}</div>
 <p id="reminderStatus" class="mute" role="status" aria-live="polite">${reminder.enabled?"Az emlékeztető be van kapcsolva, amíg ez az oldal nyitva van.":""}</p></div>`;
}

function reminderMessage(type){
 const messages={
  workout:["Forma – edzés-emlékeztető","Ha ma terveztél edzeni, itt az ideje feljegyezni az edzésed."],
  water:["Forma – vízemlékeztető","Nézd meg a mai víznaplódat, és rögzítsd, amit ittál."],
  sleep:["Forma – alvásnapló","Ne felejtsd el rögzíteni a legutóbbi alvásodat."],
  measurement:["Forma – testsúlymérés","Ha ma van a szokásos mérési napod, rögzítsd a testsúlyodat."],
  backup:["Forma – adatmentés","A heti adatmentési emlékeztetőd: töltsd le a mentésfájlt a Mentés fülön."]
 };
 return messages[type]||messages.water;
}

async function enableReminder(){
 const status=$("#reminderStatus");
 if(!window.Notification){
  status.textContent="Ez a böngésző nem támogatja az értesítéseket.";
  return;
 }
 if(window.Notification.permission==="denied"){
  status.textContent="Az értesítéseket a böngésző letiltotta. Engedélyezd az oldal beállításaiban, majd próbáld újra.";
  return;
 }
 try{
  const permission=window.Notification.permission==="granted"
   ?"granted"
   :await window.Notification.requestPermission();
  if(permission!=="granted"){
   status.textContent="Értesítési engedély nélkül az emlékeztető nem kapcsolható be.";
   return;
  }
  S.reminders={
   enabled:true,
   type:$("#reminderType").value,
   time:$("#reminderTime").value,
   lastDate:S.reminders?.lastDate||""
  };
  if(!S.reminders.time)S.reminders.time="20:00";
  save();ex();
  $("#reminderStatus").textContent="Az emlékeztető bekapcsolva. Az oldal legyen nyitva a kiválasztott időpontban.";
  initReminders();
 }catch(error){
  status.textContent="Nem sikerült bekapcsolni az emlékeztetőt. Ellenőrizd a böngésző értesítési engedélyeit.";
 }
}

function disableReminder(){
 S.reminders=Object.assign({},S.reminders,{enabled:false});
 save();initReminders();ex();
 $("#reminderStatus").textContent="Az emlékeztető kikapcsolva.";
}

function checkReminder(){
 const reminder=S.reminders;
 if(!reminder?.enabled||!window.Notification||window.Notification.permission!=="granted")return;
 const now=new Date();
 const date=today();
 if(reminder.lastDate===date)return;
 if(reminder.type==="backup"&&now.getDay()!==0)return;
 const time=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
 if(time<(reminder.time||"20:00"))return;
 const[title,body]=reminderMessage(reminder.type);
 try{
  new window.Notification(title,{body,tag:`forma-${reminder.type}-${date}`});
  S.reminders=Object.assign({},reminder,{lastDate:date});
  save();
 }catch(error){
  if(tab==="ex"){
   const status=$("#reminderStatus");
   if(status)status.textContent="Az értesítés megjelenítése nem sikerült. Ellenőrizd a böngésző engedélyeit.";
  }
 }
}

function initReminders(){
 if(reminderTimer)clearInterval(reminderTimer);
 if(!S.reminders?.enabled)return;
 checkReminder();
 reminderTimer=setInterval(checkReminder,30000);
 if(!reminderVisibilityBound){
  document.addEventListener("visibilitychange",()=>{
   if(!document.hidden)checkReminder();
  });
  reminderVisibilityBound=true;
 }
}
