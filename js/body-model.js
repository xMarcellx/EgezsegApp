const MODEL_MUSCLES=[
 ["chest","Mellkas"],
 ["back","Hát"],
 ["shoulders","Váll"],
 ["biceps","Bicepsz"],
 ["triceps","Tricepsz"],
 ["core","Has"],
 ["glutes","Farizom"],
 ["quads","Comb elülső része"],
 ["hamstrings","Combhajlító"],
 ["calves","Vádli"]
];
const EXERCISE_MUSCLES={
 chest:["mell","fekvenyom","fekve nyom","bench","push up","pushup","fekvotamasz","tolodzkod"],
 back:["hat","evez","lehuz","huzodzkod","felhuzas","deadlift","lat pulldown"],
 shoulders:["vall","oldalemel","overhead","shoulder press","face pull"],
 biceps:["bicepsz","biceps","curl","kalapacshajl","karhajl"],
 triceps:["tricepsz","triceps","letolas","francia nyomas","triceps nyujt","tolodzkod"],
 core:["plank","haspres","hasizom","has ","törzs","torzs","sit-up","felulés","felules","labemeles"],
 glutes:["fenek","fariz","hip thrust","csipotolas","glute","guggol","kitore","kitör","roman felhuz"],
 quads:["guggol","labnyujt","labtolo","leg press","kitore","kitör","squat","quad"],
 hamstrings:["combhajl","labhajl","hamstring","roman felhuz","felhuz","deadlift"],
 calves:["vadli","labujjhegy","calf"]
};
let bodyModelState=null;

function normalizedExerciseName(name){
 return String(name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}

function recentMuscleActivity(){
 const totals=Object.fromEntries(MODEL_MUSCLES.map(([key])=>[key,0]));
 const now=new Date(today()+"T12:00:00").getTime();
 for(const workout of S.workouts||[]){
  const date=new Date(String(workout.date)+"T12:00:00").getTime();
  const age=(now-date)/86400000;
  if(!Number.isFinite(date)||age<0||age>28)continue;
  for(const item of workout.items||[]){
   if(item.type!=="ex"||!item.done)continue;
   const name=normalizedExerciseName(item.n);
   const sets=Math.max(1,Number(item.s)||1);
   for(const [group,terms] of Object.entries(EXERCISE_MUSCLES)){
    if(terms.some(term=>name.includes(normalizedExerciseName(term))))totals[group]+=sets;
   }
  }
 }
 return totals;
}

function modelSnapshots(){
 const weights=[...(S.weights||[])].filter(item=>Number(item.kg)>0).sort((a,b)=>a.date<b.date?-1:1);
 if(!weights.length)return[];
 const bodyFat=[...(S.navy||[])].filter(item=>Number(item.bf)>0&&Number(item.bf)<70).sort((a,b)=>a.date<b.date?-1:1);
 const dates=[...new Set([...weights,...bodyFat].map(item=>item.date).filter(Boolean))]
  .filter(date=>weights.some(item=>item.date<=date)).sort();
 const latestProfileHeight=Number(S.prof?.h);
 const profileHeight=latestProfileHeight>=100&&latestProfileHeight<=250?latestProfileHeight:null;
 const profileSex=S.prof?.sex==="f"||S.prof?.sex==="m"?S.prof.sex:null;
 const atDate=(records,date)=>records.filter(item=>item.date<=date).at(-1)||null;
 return dates.map(date=>{
  const weight=atDate(weights,date);
  const composition=atDate(bodyFat,date);
  const historicalHeight=Number(composition?.h);
  const height=profileHeight||((historicalHeight>=100&&historicalHeight<=250)?historicalHeight:null);
  const sex=composition?.sex==="f"||composition?.sex==="m"?composition.sex:profileSex;
  const value=Number(weight.kg);
  const bmi=height?value/Math.pow(height/100,2):null;
  return{
   date,
   weight:value,
   bodyFat:composition?Number(composition.bf):null,
   height,
   sex,
   bmi,
   bodyFatDate:composition?.date||null
  };
 });
}

function interpolateSnapshot(snapshots,progress){
 if(!snapshots.length)return null;
 const position=Math.max(0,Math.min(1,progress))*(snapshots.length-1);
 const index=Math.min(snapshots.length-1,Math.floor(position));
 const first=snapshots[index],last=snapshots[Math.min(index+1,snapshots.length-1)];
 const fraction=position-index;
 const mix=(a,b)=>a==null?b:b==null?a:a+(b-a)*fraction;
 const height=mix(first.height,last.height)||175;
 const weight=mix(first.weight,last.weight);
 const sex=fraction<.5?first.sex:last.sex;
 const defaultBodyFat=sex==="f"?30:sex==="m"?20:25;
 const firstBodyFat=first.bodyFat??(first.sex==="f"?30:first.sex==="m"?20:25);
 const lastBodyFat=last.bodyFat??(last.sex==="f"?30:last.sex==="m"?20:25);
 return{
  weight,
  bodyFat:mix(firstBodyFat,lastBodyFat)??defaultBodyFat,
  height,
  sex,
  bmi:weight?weight/Math.pow(height/100,2):null
 };
}

function bodyModelPanel(){
 const snapshots=modelSnapshots();
 const muscles=recentMuscleActivity();
 const active=MODEL_MUSCLES.filter(([key])=>muscles[key]>0);
 const first=snapshots[0],last=snapshots.at(-1);
 const dataList=last
  ?`<li><span>Testsúly</span><b>${f(first.weight)} <i>→</i> ${f(last.weight)} kg<small>${esc(first.date)} → ${esc(last.date)}</small></b></li>
   <li><span>Testmagasság</span><b>${last.height?`${f(last.height,0)} cm`:"nincs megadva"}</b></li>
   <li><span>Testzsír (Navy)</span><b>${last.bodyFat==null?"nincs mérés":`${f(last.bodyFat)}%`}<small>${last.bodyFatDate?esc(last.bodyFatDate):"A forma becsléséhez nem használunk testzsíradatot."}</small></b></li>`
  :`<li class="mute">A személyre szabáshoz adj meg testsúlyt a Testsúly fülön. Addig sematikus alak látható.</li>`;
 const muscleList=active.length
  ?active.map(([key,label])=>`<li><span class="muscle-dot"></span><span>${label}</span><b>${muscles[key]} szett</b></li>`).join("")
  :`<li class="mute">Az elmúlt 28 napban nincs kipipált, azonosítható gyakorlat.</li>`;
 const firstDate=first?.date||"–";
 const lastDate=last?.date||"–";
 const canCompare=snapshots.length>1;
 return `<section class="card body-model-card">
 <h2>Testalkat-becslés és edzésaktivitás</h2>
 <p class="mute">A forgó sziluett a rögzített testsúly, magasság és elérhető Navy-testzsír adataiból számolt, szemléltető becslés. Az edzésadat csak az elmúlt 28 napban kipipált izomcsoportokat emeli ki. Ez nem 3D testszkennelés, és nem mér izomnövekedést.</p>
 <div class="body-model-layout"><div class="model-stage"><canvas id="bodyModelCanvas" aria-label="Lassan forgó, naplózott testsúlyból és testösszetételből számolt 3D testalkat-becslés"></canvas><span class="model-orbit-label">SZEMLÉLTETŐ BECSLÉS · 3D NÉZET</span></div>
 <aside class="model-legend"><h3>Naplózott adatok</h3><ul>${dataList}</ul><h3>Aktív izomcsoportok</h3><ul>${muscleList}</ul><p class="model-key"><span class="muscle-dot"></span> Fehér kiemelés = kipipált edzés</p></aside></div>
 <div class="model-timeline"><label for="modelTimeline">Kezdet <span>${esc(firstDate)}</span></label>
 <input id="modelTimeline" type="range" min="0" max="100" step="1" value="${canCompare?"0":"100"}" ${canCompare?"":"disabled"} oninput="scrubBodyModel(this.value)" aria-label="Átmenet az első és a legutóbbi naplózott testsúly és testösszetétel között">
 <label for="modelTimeline">Legutóbbi <span>${esc(lastDate)}</span></label>
 <button class="btn ghost" id="modelPlayback" onclick="toggleBodyModelPlayback()" ${canCompare?"":"disabled"}>Lejátszás</button></div>
 <p class="model-data-note">A méretváltozás a testsúly, a magasság és a korábban elmentett testzsírbecslés alapján szemléltet. A kalória-, étkezés-, alvás- és folyadéknapló önmagában nem mutatja meg a test alakját, ezért ezeket nem alakítjuk át kitalált méretváltozássá.</p>
 <p id="bodyModelStatus" class="model-status" role="status" aria-live="polite"></p></section>`;
}

function torsoRadiusAt(y,values){
 const knots=[
  [.86,values.hips*.72],
  [1.02,values.hips],
  [1.18,values.hips],
  [1.36,values.waist],
  [1.53,values.waist],
  [1.72,values.chest],
  [1.98,values.chest],
  [2.18,values.chest*.72]
 ];
 for(let index=0;index<knots.length-1;index++){
  const [startY,startRadius]=knots[index];
  const [endY,endRadius]=knots[index+1];
  if(y<=endY){
   const t=Math.max(0,Math.min(1,(y-startY)/(endY-startY)));
   const smooth=t*t*(3-2*t);
   return startRadius+(endRadius-startRadius)*smooth;
  }
 }
 return knots.at(-1)[1];
}

function makeTorsoGeometry(THREE){
 const radialSegments=40,verticalSegments=28,lowerY=.86,upperY=2.18;
 const positions=new Float32Array((radialSegments+1)*(verticalSegments+1)*3);
 const indices=[];
 for(let row=0;row<=verticalSegments;row++){
  const y=lowerY+(upperY-lowerY)*row/verticalSegments;
  for(let column=0;column<=radialSegments;column++){
   const angle=column/radialSegments*Math.PI*2;
   const offset=(row*(radialSegments+1)+column)*3;
   positions[offset]=Math.cos(angle);
   positions[offset+1]=y;
   positions[offset+2]=Math.sin(angle);
  }
 }
 for(let row=0;row<verticalSegments;row++){
  for(let column=0;column<radialSegments;column++){
   const a=row*(radialSegments+1)+column;
   const b=a+radialSegments+1;
   indices.push(a,b,a+1,b,b+1,a+1);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute("position",new THREE.BufferAttribute(positions,3));
 geometry.setIndex(indices);
 const update=values=>{
  for(let row=0;row<=verticalSegments;row++){
   const y=lowerY+(upperY-lowerY)*row/verticalSegments;
   const radius=torsoRadiusAt(y,values);
   for(let column=0;column<=radialSegments;column++){
    const angle=column/radialSegments*Math.PI*2;
    const offset=(row*(radialSegments+1)+column)*3;
    positions[offset]=Math.cos(angle)*radius;
    positions[offset+2]=Math.sin(angle)*radius*.64;
   }
  }
  geometry.attributes.position.needsUpdate=true;
  geometry.computeVertexNormals();
 };
 return{geometry,update};
}

function addModelBall(THREE,parent,geometry,material,x,y,z,sx,sy,sz){
 const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(x,y,z);
 mesh.scale.set(sx,sy,sz);
 parent.add(mesh);
 return mesh;
}

function createAnatomy(THREE,root){
 const sphere=new THREE.SphereGeometry(1,24,16);
 const skin=new THREE.MeshStandardMaterial({color:0xd9b39a,roughness:.82});
 const inactive=new THREE.Color(0xa9826f);
 const active=new THREE.Color(0xffffff);
 const muscleMaterials={};
 const muscle=(group,x,y,z,sx,sy,sz)=>{
  const material=muscleMaterials[group]||(muscleMaterials[group]=new THREE.MeshStandardMaterial({color:inactive,roughness:.72}));
  return addModelBall(THREE,root,sphere,material,x,y,z,sx,sy,sz);
 };
 const torso=makeTorsoGeometry(THREE);
 const torsoMesh=new THREE.Mesh(torso.geometry,skin);
 root.add(torsoMesh);
 const skinParts={upperArms:[],thighs:[]};
 addModelBall(THREE,root,sphere,skin,0,1.04,0,.24,.25,.16);
 addModelBall(THREE,root,sphere,skin,0,2.24,0,.085,.16,.09);
 addModelBall(THREE,root,sphere,skin,0,2.48,0,.155,.19,.14);
 for(const side of [-1,1]){
  const upper=addModelBall(THREE,root,sphere,skin,side*.37,1.78,0,.105,.32,.11);
  addModelBall(THREE,root,sphere,skin,side*.43,1.34,0,.075,.27,.078);
  addModelBall(THREE,root,sphere,skin,side*.44,1.02,0,.075,.09,.075);
  skinParts.upperArms.push({mesh:upper,side});
  const thigh=addModelBall(THREE,root,sphere,skin,side*.14,.64,0,.14,.41,.145);
  addModelBall(THREE,root,sphere,skin,side*.14,.22,0,.095,.34,.1);
  addModelBall(THREE,root,sphere,skin,side*.14,.075,.085,.105,.075,.2);
  skinParts.thighs.push({mesh:thigh,side});
  muscle("chest",side*.13,1.88,.148,.135,.09,.038);
  muscle("shoulders",side*.335,2.02,.005,.105,.12,.105);
  muscle("biceps",side*.37,1.76,.085,.064,.17,.036);
  muscle("triceps",side*.37,1.76,-.083,.062,.17,.034);
  muscle("back",side*.19,1.78,-.127,.13,.23,.034);
  muscle("core",side*.065,1.61,.137,.055,.06,.022);
  muscle("core",side*.065,1.49,.14,.055,.06,.022);
  muscle("core",side*.065,1.37,.13,.055,.055,.021);
  muscle("core",side*.205,1.5,.025,.052,.17,.055);
  muscle("glutes",side*.12,1.035,-.137,.115,.14,.037);
  const quad=muscle("quads",side*.14,.66,.105,.09,.26,.042);
  muscle("hamstrings",side*.14,.66,-.105,.09,.25,.04);
  muscle("calves",side*.14,.255,-.048,.075,.2,.055);
  if(!skinParts.quads)skinParts.quads=[];
  skinParts.quads.push({mesh:quad,side});
 }
 return{sphere,skin,muscleMaterials,skinParts,torsoUpdate:torso.update,dispose:torso.geometry};
}

function currentModelValues(state,progress){
 const snapshot=interpolateSnapshot(state.snapshots,progress);
 const height=snapshot?.height||175;
 const sex=snapshot?.sex||"m";
 const bmi=snapshot?.bmi||(snapshot?.weight?Number(snapshot.weight)/Math.pow(height/100,2):22.5);
 const referenceBf=sex==="f"?30:sex==="m"?20:25;
 const bodyFat=snapshot?.bodyFat??referenceBf;
 const massScale=Math.max(.78,Math.min(1.3,Math.pow(bmi/22.5,.45)));
 const fatScale=Math.max(-.35,Math.min(.8,(bodyFat-referenceBf)/28));
 return{
  height:Math.max(.82,Math.min(1.22,height/175)),
  chest:Math.max(.15,Math.min(.38,.235*massScale*(1+fatScale*.16))),
  waist:Math.max(.15,Math.min(.4,.2*massScale*(1+fatScale*.5))),
  hips:Math.max(.15,Math.min(.4,.225*massScale*(1+fatScale*.32))),
  arm:Math.max(.055,Math.min(.15,.083*massScale*(1+fatScale*.16))),
  thigh:Math.max(.09,Math.min(.2,.14*massScale*(1+fatScale*.28)))
 };
}

function updateBodyModel(state,progress){
 const values=currentModelValues(state,progress);
 state.root.scale.y=values.height;
 state.anatomy.torsoUpdate(values);
 for(const part of state.anatomy.skinParts.upperArms){
  part.mesh.scale.x=values.arm*1.12;
  part.mesh.position.x=part.side*(.29+values.arm*.65);
 }
 for(const part of state.anatomy.skinParts.thighs){
  part.mesh.scale.x=values.thigh*1.08;
 }
 for(const part of state.anatomy.skinParts.quads){
  part.mesh.scale.x=values.thigh*.66;
  part.mesh.position.x=part.side*(.14+values.thigh*.12);
 }
 const activity=state.activity;
 const max=Math.max(1,...Object.values(activity));
 for(const [group,material] of Object.entries(state.anatomy.muscleMaterials)){
  const sets=activity[group]||0;
  const intensity=sets?Math.min(1,.35+.65*Math.log1p(sets)/Math.log1p(max)):0;
  material.color.copy(state.inactiveColor).lerp(state.activeColor,intensity);
  material.emissive.copy(state.activeColor).multiplyScalar(intensity*.13);
 }
 state.renderer.render(state.scene,state.camera);
}

function updateModelControls(state){
 const slider=document.getElementById("modelTimeline");
 if(slider)slider.value=String(Math.round(state.progressValue*100));
 const button=document.getElementById("modelPlayback");
 if(button)button.textContent=state.playing?"Szünet":"Lejátszás";
}

function scrubBodyModel(value){
 if(!bodyModelState)return;
 bodyModelState.playing=false;
 bodyModelState.progressValue=Math.max(0,Math.min(1,Number(value)/100));
 updateModelControls(bodyModelState);
 updateBodyModel(bodyModelState,bodyModelState.progressValue);
}

function toggleBodyModelPlayback(){
 const state=bodyModelState;
 if(!state||!state.canCompare)return;
 if(state.playing){state.playing=false}
 else{
  if(state.progressValue>=1)state.progressValue=0;
  state.playing=true;
  state.playStart=performance.now();
  state.playFrom=state.progressValue;
  if(!state.frame)state.frame=requestAnimationFrame(state.animate);
 }
 updateModelControls(state);
}

function stopBodyModel(){
 const state=bodyModelState;
 if(!state)return;
 cancelAnimationFrame(state.frame);
 window.removeEventListener("resize",state.onResize);
 state.floor.geometry.dispose();
 state.floor.material.dispose();
 state.anatomy.dispose.dispose();
 state.anatomy.sphere.dispose();
 state.anatomy.skin.dispose();
 for(const material of Object.values(state.anatomy.muscleMaterials))material.dispose();
 state.renderer.dispose();
 bodyModelState=null;
}

function renderBodyModel(){
 const canvas=document.getElementById("bodyModelCanvas");
 if(!canvas)return;
 const status=document.getElementById("bodyModelStatus");
 if(!window.THREE){
  status.textContent="A 3D modell betöltéséhez internetkapcsolat és WebGL-képes böngésző szükséges.";
  return;
 }
 const THREE=window.THREE;
 let renderer;
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
 }catch(error){
  status.textContent="A böngésző nem tudta elindítani a 3D megjelenítést. Próbáld meg WebGL-t támogató, naprakész böngészőben.";
  return;
 }
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(css("--bg"));
 const camera=new THREE.PerspectiveCamera(36,1,.1,30);
 camera.position.set(0,1.58,6.1);
 camera.lookAt(0,1.36,0);
 scene.add(new THREE.HemisphereLight(0xfff4e7,0x34434a,2.1));
 const keyLight=new THREE.DirectionalLight(0xffffff,2.3);
 keyLight.position.set(-3,4,5);
 scene.add(keyLight);
 const rimLight=new THREE.DirectionalLight(0x87d9cc,1.3);
 rimLight.position.set(3,2,-3);
 scene.add(rimLight);
 const floorGeometry=new THREE.CircleGeometry(.85,48);
 const floorMaterial=new THREE.MeshBasicMaterial({color:css("--a"),transparent:true,opacity:.2});
 const floor=new THREE.Mesh(floorGeometry,floorMaterial);
 floor.rotation.x=-Math.PI/2;
 floor.position.y=.015;
 scene.add(floor);
 const root=new THREE.Group();
 root.position.y=.08;
 scene.add(root);
 const anatomy=createAnatomy(THREE,root);
 const snapshots=modelSnapshots();
 const canCompare=snapshots.length>1;
 const reducedMotion=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 const state={
  renderer,scene,camera,root,floor,anatomy,snapshots,activity:recentMuscleActivity(),
  inactiveColor:new THREE.Color(0xa9826f),activeColor:new THREE.Color(0xffffff),
  progressValue:canCompare&&!reducedMotion?0:1,canCompare,
  playing:canCompare&&!reducedMotion,playStart:performance.now(),playFrom:0,
  lastFrame:performance.now(),frame:0
 };
 bodyModelState=state;
 const resize=()=>{
  const width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.setSize(width,height,false);
  camera.aspect=width/height;
  camera.updateProjectionMatrix();
  renderer.render(scene,camera);
 };
 state.onResize=resize;
 window.addEventListener("resize",resize);
 resize();
 updateModelControls(state);
 if(!snapshots.length)status.textContent="Még nincs testsúlyadat; a modell addig sematikus alakot mutat. Testsúlyt a Testsúly fülön tudsz rögzíteni.";
 else if(!snapshots.at(-1).height)status.textContent="Magasságadat nélkül a modell semleges, 175 cm-es viszonyítási arányt használ. A testzsíradat szintén csak akkor módosítja a becslést, ha korábban elmentetted.";
 else if(snapshots.at(-1).bodyFat==null)status.textContent="Testzsíradat nélkül semleges kiinduló testösszetétellel számol. A Navy-érték csak akkor módosítja a becslést, ha korábban elmentetted.";
 else if(snapshots.length===1)status.textContent="A modell egyetlen testsúlyadatból mutat becslést. Újabb naplózott adat után a változás is végigjátszható.";
 else status.textContent="A forgás és az első, illetve legutóbbi naplózott állapot közti átmenet automatikusan elindul. A csúszkával kézzel is vezérelhető.";
 updateBodyModel(state,state.progressValue);
 const animate=now=>{
  if(bodyModelState!==state)return;
  const delta=Math.min(.05,Math.max(0,(now-state.lastFrame)/1000));
  state.lastFrame=now;
  if(state.playing){
   const elapsed=Math.max(0,(now-state.playStart)/1000);
   const raw=Math.min(1,elapsed/7);
   const smooth=raw*raw*(3-2*raw);
   state.progressValue=state.playFrom+(1-state.playFrom)*smooth;
   if(raw>=1)state.playing=false;
   updateModelControls(state);
   updateBodyModel(state,state.progressValue);
  }
  if(!reducedMotion)root.rotation.y+=delta*.035;
  if(!state.playing)renderer.render(scene,camera);
  state.frame=state.playing||!reducedMotion?requestAnimationFrame(animate):0;
 };
 state.animate=animate;
 if(state.playing||!reducedMotion)state.frame=requestAnimationFrame(animate);
}
