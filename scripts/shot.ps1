# Real-time screenshots through the Chrome DevTools protocol.
# shot.ps1 -Urls "url1|out1.png;url2|out2.png" -Wait 6000 [-Dark]
param([string]$Urls,[int]$Wait=6000,[switch]$Dark,[int]$W=390,[int]$H=844)
$ErrorActionPreference='Stop'
$prof = Join-Path $env:TEMP 'lgshot'
if (Test-Path $prof) { Remove-Item -Recurse -Force $prof }
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$p = Start-Process $chrome -ArgumentList @('--headless=new','--disable-gpu','--hide-scrollbars',"--user-data-dir=$prof",'--remote-debugging-port=9334',"--window-size=$W,$H",'about:blank') -PassThru
try {
  $tgt=$null; for($i=0;$i -lt 50 -and -not $tgt;$i++){ Start-Sleep -Milliseconds 200; try { $tgt = (Invoke-RestMethod http://127.0.0.1:9334/json) | Where-Object { $_.type -eq 'page' } | Select-Object -First 1 } catch {} }
  $ws = New-Object System.Net.WebSockets.ClientWebSocket; $ws.Options.KeepAliveInterval=[TimeSpan]::Zero
  $ws.ConnectAsync([Uri]$tgt.webSocketDebuggerUrl,[Threading.CancellationToken]::None).Wait()
  $script:id=0
  function Send($method,$params){ $script:id++; $msg = @{id=$script:id;method=$method;params=$params} | ConvertTo-Json -Depth 8 -Compress
    $b=[Text.Encoding]::UTF8.GetBytes($msg); $ws.SendAsync([ArraySegment[byte]]$b,'Text',$true,[Threading.CancellationToken]::None).Wait()
    $want=$script:id; while($true){ $ms=New-Object IO.MemoryStream; do { $buf=New-Object byte[] 1048576; $r=$ws.ReceiveAsync([ArraySegment[byte]]$buf,[Threading.CancellationToken]::None).Result; $ms.Write($buf,0,$r.Count) } while(-not $r.EndOfMessage)
      $o=[Text.Encoding]::UTF8.GetString($ms.ToArray()) | ConvertFrom-Json; if($o.id -eq $want){ return $o } } }
  Send 'Emulation.setDeviceMetricsOverride' @{width=$W;height=$H;deviceScaleFactor=1;mobile=$true} | Out-Null
  Send 'Emulation.setEmulatedMedia' @{features=@(@{name='prefers-color-scheme';value=$(if($Dark){'dark'}else{'light'})})} | Out-Null
  foreach($pair in $Urls.Split(';')){ $u,$out = $pair.Split('|')
    Send 'Page.navigate' @{url=$u} | Out-Null; Start-Sleep -Milliseconds $Wait
    $s = Send 'Page.captureScreenshot' @{format='png'}
    [IO.File]::WriteAllBytes($out,[Convert]::FromBase64String($s.result.data)); "saved $out" }
} finally { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 500; Remove-Item -Recurse -Force $prof -ErrorAction SilentlyContinue }
