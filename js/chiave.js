/* ==================================================================
   IL RIQUADRO DELLA CHIAVE DI ACCESSO PERSONALE

   Serve agli artefatti che chiedono aiuto a un servizio esterno, come
   Gemini di Google, e che per farlo hanno bisogno di una chiave.

   PERCHE' ESISTE QUESTO FILE
   Il sito e' pubblico: una chiave scritta dentro una pagina sarebbe
   leggibile da chiunque in pochi secondi. Quindi nessuna chiave sta
   nel codice. Ognuno incolla la propria, che resta soltanto nel suo
   browser e non passa da nessun'altra parte.

   Prima ogni artefatto si costruiva il suo riquadro per conto proprio.
   Ora ce n'e' uno solo: se un giorno cambia il testo o il modo di
   salvare, si corregge qui e cambia dappertutto.

   COME SI USA IN UNA PAGINA NUOVA
   Nel file dell'artefatto si scrive, dove deve comparire il riquadro:

       <div id="riquadro-chiave"></div>

   e in fondo alla pagina, prima del proprio script:

       <script src="../js/chiave.js"></script>

   poi, nel proprio script:

       ChiavePersonale.prepara({
         dove: 'riquadro-chiave',
         nome: 'liceo-digitale-chiave-NOMEARTEFATTO',
         aCosaServe: 'costruisce lo schema'
       });

   e al momento di chiamare il servizio:

       var chiave = ChiavePersonale.leggi('liceo-digitale-chiave-NOMEARTEFATTO');
       if (!chiave) { ...avvisa e fermati... }

   Il campo "nome" deve essere diverso per ogni artefatto: e' l'etichetta
   con cui la chiave viene messa da parte nel browser.
   ================================================================== */

window.ChiavePersonale = (function () {
  "use strict";

  function leggi(nome) {
    try {
      return localStorage.getItem(nome) || "";
    } catch (e) {
      /* Alcuni browser, in navigazione anonima, non lasciano salvare
         niente. In quel caso la chiave semplicemente non c'e'. */
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

  function prepara(opzioni) {
    var contenitore = document.getElementById(opzioni.dove);
    if (!contenitore) { return; }

    var nome = opzioni.nome;
    var aCosaServe = opzioni.aCosaServe || "funziona";

    contenitore.innerHTML =
      '<h2>Chiave di accesso personale</h2>' +
      '<p>Questa pagina ' + aCosaServe + ' chiedendo aiuto al servizio ' +
      'Gemini di Google, che richiede una chiave personale gratuita per ' +
      'funzionare. La chiave resta soltanto in questo browser: non viene ' +
      'mai scritta nel codice del sito e non passa da nessun\'altra ' +
      'parte. Si ottiene gratuitamente su ' +
      '<a href="https://aistudio.google.com/apikey" target="_blank" ' +
      'rel="noopener">Google AI Studio</a>, con un account Google.</p>' +
      '<p><strong>Da sapere:</strong> con la chiave gratuita, Google puo\' ' +
      'usare il testo che scrivi per migliorare i suoi servizi. Chi ' +
      'preferisce evitarlo puo\' usare una chiave a pagamento, che non ha ' +
      'questo effetto.</p>' +
      '<div class="chiave-riga">' +
      '  <label class="chiave-etichetta" for="chiave-campo">La tua chiave</label>' +
      '  <input type="password" id="chiave-campo" autocomplete="off" ' +
      '         placeholder="Incolla qui la tua chiave (inizia con AIza...)">' +
      '  <button type="button" id="chiave-salva">Salva chiave</button>' +
      '  <button type="button" id="chiave-rimuovi">Rimuovi chiave salvata</button>' +
      '</div>' +
      '<p class="chiave-stato" id="chiave-stato" role="status"></p>';

    var campo = document.getElementById('chiave-campo');
    var stato = document.getElementById('chiave-stato');

    function aggiornaStato(messaggio) {
      if (messaggio) {
        stato.textContent = messaggio;
      } else if (leggi(nome)) {
        stato.textContent = "Chiave salvata in questo browser: puoi usare la pagina.";
      } else {
        stato.textContent = "Nessuna chiave salvata: serve per usare la pagina.";
      }
    }

    document.getElementById('chiave-salva').addEventListener('click', function () {
      var valore = campo.value.trim();
      if (!valore) {
        aggiornaStato("Incolla prima la chiave nella casella.");
        campo.focus();
        return;
      }
      /* Capita di incollare per sbaglio la parola d'ordine della
         sezione invece della chiave: sono due cose diverse. */
      if (valore.length < 20) {
        aggiornaStato("Questa sembra troppo corta per essere una chiave. "
          + "La chiave di Google e' una sequenza lunga che inizia con AIza, "
          + "e non e' la parola d'ordine della sezione.");
        return;
      }
      if (salva(nome, valore)) {
        campo.value = "";
        aggiornaStato();
      } else {
        aggiornaStato("Questo browser non mi lascia salvare la chiave. "
          + "Di solito succede in navigazione anonima: prova in una "
          + "finestra normale.");
      }
    });

    document.getElementById('chiave-rimuovi').addEventListener('click', function () {
      dimentica(nome);
      campo.value = "";
      aggiornaStato("Chiave rimossa da questo browser.");
    });

    aggiornaStato();
  }

  return { prepara: prepara, leggi: leggi };
}());
