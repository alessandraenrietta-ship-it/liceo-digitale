/* ------------------------------------------------------------
   Questo file prende i testi dalla cartella "contenuti"
   e li mette dentro la pagina.

   Se vuoi cambiare quello che si legge sul sito, NON serve
   toccare questo file: apri contenuti/home.txt oppure
   contenuti/artefatti.txt.
   ------------------------------------------------------------ */

(function () {
  "use strict";

  /* Le parole in maiuscolo che il sito riconosce nei file di testo. */
  var CAMPI_HOME = ["TITOLO", "SOTTOTITOLO", "PRESENTAZIONE", "PIEDE"];
  var CAMPI_ARTEFATTO = ["TITOLO", "DISCIPLINA", "CARTELLA", "DESCRIZIONE"];

  /* --------------------------------------------------------
     Legge un testo come "ETICHETTA: contenuto".
     Le righe che iniziano con # sono note e vengono ignorate.
     -------------------------------------------------------- */
  function leggiCampi(testo, etichetteAmmesse) {
    var campi = {};
    var etichettaCorrente = null;

    testo.split(/\r?\n/).forEach(function (riga) {
      if (riga.trim().charAt(0) === "#") {
        return;
      }

      var duePunti = riga.indexOf(":");
      var possibileEtichetta = duePunti > -1
        ? riga.slice(0, duePunti).trim().toUpperCase()
        : null;

      if (possibileEtichetta && etichetteAmmesse.indexOf(possibileEtichetta) > -1) {
        etichettaCorrente = possibileEtichetta;
        campi[etichettaCorrente] = riga.slice(duePunti + 1).trim();
      } else if (etichettaCorrente) {
        campi[etichettaCorrente] += "\n" + riga;
      }
    });

    Object.keys(campi).forEach(function (chiave) {
      campi[chiave] = campi[chiave].trim();
    });

    return campi;
  }

  /* Scrive un testo dentro un elemento, un paragrafo per ogni
     riga vuota lasciata nel file. */
  function scriviParagrafi(elemento, testo) {
    elemento.textContent = "";
    if (!testo) {
      return;
    }
    testo.split(/\n\s*\n/).forEach(function (pezzo) {
      if (pezzo.trim() === "") {
        return;
      }
      var p = document.createElement("p");
      p.textContent = pezzo.trim();
      elemento.appendChild(p);
    });
  }

  function mostraAvviso(elemento, righe) {
    var box = document.createElement("div");
    box.className = "avviso";
    righe.forEach(function (riga) {
      var p = document.createElement("p");
      p.textContent = riga;
      box.appendChild(p);
    });
    elemento.textContent = "";
    elemento.appendChild(box);
  }

  /* -------------------------------------------------------- */

  function costruisciHome(testo) {
    var campi = leggiCampi(testo, CAMPI_HOME);

    if (campi.TITOLO) {
      document.getElementById("titolo").textContent = campi.TITOLO;
      document.title = campi.TITOLO;
    }
    if (campi.SOTTOTITOLO) {
      document.getElementById("sottotitolo").textContent = campi.SOTTOTITOLO;
    }
    scriviParagrafi(document.getElementById("presentazione"), campi.PRESENTAZIONE);
    if (campi.PIEDE) {
      document.getElementById("piede").textContent = campi.PIEDE;
    }
  }

  function costruisciArtefatti(testo) {
    var elenco = document.getElementById("elenco-artefatti");
    elenco.textContent = "";

    var blocchi = testo.split(/^\s*---\s*$/m);
    var quanti = 0;

    blocchi.forEach(function (blocco) {
      var campi = leggiCampi(blocco, CAMPI_ARTEFATTO);
      if (!campi.TITOLO || !campi.CARTELLA) {
        return;
      }
      quanti += 1;

      var scheda = document.createElement("a");
      scheda.className = "scheda";
      scheda.href = campi.CARTELLA.replace(/\/*$/, "") + "/";

      if (campi.DISCIPLINA) {
        var disciplina = document.createElement("span");
        disciplina.className = "disciplina";
        disciplina.textContent = campi.DISCIPLINA;
        scheda.appendChild(disciplina);
      }

      var titolo = document.createElement("h3");
      titolo.textContent = campi.TITOLO;
      scheda.appendChild(titolo);

      if (campi.DESCRIZIONE) {
        var descrizione = document.createElement("p");
        descrizione.textContent = campi.DESCRIZIONE;
        scheda.appendChild(descrizione);
      }

      elenco.appendChild(scheda);
    });

    if (quanti === 0) {
      mostraAvviso(elenco, [
        "Non c'è ancora nessun artefatto.",
        "Per aggiungerne uno, apri il file contenuti/artefatti.txt: dentro trovi le istruzioni e un esempio già pronto da copiare."
      ]);
    }
  }

  /* -------------------------------------------------------- */

  function prendiFile(percorso) {
    return fetch(percorso).then(function (risposta) {
      if (!risposta.ok) {
        throw new Error("File non trovato: " + percorso);
      }
      return risposta.text();
    });
  }

  Promise.all([
    prendiFile("contenuti/home.txt"),
    prendiFile("contenuti/artefatti.txt")
  ]).then(function (testi) {
    costruisciHome(testi[0]);
    costruisciArtefatti(testi[1]);
  }).catch(function (errore) {
    document.getElementById("titolo").textContent = "Liceo digitale";
    mostraAvviso(document.getElementById("presentazione"), [
      "I testi della pagina non sono stati caricati.",
      "Se hai aperto questo file con un doppio clic dal tuo computer, è normale: per motivi di sicurezza il browser non lascia leggere i file della cartella. La pagina funziona correttamente una volta pubblicata su GitHub Pages.",
      "Dettaglio tecnico: " + errore.message
    ]);
  });

}());
