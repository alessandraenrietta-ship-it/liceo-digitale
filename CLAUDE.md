# Regole del progetto "liceo digitale"

Questo file contiene le regole che Claude deve rispettare **sempre** quando
lavora in questa cartella. Il progetto è un piccolo sito didattico
pubblicato con GitHub Pages.

Repository: https://github.com/alessandraenrietta-ship-it/liceo-digitale

## 1. Sito statico, senza complicazioni

- Solo **HTML, CSS e JavaScript** scritti a mano.
- **Nessuna libreria esterna** (niente React, Bootstrap, jQuery, font o
  script caricati da altri siti).
- **Nessun passaggio di build**: i file che stanno nella cartella sono
  esattamente quelli che finiscono online. Niente npm, niente compilatori,
  niente `node_modules`.

## 2. Struttura dei file

- `index.html` sta nella **cartella principale** ed è la pagina di ingresso.
- Si usano **solo percorsi relativi** (per esempio `stile.css` oppure
  `../index.html`, mai `/stile.css` e mai indirizzi completi che
  iniziano con `http`). Questo è necessario perché su GitHub Pages il sito
  non si trova alla radice del dominio.
- Prima di dare per buono un collegamento, si controlla che il file
  esista davvero con quel nome, comprese maiuscole e minuscole: il server
  di GitHub distingue `Foto.jpg` da `foto.jpg`, il computer di casa no.

## 3. Contenuti separati dal codice

- I testi delle pagine stanno in **file di testo semplici** (`.txt`,
  `.md` o `.json` ben commentato), in cartelle dedicate, **separati dal
  codice**.
- Devono poter essere modificati **senza saper programmare**: niente tag
  HTML mescolati ai testi, niente virgolette o parentesi che, se
  cancellate per sbaglio, rompono il sito.
- Se un contenuto va per forza dentro un file HTML, lo si segnala con un
  commento chiaro, per esempio:
  `<!-- TESTO MODIFICABILE: puoi cambiare le righe qui sotto -->`

## 4. Un artefatto, una cartella

- Ogni artefatto didattico sta in una **cartella propria**, chiamata
  `disciplina-titolo`: tutto **minuscolo**, parole separate da
  **trattino**, senza spazi, senza accenti e senza lettere speciali.
- Esempi corretti: `storia-la-rivoluzione-francese`,
  `matematica-le-frazioni`, `italiano-analisi-del-testo`.
- Esempi da evitare: `Storia/La Rivoluzione Francese`, `mate_frazioni`,
  `italiano analisi`.

## 5. Commit piccoli e frequenti

- Si fa un commit per **ogni cambiamento compiuto e sensato**, senza
  accumulare tante modifiche diverse in un unico commit.
- I messaggi di commit sono **in italiano** e spiegano **che cosa è
  cambiato**, non come è stato fatto tecnicamente.
- Esempi buoni: `Aggiunta la pagina sulla rivoluzione francese`,
  `Corretto il link rotto nel menu`, `Cambiato il colore dei titoli`.
- Esempi da evitare: `update`, `fix`, `wip`, `varie modifiche`.

## 6. Git sì, gh no

- Si usa **sempre `git` da riga di comando**.
- **Non si usa mai `gh`** (la GitHub CLI): non è installata su questo
  computer.
- **Prima di ogni `git push` si chiede conferma** ad Alessandra e si
  aspetta una risposta esplicita. Il push rende pubbliche le modifiche
  online, quindi non si fa mai di iniziativa.

## 7. Come parlare con Alessandra

- Alessandra **non è una programmatrice**.
- Ogni cosa fatta va spiegata **con parole semplici**: che cosa è stato
  fatto, in quale file, e che effetto ha sul sito che si vede nel browser.
- Niente gergo tecnico senza spiegazione. Se un termine tecnico serve
  davvero, lo si spiega la prima volta che compare.
- Meglio una frase in più di chiarezza che una riga di codice non spiegata.

## 8. Il repository è pubblico

Tutto quello che finisce qui dentro è **visibile a chiunque nel mondo**,
anche dopo averlo cancellato (resta nella cronologia di git). Quindi:

- **Nessun dato personale reale di studenti**: niente nomi e cognomi,
  niente foto, niente voti, niente email, niente classi identificabili,
  niente compiti o elaborati riconoscibili.
- Per gli esempi si usano **nomi di fantasia** (Studente A, Mario Rossi).
- **Nessuna chiave API, password o token** nel codice, nemmeno dentro un
  commento o in un file di prova.
- Nel dubbio su un contenuto, si chiede prima di pubblicarlo.
