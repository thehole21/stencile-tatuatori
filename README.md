# Inkline — Studio stencil
Webapp React con build Node.js. Le foto sono decodificate sul dispositivo. Il worker genera contorni con soppressione dei non massimi e isteresi, guide tonali o campiture nere. Il lato maggiore è limitato a 2048 pixel. Il PNG esportato è bianco e nero con sfondo bianco.

## Avvio
Con Node.js 20 o successivo, eseguire `npm install`, `npm run build` e `npm start`. Aprire http://localhost:4173. Test del motore con `npm test`.

## Vercel e uso offline
Importare la repository in Vercel. Il file vercel.json imposta build e directory dist. Nessuna variabile ambiente richiesta.
Aprire una prima volta online e attendere “Pronto offline”. Dallo stesso browser e indirizzo si può riaprire la pagina senza rete, importare altre foto ed esportare. Le foto restano in memoria fino alla chiusura o al ricaricamento. Salvare il PNG per conservare il lavoro. La cancellazione dei dati del sito richiede un nuovo primo accesso online.

