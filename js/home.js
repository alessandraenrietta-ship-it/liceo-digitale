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

     ATTENZIONE, è importante che sia chiaro: queste parole NON
     proteggono niente. Il sito è pubblico e questo file è leggibile
     da chiunque, quindi chiunque può trovarle in pochi secondi.
     Servono soltanto a tenere separati i due pubblici, perché uno
     studente non finisca per sbaglio fra gli strumenti dei docenti.

     Non mettere mai dietro queste parole qualcosa di riservato.
     ------------------------------------------------------------------ */

  var PAROLA_STUDENTI = "studente";
  var PAROLA_DOCENTI = "docente";


  /* ------------------------------------------------------------------
     LETTURA DEL REGISTRO
     ------------------------------------------------------------------ */

  /* Un campo vale "DA COMPILARE" quando chi costruisce l'artefatto non
     lo ha ancora riempito. Confrontiamo senza spazi né trattini, così
     valgono sia "DA COMPILARE" sia "italiano-DACOMPILARE". */
  function daCompilare(valore) {
    var pulito = (valore || "").toUpperCase().replace(/[^A-Z]/g, "");
    return pulito.indexOf("DACOMPILARE") > -1;
  }

  function testoCommento(riga) {
    return riga.charAt(0) === "#" ? riga.slice(1).trim() : null;
  }

  /* Un nome di disciplina è una riga breve, con delle lettere e senza
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
     esatte; altrimenti cerchiamo la sequenza di nomi più lunga dopo il
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

  function vocePerArtefatto(artefatto, inRilievo) {
    var voce = document.createElement("li");

    /* Segna le voci pronte da aprire: negli Strumenti generali, dove
       ogni strumento ha il suo riquadro, ricevono la stessa striscia
       laterale delle discipline con un artefatto pronto. */
    if (artefatto.pronto) {
      voce.className = "pronto";
    }

    /* Negli Strumenti generali una riga ancora tutta da compilare, senza
       nemmeno il titolo, è un posto riservato per uno strumento che
       arriverà: si mostra come un riquadro tratteggiato "in
       costruzione", con lo stesso aspetto delle discipline vuote. */
    if (inRilievo && !artefatto.pronto && daCompilare(artefatto.titolo)) {
      voce.className = "in-costruzione";
      var segnaposto = document.createElement("span");
      segnaposto.className = "solo-lettori";
      segnaposto.textContent = "Posto per uno strumento in costruzione";
      voce.appendChild(segnaposto);
      return voce;
    }

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
      stato.className = "solo-lettori";
      stato.textContent = ": non ancora consegnato";
      voce.appendChild(stato);
    }

    /* La descrizione non si stampa più sotto al titolo: riempiva la
       pagina di righe che nessuno legge due volte. Resta nel registro e
       compare come suggerimento, passandoci sopra col mouse, e per chi
       si fa leggere la pagina. */
    if (artefatto.descrizione && !daCompilare(artefatto.descrizione)) {
      var primo = voce.firstChild;
      if (primo) {
        primo.title = artefatto.descrizione;
        primo.setAttribute("aria-label", artefatto.titolo + ". " + artefatto.descrizione);
      }
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

      /* La scritta "in costruzione" non si stampa: il riquadro
         tratteggiato e piu' piccolo lo dice gia'. Resta per chi si fa
         leggere la pagina, in una scritta che non si vede. */
      var statoSpento = document.createElement("span");
      statoSpento.className = "solo-lettori";
      statoSpento.textContent = ": in costruzione";
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

    /* Una disciplina con almeno un artefatto pronto da aprire ha la
       striscia laterale, così si distingue al volo da quelle dove c'è
       solo qualcosa in preparazione. La scritta "disponibile" resta
       comunque: il colore da solo non basta a chi non lo distingue. */
    /* Gli Strumenti generali restano esclusi: sono un riquadro largo e
       col titolo centrato, e la fascia su un lato lo farebbe sembrare
       storto. Si riconoscono già perché stanno in cima. */
    if (pronti > 0 && !inRilievo) {
      scheda.className += " con-artefatto";
    }

    /* Sotto al nome non si scrive più niente: i titoli comparivano due
       volte, qui e dentro la scheda aperta, e la pagina risultava
       affollata. Bastano i riquadri che si aprono.
       La stessa informazione resta però scritta per chi non vede lo
       schermo e si fa leggere la pagina: sta nell'etichetta del
       pulsante, che non si vede ma si sente. */
    testata.setAttribute("aria-label", nome + ": " + (pronti === 0
      ? "in preparazione"
      : (pronti === 1 ? "1 strumento pronto" : pronti + " strumenti pronti")));

    var elenco = document.createElement("ul");
    elenco.className = "elenco-artefatti";
    elenco.id = identificativo;
    elenco.hidden = true;
    artefatti.forEach(function (artefatto) {
      elenco.appendChild(vocePerArtefatto(artefatto, inRilievo));
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
  /* L'ordine delle discipline.
     Di suo il sito mette per prime quelle che hanno più strumenti
     pronti e per ultime quelle ancora in costruzione: così quello che
     si può usare subito sta in alto. Chi preferisce l'ordine
     alfabetico lo sceglie dal menù, e la scelta resta su questo
     computer. */
  function contaPronti(nome, suoi) {
    return suoi.filter(function (a) {
      return a.disciplina === nome && a.pronto;
    }).length;
  }

  function contaTutti(nome, suoi) {
    return suoi.filter(function (a) { return a.disciplina === nome; }).length;
  }

  /* L'ordine con cui compaiono le discipline. Per cambiarlo si scrive
     "alfabetico" al posto di "strumenti" qui sotto: non serve altro.
       strumenti  = prima quelle con piu' strumenti pronti, in fondo
                    quelle ancora in costruzione
       alfabetico = dalla A alla Z */
  var ORDINE = "strumenti";

  /* L'ordine deciso a mano, trascinando le caselle. Vale solo sul
     computer di chi lo fa: è una comodità personale, non una modifica
     al sito. Si salva l'elenco dei nomi, non i numeri: così aggiungere
     o togliere una disciplina dal registro non scombina niente. */
  function ordinePersonale(prefisso) {
    try {
      var salvato = JSON.parse(localStorage.getItem(prefisso + "-mie-discipline"));
      return Array.isArray(salvato) ? salvato : null;
    } catch (errore) {
      return null;
    }
  }

  function salvaOrdinePersonale(prefisso, nomi) {
    try {
      localStorage.setItem(prefisso + "-mie-discipline", JSON.stringify(nomi));
    } catch (errore) {
      /* pazienza: vale solo per questa visita */
    }
  }

  function ordinaDiscipline(discipline, suoi, criterio, prefisso) {
    var copia = discipline.slice();

    /* Se c'è un ordine deciso a mano, comanda quello. Le discipline che
       non erano ancora nell'elenco (aggiunte dopo) finiscono in coda,
       nell'ordine automatico. */
    var mio = prefisso ? ordinePersonale(prefisso) : null;
    if (mio) {
      var automatico = ordinaDiscipline(discipline, suoi, criterio);
      return copia.sort(function (a, b) {
        var posA = mio.indexOf(a), posB = mio.indexOf(b);
        if (posA === -1 && posB === -1) {
          return automatico.indexOf(a) - automatico.indexOf(b);
        }
        if (posA === -1) { return 1; }
        if (posB === -1) { return -1; }
        return posA - posB;
      });
    }

    if (criterio === "alfabetico") {
      return copia.sort(function (a, b) { return a.localeCompare(b, "it"); });
    }
    return copia.sort(function (a, b) {
      var prontiA = contaPronti(a, suoi), prontiB = contaPronti(b, suoi);
      if (prontiA !== prontiB) { return prontiB - prontiA; }
      var tuttiA = contaTutti(a, suoi), tuttiB = contaTutti(b, suoi);
      if (tuttiA !== tuttiB) { return tuttiB - tuttiA; }
      return a.localeCompare(b, "it");
    });
  }

  /* ------------------------------------------------------------------
     SPOSTARE LE CASELLE TRASCINANDOLE

     Non c'è nessun pulsante da premere: si prende una casella e la si
     porta dove si vuole. Col mouse basta trascinare; sul telefono si
     tiene premuto un istante e poi si trascina, altrimenti ogni
     scorrimento della pagina sposterebbe le caselle per sbaglio.
     Con la tastiera, mentre il nome di una disciplina è selezionato,
     si tiene premuto Ctrl e si usano le frecce.

     L'ordine si salva da solo sul computer di chi lo fa.
     ------------------------------------------------------------------ */

  function nomiNellOrdineMostrato(contenitore) {
    return Array.prototype.slice.call(contenitore.children).map(function (scheda) {
      var nome = scheda.querySelector(".disciplina-nome");
      return nome ? nome.textContent : "";
    });
  }

  function rendiSpostabili(prefisso, contenitore) {
    var ATTESA_TOCCO = 300;   /* millesimi da tenere premuto, sul telefono */
    var SOGLIA = 6;           /* pixel di movimento prima di cominciare */

    function salva() {
      salvaOrdinePersonale(prefisso, nomiNellOrdineMostrato(contenitore));
    }

    Array.prototype.forEach.call(contenitore.children, function (scheda) {
      var inizio = null;
      var inMano = false;
      var attesa = null;
      var spostata = false;        /* l'ha davvero cambiata di posto */
      var appenaSpostata = false;  /* per non aprirla subito dopo */
      var presa = null;            /* dove l'ha presa dentro la casella */

      function comincia() {
        inMano = true;
        attesa = null;
        spostata = false;
        /* In che punto della casella l'ha presa: serve perche' resti
           agganciata li' mentre la si porta in giro. */
        var dov = scheda.getBoundingClientRect();
        presa = { x: inizio.x - dov.left, y: inizio.y - dov.top };
        scheda.classList.add("in-mano");
        contenitore.classList.add("si-sposta");
        /* Finche' la casella e' in mano, il dito non deve far scorrere
           la pagina sotto di lei. */
        scheda.style.touchAction = "none";
        segui(inizio.x, inizio.y);
      }

      /* La casella resta al suo posto nella fila, ma viene disegnata
         spostata fin sotto al puntatore: cosi' si vede che la stai
         portando via. Ogni volta si riparte da dove si troverebbe
         normalmente, perche' intanto la fila puo' essersi rimescolata. */
      function segui(x, y) {
        scheda.style.transform = "";
        var ferma = scheda.getBoundingClientRect();
        scheda.style.transform = "translate("
          + Math.round(x - presa.x - ferma.left) + "px, "
          + Math.round(y - presa.y - ferma.top) + "px)";
      }

      function finisci() {
        document.removeEventListener("pointermove", muovi);
        document.removeEventListener("pointerup", finisci);
        document.removeEventListener("pointercancel", finisci);
        if (attesa) { clearTimeout(attesa); attesa = null; }
        if (inMano) {
          scheda.classList.remove("in-mano");
          contenitore.classList.remove("si-sposta");
          scheda.style.touchAction = "";
          scheda.style.transform = "";
          salva();
          /* Chi ha appena trascinato una casella non voleva aprirla:
             il clic che arriva subito dopo si lascia cadere. */
          appenaSpostata = spostata;
          setTimeout(function () { appenaSpostata = false; }, 400);
        }
        inMano = false;
        inizio = null;
      }

      scheda.addEventListener("pointerdown", function (evento) {
        if (evento.button && evento.button !== 0) { return; }
        inizio = { x: evento.clientX, y: evento.clientY, dito: evento.pointerId };
        /* I movimenti si ascoltano su tutta la pagina, non sulla
           casella: mentre la si trascina cambia di posto, e chi
           ascoltasse solo lei perderebbe il filo. */
        document.addEventListener("pointermove", muovi);
        document.addEventListener("pointerup", finisci);
        document.addEventListener("pointercancel", finisci);
        if (evento.pointerType === "touch") {
          attesa = setTimeout(comincia, ATTESA_TOCCO);
        }
      });

      function muovi(evento) {
        if (!inizio || evento.pointerId !== inizio.dito) { return; }
        var spostamento = Math.abs(evento.clientX - inizio.x)
          + Math.abs(evento.clientY - inizio.y);

        if (!inMano) {
          if (evento.pointerType === "touch") {
            /* Si è mosso prima del tempo: sta scorrendo la pagina, non
               spostando la casella. */
            if (spostamento > 10) { finisci(); }
            return;
          }
          if (spostamento < SOGLIA) { return; }
          comincia();
        }

        evento.preventDefault();
        segui(evento.clientX, evento.clientY);

        /* Si guarda quale casella sta sotto al puntatore e ci si mette
           prima o dopo, a seconda di che parte se ne tocca. Mentre e'
           in mano la casella non si fa vedere da questa ricerca, per
           non trovare sempre se stessa. */
        var sotto = document.elementFromPoint(evento.clientX, evento.clientY);
        var vicina = sotto && sotto.closest ? sotto.closest(".disciplina") : null;
        if (!vicina || vicina === scheda || vicina.parentNode !== contenitore) { return; }

        var dimensioni = vicina.getBoundingClientRect();
        var oltreLaMeta = (evento.clientX - dimensioni.left) > dimensioni.width / 2;
        contenitore.insertBefore(scheda, oltreLaMeta ? vicina.nextSibling : vicina);
        spostata = true;
        segui(evento.clientX, evento.clientY);
      }

      scheda.addEventListener("click", function (evento) {
        if (!appenaSpostata) { return; }
        appenaSpostata = false;
        evento.preventDefault();
        evento.stopPropagation();
      }, true);


      /* Con la tastiera: Ctrl e le frecce, mentre la casella è
         selezionata. Non si vede niente in piu' sullo schermo. */
      var testata = scheda.querySelector(".disciplina-testata")
        || scheda.querySelector(".disciplina-spenta-testo");
      if (testata) {
        if (testata.tabIndex < 0) { testata.tabIndex = 0; }
        testata.addEventListener("keydown", function (evento) {
          if (!evento.ctrlKey) { return; }
          var passo = evento.key === "ArrowLeft" ? -1
            : (evento.key === "ArrowRight" ? 1 : 0);
          if (!passo) { return; }
          evento.preventDefault();
          var vicina = passo < 0 ? scheda.previousElementSibling : scheda.nextElementSibling;
          if (!vicina) { return; }
          if (passo < 0) { contenitore.insertBefore(scheda, vicina); }
          else { contenitore.insertBefore(vicina, scheda); }
          salva();
          testata.focus();
        });
      }
    });
  }

  /* Quante colonne fare, perche' non resti una riga spaiata.
     Si parte dal numero che ci starebbe naturalmente e si cerca il
     numero di colonne che riempie meglio l'ultima riga: se le schede
     sono otto e ce ne starebbero quattro per riga, due righe piene; se
     sono nove, si stringe un po' tutto e se ne mettono cinque, cosi'
     quella in piu' rientra invece di restare da sola in fondo. */
  function sistemaColonne(griglia) {
    var schede = griglia.children.length;
    var larghezza = griglia.clientWidth;
    if (!schede || larghezza < 10) { return; }

    var spazio = parseFloat(getComputedStyle(griglia).gap) || 11;
    var COMODA = 190;   /* larghezza a cui si sta bene */
    var MINIMA = 140;   /* sotto questa i nomi si spezzano male */

    var massimo = Math.max(1, Math.floor((larghezza + spazio) / (MINIMA + spazio)));
    var naturale = Math.max(1, Math.min(massimo,
      Math.round((larghezza + spazio) / (COMODA + spazio))));

    /* Si provano anche due colonne in meno del naturale, non di più:
       con otto schede e quattro colonne e mezzo di spazio, due righe da
       quattro stanno meglio di una da cinque e una da tre; ma scendere
       a una o due colonne farebbe riquadri enormi. */
    var scelta = naturale;
    var punteggioMigliore = -1;
    for (var c = Math.max(1, naturale - 2); c <= massimo; c += 1) {
      var resto = schede % c;
      /* Righe tutte piene: il massimo. Altrimenti vince chi lascia
         l'ultima riga più popolata. A parità, chi si allontana meno
         dalla larghezza comoda. */
      var punteggio = (resto === 0)
        ? 1000 - Math.abs(c - naturale)
        : resto * 10 - Math.abs(c - naturale);
      if (punteggio > punteggioMigliore) {
        punteggioMigliore = punteggio;
        scelta = c;
      }
    }
    griglia.style.setProperty("--colonne", scelta);
  }

  function costruisciSezione(prefisso, discipline, artefatti) {
    var contenitore = document.getElementById("discipline-" + prefisso);
    var suoi = per(prefisso, artefatti);

    /* Gli strumenti che non appartengono a nessuna disciplina hanno il
       secondo campo vuoto. Stanno in un riquadro a parte, messo per
       primo e in evidenza perché valgono per tutti, e non solo per chi
       insegna una certa materia. Compare solo se ce n'è almeno uno. */
    var senzaDisciplina = suoi.filter(function (artefatto) {
      return artefatto.disciplina === "";
    });
    /* Gli strumenti generali stanno in una fascia loro, sopra alle
       discipline, e sono gia' aperti: si usano tutti i giorni, non
       devono farsi cercare. Non entrano nella griglia delle discipline
       perche' li' sarebbero un riquadro come gli altri. */
    if (senzaDisciplina.length > 0) {
      var postoGenerali = document.getElementById("generali-" + prefisso);
      if (!postoGenerali) {
        postoGenerali = document.createElement("div");
        postoGenerali.id = "generali-" + prefisso;
        postoGenerali.className = "fascia-generali";
        contenitore.parentNode.insertBefore(postoGenerali, contenitore);
      }
      postoGenerali.textContent = "";

      var schedaGenerali = schedaDisciplina(
        "Strumenti generali",
        senzaDisciplina,
        prefisso + "-strumenti-generali",
        true
      );
      postoGenerali.appendChild(schedaGenerali);

      /* Aperta da subito. */
      var testataGenerali = schedaGenerali.querySelector(".disciplina-testata");
      var elencoGenerali = schedaGenerali.querySelector(".elenco-artefatti");
      if (testataGenerali && elencoGenerali) {
        elencoGenerali.hidden = false;
        testataGenerali.setAttribute("aria-expanded", "true");
      }
    }

    /* Le discipline, nell'ordine scelto. Cambiando ordine si rifanno
       solo queste: il riquadro degli strumenti generali resta in cima. */
    var primeSchede = contenitore.children.length;   /* di norma zero */

    var fascia = document.getElementById("costruzione-" + prefisso);
    if (!fascia) {
      fascia = document.createElement("div");
      fascia.id = "costruzione-" + prefisso;
      fascia.className = "in-costruzione-fascia";
      contenitore.parentNode.insertBefore(fascia, contenitore.nextSibling);
    }

    function disegnaDiscipline(criterio) {
      while (contenitore.children.length > primeSchede) {
        contenitore.removeChild(contenitore.lastChild);
      }
      fascia.textContent = "";
      /* Le discipline con qualcosa dentro stanno nella griglia grande.
         Quelle ancora in costruzione vanno in una fascia a parte, sotto:
         sono tante, e in mezzo alle altre facevano massa. Li' diventano
         piastrelle piccole, tutte della stessa misura, messe in fila e
         centrate: nessuna si allunga piu' delle altre. */
      ordinaDiscipline(discipline, suoi, criterio, prefisso).forEach(function (nome) {
        var della = suoi.filter(function (artefatto) {
          return artefatto.disciplina === nome;
        });
        var numero = discipline.indexOf(nome);
        var scheda = schedaDisciplina(nome, della, prefisso + "-disciplina-" + numero);
        if (della.length === 0) { fascia.appendChild(scheda); }
        else { contenitore.appendChild(scheda); }
      });
      requestAnimationFrame(function () { sistemaColonne(contenitore); });
      rendiSpostabili(prefisso, contenitore);
    }

    disegnaDiscipline(ORDINE);

    /* Le colonne si ricalcolano quando la sezione si apre o la finestra
       cambia larghezza. */
    if (window.ResizeObserver) {
      new ResizeObserver(function () { sistemaColonne(contenitore); })
        .observe(contenitore);
    }
    contenitore.setAttribute("data-ridisegna", "1");
    contenitore.ridisegna = disegnaDiscipline;


    /* Il conteggio "16 discipline, 3 artefatti" non si scrive più:
       chi apre il sito vuole aprire uno strumento, non contare. */
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

  /* Una sezione aperta resta aperta su questo computer: la parola
     d'ordine si scrive una volta sola e non la si richiede più, nemmeno
     dopo aver chiuso il browser.

     Si può fare perché queste parole non proteggono niente: sono
     scritte in chiaro nel codice del sito, servono solo a tenere
     separate le due sezioni. Chi vuole richiuderle usa il collegamento
     "esci" in fondo alla pagina. */
  function ricorda(prefisso) {
    try {
      window.localStorage.setItem(prefisso + "-aperta", "si");
    } catch (errore) {
      /* Se il browser non lo permette pazienza: si riscrive la parola. */
    }
  }

  function dimentica(prefisso) {
    try {
      window.localStorage.removeItem(prefisso + "-aperta");
      window.sessionStorage.removeItem(prefisso + "-aperta");
    } catch (errore) {
      /* niente da fare */
    }
  }

  function giaAperta(prefisso) {
    try {
      if (window.localStorage.getItem(prefisso + "-aperta") === "si") {
        return true;
      }
      /* Chi aveva già aperto la sezione prima di questa modifica non
         deve riscrivere la parola: si sposta il ricordo. */
      if (window.sessionStorage.getItem(prefisso + "-aperta") === "si") {
        ricorda(prefisso);
        return true;
      }
      return false;
    } catch (errore) {
      return false;
    }
  }

  function apriArea(prefisso) {
    document.getElementById("accesso-" + prefisso).hidden = true;
    var area = document.getElementById("area-" + prefisso);
    area.hidden = false;

    /* Un modo per richiudere la sezione, utile su un computer usato da
       altri. È un pulsantino in cima, accanto al menù dell'ordine: la
       frase lunga in fondo alla pagina occupava una riga intera per una
       cosa che si usa di rado. La frase per esteso resta nel
       suggerimento e per chi si fa leggere la pagina. */
    if (!document.getElementById("esci-" + prefisso)) {
      var esci = document.createElement("button");
      esci.type = "button";
      esci.id = "esci-" + prefisso;
      esci.className = "pulsante-esci";
      esci.textContent = "Esci";
      esci.title = "Chiudi questa sezione su questo computer";
      esci.setAttribute("aria-label", "Chiudi questa sezione su questo computer");
      esci.addEventListener("click", function () {
        dimentica(prefisso);
        document.getElementById("accesso-" + prefisso).hidden = false;
        area.hidden = true;
      });
      var barra = document.getElementById("barra-" + prefisso);
      if (barra) { barra.appendChild(esci); } else { area.appendChild(esci); }
    }
  }

  function preparaAccesso(prefisso, parola) {
    var modulo = document.getElementById("modulo-" + prefisso);
    var campo = document.getElementById("parola-" + prefisso);
    var errore = document.getElementById("errore-" + prefisso);

    modulo.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var scritto = campo.value.trim();

      if (scritto === parola) {
        errore.textContent = "";
        ricorda(prefisso);
        apriArea(prefisso);
        return;
      }

      errore.textContent = "Password non corretta.";
      campo.value = "";
      campo.focus();
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
        motivo: "non è stato possibile trovare l'elenco delle discipline in "
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
