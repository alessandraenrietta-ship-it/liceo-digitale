/** @OnlyCurrentDoc */
/* La riga qui sopra dice a Google che il programma tocca soltanto il
   foglio a cui e' collegato, e nessun altro file dell'account. Cosi',
   quando chiede il permesso, Google chiede solo quello. */

/**
 * IL REGOLAMENTO IN GIOCO: LE RISPOSTE DAI TELEFONI
 * Parte che gira sul server di Google (Apps Script), collegata a un
 * Foglio Google dell'account della scuola.
 *
 * A COSA SERVE
 * I gruppi, dal telefono, mandano qui la loro risposta. Questo
 * programma la scrive come una riga nel foglio. Lo schermo proiettato
 * in classe, ogni pochi secondi, chiede qui le risposte della sua
 * partita e le mostra in bacheca.
 *
 * LA PARTITA
 * Ogni partita ha un codice di sei caratteri, che la pagina inventa e
 * mette dentro al codice QR. Una risposta arriva sempre con il suo
 * codice, e lo schermo chiede solo le risposte del proprio. Cosi' due
 * classi che giocano nello stesso momento non si mescolano.
 *
 * REGOLA IMPORTANTE
 * L'indirizzo di questo programma sta scritto nel sito, che e'
 * pubblico: chiunque lo trovi puo' mandare qualcosa. Per questo tutti i
 * controlli stanno qui, e non nella pagina: ogni risposta viene
 * ricontrollata da capo prima di finire nel foglio. Da fuori non si puo'
 * ne' cancellare ne' modificare niente: si puo' solo aggiungere una
 * risposta, e leggere quelle di una partita di cui si conosce il codice.
 *
 * Questo file non contiene nessun dato e nessuna chiave: si puo'
 * lasciare pubblico senza problemi.
 */

/* ------------------------------------------------------------------
   NOMI, COLONNE E LIMITI
   ------------------------------------------------------------------ */

var FOGLIO_RISPOSTE = 'Risposte';

var INTESTAZIONI = [
  'Arrivata il',
  'Partita',
  'Gruppo',
  'Caso',
  'Tempo (secondi)',
  'Sanzione',
  'Organo competente',
  'Procedura',
  'Perché'
];

/* I cinque casi del gioco: una risposta con un altro nome di caso non
   viene accettata. */
var CASI = ['c1', 'c2', 'c3', 'c4', 'c5'];

/* Il codice della partita: sei caratteri, solo lettere maiuscole e
   cifre, senza quelli che si confondono (0 e O, 1 e I). */
var FORMA_PARTITA = /^[A-HJ-NP-Z2-9]{6}$/;

/* Quanto puo' essere lungo ogni testo. Bastano e avanzano per una
   risposta vera, e impediscono di riempire il foglio di spazzatura. */
var MASSIMO_GRUPPO = 40;
var MASSIMO_TESTO = 2000;

/* Quante risposte al massimo in una partita: una classe intera che
   risponde a tutti e cinque i casi ci sta larga. */
var MASSIMO_PER_PARTITA = 150;


/* ------------------------------------------------------------------
   PREPARARE IL FOGLIO
   Si esegue una volta sola, dall'editor, al momento di metterlo in
   piedi. Se la scheda Risposte c'e' gia', non la tocca.
   ------------------------------------------------------------------ */

function configuraFoglio() {
  var documento = SpreadsheetApp.getActiveSpreadsheet();
  if (documento.getSheetByName(FOGLIO_RISPOSTE)) return;

  var foglio = documento.insertSheet(FOGLIO_RISPOSTE);
  foglio.getRange(1, 1, 1, INTESTAZIONI.length)
    .setValues([INTESTAZIONI])
    .setFontWeight('bold');
  foglio.setFrozenRows(1);
}


/* ------------------------------------------------------------------
   ARRIVA UNA RISPOSTA (dal telefono di un gruppo)
   ------------------------------------------------------------------ */

function doPost(e) {
  try {
    var dati = JSON.parse(e.postData.contents);

    var partita = String(dati.partita || '');
    var caso = String(dati.caso || '');
    var gruppo = pulisci(dati.gruppo, MASSIMO_GRUPPO);
    var sanzione = pulisci(dati.sanzione, MASSIMO_TESTO);
    var organo = pulisci(dati.organo, MASSIMO_TESTO);
    var procedura = pulisci(dati.procedura, MASSIMO_TESTO);
    var perche = pulisci(dati.perche, MASSIMO_TESTO);
    var secondi = Math.max(0, Math.min(86400, Math.floor(Number(dati.secondi) || 0)));

    if (!FORMA_PARTITA.test(partita)) return risposta({ ok: false, errore: 'partita' });
    if (CASI.indexOf(caso) < 0) return risposta({ ok: false, errore: 'caso' });
    if (!gruppo) return risposta({ ok: false, errore: 'gruppo' });
    if (!sanzione && !organo && !procedura && !perche) {
      return risposta({ ok: false, errore: 'vuota' });
    }

    /* La serratura: se due gruppi inviano nello stesso istante, uno
       aspetta l'altro, e il conteggio qui sotto resta giusto. */
    var serratura = LockService.getScriptLock();
    serratura.waitLock(10000);
    try {
      var foglio = foglioRisposte();
      if (contaPartita(foglio, partita) >= MASSIMO_PER_PARTITA) {
        return risposta({ ok: false, errore: 'troppe' });
      }
      foglio.appendRow([
        new Date(), testoSicuro(partita), testoSicuro(gruppo), caso, secondi,
        testoSicuro(sanzione), testoSicuro(organo),
        testoSicuro(procedura), testoSicuro(perche)
      ]);
    } finally {
      serratura.releaseLock();
    }

    return risposta({ ok: true });
  } catch (err) {
    return risposta({ ok: false, errore: 'server' });
  }
}


/* ------------------------------------------------------------------
   LO SCHERMO DELLA CLASSE CHIEDE LE RISPOSTE DELLA SUA PARTITA
   ------------------------------------------------------------------ */

function doGet(e) {
  try {
    var partita = String((e && e.parameter && e.parameter.partita) || '');
    if (!FORMA_PARTITA.test(partita)) return risposta({ ok: false, errore: 'partita' });

    var righe = righeDelFoglio(foglioRisposte());
    var elenco = [];
    righe.forEach(function (r) {
      if (String(r[1]) !== partita) return;
      elenco.push({
        arrivata: r[0] instanceof Date ? r[0].getTime() : 0,
        gruppo: String(r[2]),
        caso: String(r[3]),
        secondi: Number(r[4]) || 0,
        sanzione: String(r[5]),
        organo: String(r[6]),
        procedura: String(r[7]),
        perche: String(r[8])
      });
    });

    return risposta({ ok: true, risposte: elenco });
  } catch (err) {
    return risposta({ ok: false, errore: 'server' });
  }
}


/* ------------------------------------------------------------------
   PICCOLI AIUTI
   ------------------------------------------------------------------ */

function foglioRisposte() {
  var foglio = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FOGLIO_RISPOSTE);
  if (!foglio) throw new Error('Manca la scheda ' + FOGLIO_RISPOSTE);
  return foglio;
}

/* Tutte le righe tranne quella dei titoli. */
function righeDelFoglio(foglio) {
  var ultima = foglio.getLastRow();
  if (ultima < 2) return [];
  return foglio.getRange(2, 1, ultima - 1, INTESTAZIONI.length).getValues();
}

function contaPartita(foglio, partita) {
  var ultima = foglio.getLastRow();
  if (ultima < 2) return 0;
  var codici = foglio.getRange(2, 2, ultima - 1, 1).getValues();
  var quante = 0;
  codici.forEach(function (c) { if (String(c[0]) === partita) quante++; });
  return quante;
}

/* Un testo qualsiasi diventa una stringa senza spazi ai bordi e non
   piu' lunga del massimo. */
function pulisci(valore, massimo) {
  return String(valore == null ? '' : valore).trim().slice(0, massimo);
}

/* Il foglio, da solo, trasforma certi testi: "1/2" diventa una data,
   "2E5" un numero, e quello che comincia con = una formula.
   L'apostrofo davanti gli dice "e' solo testo, lascialo com'e'":
   nella casella non si vede, e rileggendola torna il testo di prima. */
function testoSicuro(testo) {
  return "'" + testo;
}

function risposta(oggetto) {
  return ContentService
    .createTextOutput(JSON.stringify(oggetto))
    .setMimeType(ContentService.MimeType.JSON);
}
