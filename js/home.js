/* ==================================================================
   LA PAGINA INIZIALE DEL SITO

   Legge il registro artefatti.txt e costruisce la pagina da lì.
   Per cambiare quello che si vede sul sito si modifica il registro,
   non questo file.
   ================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     LE DUE PAROLE D'ORDINE

     Cambiale scrivendo quello che vuoi fra le virgolette, qui sotto.

     ATTENZIONE, e' importante che sia chiaro: queste parole NON
     proteggono niente. Il sito e' pubblico e questo file e' leggibile
     da chiunque, quindi chiunque puo' trovarle in pochi secondi.
     Servono soltanto a tenere separati i due pubblici, perche' uno
     studente non finisca per sbaglio fra gli strumenti dei docenti.

     Non mettere mai dietro queste parole qualcosa di riservato.
     ------------------------------------------------------------------ */

  var PAROLA_STUDENTI = "studente";
  var PAROLA_DOCENTI = "docente";


  /* ------------------------------------------------------------------
     LETTURA DEL REGISTRO
     ------------------------------------------------------------------ */

  /* Un campo vale "DA COMPILARE" quando chi costruisce l'artefatto non
     lo ha ancora riempito. Confrontiamo senza spazi ne' trattini, cosi'
     valgono sia "DA COMPILARE" sia "italiano-DACOMPILARE". */
  function daCompilare(valore) {
    var pulito = (valore || "").toUpperCase().replace(/[^A-Z]/g, "");
    return pulito.indexOf("DACOMPILARE") > -1;
  }

  function testoCommento(riga) {
    return riga.charAt(0) === "#" ? riga.slice(1).trim() : null;
  }

  /* Un nome di disciplina e' una riga breve, con delle lettere e senza
     punteggiatura da frase: serve a distinguerlo dalle spiegazioni,
     che nel registro sono scritte anche loro come commenti. */
  function sembraNomeDisciplina(testo) {
    if (!testo || testo.length > 60) { return false; }
    if (!/[A-Za-zÀ-ÿ]/.test(testo)) { return false; }
    return !/[.,:;|]/.test(testo);
  }

  function trovaRiga(righe, espressione) {
    for (var i = 0; i < righe.length; i += 1) {
      if (espressione.test(righe[i])) { return i; }
    }
    return -1;
  }

  /* L'elenco delle discipline sta dentro i commenti in fondo al
     registro. Se ci sono le righe di marcatura usiamo quelle, che sono
     esatte; altrimenti cerchiamo la sequenza di nomi piu' lunga dopo il
     titolo "ELENCO DELLE DISCIPLINE". */
  function leggiDiscipline(testo) {
    var righe = testo.split(/\r?\n/).map(function (riga) {
      return riga.trim();
    });

    var inizio = trovaRiga(righe, /^#\s*INIZIO\s+ELENCO\s+DISCIPLINE/i);
    var fine = trovaRiga(righe, /^#\s*FINE\s+ELENCO\s+DISCIPLINE/i);

    if (inizio > -1 && fine > inizio) {
      return righe.slice(inizio + 1, fine)
        .map(testoCommento)
        .filter(function (nome) {
          return nome && /[A-Za-zÀ-ÿ]/.test(nome);
        });
    }

    var titolo = trovaRiga(righe, /^#.*ELENCO\s+DELLE\s+DISCIPLINE/i);
    if (titolo === -1) { return []; }

    var sequenze = [];
    var corrente = [];

    for (var i = titolo + 1; i < righe.length; i += 1) {
      var contenuto = testoCommento(righe[i]);
      if (contenuto !== null && sembraNomeDisciplina(contenuto)) {
        corrente.push(contenuto);
      } else {
        if (corrente.length) { sequenze.push(corrente); }
        corrente = [];
      }
    }
    if (corrente.length) { sequenze.push(corrente); }

    var migliore = [];
    sequenze.forEach(function (sequenza) {
      if (sequenza.length > migliore.length) { migliore = sequenza; }
    });

    return migliore.length >= 3 ? migliore : [];
  }

  /* Ogni riga valida ha cinque campi separati dalla barra verticale.
     Le righe scritte male non bloccano il sito: vengono saltate e
     segnalate in fondo alla pagina. */
  function leggiArtefatti(testo, discipline) {
    var artefatti = [];
    var problemi = [];

    testo.split(/\r?\n/).forEach(function (riga, indice) {
      var numero = indice + 1;
      var pulita = riga.trim();

      if (pulita === "" || pulita.charAt(0) === "#") { return; }

      var campi = pulita.split("|").map(function (campo) {
        return campo.trim();
      });

      if (campi.length !== 5) {
        problemi.push({
          numero: numero,
          testo: pulita,
          motivo: "servono cinque campi separati dalla barra verticale, "
            + "qui ne ho contati " + campi.length
        });
        return;
      }

      var destinatario = campi[2].toLowerCase();
      if (["studenti", "docenti", "entrambi"].indexOf(destinatario) === -1) {
        problemi.push({
          numero: numero,
          testo: pulita,
          motivo: "il terzo campo deve essere studenti, docenti o entrambi, "
            + "invece c'è scritto \"" + campi[2] + "\""
        });
        return;
      }

      var disciplina = campi[1];
      if (disciplina !== "" && discipline.indexOf(disciplina) === -1) {
        problemi.push({
          numero: numero,
          testo: pulita,
          motivo: "la disciplina \"" + disciplina + "\" non compare "
            + "nell'elenco in fondo al registro: il nome deve "
            + "corrispondere esattamente"
        });
        return;
      }

      artefatti.push({
        titolo: campi[0],
        disciplina: disciplina,
        destinatario: destinatario,
        cartella: campi[3],
        descrizione: campi[4],
        pronto: !daCompilare(campi[0]) && !daCompilare(campi[3])
      });
    });

    return { artefatti: artefatti, problemi: problemi };
  }


  /* ------------------------------------------------------------------
     COSTRUZIONE DELLA PAGINA
     ------------------------------------------------------------------ */

  function per(destinatario, artefatti) {
    return artefatti.filter(function (artefatto) {
      return artefatto.destinatario === destinatario
        || artefatto.destinatario === "entrambi";
    });
  }

  function vocePerArtefatto(artefatto) {
    var voce = document.createElement("li");

    if (artefatto.pronto) {
      var collegamento = document.createElement("a");
      collegamento.className = "artefatto-titolo";
      collegamento.href = artefatto.cartella.replace(/\/*$/, "") + "/";
      collegamento.textContent = artefatto.titolo;
      voce.appendChild(collegamento);
    } else {
      /* Non è ancora apribile, ma se il titolo c'è lo mostriamo lo
         stesso: chi guarda il sito sa già cosa sta arrivando. */
      var titolo = document.createElement("span");
      titolo.className = "artefatto-titolo";
      titolo.textContent = daCompilare(artefatto.titolo)
        ? "Artefatto in preparazione"
        : artefatto.titolo;
      voce.appendChild(titolo);

      var stato = document.createElement("span");
      stato.className = "artefatto-stato";
      stato.textContent = "— non ancora consegnato";
      voce.appendChild(stato);
    }

    if (artefatto.descrizione && !daCompilare(artefatto.descrizione)) {
      var descrizione = document.createElement("p");
      descrizione.className = "artefatto-descrizione";
      descrizione.textContent = artefatto.descrizione;
      voce.appendChild(descrizione);
    }

    return voce;
  }

  function schedaDisciplina(nome, artefatti, identificativo, inRilievo) {
    var scheda = document.createElement("article");
    scheda.className = inRilievo ? "disciplina rilievo" : "disciplina";

    /* Nessun artefatto: la disciplina compare comunque, spenta. */
    if (artefatti.length === 0) {
      scheda.className += " spenta";
      var spento = document.createElement("div");
      spento.className = "disciplina-spenta-testo";

      var nomeSpento = document.createElement("span");
      nomeSpento.className = "disciplina-nome";
      nomeSpento.textContent = nome;
      spento.appendChild(nomeSpento);

      var statoSpento = document.createElement("span");
      statoSpento.className = "disciplina-stato";
      statoSpento.textContent = "in costruzione";
      spento.appendChild(statoSpento);

      scheda.appendChild(spento);
      return scheda;
    }

    var testata = document.createElement("button");
    testata.className = "disciplina-testata";
    testata.type = "button";
    testata.setAttribute("aria-expanded", "false");
    testata.setAttribute("aria-controls", identificativo);

    var nomeAttivo = document.createElement("span");
    nomeAttivo.className = "disciplina-nome";
    nomeAttivo.textContent = nome;
    testata.appendChild(nomeAttivo);

    var pronti = artefatti.filter(function (artefatto) {
      return artefatto.pronto;
    }).length;

    var stato = document.createElement("span");
    stato.className = "disciplina-stato";
    if (pronti === 0) {
      stato.textContent = artefatti.length === 1
        ? "1 artefatto in preparazione"
        : artefatti.length + " artefatti in preparazione";
    } else {
      stato.textContent = pronti === 1
        ? "1 artefatto disponibile"
        : pronti + " artefatti disponibili";
    }
    testata.appendChild(stato);

    var elenco = document.createElement("ul");
    elenco.className = "elenco-artefatti";
    elenco.id = identificativo;
    elenco.hidden = true;
    artefatti.forEach(function (artefatto) {
      elenco.appendChild(vocePerArtefatto(artefatto));
    });

    testata.addEventListener("click", function () {
      var aperto = !elenco.hidden;
      elenco.hidden = aperto;
      testata.setAttribute("aria-expanded", String(!aperto));
    });

    scheda.appendChild(testata);
    scheda.appendChild(elenco);
    return scheda;
  }

  /* Le due sezioni, studenti e docenti, sono costruite allo stesso
     modo: tutte le discipline dell'elenco, quelle con almeno un
     artefatto si aprono, le altre restano spente.
     Il prefisso serve a non dare lo stesso nome a due riquadri
     diversi, uno per sezione. */
  function costruisciSezione(prefisso, discipline, artefatti) {
    var contenitore = document.getElementById("discipline-" + prefisso);
    var riassunto = document.getElementById("riassunto-" + prefisso);
    var suoi = per(prefisso, artefatti);

    /* Gli strumenti che non appartengono a nessuna disciplina hanno il
       secondo campo vuoto. Stanno in un riquadro a parte, messo per
       primo e in evidenza perché valgono per tutti, e non solo per chi
       insegna una certa materia. Compare solo se ce n'è almeno uno. */
    var senzaDisciplina = suoi.filter(function (artefatto) {
      return artefatto.disciplina === "";
    });
    if (senzaDisciplina.length > 0) {
      contenitore.appendChild(
        schedaDisciplina(
          "Strumenti generali",
          senzaDisciplina,
          prefisso + "-strumenti-generali",
          true
        )
      );
    }

    discipline.forEach(function (nome, indice) {
      var della = suoi.filter(function (artefatto) {
        return artefatto.disciplina === nome;
      });
      contenitore.appendChild(
        schedaDisciplina(nome, della, prefisso + "-disciplina-" + indice)
      );
    });

    var disponibili = suoi.filter(function (artefatto) {
      return artefatto.pronto;
    }).length;

    riassunto.textContent = discipline.length + " discipline, "
      + (disponibili === 1
        ? "1 artefatto già disponibile."
        : disponibili + " artefatti già disponibili.");
  }

  function mostraSegnalazioni(problemi) {
    if (problemi.length === 0) { return; }

    var sezione = document.getElementById("segnalazioni");
    var elenco = document.getElementById("elenco-segnalazioni");

    problemi.forEach(function (problema) {
      var voce = document.createElement("li");

      var intestazione = document.createElement("strong");
      intestazione.textContent = problema.numero > 0
        ? "Riga " + problema.numero + ": "
        : "Registro: ";
      voce.appendChild(intestazione);

      voce.appendChild(document.createTextNode(problema.motivo));

      var riga = document.createElement("p");
      riga.className = "artefatto-descrizione";
      riga.textContent = problema.testo;
      voce.appendChild(riga);

      elenco.appendChild(voce);
    });

    sezione.hidden = false;
  }


  /* ------------------------------------------------------------------
     ACCESSO ALLA SEZIONE DOCENTI
     ------------------------------------------------------------------ */

  /* Una sezione gia' aperta resta aperta finche' la finestra del
     browser non viene chiusa: cosi' tornando indietro da un artefatto
     non si deve riscrivere la parola. */
  function ricorda(prefisso) {
    try {
      window.sessionStorage.setItem(prefisso + "-aperta", "si");
    } catch (errore) {
      /* Se il browser non lo permette pazienza: si riscrive la parola. */
    }
  }

  function giaAperta(prefisso) {
    try {
      return window.sessionStorage.getItem(prefisso + "-aperta") === "si";
    } catch (errore) {
      return false;
    }
  }

  function apriArea(prefisso) {
    document.getElementById("accesso-" + prefisso).hidden = true;
    document.getElementById("area-" + prefisso).hidden = false;
  }

  function preparaAccesso(prefisso, parola) {
    var modulo = document.getElementById("modulo-" + prefisso);
    var campo = document.getElementById("parola-" + prefisso);
    var errore = document.getElementById("errore-" + prefisso);

    modulo.addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (campo.value.trim() === parola) {
        errore.textContent = "";
        ricorda(prefisso);
        apriArea(prefisso);
      } else {
        errore.textContent = "Parola d'ordine non corretta.";
        campo.value = "";
        campo.focus();
      }
    });

    if (giaAperta(prefisso)) { apriArea(prefisso); }
  }


  /* ------------------------------------------------------------------
     AVVIO
     ------------------------------------------------------------------ */

  /* L'orario nella richiesta costringe il browser a riscaricare davvero
     il registro, invece di mostrare una copia vecchia. */
  function prendiFile(percorso) {
    return fetch(percorso + "?aggiornato=" + Date.now(), { cache: "no-store" })
      .then(function (risposta) {
        if (!risposta.ok) {
          throw new Error("File non trovato: " + percorso);
        }
        return risposta.text();
      });
  }

  prendiFile("artefatti.txt").then(function (testo) {
    var discipline = leggiDiscipline(testo);
    var lettura = leggiArtefatti(testo, discipline);

    if (discipline.length === 0) {
      lettura.problemi.unshift({
        numero: 0,
        testo: "(elenco delle discipline)",
        motivo: "non sono riuscito a trovare l'elenco delle discipline in "
          + "fondo al registro"
      });
    }

    costruisciSezione("studenti", discipline, lettura.artefatti);
    costruisciSezione("docenti", discipline, lettura.artefatti);
    mostraSegnalazioni(lettura.problemi);
    preparaAccesso("studenti", PAROLA_STUDENTI);
    preparaAccesso("docenti", PAROLA_DOCENTI);
  }).catch(function (errore) {
    var sezione = document.getElementById("segnalazioni");
    var elenco = document.getElementById("elenco-segnalazioni");
    var voce = document.createElement("li");
    voce.textContent = "Il registro artefatti.txt non è stato caricato. "
      + "Se hai aperto la pagina con un doppio clic è normale: usa "
      + "anteprima.bat oppure il sito pubblicato. (" + errore.message + ")";
    elenco.appendChild(voce);
    sezione.hidden = false;
  });

}());
