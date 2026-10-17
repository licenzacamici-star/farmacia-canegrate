/* =====================================================================
   CONFIG — DATI DELLA FARMACIA (modificabili anche da GitHub, dal browser)
   ---------------------------------------------------------------------
   • Turni, chiusure straordinarie, distributore, recensioni: basta
     modificare questo file, il sito si aggiorna da solo.
   • Se cambi telefono, indirizzo o orari, le pagine vengono rigenerate
     in automatico da GitHub (vedi LEGGIMI.md).
   ===================================================================== */
window.CONFIG = {
  /* Dati verificati il 13/10/2026 dal profilo Google dell'attività e da farmaciediturno.org */
  nome: "Farmacia Comunale Canegrate",
  sito: "https://www.gruppofarmapoint.it",
  gestore: "Farma Point Srl",
  piva: "14318590966",
  sedeLegale: "Via E. Toti, 42 · 20039 Canegrate (MI)",
  via: "Piazza della Musica, 6",
  cap: "20039",
  citta: "Canegrate",
  provincia: "MI",
  quartiere: "Cascinette",
  mapsQuery: "Farmacia Comunale Canegrate, Piazza della Musica 6, 20039 Canegrate MI",
  telefono: "0331 725821",
  /* WhatsApp: numero con prefisso 39, senza spazi né +.
     Lasciando "" i pulsanti WhatsApp diventano pulsanti "Chiama". */
  whatsapp: "393534203900",
  email: "",                           // nessuna email pubblica: aggiungila qui (es. una Gmail gratuita)
  apertura: "Aperta dall'8 ottobre 2026",
  turniUrl: "https://www.farmaciediturno.org/comune.asp?cod=15046",
  /* Recensioni Google (aggiorna ogni tanto il numero) */
  google: { voto: "5,0", recensioni: 31, url: "https://www.google.com/maps/search/?api=1&query=Farmacia+Comunale+Canegrate+Piazza+della+Musica+6" },

  /* Orari: 0 = domenica, 1 = lunedì … 6 = sabato. [] = chiuso. */
  orari: {
    1: [["08:00","12:30"],["15:00","19:30"]],
    2: [["08:00","12:30"],["15:00","19:30"]],
    3: [["08:00","12:30"],["15:00","19:30"]],
    4: [["08:00","12:30"],["15:00","19:30"]],
    5: [["08:00","12:30"],["15:00","19:30"]],
    6: [["09:00","12:30"],["15:00","18:00"]],
    0: []
  },
  /* Giorni in cui la farmacia è DI TURNO (formato AAAA-MM-GG) e orario del turno */
  turni: [
    // { data: "2026-11-01", orari: [["08:00","20:00"]] },
  ],
  /* Chiusure straordinarie (ferie, inventario…) */
  chiusure: [
    // "2026-12-26",
  ],
  /* Distributore H24: metti true quando è installato e funzionante */
  distributoreAttivo: false,

  /* Comodità (dal profilo Google) */
  comodita: ["Parcheggio gratuito", "Ingresso accessibile in carrozzina", "Bagno accessibile", "Dispositivi di ascolto assistito", "Pagamento con carte e contactless", "Consegna a domicilio"],

  /* Comuni vicini serviti */
  comuniVicini: ["Legnano", "Parabiago", "Cerro Maggiore", "San Vittore Olona", "Nerviano"],

  /* Team: inserisci i nomi (o lascia "" per mostrare solo il ruolo).
     Foto: carica foto/staff-1.jpg, staff-2.jpg, staff-3.jpg */
  staff: [
    { nome: "", ruolo: "Direttore di farmacia", foto: "/foto/staff-1.jpg" },
    { nome: "", ruolo: "Farmacista · dermocosmesi e consiglio", foto: "/foto/staff-2.jpg" },
    { nome: "", ruolo: "Farmacista · servizi e telemedicina", foto: "/foto/staff-3.jpg" }
  ]
};
