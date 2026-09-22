/* ------------------------------------------------------------------
   qr.js - disegna un codice QR

   COME SI USA (per chi scrive le pagine)

     <script src="../js/qr.js"></script>

     document.getElementById("dove").innerHTML =
       QR.svg("https://esempio.it/pagina");

   QR.svg(testo) restituisce un disegno pronto da mettere dentro la
   pagina. Il disegno è vettoriale: ingrandito sulla LIM resta
   nitido, non sgrana.

   Si possono passare delle opzioni:

     QR.svg(testo, { bordo: 4, titolo: "Inquadra per aprire la pagina" })

     bordo    quanti quadretti bianchi lasciare attorno al codice.
              Sotto 4 molti telefoni non lo leggono: non scendere
              sotto 4 senza un motivo.
     titolo   la descrizione che leggono i lettori di schermo.

   ATTENZIONE AL FONDO BIANCO
   Il disegno si porta dietro il proprio rettangolo bianco. Serve: un
   codice QR scuro su fondo scuro non si legge. Non toglierlo.

   QUANTO TESTO CI STA
   Fino a 213 caratteri, che per un indirizzo internet sono
   abbondanti. Oltre quella misura QR.svg restituisce una stringa
   vuota, invece di disegnare un codice sbagliato.

   PERCHÉ È SCRITTO A MANO
   Le regole del progetto non ammettono librerie prese da altri siti.
   Qui dentro c'è quindi tutto quello che serve a costruire un codice
   QR: la correzione d'errore, la griglia e le sue maschere. Non è
   codice da leggere per capire il sito: è un pezzo di meccanica.
   ------------------------------------------------------------------ */

var QR = (function () {
  "use strict";

  /* ================================================================
     1. ARITMETICA DI GALOIS

     La correzione d'errore del QR fa i conti in un'aritmetica
     particolare, dove sommare vuol dire XOR. Queste due tabelle
     permettono di moltiplicare in fretta.
     ================================================================ */

  var EXP = new Array(512);
  var LOG = new Array(256);

  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x = x << 1;
      if (x & 0x100) x = x ^ 0x11d;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function perGF(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  /* Il polinomio generatore: (x + a^0)(x + a^1)... tante volte quanti
     sono i byte di correzione richiesti. */
  function polinomioGeneratore(grado) {
    var poly = [1];
    for (var i = 0; i < grado; i++) {
      var nuovo = [];
      for (var k = 0; k <= poly.length; k++) nuovo[k] = 0;
      for (var j = 0; j < poly.length; j++) {
        nuovo[j] ^= poly[j];
        nuovo[j + 1] ^= perGF(poly[j], EXP[i]);
      }
      poly = nuovo;
    }
    return poly;
  }

  /* I byte di correzione sono il resto di una divisione fra
     polinomi. */
  function byteDiCorrezione(dati, quanti) {
    var gen = polinomioGeneratore(quanti);
    var resto = dati.slice();
    for (var z = 0; z < quanti; z++) resto.push(0);
    for (var i = 0; i < dati.length; i++) {
      var c = resto[i];
      if (c !== 0) {
        for (var j = 0; j < gen.length; j++) resto[i + j] ^= perGF(gen[j], c);
      }
    }
    return resto.slice(dati.length);
  }

  /* ================================================================
     2. LE TABELLE DELLO STANDARD

     Un codice QR esiste in quaranta misure, chiamate versioni. Qui ne
     usiamo le prime dieci: bastano e avanzano per un indirizzo
     internet, e restano codici con pochi quadretti, quindi più
     facili da inquadrare da lontano.

     Il livello di correzione d'errore è sempre M: circa il quindici
     per cento del codice può essere rovinato o coperto e il telefono
     lo legge lo stesso.

     Per ogni versione: quanti byte di correzione per blocco, e come i
     dati si dividono in blocchi.
     ================================================================ */

  var VERSIONI = {
    1:  { correzione: 10, blocchi: [[1, 16]] },
    2:  { correzione: 16, blocchi: [[1, 28]] },
    3:  { correzione: 26, blocchi: [[1, 44]] },
    4:  { correzione: 18, blocchi: [[2, 32]] },
    5:  { correzione: 24, blocchi: [[2, 43]] },
    6:  { correzione: 16, blocchi: [[4, 27]] },
    7:  { correzione: 18, blocchi: [[4, 31]] },
    8:  { correzione: 22, blocchi: [[2, 38], [2, 39]] },
    9:  { correzione: 22, blocchi: [[3, 36], [2, 37]] },
    10: { correzione: 26, blocchi: [[4, 43], [1, 44]] }
  };

  /* Dove vanno i quadratini di allineamento, quelli piccoli che
     aiutano il telefono a raddrizzare l'immagine. */
  var ALLINEAMENTI = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  function byteDatiTotali(versione) {
    var b = VERSIONI[versione].blocchi;
    var t = 0;
    for (var i = 0; i < b.length; i++) t += b[i][0] * b[i][1];
    return t;
  }

  /* Il numero di caratteri si scrive con otto bit fino alla versione
     nove, con sedici dalla decima in poi. */
  function bitDelConteggio(versione) {
    return versione < 10 ? 8 : 16;
  }

  function quantiCaratteriCiStanno(versione) {
    return Math.floor((byteDatiTotali(versione) * 8 - 4 - bitDelConteggio(versione)) / 8);
  }

  /* ================================================================
     3. DAL TESTO AI BYTE
     ================================================================ */

  function inUtf8(testo) {
    var out = [];
    for (var i = 0; i < testo.length; i++) {
      var c = testo.charCodeAt(i);
      if (c < 0x80) {
        out.push(c);
      } else if (c < 0x800) {
        out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
      } else if (c >= 0xd800 && c < 0xdc00 && i + 1 < testo.length) {
        var basso = testo.charCodeAt(i + 1);
        var pieno = 0x10000 + ((c - 0xd800) << 10) + (basso - 0xdc00);
        i++;
        out.push(0xf0 | (pieno >> 18), 0x80 | ((pieno >> 12) & 0x3f),
                 0x80 | ((pieno >> 6) & 0x3f), 0x80 | (pieno & 0x3f));
      } else {
        out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return out;
  }

  function scegliVersione(quantiByte) {
    for (var v = 1; v <= 10; v++) {
      if (quantiByte <= quantiCaratteriCiStanno(v)) return v;
    }
    return 0;
  }

  /* Costruisce la sequenza di bit prevista dallo standard e la
     trasforma in byte. */
  function byteDelMessaggio(byteTesto, versione) {
    var bit = [];
    function aggiungi(valore, quanti) {
      for (var i = quanti - 1; i >= 0; i--) bit.push((valore >> i) & 1);
    }

    aggiungi(4, 4);                                   /* modo "byte" */
    aggiungi(byteTesto.length, bitDelConteggio(versione));
    for (var i = 0; i < byteTesto.length; i++) aggiungi(byteTesto[i], 8);

    var capienza = byteDatiTotali(versione) * 8;
    aggiungi(0, Math.min(4, capienza - bit.length));
    while (bit.length % 8 !== 0) bit.push(0);

    var byte = [];
    for (var j = 0; j < bit.length; j += 8) {
      var b = 0;
      for (var k = 0; k < 8; k++) b = (b << 1) | bit[j + k];
      byte.push(b);
    }

    /* Riempitivo previsto dallo standard: sempre questi due valori,
       alternati. */
    var riempitivi = [0xec, 0x11];
    var r = 0;
    while (byte.length < byteDatiTotali(versione)) {
      byte.push(riempitivi[r % 2]);
      r++;
    }
    return byte;
  }

  /* I dati si spezzano in blocchi, ogni blocco ha la sua correzione, e
     poi il tutto si mescola: così una macchia sul foglio rovina un
     pezzetto di ogni blocco, invece di distruggerne uno intero. */
  function mescola(byteDati, versione) {
    var info = VERSIONI[versione];
    var blocchiDati = [];
    var blocchiCorrezione = [];
    var p = 0;

    for (var g = 0; g < info.blocchi.length; g++) {
      var quanti = info.blocchi[g][0];
      var misura = info.blocchi[g][1];
      for (var n = 0; n < quanti; n++) {
        var pezzo = byteDati.slice(p, p + misura);
        p += misura;
        blocchiDati.push(pezzo);
        blocchiCorrezione.push(byteDiCorrezione(pezzo, info.correzione));
      }
    }

    var risultato = [];
    var massimo = 0;
    for (var i = 0; i < blocchiDati.length; i++) {
      if (blocchiDati[i].length > massimo) massimo = blocchiDati[i].length;
    }
    for (var c = 0; c < massimo; c++) {
      for (var b = 0; b < blocchiDati.length; b++) {
        if (c < blocchiDati[b].length) risultato.push(blocchiDati[b][c]);
      }
    }
    for (var e = 0; e < info.correzione; e++) {
      for (var b2 = 0; b2 < blocchiCorrezione.length; b2++) {
        risultato.push(blocchiCorrezione[b2][e]);
      }
    }
    return risultato;
  }

  /* ================================================================
     4. LA GRIGLIA

     Da qui in poi si lavora su una griglia di quadretti. "vero" vuol
     dire scuro. La griglia "fissa" tiene traccia dei quadretti che
     fanno parte della struttura, e che i dati non possono occupare.
     ================================================================ */

  function nuovaGriglia(misura) {
    var g = [];
    for (var r = 0; r < misura; r++) {
      g[r] = [];
      for (var c = 0; c < misura; c++) g[r][c] = false;
    }
    return g;
  }

  function disegnaMirino(m, fissa, r, c) {
    for (var dr = -4; dr <= 4; dr++) {
      for (var dc = -4; dc <= 4; dc++) {
        var distanza = Math.max(Math.abs(dr), Math.abs(dc));
        var rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < m.length && cc >= 0 && cc < m.length) {
          m[rr][cc] = (distanza !== 2 && distanza !== 4);
          fissa[rr][cc] = true;
        }
      }
    }
  }

  function disegnaAllineamento(m, fissa, r, c) {
    for (var dr = -2; dr <= 2; dr++) {
      for (var dc = -2; dc <= 2; dc++) {
        m[r + dr][c + dc] = (Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
        fissa[r + dr][c + dc] = true;
      }
    }
  }

  function bitDi(valore, posizione) {
    return ((valore >>> posizione) & 1) !== 0;
  }

  /* I quindici bit che dichiarano livello di correzione e maschera.
     Sono protetti da un loro codice a correzione d'errore. */
  function bitDelFormato(maschera) {
    var dati = (0 << 3) | maschera;          /* 0 = livello M */
    var resto = dati;
    for (var i = 0; i < 10; i++) {
      resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
    }
    return ((dati << 10) | resto) ^ 0x5412;
  }

  /* I diciotto bit che dichiarano la versione: servono dalla settima
     in su, prima la misura si capisce contando i quadretti. */
  function bitDellaVersione(versione) {
    var resto = versione;
    for (var i = 0; i < 12; i++) {
      resto = (resto << 1) ^ ((resto >>> 11) * 0x1f25);
    }
    return (versione << 12) | resto;
  }

  function scriviFormato(m, fissa, maschera) {
    var misura = m.length;
    var bit = bitDelFormato(maschera);
    var i;

    for (i = 0; i <= 5; i++) { m[i][8] = bitDi(bit, i); fissa[i][8] = true; }
    m[7][8] = bitDi(bit, 6);  fissa[7][8] = true;
    m[8][8] = bitDi(bit, 7);  fissa[8][8] = true;
    m[8][7] = bitDi(bit, 8);  fissa[8][7] = true;
    for (i = 9; i < 15; i++) { m[8][14 - i] = bitDi(bit, i); fissa[8][14 - i] = true; }

    for (i = 0; i < 8; i++) {
      m[8][misura - 1 - i] = bitDi(bit, i);
      fissa[8][misura - 1 - i] = true;
    }
    for (i = 8; i < 15; i++) {
      m[misura - 15 + i][8] = bitDi(bit, i);
      fissa[misura - 15 + i][8] = true;
    }
    m[misura - 8][8] = true;                 /* il quadretto sempre scuro */
    fissa[misura - 8][8] = true;
  }

  function costruisciStruttura(versione) {
    var misura = versione * 4 + 17;
    var m = nuovaGriglia(misura);
    var fissa = nuovaGriglia(misura);
    var i, j;

    /* Le due righe di quadretti alternati. Vanno disegnate prima dei
       mirini, che poi ci passano sopra. */
    for (i = 0; i < misura; i++) {
      m[6][i] = (i % 2 === 0); fissa[6][i] = true;
      m[i][6] = (i % 2 === 0); fissa[i][6] = true;
    }

    disegnaMirino(m, fissa, 3, 3);
    disegnaMirino(m, fissa, 3, misura - 4);
    disegnaMirino(m, fissa, misura - 4, 3);

    var posizioni = ALLINEAMENTI[versione];
    for (i = 0; i < posizioni.length; i++) {
      for (j = 0; j < posizioni.length; j++) {
        var sopraUnMirino = (i === 0 && j === 0) ||
                            (i === 0 && j === posizioni.length - 1) ||
                            (i === posizioni.length - 1 && j === 0);
        if (!sopraUnMirino) disegnaAllineamento(m, fissa, posizioni[i], posizioni[j]);
      }
    }

    /* Si scrive un formato provvisorio solo per marcare come occupati
       i quadretti che gli spettano. Quello vero arriva dopo, quando la
       maschera è stata scelta. */
    scriviFormato(m, fissa, 0);

    if (versione >= 7) {
      var bitV = bitDellaVersione(versione);
      for (i = 0; i < 18; i++) {
        var acceso = bitDi(bitV, i);
        var a = misura - 11 + (i % 3);
        var b = Math.floor(i / 3);
        m[b][a] = acceso; fissa[b][a] = true;
        m[a][b] = acceso; fissa[a][b] = true;
      }
    }

    return { griglia: m, fissa: fissa, misura: misura };
  }

  /* I dati si infilano a zigzag, in colonne larghe due, partendo dal
     basso a destra. */
  function scriviDati(m, fissa, byte) {
    var misura = m.length;
    var i = 0;
    for (var destra = misura - 1; destra >= 1; destra -= 2) {
      if (destra === 6) destra = 5;          /* la colonna 6 è riservata */
      for (var passo = 0; passo < misura; passo++) {
        for (var j = 0; j < 2; j++) {
          var c = destra - j;
          var versoAlto = ((destra + 1) & 2) === 0;
          var r = versoAlto ? misura - 1 - passo : passo;
          if (!fissa[r][c] && i < byte.length * 8) {
            m[r][c] = bitDi(byte[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  function applicaMaschera(m, fissa, maschera) {
    for (var r = 0; r < m.length; r++) {
      for (var c = 0; c < m.length; c++) {
        if (fissa[r][c]) continue;
        var gira;
        switch (maschera) {
          case 0: gira = (c + r) % 2 === 0; break;
          case 1: gira = r % 2 === 0; break;
          case 2: gira = c % 3 === 0; break;
          case 3: gira = (c + r) % 3 === 0; break;
          case 4: gira = (Math.floor(c / 3) + Math.floor(r / 2)) % 2 === 0; break;
          case 5: gira = ((c * r) % 2) + ((c * r) % 3) === 0; break;
          case 6: gira = (((c * r) % 2) + ((c * r) % 3)) % 2 === 0; break;
          default: gira = (((c + r) % 2) + ((c * r) % 3)) % 2 === 0; break;
        }
        if (gira) m[r][c] = !m[r][c];
      }
    }
  }

  /* Lo standard prevede otto maschere e un modo per dare un voto a
     ciascuna: vince quella che rende il disegno più facile da
     leggere. */
  var SEQUENZA_A = [true, false, true, true, true, false, true, false, false, false, false];
  var SEQUENZA_B = [false, false, false, false, true, false, true, true, true, false, true];

  function quanteVolte(leggi, lunghezza, sequenza) {
    var n = 0;
    for (var s = 0; s + sequenza.length <= lunghezza; s++) {
      var uguale = true;
      for (var k = 0; k < sequenza.length; k++) {
        if (leggi(s + k) !== sequenza[k]) { uguale = false; break; }
      }
      if (uguale) n++;
    }
    return n;
  }

  function votoMaschera(m) {
    var misura = m.length;
    var punti = 0;
    var r, c, fila;

    for (r = 0; r < misura; r++) {
      fila = 1;
      for (c = 1; c < misura; c++) {
        if (m[r][c] === m[r][c - 1]) {
          fila++;
          if (fila === 5) punti += 3; else if (fila > 5) punti += 1;
        } else fila = 1;
      }
    }
    for (c = 0; c < misura; c++) {
      fila = 1;
      for (r = 1; r < misura; r++) {
        if (m[r][c] === m[r - 1][c]) {
          fila++;
          if (fila === 5) punti += 3; else if (fila > 5) punti += 1;
        } else fila = 1;
      }
    }

    for (r = 0; r < misura - 1; r++) {
      for (c = 0; c < misura - 1; c++) {
        if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) {
          punti += 3;
        }
      }
    }

    for (r = 0; r < misura; r++) {
      punti += 40 * (quanteVolte(leggiRiga(m, r), misura, SEQUENZA_A) +
                     quanteVolte(leggiRiga(m, r), misura, SEQUENZA_B));
    }
    for (c = 0; c < misura; c++) {
      punti += 40 * (quanteVolte(leggiColonna(m, c), misura, SEQUENZA_A) +
                     quanteVolte(leggiColonna(m, c), misura, SEQUENZA_B));
    }

    var scuri = 0;
    for (r = 0; r < misura; r++) {
      for (c = 0; c < misura; c++) if (m[r][c]) scuri++;
    }
    var totale = misura * misura;
    punti += Math.floor(Math.abs(scuri * 20 - totale * 10) / totale) * 10;

    return punti;
  }

  function leggiRiga(m, r) {
    return function (i) { return m[r][i]; };
  }

  function leggiColonna(m, c) {
    return function (i) { return m[i][c]; };
  }

  function copia(m) {
    var out = [];
    for (var r = 0; r < m.length; r++) out.push(m[r].slice());
    return out;
  }

  /* ================================================================
     5. QUELLO CHE SI USA DA FUORI
     ================================================================ */

  /* Restituisce la griglia di quadretti: un elenco di righe, dove
     "vero" vuol dire scuro. Restituisce null se il testo è troppo
     lungo. */
  function matrice(testo) {
    var byteTesto = inUtf8(String(testo));
    var versione = scegliVersione(byteTesto.length);
    if (versione === 0) return null;

    var byte = mescola(byteDelMessaggio(byteTesto, versione), versione);
    var base = costruisciStruttura(versione);

    var migliore = null;
    var votoMigliore = Infinity;
    for (var maschera = 0; maschera < 8; maschera++) {
      var prova = copia(base.griglia);
      scriviDati(prova, base.fissa, byte);
      applicaMaschera(prova, base.fissa, maschera);
      scriviFormato(prova, base.fissa, maschera);
      var voto = votoMaschera(prova);
      if (voto < votoMigliore) { votoMigliore = voto; migliore = prova; }
    }
    return migliore;
  }

  function svg(testo, opzioni) {
    opzioni = opzioni || {};
    var bordo = typeof opzioni.bordo === "number" ? opzioni.bordo : 4;
    var titolo = opzioni.titolo || "Codice QR";

    var m = matrice(testo);
    if (!m) return "";

    var misura = m.length;
    var lato = misura + bordo * 2;
    var tratti = [];
    for (var r = 0; r < misura; r++) {
      for (var c = 0; c < misura; c++) {
        if (m[r][c]) tratti.push("M" + (c + bordo) + "," + (r + bordo) + "h1v1h-1z");
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + lato + ' ' + lato +
           '" role="img" aria-label="' + String(titolo).replace(/"/g, "&quot;") + '" ' +
           'style="display:block;width:100%;height:auto">' +
           '<rect width="' + lato + '" height="' + lato + '" fill="#ffffff"/>' +
           '<path d="' + tratti.join("") + '" fill="#000000"/>' +
           '</svg>';
  }

  return {
    svg: svg,
    matrice: matrice
  };
})();
