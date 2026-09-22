# Specifica comune - artefatti del sito Liceo digitale

Incolla questo testo all'inizio della tua sessione, prima di chiedere
qualsiasi cosa. Serve a far sì che i dieci artefatti stiano insieme in
un sito solo.

---

## Cosa costruire

Un artefatto vale se fa qualcosa che un materiale cartaceo non fa. Un
quiz è una scheda con un cronometro; riordinare eventi, confrontare due
versioni di un testo, provare una scelta e vederne subito la
conseguenza sono operazioni che sulla carta non si possono chiedere.
Parti da cosa vuoi che lo studente faccia, non da cosa vuoi mostrargli.

## Regole tecniche

Sto costruendo una pagina che entrerà in un sito scolastico pubblicato
con GitHub Pages. Rispetta queste regole:

**Una cartella, una pagina.** Tutto sta dentro una sola cartella, con
dentro un file index.html. Il nome della cartella è
`disciplina-titolo`, tutto minuscolo, con il trattino, senza spazi,
accenti o maiuscole.

**Nessuna libreria esterna.** Solo HTML, CSS e JavaScript scritti nel
file. Niente codice o caratteri tipografici caricati da internet: il
sito deve funzionare anche senza rete.

**Percorsi relativi.** Nessun riferimento a cartelle del mio computer.

**Nessuna chiave di accesso.** Il repository è pubblico: una chiave API
scritta nel codice è leggibile da chiunque. Se la pagina deve chiamare
un servizio esterno, la chiave va chiesta a chi usa la pagina e
conservata solo nel suo browser, con un pulsante per rimuoverla.

**Nessun dato reale.** Niente nomi di studenti, classi, docenti,
orari o aule veri. Usa dati inventati. Se lo strumento tratta un nome,
il nome resta sul computer di chi lo usa e non viene inviato da
nessuna parte.

**Contenuti separati dal codice.** Domande, testi, eventi, esempi
stanno in un file di testo a parte, che io possa modificare con il
Blocco note senza saper programmare. Scrivi in cima al file le
istruzioni per aggiungerne di nuovi. Se una riga è scritta male, non
bloccare tutto: saltala e segnala quale.

**Foglio di stile comune.** Collega il file `stile.css` che trovi nella
cartella principale del sito e usa i nomi dei colori definiti lì, non i
codici scritti a mano. Se scrivi i colori dentro la tua pagina, quando
cambierà l'identità visiva la tua pagina resterà indietro.

**Accessibile.** Caratteri grandi e leggibili, contrasto alto fra testo
e sfondo, mai il solo colore a indicare cosa succede, uso possibile con
la sola tastiera, funzionamento da telefono, testi brevi.

**Spiegami cosa fai** con parole semplici: non sono un programmatore.

---

## Prima di consegnare

Apri la pagina e provala davvero, anche dal telefono.

Controlla di non aver lasciato dentro chiavi, nomi veri o indirizzi che
puntano al tuo computer.

Consegna la **cartella intera**, non il codice incollato in un
messaggio.

Comunica le due informazioni che servono per il registro: il **titolo**
dell'artefatto come deve comparire sul sito e una **riga di
descrizione** che spieghi cosa fa.

Il nome della disciplina va copiato **esattamente** come compare
nell'elenco del registro: "Scienze naturali", non "Scienze". Se non
corrisponde, l'artefatto non compare da nessuna parte.
