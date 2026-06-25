# MovieTracker — Frontend UI5

App SAPUI5 freestyle per consumare il backend MovieTracker CAP.

## Stack tecnologico
- SAPUI5 1.149+
- OData V4 Model
- sap.m + sap.ui.table

## Setup locale

### Prerequisiti
- Node.js 20+
- Backend MovieTracker deployato e raggiungibile

### Installazione
\`\`\`bash
git clone https://github.com/SaraCamedda/movietracker-ui.git
cd movietracker-ui
npm install
\`\`\`

### Configura l'endpoint backend
Apri `webapp/manifest.json` → `dataSources.mainService.uri` 
e inserisci l'URL del tuo backend CAP deployato:
\`\`\`
https://<tuo-host>-movietracker-srv.cfapps.<region>.hana.ondemand.com/movies/
\`\`\`

### Avvio
\`\`\`bash
npm run start-noflp
\`\`\`
Apri http://localhost:8080

## Funzionalità
- Lista film con ordinamento per anno
- Ricerca per titolo, regista, genere
- Visualizzazione recensioni con dialog
- CRUD film (Crea / Modifica / Elimina)
- Marca come visto

## Backend
https://github.com/SaraCamedda/movietracker-cap

## Autore
Sara Camedda — Corso SAP BTP 2026