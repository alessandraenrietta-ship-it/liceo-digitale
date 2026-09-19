# ------------------------------------------------------------
#  Anteprima del sito sul tuo computer.
#
#  Non si avvia da qui: fai doppio clic su anteprima.bat.
#  Questo file contiene le istruzioni che quello esegue.
# ------------------------------------------------------------

$cartella = Split-Path -Parent $MyInvocation.MyCommand.Path
$porta = 8123
$indirizzo = "http://localhost:$porta/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($indirizzo)

try {
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "Non sono riuscito ad avviare l'anteprima." -ForegroundColor Red
  Write-Host "Di solito succede se e' gia' aperta in un'altra finestra:"
  Write-Host "chiudila e riprova."
  Write-Host ""
  Read-Host "Premi Invio per chiudere"
  exit 1
}

Write-Host ""
Write-Host "  Anteprima avviata." -ForegroundColor Green
Write-Host "  Il sito e' visibile qui:  $indirizzo"
Write-Host ""
Write-Host "  Dopo ogni modifica ai testi, ricarica la pagina nel browser."
Write-Host "  Per fermare l'anteprima, chiudi questa finestra nera."
Write-Host ""

Start-Process $indirizzo

while ($listener.IsListening) {
  $contesto = $listener.GetContext()
  $percorso = $contesto.Request.Url.LocalPath

  # Un indirizzo che finisce con / vuol dire "la pagina di quella cartella"
  if ($percorso.EndsWith("/")) { $percorso = $percorso + "index.html" }

  $relativo = ($percorso.TrimStart("/")) -replace "/", "\"
  $file = Join-Path $cartella $relativo

  if (Test-Path -LiteralPath $file -PathType Leaf) {
    $contenuto = [System.IO.File]::ReadAllBytes($file)
    $estensione = [System.IO.Path]::GetExtension($file).ToLower()
    switch ($estensione) {
      ".html" { $tipo = "text/html; charset=utf-8" }
      ".css"  { $tipo = "text/css; charset=utf-8" }
      ".js"   { $tipo = "application/javascript; charset=utf-8" }
      ".txt"  { $tipo = "text/plain; charset=utf-8" }
      ".md"   { $tipo = "text/plain; charset=utf-8" }
      ".svg"  { $tipo = "image/svg+xml" }
      ".png"  { $tipo = "image/png" }
      ".jpg"  { $tipo = "image/jpeg" }
      ".jpeg" { $tipo = "image/jpeg" }
      ".gif"  { $tipo = "image/gif" }
      default { $tipo = "application/octet-stream" }
    }
    $contesto.Response.ContentType = $tipo
    $contesto.Response.Headers.Add("Cache-Control", "no-store")
    $contesto.Response.OutputStream.Write($contenuto, 0, $contenuto.Length)
  } else {
    $contesto.Response.StatusCode = 404
    $messaggio = [System.Text.Encoding]::UTF8.GetBytes(
      "Non trovato: $percorso"
    )
    $contesto.Response.ContentType = "text/plain; charset=utf-8"
    $contesto.Response.OutputStream.Write($messaggio, 0, $messaggio.Length)
  }

  $contesto.Response.Close()
}
