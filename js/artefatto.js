/* ------------------------------------------------------------
   Fa funzionare la pagina di un artefatto: prende i testi dal
   file testi.txt che sta nella stessa cartella e costruisce la
   linea del tempo.

   Per cambiare i contenuti non serve toccare questo file:
   si modifica testi.txt.
   ------------------------------------------------------------ */

(function () {
  "use strict";

  var CAMPI_PAGINA = ["TITOLO", "SOTTOTITOLO", "INTRODUZIONE", "PIEDE"];
  var CAMPI_EVENTO = ["ANNO", "EVENTO", "RACCONTO"];

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
      p.textContent = pezzo.trim().replace(/\s*\n\s*/g, " ");
      elemento.appendChild(p);
    });
  }

  function costruisciPagina(campi) {
    if (campi.TITOLO) {
      document.getElementById("titolo").textContent = campi.TITOLO;
      document.title = campi.TITOLO;
    }
    if (campi.SOTTOTITOLO) {
      document.getElementById("sottotitolo").textContent = campi.SOTTOTITOLO;
    }
    scriviParagrafi(document.getElementById("introduzione"), campi.INTRODUZIONE);
    if (campi.PIEDE) {
      document.getElementById("piede").textContent = campi.PIEDE;
    }
  }

  function costruisciEvento(campi) {
    var evento = document.createElement("article");
    evento.className = "evento";

    var bottone = document.createElement("button");
    bottone.className = "evento-testata";
    bottone.type = "button";
    bottone.setAttribute("aria-expanded", "false");

    var anno = document.createElement("span");
    anno.className = "evento-anno";
    anno.textContent = campi.ANNO || "";
    bottone.appendChild(anno);

    var nome = document.createElement("span");
    nome.className = "evento-nome";
    nome.textContent = campi.EVENTO;
    bottone.appendChild(nome);

    var racconto = document.createElement("div");
    racconto.className = "evento-racconto";
    racconto.hidden = true;
    scriviParagrafi(racconto, campi.RACCONTO);

    bottone.addEventListener("click", function () {
      var aperto = !racconto.hidden;
      racconto.hidden = aperto;
      bottone.setAttribute("aria-expanded", String(!aperto));
      evento.classList.toggle("aperto", !aperto);
    });

    evento.appendChild(bottone);
    evento.appendChild(racconto);
    return evento;
  }

  function costruisciEventi(testo) {
    var contenitore = document.getElementById("eventi");
    contenitore.textContent = "";

    var blocchi = testo.split(/^\s*---\s*$/m);
    var quanti = 0;

    blocchi.forEach(function (blocco) {
      var campi = leggiCampi(blocco, CAMPI_EVENTO);
      if (!campi.EVENTO) {
        return;
      }
      quanti += 1;
      contenitore.appendChild(costruisciEvento(campi));
    });

    if (quanti === 0) {
      var avviso = document.createElement("div");
      avviso.className = "avviso";
      var p = document.createElement("p");
      p.textContent = "Non c'è ancora nessun evento nella linea del tempo.";
      avviso.appendChild(p);
      contenitore.appendChild(avviso);
    }
  }

  /* Come per la pagina principale: aggiungiamo l'orario alla
     richiesta, così il browser riscarica davvero i testi. */
  function prendiFile(percorso) {
    var richiesta = percorso + "?aggiornato=" + Date.now();
    return fetch(richiesta, { cache: "no-store" }).then(function (risposta) {
      if (!risposta.ok) {
        throw new Error("File non trovato: " + percorso);
      }
      return risposta.text();
    });
  }

  prendiFile("testi.txt").then(function (testo) {
    /* Tutto quello che sta prima della prima riga di trattini
       riguarda la pagina; da lì in poi cominciano gli eventi. */
    var testata = testo.split(/^\s*---\s*$/m)[0];
    costruisciPagina(leggiCampi(testata, CAMPI_PAGINA));
    costruisciEventi(testo);
  }).catch(function (errore) {
    var avviso = document.createElement("div");
    avviso.className = "avviso";
    [
      "I testi di questa pagina non sono stati caricati.",
      "Se hai aperto il file con un doppio clic, è normale: il browser non lascia leggere i file della cartella. Usa l'anteprima locale oppure guarda la pagina pubblicata.",
      "Dettaglio tecnico: " + errore.message
    ].forEach(function (riga) {
      var p = document.createElement("p");
      p.textContent = riga;
      avviso.appendChild(p);
    });
    document.getElementById("introduzione").appendChild(avviso);
  });

}());
