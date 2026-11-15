try{const c=document.createElement("canvas");c.width=c.height=180;const x=c.getContext("2d");x.fillStyle="#075e59";x.fillRect(0,0,180,180);x.fillStyle="#fff";x.font="700 112px 'Barlow Condensed','Arial Narrow',sans-serif";x.textAlign="center";x.textBaseline="middle";x.fillText("F",90,96);
 const l=document.createElement("link");l.rel="apple-touch-icon";l.href=c.toDataURL("image/png");document.head.appendChild(l)}catch(e){}
document.addEventListener("visibilitychange",()=>{if(!document.hidden)pull()});
go("ov");
initSync();
initReminders();
