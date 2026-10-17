# Sito Farmacia Comunale Canegrate

Sito statico pubblicato con GitHub Pages su https://www.gruppofarmapoint.it

## Pagine
Ogni argomento ha la sua pagina (utile per Google): home, servizi, una pagina per ogni
servizio principale (ECG, Holter, autoanalisi, pressione, CUP, consegna a domicilio),
prenota ricetta, ordina su WhatsApp, reparti, chi siamo, orari e dove siamo, farmacia
di turno, domande frequenti, contatti, privacy.

## Cosa modificare
- **Turni, chiusure, distributore H24, recensioni, telefono, orari** → `assets/config.js`
  (si può modificare direttamente da GitHub con la matita ✏️).
- **Testi delle pagine e dei servizi** → `sorgente/build.mjs`.
- **Foto** → cartella `foto/` (vedi `foto/LEGGIMI.txt`).

Non modificare a mano i file `index.html`: vengono rigenerati.
Dopo ogni modifica a `assets/config.js` o a `sorgente/`, GitHub rigenera da solo
le pagine (scheda **Actions** → «Rigenera il sito»).

## Rigenerare sul proprio computer (facoltativo)
```
cd sorgente
npm install
npm run build
```

## Dopo la pubblicazione
In Google Search Console invia la sitemap `https://www.gruppofarmapoint.it/sitemap.xml`.
