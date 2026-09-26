# Regole del progetto "liceo digitale"

Questo file contiene le regole che Claude deve rispettare **sempre** quando
lavora in questa cartella. Il progetto è un piccolo sito didattico
pubblicato con GitHub Pages.

Repository: https://github.com/alessandraenrietta-ship-it/liceo-digitale
Sito online: https://alessandraenrietta-ship-it.github.io/liceo-digitale/

## 0. Il contesto: che cos'è il sito

"Liceo digitale" è il sito didattico dell'**I.I.S. Giulio Natta**. Raccoglie
gli **artefatti** costruiti dai docenti, cioè piccoli strumenti interattivi,
ognuno in una sua cartella. Alcuni sono per gli studenti, altri sono
strumenti di lavoro dei docenti.

Come è fatto, in breve. I dettagli sono in `README.md`.

- `index.html` è la pagina iniziale. Ha due sezioni, **studenti** e
  **docenti**, ognuna con una parola d'ordine. Quelle parole **non
  proteggono niente**: servono solo a separare i due pubblici, e chi
  conosce l'indirizzo di una cartella la apre lo stesso.
- `artefatti.txt` è **il registro**: la home legge da qui l'elenco degli
  strumenti, una riga per artefatto
  (`titolo | disciplina | destinatario | cartella | descrizione`).
  Per aggiungere uno strumento si aggiunge una riga, senza toccare il codice.
- `stile.css` contiene i colori e lo stile comuni, con il tema chiaro e
  scuro. I colori si usano sempre con i loro nomi (`var(--verde)`,
  `var(--testo)`...), mai con i codici scritti a mano.
- `js/home.js` costruisce la home, `js/tema.js` ricorda il tema chiaro o
  scuro, `js/chiave.js` disegna il riquadro della chiave personale,
  `js/qr.js` disegna i codici QR.
- `specifica-comune.md` contiene le regole da dare ai colleghi che
  costruiscono un artefatto nuovo.
- `anteprima.bat` apre il sito sul computer senza pubblicarlo. Aprire
  `index.html` con un doppio clic non basta.

### Convenzioni tecniche da rispettare

- **Il numero `?v=`.** Quando si modifica `stile.css` o un file in `js/`,
  si aumenta di uno il numero `?v=` in **tutti** i tag che lo caricano
  (esempio: `stile.css?v=10` diventa `?v=11`). Senza, i browser continuano
  a mostrare la versione vecchia.
- **I commenti nel codice** sono in italiano, semplici e discorsivi, come
  quelli già presenti.
- **Gli strumenti con intelligenza artificiale** usano l'API Gemini di
  Google con la chiave personale del docente, gestita da `js/chiave.js`.
  Il nome del modello (per esempio `gemini-3.6-flash`) oggi è scritto
  dentro ogni pagina.
- **Meno dati possibile a Google.** Negli strumenti con intelligenza
  artificiale non si inviano nomi, classi o date. Esempio: in
  `docenti-annotazioni` il nome non si chiede, la data parte come `[DATA]`
  e viene rimessa nel browser, e prima dell'invio un controllo segnala
  sigle di classe, date e possibili nomi propri.

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

### Chi può usare un artefatto

Ogni artefatto si carica nella **sezione docenti**. Poi vale questa regola,
scritta nel terzo campo della sua riga in `artefatti.txt`:

- **usa l'intelligenza artificiale** (quindi chiede una chiave di accesso
  personale) → `docenti`
- **non la usa** → `entrambi`, così lo vedono anche gli studenti

**Eccezione:** gli **strumenti generali**, cioè quelli con il campo
disciplina vuoto, restano **sempre** `docenti`, anche quando non usano
l'intelligenza artificiale. Sono strumenti di lavoro dei docenti e non
riguardano gli studenti. Questo vale a prescindere dalla regola qui sopra.

Il motivo non è didattico ma tecnico, e non ha aggiramenti: la chiave è
personale, ha una quota gratuita pensata per una persona sola, e oltre
quella si paga. Non si può distribuire a una classe. E non serve inventare
un "codice per gli studenti": il sito è pubblico e il suo codice è leggibile
da chiunque, quindi qualunque codice o chiave scritta nella pagina sarebbe
visibile in pochi secondi. Sarebbe una tenda, non una serratura.

Se un artefatto per gli studenti deve usare l'intelligenza artificiale,
ci sono due strade, e nessuna delle due si imbocca da sola:

1. **Un programma intermedio** che tenga la chiave nascosta. Cambia la
   natura del progetto: non è più una cartella di file.
2. **La chiave la fornisce la famiglia.** Ogni studente incolla sul
   proprio dispositivo la chiave creata da un genitore. Tecnicamente
   funziona e non richiede niente di nuovo: basta il riquadro condiviso
   descritto qui sotto.

La seconda strada è **preparata ma non attiva**. Prima di usarla servono
tre cose, che non sono decisioni tecniche: il via libera del dirigente o
del responsabile privacy (i testi dei minori finiscono a un servizio
esterno), un'alternativa per chi non ha la chiave (altrimenti l'attività
esclude qualcuno), e l'informativa alle famiglie. Vanno verificate prima,
non dopo.

### Il riquadro della chiave: uno solo, condiviso

Gli artefatti che chiedono una chiave **non se la costruiscono da soli**:
usano `js/chiave.js`, che disegna il riquadro, salva la chiave nel browser
di chi la usa e la rilegge. Le istruzioni per usarlo sono scritte in cima
a quel file.

Non si scrive mai una chiave dentro il codice, nemmeno per prova.

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

## 9. Lavoro in collaborazione, tutti su `main`

Al sito lavorano più docenti, e tutti salvano direttamente su `main`,
senza rami separati. Per non pestarsi i piedi:

- **Ognuno lavora solo nella propria cartella.** I conflitti nascono
  solo quando due persone modificano lo stesso file nello stesso momento.
- **I file condivisi** (`index.html`, `artefatti.txt`, `stile.css`, la
  cartella `js/`, `CLAUDE.md`, `README.md`, `specifica-comune.md`) li
  modifica la coordinatrice, oppure qualcuno con il suo permesso, per
  quella volta sola. Se una richiesta tocca uno di questi file, Claude lo
  fa notare prima di procedere.
- **Prima di iniziare** a lavorare, Claude scarica le novità (`git pull`).
- **Prima di ogni `git push`** Claude scarica di nuovo le novità
  (`git pull --rebase`). Se c'è un conflitto, non lo risolve da solo:
  lo spiega con parole semplici e si decide insieme.
- **Prima di salvare una modifica** Claude la prova e la mostra. Se la
  richiesta lo dice, mostra anche il confronto completo prima di toccare
  il file vero.

### Ruoli

Da completare con le persone reali. Se non vogliono comparire in un
repository pubblico, si scrive solo il ruolo, senza nome.

| Ruolo | Chi | Cosa fa | File che tocca |
|---|---|---|---|
| Coordinatrice del sito | Alessandra | Decide cosa si pubblica, aggiunge le righe al registro, cura le regole | I file condivisi |
| Referente di disciplina | Un docente per materia (da definire) | Costruisce e aggiorna gli strumenti della sua materia | Solo le cartelle della sua materia |
| Referente strumenti docenti | Da definire | Cura annotazioni, orario e aule, Minosse | Le cartelle `docenti-...` |
| Controllo privacy | Da definire | Prima di pubblicare controlla che non ci siano dati veri, chiavi o password. Tiene i contatti con il responsabile privacy della scuola (DPO) | Nessuno: guarda e dà il via libera |

## 10. Promemoria: cose da fare

Lavori già individuati e non ancora fatti. Quando uno è fatto, si toglie
da qui.

1. **Chiave sui computer condivisi.** `js/chiave.js` salva la chiave in
   `localStorage`, quindi resta anche sui PC dell'aula. Valutare di
   cancellarla alla chiusura del browser (`sessionStorage`), con una
   casella "Ricorda su questo computer".
2. **Password della home.** Oggi separano soltanto le sezioni, e le
   cartelle si raggiungono per indirizzo diretto. Rinominare il campo, o
   prevedere un accesso vero. Togliere la memoria permanente della
   sezione aperta.
3. **Nomi dei modelli Gemini.** Sono scritti in ogni pagina: raccoglierli
   in un punto solo.
4. **Home.** Nascondere le discipline senza strumenti. Mostrare "Righe del
   registro da controllare" solo nell'area docenti.
5. **Registro.** In `artefatti.txt` la descrizione di "Annotazioni sul
   registro" dice ancora che il nome resta sul computer: ora il nome non
   si chiede più, quindi va aggiornata.
6. **Privacy.** L'uso di Gemini con chiavi gratuite per testi che
   riguardano studenti va verificato con il DPO della scuola. Le
   modifiche tecniche riducono il rischio ma non sostituiscono questa
   verifica.
