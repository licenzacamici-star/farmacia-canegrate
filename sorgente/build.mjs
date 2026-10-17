/* =====================================================================
   GENERATORE DEL SITO — crea tutte le pagine HTML statiche
   ---------------------------------------------------------------------
   Uso:  cd sorgente && npm install && npm run build
   (su GitHub lo fa in automatico l'azione .github/workflows/build.yml)

   • Dati della farmacia (telefono, orari, turni…): ../assets/config.js
   • Testi delle pagine: in questo file, nelle sezioni SERVIZI, FAQ e PAGINE
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/config.js"), "utf8"), sandbox);
const C = sandbox.window.CONFIG;
const SITE = C.sito.replace(/\/$/, "");
const OGGI = new Date().toISOString().slice(0, 10);
const VER = OGGI.replace(/-/g, "") + new Date().getUTCHours();

/* ---------------------------------------------------------------- utilità */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const TEL = "tel:" + C.telefono.replace(/\s/g, "");
const TEL_INTL = "+39 " + C.telefono;
const WA_LABEL = "+" + C.whatsapp.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, "$1 $2 $3 $4");
const wa = text => C.whatsapp ? `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}` : TEL;
const waAttr = text => `href="${esc(wa(text))}" data-wa="${esc(text)}" target="_blank" rel="noopener"`;
const MAPS = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.mapsQuery);
const INDIRIZZO = `${C.via} · ${C.cap} ${C.citta} (${C.provincia})`;
const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const ORDINE = [1, 2, 3, 4, 5, 6, 0];
const fmt = s => s.replace(/^0/, "");
const slotsText = s => s.length ? s.map(([a, b]) => `${fmt(a)}–${fmt(b)}`).join(" · ") : "Chiuso";

const ICONS = {
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  tube: '<path d="M14.5 2v17.5a2.5 2.5 0 0 1-5 0V2"/><path d="M8.5 2h7M14.5 16h-5"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  syringe: '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user: '<circle cx="10" cy="8" r="5"/><path d="M2 21a8 8 0 0 1 10.4-7.6M16 19l2 2 4-4"/>',
  file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>'
};
const icon = (k, cls = "h-5 w-5") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ""}</svg>`;
const STEMMA = cls => `<img src="/assets/stemma-canegrate.webp" alt="Stemma del Comune di Canegrate" width="125" height="160" class="${cls}">`;
const CROSS = cls => `<svg viewBox="0 0 32 32" class="${cls}" aria-hidden="true"><path d="M13 5h6v8h8v6h-8v8h-6v-8H5v-6h8z" fill="#34C27A"/></svg>`;
const ECG_SVG = (h = "h-8") => `<svg viewBox="0 0 300 40" class="mt-3 ${h} w-full" aria-hidden="true"><path class="ecg-line" d="M0 20h70l8-14 10 30 9-26 7 10h50l6-8 8 8h132" fill="none" stroke="#34C27A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ---------------------------------------------------------------- SERVIZI */
const STATO = {
  attivo: ["Senza appuntamento", "bg-forest-50 text-forest-700"],
  prenota: ["Su prenotazione", "bg-sun/20 text-ink"],
  presto: ["In arrivo", "bg-line text-muted"]
};
const SERVIZI = [
  { cat: "analisi", icona: "drop", titolo: "Glicemia", testo: "Risultato in pochi minuti con una goccia di sangue dal polpastrello.", stato: "attivo", url: "/servizi/autoanalisi-glicemia-colesterolo/#glicemia" },
  { cat: "analisi", icona: "tube", titolo: "Colesterolo e trigliceridi", testo: "Colesterolo e trigliceridi per tenere d'occhio la salute del cuore.", stato: "attivo", url: "/servizi/autoanalisi-glicemia-colesterolo/#colesterolo" },
  { cat: "analisi", icona: "gauge", titolo: "Misurazione della pressione", testo: "Pressione arteriosa e frequenza cardiaca, senza appuntamento.", stato: "attivo", url: "/servizi/misurazione-pressione/" },
  { cat: "analisi", icona: "tube", titolo: "Emoglobina glicata (HbA1c)", testo: "Il valore medio della glicemia degli ultimi tre mesi, utile per chi ha il diabete.", stato: "presto", url: "/servizi/autoanalisi-glicemia-colesterolo/#emoglobina-glicata" },
  { cat: "telemedicina", icona: "heart", titolo: "Elettrocardiogramma (ECG)", testo: "Tracciato in farmacia, referto del cardiologo in telemedicina.", stato: "prenota", url: "/servizi/elettrocardiogramma-ecg/" },
  { cat: "telemedicina", icona: "pulse", titolo: "Holter cardiaco 24h", testo: "Monitoraggio del battito per 24 ore mentre fai la tua vita normale.", stato: "prenota", url: "/servizi/holter-cardiaco/" },
  { cat: "telemedicina", icona: "gauge", titolo: "Holter pressorio 24h", testo: "Pressione registrata a intervalli per 24 ore, con referto medico.", stato: "prenota", url: "/servizi/holter-pressorio/" },
  { cat: "prevenzione", icona: "tube", titolo: "Test e tamponi diagnostici", testo: "Test rapidi e tamponi in farmacia, con risultato in pochi minuti.", stato: "prenota" },
  { cat: "prevenzione", icona: "syringe", titolo: "Vaccino antinfluenzale", testo: "Somministrazione in farmacia da parte di farmacisti formati, nella stagione vaccinale.", stato: "presto" },
  { cat: "prevenzione", icona: "wind", titolo: "Spirometria", testo: "Valuta la funzionalità respiratoria in pochi minuti.", stato: "presto" },
  { cat: "pratiche", icona: "calendar", titolo: "Prenotazione visite ed esami (CUP)", testo: "Prenotiamo per te visite ed esami del Servizio sanitario regionale.", stato: "attivo", url: "/servizi/prenotazione-cup/" },
  { cat: "pratiche", icona: "truck", titolo: "Consegna a domicilio", testo: "Per chi non può muoversi: portiamo farmaci e prodotti a casa.", stato: "attivo", url: "/servizi/consegna-a-domicilio/" },
  { cat: "pratiche", icona: "file", titolo: "Ordina su WhatsApp, ritira in farmacia", testo: "Scrivici cosa ti serve, paga online con il link che ti inviamo e passa a ritirare.", stato: "attivo", url: "/ordina-su-whatsapp/" },
  { cat: "pratiche", icona: "user", titolo: "Scelta e revoca del medico di base", testo: "Scegli o cambi il medico di famiglia o il pediatra direttamente in farmacia, senza andare agli sportelli ASST.", stato: "attivo", url: "/servizi/scelta-revoca-medico/" }
];

const REPARTI = [
  { id: "dermocosmesi", titolo: "Dermocosmesi", testo: "Viso, corpo, solari. Consulenza sulla tua pelle.", img: "photo-1620916297397-a4a5402a3c6c",
    lungo: `<p>Detergenti, creme viso e corpo, prodotti per pelli sensibili, secche, impure o con tendenza all'arrossamento, solari per adulti e bambini. Ti aiutiamo a scegliere in base al tuo tipo di pelle e a quello che stai già usando, senza farti comprare più del necessario.</p><p>Se hai un problema della pelle che non migliora, ti consigliamo di parlarne con il medico o con il dermatologo: in farmacia possiamo affiancarti con i prodotti adatti alla terapia.</p>` },
  { id: "mamma-infanzia", titolo: "Mamma e infanzia", testo: "Latti, pappe, igiene e benessere del bambino.", img: "photo-1533483595632-c5f0e57a1936",
    lungo: `<p>Latti formulati, pappe e alimenti per la prima infanzia, prodotti per il cambio e l'igiene del neonato, accessori per l'allattamento, termometri e aspiratori nasali. Per la gravidanza e l'allattamento trovi integratori specifici e prodotti per la cura del corpo.</p><p>Se un latte o un alimento particolare non è disponibile lo ordiniamo: di solito arriva entro il giorno lavorativo successivo.</p>` },
  { id: "veterinaria", titolo: "Veterinaria", testo: "Antiparassitari, farmaci veterinari su ricetta, integratori.", img: "photo-1654895716780-b4664497420d",
    lungo: `<p>Antiparassitari per cani e gatti (pipette, collari, compresse), farmaci veterinari con e senza ricetta, integratori e prodotti per l'igiene degli animali da compagnia.</p><p>Per i farmaci veterinari con ricetta basta che il veterinario emetta la ricetta elettronica veterinaria: ci comunichi il numero della ricetta e il codice fiscale del proprietario e prepariamo tutto.</p>` },
  { id: "fitoterapia-integratori", titolo: "Fitoterapia e integratori", testo: "Fitoterapici, tisane e integratori selezionati.", img: "photo-1514733670139-4d87a1941d55",
    lungo: `<p>Integratori di vitamine e minerali, fermenti lattici, prodotti per il sonno, la digestione, le difese e le articolazioni, tisane e preparati a base di piante.</p><p>Anche i prodotti naturali possono interagire con i farmaci: dicci sempre cosa stai già prendendo, così ti consigliamo in sicurezza.</p>` }
];

const FAQ = [
  ["Cos'è il codice NRE e dove lo trovo?", "È il Numero di Ricetta Elettronica: un codice di 15 caratteri stampato sul promemoria cartaceo o inviato dal medico via SMS, email o app. Puoi trovare le tue ricette anche nel Fascicolo Sanitario Elettronico."],
  ["Posso ritirare i farmaci per un familiare?", "Sì. Porta la tessera sanitaria della persona a cui è intestata la ricetta. Per alcuni farmaci può servire anche un documento di chi ritira."],
  ["Devo prenotare per glicemia o pressione?", "No, le misurazioni rapide si fanno al bancone negli orari di apertura. Per ECG, Holter ed emoglobina glicata è meglio prenotare."],
  ["L'ECG in farmacia è gratuito?", "Dipende. In Lombardia ECG e Holter in farmacia sono gratuiti per chi rientra nei requisiti regionali, per esempio con esenzione per patologia cardiovascolare e prescrizione del medico. Negli altri casi sono a pagamento: chiedici la tariffa."],
  ["Se il farmaco non c'è, quanto tempo serve?", "Di solito lo ordiniamo e arriva entro il giorno lavorativo successivo. Ti scriviamo su WhatsApp appena è pronto."],
  ["Come funziona l'ordine su WhatsApp?", "Scrivici cosa ti serve: ti confermiamo disponibilità e prezzo e ti inviamo un link per pagare online. Quando l'ordine è pronto ti avvisiamo e passi a ritirarlo in farmacia. I farmaci si pagano al momento del ritiro."],
  ["Fate consegne a domicilio?", "Sì, per chi ha difficoltà a muoversi. Scrivici o chiamaci per accordarci su giorno e orario."],
  ["C'è parcheggio?", "Sì, c'è un parcheggio gratuito vicino alla farmacia, anche con posti accessibili in carrozzina."],
  ["Posso cambiare il medico di base in farmacia?", "Sì. Con la tessera sanitaria e un documento d'identità puoi scegliere o cambiare il medico di famiglia o il pediatra direttamente al bancone, senza appuntamento."],
  ["Dove trovo la farmacia di turno?", "Nella pagina «Farmacia di turno» trovi i nostri turni e il collegamento al servizio ufficiale con le farmacie aperte di notte e nei festivi. In caso di emergenza chiama il 112."]
];
const orariFrase = () => {
  const feriali = slotsText(C.orari[1]);
  const sab = slotsText(C.orari[6]);
  return `Dal lunedì al venerdì ${feriali}, il sabato ${sab}, la domenica ${C.orari[0].length ? slotsText(C.orari[0]) : "siamo chiusi"}.`;
};
const FAQ_EXTRA = [
  ["Quali sono gli orari della farmacia?", `${orariFrase()} Nei giorni festivi siamo chiusi, salvo quando siamo di turno.`],
  ["Dove si trova la Farmacia Comunale di Canegrate?", `In ${C.via}, sotto il porticato, nel quartiere ${C.quartiere} di ${C.citta}. È comoda anche per chi arriva da ${C.comuniVicini.slice(0, 3).join(", ")}.`]
];

/* ---------------------------------------------------------------- dati strutturati */
const OPENING = [];
Object.entries(C.orari).forEach(([g, slots]) => slots.forEach(([o, c]) => OPENING.push({ "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][g], opens: o, closes: c })));
const PHARMACY = {
  "@context": "https://schema.org",
  "@type": "Pharmacy",
  "@id": SITE + "/#farmacia",
  name: C.nome,
  alternateName: `Farmacia Comunale ${C.citta} ${C.quartiere}`,
  url: SITE + "/",
  telephone: TEL_INTL,
  ...(C.email ? { email: C.email } : {}),
  image: [SITE + "/foto/negozio.jpg", SITE + "/foto/vetrina.jpg", SITE + "/foto/team.jpg"],
  logo: SITE + "/assets/logo.svg",
  address: { "@type": "PostalAddress", streetAddress: C.via, addressLocality: C.citta, postalCode: C.cap, addressRegion: C.provincia, addressCountry: "IT" },
  hasMap: MAPS,
  areaServed: [C.citta, ...C.comuniVicini].map(n => ({ "@type": "City", name: n })),
  openingHoursSpecification: OPENING,
  currenciesAccepted: "EUR",
  paymentAccepted: "Contanti, carte di pagamento, contactless",
  amenityFeature: C.comodita.map(n => ({ "@type": "LocationFeatureSpecification", name: n, value: true })),
  parentOrganization: { "@type": "Organization", name: C.gestore, vatID: "IT" + C.piva },
  sameAs: [C.google.url]
};
const crumbsLd = crumbs => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: crumbs.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + url }))
});
const faqLd = list => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: list.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))
});
const serviceLd = (p) => ({
  "@context": "https://schema.org", "@type": "Service",
  name: p.nomeServizio, serviceType: p.nomeServizio, description: p.description,
  url: SITE + p.path, provider: { "@id": SITE + "/#farmacia" },
  areaServed: [C.citta, ...C.comuniVicini].map(n => ({ "@type": "City", name: n }))
});

/* ---------------------------------------------------------------- blocchi comuni */
const NAV = [
  ["/", "Home"],
  ["/servizi/", "Servizi"],
  ["/prenota-ricetta/", "Prenota ricetta"],
  ["/chi-siamo/", "Chi siamo"],
  ["/orari-e-dove-siamo/", "Orari e dove siamo"],
  ["/farmacia-di-turno/", "Turni"],
  ["/contatti/", "Contatti"]
];
const isActive = (href, cur) => href === "/" ? cur === "/" : cur.startsWith(href);

const header = cur => `
<a href="#contenuto" class="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-paper focus:px-4 focus:py-2">Vai al contenuto</a>
<div class="bg-forest-900 text-[13px] text-forest-100">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
    <p class="truncate"><span class="font-bold text-cross">Nuova apertura</span> · ${esc(C.apertura)} nel quartiere ${esc(C.quartiere)}</p>
    <div class="hidden items-center gap-5 md:flex">
      <a href="${TEL}" data-href="tel" class="hover:text-white">Tel. ${esc(C.telefono)}</a>
      <a href="/orari-e-dove-siamo/" class="flex items-center gap-2 hover:text-white"><span class="status-dot h-2 w-2 rounded-full bg-cross"></span><span class="status-short">${esc(orariFrase())}</span></a>
    </div>
  </div>
</div>
<header class="sticky top-0 z-50 border-b border-line/70 bg-cream/85 backdrop-blur-md">
  <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
    <a href="/" class="flex items-center gap-3" aria-label="${esc(C.nome)} – pagina iniziale">
      <span class="grid h-11 w-11 place-items-center rounded-xl bg-forest-700">${CROSS("h-7 w-7")}</span>
      <span class="leading-tight">
        <span class="block font-display text-[19px] font-semibold text-ink">Farmacia Comunale</span>
        <span class="block whitespace-nowrap text-[12px] font-bold uppercase tracking-[.08em] text-forest-600 sm:tracking-[.14em]">${esc(C.citta)} · ${esc(C.quartiere)}</span>
      </span>
      <span class="flex items-center border-l border-line pl-2.5 sm:ml-1 sm:pl-3">${STEMMA("h-9 w-auto sm:h-11")}</span>
    </a>
    <nav class="hidden items-center gap-1 xl:flex" aria-label="Principale">
      ${NAV.map(([h, t]) => `<a class="navlink" href="${h}"${isActive(h, cur) ? ' aria-current="page"' : ""}>${t}</a>`).join("\n      ")}
    </nav>
    <div class="flex items-center gap-2">
      <a href="/prenota-ricetta/" class="btn-primary hidden !px-4 !py-2.5 sm:inline-flex">Prenota ricetta</a>
      <button id="menuBtn" class="grid h-11 w-11 place-items-center rounded-xl border border-line bg-paper xl:hidden" aria-expanded="false" aria-controls="mobileNav" aria-label="Apri il menu">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </div>
  <nav id="mobileNav" class="hidden border-t border-line bg-cream px-4 pb-4 xl:hidden" aria-label="Menu mobile">
    <div class="grid gap-1 pt-2 text-lg font-semibold sm:grid-cols-2">
      ${[...NAV, ["/ordina-su-whatsapp/", "Ordina su WhatsApp"], ["/domande-frequenti/", "Domande frequenti"]].map(([h, t]) => `<a class="rounded-xl px-3 py-3 hover:bg-forest-50${isActive(h, cur) ? " bg-forest-50 text-forest-700" : ""}" href="${h}"${isActive(h, cur) ? ' aria-current="page"' : ""}>${t}</a>`).join("\n      ")}
    </div>
  </nav>
</header>`;

const serviziConPagina = SERVIZI.filter(s => s.url && !s.url.includes("#") && s.url.startsWith("/servizi/"));
const footer = () => `
<footer class="bg-forest-900 pb-28 pt-14 text-forest-100 lg:pb-14">
  <div class="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
    <div>
      <a href="/" class="flex items-center gap-3">
        <span class="grid h-10 w-10 place-items-center rounded-xl bg-white/10">${CROSS("h-6 w-6")}</span>
        <span class="font-display text-lg font-semibold text-white">${esc(C.nome)}</span>
      </a>
      <p class="mt-4 flex items-center gap-3 text-sm">${STEMMA("h-12 w-auto")}<span>Farmacia del <strong class="text-white">Comune di ${esc(C.citta)}</strong></span></p>
      <address class="mt-4 text-sm not-italic">${esc(C.via)}<br>${esc(C.cap)} ${esc(C.citta)} (${esc(C.provincia)}) · quartiere ${esc(C.quartiere)}</address>
      <p class="mt-2 text-sm">Tel. <a href="${TEL}" data-href="tel" class="font-bold hover:text-white">${esc(C.telefono)}</a></p>
      <p class="mt-1 text-sm">WhatsApp <a ${waAttr("Buongiorno, vorrei un'informazione.")} class="font-bold hover:text-white">${esc(WA_LABEL)}</a></p>
      <p class="mt-4 text-xs text-forest-100/70">Gestita da ${esc(C.gestore)} · P. IVA ${esc(C.piva)}<br>Sede legale: ${esc(C.sedeLegale)}</p>
    </div>
    <div class="text-sm">
      <p class="font-bold text-white">Orari</p>
      <table class="mt-3 w-full"><tbody data-hours-list>${ORDINE.map(g => `<tr><th scope="row" class="py-0.5 text-left font-normal">${GIORNI[g]}</th><td class="py-0.5 text-right tabular-nums">${slotsText(C.orari[g])}</td></tr>`).join("")}</tbody></table>
      <p class="mt-3"><a href="/farmacia-di-turno/" class="font-bold hover:text-white">Farmacia di turno →</a></p>
    </div>
    <div class="text-sm">
      <p class="font-bold text-white">Servizi</p>
      <ul class="mt-3 space-y-2">
        ${serviziConPagina.map(s => `<li><a class="hover:text-white" href="${s.url}">${esc(s.titolo)}</a></li>`).join("\n        ")}
        <li><a class="hover:text-white" href="/servizi/">Tutti i servizi</a></li>
      </ul>
    </div>
    <div class="text-sm">
      <p class="font-bold text-white">La farmacia</p>
      <ul class="mt-3 space-y-2">
        <li><a class="hover:text-white" href="/prenota-ricetta/">Prenota la ricetta</a></li>
        <li><a class="hover:text-white" href="/ordina-su-whatsapp/">Ordina su WhatsApp e ritira</a></li>
        <li><a class="hover:text-white" href="/reparti/">Reparti e prodotti</a></li>
        <li><a class="hover:text-white" href="/chi-siamo/">Chi siamo</a></li>
        <li><a class="hover:text-white" href="/orari-e-dove-siamo/">Orari e dove siamo</a></li>
        <li><a class="hover:text-white" href="/domande-frequenti/">Domande frequenti</a></li>
        <li><a class="hover:text-white" href="/contatti/">Contatti</a></li>
        <li><a class="hover:text-white" href="/privacy/">Privacy e cookie</a></li>
        <li><a class="hover:text-white" href="https://www.fascicolosanitario.regione.lombardia.it/" target="_blank" rel="noopener">Fascicolo Sanitario Lombardia ↗</a></li>
      </ul>
    </div>
  </div>
  <p class="mx-auto mt-10 max-w-7xl px-4 text-xs text-forest-100/60 sm:px-6">© <span class="year">${new Date().getFullYear()}</span> ${esc(C.nome)}. Le informazioni del sito non sostituiscono il parere del medico. Alcune foto di esempio: Unsplash. Stemma del Comune di Canegrate: <a href="https://commons.wikimedia.org/wiki/File:Canegrate-Stemma.svg" target="_blank" rel="noopener" class="underline hover:text-white">Arrow303 via Wikimedia Commons</a>, licenza <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.it" target="_blank" rel="noopener" class="underline hover:text-white">CC BY-SA 4.0</a>.</p>
</footer>

<nav class="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-paper/95 p-2 shadow-2xl backdrop-blur lg:hidden" aria-label="Azioni rapide">
  <a href="${TEL}" data-href="tel" class="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-bold text-ink">${icon("phone")}Chiama</a>
  <a ${waAttr("Buongiorno, vorrei un'informazione.")} class="flex flex-col items-center gap-1 rounded-xl bg-forest-500 py-2 text-xs font-bold text-white">${icon("chat")}WhatsApp</a>
  <a href="${esc(MAPS)}" target="_blank" rel="noopener" class="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-bold text-ink">${icon("pin")}Indicazioni</a>
</nav>
<a ${waAttr("Buongiorno, vorrei un'informazione.")} aria-label="Scrivici su WhatsApp"
   class="fixed bottom-6 right-6 z-40 hidden h-14 items-center gap-2 rounded-full bg-forest-500 pl-4 pr-5 font-bold text-white shadow-[0_12px_30px_-8px_rgba(35,152,92,.7)] transition hover:bg-forest-600 lg:inline-flex">${icon("chat", "h-6 w-6")}WhatsApp</a>
<div id="toast" class="pointer-events-none fixed inset-x-0 top-20 z-[60] flex justify-center px-4 opacity-0 transition" role="status" aria-live="polite">
  <div class="rounded-full bg-forest-900 px-5 py-3 text-sm font-bold text-white shadow-xl"></div>
</div>`;

const breadcrumbs = crumbs => `
<nav aria-label="Percorso" class="mx-auto max-w-7xl px-4 pt-6 text-sm sm:px-6">
  <ol class="flex flex-wrap items-center gap-1.5 text-muted">
    ${crumbs.map(([n, u], i) => i < crumbs.length - 1
      ? `<li><a href="${u}" class="font-semibold hover:text-forest-700">${esc(n)}</a></li><li aria-hidden="true">›</li>`
      : `<li aria-current="page" class="font-semibold text-ink">${esc(n)}</li>`).join("")}
  </ol>
</nav>`;

const pageHero = ({ eyebrow, h1, intro, ctas = "", aside = "" }) => `
<section class="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:pb-16 lg:pt-12">
  <div class="grid items-center gap-10 ${aside ? "lg:grid-cols-[1.15fr_1fr] lg:gap-14" : ""}">
    <div class="max-w-3xl">
      <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>${eyebrow}</p>
      <h1 class="mt-3 font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[56px]">${h1}</h1>
      <p class="mt-5 max-w-2xl text-lg leading-relaxed text-muted">${intro}</p>
      ${ctas ? `<div class="mt-8 flex flex-wrap gap-3">${ctas}</div>` : ""}
    </div>
    ${aside}
  </div>
</section>`;

const btnWa = (text, label = "Scrivici su WhatsApp", extra = "") => `<a ${waAttr(text)} class="btn-wa !px-6 !py-3.5 ${extra}">${icon("chat")}${label}</a>`;
const btnTel = (label = `Chiama ${C.telefono}`) => `<a href="${TEL}" data-href="tel" class="btn-ghost !px-6 !py-3.5">${icon("phone", "h-4 w-4")}${esc(label)}</a>`;

const serviceCard = s => {
  const [lab, cls] = STATO[s.stato];
  const inner = `
      <div class="flex items-start justify-between gap-3">
        <span class="grid h-12 w-12 place-items-center rounded-2xl bg-forest-50 text-forest-700">${icon(s.icona, "h-6 w-6")}</span>
        <span class="rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${cls}">${lab}</span>
      </div>
      <h3 class="mt-5 text-lg font-extrabold">${s.url ? `<a href="${s.url}" class="after:absolute after:inset-0 hover:text-forest-700">${esc(s.titolo)}</a>` : esc(s.titolo)}</h3>
      <p class="mt-1.5 flex-1 text-[15px] leading-relaxed text-muted">${esc(s.testo)}</p>`;
  const cta = s.stato === "presto"
    ? `<span class="text-sm font-semibold text-muted">Disponibile a breve</span>`
    : s.url
      ? `<span class="inline-flex items-center gap-1.5 text-sm font-extrabold text-forest-600">Scopri di più ${icon("arrow", "h-4 w-4 transition group-hover:translate-x-0.5")}</span>`
      : `<a ${waAttr(`Buongiorno, vorrei informazioni / prenotare: ${s.titolo}.`)} class="relative z-10 inline-flex items-center gap-1.5 text-sm font-extrabold text-forest-600 hover:text-forest-700">${s.stato === "prenota" ? "Prenota" : "Chiedi info"} ${icon("arrow", "h-4 w-4")}</a>`;
  return `<article data-cat="${s.cat}" class="group card relative flex flex-col p-6 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(14,77,63,.45)]">${inner}
      <div class="mt-5 border-t border-line pt-4">${cta}</div>
    </article>`;
};

const faqBlock = (list, title = "Domande frequenti", headingTag = "h2") => `
<section class="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20" aria-labelledby="faq-titolo">
  <${headingTag} id="faq-titolo" class="h2 text-center">${title}</${headingTag}>
  <div class="mt-10 space-y-3">
    ${list.map(([q, a]) => `<details class="group card px-6 py-5 open:border-forest-500">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold [&::-webkit-details-marker]:hidden"><h3 class="text-lg font-bold">${esc(q)}</h3>
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest-50 text-forest-700 transition group-open:rotate-45"><svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
      </summary>
      <p class="mt-3 leading-relaxed text-muted">${esc(a)}</p>
    </details>`).join("\n    ")}
  </div>
</section>`;

const hoursRows = dark => ORDINE.map(g => `<tr><th scope="row" class="rounded-l-lg py-2.5 pl-3 text-left font-semibold">${GIORNI[g]}</th><td class="rounded-r-lg py-2.5 pr-3 text-right tabular-nums ${C.orari[g].length ? "" : dark ? "text-forest-100/60" : "text-muted"}">${slotsText(C.orari[g])}</td></tr>`).join("");

const ctaBand = (titolo = "Hai una domanda? Chiedi al farmacista.", testo = "Scrivici su WhatsApp o chiamaci negli orari di apertura: ti rispondiamo noi, non un call center.") => `
<section class="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:pb-28">
  <div class="overflow-hidden rounded-[32px] bg-forest-900 text-white">
    <div class="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:p-14">
      <div>
        <h2 class="font-display text-3xl font-semibold leading-tight sm:text-4xl">${titolo}</h2>
        <p class="mt-4 max-w-xl text-forest-100">${testo}</p>
        <div class="mt-7 flex flex-wrap gap-3">
          ${btnWa("Buongiorno, vorrei un'informazione.")}
          <a href="${TEL}" data-href="tel" class="btn border border-white/25 !px-6 !py-3.5 text-white hover:bg-white/10">${icon("phone", "h-4 w-4")}${esc(C.telefono)}</a>
        </div>
      </div>
      <div class="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
        <p class="text-sm font-bold uppercase tracking-wider text-forest-100/70">Dove siamo</p>
        <p class="mt-1 text-lg font-bold">${esc(C.via)}, ${esc(C.citta)}</p>
        <p class="text-forest-100">Quartiere ${esc(C.quartiere)}, sotto il porticato · parcheggio gratuito</p>
        <p class="mt-4 text-sm font-bold uppercase tracking-wider text-forest-100/70">Oggi</p>
        <p class="today-hours mt-1 text-lg font-bold">${esc(slotsText(C.orari[1]))}</p>
        <a href="/orari-e-dove-siamo/" class="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-cross hover:text-white">Orari e indicazioni ${icon("arrow", "h-4 w-4")}</a>
      </div>
    </div>
  </div>
</section>`;

const relatedServices = (urls, titolo = "Altri servizi della farmacia") => `
<section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:pb-20">
  <h2 class="font-display text-3xl font-semibold">${titolo}</h2>
  <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    ${SERVIZI.filter(s => urls.includes(s.url)).map(serviceCard).join("\n    ")}
  </div>
</section>`;

const infoBox = (titolo, testo, tone = "sun") => `<div class="mt-10 flex gap-4 rounded-2xl border ${tone === "coral" ? "border-coral/40 bg-coral/10" : "border-sun/50 bg-sun/10"} p-5 text-[15px]">
  <span class="mt-0.5 shrink-0 ${tone === "coral" ? "text-coral" : "text-ink"}">${icon(tone === "coral" ? "alert" : "file")}</span>
  <div><p class="font-bold text-ink">${titolo}</p><p class="mt-1 text-muted">${testo}</p></div>
</div>`;

/* Pagina di servizio: testo lungo a sinistra, riquadro "prenota" a destra */
const servicePage = p => {
  const statoInfo = STATO[p.stato];
  const side = `
    <aside class="lg:sticky lg:top-28">
      <div class="card p-6 sm:p-7">
        <span class="rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider ${statoInfo[1]}">${statoInfo[0]}</span>
        <p class="mt-4 font-display text-2xl font-semibold leading-snug">${p.boxTitolo}</p>
        <ul class="mt-4 space-y-2 text-[15px] text-muted">${p.box.map(b => `<li class="flex gap-2"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cross"></span><span>${b}</span></li>`).join("")}</ul>
        <div class="mt-6 grid gap-2">
          ${btnWa(p.waMsg, p.stato === "prenota" ? "Prenota su WhatsApp" : "Chiedi su WhatsApp", "w-full")}
          <a href="${TEL}" data-href="tel" class="btn-ghost w-full">${icon("phone", "h-4 w-4")}Chiama ${esc(C.telefono)}</a>
        </div>
        <p class="mt-5 border-t border-line pt-4 text-sm text-muted"><strong class="text-ink">${esc(C.nome)}</strong><br>${esc(C.via)}, ${esc(C.citta)} · <a href="/orari-e-dove-siamo/" class="font-bold text-forest-700 underline underline-offset-2">orari</a></p>
      </div>
    </aside>`;
  return `
${pageHero({ eyebrow: p.eyebrow, h1: p.h1, intro: p.intro, ctas: btnWa(p.waMsg, p.stato === "prenota" ? "Prenota su WhatsApp" : "Scrivici su WhatsApp") + btnTel() })}
<section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
  <div class="grid gap-10 lg:grid-cols-[1fr_360px] lg:gap-16">
    <div class="prose-farmacia max-w-3xl">${p.corpo}</div>
    ${side}
  </div>
</section>
${p.faq ? faqBlock(p.faq, "Domande frequenti") : ""}
${relatedServices(p.related)}
${ctaBand()}`;
};

/* ---------------------------------------------------------------- layout pagina */
const layout = p => {
  const ld = [...(p.schema || [])];
  if (p.crumbs) ld.push(crumbsLd(p.crumbs));
  const url = SITE + p.path;
  const og = p.ogImage || SITE + "/foto/negozio.jpg";
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- Pagina generata da sorgente/build.mjs: per modificare i testi cambia quel file, non questo. -->
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${p.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}">
<meta name="theme-color" content="#0E4D3F">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(C.nome)}">
<meta property="og:locale" content="it_IT">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.ogTitle || p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:image" content="${og}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/logo.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/logo.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css?v=${VER}">
<script>document.documentElement.classList.add("js")</script>
${ld.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
</head>
<body class="font-sans antialiased">
${header(p.path)}
<main id="contenuto">
${p.crumbs ? breadcrumbs(p.crumbs) : ""}
${p.body}
</main>
${footer()}
<script src="/assets/config.js?v=${VER}"></script>
<script src="/assets/site.js?v=${VER}" defer></script>
</body>
</html>
`;
};

/* =====================================================================
   PAGINE
   ===================================================================== */
const PAGES = [];
const add = p => PAGES.push(p);
const HOME = ["Home", "/"];
const SERV = ["Servizi", "/servizi/"];

/* ---------------------------------------------------------------- HOME */
add({
  path: "/", priority: "1.0",
  title: `${C.nome} · Quartiere ${C.quartiere} | Ricette, autoanalisi, ECG`,
  description: `Farmacia Comunale di Canegrate, quartiere Cascinette (Piazza della Musica 6). Prenota la ricetta su WhatsApp, autoanalisi, ECG e Holter, CUP, consegna a domicilio. Vicina a Legnano.`,
  schema: [PHARMACY, { "@context": "https://schema.org", "@type": "WebSite", "@id": SITE + "/#sito", name: C.nome, url: SITE + "/", inLanguage: "it-IT", publisher: { "@id": SITE + "/#farmacia" } }],
  body: `
<section class="relative overflow-hidden">
  <div class="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pb-24 lg:pt-16">
    <div>
      <a href="/orari-e-dove-siamo/" class="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line bg-paper py-1.5 pl-2 pr-4 text-sm font-bold text-ink hover:border-forest-500">
        <span class="status-pill rounded-full bg-forest-50 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-forest-700">Orari</span>
        <span class="status-long text-muted">Lun–ven ${esc(slotsText(C.orari[1]))}</span>
      </a>
      <h1 class="font-display text-[44px] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[68px]">
        <span class="sr-only">Farmacia Comunale Canegrate: </span>La farmacia<br>del tuo quartiere,<br><span class="italic text-forest-600">a portata di messaggio.</span>
      </h1>
      <p class="mt-6 max-w-xl text-lg leading-relaxed text-muted">
        Prenoti la ricetta su WhatsApp e passi a ritirarla quando è pronta, senza code.
        Autoanalisi, ECG e Holter, consigli su misura: siamo la nuova <strong class="text-ink">Farmacia Comunale
        delle Cascinette di Canegrate</strong>, a pochi minuti da Legnano.
      </p>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="/prenota-ricetta/" class="btn-primary !px-6 !py-3.5">Prenota la ricetta ${icon("arrow", "h-4 w-4")}</a>
        ${btnWa("Buongiorno, vorrei un'informazione.")}
      </div>
      <dl class="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6">
        <div><dt class="text-xs font-bold uppercase tracking-wider text-muted">Oggi</dt><dd class="today-hours mt-1 text-[15px] font-bold text-ink">${esc(slotsText(C.orari[1]))}</dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-wider text-muted">Ordini</dt><dd class="mt-1 text-[15px] font-bold text-ink">WhatsApp e ritiro*</dd></div>
        <div><dt class="text-xs font-bold uppercase tracking-wider text-muted">Distributore</dt><dd class="h24-short mt-1 text-[15px] font-bold text-ink">H24 in arrivo</dd></div>
      </dl>
      <p class="mt-3 text-xs text-muted">*Ricette e ordini pronti di solito in giornata: ti avvisiamo noi quando puoi passare.</p>
      <a data-rating href="${esc(C.google.url)}" target="_blank" rel="noopener" class="mt-6 inline-flex items-center gap-3 rounded-full border border-line bg-paper py-2 pl-3 pr-4 text-sm transition hover:border-forest-500">
        <span class="r-voto font-display text-lg font-semibold text-ink">${esc(C.google.voto)}</span>
        <span class="text-sun" aria-hidden="true">★★★★★</span>
        <span class="r-num font-semibold text-muted">${C.google.recensioni} recensioni su Google</span>
      </a>
    </div>
    <div class="relative">
      <div class="absolute -right-24 -top-16 h-80 w-80 rounded-full bg-forest-100/70 blur-3xl" aria-hidden="true"></div>
      <figure class="relative overflow-hidden rounded-[32px] bg-forest-100 shadow-[0_30px_60px_-30px_rgba(14,77,63,.45)]" data-foto="foto/negozio.jpg">
        <img class="aspect-[4/3] w-full object-cover sm:aspect-square lg:aspect-[4/5]" src="/foto/negozio.jpg"
             data-fallback="https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1200&q=75&auto=format"
             alt="Interno della Farmacia Comunale di Canegrate, quartiere Cascinette" width="960" height="1200" fetchpriority="high">
      </figure>
      <a href="/servizi/elettrocardiogramma-ecg/" class="absolute -bottom-6 left-4 right-4 block rounded-2xl border border-line bg-paper/95 p-4 shadow-xl backdrop-blur hover:border-forest-500 sm:left-auto sm:right-6 sm:w-72">
        <span class="flex items-center gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest-50 text-forest-700">${icon("heart")}</span>
          <span><span class="block text-sm font-extrabold text-ink">ECG e Holter in farmacia</span><span class="block text-[13px] text-muted">Referto del cardiologo a distanza</span></span>
        </span>
        ${ECG_SVG()}
      </a>
    </div>
  </div>
</section>

<section aria-label="Azioni rapide" class="mx-auto max-w-7xl px-4 sm:px-6">
  <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    ${[
      ["/prenota-ricetta/", "file", "Prenota ricetta", "Invia il codice NRE, ritiri senza attese.", true],
      ["/servizi/autoanalisi-glicemia-colesterolo/", "drop", "Autoanalisi", "Glicemia, colesterolo, pressione."],
      ["/farmacia-di-turno/", "clock", "Farmacia di turno", "Chi è aperto stanotte e nei festivi."],
      ["/orari-e-dove-siamo/", "pin", "Dove siamo", `${C.via}, quartiere ${C.quartiere}`]
    ].map(([u, ic, t, d, main]) => `<a href="${u}" class="group card reveal flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:border-forest-500 sm:p-6">
      <span class="grid h-11 w-11 place-items-center rounded-xl ${main ? "bg-forest-700 text-white" : "bg-forest-50 text-forest-700"}">${icon(ic)}</span>
      <span class="font-display text-xl font-semibold">${t}</span>
      <span class="text-sm text-muted">${esc(d)}</span>
    </a>`).join("\n    ")}
  </div>
</section>

<section class="py-20 lg:py-28">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div class="reveal max-w-2xl">
        <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>Servizi</p>
        <h2 class="h2 mt-3">Prevenzione e controlli, senza andare in ospedale.</h2>
        <p class="mt-4 text-lg text-muted">Molti esami si fanno in pochi minuti al bancone. Per quelli su prenotazione basta un messaggio: ti diamo giorno e ora.</p>
      </div>
      <a href="/servizi/" class="btn-ghost reveal self-start lg:self-auto">Tutti i servizi ${icon("arrow", "h-4 w-4")}</a>
    </div>
    <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${SERVIZI.filter(s => s.url && s.stato !== "presto" && s.titolo !== "Colesterolo e trigliceridi").slice(0, 6).map(serviceCard).join("\n      ")}
    </div>

    <div class="reveal mt-14 overflow-hidden rounded-[32px] bg-forest-700 text-white">
      <div class="grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:p-14">
        <div>
          <p class="eyebrow !text-cross"><span class="h-px w-6 bg-cross"></span>Telemedicina</p>
          <h2 class="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">Elettrocardiogramma e Holter, refertati dal cardiologo.</h2>
          <p class="mt-4 max-w-xl text-forest-100">Esegui l'esame da noi, il tracciato viene inviato a un centro cardiologico e ricevi il referto firmato. In Lombardia alcune prestazioni sono gratuite per chi ha i requisiti previsti dalla Regione: chiedici se rientri.</p>
          <div class="mt-7 flex flex-wrap gap-3">
            <a href="/servizi/elettrocardiogramma-ecg/" class="btn bg-white text-forest-700 hover:bg-forest-50">ECG in farmacia</a>
            <a href="/servizi/holter-cardiaco/" class="btn border border-white/30 text-white hover:bg-white/10">Holter cardiaco</a>
            <a href="/servizi/holter-pressorio/" class="btn border border-white/30 text-white hover:bg-white/10">Holter pressorio</a>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="rounded-2xl bg-white/10 p-4"><p class="font-display text-3xl font-semibold">ECG</p><p class="mt-1 text-xs text-forest-100">a riposo, 12 derivazioni</p></div>
          <div class="rounded-2xl bg-white/10 p-4"><p class="font-display text-3xl font-semibold">24h</p><p class="mt-1 text-xs text-forest-100">Holter cardiaco</p></div>
          <div class="rounded-2xl bg-white/10 p-4"><p class="font-display text-3xl font-semibold">24h</p><p class="mt-1 text-xs text-forest-100">Holter pressorio</p></div>
          <div class="col-span-3">${ECG_SVG("h-12")}</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bg-paper py-20 lg:py-28">
  <div class="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
    <div class="reveal">
      <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>Prenota ricetta</p>
      <h2 class="h2 mt-3">Mandaci la ricetta,<br>al resto pensiamo noi.</h2>
      <p class="mt-4 text-lg text-muted">Niente attese al bancone: prepariamo i farmaci in anticipo e ti scriviamo quando sono pronti.</p>
      <a href="/prenota-ricetta/" class="btn-primary mt-8 !px-6 !py-3.5">Prenota la ricetta ${icon("arrow", "h-4 w-4")}</a>
    </div>
    <ol class="reveal space-y-6">
      ${[["Inviaci il codice NRE", "È il numero di ricetta elettronica che trovi sul promemoria o nel messaggio del tuo medico."], ["Ti avvisiamo quando è pronto", "Se un farmaco va ordinato ti diciamo subito quando arriva."], ["Ritiri con la tessera sanitaria", "Porta la tessera sanitaria dell'assistito. Puoi delegare un familiare."]].map(([t, d], i) => `<li class="flex gap-4">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-700 font-display text-lg font-semibold text-white">${i + 1}</span>
        <div><p class="font-bold">${t}</p><p class="text-muted">${d}</p></div>
      </li>`).join("\n      ")}
    </ol>
  </div>
  <div class="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
    <div class="reveal grid gap-8 overflow-hidden rounded-[32px] bg-forest-50 p-7 ring-1 ring-forest-100 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-14">
      <div>
        <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>Ordina e ritira</p>
        <h2 class="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">Ordina su WhatsApp, paga online, ritira da noi.</h2>
        <p class="mt-4 text-lg text-muted">Cosmetici, integratori, prodotti per l'infanzia e per la casa: li prepariamo noi, tu passi solo a prenderli.</p>
      </div>
      <div class="flex flex-wrap gap-3 lg:justify-end">
        ${btnWa("Buongiorno, vorrei fare un ordine da ritirare in farmacia: ", "Ordina su WhatsApp")}
        <a href="/ordina-su-whatsapp/" class="btn-ghost !px-6 !py-3.5">Come funziona</a>
      </div>
    </div>
  </div>
</section>

<section class="py-20 lg:py-28">
  <div class="mx-auto max-w-7xl px-4 sm:px-6">
    <div class="reveal flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>Reparti</p>
        <h2 class="h2 mt-3">Oltre al farmaco.</h2>
      </div>
      <p class="max-w-md text-muted">Prodotti selezionati e consiglio del farmacista. Se non lo abbiamo, lo ordiniamo: di solito arriva entro il giorno dopo.</p>
    </div>
    <div class="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      ${REPARTI.map(r => `<a href="/reparti/#${r.id}" class="reveal group relative block overflow-hidden rounded-3xl bg-forest-100">
        <img src="https://images.unsplash.com/${r.img}?w=700&h=900&fit=crop&q=70&auto=format" alt="" loading="lazy" class="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105" width="700" height="900">
        <span class="absolute inset-0 bg-gradient-to-t from-forest-900/90 via-forest-900/20 to-transparent"></span>
        <span class="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          <span class="block font-display text-xl font-semibold sm:text-2xl">${esc(r.titolo)}</span>
          <span class="mt-1 block text-xs text-white/85 sm:text-sm">${esc(r.testo)}</span>
        </span>
      </a>`).join("\n      ")}
    </div>
  </div>
</section>

<section class="pb-20 lg:pb-28">
  <div class="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16">
    <figure class="reveal relative overflow-hidden rounded-[32px] bg-forest-100" data-foto="foto/team.jpg">
      <img class="aspect-[4/3] h-full w-full object-cover" loading="lazy" src="/foto/team.jpg"
           data-fallback="https://images.unsplash.com/photo-1576091358783-a212ec293ff3?w=1200&q=75&auto=format"
           alt="I farmacisti della Farmacia Comunale di Canegrate al bancone" width="1200" height="900">
    </figure>
    <div class="reveal">
      <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>Chi siamo</p>
      <h2 class="h2 mt-3">Una farmacia pubblica, nata per il quartiere.</h2>
      <p class="mt-6 text-lg leading-relaxed text-muted">Siamo la prima farmacia comunale di Canegrate, aperta l'8 ottobre 2026 in Piazza della Musica, nel quartiere Cascinette: un servizio di prossimità per Canegrate e per i comuni vicini, da ${esc(C.comuniVicini.slice(0, -1).join(", "))} a ${esc(C.comuniVicini.at(-1))}.</p>
      <a href="/chi-siamo/" class="btn-ghost mt-8">Conosci la farmacia ${icon("arrow", "h-4 w-4")}</a>
    </div>
  </div>
</section>

<section class="bg-forest-900 py-20 text-white lg:py-28">
  <div class="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
    <div class="reveal">
      <p class="eyebrow !text-cross"><span class="h-px w-6 bg-cross"></span>Orari e dove siamo</p>
      <h2 class="mt-3 font-display text-3xl font-semibold leading-tight sm:text-[42px]">Ci trovi sotto il porticato, nel cuore delle Cascinette.</h2>
      <address class="mt-6 text-xl font-bold not-italic">${esc(INDIRIZZO)}</address>
      <p class="status-long-dark mt-3 text-forest-100"></p>
      <ul class="mt-6 flex flex-wrap gap-2" aria-label="Comodità">${C.comodita.map(c => `<li class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm"><span class="h-1.5 w-1.5 rounded-full bg-cross"></span>${esc(c)}</li>`).join("")}</ul>
      <div class="mt-8 flex flex-wrap gap-3">
        <a href="/orari-e-dove-siamo/" class="btn bg-white text-forest-700 hover:bg-forest-50">Orari e mappa</a>
        <a href="/farmacia-di-turno/" class="btn border border-white/25 text-white hover:bg-white/10">Farmacia di turno</a>
      </div>
    </div>
    <div class="reveal rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-8">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-lg font-bold">Orari di apertura</h3>
        <span class="status-pill-dark shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">Orari</span>
      </div>
      <table class="mt-4 w-full text-[15px]"><caption class="sr-only">Orari settimanali</caption><tbody data-hours-table="dark">${hoursRows(true)}</tbody></table>
    </div>
  </div>
</section>

${faqBlock(FAQ.slice(0, 5), "Le risposte che cerchi più spesso")}
<p class="-mt-10 mb-20 text-center"><a href="/domande-frequenti/" class="font-bold text-forest-700 underline underline-offset-2">Tutte le domande frequenti</a></p>
${ctaBand()}`
});

/* ---------------------------------------------------------------- SERVIZI (indice) */
add({
  path: "/servizi/", priority: "0.9",
  title: "Servizi della Farmacia Comunale Canegrate | ECG, Holter, autoanalisi, CUP",
  description: "Tutti i servizi della Farmacia Comunale di Canegrate: glicemia, colesterolo, pressione, ECG e Holter con referto del cardiologo, prenotazioni CUP, consegna a domicilio, ordini su WhatsApp.",
  crumbs: [HOME, SERV],
  body: `
${pageHero({ eyebrow: "Servizi", h1: "Servizi in farmacia a Canegrate", intro: "Controlli rapidi al bancone, esami di telemedicina con referto del cardiologo e pratiche sanitarie sbrigate per te. Per i servizi su prenotazione basta un messaggio su WhatsApp: ti diamo giorno e ora.", ctas: btnWa("Buongiorno, vorrei prenotare un servizio.", "Prenota un servizio") + btnTel() })}
<section class="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
  <div class="flex flex-wrap gap-2" role="group" aria-label="Filtra servizi">
    <button class="chip" data-filter="tutti" aria-pressed="true">Tutti</button>
    <button class="chip" data-filter="analisi" aria-pressed="false">Autoanalisi</button>
    <button class="chip" data-filter="telemedicina" aria-pressed="false">ECG e Holter</button>
    <button class="chip" data-filter="prevenzione" aria-pressed="false">Prevenzione</button>
    <button class="chip" data-filter="pratiche" aria-pressed="false">Pratiche</button>
  </div>
  <div id="serviceGrid" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    ${SERVIZI.map(serviceCard).join("\n    ")}
  </div>
  <div class="prose-farmacia mt-16 max-w-3xl">
    <h2>Come prenotare un servizio</h2>
    <p>Le misurazioni di <a href="/servizi/autoanalisi-glicemia-colesterolo/">glicemia, colesterolo</a> e <a href="/servizi/misurazione-pressione/">pressione</a> si fanno senza appuntamento, negli <a href="/orari-e-dove-siamo/">orari di apertura</a>. Per <a href="/servizi/elettrocardiogramma-ecg/">elettrocardiogramma</a>, <a href="/servizi/holter-cardiaco/">Holter cardiaco</a> e <a href="/servizi/holter-pressorio/">Holter pressorio</a> scrivici su WhatsApp al ${esc(WA_LABEL)} o chiama lo ${esc(C.telefono)}: ti proponiamo il primo giorno libero.</p>
    <h2>Servizi in arrivo</h2>
    <p>Nei prossimi mesi aggiungeremo emoglobina glicata, vaccinazione antinfluenzale e spirometria. Se ti interessa uno di questi servizi, scrivici: ti avvisiamo appena è disponibile.</p>
  </div>
</section>
${ctaBand()}`
});

/* ---------------------------------------------------------------- ECG */
const svc = (p) => add({ ...p, priority: "0.8", crumbs: [HOME, SERV, [p.crumb, p.path]], schema: [serviceLd(p), ...(p.faq ? [faqLd(p.faq)] : [])], body: servicePage(p) });

svc({
  path: "/servizi/elettrocardiogramma-ecg/", crumb: "Elettrocardiogramma (ECG)", nomeServizio: "Elettrocardiogramma (ECG) in farmacia",
  title: "Elettrocardiogramma (ECG) in farmacia a Canegrate | Referto del cardiologo",
  description: "ECG a riposo in farmacia a Canegrate, quartiere Cascinette: esame in pochi minuti, tracciato inviato in telemedicina e referto firmato dal cardiologo. Prenota su WhatsApp.",
  eyebrow: "Telemedicina · ECG", h1: "Elettrocardiogramma (ECG) in farmacia, con referto del cardiologo",
  intro: "Fai l'ECG da noi, vicino a casa e senza liste d'attesa lunghe: il tracciato viene inviato in telemedicina a un medico cardiologo e ricevi il referto firmato.",
  stato: "prenota", waMsg: "Buongiorno, vorrei prenotare un elettrocardiogramma (ECG). Quali giorni avete disponibili?",
  boxTitolo: "Prenota l'ECG", box: ["ECG a riposo a 12 derivazioni", "Pochi minuti di registrazione", "Referto firmato dal cardiologo", "Gratuito per chi ha i requisiti regionali"],
  corpo: `
<h2>Cos'è l'elettrocardiogramma</h2>
<p>L'elettrocardiogramma registra l'attività elettrica del cuore. È un esame semplice, indolore e non invasivo, che permette al medico di valutare il ritmo e la frequenza cardiaca e di individuare eventuali alterazioni. Viene usato nei controlli periodici, quando il medico di famiglia lo richiede o per tenere sotto controllo una patologia cardiaca già nota.</p>
<h2>Come si svolge in farmacia</h2>
<ol>
<li><strong>Prenoti</strong> su WhatsApp o per telefono: ti diamo giorno e ora.</li>
<li><strong>In uno spazio riservato</strong> ti applichiamo gli elettrodi su torace, polsi e caviglie. Resti sdraiato e rilassato.</li>
<li><strong>La registrazione dura pochi minuti.</strong> Il tracciato viene inviato in telemedicina a un centro cardiologico.</li>
<li><strong>Ricevi il referto</strong> firmato dal medico cardiologo, da portare al tuo medico di famiglia.</li>
</ol>
<h2>Come prepararti</h2>
<ul>
<li>Indossa abiti comodi, facili da sfilare nella parte superiore.</li>
<li>Il giorno dell'esame evita creme e oli sul torace: gli elettrodi aderiscono meglio.</li>
<li>Porta l'elenco dei farmaci che prendi ed eventuali elettrocardiogrammi precedenti.</li>
<li>Se hai una prescrizione del medico, portala con te.</li>
</ul>
<h2>Quanto costa? È gratuito?</h2>
<p>In Lombardia l'ECG in farmacia è gratuito per chi rientra nei requisiti previsti dalla Regione, per esempio con esenzione per patologia cardiovascolare e prescrizione del medico. Negli altri casi l'esame è a pagamento: chiedici la tariffa, te la diciamo subito.</p>
${infoBox("Non è un servizio di emergenza", "Se hai dolore al petto, mancanza di fiato improvvisa, svenimento o palpitazioni forti, non venire in farmacia: chiama subito il <a href=\"tel:112\" class=\"font-bold text-coral underline\">112</a>.", "coral")}
<h2>Altri esami per il cuore</h2>
<p>Se il medico ti ha chiesto un monitoraggio più lungo, in farmacia facciamo anche l'<a href="/servizi/holter-cardiaco/">Holter cardiaco delle 24 ore</a> e l'<a href="/servizi/holter-pressorio/">Holter pressorio</a>. Per un controllo veloce puoi <a href="/servizi/misurazione-pressione/">misurare la pressione</a> senza appuntamento.</p>`,
  faq: [
    ["Quanto dura l'ECG in farmacia?", "La registrazione dura pochi minuti. Tra preparazione ed esame, in genere ti basta un quarto d'ora."],
    ["Serve la ricetta del medico per fare l'ECG?", "Per l'esame a pagamento no. Per accedere alla gratuità prevista dalla Regione Lombardia servono invece la prescrizione del medico e i requisiti richiesti: chiedici se rientri."],
    ["Chi firma il referto?", "Il tracciato viene letto da un medico cardiologo in telemedicina, che firma il referto. Ti consigliamo di mostrarlo al tuo medico di famiglia."],
    ["Posso fare l'ECG senza prenotare?", "È meglio prenotare: così ti dedichiamo il tempo necessario in uno spazio riservato. Scrivici su WhatsApp e ti diamo il primo orario libero."]
  ],
  related: ["/servizi/holter-cardiaco/", "/servizi/holter-pressorio/", "/servizi/misurazione-pressione/"]
});

svc({
  path: "/servizi/holter-cardiaco/", crumb: "Holter cardiaco 24h", nomeServizio: "Holter cardiaco 24 ore in farmacia",
  title: "Holter cardiaco 24 ore in farmacia a Canegrate | ECG dinamico",
  description: "Holter cardiaco (ECG dinamico delle 24 ore) alla Farmacia Comunale di Canegrate: applicazione in farmacia, registrazione durante la tua giornata normale e referto del cardiologo.",
  eyebrow: "Telemedicina · Holter", h1: "Holter cardiaco delle 24 ore in farmacia",
  intro: "Un piccolo registratore controlla il tuo battito per 24 ore mentre fai la tua vita di tutti i giorni. Lo applichiamo e lo togliamo noi in farmacia; il referto è del cardiologo.",
  stato: "prenota", waMsg: "Buongiorno, vorrei prenotare un Holter cardiaco 24h. Quali giorni avete disponibili?",
  boxTitolo: "Prenota l'Holter cardiaco", box: ["Registrazione continua per 24 ore", "Applicazione e rimozione in farmacia", "Referto del cardiologo in telemedicina", "Gratuito per chi ha i requisiti regionali"],
  corpo: `
<h2>Cos'è l'Holter cardiaco</h2>
<p>L'Holter cardiaco, o elettrocardiogramma dinamico, registra in modo continuo l'attività elettrica del cuore per 24 ore. Un elettrocardiogramma normale dura pochi minuti e può non cogliere disturbi che compaiono solo in certi momenti della giornata: l'Holter serve proprio a questo, per esempio quando il medico vuole capire l'origine di palpitazioni, capogiri o battiti irregolari.</p>
<h2>Come funziona</h2>
<ol>
<li><strong>Prenoti</strong> su WhatsApp o per telefono.</li>
<li><strong>In farmacia</strong> ti applichiamo alcuni elettrodi adesivi sul torace, collegati a un registratore leggero che porti alla cintura o al collo.</li>
<li><strong>Per 24 ore fai la tua vita normale</strong> e annoti su un diario le attività e gli eventuali sintomi, con l'orario.</li>
<li><strong>Il giorno dopo torni in farmacia</strong> a riconsegnare l'apparecchio. I dati vengono inviati al cardiologo, che firma il referto.</li>
</ol>
<h2>Durante le 24 ore</h2>
<ul>
<li>Non bagnare il registratore: niente doccia o bagno fino alla rimozione.</li>
<li>Non staccare gli elettrodi. Se uno si stacca, riattaccalo e annotalo sul diario.</li>
<li>Fai le tue attività abituali, così la registrazione rappresenta una giornata normale.</li>
<li>Annota palpitazioni, capogiri o dolore insieme all'ora in cui li hai avvertiti.</li>
</ul>
<h2>Come prepararti</h2>
<ul>
<li>Fai la doccia prima dell'appuntamento ed evita creme sul torace.</li>
<li>Indossa una maglia o una camicia comoda, che copra bene il registratore.</li>
<li>Per far aderire bene gli elettrodi può essere necessario radere piccole zone del torace.</li>
</ul>
<h2>Quanto costa?</h2>
<p>In Lombardia l'Holter in farmacia è gratuito per chi ha i requisiti regionali, per esempio un'esenzione per patologia cardiovascolare e la prescrizione del medico. Negli altri casi è a pagamento: chiedici la tariffa.</p>`,
  faq: [
    ["Quando devo riportare l'Holter?", "Dopo 24 ore dall'applicazione, quindi di solito il giorno successivo, negli orari di apertura della farmacia. Concordiamo l'orario al momento della prenotazione."],
    ["Posso lavorare o fare sport con l'Holter?", "Sì, anzi è utile fare la tua giornata abituale. Evita solo le attività in cui il registratore potrebbe bagnarsi o urtare, e annota sul diario gli sforzi fatti."],
    ["Posso dormire con l'Holter?", "Sì, la registrazione continua anche di notte. Segna sul diario l'ora in cui vai a dormire e quella in cui ti svegli."]
  ],
  related: ["/servizi/elettrocardiogramma-ecg/", "/servizi/holter-pressorio/", "/servizi/misurazione-pressione/"]
});

svc({
  path: "/servizi/holter-pressorio/", crumb: "Holter pressorio 24h", nomeServizio: "Holter pressorio 24 ore in farmacia",
  title: "Holter pressorio 24 ore in farmacia a Canegrate | Monitoraggio della pressione",
  description: "Holter pressorio (monitoraggio della pressione delle 24 ore) alla Farmacia Comunale di Canegrate, quartiere Cascinette. Applicazione in farmacia e referto medico. Prenota su WhatsApp.",
  eyebrow: "Telemedicina · Pressione", h1: "Holter pressorio: la pressione misurata per 24 ore",
  intro: "Un bracciale collegato a un piccolo apparecchio misura la pressione a intervalli regolari, di giorno e di notte. Così il medico vede come si comporta davvero la tua pressione, lontano dall'ambulatorio.",
  stato: "prenota", waMsg: "Buongiorno, vorrei prenotare un Holter pressorio 24h. Quali giorni avete disponibili?",
  boxTitolo: "Prenota l'Holter pressorio", box: ["Misurazioni automatiche per 24 ore", "Di giorno e durante il sonno", "Referto medico in telemedicina", "Gratuito per chi ha i requisiti regionali"],
  corpo: `
<h2>A cosa serve</h2>
<p>La pressione cambia molto nel corso della giornata e una singola misurazione può ingannare: c'è chi in ambulatorio ha valori alti solo per l'emozione (la cosiddetta «ipertensione da camice bianco») e chi, al contrario, ha la pressione alta in momenti in cui nessuno la misura. Il monitoraggio delle 24 ore aiuta il medico a confermare o escludere l'ipertensione e a verificare se una terapia funziona.</p>
<h2>Come funziona</h2>
<ol>
<li><strong>Prenoti</strong> su WhatsApp o per telefono.</li>
<li><strong>In farmacia</strong> ti mettiamo il bracciale al braccio e l'apparecchio, leggero, alla cintura.</li>
<li><strong>Per 24 ore</strong> il bracciale si gonfia da solo a intervalli regolari, più spesso di giorno e meno di notte.</li>
<li><strong>Il giorno dopo</strong> riporti l'apparecchio in farmacia. I dati vengono inviati al medico, che firma il referto.</li>
</ol>
<h2>Durante le 24 ore</h2>
<ul>
<li>Quando senti il bracciale gonfiarsi, fermati e tieni il braccio disteso e rilassato.</li>
<li>Non togliere il bracciale e non bagnare l'apparecchio.</li>
<li>Annota sul diario l'ora dei pasti, dei farmaci, del sonno e degli eventuali sintomi.</li>
<li>Prendi i tuoi farmaci come sempre, salvo diversa indicazione del medico.</li>
</ul>
<h2>Come prepararti</h2>
<ul>
<li>Indossa una maglia a maniche corte o larghe, che non stringa il braccio.</li>
<li>Porta l'elenco dei farmaci che prendi per la pressione.</li>
</ul>
<h2>Quanto costa?</h2>
<p>In Lombardia l'Holter pressorio in farmacia è gratuito per chi ha i requisiti regionali, per esempio un'esenzione per patologia cardiovascolare e la prescrizione del medico. Negli altri casi è a pagamento: chiedici la tariffa.</p>
<p>Per un controllo rapido, senza appuntamento, puoi anche <a href="/servizi/misurazione-pressione/">misurare la pressione al bancone</a>.</p>`,
  faq: [
    ["Ogni quanto misura la pressione l'Holter pressorio?", "Di solito ogni 15–30 minuti durante il giorno e con intervalli più lunghi di notte. L'intervallo viene impostato al momento dell'applicazione."],
    ["Fa male?", "No. Il bracciale stringe per qualche secondo come in una normale misurazione, poi si sgonfia. Di notte può svegliarti le prime volte, ma in genere ci si abitua presto."],
    ["Devo sospendere i farmaci per la pressione?", "No, a meno che non te lo dica il medico. Prendili come sempre e segna gli orari sul diario."]
  ],
  related: ["/servizi/misurazione-pressione/", "/servizi/elettrocardiogramma-ecg/", "/servizi/holter-cardiaco/"]
});

svc({
  path: "/servizi/autoanalisi-glicemia-colesterolo/", crumb: "Glicemia e colesterolo", nomeServizio: "Autoanalisi in farmacia: glicemia, colesterolo e trigliceridi",
  title: "Glicemia, colesterolo e trigliceridi in farmacia a Canegrate | Senza appuntamento",
  description: "Misura glicemia, colesterolo e trigliceridi alla Farmacia Comunale di Canegrate: una goccia di sangue dal polpastrello e il risultato in pochi minuti, senza appuntamento.",
  eyebrow: "Autoanalisi", h1: "Glicemia, colesterolo e trigliceridi in pochi minuti",
  intro: "Basta una goccia di sangue dal polpastrello: il risultato arriva in pochi minuti e il farmacista ti aiuta a leggerlo. Senza appuntamento, negli orari di apertura.",
  stato: "attivo", waMsg: "Buongiorno, vorrei informazioni sulle autoanalisi (glicemia / colesterolo).",
  boxTitolo: "Passa quando vuoi", box: ["Senza appuntamento", "Goccia di sangue capillare", "Risultato in pochi minuti", "Lancette sterili monouso"],
  corpo: `
<h2>Come funziona</h2>
<p>Con una lancetta sterile monouso preleviamo una goccia di sangue dal polpastrello e la analizziamo con uno strumento professionale. In pochi minuti hai il risultato, che puoi annotare o portare al tuo medico. Non serve prenotare: passa in farmacia negli <a href="/orari-e-dove-siamo/">orari di apertura</a>.</p>
<h2 id="glicemia">Glicemia</h2>
<p>La glicemia è la quantità di zucchero (glucosio) nel sangue. Controllarla è utile se hai familiari con il diabete, se sei in sovrappeso o se il medico ti ha chiesto di tenerla d'occhio.</p>
<ul>
<li><strong>A digiuno:</strong> per una misura affidabile non mangiare nelle 8 ore precedenti. Acqua sì.</li>
<li><strong>Come leggerla:</strong> in genere una glicemia a digiuno sotto 100 mg/dL è considerata nella norma; tra 100 e 125 mg/dL merita un approfondimento con il medico; valori ripetuti da 126 mg/dL in su richiedono la sua valutazione.</li>
</ul>
<h2 id="colesterolo">Colesterolo e trigliceridi</h2>
<p>Colesterolo e trigliceridi sono grassi presenti nel sangue: se restano alti a lungo aumentano il rischio di malattie del cuore e dei vasi. Misurarli periodicamente aiuta a intervenire per tempo, con l'alimentazione, l'attività fisica e, se il medico lo ritiene, con una terapia.</p>
<ul>
<li><strong>Colesterolo totale:</strong> in genere è desiderabile un valore sotto 200 mg/dL.</li>
<li><strong>Trigliceridi:</strong> in genere è desiderabile un valore sotto 150 mg/dL. Per misurarli è preferibile un digiuno di 10–12 ore.</li>
</ul>
<h2 id="emoglobina-glicata">Emoglobina glicata (HbA1c) — in arrivo</h2>
<p>L'emoglobina glicata indica il valore medio della glicemia degli ultimi due-tre mesi ed è molto utile a chi ha il diabete. Il servizio sarà disponibile a breve: <a href="/contatti/">scrivici</a> se vuoi essere avvisato.</p>
${infoBox("Un controllo, non una diagnosi", "Le autoanalisi in farmacia sono test di controllo. I valori vanno sempre valutati dal tuo medico, che conosce la tua storia clinica e può chiedere esami di laboratorio più completi.")}`,
  faq: [
    ["Devo essere a digiuno per misurare la glicemia?", "Per la glicemia a digiuno sì: non mangiare nelle 8 ore precedenti, puoi bere acqua. La glicemia si può misurare anche dopo i pasti, ma il valore va letto in modo diverso: te lo spieghiamo noi."],
    ["Serve prenotare le autoanalisi?", "No, glicemia, colesterolo e trigliceridi si fanno al bancone negli orari di apertura, senza appuntamento."],
    ["Quanto tempo ci vuole?", "Il prelievo dal dito richiede pochi secondi e il risultato arriva in pochi minuti."]
  ],
  related: ["/servizi/misurazione-pressione/", "/servizi/elettrocardiogramma-ecg/", "/servizi/prenotazione-cup/"]
});

svc({
  path: "/servizi/misurazione-pressione/", crumb: "Misurazione della pressione", nomeServizio: "Misurazione della pressione arteriosa in farmacia",
  title: "Misurazione della pressione in farmacia a Canegrate | Senza appuntamento",
  description: "Misura la pressione arteriosa e la frequenza cardiaca alla Farmacia Comunale di Canegrate, quartiere Cascinette. Senza appuntamento, con il consiglio del farmacista.",
  eyebrow: "Autoanalisi · Pressione", h1: "Misurazione della pressione, senza appuntamento",
  intro: "Pressione arteriosa e frequenza cardiaca in pochi minuti, al bancone. Ti aiutiamo a leggere i valori e, se servono, a tenerli sotto controllo nel tempo.",
  stato: "attivo", waMsg: "Buongiorno, vorrei informazioni sulla misurazione della pressione.",
  boxTitolo: "Passa quando vuoi", box: ["Senza appuntamento", "Pressione e frequenza cardiaca", "Consigli per misurarla a casa", "Holter pressorio su prenotazione"],
  corpo: `
<h2>Perché misurarla</h2>
<p>La pressione alta spesso non dà sintomi, ma con il tempo affatica cuore, reni e vasi sanguigni. Misurarla con regolarità è il modo più semplice per accorgersene per tempo, soprattutto dopo i 40 anni, se in famiglia ci sono casi di ipertensione o se il medico ti ha prescritto una terapia.</p>
<h2>Come prepararti alla misurazione</h2>
<ul>
<li>Evita caffè, fumo e attività fisica intensa nei 30 minuti precedenti.</li>
<li>Siediti e riposa qualche minuto prima della misurazione.</li>
<li>Tieni il braccio appoggiato all'altezza del cuore, senza maniche strette.</li>
<li>Durante la misurazione non parlare e non accavallare le gambe.</li>
</ul>
<h2>Come leggere i valori</h2>
<p>La pressione si esprime con due numeri: la massima (sistolica) e la minima (diastolica). Secondo le principali linee guida, valori sotto 120/80 mmHg sono ottimali, mentre valori ripetutamente pari o superiori a 140/90 mmHg vanno segnalati al medico. Una sola misurazione alta non basta per parlare di ipertensione: conta l'andamento nel tempo.</p>
<p>Se il medico vuole vedere come si comporta la tua pressione durante tutta la giornata, può chiederti un <a href="/servizi/holter-pressorio/">Holter pressorio delle 24 ore</a>, che facciamo in farmacia su prenotazione.</p>
<h2>Misurare la pressione a casa</h2>
<p>Se devi controllarla spesso, un misuratore da braccio a casa è molto comodo. Ti aiutiamo a scegliere quello adatto e ti spieghiamo come usarlo: misura sempre alla stessa ora, fai due misurazioni a un minuto di distanza e annota i valori da mostrare al medico.</p>
${infoBox("Valori molto alti o sintomi?", "Se la pressione è molto alta e hai mal di testa forte, dolore al petto, disturbi della vista o della parola, chiama subito il <a href=\"tel:112\" class=\"font-bold text-coral underline\">112</a>.", "coral")}`,
  faq: [
    ["Quanto costa misurare la pressione in farmacia?", "Chiedici al bancone: la misurazione richiede pochi minuti e non serve prenotare."],
    ["Posso misurare la pressione se prendo già dei farmaci?", "Sì, anzi è utile per vedere se la terapia funziona. Porta il diario delle misurazioni al tuo medico."],
    ["Mi aiutate a scegliere un misuratore per casa?", "Sì, ti consigliamo un apparecchio da braccio adatto alla misura del tuo braccio e ti mostriamo come usarlo correttamente."]
  ],
  related: ["/servizi/holter-pressorio/", "/servizi/autoanalisi-glicemia-colesterolo/", "/servizi/elettrocardiogramma-ecg/"]
});

svc({
  path: "/servizi/prenotazione-cup/", crumb: "Prenotazione CUP", nomeServizio: "Prenotazione di visite ed esami (CUP) in farmacia",
  title: "Prenotazione CUP in farmacia a Canegrate | Visite ed esami SSR Lombardia",
  description: "Prenota visite specialistiche ed esami del Servizio sanitario regionale direttamente alla Farmacia Comunale di Canegrate, senza code agli sportelli. Porta tessera sanitaria e ricetta.",
  eyebrow: "Pratiche · CUP", h1: "Prenota visite ed esami (CUP) in farmacia",
  intro: "Niente code agli sportelli o telefonate infinite: prenotiamo per te visite specialistiche ed esami del Servizio sanitario regionale, direttamente al bancone.",
  stato: "attivo", waMsg: "Buongiorno, vorrei prenotare una visita / un esame tramite CUP.",
  boxTitolo: "Cosa portare", box: ["Tessera sanitaria dell'assistito", "La ricetta del medico (o il codice NRE)", "Un'agenda per fissare la data", "Senza appuntamento"],
  corpo: `
<h2>Come funziona</h2>
<ol>
<li><strong>Vieni in farmacia</strong> con la tessera sanitaria e la ricetta del medico (impegnativa). Se la ricetta è elettronica basta il promemoria con il codice NRE.</li>
<li><strong>Cerchiamo insieme</strong> la prima disponibilità nelle strutture del Servizio sanitario regionale, tenendo conto delle tue preferenze di luogo e data.</li>
<li><strong>Ti consegniamo il promemoria</strong> con data, ora e indirizzo della struttura, e le eventuali indicazioni per prepararti all'esame.</li>
</ol>
<h2>Cosa sapere prima di prenotare</h2>
<ul>
<li>Sulla ricetta è indicata la <strong>classe di priorità</strong> (U, B, D o P), che stabilisce entro quanto tempo la prestazione deve essere erogata.</li>
<li>Puoi prenotare anche per un familiare: porta la sua tessera sanitaria e la ricetta.</li>
<li>Se poi non puoi presentarti, ricordati di disdire per tempo: chiedici come fare.</li>
</ul>
<h2>Le tue ricette nel Fascicolo Sanitario</h2>
<p>Le ricette elettroniche e i referti sono consultabili anche nel <a href="https://www.fascicolosanitario.regione.lombardia.it/" target="_blank" rel="noopener">Fascicolo Sanitario Elettronico di Regione Lombardia</a>. Se non sai come accedere, chiedici: ti spieghiamo da dove partire.</p>`,
  faq: [
    ["Posso prenotare un esame per un'altra persona?", "Sì, porta la tessera sanitaria e la ricetta della persona per cui vuoi prenotare."],
    ["Serve un appuntamento per prenotare al CUP in farmacia?", "No, passa negli orari di apertura. Nelle ore più tranquille, come metà mattina, aspetti meno."],
    ["Quali visite ed esami si possono prenotare?", "Le prestazioni del Servizio sanitario regionale prescritte dal medico con ricetta. Alcuni esami particolari si prenotano solo presso la struttura: in quel caso ti diciamo a chi rivolgerti."]
  ],
  related: ["/servizi/scelta-revoca-medico/", "/servizi/consegna-a-domicilio/", "/ordina-su-whatsapp/"]
});

svc({
  path: "/servizi/scelta-revoca-medico/", crumb: "Scelta e revoca del medico", nomeServizio: "Scelta e revoca del medico di base e del pediatra in farmacia",
  title: "Scelta e revoca del medico di base in farmacia a Canegrate | Farmacia Comunale",
  description: "Scegli o cambia il medico di famiglia o il pediatra alla Farmacia Comunale di Canegrate, senza code agli sportelli ASST. Porta tessera sanitaria e documento d'identità.",
  eyebrow: "Pratiche · Medico di base", h1: "Scelta e revoca del medico di base in farmacia",
  intro: "Devi scegliere il medico di famiglia o il pediatra, o vuoi cambiarlo? Lo facciamo noi al bancone, in pochi minuti, senza passare dagli sportelli ASST.",
  stato: "attivo", waMsg: "Buongiorno, vorrei informazioni sulla scelta / revoca del medico di base.",
  boxTitolo: "Cosa portare", box: ["Tessera sanitaria dell'assistito", "Documento d'identità valido", "Il nome del nuovo medico, se lo sai già", "Senza appuntamento"],
  corpo: `
<h2>Cosa puoi fare in farmacia</h2>
<ul>
<li><strong>Scegliere il medico di medicina generale</strong> (medico di base o di famiglia), per esempio se ti sei appena trasferito a Canegrate.</li>
<li><strong>Cambiare medico</strong>: la revoca del medico attuale e la scelta del nuovo avvengono insieme.</li>
<li><strong>Scegliere o cambiare il pediatra</strong> di libera scelta per i tuoi figli.</li>
</ul>
<h2>Come funziona</h2>
<ol>
<li><strong>Vieni in farmacia</strong> con la tessera sanitaria e un documento d'identità della persona che deve scegliere o cambiare il medico.</li>
<li><strong>Vediamo insieme i medici disponibili</strong> nella tua zona, cioè quelli che hanno ancora posti liberi.</li>
<li><strong>Registriamo la scelta</strong> nel sistema di Regione Lombardia e ti consegniamo la ricevuta con il nome del nuovo medico.</li>
</ol>
<h2>Cosa sapere</h2>
<ul>
<li>Puoi farlo anche per un familiare: porta la sua tessera sanitaria e chiedici quali documenti servono nel tuo caso.</li>
<li>Alcuni casi particolari, come il domicilio sanitario per chi non è residente in Lombardia, si gestiscono solo agli sportelli ASST: se è il tuo caso ti diciamo a chi rivolgerti.</li>
<li>Il nuovo medico e le tue ricette sono visibili anche nel <a href="https://www.fascicolosanitario.regione.lombardia.it/" target="_blank" rel="noopener">Fascicolo Sanitario Elettronico</a>.</li>
</ul>`,
  faq: [
    ["Serve un appuntamento per cambiare il medico in farmacia?", "No, passa negli orari di apertura con la tessera sanitaria e un documento d'identità."],
    ["Posso cambiare il medico per un familiare?", "Sì, porta la tessera sanitaria della persona interessata. Chiedici prima quali documenti servono, così non devi tornare."],
    ["Posso scegliere anche il pediatra?", "Sì, in farmacia si può scegliere o cambiare anche il pediatra di libera scelta per i bambini."]
  ],
  related: ["/servizi/prenotazione-cup/", "/servizi/consegna-a-domicilio/", "/prenota-ricetta/"]
});

svc({
  path: "/servizi/consegna-a-domicilio/", crumb: "Consegna a domicilio", nomeServizio: "Consegna di farmaci a domicilio",
  title: "Consegna farmaci a domicilio a Canegrate | Farmacia Comunale Cascinette",
  description: "Consegna a domicilio di farmaci e prodotti della Farmacia Comunale di Canegrate per chi ha difficoltà a muoversi. Scrivici su WhatsApp o chiama per accordarci su giorno e orario.",
  eyebrow: "Pratiche · Domicilio", h1: "Farmaci e prodotti consegnati a casa tua",
  intro: "Per chi non può muoversi, per un periodo o sempre: prepariamo farmaci e prodotti e te li portiamo a casa. Ci accordiamo insieme su giorno e orario.",
  stato: "attivo", waMsg: "Buongiorno, vorrei informazioni sulla consegna a domicilio.",
  boxTitolo: "Richiedi la consegna", box: ["Per anziani e persone fragili", "Farmaci con ricetta e da banco", "Giorno e orario concordati", "Su WhatsApp o per telefono"],
  corpo: `
<h2>A chi è rivolto</h2>
<p>Il servizio è pensato per chi ha difficoltà a venire in farmacia: persone anziane o con disabilità, chi è a letto per una malattia o dopo un intervento, neo-mamme nei primi giorni con il bambino. Anche un familiare può richiederlo per conto di un parente.</p>
<h2>Come richiederla</h2>
<ol>
<li><strong>Scrivici su WhatsApp o chiamaci</strong> dicendo cosa ti serve. Per i farmaci con ricetta mandaci i codici NRE delle ricette e il codice fiscale dell'assistito.</li>
<li><strong>Prepariamo l'ordine</strong> e ti confermiamo disponibilità, importo e modalità di pagamento.</li>
<li><strong>Ci accordiamo</strong> su giorno e fascia oraria per la consegna.</li>
</ol>
<h2>Zona e condizioni</h2>
<p>Consegniamo a Canegrate e nei dintorni: chiedici se la tua via rientra nella zona servita e quali sono le condizioni del servizio. Per prodotti da banco puoi anche <a href="/ordina-su-whatsapp/">ordinare su WhatsApp e pagare online</a>.</p>
${infoBox("Farmaci urgenti", "La consegna non è un servizio di emergenza. Se hai bisogno di un farmaco urgente di notte o in un giorno festivo, controlla la <a href=\"/farmacia-di-turno/\" class=\"font-bold underline\">farmacia di turno</a>.")}`,
  faq: [
    ["La consegna a domicilio è a pagamento?", "Dipende dalla zona e dal tipo di ordine: chiedici le condizioni quando ci scrivi."],
    ["Posso far consegnare farmaci con ricetta?", "Sì: mandaci i codici NRE delle ricette e il codice fiscale dell'assistito, e prepariamo tutto."]
  ],
  related: ["/ordina-su-whatsapp/", "/servizi/prenotazione-cup/", "/servizi/autoanalisi-glicemia-colesterolo/"]
});

/* ---------------------------------------------------------------- PRENOTA RICETTA */
add({
  path: "/prenota-ricetta/", priority: "0.9",
  title: "Prenota la ricetta su WhatsApp | Farmacia Comunale Canegrate",
  description: "Prenota i farmaci con ricetta elettronica alla Farmacia Comunale di Canegrate: inviaci i codici NRE su WhatsApp, prepariamo tutto e ti avvisiamo quando puoi ritirare.",
  crumbs: [HOME, ["Prenota ricetta", "/prenota-ricetta/"]],
  schema: [faqLd(FAQ.slice(0, 2))],
  body: `
<section class="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:pt-12">
  <div class="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
    <div>
      <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>Prenota ricetta</p>
      <h1 class="mt-3 font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">Prenota la ricetta su WhatsApp, ritira senza attese.</h1>
      <p class="mt-5 text-lg text-muted">Mandaci i codici delle ricette elettroniche: prepariamo i farmaci in anticipo e ti scriviamo quando sono pronti. Se un farmaco va ordinato, di solito arriva entro il giorno lavorativo successivo.</p>
      <ol class="mt-10 space-y-6">
        ${[["Inviaci il codice NRE", "È il numero di ricetta elettronica (NRE) che trovi sul promemoria o nel messaggio del tuo medico."], ["Ti avvisiamo quando è pronto", "Se un farmaco va ordinato ti diciamo subito quando arriva."], ["Ritiri con la tessera sanitaria", "Porta la tessera sanitaria dell'assistito. Puoi delegare un familiare."]].map(([t, d], i) => `<li class="flex gap-4">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest-700 font-display text-lg font-semibold text-white">${i + 1}</span>
          <div><h2 class="font-bold">${t}</h2><p class="text-muted">${d}</p></div>
        </li>`).join("\n        ")}
      </ol>
      <div class="mt-10 rounded-2xl border border-sun/50 bg-sun/10 p-5 text-sm text-ink">
        <p class="font-bold">Per la tua privacy</p>
        <p class="mt-1 text-muted">Il modulo non salva nulla su questo sito: compone un messaggio che invii tu, su WhatsApp o via email. Non inviare foto di referti o documenti che non servono.</p>
      </div>
    </div>

    <div class="card bg-cream p-5 sm:p-8">
      <div class="mb-6 grid grid-cols-2 gap-1 rounded-full bg-paper p-1" role="tablist" aria-label="Tipo di richiesta">
        <button role="tab" aria-selected="true" data-tab="ricetta" class="tab rounded-full bg-forest-700 px-4 py-2.5 text-sm font-extrabold text-white">Ricetta medica</button>
        <button role="tab" aria-selected="false" data-tab="prodotto" class="tab rounded-full px-4 py-2.5 text-sm font-extrabold text-muted">Prodotto / da banco</button>
      </div>
      <form id="rxForm" novalidate class="space-y-5">
        <div class="grid gap-5 sm:grid-cols-2">
          <div><label class="label" for="rxNome">Nome e cognome</label><input class="field" id="rxNome" name="nome" autocomplete="name" required placeholder="Mario Rossi"></div>
          <div><label class="label" for="rxTel">Telefono / WhatsApp</label><input class="field" id="rxTel" name="tel" type="tel" autocomplete="tel" inputmode="tel" required placeholder="333 123 4567"></div>
        </div>
        <div data-pane="ricetta" class="space-y-3">
          <div class="flex items-center justify-between">
            <label class="label !mb-0" for="nre0">Codici NRE</label>
            <span class="text-xs text-muted">15 caratteri, es. 030A0…</span>
          </div>
          <div id="nreList" class="space-y-2"></div>
          <button type="button" id="addNre" class="inline-flex items-center gap-1.5 text-sm font-bold text-forest-600 hover:text-forest-700">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg> Aggiungi un'altra ricetta
          </button>
          <label class="flex items-start gap-3 rounded-xl bg-paper p-3 text-sm">
            <input type="checkbox" name="delega" class="mt-0.5 h-4 w-4 accent-forest-700">
            <span>Ritirerà un familiare o un'altra persona (porterà la tessera sanitaria dell'assistito)</span>
          </label>
        </div>
        <div data-pane="prodotto" class="hidden">
          <label class="label" for="rxProd">Cosa ti serve?</label>
          <textarea class="field min-h-28" id="rxProd" name="prodotto" placeholder="Es. integratore di magnesio, crema solare SPF 50 per bambini, antiparassitario per cane 10–20 kg…"></textarea>
          <label class="mt-3 flex items-start gap-3 rounded-xl bg-paper p-3 text-sm">
            <input type="checkbox" name="pagaOnline" class="mt-0.5 h-4 w-4 accent-forest-700" checked>
            <span>Voglio pagare online: inviatemi il link di pagamento</span>
          </label>
        </div>
        <div class="grid gap-5 sm:grid-cols-2">
          <div>
            <label class="label" for="rxQuando">Quando passi a ritirare?</label>
            <select class="field" id="rxQuando" name="quando"><option>Oggi</option><option>Domani</option><option>Nei prossimi giorni</option><option>Ditemi voi quando è pronto</option></select>
          </div>
          <div><label class="label" for="rxNote">Note (facoltative)</label><input class="field" id="rxNote" name="note" placeholder="Es. preferisco il generico"></div>
        </div>
        <label class="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" id="rxPrivacy" required class="mt-0.5 h-4 w-4 accent-forest-700">
          <span>Ho letto l'<a href="/privacy/" target="_blank" class="font-bold text-forest-700 underline underline-offset-2">informativa privacy</a> e acconsento al trattamento dei dati per preparare la mia richiesta.</span>
        </label>
        <p id="rxError" class="hidden rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral" role="alert"></p>
        <div class="flex flex-col gap-3 sm:flex-row">
          <button type="submit" data-via="wa" class="btn-wa flex-1 !py-3.5">${icon("chat")}Invia su WhatsApp</button>
          <button type="submit" data-via="mail" class="btn-ghost flex-1 !py-3.5">Invia via email</button>
        </div>
        <noscript><p class="rounded-xl bg-sun/10 p-3 text-sm">Il modulo richiede JavaScript. Puoi scriverci direttamente su WhatsApp al ${esc(WA_LABEL)} o chiamare lo ${esc(C.telefono)}.</p></noscript>
      </form>
    </div>
  </div>
</section>
<section class="bg-paper py-16 lg:py-20">
  <div class="prose-farmacia mx-auto max-w-3xl px-4 sm:px-6">
    <h2>Dove trovo il codice NRE?</h2>
    <p>Il Numero di Ricetta Elettronica (NRE) è un codice di 15 caratteri. Lo trovi stampato sul promemoria cartaceo che ti consegna il medico, oppure nel messaggio che ricevi via SMS, email o app. Tutte le tue ricette sono consultabili anche nel <a href="https://www.fascicolosanitario.regione.lombardia.it/" target="_blank" rel="noopener">Fascicolo Sanitario Elettronico di Regione Lombardia</a>.</p>
    <h2>Posso ritirare i farmaci per un familiare?</h2>
    <p>Sì. Porta la tessera sanitaria della persona a cui è intestata la ricetta. Per alcuni farmaci può servire anche un documento di chi ritira.</p>
    <h2>E i prodotti senza ricetta?</h2>
    <p>Cosmetici, integratori, prodotti per l'infanzia e da banco si possono <a href="/ordina-su-whatsapp/">ordinare su WhatsApp e pagare online</a>, poi passi solo a ritirarli. I medicinali, invece, si pagano al ritiro in farmacia, dove il farmacista li consegna con il suo consiglio.</p>
  </div>
</section>
${ctaBand()}`
});

/* ---------------------------------------------------------------- ORDINA SU WHATSAPP */
add({
  path: "/ordina-su-whatsapp/", priority: "0.8",
  title: "Ordina su WhatsApp e ritira in farmacia | Farmacia Comunale Canegrate",
  description: "Ordina cosmetici, integratori e prodotti per l'infanzia su WhatsApp, paga online con il link che ti inviamo e ritira alla Farmacia Comunale di Canegrate senza code.",
  crumbs: [HOME, ["Ordina su WhatsApp", "/ordina-su-whatsapp/"]],
  schema: [serviceLd({ nomeServizio: "Ordine su WhatsApp con ritiro in farmacia", description: "Ordina su WhatsApp, paga online e ritira in farmacia.", path: "/ordina-su-whatsapp/" })],
  body: `
${pageHero({ eyebrow: "Ordina e ritira", h1: "Ordina su WhatsApp, paga online, ritira da noi.", intro: "Cosmetici, integratori, prodotti per l'infanzia e per la casa: li prepariamo noi, tu passi solo a prenderli. Niente code alla cassa.", ctas: btnWa("Buongiorno, vorrei fare un ordine da ritirare in farmacia: ", "Ordina su WhatsApp") + `<p class="self-center text-sm font-semibold text-muted">WhatsApp ${esc(WA_LABEL)}</p>` })}
<section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
  <ol class="grid gap-4 sm:grid-cols-3">
    ${[["Scrivi cosa ti serve", "Anche con una foto del prodotto. Ti confermiamo disponibilità e prezzo."], ["Paga online", "Ti inviamo un link di pagamento sicuro, con carta o wallet. Se preferisci, paghi al ritiro."], ["Ritira in farmacia", "Ti avvisiamo quando è pronto: passi, dici il tuo nome e vai."]].map(([t, d], i) => `<li class="card p-6">
      <span class="grid h-10 w-10 place-items-center rounded-full bg-forest-700 font-display text-lg font-semibold text-white">${i + 1}</span>
      <h2 class="mt-4 text-lg font-bold">${t}</h2>
      <p class="mt-1 text-muted">${d}</p>
    </li>`).join("\n    ")}
  </ol>
  <p class="mt-4 rounded-2xl border border-line bg-paper/60 p-5 text-[15px] text-muted"><strong class="text-ink">Farmaci:</strong> quelli con ricetta si prenotano dalla pagina <a href="/prenota-ricetta/" class="font-bold text-forest-700 underline underline-offset-2">Prenota ricetta</a> e, come tutti i medicinali, si pagano al ritiro in farmacia, dove il farmacista li consegna con il suo consiglio.</p>
</section>
<section class="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
  <div class="grid items-center gap-8 overflow-hidden rounded-[32px] border border-line bg-paper lg:grid-cols-2">
    <div class="p-7 sm:p-10 lg:p-14">
      <span id="h24Badge" class="inline-flex rounded-full bg-sun/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-ink">Prossimamente</span>
      <h2 class="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">Distributore automatico H24</h2>
      <p class="mt-4 text-lg text-muted" id="h24Text">Stiamo installando sotto il porticato un distributore di prodotti da farmacia, utilizzabile a qualsiasi ora, anche quando siamo chiusi.</p>
      <ul class="mt-6 grid gap-3 text-[15px] sm:grid-cols-2">
        <li class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-cross"></span>Aperto 24 ore su 24, 7 giorni su 7</li>
        <li class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-cross"></span>Carte e pagamenti contactless</li>
        <li class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-cross"></span>Prodotti conservati sotto i 25 °C</li>
        <li class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-cross"></span>Da banco, igiene, infanzia</li>
      </ul>
    </div>
    <figure class="relative h-full min-h-72 bg-forest-100" data-foto="foto/vetrina.jpg">
      <img class="absolute inset-0 h-full w-full object-cover" loading="lazy" src="/foto/vetrina.jpg"
           data-fallback="https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=1100&q=75&auto=format"
           alt="Vetrina e insegna della Farmacia Comunale di Canegrate sotto il porticato" width="1100" height="700">
    </figure>
  </div>
</section>
${faqBlock([FAQ[5], FAQ[4], ["Posso pagare al ritiro invece che online?", "Sì, il pagamento online è una comodità in più: se preferisci, paghi quando passi in farmacia."]])}
${ctaBand()}`
});

/* ---------------------------------------------------------------- REPARTI */
add({
  path: "/reparti/", priority: "0.7",
  title: "Dermocosmesi, infanzia, veterinaria e integratori | Farmacia Comunale Canegrate",
  description: "I reparti della Farmacia Comunale di Canegrate: dermocosmesi e solari, mamma e infanzia, farmaci e antiparassitari veterinari, fitoterapia e integratori, con il consiglio del farmacista.",
  crumbs: [HOME, ["Reparti", "/reparti/"]],
  body: `
${pageHero({ eyebrow: "Reparti", h1: "Oltre al farmaco: i nostri reparti", intro: "Prodotti selezionati e il consiglio del farmacista. Se quello che cerchi non c'è, lo ordiniamo: di solito arriva entro il giorno lavorativo successivo.", ctas: btnWa("Buongiorno, vorrei sapere se avete disponibile: ", "Chiedi un prodotto") })}
<section class="mx-auto max-w-7xl space-y-6 px-4 pb-20 sm:px-6">
  ${REPARTI.map((r, i) => `<article id="${r.id}" class="scroll-mt-28 grid items-center gap-6 overflow-hidden rounded-[32px] border border-line bg-paper md:grid-cols-[320px_1fr] lg:grid-cols-[400px_1fr]">
    <img src="https://images.unsplash.com/${r.img}?w=800&h=640&fit=crop&q=70&auto=format" alt="" loading="${i ? "lazy" : "eager"}" class="h-full min-h-56 w-full object-cover" width="800" height="640">
    <div class="prose-farmacia p-6 sm:p-8 lg:p-10">
      <h2 class="!mt-0">${esc(r.titolo)}</h2>
      ${r.lungo}
    </div>
  </article>`).join("\n  ")}
</section>
${ctaBand("Cerchi un prodotto in particolare?", "Scrivici su WhatsApp, anche con una foto: ti confermiamo disponibilità e prezzo e puoi pagare online e ritirare senza code.")}`
});

/* ---------------------------------------------------------------- CHI SIAMO */
add({
  path: "/chi-siamo/", priority: "0.7",
  title: "Chi siamo | Farmacia Comunale Canegrate, quartiere Cascinette",
  description: "La prima farmacia comunale di Canegrate, aperta l'8 ottobre 2026 in Piazza della Musica nel quartiere Cascinette. Un servizio di prossimità per Canegrate e i comuni vicini.",
  crumbs: [HOME, ["Chi siamo", "/chi-siamo/"]],
  schema: [PHARMACY],
  body: `
<section class="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
  <div class="grid gap-12 lg:grid-cols-2 lg:gap-16">
    <div>
      <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>Chi siamo</p>
      <h1 class="mt-3 font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">Una farmacia pubblica, nata per il quartiere.</h1>
      <div class="mt-6 space-y-4 text-lg leading-relaxed text-muted">
        <p>Siamo la prima farmacia comunale di Canegrate, aperta l'8 ottobre 2026 in Piazza della Musica, nel quartiere ${esc(C.quartiere)}. Siamo un servizio di prossimità per Canegrate e per i comuni vicini: ${esc(C.comuniVicini.join(", "))}.</p>
        <p>Farmaci con ricetta e da banco, fitoterapici, integratori, dermocosmesi e articoli per l'infanzia. E poi <a href="/servizi/autoanalisi-glicemia-colesterolo/" class="font-bold text-forest-700 underline underline-offset-2">autoanalisi</a>, <a href="/servizi/elettrocardiogramma-ecg/" class="font-bold text-forest-700 underline underline-offset-2">ECG</a> e <a href="/servizi/holter-cardiaco/" class="font-bold text-forest-700 underline underline-offset-2">Holter</a>, <a href="/servizi/prenotazione-cup/" class="font-bold text-forest-700 underline underline-offset-2">prenotazioni CUP</a>, <a href="/servizi/scelta-revoca-medico/" class="font-bold text-forest-700 underline underline-offset-2">scelta e revoca del medico</a> e <a href="/servizi/consegna-a-domicilio/" class="font-bold text-forest-700 underline underline-offset-2">consegna a domicilio</a>. Nei prossimi mesi aggiungeremo nuovi servizi.</p>
      </div>
      <dl class="mt-10 grid grid-cols-3 gap-4">
        <div class="card p-5"><dt class="text-xs font-bold uppercase tracking-wider text-muted">Gestione</dt><dd class="mt-2 font-display text-xl font-semibold">${esc(C.gestore)}</dd></div>
        <div class="card p-5"><dt class="text-xs font-bold uppercase tracking-wider text-muted">Dal</dt><dd class="mt-2 font-display text-xl font-semibold">2026</dd></div>
        <div class="card p-5"><dt class="text-xs font-bold uppercase tracking-wider text-muted">Quartiere</dt><dd class="mt-2 font-display text-xl font-semibold">${esc(C.quartiere)}</dd></div>
      </dl>
    </div>
    <figure class="relative overflow-hidden rounded-[32px] bg-forest-100" data-foto="foto/team.jpg">
      <img class="aspect-[4/3] h-full w-full object-cover" src="/foto/team.jpg"
           data-fallback="https://images.unsplash.com/photo-1576091358783-a212ec293ff3?w=1200&q=75&auto=format"
           alt="Il team della Farmacia Comunale di Canegrate al bancone" width="1200" height="900">
    </figure>
  </div>
</section>
<section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
  <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
    <h2 class="font-display text-3xl font-semibold">Il nostro team</h2>
    <p class="text-muted">Farmacisti abilitati, iscritti all'Ordine di Milano.</p>
  </div>
  <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    ${C.staff.map(p => {
      const titolo = p.nome || p.ruolo, sotto = p.nome ? p.ruolo : C.nome;
      return `<article class="card overflow-hidden">
      <div class="relative aspect-[4/3] bg-forest-50" data-foto="${esc(p.foto)}">
        <div class="absolute inset-0 grid place-items-center"><span class="grid h-24 w-24 place-items-center rounded-full bg-paper ring-8 ring-forest-100">${CROSS("h-10 w-10")}</span></div>
        <img src="${esc(p.foto)}" alt="${esc(titolo)}" loading="lazy" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()">
      </div>
      <div class="p-5"><h3 class="text-lg font-extrabold">${esc(titolo)}</h3><p class="text-sm text-muted">${esc(sotto)}</p></div>
    </article>`;
    }).join("\n    ")}
  </div>
</section>
<section class="bg-paper py-16 lg:py-20">
  <div class="prose-farmacia mx-auto max-w-3xl px-4 sm:px-6">
    <h2 class="!mt-0">Cosa significa farmacia comunale</h2>
    <p>Una farmacia comunale è una farmacia pubblica, nata per garantire il servizio farmaceutico ai cittadini del territorio. La nostra è gestita da ${esc(C.gestore)} e lavora come ogni farmacia del Servizio sanitario: dispensa i farmaci con ricetta, partecipa ai turni di apertura notturna e festiva e offre i servizi previsti dalla «farmacia dei servizi» della Regione Lombardia.</p>
    <h2>Il nostro modo di lavorare</h2>
    <ul>
      <li><strong>Tempo per ascoltare:</strong> un consiglio fatto bene vale più di un prodotto in più.</li>
      <li><strong>Comodità:</strong> ricette e ordini su WhatsApp, pagamento online, ritiro senza code.</li>
      <li><strong>Accessibilità:</strong> ingresso e bagno accessibili in carrozzina, parcheggio gratuito vicino, dispositivi di ascolto assistito.</li>
      <li><strong>Prevenzione vicino a casa:</strong> controlli ed esami senza dover andare in ospedale.</li>
    </ul>
  </div>
</section>
${ctaBand("Vieni a trovarci alle Cascinette.", "Siamo sotto il porticato di Piazza della Musica, con parcheggio gratuito vicino. Oppure scrivici: rispondiamo negli orari di apertura.")}`
});

/* ---------------------------------------------------------------- ORARI E DOVE SIAMO */
add({
  path: "/orari-e-dove-siamo/", priority: "0.9",
  title: "Orari e indirizzo | Farmacia Comunale Canegrate, Piazza della Musica 6",
  description: `Orari della Farmacia Comunale di Canegrate: ${orariFrase()} Piazza della Musica 6, quartiere Cascinette, con parcheggio gratuito.`,
  crumbs: [HOME, ["Orari e dove siamo", "/orari-e-dove-siamo/"]],
  schema: [PHARMACY],
  body: `
${pageHero({ eyebrow: "Orari e dove siamo", h1: "Orari e indirizzo della farmacia", intro: `Ci trovi in <strong class="text-ink">${esc(C.via)}, a ${esc(C.citta)}</strong>, sotto il porticato nel cuore del quartiere ${esc(C.quartiere)}. ${esc(orariFrase())}`, ctas: `<a href="${esc(MAPS)}" target="_blank" rel="noopener" class="btn-primary !px-6 !py-3.5">${icon("pin", "h-4 w-4")}Indicazioni stradali</a>` + btnTel() })}
<section class="bg-forest-900 py-16 text-white lg:py-20">
  <div class="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr]">
    <div class="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-8">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-sm font-bold uppercase tracking-wider text-forest-100/70">Indirizzo</h2>
          <address class="mt-1 text-xl font-bold not-italic">${esc(INDIRIZZO)}</address>
        </div>
        <span class="status-pill-dark shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider">Orari</span>
      </div>
      <p class="status-long-dark mt-4 text-forest-100"></p>
      <h2 class="mt-6 text-sm font-bold uppercase tracking-wider text-forest-100/70">Orari di apertura</h2>
      <table class="mt-2 w-full text-[15px]"><caption class="sr-only">Orari settimanali</caption><tbody data-hours-table="dark">${hoursRows(true)}</tbody></table>
      <p id="holidayNote" class="mt-4 hidden rounded-xl bg-sun/15 px-4 py-3 text-sm text-sun"></p>
      <p class="mt-4 text-sm text-forest-100/80">Nei giorni festivi siamo chiusi, tranne quando siamo di turno. <a href="/farmacia-di-turno/" class="font-bold text-white underline">Vedi i turni</a>.</p>
    </div>
    <div class="relative min-h-80 overflow-hidden rounded-3xl bg-forest-700 ring-1 ring-white/10" id="mapBox">
      <div class="absolute inset-0 grid place-items-center p-6 text-center" style="background-image:radial-gradient(circle at 1px 1px, rgba(255,255,255,.12) 1px, transparent 0);background-size:22px 22px">
        <div>
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-cross text-forest-900">${icon("pin", "h-7 w-7")}</span>
          <p class="mt-4 text-lg font-bold">${esc(INDIRIZZO)}</p>
          <button id="loadMap" class="btn mt-5 bg-white text-forest-700 hover:bg-forest-50">Mostra la mappa</button>
          <p class="mt-3 text-xs text-forest-100/70">La mappa è fornita da Google: caricandola accetti i suoi cookie.</p>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
  <div class="grid gap-10 lg:grid-cols-2">
    <div class="prose-farmacia">
      <h2 class="!mt-0">Come arrivare</h2>
      <p>La farmacia si trova nel quartiere ${esc(C.quartiere)} di ${esc(C.citta)}, sotto il porticato di Piazza della Musica. C'è un <strong>parcheggio gratuito</strong> vicino, con posti accessibili in carrozzina. Per le indicazioni passo passo usa il pulsante <a href="${esc(MAPS)}" target="_blank" rel="noopener">Indicazioni stradali</a>.</p>
      <h2>Dai comuni vicini</h2>
      <p>Siamo una farmacia di quartiere, ma comoda anche per chi arriva da ${esc(C.comuniVicini.join(", "))}. Puoi prenotare la ricetta su WhatsApp e passare solo a ritirarla, così il viaggio è uno solo.</p>
    </div>
    <div>
      <h2 class="font-display text-2xl font-semibold sm:text-3xl">Servizi e comodità</h2>
      <ul class="mt-6 grid gap-3 sm:grid-cols-2">${C.comodita.map(c => `<li class="card flex items-center gap-3 p-4 text-[15px] font-semibold"><span class="h-2 w-2 shrink-0 rounded-full bg-cross"></span>${esc(c)}</li>`).join("")}</ul>
    </div>
  </div>
</section>
${faqBlock([FAQ_EXTRA[0], FAQ[7], FAQ_EXTRA[1]])}
${ctaBand()}`
});

/* ---------------------------------------------------------------- FARMACIA DI TURNO */
add({
  path: "/farmacia-di-turno/", priority: "0.8",
  title: "Farmacia di turno a Canegrate e Legnano | Aperte di notte e nei festivi",
  description: "Farmacia di turno a Canegrate: i turni della Farmacia Comunale delle Cascinette e il collegamento al servizio ufficiale per trovare le farmacie aperte di notte e nei festivi vicino a te.",
  crumbs: [HOME, ["Farmacia di turno", "/farmacia-di-turno/"]],
  body: `
${pageHero({ eyebrow: "Turni", h1: "Farmacia di turno a Canegrate", intro: "Di notte, la domenica e nei giorni festivi resta aperta a turno almeno una farmacia della zona. Qui trovi i nostri turni e il servizio ufficiale per sapere chi è aperto adesso.", ctas: `<a href="${esc(C.turniUrl)}" target="_blank" rel="noopener" class="btn-primary !px-6 !py-3.5">Farmacie di turno vicino a te ↗</a><a href="https://www.farmacia-aperta.eu/" target="_blank" rel="noopener" class="btn-ghost !px-6 !py-3.5">App Farmacia Aperta ↗</a>` })}
<section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
  <div class="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
    <div class="rounded-3xl bg-cross p-6 text-forest-900 sm:p-8">
      <h2 class="text-sm font-extrabold uppercase tracking-wider">La nostra farmacia</h2>
      <p id="turnoToday" class="mt-2 font-display text-2xl font-semibold leading-snug">Oggi non siamo di turno.</p>
      <p id="turnoNext" class="mt-2 text-[15px] font-semibold text-forest-900/80"></p>
    </div>
    <div class="card p-6 sm:p-8">
      <h2 class="text-lg font-bold">Prossimi turni della Farmacia Comunale</h2>
      <ul id="turniList" class="mt-3">${C.turni.length ? "" : `<li class="py-3 text-muted">Al momento non ci sono turni in calendario per la nostra farmacia. Controlla il servizio ufficiale per sapere chi è aperto.</li>`}</ul>
    </div>
  </div>
  <div class="prose-farmacia mt-14 max-w-3xl">
    <h2 class="!mt-0">Come funzionano i turni</h2>
    <p>I turni di apertura notturna e festiva delle farmacie sono stabiliti dall'ATS e cambiano ogni giorno. Prima di uscire controlla sempre il <a href="${esc(C.turniUrl)}" target="_blank" rel="noopener">servizio delle farmacie di turno</a> o l'app <a href="https://www.farmacia-aperta.eu/" target="_blank" rel="noopener">Farmacia Aperta</a>: ti indicano la farmacia aperta più vicina a Canegrate, Legnano e dintorni.</p>
    <h2>Numeri utili</h2>
    <ul>
      <li><strong>Emergenze:</strong> <a href="tel:112">112</a> (Numero Unico di Emergenza).</li>
      <li><strong>Guardia medica (continuità assistenziale):</strong> <a href="tel:116117">116117</a>, di notte, nei weekend e nei festivi.</li>
      <li><strong>Farmacia Comunale Canegrate:</strong> <a href="${TEL}">${esc(C.telefono)}</a>, negli <a href="/orari-e-dove-siamo/">orari di apertura</a>.</li>
    </ul>
  </div>
</section>
${ctaBand()}`
});

/* ---------------------------------------------------------------- FAQ */
const FAQ_ALL = [...FAQ_EXTRA, ...FAQ];
add({
  path: "/domande-frequenti/", priority: "0.7",
  title: "Domande frequenti | Farmacia Comunale Canegrate",
  description: "Risposte alle domande più comuni: codice NRE, ritiro per un familiare, orari, autoanalisi, ECG gratuito in Lombardia, ordini su WhatsApp, consegna a domicilio e farmacia di turno.",
  crumbs: [HOME, ["Domande frequenti", "/domande-frequenti/"]],
  schema: [faqLd(FAQ_ALL)],
  body: `
<section class="mx-auto max-w-4xl px-4 pt-8 text-center sm:px-6 lg:pt-12">
  <p class="eyebrow justify-center"><span class="h-px w-6 bg-forest-500"></span>Domande frequenti</p>
  <h1 class="mt-3 font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">Le risposte che cerchi più spesso</h1>
</section>
${faqBlock(FAQ_ALL, '<span class="sr-only">Elenco delle domande</span>')}
${ctaBand("Non hai trovato la risposta?", "Scrivici su WhatsApp o chiamaci: il farmacista ti risponde negli orari di apertura.")}`
});

/* ---------------------------------------------------------------- CONTATTI */
add({
  path: "/contatti/", priority: "0.8",
  title: "Contatti | Farmacia Comunale Canegrate · Tel. 0331 725821 e WhatsApp",
  description: `Contatta la Farmacia Comunale di Canegrate: telefono ${C.telefono}, WhatsApp ${WA_LABEL}, ${C.via}. Fai una domanda al farmacista o prenota un servizio.`,
  crumbs: [HOME, ["Contatti", "/contatti/"]],
  schema: [PHARMACY],
  body: `
<section class="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:pt-12">
  <div class="grid gap-12 lg:grid-cols-2 lg:gap-16">
    <div>
      <p class="eyebrow"><span class="h-px w-6 bg-forest-500"></span>Contatti</p>
      <h1 class="mt-3 font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">Scrivici, chiamaci, o passa a trovarci.</h1>
      <div class="mt-10 grid gap-3">
        <a href="${TEL}" data-href="tel" class="card flex items-center gap-4 p-5 transition hover:border-forest-500">
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-forest-50 text-forest-700">${icon("phone")}</span>
          <span><span class="block text-sm text-muted">Telefono</span><span class="block text-lg font-bold">${esc(C.telefono)}</span></span>
        </a>
        <a ${waAttr("Buongiorno, vorrei un'informazione.")} data-wa-only class="card flex items-center gap-4 p-5 transition hover:border-forest-500">
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-forest-500 text-white">${icon("chat")}</span>
          <span><span class="block text-sm text-muted">WhatsApp</span><span class="block text-lg font-bold">${esc(WA_LABEL)}</span></span>
        </a>
        ${C.email ? `<a href="mailto:${esc(C.email)}" data-href="mail" class="card flex items-center gap-4 p-5 transition hover:border-forest-500">
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-forest-50 text-forest-700">${icon("mail")}</span>
          <span class="min-w-0"><span class="block text-sm text-muted">Email</span><span class="block truncate text-lg font-bold">${esc(C.email)}</span></span>
        </a>` : ""}
        <a href="/orari-e-dove-siamo/" class="card flex items-center gap-4 p-5 transition hover:border-forest-500">
          <span class="grid h-12 w-12 place-items-center rounded-xl bg-forest-50 text-forest-700">${icon("pin")}</span>
          <span><span class="block text-sm text-muted">Indirizzo</span><span class="block text-lg font-bold">${esc(INDIRIZZO)}</span></span>
        </a>
      </div>
      <div class="mt-8 card p-6">
        <h2 class="text-lg font-bold">Orari</h2>
        <table class="mt-2 w-full text-[15px]"><caption class="sr-only">Orari settimanali</caption><tbody data-hours-table="light">${hoursRows(false)}</tbody></table>
      </div>
    </div>
    <form id="msgForm" class="card self-start bg-cream p-5 sm:p-8" novalidate>
      <h2 class="font-display text-2xl font-semibold">Fai una domanda al farmacista</h2>
      <p class="mt-1 text-sm text-muted">Ti rispondiamo negli orari di apertura. Per urgenze chiama.</p>
      <div class="mt-6 space-y-5">
        <div class="grid gap-5 sm:grid-cols-2">
          <div><label class="label" for="mNome">Nome</label><input class="field" id="mNome" autocomplete="name" required></div>
          <div><label class="label" for="mTel">Telefono</label><input class="field" id="mTel" type="tel" autocomplete="tel" inputmode="tel"></div>
        </div>
        <div>
          <label class="label" for="mArg">Argomento</label>
          <select class="field" id="mArg"><option>Informazioni su un prodotto</option><option>Prenotare un servizio</option><option>Disponibilità di un farmaco</option><option>Altro</option></select>
        </div>
        <div><label class="label" for="mTesto">Messaggio</label><textarea class="field min-h-32" id="mTesto" required></textarea></div>
        <label class="flex items-start gap-3 text-sm text-muted">
          <input type="checkbox" id="mPrivacy" required class="mt-0.5 h-4 w-4 accent-forest-700">
          <span>Accetto l'<a href="/privacy/" target="_blank" class="font-bold text-forest-700 underline underline-offset-2">informativa privacy</a>.</span>
        </label>
        <p id="mError" class="hidden rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral" role="alert"></p>
        <div class="flex flex-col gap-3 sm:flex-row">
          <button type="submit" data-via="wa" class="btn-wa flex-1">Invia su WhatsApp</button>
          <button type="submit" data-via="mail" class="btn-ghost flex-1">Invia via email</button>
        </div>
      </div>
    </form>
  </div>
</section>`
});

/* ---------------------------------------------------------------- PRIVACY */
add({
  path: "/privacy/", priority: "0.2",
  title: "Informativa privacy e cookie | Farmacia Comunale Canegrate",
  description: "Informativa sul trattamento dei dati personali e sui cookie del sito della Farmacia Comunale di Canegrate.",
  crumbs: [HOME, ["Privacy e cookie", "/privacy/"]],
  body: `
<section class="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 lg:pt-12">
  <h1 class="font-display text-[38px] font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl">Informativa privacy e cookie</h1>
  <!-- Testo base: fallo verificare dal vostro consulente privacy -->
  <div class="prose-farmacia mt-8">
    <h2>Titolare del trattamento</h2>
    <p>${esc(C.gestore)}, P. IVA ${esc(C.piva)}, sede legale ${esc(C.sedeLegale)}. Contatto: ${C.email ? esc(C.email) : "tel. " + esc(C.telefono)}.</p>
    <h2>Quali dati</h2>
    <p>Nome, telefono e i codici delle ricette o i prodotti che ci comunichi volontariamente via WhatsApp o email. I pagamenti online avvengono sulla pagina sicura del fornitore del servizio di pagamento: la farmacia non riceve i dati della tua carta. Questo sito non salva i dati dei moduli: li usi tu per comporre il messaggio.</p>
    <h2>Perché</h2>
    <p>Per preparare i farmaci e i prodotti richiesti e per ricontattarti. Base giuridica: il tuo consenso e l'esecuzione della richiesta (art. 6 e 9 GDPR).</p>
    <h2>Per quanto tempo</h2>
    <p>Il tempo necessario a evadere la richiesta e agli obblighi di legge.</p>
    <h2>Cookie</h2>
    <p>Il sito non usa cookie di profilazione né statistiche. La mappa di Google e i caratteri tipografici sono forniti da servizi esterni; la mappa si carica solo se la richiedi.</p>
    <h2>I tuoi diritti</h2>
    <p>Accesso, rettifica, cancellazione, limitazione e reclamo al Garante Privacy (<a href="https://www.garanteprivacy.it/" target="_blank" rel="noopener">garanteprivacy.it</a>).</p>
  </div>
</section>`
});

/* ---------------------------------------------------------------- 404 */
const page404 = {
  path: "/404.html", noindex: true, sitemap: false,
  title: "Pagina non trovata | Farmacia Comunale Canegrate",
  description: "La pagina che cerchi non esiste o è stata spostata.",
  body: `
<section class="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
  <p class="font-display text-7xl font-semibold text-forest-600">404</p>
  <h1 class="mt-4 font-display text-4xl font-semibold">Pagina non trovata</h1>
  <p class="mt-4 text-lg text-muted">La pagina che cerchi non esiste o è stata spostata. Prova da qui:</p>
  <div class="mt-8 flex flex-wrap justify-center gap-3">
    <a href="/" class="btn-primary">Pagina iniziale</a>
    <a href="/servizi/" class="btn-ghost">Servizi</a>
    <a href="/prenota-ricetta/" class="btn-ghost">Prenota ricetta</a>
    <a href="/contatti/" class="btn-ghost">Contatti</a>
  </div>
</section>`
};

/* =====================================================================
   SCRITTURA FILE
   ===================================================================== */
for (const p of PAGES) {
  const out = path.join(ROOT, p.path, "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, layout(p));
}
fs.writeFileSync(path.join(ROOT, "404.html"), layout(page404).replace(`<link rel="canonical" href="${SITE}/404.html">\n`, ""));

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map(p => `  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${OGGI}</lastmod>
    <priority>${p.priority || "0.5"}</priority>
  </url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, "robots.txt"), `User-agent: *
Allow: /
Disallow: /sorgente/

Sitemap: ${SITE}/sitemap.xml
`);
console.log(`Generate ${PAGES.length} pagine + 404, sitemap.xml e robots.txt`);
