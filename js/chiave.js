/* ==================================================================
   IL RIQUADRO DELLA CHIAVE DI ACCESSO PERSONALE

   Serve agli artefatti che chiedono aiuto a un servizio esterno, come
   Gemini di Google, e che per farlo hanno bisogno di una chiave.

   PERCHÉ ESISTE QUESTO FILE
   Il sito è pubblico: una chiave scritta dentro una pagina sarebbe
   leggibile da chiunque in pochi secondi. Quindi nessuna chiave sta
   nel codice. Ognuno incolla la propria, che resta soltanto nel suo
   browser e non passa da nessun'altra parte.

   Prima ogni artefatto si costruiva il suo riquadro per conto proprio.
   Ora ce n'è uno solo: se un giorno cambia il testo o il modo di
   salvare, si corregge qui e cambia dappertutto.

   COME SI USA IN UNA PAGINA NUOVA
   Nel file dell'artefatto si scrive, dove deve comparire il riquadro:

       <div id="riquadro-chiave"></div>

   e in fondo alla pagina, prima del proprio script:

       <script src="../js/chiave.js"></script>

   poi, nel proprio script:

       ChiavePersonale.prepara({
         dove: 'riquadro-chiave',
         aCosaServe: 'costruisce lo schema',
         inPiu: 'una frase in più, solo per questo artefatto'   <- si può omettere
       });

   e al momento di chiamare il servizio:

       var chiave = ChiavePersonale.leggi('liceo-digitale-chiave-google');
       if (!chiave) { ...avvisa e fermati... }

   ATTENZIONE: tutti gli strumenti che usano Gemini devono usare lo
   STESSO nome, 'liceo-digitale-chiave-google'. È quello che permette di
   incollare la chiave una volta sola e ritrovarla in ogni strumento. Se
   un artefatto nuovo ne usasse uno suo, chi lo apre dovrebbe incollarla
   di nuovo. Il campo "nome" in prepara() si può omettere: vale già
   quello condiviso.
   ================================================================== */

window.ChiavePersonale = (function () {
  "use strict";

  /* Tutti gli strumenti che usano Gemini condividono la stessa chiave:
     si incolla una volta e vale per tutti. Prima ognuno se la ricordava
     con un nome suo, e bisognava reinserirla in ogni strumento. */
  var NOME_CONDIVISO = "liceo-digitale-chiave-google";

  /* I nomi usati prima. Se qualcuno ha già la chiave salvata sotto uno
     di questi, la si sposta sul nome nuovo: così non deve reinserirla. */
  var NOMI_VECCHI = [
    "liceo-digitale-chiave-annotazioni",
    "liceo-digitale-chiave-tema-argomentativo"
  ];

  function leggi(nome) {
    try {
      return localStorage.getItem(nome) || "";
    } catch (e) {
      /* Alcuni browser, in navigazione anonima, non lasciano salvare
         niente. In quel caso la chiave semplicemente non c'è. */
      return "";
    }
  }

  function salva(nome, valore) {
    try {
      localStorage.setItem(nome, valore);
      return true;
    } catch (e) {
      return false;
    }
  }

  function dimentica(nome) {
    try {
      localStorage.removeItem(nome);
    } catch (e) {
      /* niente da fare */
    }
  }

  function recuperaDaiNomiVecchi(nome) {
    if (leggi(nome)) { return; }
    for (var i = 0; i < NOMI_VECCHI.length; i += 1) {
      var vecchia = leggi(NOMI_VECCHI[i]);
      if (vecchia) {
        salva(nome, vecchia);
        return;
      }
    }
  }

  /* La frase in più arriva da un file scritto a mano: se contiene
     per sbaglio un < o una &, deve comparire come tale e non come
     codice. */
  function testoSemplice(testo) {
    return String(testo)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /* Il riquadro ha due facce.
     Senza chiave: la spiegazione corta e la casella per incollarla.
     Con la chiave salvata: una riga sola con la chiave disegnata e un
     pulsantino per cambiarla. Chi ha gia' fatto la sua parte non deve
     rileggere le istruzioni ogni volta che apre la pagina. */
  function prepara(opzioni) {
    var contenitore = document.getElementById(opzioni.dove);
    if (!contenitore) { return; }

    var nome = opzioni.nome || NOME_CONDIVISO;
    var aCosaServe = opzioni.aCosaServe || "funziona";

    /* Una frase in piu', scritta dall'artefatto che chiama questo
       riquadro, per dire qualcosa che vale solo per lui. */
    var inPiu = opzioni.inPiu
      ? '<p class="chiave-in-piu">' + testoSemplice(opzioni.inPiu) + '</p>'
      : '';

    recuperaDaiNomiVecchi(nome);
    /* Una scatola leggera, non un riquadro come gli altri. */
    contenitore.classList.add("chiave-minima");

    function disegnaChiusa() {
      contenitore.classList.add('chiave-chiusa');
      contenitore.innerHTML =
        '<p class="chiave-riga-breve">' +
        '  <span class="chiave-segno" aria-hidden="true">&#128273;</span>' +
        '  <span class="chiave-detto">Chiave salvata</span>' +
        '  <button type="button" id="chiave-cambia">Cambia</button>' +
        '</p>';
      document.getElementById('chiave-cambia')
        .addEventListener('click', function () { disegnaAperta(true); });
    }

    function disegnaAperta(mettiAFuoco) {
      contenitore.classList.remove('chiave-chiusa');
      contenitore.innerHTML =
        /* Il minimo indispensabile: una riga che dice dove si prende la
           chiave e dove resta, la casella e il pulsante. Niente titolo
           grande, niente riga di stato fissa: gli avvisi compaiono solo
           quando c'è davvero qualcosa da dire. */
        '<p class="chiave-spiegazione">Serve una chiave gratuita di ' +
        '<a href="https://aistudio.google.com/apikey" target="_blank" ' +
        'rel="noopener">Google AI Studio</a>: resta in questo browser. ' +
        'Google può usare i testi inviati.</p>' +
        inPiu +
        '<div class="chiave-riga">' +
        '  <label class="chiave-etichetta solo-lettori" for="chiave-campo">La tua chiave di accesso</label>' +
        '  <input type="password" id="chiave-campo" autocomplete="off" ' +
        '         placeholder="Incolla qui la chiave (AIza...)">' +
        '  <button type="button" id="chiave-salva">Salva</button>' +
        (leggi(nome)
          ? '  <button type="button" id="chiave-rimuovi" class="chiave-secondario">Rimuovi</button>'
          : '') +
        '</div>' +
        '<p class="chiave-stato" id="chiave-stato" role="status"></p>';

      var campo = document.getElementById('chiave-campo');
      var stato = document.getElementById('chiave-stato');

      function aggiornaStato(messaggio) {
        stato.textContent = messaggio ? messaggio : "";
      }

      document.getElementById('chiave-salva').addEventListener('click', function () {
        var valore = campo.value.trim();
        if (!valore) {
          aggiornaStato("Incolla prima la chiave nella casella.");
          campo.focus();
          return;
        }
        /* Capita di incollare la password della sezione invece della
           chiave: sono due cose diverse. */
        if (valore.length < 20) {
          aggiornaStato("Troppo corta per essere una chiave: quella di Google "
            + "è lunga e inizia con AIza. Non è la password della sezione.");
          return;
        }
        if (salva(nome, valore)) {
          campo.value = "";
          disegnaChiusa();
        } else {
          aggiornaStato("Questo browser non mi lascia salvare la chiave. "
            + "Di solito succede in navigazione anonima.");
        }
      });

      /* Il pulsante "Rimuovi" c'è solo se una chiave c'è davvero. */
      var bottoneRimuovi = document.getElementById('chiave-rimuovi');
      if (bottoneRimuovi) { bottoneRimuovi.addEventListener('click', function () {
        dimentica(nome);
        campo.value = "";
        aggiornaStato("Chiave rimossa.");
      }); }

      if (mettiAFuoco) { campo.focus(); }
    }

    if (leggi(nome)) { disegnaChiusa(); } else { disegnaAperta(false); }
  }

  return { prepara: prepara, leggi: leggi };
}());
