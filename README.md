# Liceo digitale

Sito didattico dell'IIS Giulio Natta che raccoglie gli artefatti
digitali costruiti dai docenti. È un sito statico, senza librerie
esterne e senza passaggi di compilazione: i file che stanno in questa
cartella sono esattamente quelli che finiscono online.

Indirizzo del sito:
https://alessandraenrietta-ship-it.github.io/liceo-digitale/

## Come è fatto

| Percorso | Che cos'è |
|---|---|
| `artefatti.txt` | **Il registro**: governa il sito, una riga per artefatto |
| `index.html` | La pagina iniziale |
| `stile.css` | Il foglio di stile comune a tutte le pagine |
| `js/home.js` | Legge il registro e costruisce la pagina iniziale |
| `js/artefatto.js` | Fa funzionare le pagine degli artefatti a linea del tempo |
| `specifica-comune.md` | Le regole da dare ai colleghi che costruiscono un artefatto |
| `CLAUDE.md` | Le regole del progetto |
| `anteprima.bat` | Apre il sito sul computer, senza pubblicarlo |

Ogni artefatto sta in una cartella propria, chiamata
`disciplina-titolo`: tutto minuscolo, parole separate da trattini,
senza spazi e senza accenti.

## Come si aggiunge un artefatto

Si scrive una riga in `artefatti.txt`. Non serve toccare il codice.

Cinque campi separati dalla barra verticale, in quest'ordine:

    titolo | disciplina | destinatario | cartella | descrizione

Il nome della disciplina va copiato **esattamente** come compare
nell'elenco in fondo al registro, fra le righe `INIZIO ELENCO
DISCIPLINE` e `FINE ELENCO DISCIPLINE`. Il destinatario vale
`studenti`, `docenti` oppure `entrambi`.

Finché il lavoro non è consegnato si lascia scritto `DA COMPILARE` al
posto della cartella: l'artefatto compare come in preparazione, senza
diventare un collegamento rotto.

Le righe che iniziano con `#` sono note e vengono ignorate. Una riga
scritta male non blocca il sito: viene saltata e segnalata in fondo
alla pagina iniziale.

## La pagina iniziale

Mostra tutte le discipline dell'elenco. Quelle che hanno almeno una
riga nel registro si aprono; le altre compaiono spente, con la scritta
"in costruzione".

Ci sono due sezioni, studenti e docenti. Tutte e due chiedono una
parola d'ordine, e tutte e due le parole si trovano in cima a
`js/home.js`.

**Quelle parole non proteggono niente.** Il repository è pubblico e il
file è leggibile da chiunque. Servono solo a tenere separati i due
pubblici: non vanno usate per nascondere qualcosa di riservato.

## Quando si modifica stile.css o un file js

Nelle pagine i due file sono richiamati con un numero in fondo, per
esempio `stile.css?v=2`. Quel numero va **aumentato di uno** ogni volta
che il file cambia.

Serve a costringere il browser a riscaricarli: senza, chi ha già
visitato il sito continua a vedere la versione vecchia per una decina
di minuti, e sembra che la modifica non sia stata pubblicata.

I file di testo dei contenuti non hanno questo problema: si aggiornano
da soli.

## Per vedere le modifiche prima di pubblicarle

Doppio clic su `anteprima.bat`: si apre il sito letto dalla cartella di
questo computer. Aprire `index.html` con un doppio clic invece non
funziona, perché i browser non lasciano leggere i file della cartella a
una pagina aperta dal disco.
