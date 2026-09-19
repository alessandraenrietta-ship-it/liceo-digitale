# Liceo digitale

Piccolo sito didattico che raccoglie materiali e artefatti realizzati in
classe. È un sito statico, senza librerie esterne e senza passaggi di
compilazione: i file che stanno in questa cartella sono esattamente
quelli che finiscono online.

Indirizzo del sito:
https://alessandraenrietta-ship-it.github.io/liceo-digitale/

## Come è fatto

| Percorso | Che cos'è |
|---|---|
| `index.html` | La pagina di ingresso |
| `css/stile.css` | Colori, caratteri, spaziature |
| `js/sito.js` | Legge i testi e li mette nella pagina |
| `contenuti/home.txt` | I testi della pagina principale |
| `contenuti/artefatti.txt` | L'elenco degli artefatti |
| `CLAUDE.md` | Le regole del progetto |

## Come si cambiano i testi

I testi non stanno dentro il codice. Si modificano aprendo con un
normale editor di testo i file della cartella `contenuti`, che sono
scritti così:

    TITOLO: Liceo digitale

Si cambia quello che sta dopo i due punti. Le parole in maiuscolo
servono al sito per capire dove va ogni testo e vanno lasciate
com'erano. Le righe che iniziano con `#` sono note esplicative: sul
sito non compaiono mai.

Dentro i due file ci sono le istruzioni per esteso.

## Gli artefatti

Ogni artefatto sta in una cartella propria, chiamata
`disciplina-titolo`: tutto minuscolo, parole separate da trattini,
senza spazi e senza accenti. Per esempio
`storia-la-rivoluzione-francese`.

Perché compaia nell'elenco della pagina principale va aggiunto anche a
`contenuti/artefatti.txt`, dove si trova un modello già pronto da
copiare.
