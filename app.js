const $=id=>document.getElementById(id);
const DAY=864e5, KEY="monproyek-v1";
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const pd=s=>new Date(s+"T00:00:00");
const f2=v=>(Math.round(v*100)/100).toFixed(2);
function sCurve(n){const f=t=>t*t*(3-2*t);let a=[],s=0;for(let i=1;i<=n;i++){let v=Math.round((f(i/n)-f((i-1)/n))*10000)/100;a.push(v);s+=v}a[n-1]=Math.round((a[n-1]+100-s)*100)/100;return a}
function def(){const t=iso(new Date());return{name:"Proyek Pembangunan Gedung",start:t,weeks:12,report:t,tol:5,plan:sCurve(12),act:[]}}
const KEY2="monproyek-v2";
function uid(){return "p"+Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
let DB=null,S;
try{DB=JSON.parse(localStorage.getItem(KEY2))}catch(e){}
if(!DB||!DB.list||!DB.list.length){
  let old=null;try{old=JSON.parse(localStorage.getItem(KEY))}catch(e){}
  const p=(old&&old.plan)?old:def();p.id=uid();DB={cur:p.id,list:[p]};
}
S=DB.list.find(p=>p.id===DB.cur)||DB.list[0];
const lsave=()=>{try{localStorage.setItem(KEY2,JSON.stringify(DB))}catch(e){}};
const save=()=>{lsave();qp(S)};
const fmt=d=>d.toLocaleDateString("id-ID",{day:"numeric",month:"short"});

const rpf=v=>'Rp '+Math.round(+v||0).toLocaleString('id-ID');
const fmtL=d=>d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
function metrics(p){
  const d=projData(p),cw=d.cw,planNow=cw?d.P[cw]:0,actNow=cw?d.A[cw]:0,done=actNow>=99.995;
  const rp=pd(p.report),end=pd(endOf(p)),wl=Math.max(0,d.n-cw),lw=d.c.lw,k0=Math.max(0,lw-4);
  let sm=0;for(let i=k0;i<lw;i++)sm+=+p.act[i]||0;
  const avg=lw>k0?sm/(lw-k0):0,nilai=+p.nilai||0;
  let fc=null,fcDelta=null;
  if(!done&&avg>0){fc=new Date(rp.getTime()+Math.ceil((100-actNow)/avg*7)*DAY);fcDelta=Math.round((fc-end)/DAY)}
  return{done,spi:planNow>0?actNow/planNow:null,need:done?0:(wl>0?(100-actNow)/wl:null),avg,fc,fcDelta,nilai,real:nilai*actNow/100};
}
function metricsList(p){
  const m=metrics(p),L=[];
  L.push(['SPI (aktual ÷ rencana)',m.spi==null?'–':f2(m.spi),m.spi==null?'':(m.spi>=1?'sesuai / lebih cepat':'di bawah 1 = terlambat'),m.spi==null?null:(m.spi>=1?'ok':m.spi>=0.9?'warn':'bad')]);
  L.push(['Rata-rata aktual',f2(m.avg)+'%/minggu','4 minggu terakhir',null]);
  L.push(['Dibutuhkan',m.need==null?'Lewat jadwal':f2(m.need)+'%/minggu','agar selesai tepat waktu',(m.need!=null&&m.need>m.avg+0.005&&!m.done)?'bad':null]);
  let pr='–',sub='belum ada progres aktual';
  if(m.done){pr='Selesai';sub=''}else if(m.fc){pr=fmtL(m.fc);sub=m.fcDelta>0?'terlambat '+m.fcDelta+' hari dari jadwal':m.fcDelta<0?'lebih cepat '+(-m.fcDelta)+' hari':'tepat jadwal'}
  L.push(['Prediksi selesai',pr,sub,m.fcDelta==null?null:(m.fcDelta>0?'bad':'ok')]);
  if(m.nilai>0)L.push(['Nilai terealisasi',rpf(m.real),'dari '+rpf(m.nilai)+', sisa '+rpf(m.nilai-m.real),null]);
  return L;
}
function extraCards(p){return metricsList(p).map(x=>`<div class="stat"><span>${x[0]}</span><b class="sm"${x[3]?` style="color:var(--${x[3]})"`:''}>${x[1]}</b><span>${x[2]}</span></div>`).join('')}
function extraKpi(p){const C={ok:'#15803d',warn:'#a16207',bad:'#b91c1c'};return '<div class="k">'+metricsList(p).map(x=>`<div><span>${x[0]}</span><b style="font-size:15px${x[3]?';color:'+C[x[3]]:''}">${x[1]}</b><span>${x[2]}</span></div>`).join('')+'</div>'}
function status(dev,tol,ac){
  if(ac>=99.995)return["Selesai","ok"];
  if(dev>0.005)return["Lebih cepat","ok"];
  if(dev>=-0.005)return["On schedule","ok"];
  if(dev>=-tol)return["Waspada","warn"];
  return["Terlambat (over)","bad"];
}
function build(){
  const n=S.weeks,st=pd(S.start);let h="";
  for(let i=0;i<n;i++){
    const a=new Date(st.getTime()+i*7*DAY),b0=new Date(a.getTime()+6*DAY),en=pd(endOf(S)),b=b0>en?en:b0;
    h+=`<tr id="r${i}"><td>${i+1}</td><td>${fmt(a)} – ${fmt(b)}</td>
    <td><input type="number" step="0.01" min="0" data-k="plan" data-i="${i}" value="${S.plan[i]??0}"></td><td id="pc${i}"></td>
    <td><input type="number" step="0.01" min="0" data-k="act" data-i="${i}" value="${S.act[i]??""}"></td><td id="ac${i}"></td><td id="dv${i}"></td><td id="st${i}"></td><td><input type="text" data-k="note" data-i="${i}" value="${esc(S.notes&&S.notes[i]||'')}" placeholder="Kendala / catatan" style="width:200px;text-align:left"></td></tr>`;
  }
  $("tb").innerHTML=h;
}
function update(){
  const n=S.weeks,st=pd(S.start),rp=pd(S.report);
  const cw=Math.max(0,Math.min(n,Math.floor((rp-st)/DAY/7)+1));
  let lf=0;for(let i=0;i<n;i++)if(S.act[i]!=null)lf=i+1;const lw=Math.max(cw,lf);
  let pc=0,ac=0,P=[0],A=[0],tot=0;
  for(let i=0;i<n;i++){
    pc+=+S.plan[i]||0;P.push(Math.min(pc,100));
    const r=$("r"+i);r.className=(i+1===cw)?"cur":"";
    $("pc"+i).textContent=f2(Math.min(pc,100))+"%";
    if(i<lw){ac+=+S.act[i]||0;A.push(ac);
      const dv=ac-Math.min(pc,100),[t,c]=status(dv,S.tol,ac);
      $("ac"+i).textContent=f2(ac)+"%";
      $("dv"+i).textContent=(dv>0?"+":"")+f2(dv)+"%";
      $("dv"+i).style.color=dv<0?"var(--bad)":"var(--ok)";
      $("st"+i).innerHTML=`<span class="badge ${c}">${t}</span>`;
    }else{$("ac"+i).textContent="–";$("dv"+i).textContent="–";$("st"+i).textContent="–"}
  }
  tot=pc;
  $("psum").textContent="Total rencana: "+f2(tot)+"%"+(Math.abs(tot-100)>0.01?" (harus 100%)":" ✓");
  $("psum").style.color=Math.abs(tot-100)>0.01?"var(--bad)":"var(--mut)";
  const planNow=cw?P[cw]:0,actNow=cw?A[cw]:0,dev=actNow-planNow;
  const end=pd(endOf(S)),left=Math.ceil((end-rp)/DAY);
  let bt,bc;
  if(cw===0){bt="Belum dimulai";bc="idle"}else{[bt,bc]=status(dev,S.tol,actNow)}
  $("sum").innerHTML=
   `<div class="stat"><span>Minggu ke</span><b>${cw}/${n}</b></div>
    <div class="stat"><span>Rencana kumulatif</span><b>${f2(planNow)}%</b></div>
    <div class="stat"><span>Aktual kumulatif</span><b>${f2(actNow)}%</b></div>
    <div class="stat"><span>Deviasi</span><b style="color:${dev<0?"var(--bad)":"var(--ok)"}">${dev>0?"+":""}${f2(dev)}%</b></div>
    <div class="stat"><span>Status</span><b><span class="badge big ${bc}">${bt}</span></b></div>
    <div class="stat"><span>Sisa waktu</span><b style="color:${left<0&&actNow<99.995?'var(--bad)':'inherit'}">${actNow>=99.995?'Selesai':left>=0?left+' hari':'Lewat '+(-left)+' hari'}</b><span>Jadwal selesai ${end.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</span></div>`;
  chart(P,A,cw,n);renderOv();$("sum").insertAdjacentHTML("beforeend",extraCards(S));
}
function chart(P,A,cw,n,ret){
  const X=i=>45+i/n*555,Y=v=>230-Math.min(v,100)/100*210;
  let s="";
  for(let g=0;g<=100;g+=25)s+=`<line x1="45" x2="600" y1="${Y(g)}" y2="${Y(g)}" stroke="var(--bd)"/><text x="38" y="${Y(g)+4}" font-size="11" text-anchor="end" fill="var(--mut)">${g}%</text>`;
  s+=`<text x="45" y="250" font-size="11" fill="var(--mut)">W0</text><text x="322" y="250" font-size="11" text-anchor="middle" fill="var(--mut)">W${Math.round(n/2)}</text><text x="600" y="250" font-size="11" text-anchor="end" fill="var(--mut)">W${n}</text>`;
  s+=`<polyline fill="none" stroke="var(--plan)" stroke-width="2.5" points="${P.map((v,i)=>X(i)+","+Y(v)).join(" ")}"/>`;
  if(cw>0){
    s+=`<line x1="${X(cw)}" x2="${X(cw)}" y1="20" y2="230" stroke="var(--mut)" stroke-dasharray="4 4"/>`;
    s+=`<polyline fill="none" stroke="var(--acc)" stroke-width="2.5" points="${A.map((v,i)=>X(i)+","+Y(v)).join(" ")}"/>`;
    s+=`<circle cx="${X(cw)}" cy="${Y(A[cw])}" r="4.5" fill="var(--acc)"/><circle cx="${X(cw)}" cy="${Y(P[cw])}" r="4.5" fill="var(--plan)"/>`;
  }
  if(ret)return s;$("chart").innerHTML=s;
}
function fill(){["name","kontraktor","lokasi","kontrak","nilai","start","weeks","report","tol"].forEach(k=>$(k).value=S[k]??"");$("end").value=endOf(S)}
function setWeeks(v){
  v=Math.max(1,Math.min(104,Math.round(+v)||1));
  S.weeks=v;S.plan=sCurve(v);S.act=S.act.slice(0,v);S.end=iso(new Date(pd(S.start).getTime()+(v*7-1)*DAY));
}
["name","kontraktor","lokasi","kontrak","nilai","start","report","tol"].forEach(k=>$(k).addEventListener("input",e=>{
  S[k]=k==="tol"?Math.max(0,+e.target.value||0):e.target.value;
  if(!S.start||!S.report){return}
  if(k==="start"){S.end=endOf({start:S.start,weeks:S.weeks});$("end").value=S.end;build()}
  update();save();
}));
function endOf(p){return p.end||iso(new Date(pd(p.start).getTime()+(p.weeks*7-1)*DAY))}
$("weeks").addEventListener("change",e=>{
  const v=Math.max(1,Math.min(104,Math.round(+e.target.value)||1));
  const go=()=>{setWeeks(v);fill();build();update();save()};
  if(S.act.slice(v).some(x=>x!=null))dlg("Mengubah jangka waktu menjadi "+v+" minggu akan menghapus progress aktual di minggu setelahnya, dan rencana Kurva-S dibuat ulang. Lanjutkan?",go,"Lanjutkan");else go();
});
$("end").addEventListener("change",e=>{
  if(!e.target.value)return;
  const days=Math.round((pd(e.target.value)-pd(S.start))/DAY)+1;
  if(days<1||days>728){dlg(days<1?"Tanggal selesai harus setelah tanggal mulai.":"Jangka waktu maksimal 104 minggu.");$("end").value=endOf(S);return}
  const w=Math.ceil(days/7),ev=e.target.value;
  const go=()=>{setWeeks(w);S.end=ev;fill();build();update();save()};
  if(S.act.slice(w).some(x=>x!=null))dlg("Mengubah tanggal selesai akan menghapus progress aktual di minggu setelahnya, dan rencana Kurva-S dibuat ulang. Lanjutkan?",go,"Lanjutkan");else go();
});
$("gen").onclick=()=>{S.plan=sCurve(S.weeks);build();update();save();toast("Rencana dibuat ulang sebagai Kurva-S untuk "+S.weeks+" minggu (total 100%).")};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function calc(p){
  const n=p.weeks,st=pd(p.start),rp=pd(p.report);
  const cw=Math.max(0,Math.min(n,Math.floor((rp-st)/DAY/7)+1));
  let pc=0,ac=0;
  for(let i=0;i<cw;i++){pc+=+p.plan[i]||0;ac+=+p.act[i]||0}
  pc=Math.min(pc,100);
  let lf=0;for(let i=0;i<n;i++)if(p.act[i]!=null)lf=i+1;return{cw,n,pc,ac,dev:ac-pc,lw:Math.max(cw,lf)};
}
function renderOv(){
  $("ov").innerHTML=DB.list.map(p=>{
    const c=calc(p);let t="Belum dimulai",k="idle";
    if(c.cw>0){[t,k]=status(c.dev,+p.tol||0,c.ac)}
    const dv=c.cw>0?`<span style="color:${c.dev<0?"var(--bad)":"var(--ok)"}">${c.dev>0?"+":""}${f2(c.dev)}%</span>`:"–";
    return `<tr class="${p.id===S.id?"cur":""}" data-id="${p.id}" style="cursor:pointer"><td>${esc(p.name||"(tanpa nama)")}</td><td>${esc(p.kontraktor||"–")}</td><td>${esc(p.lokasi||"–")}</td><td>${c.cw}/${c.n}</td><td>${f2(c.pc)}%</td><td>${f2(c.ac)}%</td><td>${dv}</td><td><span class="badge ${k}">${t}</span></td></tr>`;
  }).join("");
}
function openP(id){DB.cur=id;S=DB.list.find(p=>p.id===id)||DB.list[0];fill();build();update();save()}
$("ov").addEventListener("click",e=>{const x=e.target.closest("[data-del]");if(x){delP(x.dataset.del);return}const r=e.target.closest("tr");if(r&&r.dataset.id)openP(r.dataset.id)});
$("add").onclick=()=>{const p=def();p.id=uid();p.name="Proyek "+(DB.list.length+1);DB.list.push(p);openP(p.id)};
let cmCb=null;
function dlg(msg,ok,label){
  $('cmt').textContent=msg;cmCb=ok||null;
  $('cmn').style.display=ok?'':'none';
  const y=$('cmy');y.textContent=ok?(label||'OK'):'Tutup';
  const c=label==='Hapus'?'#b91c1c':'#02448e';y.style.background=c;y.style.borderColor=c;
  $('cm').style.display='flex';if($('cm').scrollIntoView)$('cm').scrollIntoView({block:'center'});
}
$('cmn').onclick=()=>{$('cm').style.display='none';cmCb=null;fill()};
$('cmy').onclick=()=>{$('cm').style.display='none';const f=cmCb;cmCb=null;if(f)f()};
function delP(id){
  const p=DB.list.find(x=>x.id===id);if(!p)return;
  dlg("Hapus proyek "+(p.name||"tanpa nama")+" beserta datanya? Tindakan ini tidak bisa dibatalkan.",()=>{
    DB.list=DB.list.filter(x=>x.id!==id);rdel(id);
    if(!DB.list.length){const n=def();n.id=uid();n.name="Proyek 1";DB.list.push(n)}
    openP(DB.list.find(x=>x.id===S.id)?S.id:DB.list[0].id);
  },"Hapus");
}
$("del").onclick=()=>delP(S.id);
$("tb").addEventListener("input",e=>{
  const t=e.target,i=+t.dataset.i,k=t.dataset.k;if(!k)return;
  if(k==="note"){(S.notes=S.notes||[])[i]=t.value;save();return}
  let v=t.value===""?undefined:+t.value,fix=false;
  if(v!==undefined){
    if(!(v>=0)){v=0;fix=true}
    if(k==="act"){const o=S.act.reduce((a,x,j)=>j===i?a:a+(+x||0),0),mx=Math.max(0,Math.round((100-o)*100)/100);if(v>mx){v=mx;fix=true;toast("Total progress aktual dibatasi maksimal 100%")}}
    if(fix)t.value=v;
  }
  S[k][i]=v;update();save();
});
DB.list.forEach(p=>{if(p.end){const bad=new Date(pd(p.start).getTime()+(p.weeks*7-1)*DAY).toISOString().slice(0,10);if(p.end===bad)p.end=endOf({start:p.start,weeks:p.weeks})}});
let DL=null;
const _dp=(window.claude&&claude.use?claude.use("downloads"):Promise.resolve(null));
Promise.race([_dp,new Promise(r=>setTimeout(()=>r(null),2500))]).then(d=>{DL=d;if(d)document.querySelectorAll(".dl").forEach(b=>b.style.display="");dsay()}).catch(()=>{dsay()});
_dp.then(d=>{if(d&&!DL){DL=d;dsay()}}).catch(()=>{});
function dsay(){const e=$("dls");if(e&&STANDALONE){e.textContent=" Mode website: file ekspor diunduh langsung oleh browser.";return}if(e)e.textContent=DL?" Unduhan otomatis: AKTIF.":" Unduhan otomatis: TIDAK TERSEDIA di tampilan ini ("+(window.top===window?"halaman utama":"dalam frame")+", "+((window.claude&&claude.use)?"fitur ada tapi tidak diberi akses":"fitur tidak ada")+"). Gunakan Salin tabel ke Excel.";}
function scopedBody(h){
  const css=((h.match(/<style>([\s\S]*?)<\/style>/)||[])[1]||'').split('@media')[0];
  const body=((h.match(/<body>([\s\S]*)<\/body>/)||[])[1]||'').replace(/<div class="n">[\s\S]*?<\/div>/,'');
  const sc=css.replace(/([^{}]+)\{([^{}]*)\}/g,(m,s,b)=>s.split(',').map(x=>x.trim()==='body'?'#tmr':'#tmr '+x.trim()).join(',')+'{'+b+'}');
  return '<style>'+sc+'#tmr th{position:static;background:#fff;color:#1b1f24}#tmr table{min-width:0}#tmr{background:#fff;color:#1b1f24;border-radius:8px;padding:0 10px 10px;overflow-x:auto}</style>'+body;
}
const MIME={html:'text/html',csv:'text/csv;charset=utf-8',json:'application/json'};
const STANDALONE=!window.claude&&window.top===window;
function autoDownload(name,data,opt){
  let href;
  if(opt&&opt.img)href=opt.img;
  else{const ext=(name.split('.').pop()||'').toLowerCase();href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type:MIME[ext]||'text/plain'}))}
  const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove();
  toast('File diunduh: '+name);
}
function fallback(name,data,alt,opt){
  if(STANDALONE){autoDownload(name,data,opt);return}
  $('tmg').style.display='none';
  if(data instanceof Blob&&!opt)opt=/\.png$/i.test(name)?{img:URL.createObjectURL(data)}:{file:true};
  const ext=(name.split('.').pop()||'').toLowerCase(),d=$('tmd');
  let href=null;
  try{href=opt&&opt.img?opt.img:URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type:MIME[ext]||'text/plain'}))}catch(e){}
  if(href){d.href=href;d.download=name;d.style.display=''}else d.style.display='none';
  $('tmt').textContent=name;
  ['tmr','tmi','tmx','tmp'].forEach(i=>$(i).style.display='none');$('tmc').style.display='none';
  let hint='Unduhan otomatis tidak tersedia di tampilan ini. ';
  if(opt&&opt.html){$('tmr').innerHTML=scopedBody(opt.html);$('tmr').style.display='block';$('tmp').style.display='';hint+='Tekan Unduh file, atau Cetak / Simpan PDF. Pratinjau laporan ada di bawah.'}
  else if(opt&&opt.img){$('tmi').src=opt.img;$('tmi').style.display='block';hint+='Tekan Unduh file, atau tekan lama / klik kanan gambar lalu simpan.'}
  else if(opt&&opt.file){hint+='Tekan Unduh file. Jika tidak ada file yang tersimpan, tekan Salin lalu tempel (Ctrl+V) ke Excel atau Google Sheets, kolom Rencana kum. dan Aktual kum. bisa dijadikan grafik Kurva-S.';if(alt!=null){$('tmx').value=String(alt).replace(/^\ufeff/,'');$('tmx').style.display='';$('tmc').style.display=''}}
  else{$('tmx').value=String(alt??data).replace(/^\ufeff/,'');$('tmx').style.display='';$('tmc').style.display='';hint+='Tekan Unduh file, atau salin teks lalu tempel ke Excel / Google Sheets.'}
  $('tmh').textContent=hint;$('tm').style.display='flex';if($('tm').scrollIntoView)$('tm').scrollIntoView({block:'center'});
}
function toast(m){const t=$('ts');t.textContent=m;t.style.display='block';if(t.scrollIntoView)t.scrollIntoView({block:'nearest'});clearTimeout(toast.t);toast.t=setTimeout(()=>{t.style.display='none'},4000)}
async function dlSave(filename,data,alt,opt){
  if(!DL){fallback(filename,data,alt,opt);return}
  try{await DL.save({filename,data});toast('File siap disimpan: '+filename)}
  catch(e){
    if(e&&e.code==='declined'){toast('Unduhan dibatalkan');return}
    fallback(filename,data,alt,opt);
  }
}
$('tmp').onclick=()=>{document.body.classList.add('prn');try{window.print()}catch(e){}finally{document.body.classList.remove('prn')}};
$("tmc").onclick=()=>{const t=$("tmx");t.select();let ok=false;try{ok=document.execCommand("copy")}catch(e){}try{if(navigator.clipboard){navigator.clipboard.writeText(t.value).catch(()=>{});ok=true}}catch(e){}$("tmc").textContent=ok?"Tersalin ✓":"Tekan Ctrl+C"};
$("tmz").onclick=()=>{$("tm").style.display="none";$("tmc").textContent="Salin"};
const nf=v=>String(Math.round(v*100)/100).replace(".",",");
const qt=(v,sep=";")=>{v=String(v);return (v.includes(sep)||/["\n]/.test(v))?'"'+v.replace(/"/g,'""')+'"':v};
function csvOf(list,sep=";"){
  const rows=[["Proyek","Kontraktor","Lokasi pekerjaan","Tanggal mulai","Tanggal selesai","Minggu","Periode","Rencana mingguan (%)","Rencana kumulatif (%)","Aktual mingguan (%)","Aktual kumulatif (%)","Deviasi (%)","Status","Catatan / kendala"]];
  list.forEach(p=>{
    const st=pd(p.start),en=pd(endOf(p)),c=calc(p);let pc=0,ac=0;
    for(let i=0;i<p.weeks;i++){
      const a=new Date(st.getTime()+i*7*DAY),b0=new Date(a.getTime()+6*DAY),b=b0>en?en:b0;
      pc+=+p.plan[i]||0;
      const r=[p.name,p.kontraktor||"",p.lokasi||"",p.start,endOf(p),i+1,iso(a)+" s/d "+iso(b),nf(+p.plan[i]||0),nf(Math.min(pc,100))];
      if(i<c.lw){ac+=+p.act[i]||0;const d=ac-Math.min(pc,100);r.push(nf(+p.act[i]||0),nf(ac),nf(d),status(d,+p.tol||0,ac)[0])}else r.push("","","","");
      r.push((p.notes&&p.notes[i])||"");rows.push(r);
    }
  });
  return "\ufeff"+rows.map(r=>r.map(v=>qt(v,sep)).join(sep)).join("\r\n");
}
const slug=s=>String(s||"proyek").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"proyek";
$("expAll").onclick=()=>openPreview({title:"CSV semua proyek",text:csvOf(DB.list,"\t"),okLabel:"Unduh CSV",onOk:()=>dlSave("monitoring-semua-proyek-"+iso(new Date())+".csv",csvOf(DB.list),csvOf(DB.list,"\t"))});
$("bak").onclick=()=>openPreview({title:"Cadangan data (JSON)",text:JSON.stringify(DB,null,1),okLabel:"Unduh cadangan (JSON)",onOk:()=>dlSave("cadangan-monitoring-"+iso(new Date())+".json",JSON.stringify(DB,null,1))});
$("imp").onclick=()=>$("impf").click();
$("impf").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      const ok=d&&Array.isArray(d.list)&&d.list.length&&d.list.every(p=>p&&p.id&&p.start&&p.report&&p.weeks>=1&&Array.isArray(p.plan));
      if(!ok)throw 0;
      dlg("Impor akan mengganti semua data saat ini. Lanjutkan?",()=>{
        d.list.forEach(p=>{p.act=Array.isArray(p.act)?p.act:[];p.tol=+p.tol||0});
        DB=d;S=DB.list.find(p=>p.id===DB.cur)||DB.list[0];DB.cur=S.id;fill();build();update();save();pushAll();
      },"Impor");
    }catch(x){dlg("File cadangan tidak valid.")}
  };
  r.readAsText(f);e.target.value="";
});
function projData(p){const n=p.weeks,c=calc(p);let pc=0,ac=0;const P=[0],A=[0];for(let i=0;i<n;i++){pc+=+p.plan[i]||0;P.push(Math.min(pc,100));if(i<c.lw){ac+=+p.act[i]||0;A.push(ac)}}return{P,A,cw:c.cw,n,c}}
const PAL={'--bd':'#d0d5dd','--mut':'#667085','--plan':'#e33a41','--acc':'#02448e'};
function svgFixed(p){
  const d=projData(p);
  const s=chart(d.P,d.A,d.cw,d.n,true).replace(/var\((--[a-z]+)\)/g,(m,v)=>PAL[v]||'#000');
  const lg='<g font-size="12" font-family="sans-serif"><line x1="50" x2="72" y1="9" y2="9" stroke="#e33a41" stroke-width="3"/><text x="78" y="13" fill="#667085">Rencana</text><line x1="150" x2="172" y1="9" y2="9" stroke="#02448e" stroke-width="3"/><text x="178" y="13" fill="#667085">Aktual</text></g>';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 270" width="1240" height="540" font-family="sans-serif"><rect width="620" height="270" fill="#fff"/>'+lg+s+'</svg>';
}
function reportHtml(p){
  const d=projData(p),c=d.c,st=pd(p.start),en=pd(endOf(p));
  const fl=x=>x.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  const stt=c.cw>0?status(c.dev,+p.tol||0,c.ac)[0]:'Belum dimulai';
  const col=c.cw>0?(c.dev<0?'#b91c1c':'#15803d'):'#667085';
  let pc=0,ac=0,rows='';
  for(let i=0;i<p.weeks;i++){
    const a=new Date(st.getTime()+i*7*DAY),b0=new Date(a.getTime()+6*DAY),b=b0>en?en:b0;
    pc+=+p.plan[i]||0;
    let x=`<td>${nf(+p.plan[i]||0)}</td><td>${nf(Math.min(pc,100))}</td>`;
    if(i<c.lw){ac+=+p.act[i]||0;const dv=ac-Math.min(pc,100);x+=`<td>${nf(+p.act[i]||0)}</td><td>${nf(ac)}</td><td>${(dv>0?'+':'')+nf(dv)}</td><td>${status(dv,+p.tol||0,ac)[0]}</td>`}else x+='<td>–</td><td>–</td><td>–</td><td>–</td>';
    rows+=`<tr><td>${i+1}</td><td>${fmt(a)} – ${fmt(b)}</td>${x}<td style="text-align:left;white-space:normal">${esc((p.notes&&p.notes[i])||'')}</td></tr>`;
  }
  const logo=(document.querySelector('.logo img')||{}).src||'';
  const css='body{font:14px/1.45 system-ui,sans-serif;color:#1b1f24;max-width:900px;margin:20px auto;padding:0 16px}.hd{display:flex;gap:14px;align-items:center;background:#02448e;color:#fff;border-radius:12px;padding:10px 16px;border-bottom:4px solid #e33a41}.hd img{height:54px;background:#fff;border-radius:8px;padding:5px 8px}h1{font-size:18px;margin:0}h2{font-size:15px;margin:18px 0 6px;color:#02448e}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #e1e4e8;padding:4px 6px;text-align:right;font-size:12px}th{border-bottom:2px solid #02448e}td:first-child,td:nth-child(2),th:first-child,th:nth-child(2){text-align:left}table.m td{text-align:left;font-size:13px}table.m td:nth-child(odd){color:#667085;width:18%}.k{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.k div{border:1px solid #e1e4e8;border-radius:8px;padding:8px}.k span{font-size:11px;color:#667085;display:block}.k b{font-size:18px}svg{width:100%;height:auto}.n{font-size:11px;color:#667085;margin-top:10px}@media print{body{margin:0}}';
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>Laporan ${esc(p.name)}</title><style>${css}</style></head><body>
<div class="hd"><img src="${logo}" alt=""><div><h1>Laporan Monitoring Progress Project</h1><div>${esc(p.name)}</div></div></div>
<table class="m" style="margin-top:10px"><tr><td>Kontraktor</td><td>${esc(p.kontraktor||'–')}</td><td>Lokasi pekerjaan</td><td>${esc(p.lokasi||'–')}</td></tr><tr><td>Nomor kontrak</td><td>${esc(p.kontrak||'–')}</td><td>Nilai kontrak</td><td>${+p.nilai>0?rpf(p.nilai):'–'}</td></tr><tr><td>Tanggal mulai</td><td>${fl(st)}</td><td>Tanggal selesai</td><td>${fl(en)}</td></tr><tr><td>Tanggal laporan</td><td>${fl(pd(p.report))}</td><td>Minggu ke</td><td>${c.cw} dari ${c.n}</td></tr></table>
<div class="k"><div><span>Rencana kumulatif</span><b>${nf(c.pc)}%</b></div><div><span>Aktual kumulatif</span><b>${nf(c.ac)}%</b></div><div><span>Deviasi</span><b style="color:${col}">${c.cw>0?(c.dev>0?'+':'')+nf(c.dev)+'%':'–'}</b></div><div><span>Status</span><b style="color:${col}">${stt}</b></div></div>
${extraKpi(p)}
<h2>Kurva-S</h2>${svgFixed(p)}
<h2>Progress mingguan</h2><table><thead><tr><th>Minggu</th><th>Periode</th><th>Rencana (%)</th><th>Rencana kum.</th><th>Aktual (%)</th><th>Aktual kum.</th><th>Deviasi</th><th>Status</th><th style="text-align:left">Catatan / kendala</th></tr></thead><tbody>${rows}</tbody></table>
<div class="n">Deviasi = aktual kumulatif − rencana kumulatif. Untuk menyimpan sebagai PDF, buka file ini di browser lalu pilih Cetak (Ctrl+P) dan Simpan sebagai PDF.</div></body></html>`;
}
function crc32(u){let t=crc32.t;if(!t){t=crc32.t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}}let r=-1;for(let i=0;i<u.length;i++)r=t[(r^u[i])&255]^(r>>>8);return(r^-1)>>>0}
function zipStore(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  for(const [name,data] of Object.entries(files)){
    const nb=enc.encode(name),db=typeof data==='string'?enc.encode(data):data,crc=crc32(db);
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(12,0x5821,true);lh.setUint32(14,crc,true);lh.setUint32(18,db.length,true);lh.setUint32(22,db.length,true);lh.setUint16(26,nb.length,true);
    parts.push(new Uint8Array(lh.buffer),nb,db);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(14,0x5821,true);ch.setUint32(16,crc,true);ch.setUint32(20,db.length,true);ch.setUint32(24,db.length,true);ch.setUint16(28,nb.length,true);ch.setUint32(42,off,true);
    cen.push(new Uint8Array(ch.buffer),nb);
    off+=30+nb.length+db.length;
  }
  const cs=cen.reduce((a,x)=>a+x.length,0),n=Object.keys(files).length,e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,n,true);e.setUint16(10,n,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,new Uint8Array(e.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
let pvOk=null;
function openPreview(o){
  pvOk=o.onOk||null;
  ['tmr','tmi','tmx','tmp','tmd','tmc'].forEach(i=>$(i).style.display='none');
  $('tmt').textContent='Pratinjau: '+o.title;
  $('tmh').textContent='Periksa isi di bawah. Jika sudah sesuai, tekan tombol Unduh.';
  if(o.html){$('tmr').innerHTML=scopedBody(o.html);$('tmr').style.display='block'}
  else if(o.img){$('tmi').src=o.img;$('tmi').style.display='block'}
  else{$('tmx').value=String(o.text).replace(/^\ufeff/,'');$('tmx').style.display=''}
  const g=$('tmg');g.textContent=o.okLabel||'Unduh';g.style.display='';
  $('tm').style.display='flex';$('tm').scrollIntoView({block:'start'});
}
$('tmg').onclick=async()=>{const f=pvOk;pvOk=null;if(!f)return;$('tm').style.display='none';await f()};
async function buildXlsx(p){
  const d=projData(p),c=d.c,n=p.weeks,st=pd(p.start),en=pd(endOf(p));
  const X=v=>String(v).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const R=[];let r=0;
  const add=cells=>{r++;R.push([r,cells])};
  const T=(v,s)=>({v,s:s||0}),N=(v,s)=>({v,n:1,s:s==null?3:s});
  add([T('Monitoring Progress Project',4)]);
  add([T('Proyek',1),T(p.name||'')]);
  add([T('Kontraktor',1),T(p.kontraktor||'')]);
  add([T('Lokasi pekerjaan',1),T(p.lokasi||'')]);
  add([T('Nomor kontrak',1),T(p.kontrak||'')]);
  add([T('Nilai kontrak (Rp)',1),+p.nilai>0?N(+p.nilai,5):T('')]);
  add([T('Tanggal mulai',1),T(iso(st))]);
  add([T('Tanggal selesai',1),T(iso(en))]);
  add([T('Tanggal laporan',1),T(p.report)]);
  add([T('Minggu ke',1),T(c.cw+' dari '+n)]);
  add([]);
  const planNow=c.cw?d.P[c.cw]:0,actNow=c.cw?d.A[c.cw]:0,dev=actNow-planNow;
  add([T('Rencana kumulatif (%)',1),N(planNow)]);
  add([T('Aktual kumulatif (%)',1),N(actNow)]);
  add([T('Deviasi (%)',1),N(dev)]);
  add([T('Status',1),T(c.cw>0?status(dev,+p.tol||0,actNow)[0]:'Belum dimulai')]);
  metricsList(p).forEach(x=>add([T(x[0],1),T(x[1]+(x[2]?' ('+x[2]+')':''))]));
  add([]);
  const hr=r+1;
  add(['Minggu','Periode','Rencana (%)','Rencana kum. (%)','Aktual (%)','Aktual kum. (%)','Deviasi (%)','Status','Catatan / kendala'].map(h=>T(h,2)));
  add([N(0,0),T('Awal ('+iso(st)+')'),null,N(0),null,N(0)]);
  let pc=0,ac=0;
  for(let i=0;i<n;i++){
    const a=new Date(st.getTime()+i*7*DAY),b0=new Date(a.getTime()+6*DAY),b=b0>en?en:b0;
    pc+=+p.plan[i]||0;
    const row=[N(i+1,0),T(iso(a)+' s/d '+iso(b)),N(+p.plan[i]||0),N(Math.min(pc,100))];
    if(i<c.lw){ac+=+p.act[i]||0;const dv=ac-Math.min(pc,100);row.push(p.act[i]!=null?N(+p.act[i]):null,N(ac),N(dv),T(status(dv,+p.tol||0,ac)[0]))}
    else row.push(null,null,null,null);
    row.push(T((p.notes&&p.notes[i])||''));
    add(row);
  }
  const L=i=>String.fromCharCode(65+i);
  const sd=R.map(([ri,cells])=>'<row r="'+ri+'">'+cells.map((cl,ci)=>{
    if(!cl)return '';
    const ref=L(ci)+ri;
    if(cl.n)return '<c r="'+ref+'" s="'+cl.s+'"><v>'+Math.round(cl.v*10000)/10000+'</v></c>';
    return cl.v===''?'':'<c r="'+ref+'" s="'+cl.s+'" t="inlineStr"><is><t xml:space="preserve">'+X(cl.v)+'</t></is></c>';
  }).join('')+'</row>').join('');
  const NS='xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const sheet=H+'<worksheet '+NS+'><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><cols><col min="1" max="1" width="24" customWidth="1"/><col min="2" max="2" width="30" customWidth="1"/><col min="3" max="7" width="15" customWidth="1"/><col min="8" max="8" width="16" customWidth="1"/><col min="9" max="9" width="38" customWidth="1"/></cols><sheetData>'+sd+'</sheetData><pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/><drawing r:id="rId1"/></worksheet>';
  const styles=H+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF02448E"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF02448E"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const ttl=t=>'<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:rPr lang="id-ID" sz="1000" b="0"/><a:t>'+X(t)+'</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title>';
  const ser=(i,cl,rgb)=>'<c:ser><c:idx val="'+i+'"/><c:order val="'+i+'"/><c:tx><c:strRef><c:f>Monitoring!$'+cl+'$'+hr+'</c:f></c:strRef></c:tx><c:spPr><a:ln w="31750" cap="rnd"><a:solidFill><a:srgbClr val="'+rgb+'"/></a:solidFill><a:round/></a:ln></c:spPr><c:marker><c:symbol val="none"/></c:marker><c:cat><c:numRef><c:f>Monitoring!$A$'+(hr+1)+':$A$'+(hr+1+n)+'</c:f></c:numRef></c:cat><c:val><c:numRef><c:f>Monitoring!$'+cl+'$'+(hr+1)+':$'+cl+'$'+(hr+1+n)+'</c:f></c:numRef></c:val><c:smooth val="0"/></c:ser>';
  const chart=H+'<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="'+REL+'"><c:roundedCorners val="0"/><c:chart><c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:rPr lang="id-ID" sz="1400" b="1"/><a:t>Kurva-S: '+X(p.name||'Proyek')+'</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/><c:plotArea><c:layout/><c:lineChart><c:grouping val="standard"/><c:varyColors val="0"/>'+ser(0,'D','E33A41')+ser(1,'F','02448E')+'<c:marker val="1"/><c:axId val="50010"/><c:axId val="50020"/></c:lineChart><c:catAx><c:axId val="50010"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/>'+ttl('Minggu')+'<c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50020"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx><c:valAx><c:axId val="50020"/><c:scaling><c:orientation val="minMax"/><c:max val="100"/><c:min val="0"/></c:scaling><c:delete val="0"/><c:axPos val="l"/><c:majorGridlines/>'+ttl('Progress kumulatif (%)')+'<c:numFmt formatCode="0" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/><c:crossAx val="50010"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx></c:plotArea><c:legend><c:legendPos val="b"/><c:overlay val="0"/></c:legend><c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>';
  const drawing=H+'<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><xdr:twoCellAnchor><xdr:from><xdr:col>10</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>21</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>26</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Kurva-S"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="'+REL+'" r:id="rId1"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>';
  const rels=(id,type,target)=>H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="'+id+'" Type="'+REL+'/'+type+'" Target="'+target+'"/></Relationships>';
  const F={},z={file:(n,c)=>{F[n]=c}};
  z.file('[Content_Types].xml',H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/><Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/></Types>');
  z.file('_rels/.rels',rels('rId1','officeDocument','xl/workbook.xml'));
  z.file('xl/workbook.xml',H+'<workbook '+NS+'><sheets><sheet name="Monitoring" sheetId="1" r:id="rId1"/></sheets></workbook>');
  z.file('xl/_rels/workbook.xml.rels',H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="'+REL+'/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="'+REL+'/styles" Target="styles.xml"/></Relationships>');
  z.file('xl/styles.xml',styles);
  z.file('xl/worksheets/sheet1.xml',sheet);
  z.file('xl/worksheets/_rels/sheet1.xml.rels',rels('rId1','drawing','../drawings/drawing1.xml'));
  z.file('xl/drawings/drawing1.xml',drawing);
  z.file('xl/drawings/_rels/drawing1.xml.rels',rels('rId1','chart','../charts/chart1.xml'));
  z.file('xl/charts/chart1.xml',chart);
  return zipStore(F);
}
$("cpTbl").onclick=()=>{
  const t=csvOf([S],"\t").replace(/^\ufeff/,"");
  const ta=document.createElement("textarea");ta.value=t;ta.style.cssText="position:fixed;left:0;top:0;opacity:0";document.body.appendChild(ta);ta.focus();ta.select();
  let ok=false;try{ok=document.execCommand("copy")}catch(e){}
  ta.remove();
  try{if(navigator.clipboard){navigator.clipboard.writeText(t).catch(()=>{});ok=true}}catch(e){}
  if(ok)toast("Tabel disalin. Tempel (Ctrl+V) di Excel atau Google Sheets.");else fallback("tabel-"+slug(S.name)+".txt",t,t);
};
window.addEventListener("error",e=>{try{toast("Galat: "+(e.message||"tidak diketahui"))}catch(x){}});
$("expXls").onclick=()=>openPreview({title:"Excel + Kurva-S ("+(S.name||"proyek")+")",html:reportHtml(S),okLabel:"Unduh Excel (.xlsx)",onOk:async()=>{
  toast("Membuat file Excel...");
  try{const blob=await buildXlsx(S);dlSave("monitoring-"+slug(S.name)+".xlsx",blob,csvOf([S],"\t"))}catch(e){dlg("Gagal membuat file Excel: "+((e&&e.message)||e))}
}});
$("expRep").onclick=()=>{const h=reportHtml(S);openPreview({title:"Laporan + Kurva-S",html:h,okLabel:"Unduh laporan (HTML)",onOk:()=>dlSave("laporan-"+slug(S.name)+".html",h,undefined,{html:h})})};
$("expPng").onclick=()=>{
  const im=new Image();
  im.onload=()=>{
    const cv=document.createElement('canvas');cv.width=1240;cv.height=540;cv.getContext('2d').drawImage(im,0,0,1240,540);
    openPreview({title:'Kurva-S (PNG)',img:cv.toDataURL('image/png'),okLabel:'Unduh gambar (PNG)',onOk:()=>cv.toBlob(b=>{if(b)dlSave('kurva-s-'+slug(S.name)+'.png',b);else dlg('Gagal membuat gambar Kurva-S.')},'image/png')});
  };
  im.onerror=()=>dlg('Gagal membuat gambar Kurva-S.');
  im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svgFixed(S));
};
let RC=null,remoteIds=new Set(),tmr=null,busy=false;
const sent={},pend=new Map(),dels=new Set();
function qp(p){
  if(!RC||!p)return;
  const js=JSON.stringify(p);if(sent[p.id]===js)return;
  pend.set(p.id,js);clearTimeout(tmr);tmr=setTimeout(flush,700);
}
function rdel(id){if(!RC)return;pend.delete(id);dels.add(id);delete sent[id];clearTimeout(tmr);tmr=setTimeout(flush,300)}
function pushAll(){DB.list.forEach(p=>qp(p));remoteIds.forEach(id=>{if(!DB.list.find(p=>p.id===id))rdel(id)})}
async function flush(){
  if(busy||!RC)return;busy=true;
  try{
    for(const [id,js] of [...pend]){pend.delete(id);try{await RC.doc(id).set({d:js});sent[id]=js}catch(e){$('syn').textContent='Perubahan tidak bisa dibagikan (akses lihat saja).'}}
    for(const id of [...dels]){dels.delete(id);try{await RC.doc(id).delete()}catch(e){}}
  }finally{busy=false}
  if(pend.size||dels.size)tmr=setTimeout(flush,300);
}
function applyRemote(list){
  const ae=document.activeElement,typing=!!(ae&&ae.tagName==='INPUT'&&ae.id!=='impf');
  const cur=S.id,old=DB.list.find(p=>p.id===cur);
  DB.list=list.map(p=>(typing&&p.id===cur&&old)?old:p);
  S=DB.list.find(p=>p.id===cur)||DB.list[0];DB.cur=S.id;lsave();
  if(typing)renderOv();else{fill();build();update()}
}
(async()=>{
  try{
    if(!(window.claude&&claude.use))return;
    const db=await claude.use('db');if(!db)return;
    RC=db.collection('proyek');let first=true;
    RC.onSnapshot(snap=>{
      if(snap.metadata.hasPendingWrites)return;
      remoteIds=new Set(snap.docs.map(d=>d.id));
      const list=[];
      snap.docs.forEach(d=>{try{const p=JSON.parse(d.data().d);if(p&&p.id&&p.plan){sent[p.id]=d.data().d;list.push(p)}}catch(e){}});
      if(!list.length){if(first&&!snap.metadata.fromCache){first=false;pushAll();$('syn').textContent='Data bersama aktif'}return}
      first=false;$('syn').textContent='Data bersama aktif';
      if(pend.size||busy||dels.size)return;
      applyRemote(list);
    },e=>{});
  }catch(e){}
})();
(function(){
  const row=$('gen').parentNode;
  ['tm','cm','ts'].forEach(id=>{
    const e=$(id);
    Object.assign(e.style,{position:'static',inset:'auto',left:'auto',bottom:'auto',transform:'none',background:'none',padding:'0',zIndex:'auto',margin:'10px 0 0',maxWidth:'none',textAlign:'left'});
    if(id==='ts')Object.assign(e.style,{background:'#1b1f24',color:'#fff',padding:'9px 14px',borderRadius:'10px',fontSize:'13px'});
    if(id!=='ts'){const c=e.firstElementChild;if(c){c.style.maxHeight='none';c.style.maxWidth='none';c.style.borderColor='var(--acc)'}e.style.justifyContent='flex-start'}
    row.after(e);
  });
})();
fill();build();update();
