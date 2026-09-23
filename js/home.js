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

  function ordinaDiscipline(discipline, suoi, criterio) {
    var copia = discipline.slice();
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

  /* Niente buchi nella griglia: se l'ultima riga è incompleta, l'ultimo
     riquadro si allarga fino a riempirla. Il numero di colonne lo
     decide il browser in base alla larghezza, quindi si guarda dove i
     riquadri sono finiti davvero. */
  function riempiUltimaRiga(griglia) {
    var figli = Array.prototype.slice.call(griglia.children);
    figli.forEach(function (f) { f.style.gridColumn = ""; });
    if (figli.length === 0) { return; }

    var colonne = getComputedStyle(griglia).gridTemplateColumns.split(" ").length;
    if (!(colonne > 1)) { return; }

    var righe = {};
    figli.forEach(function (f) {
      var y = f.offsetTop;
      if (!righe[y]) { righe[y] = []; }
      righe[y].push(f);
    });
    var quote = Object.keys(righe).map(Number).sort(function (a, b) { return a - b; });
    var ultima = righe[quote[quote.length - 1]];
    var mancanti = colonne - ultima.length;
    if (mancanti > 0 && ultima.length > 0) {
      ultima[ultima.length - 1].style.gridColumn = "span " + (mancanti + 1);
    }
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

    /* Le discipline, nell'ordine scelto. Cambiando ordine si rifanno
       solo queste: il riquadro degli strumenti generali resta in cima. */
    var primeSchede = contenitore.children.length;

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
      ordinaDiscipline(discipline, suoi, criterio).forEach(function (nome) {
        var della = suoi.filter(function (artefatto) {
          return artefatto.disciplina === nome;
        });
        var numero = discipline.indexOf(nome);
        var scheda = schedaDisciplina(nome, della, prefisso + "-disciplina-" + numero);
        if (della.length === 0) { fascia.appendChild(scheda); }
        else { contenitore.appendChild(scheda); }
      });
      /* Si misura al giro dopo: appena disegnati, i riquadri non hanno
         ancora una posizione, e con la sezione chiusa sono tutti a
         zero. */
      requestAnimationFrame(function () { riempiUltimaRiga(contenitore); });
    }

    disegnaDiscipline(ORDINE);
    contenitore.setAttribute("data-ridisegna", "1");
    contenitore.ridisegna = disegnaDiscipline;

    /* La griglia si rimisura quando la finestra cambia larghezza, così
       non restano buchi nemmeno girando il telefono. */
    if (window.ResizeObserver) {
      new ResizeObserver(function () { riempiUltimaRiga(contenitore); })
        .observe(contenitore);
    }


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

    /* Adesso che la sezione si vede, i riquadri hanno una posizione:
       si può sistemare l'ultima riga. */
    var griglia = document.getElementById("discipline-" + prefisso);
    if (griglia) {
      requestAnimationFrame(function () { riempiUltimaRiga(griglia); });
    }

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
