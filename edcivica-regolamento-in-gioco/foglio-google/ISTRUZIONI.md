# Il Regolamento in Gioco: le risposte dai telefoni

Guida passo per passo, pensata per chi non programma. Non serve capire
il codice: serve incollarlo nel posto giusto e premere i pulsanti nel
giusto ordine.

**Tempo:** una ventina di minuti, una volta sola.

**Prima di cominciare:** entra in Google con **l'account della scuola**,
non con quello personale. Le risposte dei ragazzi finiranno nel Drive di
quell'account.

---

## Che cosa si ottiene

Oggi, nel Regolamento in Gioco, i gruppi leggono il caso sul telefono ma
la risposta la dettano all'insegnante. Dopo questi passi, i gruppi
scrivono la risposta sul telefono e premono **Invia**, e la risposta
compare da sola nella **Bacheca** dello schermo proiettato, con il tempo
impiegato e il confronto con il regolamento.

Le risposte vengono scritte, una per riga, in un Foglio Google tuo. Lo
schermo proiettato va a leggerle lì ogni pochi secondi.

---

## Due parole sui termini che incontrerai

- **Foglio Google**: il foglio di calcolo, come Excel ma online. Qui fa
  da archivio delle risposte.
- **Apps Script**: il posto, dentro al foglio, dove si incolla il
  piccolo programma che riceve le risposte.
- **Web app**: l'indirizzo internet di quel programma. È quello a cui i
  telefoni mandano le risposte.
- **Distribuzione** (in inglese *deployment*): la pubblicazione della
  web app.

---

## Passo 1. Crea il foglio

1. Vai su **drive.google.com** con l'account della scuola.
2. **Nuovo**, poi **Fogli Google**, poi **Foglio di lavoro vuoto**.
3. Dagli un nome, in alto a sinistra: `Regolamento in Gioco - risposte`.

Lascialo aperto.

---

## Passo 2. Incolla il programma

1. Nel menu in alto del foglio: **Estensioni**, poi **Apps Script**.
   Si apre una scheda nuova con un file chiamato `Codice.gs` che
   contiene tre righe di esempio.
2. Clicca dentro all'area del codice, seleziona tutto (`Ctrl+A`) e
   cancella.
3. Apri il file `Codice.gs` di questa cartella, seleziona tutto, copia,
   e incolla nell'editor.
4. Premi l'icona del **dischetto** per salvare.

---

## Passo 3. Prepara la scheda delle risposte

1. In alto, nella barra dell'editor, c'è un menu a tendina con i nomi
   delle funzioni. Scegli **configuraFoglio**.
2. Premi **Esegui**.
3. Google ti chiede le autorizzazioni. È normale: stai dando il permesso
   a un programma tuo di scrivere in un foglio tuo.
   - **Rivedi le autorizzazioni**
   - scegli l'account della scuola
   - compare un avviso che dice che l'app non è verificata: premi
     **Avanzate**, poi **Apri ... (non sicuro)**. "Non sicuro" qui vuol
     dire soltanto che Google non ha esaminato questo programma, non che
     ci sia qualcosa che non va.
   - **Consenti**
4. Torna al foglio: è comparsa la scheda **Risposte**, con i titoli
   delle colonne in grassetto.

---

## Passo 4. Pubblica la web app

Torna alla scheda di Apps Script.

1. In alto a destra: **Distribuisci**, poi **Nuova distribuzione**.
2. Accanto a **Seleziona tipo**, l'icona dell'ingranaggio, poi
   **Applicazione web**.
3. Compila così:
   - **Descrizione**: `Prima versione`
   - **Esegui come**: **Io** (il tuo indirizzo della scuola)
   - **Chi ha accesso**: **Chiunque**
4. **Distribuisci**.
5. Copia l'indirizzo che compare, quello che comincia con
   `https://script.google.com/` e finisce con `/exec`.

### Perché qui "Chiunque", mentre per il carrello no

I telefoni dei ragazzi non entrano con un account: aprono il sito e
basta. Con "Chiunque all'interno del dominio" Google chiederebbe a ogni
telefono di accedere, e le risposte non partirebbero.

Che cosa vuol dire, in pratica, "Chiunque":

- chi conosce l'indirizzo può **mandare** una risposta, e **leggere**
  le risposte di una partita solo se ne conosce il codice, che cambia a
  ogni partita e compare solo nel codice QR proiettato in classe;
- **nessuno può cancellare o modificare** niente: il foglio lo vedi e
  lo tocchi solo tu;
- il programma controlla ogni risposta: lunghezza massima dei testi,
  caso esistente, al massimo 150 risposte per partita.

---

## Passo 5. Prova l'indirizzo

Apri una scheda nuova del browser e incolla l'indirizzo copiato,
aggiungendo in fondo `?partita=ABCDEF`. Per esempio:

```
https://script.google.com/macros/s/.../exec?partita=ABCDEF
```

Deve comparire una riga di testo come questa:

```
{"ok":true,"risposte":[]}
```

Vuol dire che funziona, e che per quella partita non ci sono ancora
risposte. Se invece compare una pagina di accesso di Google, al passo 4
non hai scelto "Chiunque".

---

## Passo 6. Collega il foglio al sito

Questo passo lo fa Claude, oppure chi cura il sito: basta dargli
l'indirizzo.

L'indirizzo va incollato, su una riga da sola, nel file
`foglio-google.txt` della cartella `edcivica-regolamento-in-gioco`.
Quando il sito viene pubblicato, l'invio dai telefoni si accende da
solo. Per spegnerlo basta cancellare l'indirizzo.

---

## Passo 7. Prova in classe (o a casa, con due dispositivi)

1. Sul computer apri il Regolamento in Gioco dal sito pubblicato, e vai
   su **Inquadra col telefono**.
2. Inquadra il codice QR con il telefono. Scegli un caso, scrivi un nome
   di fantasia, apri il caso, scrivi qualcosa e premi **Invia**.
3. Sul computer apri **Bacheca**: entro qualche secondo compare la
   risposta.
4. Guarda il foglio: nella scheda Risposte c'è una riga nuova.

---

## Da sapere

- **Reimposta il gioco** cambia il codice della partita. Le risposte
  vecchie spariscono dalla bacheca, ma **nel foglio restano**. Il codice
  QR cambia, quindi i gruppi devono inquadrarlo di nuovo.
- **Pulire il foglio**: ogni tanto, dal foglio stesso, cancella le righe
  che non servono più. Le risposte sono testi scritti dai ragazzi:
  meglio non tenerle più del necessario.
- **I nomi dei gruppi**: il telefono ricorda di usare un nome di
  fantasia. Se qualcuno scrive nomi veri, li trovi nel foglio e li puoi
  cancellare.
- **Privacy**: le risposte restano nel Drive dell'account della scuola,
  non in un servizio esterno. Conviene comunque informarne il
  responsabile privacy della scuola.

---

## Se in futuro cambi il programma

Ogni volta che modifichi `Codice.gs`, la web app continua a usare la
versione vecchia finché non aggiorni la distribuzione:

**Distribuisci**, poi **Gestisci distribuzioni**, l'icona della matita,
in **Versione** scegli **Nuova versione**, poi **Distribuisci**.
L'indirizzo resta lo stesso, e il sito non va toccato.

Se invece fai "Nuova distribuzione" ottieni un indirizzo diverso, e
bisogna rimetterlo in `foglio-google.txt`.
