/* ==================================================================
   MODALITÀ CHIARA E MODALITÀ SCURA

   Il sito si apre sempre chiaro. Chi preferisce lo scuro lo accende
   con l'interruttore che sta sulla pagina iniziale, e da quel momento
   tutte le pagine del sito si aprono scure su quel computer.

   COME FUNZIONA
   Questo file scrive una parola sopra la pagina (data-tema="scuro").
   I colori veri stanno in stile.css: lì c'è un elenco di colori per il
   chiaro e uno per lo scuro. Qui non c'è nessun colore.

   COME SI USA IN UNA PAGINA NUOVA
   Nella testa della pagina, PRIMA del foglio di stile:

       <script src="../js/tema.js?v=1"></script>

   Va messo lì e non in fondo: così la pagina nasce già del colore
   giusto e non si vede il lampo bianco prima del cambio.

   Per far comparire l'interruttore (serve solo sulla pagina iniziale),
   nel corpo della pagina si mette un contenitore vuoto:

       <div id="interruttore-tema"></div>

   e in fondo alla pagina:

       <script>Tema.interruttore('interruttore-tema');</script>

   COSA VIENE SALVATO
   Soltanto la parola "chiaro" o "scuro", nel browser di chi sceglie.
   Nessun dato personale, niente che esca dal computer.
   ================================================================== */

window.Tema = (function () {
  "use strict";

  var NOME = "liceo-digitale-tema";
  var CHIARO = "chiaro";
  var SCURO = "scuro";

  function leggi() {
    try {
      return localStorage.getItem(NOME) === SCURO ? SCURO : CHIARO;
    } catch (e) {
      /* In navigazione anonima non si può salvare niente: pazienza,
         la pagina resta chiara. */
      return CHIARO;
    }
  }

  function salva(quale) {
    try {
      localStorage.setItem(NOME, quale);
    } catch (e) {
      /* niente da fare */
    }
  }

  function applica(quale) {
    document.documentElement.setAttribute("data-tema", quale);
  }

  /* Si applica subito, appena il file viene letto: la pagina non è
     ancora comparsa sullo schermo e non si vede nessun cambio. */
  applica(leggi());

  function interruttore(dove) {
    var contenitore = document.getElementById(dove);
    if (!contenitore) { return; }

    var bottone = document.createElement("button");
    bottone.type = "button";
    bottone.className = "interruttore-tema";
    contenitore.appendChild(bottone);

    function aggiorna() {
      var scuro = leggi() === SCURO;
      /* Sull'interruttore c'è solo il segno: il sole quando si può
         tornare chiari, la luna quando si può passare allo scuro.
         La frase per esteso resta nel suggerimento che compare
         passandoci sopra, e la leggono anche i lettori di schermo:
         senza, chi non vede il disegno non saprebbe che cos'è. */
      bottone.textContent = scuro ? "☀" : "☾";
      var frase = scuro ? "Passa ai colori chiari" : "Passa ai colori scuri";
      bottone.title = frase;
      bottone.setAttribute("aria-label", frase);
      bottone.setAttribute("aria-pressed", scuro ? "true" : "false");
    }

    bottone.addEventListener("click", function () {
      var nuovo = leggi() === SCURO ? CHIARO : SCURO;
      salva(nuovo);
      applica(nuovo);
      aggiorna();
    });

    aggiorna();
  }

  return { applica: applica, leggi: leggi, interruttore: interruttore };
}());
