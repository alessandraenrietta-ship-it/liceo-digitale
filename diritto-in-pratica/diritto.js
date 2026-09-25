/* =================================================================
   DIRITTO IN PRATICA

   Questa pagina non contiene nessun testo delle attività: li legge
   dai quattro file .txt che stanno nella stessa cartella. Per
   cambiare una domanda, un caso o un compito si modifica il file di
   testo, non questo codice.

   Che cosa fa questo file:
   - legge i quattro file di testo e li trasforma in attività;
   - disegna la bacheca, con una scheda per ogni attività e i
     progressi di chi la usa;
   - disegna ciascuna delle quattro attività.

   COSA VIENE SALVATO
   Solo quali domande sono già state risolte, nel browser di chi usa
   la pagina. Nessun nome, nessun dato personale, niente che esca
   dal computer.
   ================================================================= */

(function () {
  "use strict";

  /* Le quattro attività, nell'ordine in cui compaiono nella bacheca.
     anno: 1 per il primo anno, 2 per il secondo. */
  var ATTIVITA = [
    { id: "fonti",    anno: 1, file: "anno1-fonti.txt" },
    { id: "capacita", anno: 1, file: "anno1-capacita.txt" },
    { id: "legge",    anno: 2, file: "anno2-legge.txt" },
    { id: "organi",   anno: 2, file: "anno2-organi.txt" }
  ];

  var NOMI_ANNI = { 1: "Primo anno", 2: "Secondo anno" };

  var MEMORIA = "diritto-in-pratica-progressi";

  /* Le parole chiave che si possono scrivere nei file di testo.
     Una riga che comincia con una di queste parole seguita dai due
     punti è un campo; tutte le altre si attaccano alla precedente. */
  var CHIAVI = ["titolo", "icona", "argomento", "descrizione", "premessa",
    "storia", "nome", "spiegazione", "domanda", "tipo", "azione", "da",
    "prima", "testo", "organo", "potere"];

  var ETA_MASSIMA = 60;

  var app = document.getElementById("app");
  var dati = {};


  /* =================================================================
     FUNZIONI DI APPOGGIO
     ================================================================= */

  function el(tag, classe, testo) {
    var e = document.createElement(tag);
    if (classe) { e.className = classe; }
    if (testo !== undefined && testo !== null) { e.textContent = testo; }
    return e;
  }

  function bottone(testo, classe) {
    var b = el("button", classe, testo);
    b.type = "button";
    return b;
  }

  function svuota(nodo) {
    while (nodo.firstChild) { nodo.removeChild(nodo.firstChild); }
  }

  function mescola(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function soloLettori(testo) {
    return el("span", "solo-lettori", testo);
  }

  /* Porta lo sguardo (e la tastiera) su un titolo appena comparso:
     chi usa un lettore di schermo sente subito dove si trova. */
  function metti_a_fuoco(nodo) {
    nodo.setAttribute("tabindex", "-1");
    nodo.focus();
  }


  /* =================================================================
     I PROGRESSI, SALVATI NEL BROWSER
     Per ogni attività si ricorda l'elenco delle cose già risolte,
     riconosciute dal loro titolo. Se il browser non lascia salvare
     niente (per esempio in navigazione anonima) la pagina funziona
     lo stesso: semplicemente non ricorda.
     ================================================================= */

  function leggiProgressi() {
    try {
      var t = localStorage.getItem(MEMORIA);
      var o = t ? JSON.parse(t) : {};
      return (o && typeof o === "object") ? o : {};
    } catch (e) {
      return {};
    }
  }

  function scriviProgressi(p) {
    try { localStorage.setItem(MEMORIA, JSON.stringify(p)); } catch (e) { /* pazienza */ }
  }

  function fatti(id) {
    var p = leggiProgressi();
    return Array.isArray(p[id]) ? p[id] : [];
  }

  function eFatto(id, chiave) {
    return fatti(id).indexOf(chiave) >= 0;
  }

  function segnaFatto(id, chiave) {
    var p = leggiProgressi();
    var l = Array.isArray(p[id]) ? p[id] : [];
    if (l.indexOf(chiave) < 0) { l.push(chiave); }
    p[id] = l;
    scriviProgressi(p);
  }

  function azzera(id) {
    var p = leggiProgressi();
    if (id) { delete p[id]; } else { p = {}; }
    scriviProgressi(p);
  }


  /* =================================================================
     LETTURA DEI FILE DI TESTO
     ================================================================= */

  function analizza(testo) {
    var righe = testo.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
    var ris = { intestazione: {}, blocchi: [], errori: [] };
    var attuale = null;
    var ultimo = null;

    righe.forEach(function (riga, i) {
      var n = i + 1;
      var t = riga.trim();
      if (t === "" || t.charAt(0) === "#") { return; }

      var blocco = t.match(/^\[\s*([A-Za-z]+)\s*\]$/);
      if (blocco) {
        attuale = { tipo: blocco[1].toUpperCase(), riga: n, campi: {}, risposte: [] };
        ris.blocchi.push(attuale);
        ultimo = null;
        return;
      }

      var segno = t.charAt(0);
      if (segno === "+" || segno === "-") {
        if (!attuale) {
          ris.errori.push("riga " + n + ": una risposta deve stare dentro un blocco, sotto una riga come [CASO]. L'ho saltata.");
          return;
        }
        var corpo = t.slice(1).trim();
        var barra = corpo.indexOf("|");
        var r = {
          giusta: segno === "+",
          testo: (barra < 0 ? corpo : corpo.slice(0, barra)).trim(),
          spiegazione: barra < 0 ? "" : corpo.slice(barra + 1).trim()
        };
        if (!r.testo) {
          ris.errori.push("riga " + n + ": dopo il segno " + segno + " manca il testo della risposta. L'ho saltata.");
          return;
        }
        attuale.risposte.push(r);
        ultimo = { dove: r, campo: "spiegazione" };
        return;
      }

      var campo = t.match(/^([A-Za-z]+)\s*:\s*(.*)$/);
      if (campo && CHIAVI.indexOf(campo[1].toLowerCase()) >= 0) {
        var dove = attuale ? attuale.campi : ris.intestazione;
        var k = campo[1].toLowerCase();
        dove[k] = campo[2].trim();
        ultimo = { dove: dove, campo: k };
        return;
      }

      if (ultimo) {
        var prima = ultimo.dove[ultimo.campo];
        ultimo.dove[ultimo.campo] = prima ? prima + " " + t : t;
        return;
      }

      ris.errori.push("riga " + n + ": non capisco questa riga, l'ho saltata.");
    });

    return ris;
  }

  function erroreBlocco(f, b, frase) {
    f.errori.push("blocco [" + b.tipo + "] alla riga " + b.riga + ": " + frase + " L'ho saltato.");
  }

  /* Trasforma un blocco con domanda e risposte in una domanda pronta. */
  function domandaDaBlocco(f, b) {
    var c = b.campi;
    if (!c.domanda) { erroreBlocco(f, b, "manca la riga domanda:."); return null; }
    if (b.risposte.length < 2) { erroreBlocco(f, b, "servono almeno due risposte, con + o - davanti."); return null; }
    if (!b.risposte.some(function (r) { return r.giusta; })) {
      erroreBlocco(f, b, "nessuna risposta è segnata come giusta con il +.");
      return null;
    }
    var multipla = /multipl/i.test(c.tipo || "");
    var giuste = b.risposte.filter(function (r) { return r.giusta; }).length;
    if (!multipla && giuste > 1) {
      f.errori.push("blocco [" + b.tipo + "] alla riga " + b.riga + ": ci sono " + giuste +
        " risposte giuste ma manca la riga tipo: multipla. L'ho trattata come domanda a scelta multipla.");
      multipla = true;
    }
    return {
      titolo: c.titolo || c.domanda,
      storia: c.storia || "",
      premessa: c.premessa || "",
      domanda: c.domanda,
      multipla: multipla,
      risposte: b.risposte
    };
  }

  function eta(testo) {
    var t = String(testo || "").trim();
    if (!/^\d{1,3}$/.test(t)) { return null; }
    var n = parseInt(t, 10);
    return n <= ETA_MASSIMA ? n : null;
  }

  /* Per ogni attività, che cosa ci si aspetta di trovare nel file. */
  var PREPARA = {

    fonti: function (f) {
      var d = { livelli: [], casi: [] };
      f.blocchi.forEach(function (b) {
        if (b.tipo === "LIVELLO") {
          if (!b.campi.nome) { erroreBlocco(f, b, "manca la riga nome:."); return; }
          d.livelli.push({ nome: b.campi.nome, spiegazione: b.campi.spiegazione || "" });
        } else if (b.tipo === "CASO") {
          var q = domandaDaBlocco(f, b);
          if (q) { d.casi.push(q); }
        } else {
          erroreBlocco(f, b, "qui si possono usare solo [LIVELLO] e [CASO].");
        }
      });
      d.chiavi = (d.livelli.length > 1 ? ["piramide"] : []).concat(d.casi.map(function (q) { return q.titolo; }));
      return d;
    },

    capacita: function (f) {
      var d = { azioni: [] };
      f.blocchi.forEach(function (b) {
        if (b.tipo !== "AZIONE") { erroreBlocco(f, b, "qui si può usare solo [AZIONE]."); return; }
        var c = b.campi;
        if (!c.azione) { erroreBlocco(f, b, "manca la riga azione:."); return; }
        var da = eta(c.da);
        if (da === null) {
          erroreBlocco(f, b, "nella riga da: va scritto solo un numero, fra 0 e " + ETA_MASSIMA + ".");
          return;
        }
        var a = { nome: c.azione, icona: c.icona || "", da: da, spiegazione: c.spiegazione || "", prima: null };
        if (c.prima) {
          var barra = c.prima.indexOf("|");
          var numero = eta(barra < 0 ? c.prima : c.prima.slice(0, barra));
          if (numero === null || numero >= da) {
            f.errori.push("blocco [AZIONE] alla riga " + b.riga + ": nella riga prima: va scritto un numero più piccolo di quello della riga da:, poi la barra | e le condizioni. Ho ignorato la riga prima:.");
          } else {
            a.prima = { eta: numero, testo: barra < 0 ? "" : c.prima.slice(barra + 1).trim() };
          }
        }
        d.azioni.push(a);
      });
      d.chiavi = d.azioni.map(function (a) { return a.nome; });
      return d;
    },

    legge: function (f) {
      var d = { passi: [] };
      f.blocchi.forEach(function (b) {
        if (b.tipo !== "PASSO") { erroreBlocco(f, b, "qui si può usare solo [PASSO]."); return; }
        var q = domandaDaBlocco(f, b);
        if (q) { d.passi.push(q); }
      });
      d.chiavi = d.passi.map(function (q) { return q.titolo; });
      return d;
    },

    organi: function (f) {
      var d = { organi: [], compiti: [] };
      var perNome = {};
      f.blocchi.forEach(function (b) {
        if (b.tipo !== "ORGANO") { return; }
        if (!b.campi.nome) { erroreBlocco(f, b, "manca la riga nome:."); return; }
        var o = { nome: b.campi.nome, icona: b.campi.icona || "", potere: b.campi.potere || "", compiti: [] };
        d.organi.push(o);
        perNome[o.nome.toLowerCase()] = o;
      });
      f.blocchi.forEach(function (b) {
        if (b.tipo === "ORGANO") { return; }
        if (b.tipo !== "COMPITO") { erroreBlocco(f, b, "qui si possono usare solo [ORGANO] e [COMPITO]."); return; }
        var c = b.campi;
        if (!c.testo) { erroreBlocco(f, b, "manca la riga testo:."); return; }
        var o = perNome[String(c.organo || "").trim().toLowerCase()];
        if (!o) {
          erroreBlocco(f, b, "l'organo \"" + (c.organo || "") + "\" non corrisponde a nessuno dei nomi scritti nei blocchi [ORGANO].");
          return;
        }
        d.compiti.push({ testo: c.testo, organo: o, spiegazione: c.spiegazione || "" });
      });
      d.chiavi = d.compiti.map(function (c) { return c.testo; });
      return d;
    }
  };

  function carica(a) {
    return fetch(a.file, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) { throw new Error("il server ha risposto " + r.status); }
        return r.text();
      })
      .then(function (testo) {
        var f = analizza(testo);
        var d = PREPARA[a.id](f);
        d.intestazione = f.intestazione;
        d.errori = f.errori;
        d.ok = d.chiavi.length > 0;
        if (!d.ok) { d.problema = "nel file non ho trovato nessuna domanda da proporre."; }
        dati[a.id] = d;
      })
      .catch(function (e) {
        dati[a.id] = { ok: false, intestazione: {}, errori: [], chiavi: [], problema: String(e && e.message || e) };
      });
  }


  /* =================================================================
     PEZZI COMUNI
     ================================================================= */

  function titoloDi(a) {
    return dati[a.id].intestazione.titolo || a.file;
  }

  function pannelloErrori(a) {
    var errori = dati[a.id].errori;
    if (!errori || errori.length === 0) { return null; }
    var box = el("div", "avviso");
    box.appendChild(el("strong", null, "Nel file " + a.file + " alcune righe vanno riviste."));
    box.appendChild(el("p", "nota-piccola", "Il resto dell'attività funziona normalmente."));
    var ul = el("ul", "nota-piccola");
    errori.slice(0, 12).forEach(function (t) { ul.appendChild(el("li", null, t)); });
    if (errori.length > 12) { ul.appendChild(el("li", null, "…e altre " + (errori.length - 12) + " segnalazioni.")); }
    box.appendChild(ul);
    return box;
  }

  /* Una domanda con le sue risposte da scegliere.
     quandoGiusta viene chiamata una volta sola, quando la risposta
     è completa e corretta. */
  function creaDomanda(q, quandoGiusta) {
    var box = el("div", "domanda");
    if (q.premessa) { box.appendChild(el("p", "storia", q.premessa)); }
    box.appendChild(el("p", "testo-domanda", q.domanda));
    if (q.multipla) {
      box.appendChild(el("p", "nota-piccola",
        "Le risposte giuste sono più di una: scegli tutte quelle che ti sembrano giuste, poi premi Controlla."));
    }

    var lista = el("div", "opzioni");
    lista.setAttribute("role", "group");
    lista.setAttribute("aria-label", "Risposte possibili");
    var esito = el("p", "esito");
    esito.setAttribute("aria-live", "polite");

    var tentativi = 0;
    var finito = false;

    var voci = mescola(q.risposte).map(function (r) {
      var voce = el("div", "voce");
      var b = bottone(null, "opzione");
      var segno = el("span", "segno");
      segno.setAttribute("aria-hidden", "true");
      var stato = soloLettori("");
      b.appendChild(segno);
      b.appendChild(el("span", null, r.testo));
      b.appendChild(stato);
      var spiega = el("p", "spiega-opzione");
      spiega.hidden = true;
      voce.appendChild(b);
      voce.appendChild(spiega);
      lista.appendChild(voce);
      var v = { r: r, b: b, segno: segno, stato: stato, spiega: spiega, scartata: false };

      function marca() {
        segno.textContent = r.giusta ? "✓" : "✗";
        stato.textContent = r.giusta ? " — risposta giusta" : " — risposta sbagliata";
        b.classList.add(r.giusta ? "giusta" : "sbagliata");
        spiega.textContent = r.spiegazione || (r.giusta ? "Giusto." : "Non è così.");
        spiega.hidden = false;
      }
      v.marca = marca;

      function pulisci() {
        segno.textContent = "";
        stato.textContent = "";
        b.classList.remove("giusta", "sbagliata");
        spiega.hidden = true;
      }
      v.pulisci = pulisci;

      if (q.multipla) { b.setAttribute("aria-pressed", "false"); }

      b.addEventListener("click", function () {
        if (finito) { return; }
        if (q.multipla) {
          var scelta = b.getAttribute("aria-pressed") !== "true";
          b.setAttribute("aria-pressed", scelta ? "true" : "false");
          pulisci();
          esito.textContent = "";
          return;
        }
        if (v.scartata) { return; }
        tentativi++;
        marca();
        if (r.giusta) {
          finito = true;
          esito.className = "esito bene";
          esito.textContent = tentativi === 1 ? "✓ Giusto, al primo colpo!" : "✓ Giusto!";
          voci.forEach(function (x) { x.b.setAttribute("aria-disabled", "true"); });
          quandoGiusta(tentativi === 1);
        } else {
          v.scartata = true;
          b.setAttribute("aria-disabled", "true");
          esito.className = "esito";
          esito.textContent = "✗ Non è questa: leggi la spiegazione e prova con un'altra risposta.";
        }
      });

      return v;
    });

    box.appendChild(lista);

    if (q.multipla) {
      var controlla = bottone("Controlla");
      controlla.addEventListener("click", function () {
        if (finito) { return; }
        var scelte = voci.filter(function (v) { return v.b.getAttribute("aria-pressed") === "true"; });
        if (scelte.length === 0) {
          esito.className = "esito";
          esito.textContent = "Scegli almeno una risposta, poi premi Controlla.";
          return;
        }
        tentativi++;
        scelte.forEach(function (v) { v.marca(); });
        var sbagliate = scelte.filter(function (v) { return !v.r.giusta; }).length;
        var mancanti = voci.filter(function (v) {
          return v.r.giusta && v.b.getAttribute("aria-pressed") !== "true";
        }).length;
        if (sbagliate === 0 && mancanti === 0) {
          finito = true;
          esito.className = "esito bene";
          esito.textContent = tentativi === 1 ? "✓ Tutte giuste, al primo colpo!" : "✓ Tutte giuste!";
          voci.forEach(function (x) { x.b.setAttribute("aria-disabled", "true"); });
          controlla.hidden = true;
          quandoGiusta(tentativi === 1);
          return;
        }
        var frasi = [];
        if (sbagliate > 0) {
          frasi.push(sbagliate === 1 ? "una delle tue scelte è sbagliata (segnata con ✗): toglila" :
            sbagliate + " delle tue scelte sono sbagliate (segnate con ✗): toglile");
        }
        if (mancanti > 0) {
          frasi.push(mancanti === 1 ? "manca ancora una risposta giusta" : "mancano ancora " + mancanti + " risposte giuste");
        }
        esito.className = "esito";
        var testo = frasi.join(", e ");
        esito.textContent = "✗ Quasi: " + testo + ". Poi premi di nuovo Controlla.";
      });
      box.appendChild(controlla);
    }

    box.appendChild(esito);
    return box;
  }

  /* Una serie di domande da fare una alla volta, con in cima i
     numeri delle tappe per spostarsi e vedere quali sono risolte. */
  function sequenza(cont, a, domande, parola) {
    var tappe = el("ol", "tappe");
    tappe.setAttribute("aria-label", "Le tappe");
    var area = el("div");
    var attuale = 0;

    function disegnaTappe() {
      svuota(tappe);
      domande.forEach(function (q, i) {
        var li = el("li");
        var fatto = eFatto(a.id, q.titolo);
        var b = bottone((i + 1) + (fatto ? " ✓" : ""));
        b.title = q.titolo;
        b.setAttribute("aria-label", parola + " " + (i + 1) + ": " + q.titolo + (fatto ? ", risolto" : ""));
        if (i === attuale) { b.setAttribute("aria-current", "step"); }
        b.addEventListener("click", function () { apri(i, true); });
        li.appendChild(b);
        tappe.appendChild(li);
      });
    }

    function apri(i, fuoco) {
      attuale = i;
      disegnaTappe();
      svuota(area);
      var q = domande[i];
      var h = el("h4", null, parola + " " + (i + 1) + " di " + domande.length + ": " + q.titolo);
      area.appendChild(h);
      if (q.storia) { area.appendChild(el("p", "storia", q.storia)); }
      var dopo = el("div", "riga-pulsanti");
      area.appendChild(creaDomanda(q, function () {
        segnaFatto(a.id, q.titolo);
        disegnaTappe();
        if (i + 1 < domande.length) {
          var avanti = bottone(parola + " successivo →");
          avanti.addEventListener("click", function () { apri(i + 1, true); });
          dopo.appendChild(avanti);
        } else {
          var mancanti = domande.filter(function (x) { return !eFatto(a.id, x.titolo); }).length;
          dopo.appendChild(el("p", "esito bene", mancanti === 0 ?
            "Hai risolto tutto. Ottimo lavoro!" :
            "Era l'ultimo. Ne restano " + mancanti + " da risolvere: li trovi nei numeri qui sopra senza il segno ✓."));
          var torna = el("a", "pulsante", "Torna alla bacheca");
          torna.href = "#";
          dopo.appendChild(torna);
        }
      }));
      area.appendChild(dopo);
      if (fuoco) { metti_a_fuoco(h); }
    }

    cont.appendChild(tappe);
    cont.appendChild(area);

    /* Si riparte dalla prima tappa non ancora risolta. */
    var primo = 0;
    for (var i = 0; i < domande.length; i++) {
      if (!eFatto(a.id, domande[i].titolo)) { primo = i; break; }
    }
    apri(primo, false);
  }


  /* =================================================================
     LA BACHECA
     ================================================================= */

  function mostraBacheca() {
    svuota(app);
    document.title = "Diritto in pratica";

    var intro = el("div", "riquadro");
    intro.appendChild(el("h2", null, "Scegli un'attività"));
    intro.appendChild(el("p", null,
      "Ogni scheda è un'attività da svolgere. I tuoi progressi restano salvati solo su questo dispositivo: " +
      "non servono nome né registrazione."));
    if (location.protocol === "file:") {
      var av = el("div", "avviso");
      av.appendChild(el("strong", null, "Hai aperto la pagina con un doppio clic sul file. "));
      av.appendChild(document.createTextNode(
        "In questo modo i browser, per sicurezza, non lasciano leggere i file di testo con le attività. " +
        "Apri il sito dal suo indirizzo su GitHub Pages, oppure con anteprima.bat dalla cartella principale."));
      intro.appendChild(av);
    }
    app.appendChild(intro);

    [1, 2].forEach(function (anno) {
      var sez = el("section", "riquadro");
      var h = el("h2", null, NOMI_ANNI[anno]);
      h.id = "anno-" + anno;
      sez.setAttribute("aria-labelledby", h.id);
      sez.appendChild(h);
      var griglia = el("div", "schede");
      ATTIVITA.filter(function (a) { return a.anno === anno; }).forEach(function (a) {
        griglia.appendChild(scheda(a));
      });
      sez.appendChild(griglia);
      app.appendChild(sez);
    });

    var fondo = el("div", "riquadro");
    fondo.appendChild(el("h3", null, "Ricominciare da capo"));
    fondo.appendChild(el("p", "nota-piccola",
      "Se questo dispositivo lo usano più persone, ognuna può cancellare i progressi e ripartire da zero."));
    var reset = bottone("Cancella i miei progressi", "secondario");
    reset.addEventListener("click", function () {
      if (window.confirm("Vuoi davvero cancellare i progressi di tutte e quattro le attività?")) {
        azzera(null);
        mostraBacheca();
      }
    });
    fondo.appendChild(reset);
    app.appendChild(fondo);
  }

  function scheda(a) {
    var d = dati[a.id];
    if (!d.ok) {
      var spenta = el("div", "scheda spenta");
      spenta.appendChild(el("h3", null, d.intestazione.titolo || "Attività non disponibile"));
      spenta.appendChild(el("p", "nota-piccola", "Non riesco a leggere il file " + a.file + ": " + d.problema));
      return spenta;
    }
    var h = d.intestazione;
    var s = el("a", "scheda");
    s.href = "#" + a.id;
    if (h.icona) {
      var ic = el("span", "scheda-icona", h.icona);
      ic.setAttribute("aria-hidden", "true");
      s.appendChild(ic);
    }
    if (h.argomento) { s.appendChild(el("p", "scheda-argomento", h.argomento)); }
    s.appendChild(el("h3", null, h.titolo || a.file));
    if (h.descrizione) { s.appendChild(el("p", null, h.descrizione)); }

    var tot = d.chiavi.length;
    var svolti = d.chiavi.filter(function (k) { return eFatto(a.id, k); }).length;
    var barra = el("div", "barra");
    barra.setAttribute("aria-hidden", "true");
    var piena = el("div", "barra-piena");
    piena.style.width = Math.round(svolti / tot * 100) + "%";
    barra.appendChild(piena);
    s.appendChild(barra);
    s.appendChild(el("p", "progresso",
      svolti === 0 ? "Da iniziare · 0 su " + tot :
      svolti === tot ? "✓ Completata · " + tot + " su " + tot :
      "In corso · " + svolti + " su " + tot));
    s.appendChild(el("span", "scheda-apri", svolti === 0 ? "Inizia →" : "Continua →"));
    return s;
  }


  /* =================================================================
     LA PAGINA DI UN'ATTIVITÀ
     ================================================================= */

  function mostraAttivita(a) {
    svuota(app);
    var d = dati[a.id];
    var h = d.intestazione;
    document.title = (h.titolo || "Attività") + " · Diritto in pratica";

    var testa = el("div", "riquadro");
    var torna = el("a", "torna", "← Torna alla bacheca");
    torna.href = "#";
    testa.appendChild(torna);
    testa.appendChild(el("p", "etichetta-anno", NOMI_ANNI[a.anno] + (h.argomento ? " · " + h.argomento : "")));
    var titolo = el("h2", null, (h.icona ? h.icona + " " : "") + (h.titolo || a.file));
    testa.appendChild(titolo);
    if (h.descrizione) { testa.appendChild(el("p", null, h.descrizione)); }
    if (h.premessa) { testa.appendChild(el("p", "storia", h.premessa)); }
    if (h.storia) { testa.appendChild(el("p", "storia", h.storia)); }
    var errori = pannelloErrori(a);
    if (errori) { testa.appendChild(errori); }
    app.appendChild(testa);

    DISEGNA[a.id](a, d);

    var piede = el("div", "riquadro");
    var riparti = bottone("Ricomincia questa attività da capo", "secondario");
    riparti.addEventListener("click", function () {
      if (window.confirm("Vuoi cancellare i progressi di questa attività e ricominciare?")) {
        azzera(a.id);
        mostraAttivita(a);
      }
    });
    piede.appendChild(riparti);
    app.appendChild(piede);

    window.scrollTo(0, 0);
    metti_a_fuoco(titolo);
  }

  var DISEGNA = {

    /* ---------------------------------------------------------------
       PRIMO ANNO: LA PIRAMIDE DELLE FONTI
       --------------------------------------------------------------- */
    fonti: function (a, d) {
      if (d.livelli.length > 1) { piramide(a, d); }
      if (d.casi.length > 0) {
        var sez = el("section", "riquadro");
        sez.appendChild(el("h3", null, (d.livelli.length > 1 ? "2. " : "") + "Chi vince?"));
        sez.appendChild(el("p", null,
          "In ogni caso due norme dicono cose diverse. Usa la piramide per decidere quale si applica."));
        sequenza(sez, a, d.casi, "Caso");
        app.appendChild(sez);
      }
    },

    /* ---------------------------------------------------------------
       PRIMO ANNO: CHE COSA POSSO FARE ALLA MIA ETÀ?
       --------------------------------------------------------------- */
    capacita: function (a, d) {
      esploraEta(d);
      sfidaEta(a, d);
    },

    /* ---------------------------------------------------------------
       SECONDO ANNO: IL VIAGGIO DI UNA LEGGE
       --------------------------------------------------------------- */
    legge: function (a, d) {
      var sez = el("section", "riquadro");
      sez.appendChild(el("h3", null, "Le tappe del viaggio"));
      sequenza(sez, a, d.passi, "Passo");
      app.appendChild(sez);
    },

    /* ---------------------------------------------------------------
       SECONDO ANNO: CHI FA CHE COSA?
       --------------------------------------------------------------- */
    organi: function (a, d) {
      mappaOrgani(a, d);
    }
  };


  /* ----- la piramide da mettere in ordine ----- */

  function piramide(a, d) {
    var liv = d.livelli;
    var sez = el("section", "riquadro");
    sez.appendChild(el("h3", null, "1. Metti in ordine le fonti"));
    var spazio = el("div");
    sez.appendChild(spazio);
    app.appendChild(sez);

    function mostraPiramide(appenaRisolta) {
      svuota(spazio);
      spazio.appendChild(el("p", null, appenaRisolta ?
        "✓ Ordine giusto! Ecco la piramide: tocca un gradino per leggere che cosa significa." :
        "Hai già messo in ordine le fonti. Tocca un gradino della piramide per leggere che cosa significa."));
      var p = el("div", "piramide");
      var spiega = el("p", "storia");
      spiega.setAttribute("aria-live", "polite");
      var bottoni = [];
      liv.forEach(function (l, i) {
        var b = bottone((i + 1) + ". " + l.nome);
        /* In cima il gradino più stretto, in fondo il più largo. */
        var largo = liv.length === 1 ? 100 : 45 + Math.round(55 * i / (liv.length - 1));
        b.style.width = largo + "%";
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () {
          bottoni.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          spiega.textContent = l.nome + ": " + (l.spiegazione || "");
        });
        bottoni.push(b);
        p.appendChild(b);
      });
      spazio.appendChild(p);
      spazio.appendChild(spiega);
      bottoni[0].click();
      var ancora = bottone("Rimettila in disordine e riprova", "secondario");
      ancora.addEventListener("click", function () { mostraOrdina(true); });
      spazio.appendChild(ancora);
    }

    function mostraOrdina(fuoco) {
      svuota(spazio);
      spazio.appendChild(el("p", null,
        "In cima metti la fonte più forte, in fondo la più debole. Sposta le fonti con le frecce ▲ e ▼, poi premi Controlla l'ordine."));

      var ordine = liv.map(function (l, i) { return i; });
      var giro = 0;
      do { ordine = mescola(ordine); giro++; }
      while (giro < 20 && ordine.every(function (x, i) { return x === i; }));

      var controllato = false;
      var lista = el("ol", "ordina");
      lista.setAttribute("aria-label", "Le fonti, dalla più forte alla più debole");
      var esito = el("p", "esito");
      esito.setAttribute("aria-live", "polite");

      function disegna(fuocoSu) {
        svuota(lista);
        ordine.forEach(function (idx, pos) {
          var li = el("li");
          var giusta = idx === pos;
          if (controllato && !giusta) { li.classList.add("fuori-posto"); }
          li.appendChild(el("span", "posto", (pos + 1) + "."));
          li.appendChild(el("span", "nome-fonte", liv[idx].nome));
          if (controllato) {
            var s = el("span", "segno", giusta ? "✓" : "✗");
            s.setAttribute("aria-hidden", "true");
            li.appendChild(s);
            li.appendChild(soloLettori(giusta ? " al posto giusto" : " al posto sbagliato"));
          }
          var su = bottone("▲");
          su.setAttribute("aria-label", "Sposta più in alto: " + liv[idx].nome);
          su.disabled = pos === 0;
          su.addEventListener("click", function () { sposta(pos, -1); });
          var giu = bottone("▼");
          giu.setAttribute("aria-label", "Sposta più in basso: " + liv[idx].nome);
          giu.disabled = pos === ordine.length - 1;
          giu.addEventListener("click", function () { sposta(pos, 1); });
          li.appendChild(su);
          li.appendChild(giu);
          lista.appendChild(li);
          if (fuocoSu && fuocoSu.idx === idx) {
            var scelto = fuocoSu.verso < 0 ? (su.disabled ? giu : su) : (giu.disabled ? su : giu);
            fuocoSu.bottone = scelto;
          }
        });
        if (fuocoSu && fuocoSu.bottone) { fuocoSu.bottone.focus(); }
      }

      function sposta(pos, verso) {
        var altro = pos + verso;
        if (altro < 0 || altro >= ordine.length) { return; }
        var idx = ordine[pos];
        ordine[pos] = ordine[altro];
        ordine[altro] = idx;
        controllato = false;
        esito.textContent = "";
        disegna({ idx: idx, verso: verso });
      }

      var controlla = bottone("Controlla l'ordine");
      controlla.addEventListener("click", function () {
        controllato = true;
        var giuste = ordine.filter(function (x, i) { return x === i; }).length;
        if (giuste === ordine.length) {
          segnaFatto(a.id, "piramide");
          mostraPiramide(true);
          metti_a_fuoco(spazio.firstChild);
          return;
        }
        disegna(null);
        esito.className = "esito";
        esito.textContent = "✗ " + giuste + " fonti su " + ordine.length +
          " sono al posto giusto. Sposta quelle segnate con ✗ e controlla di nuovo.";
      });

      spazio.appendChild(lista);
      spazio.appendChild(controlla);
      spazio.appendChild(esito);
      disegna(null);
      if (fuoco) { metti_a_fuoco(spazio.firstChild); }
    }

    if (eFatto(a.id, "piramide")) { mostraPiramide(false); } else { mostraOrdina(false); }
  }


  /* ----- l'età: esplorare con il cursore ----- */

  function stato(azione, anni) {
    if (anni >= azione.da) { return "si"; }
    if (azione.prima && anni >= azione.prima.eta) { return "condizioni"; }
    return "no";
  }

  var FRASI_STATO = {
    si: "✓ Sì, può farlo",
    condizioni: "◐ Solo a certe condizioni",
    no: "✗ Non ancora"
  };

  function anniTesto(n) {
    return n === 1 ? "1 anno" : n + " anni";
  }

  function esploraEta(d) {
    var sez = el("section", "riquadro");
    sez.appendChild(el("h3", null, "1. Sposta l'età"));

    var etichetta = el("label", null, "Età della persona");
    etichetta.setAttribute("for", "cursore-eta");
    sez.appendChild(etichetta);
    var grande = el("output", "eta-grande");
    grande.setAttribute("for", "cursore-eta");
    var cursore = el("input");
    cursore.type = "range";
    cursore.id = "cursore-eta";
    cursore.min = "0";
    cursore.max = String(ETA_MASSIMA);
    cursore.step = "1";
    cursore.value = "15";
    sez.appendChild(grande);
    sez.appendChild(cursore);

    var righe = el("div", "riga-pulsanti");
    var meno = bottone("− 1 anno", "secondario");
    var piu = bottone("+ 1 anno", "secondario");
    righe.appendChild(meno);
    righe.appendChild(piu);
    sez.appendChild(righe);

    var riassunto = el("p", "riassunto-eta");
    riassunto.setAttribute("aria-live", "polite");
    sez.appendChild(riassunto);

    var lista = el("ul", "azioni");
    sez.appendChild(lista);

    var voci = d.azioni.map(function (az) {
      var li = el("li");
      var ic = el("span", "icona-azione", az.icona);
      ic.setAttribute("aria-hidden", "true");
      li.appendChild(ic);
      li.appendChild(el("span", "nome-azione", az.nome));
      var st = el("span", "stato");
      li.appendChild(st);
      var sp = el("p", "spiega");
      li.appendChild(sp);
      lista.appendChild(li);
      return { az: az, st: st, sp: sp };
    });

    function aggiorna() {
      var anni = parseInt(cursore.value, 10);
      grande.textContent = anniTesto(anni);
      cursore.setAttribute("aria-valuetext", anniTesto(anni));
      meno.disabled = anni <= 0;
      piu.disabled = anni >= ETA_MASSIMA;
      riassunto.textContent = anni >= 18 ?
        "A " + anniTesto(anni) + ": capacità giuridica sì, dalla nascita. Capacità di agire piena, perché ha compiuto 18 anni." :
        "A " + anniTesto(anni) + ": capacità giuridica sì, dalla nascita. Capacità di agire non ancora piena: lo diventa a 18 anni.";
      voci.forEach(function (v) {
        var s = stato(v.az, anni);
        v.st.className = "stato " + s;
        var frase = FRASI_STATO[s];
        if (s === "no") {
          frase += v.az.prima ?
            ": a certe condizioni da " + anniTesto(v.az.prima.eta) + ", da solo da " + anniTesto(v.az.da) :
            ": da " + anniTesto(v.az.da);
        }
        v.st.textContent = frase;
        v.sp.textContent = s === "condizioni" && v.az.prima.testo ?
          v.az.prima.testo + " " + v.az.spiegazione : v.az.spiegazione;
      });
    }

    cursore.addEventListener("input", aggiorna);
    meno.addEventListener("click", function () { cursore.value = String(Math.max(0, +cursore.value - 1)); aggiorna(); });
    piu.addEventListener("click", function () { cursore.value = String(Math.min(ETA_MASSIMA, +cursore.value + 1)); aggiorna(); });
    aggiorna();

    app.appendChild(sez);
  }


  /* ----- l'età: la sfida ----- */

  function sfidaEta(a, d) {
    var sez = el("section", "riquadro");
    sez.appendChild(el("h3", null, "2. Mettiti alla prova"));
    sez.appendChild(el("p", null,
      "Ti diamo un'età e un'azione: decidi se quella persona può farlo. Ogni azione indovinata conta per i tuoi progressi."));
    var conto = el("p", "nota-piccola");
    sez.appendChild(conto);
    var area = el("div");
    sez.appendChild(area);
    app.appendChild(sez);

    var giuste = 0, fatte = 0, ultima = null;

    /* Le età proposte stanno vicino ai confini, dove si sbaglia. */
    function etaDaProporre(az) {
      var c = [az.da - 1, az.da, az.da + 2];
      if (az.prima) { c.push(az.prima.eta - 1, az.prima.eta); }
      if (az.da === 0) { c = [0, 3, 10]; }
      c = c.filter(function (n) { return n >= 0 && n <= ETA_MASSIMA; });
      return c[Math.floor(Math.random() * c.length)];
    }

    function nuova(fuoco) {
      svuota(area);
      conto.textContent = fatte === 0 ? "" : "In questa sessione: " + giuste + " giuste su " + fatte + ".";
      var daFare = d.azioni.filter(function (az) { return !eFatto(a.id, az.nome) && az !== ultima; });
      if (daFare.length === 0) { daFare = d.azioni.filter(function (az) { return az !== ultima; }); }
      if (daFare.length === 0) { daFare = d.azioni; }
      var az = daFare[Math.floor(Math.random() * daFare.length)];
      ultima = az;
      var anni = etaDaProporre(az);
      var giusto = stato(az, anni);

      var h = el("h4", null, "Può farlo?");
      area.appendChild(h);
      var dl = el("dl", "situazione");
      dl.appendChild(el("dt", null, "Età"));
      dl.appendChild(el("dd", null, anniTesto(anni)));
      dl.appendChild(el("dt", null, "Azione"));
      dl.appendChild(el("dd", null, (az.icona ? az.icona + " " : "") + az.nome));
      area.appendChild(dl);

      var opzioni = el("div", "opzioni");
      opzioni.setAttribute("role", "group");
      opzioni.setAttribute("aria-label", "Risposte possibili");
      var esito = el("div");
      esito.setAttribute("aria-live", "polite");
      var risposto = false;

      ["si", "condizioni", "no"].forEach(function (chiave) {
        var b = bottone(null, "opzione");
        var segno = el("span", "segno");
        segno.setAttribute("aria-hidden", "true");
        b.appendChild(segno);
        b.appendChild(el("span", null, { si: "Sì, può farlo da solo", condizioni: "Solo a certe condizioni", no: "No, non ancora" }[chiave]));
        b.addEventListener("click", function () {
          if (risposto) { return; }
          risposto = true;
          fatte++;
          var bene = chiave === giusto;
          if (bene) { giuste++; segnaFatto(a.id, az.nome); }
          segno.textContent = bene ? "✓" : "✗";
          b.classList.add(bene ? "giusta" : "sbagliata");
          [].forEach.call(opzioni.querySelectorAll("button"), function (x) { x.setAttribute("aria-disabled", "true"); });

          var regola = "Si può fare da solo dai " + anniTesto(az.da) +
            (az.prima ? "; a certe condizioni già dai " + anniTesto(az.prima.eta) : "") + ".";
          if (az.da === 0) { regola = "Si può fin dalla nascita."; }
          esito.appendChild(el("p", bene ? "esito bene" : "esito",
            (bene ? "✓ Giusto! " : "✗ Non è così. ") + "La risposta è: " + FRASI_STATO[giusto].slice(2) + "."));
          var sp = el("p", "spiega-opzione", regola + " " +
            (giusto === "condizioni" && az.prima.testo ? az.prima.testo + " " : "") + az.spiegazione);
          esito.appendChild(sp);
          conto.textContent = "In questa sessione: " + giuste + " giuste su " + fatte + ".";
          var altra = bottone("Un'altra domanda →");
          altra.addEventListener("click", function () { nuova(true); });
          esito.appendChild(altra);
        });
        opzioni.appendChild(b);
      });

      area.appendChild(opzioni);
      area.appendChild(esito);
      if (fuoco) { metti_a_fuoco(h); }
    }

    nuova(false);
  }


  /* ----- la mappa degli organi ----- */

  function mappaOrgani(a, d) {
    var sez = el("section", "riquadro");
    sez.appendChild(el("h3", null, "La mappa dei poteri"));
    var scheda = el("div", "compito-attuale");
    sez.appendChild(scheda);
    var mappa = el("div", "mappa");
    sez.appendChild(mappa);
    app.appendChild(sez);

    var caselle = d.organi.map(function (o) {
      var box = el("div", "organo");
      var b = bottone(null);
      var ic = el("span", "icona-organo", o.icona);
      ic.setAttribute("aria-hidden", "true");
      b.appendChild(ic);
      b.appendChild(document.createTextNode(o.nome));
      if (o.potere) { b.appendChild(el("span", "potere", o.potere)); }
      var ul = el("ul");
      ul.setAttribute("aria-label", "Compiti di " + o.nome);
      box.appendChild(b);
      box.appendChild(ul);
      mappa.appendChild(box);
      return { o: o, b: b, ul: ul };
    });

    function colloca(c) {
      var casella = caselle.filter(function (x) { return x.o === c.organo; })[0];
      casella.ul.appendChild(el("li", null, c.testo));
    }

    /* I compiti già risolti le volte scorse sono già al loro posto. */
    d.compiti.forEach(function (c) { if (eFatto(a.id, c.testo)) { colloca(c); } });
    var coda = mescola(d.compiti.filter(function (c) { return !eFatto(a.id, c.testo); }));
    var attuale = null;
    var risolto = false;

    function prossimo(fuoco) {
      svuota(scheda);
      attuale = coda.shift() || null;
      risolto = false;
      if (!attuale) {
        var fine = el("p", "testo-compito", "✓ Mappa completata!");
        scheda.appendChild(fine);
        scheda.appendChild(el("p", null,
          "Guarda la mappa qui sotto: ogni organo ha i suoi compiti, e nessuno li ha tutti. È questa la separazione dei poteri."));
        if (fuoco) { metti_a_fuoco(fine); }
        return;
      }
      var fatti_ = d.compiti.length - coda.length;
      scheda.appendChild(el("p", "etichetta-anno", "Compito " + fatti_ + " di " + d.compiti.length));
      var t = el("p", "testo-compito", attuale.testo);
      scheda.appendChild(t);
      scheda.appendChild(el("p", "nota-piccola", "Chi lo fa? Scegli l'organo qui sotto."));
      var esito = el("div");
      esito.setAttribute("aria-live", "polite");
      scheda.appendChild(esito);
      scheda.esito = esito;
      if (fuoco) { metti_a_fuoco(t); }
    }

    caselle.forEach(function (casella) {
      casella.b.addEventListener("click", function () {
        if (!attuale || risolto) { return; }
        var esito = scheda.esito;
        svuota(esito);
        if (casella.o === attuale.organo) {
          risolto = true;
          segnaFatto(a.id, attuale.testo);
          colloca(attuale);
          esito.appendChild(el("p", "esito bene", "✓ Giusto! Organo: " + attuale.organo.nome + "."));
          if (attuale.spiegazione) { esito.appendChild(el("p", "spiega-opzione", attuale.spiegazione)); }
          var avanti = bottone(coda.length > 0 ? "Prossimo compito →" : "Vedi la mappa completa");
          avanti.addEventListener("click", function () { prossimo(true); });
          esito.appendChild(avanti);
          avanti.focus();
        } else {
          esito.appendChild(el("p", "esito", "✗ Questo compito non spetta all'organo che hai scelto (" + casella.o.nome + "). Prova con un altro."));
        }
      });
    });

    prossimo(false);
  }


  /* =================================================================
     AVVIO
     ================================================================= */

  function trova(id) {
    return ATTIVITA.filter(function (a) { return a.id === id; })[0] || null;
  }

  function vai() {
    var a = trova(location.hash.replace(/^#/, ""));
    if (a && dati[a.id] && dati[a.id].ok) { mostraAttivita(a); } else { mostraBacheca(); }
  }

  Promise.all(ATTIVITA.map(carica)).then(function () {
    window.addEventListener("hashchange", vai);
    vai();
  });
}());
