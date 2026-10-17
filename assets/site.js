/* =====================================================================
   Logica del sito (non serve modificarla: i dati sono in assets/config.js)
   ===================================================================== */
(function(){
const CONFIG = window.CONFIG;
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const GIORNI = ["Domenica","Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato"];
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const telHref = "tel:" + CONFIG.telefono.replace(/\s/g,"");
const waLink = text => CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(text)}` : telHref;
const toast = msg => { const t=$("#toast"); if(!t) return; t.firstElementChild.textContent=msg; t.style.opacity=1; clearTimeout(toast._t); toast._t=setTimeout(()=>t.style.opacity=0,3200); };

/* ---------- Link e testi dal CONFIG ---------- */
function bindConfig(){
  $$("[data-wa]").forEach(el => el.href = waLink(el.dataset.wa));
  $$("[data-href=tel]").forEach(el => el.href = telHref);
  if (!CONFIG.email) $$('[data-href="mail"], [data-via="mail"]').forEach(el => el.remove());
  if (!CONFIG.whatsapp) $$('[data-wa-only]').forEach(el => el.remove());
  const g = CONFIG.google;
  $$("[data-rating]").forEach(el => {
    if (!g || !g.recensioni) return el.remove();
    el.href = g.url; el.querySelector(".r-voto").textContent = g.voto;
    el.querySelector(".r-num").textContent = g.recensioni + " recensioni su Google";
  });
  $$(".year").forEach(e => e.textContent = new Date().getFullYear());
}

/* ---------- Foto: usa le tue se presenti, altrimenti quelle di esempio ---------- */
function setupPhotos(){
  $$("img[data-fallback]").forEach(img => {
    const fb = () => { if (img.src !== img.dataset.fallback) img.src = img.dataset.fallback; };
    img.addEventListener("error", fb, { once:true });
    if (img.complete && img.naturalWidth === 0) fb();
  });
  if (new URLSearchParams(location.search).has("foto")) {
    document.body.classList.add("foto-mode");
    toast("Modalità foto: i bordi arancioni indicano dove vanno le tue foto");
  }
}

/* ---------- Orari, festivi, stato aperto/chiuso (ora italiana) ---------- */
function romeNow(){
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Rome",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  return { date: new Date(Date.UTC(+p.year, +p.month-1, +p.day)), min: +p.hour*60 + +p.minute };
}
const iso = d => d.toISOString().slice(0,10);
const addDays = (d,n) => new Date(d.getTime() + n*864e5);
const toMin = s => { const [h,m]=s.split(":"); return h*60 + +m; };
const fmt = s => s.replace(/^0/,"");
function easter(y){ const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return new Date(Date.UTC(y,mo-1,da)); }
function holidayName(d){
  const md = iso(d).slice(5);
  const fixed = {"01-01":"Capodanno","01-06":"Epifania","04-25":"Festa della Liberazione","05-01":"Festa del Lavoro","06-02":"Festa della Repubblica","08-15":"Ferragosto","11-01":"Ognissanti","12-08":"Immacolata","12-25":"Natale","12-26":"Santo Stefano"};
  if (fixed[md]) return fixed[md];
  const e = easter(d.getUTCFullYear());
  if (iso(d)===iso(e)) return "Pasqua";
  if (iso(d)===iso(addDays(e,1))) return "Lunedì dell'Angelo";
  return null;
}
function slotsFor(d){
  const key = iso(d);
  const turno = CONFIG.turni.find(t => t.data === key);
  if (turno) return { slots: turno.orari, turno:true };
  if (CONFIG.chiusure.includes(key)) return { slots: [], reason:"Chiusura straordinaria" };
  const hol = holidayName(d);
  if (hol) return { slots: [], reason: hol };
  return { slots: CONFIG.orari[d.getUTCDay()] || [] };
}
const slotsText = s => s.length ? s.map(([a,b]) => `${fmt(a)}–${fmt(b)}`).join(" · ") : "Chiuso";
const longDate = key => new Date(key+"T12:00:00Z").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"});

function computeStatus(){
  const { date, min } = romeNow();
  const today = slotsFor(date);
  for (const [a,b] of today.slots) if (min >= toMin(a) && min < toMin(b)) return { open:true, msg:`chiude alle ${fmt(b)}`, today, date };
  const later = today.slots.find(([a]) => toMin(a) > min);
  if (later) return { open:false, msg:`riapre oggi alle ${fmt(later[0])}`, today, date };
  for (let i=1;i<=14;i++){
    const d = addDays(date,i), s = slotsFor(d);
    if (s.slots.length) return { open:false, msg:`riapre ${i===1?"domani":GIORNI[d.getUTCDay()].toLowerCase()} alle ${fmt(s.slots[0][0])}`, today, date };
  }
  return { open:false, msg:"", today, date };
}

function renderHours(){
  const st = computeStatus();
  const label = st.open ? "Aperta ora" : "Chiusa ora";
  $$(".status-pill").forEach(e => { e.textContent = label; e.className = "status-pill rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider " + (st.open ? "bg-forest-50 text-forest-700" : "bg-coral/10 text-coral"); });
  $$(".status-pill-dark").forEach(e => { e.textContent = label; e.className = "status-pill-dark shrink-0 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wider " + (st.open ? "bg-cross text-forest-900" : "bg-coral text-white"); });
  const long = st.msg ? st.msg.charAt(0).toUpperCase()+st.msg.slice(1) : "";
  $$(".status-long").forEach(e => e.textContent = long);
  $$(".status-long-dark").forEach(e => e.textContent = (st.open ? "Siamo aperti, " : "Ora siamo chiusi, ") + st.msg + ".");
  $$(".status-short").forEach(e => e.textContent = `${label} · ${st.msg}`);
  $$(".status-dot").forEach(e => { e.style.background = st.open ? "#34C27A" : "#E2674A"; e.classList.toggle("pulse-dot", st.open); });
  $$(".today-hours").forEach(e => e.textContent = st.today.reason ? `Chiuso (${st.today.reason})` : slotsText(st.today.slots));

  // tabelle settimanali (da lunedì): evidenzia oggi
  const order = [1,2,3,4,5,6,0], todayIdx = st.date.getUTCDay();
  $$("[data-hours-table]").forEach(tb => {
    const dark = tb.dataset.hoursTable === "dark";
    tb.innerHTML = order.map(g => {
      const cur = g === todayIdx, closed = !CONFIG.orari[g].length;
      const hi = cur ? (dark ? "bg-white/10" : "bg-forest-50") : "";
      const dayCls = cur ? (dark ? "text-cross" : "text-forest-700") : "";
      const offCls = closed ? (dark ? "text-forest-100/60" : "text-muted") : "";
      return `<tr class="${hi}"><th scope="row" class="rounded-l-lg py-2.5 pl-3 text-left font-semibold ${dayCls}">${GIORNI[g]}${cur?' <span class="ml-1 text-xs font-bold uppercase tracking-wider">oggi</span>':""}</th><td class="rounded-r-lg py-2.5 pr-3 text-right tabular-nums ${offCls}">${slotsText(CONFIG.orari[g])}</td></tr>`;
    }).join("");
  });

  const note = $("#holidayNote");
  if (note) {
    if (st.today.reason) { note.textContent = `Oggi è ${st.today.reason}: siamo chiusi. Controlla la farmacia di turno più vicina.`; note.classList.remove("hidden"); }
    else if (st.today.turno) { note.textContent = `Oggi siamo di turno: ${slotsText(st.today.slots)}.`; note.classList.remove("hidden"); }
    else note.classList.add("hidden");
  }

  // turni
  const key = iso(st.date);
  const next = CONFIG.turni.filter(t => t.data >= key).sort((a,b)=>a.data.localeCompare(b.data));
  const tt = $("#turnoToday"), tn = $("#turnoNext"), tl = $("#turniList");
  if (tt && next[0] && next[0].data === key) tt.textContent = `Oggi siamo noi la farmacia di turno: ${slotsText(next[0].orari)}.`;
  const future = next.filter(t => t.data !== key);
  if (tn) tn.textContent = future[0] ? "Prossimo turno: " + longDate(future[0].data) + "." : "Usa il servizio qui accanto per trovare la farmacia aperta più vicina.";
  if (tl) tl.innerHTML = next.length
    ? next.map(t => `<li class="flex justify-between gap-4 border-b border-line py-3"><span class="font-semibold capitalize">${esc(longDate(t.data))}</span><span class="tabular-nums text-muted">${slotsText(t.orari)}</span></li>`).join("")
    : `<li class="py-3 text-muted">Al momento non ci sono turni in calendario per la nostra farmacia. Controlla il servizio ufficiale per sapere chi è aperto.</li>`;

  // distributore
  if (CONFIG.distributoreAttivo) {
    const b = $("#h24Badge");
    if (b) { b.textContent = "Attivo"; b.className = "inline-flex rounded-full bg-forest-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-forest-700"; }
    const t = $("#h24Text"); if (t) t.textContent = "Sotto il porticato trovi il nostro distributore di prodotti da farmacia, utilizzabile a qualsiasi ora, anche quando siamo chiusi.";
    $$(".h24-short").forEach(e => e.textContent = "Attivo H24");
  } else $$(".h24-short").forEach(e => e.textContent = "H24 in arrivo");
}

/* ---------- Filtro servizi (pagina Servizi) ---------- */
function setupFilter(){
  const btns = $$("[data-filter]");
  if (!btns.length) return;
  const apply = f => {
    btns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.filter===f)));
    $$("[data-cat]").forEach(c => c.classList.toggle("hidden", f!=="tutti" && c.dataset.cat!==f));
  };
  btns.forEach(b => b.addEventListener("click", () => apply(b.dataset.filter)));
  const h = location.hash.slice(1);
  if (btns.some(b => b.dataset.filter === h)) apply(h);
}

/* ---------- Form ricetta ---------- */
function showErr(el, msg){ el.textContent = msg; el.classList.toggle("hidden", !msg); }
function send(via, subject, body){
  if (via === "mail") location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  else if (CONFIG.whatsapp) window.open(waLink(body), "_blank", "noopener");
  else { location.href = telHref; return; }
  toast(via === "mail" ? "Si apre la tua email: premi Invia per completare" : "Si apre WhatsApp: premi Invia per completare");
}
function setupRxForm(){
  const form = $("#rxForm"); if (!form) return;
  let rxTab = "ricetta";
  const addNreField = (value="") => {
    const list = $("#nreList"), n = list.children.length;
    if (n >= 10) return toast("Massimo 10 ricette per messaggio");
    const row = document.createElement("div");
    row.className = "flex gap-2";
    row.innerHTML = `<input class="field font-mono uppercase tracking-wider" id="nre${n}" name="nre" maxlength="15" autocomplete="off" spellcheck="false" placeholder="030A0XXXXXXXXXX" aria-label="Codice NRE ${n+1}" value="${esc(value)}">` +
      (n ? `<button type="button" class="grid w-12 shrink-0 place-items-center rounded-xl border border-line bg-paper text-muted hover:text-coral" aria-label="Rimuovi"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>` : "");
    row.querySelector("button")?.addEventListener("click", () => row.remove());
    list.appendChild(row);
    if (n) row.querySelector("input").focus();
  };
  const setTab = t => {
    rxTab = t;
    $$(".tab").forEach(b => {
      const on = b.dataset.tab === t;
      b.setAttribute("aria-selected", on);
      b.className = "tab rounded-full px-4 py-2.5 text-sm font-extrabold transition " + (on ? "bg-forest-700 text-white" : "text-muted hover:text-ink");
    });
    $$("[data-pane]").forEach(p => p.classList.toggle("hidden", p.dataset.pane !== t));
  };
  addNreField();
  $("#addNre").addEventListener("click", () => addNreField());
  $$(".tab").forEach(b => b.addEventListener("click", () => setTab(b.dataset.tab)));
  setTab(location.hash === "#prodotto" ? "prodotto" : "ricetta");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const via = e.submitter?.dataset.via || "wa", f = e.target, err = $("#rxError");
    const nome = f.nome.value.trim(), tel = f.tel.value.trim();
    if (!nome) return showErr(err, "Inserisci nome e cognome.");
    if (tel.replace(/\D/g,"").length < 8) return showErr(err, "Inserisci un numero di telefono valido.");
    let corpo = "";
    if (rxTab === "ricetta") {
      const codes = $$("#nreList input").map(i => i.value.replace(/\s/g,"").toUpperCase()).filter(Boolean);
      if (!codes.length) return showErr(err, "Inserisci almeno un codice NRE.");
      const bad = codes.find(c => !/^[0-9A-Z]{15}$/.test(c));
      if (bad) return showErr(err, `Il codice ${bad} non sembra valido: deve avere 15 caratteri.`);
      corpo = `Ricette (NRE):\n${codes.map((c,i)=>`${i+1}. ${c}`).join("\n")}` + (f.delega.checked ? "\nRitira un delegato." : "");
    } else {
      const p = f.prodotto.value.trim();
      if (!p) return showErr(err, "Scrivici quale prodotto ti serve.");
      corpo = `Prodotto richiesto: ${p}` + (f.pagaOnline.checked ? "\nVorrei pagare online: mandatemi il link di pagamento." : "\nPago al ritiro.");
    }
    if (!$("#rxPrivacy").checked) return showErr(err, "Per continuare accetta l'informativa privacy.");
    showErr(err, "");
    const body = `Buongiorno, sono ${nome} (tel. ${tel}).\nVorrei prenotare:\n${corpo}\nRitiro: ${f.quando.value}` + (f.note.value.trim() ? `\nNote: ${f.note.value.trim()}` : "") + `\nGrazie!`;
    send(via, `Prenotazione ${rxTab==="ricetta"?"ricetta":"prodotto"} – ${nome}`, body);
  });
}
function setupMsgForm(){
  const form = $("#msgForm"); if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const via = e.submitter?.dataset.via || "wa", err = $("#mError");
    const nome = $("#mNome").value.trim(), testo = $("#mTesto").value.trim();
    if (!nome) return showErr(err, "Inserisci il tuo nome.");
    if (!testo) return showErr(err, "Scrivi il tuo messaggio.");
    if (!$("#mPrivacy").checked) return showErr(err, "Per continuare accetta l'informativa privacy.");
    showErr(err, "");
    const tel = $("#mTel").value.trim();
    send(via, `${$("#mArg").value} – ${nome}`, `Buongiorno, sono ${nome}${tel?` (tel. ${tel})`:""}.\nArgomento: ${$("#mArg").value}\n\n${testo}`);
  });
}

/* ---------- Interfaccia ---------- */
function setupUI(){
  const btn = $("#menuBtn"), nav = $("#mobileNav");
  btn?.addEventListener("click", () => { const closed = nav.classList.toggle("hidden"); btn.setAttribute("aria-expanded", String(!closed)); });
  $$("[data-open]").forEach(b => b.addEventListener("click", () => $("#"+b.dataset.open)?.showModal()));
  $("#loadMap")?.addEventListener("click", () => {
    $("#mapBox").innerHTML = `<iframe title="Mappa: ${esc(CONFIG.via)}, ${esc(CONFIG.citta)}" class="absolute inset-0 h-full w-full" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${encodeURIComponent(CONFIG.mapsQuery)}&output=embed"></iframe>`;
  });
  const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); rv.unobserve(e.target); } }), { threshold: .12 });
  $$(".reveal").forEach(el => rv.observe(el));
}

bindConfig();
setupPhotos();
renderHours();
setInterval(renderHours, 60000);
setupFilter();
setupRxForm();
setupMsgForm();
setupUI();
})();
