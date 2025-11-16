# =========================================
# StudyWell E2E (ONE FLOW)
# Auth → /me → Academic Upload (OCR) → Semester Upload (optional)
# Google OAuth link → Calendar CRUD → Google Sync
# =========================================

# ----------- CONFIG -----------
$baseApi      = "http://127.0.0.1:3000/v1"
$authBase     = "$baseApi/auth"
$ingestBase   = "$baseApi/ingestion"
$calBase      = "$baseApi/calendar"
$gcalBase     = "$baseApi/google"

# Files (adjust paths)
$academicFile = "C:\Users\User\Downloads\ntu-academic-calendar-ay2025-26-(semester).pdf"
$semesterFile = "C:\Users\User\Downloads\Course(s) Registered - Academic Year 2025,Semester 1.pdf"  # "" to skip

# User creds
$email = "samson@gmail.com"
$name  = "Samson Li"
$pw    = "StrongPassw0rd!"

# Semester query (for timetable upload)
$semesterKey = "AY25/26 Sem 1"
$academicYear = "AY25/26"
$defaultYear = 2025
$altYear     = 2026
# ------------------------------

Write-Host "`n=== StudyWell E2E (Auth + Uploads + Google + CRUD + Sync) ===`n"

# ---------- Helpers ----------
function Show-WebErr([Parameter(Mandatory)][System.Management.Automation.ErrorRecord]$err) {
  $status = ""
  $body   = ""
  try { $status = [int]$err.Exception.Response.StatusCode } catch {}
  try {
    if ($err.ErrorDetails -and $err.ErrorDetails.Message) { $body = $err.ErrorDetails.Message }
    if (-not $body) {
      $resp = $err.Exception.Response
      if ($resp -and $resp.GetResponseStream) {
        $stream = $resp.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body   = $reader.ReadToEnd()
        $reader.Dispose(); $stream.Dispose()
      }
    }
  } catch {}
  if (-not $status) { $status = "n/a" }
  Write-Host ("Status: {0}" -f $status) -ForegroundColor Yellow
  if ($body) { Write-Host "Body: $body" -ForegroundColor Yellow } else { Write-Host ($err | Out-String) -ForegroundColor Yellow }
}

function New-HttpClient([string]$token) {
  Add-Type -AssemblyName System.Net.Http | Out-Null
  $handler = New-Object System.Net.Http.HttpClientHandler
  $client  = New-Object System.Net.Http.HttpClient($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(120)
  if ($token) { $client.DefaultRequestHeaders.Authorization = "Bearer $token" }
  return $client
}

function Upload-PdfMultipart([string]$url, [string]$filePath, [string]$token) {
  if (-not (Test-Path $filePath)) { throw "File not found: $filePath" }
  $client = New-HttpClient $token
  $mp  = New-Object System.Net.Http.MultipartFormDataContent
  $fs  = [System.IO.File]::OpenRead($filePath)
  $sc  = New-Object System.Net.Http.StreamContent($fs)
  $sc.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/pdf")
  $fname = [System.IO.Path]::GetFileName($filePath)
  $mp.Add($sc, "file", $fname)
  try {
    $resp = $client.PostAsync($url, $mp).Result
    $body = $resp.Content.ReadAsStringAsync().Result
    [PSCustomObject]@{ StatusCode = [int]$resp.StatusCode; Ok = $resp.IsSuccessStatusCode; Body = $body }
  } finally {
    $sc.Dispose(); $fs.Dispose(); $mp.Dispose(); $client.Dispose()
  }
}
# -----------------------------

# 0) Sanity
if (-not (Test-Path $academicFile)) { Write-Host "Academic file not found: $academicFile" -ForegroundColor Red; exit 1 }
if ($semesterFile -and -not (Test-Path $semesterFile)) {
  Write-Host "Semester file not found → skipping this part:" $semesterFile -ForegroundColor Yellow
  $semesterFile = ""
}

# 1) Register (idempotent)
Write-Host "→ Registering $email ..."
try {
  $null = Invoke-RestMethod -Uri "$authBase/register" -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body (@{ name = $name; email = $email; password = $pw } | ConvertTo-Json)
  Write-Host "Registered new user."
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 409) {
    Write-Host "User already exists → continue." -ForegroundColor Yellow
  } else {
    Write-Host "Register failed:" -ForegroundColor Red; Show-WebErr $_; exit 1
  }
}

# 2) Login
Write-Host "`n→ Logging in..."
try {
  $login = Invoke-RestMethod -Uri "$authBase/login" -Method Post `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body (@{ email = $email; password = $pw } | ConvertTo-Json)
  $token = $login.accessToken
  if (-not $token) { throw "No token returned from /auth/login" }
  Write-Host "Login OK — Token (truncated): $($token.Substring(0,30))..."
} catch { Write-Host "Login failed:" -ForegroundColor Red; Show-WebErr $_; exit 1 }

# 3) /me
Write-Host "`n→ /me ..."
try {
  $me = Invoke-RestMethod -Uri "$authBase/me" -Headers @{ "Authorization" = "Bearer $token" }
  $studentId = $me.id
  if (-not $studentId) { throw "Missing id from /me" }
  Write-Host "Student ID: $studentId"
} catch { Write-Host "/me failed:" -ForegroundColor Red; Show-WebErr $_; exit 1 }

# 4) Upload Academic Calendar (OCR → infer AY & create semesters)
Write-Host "`n→ Uploading Academic Calendar (OCR)..."
$acadUpload = Upload-PdfMultipart "$ingestBase/academic-calendar/upload" $academicFile $token
Write-Host "Academic upload status: $($acadUpload.StatusCode)"
Write-Host $acadUpload.Body
if (-not $acadUpload.Ok) { Write-Host "Academic upload failed; aborting." -ForegroundColor Red; exit 1 }

# 5) Upload Semester Timetable 
if ($semesterFile) {
  Write-Host "`n→ Uploading Semester Timetable..."
  $semKeyQ = [Uri]::EscapeDataString($semesterKey)
  $acadYQ  = [Uri]::EscapeDataString($academicYear)
  $semUrl  = "$ingestBase/semester-calendar/upload?semesterKey=$semKeyQ&academicYear=$acadYQ&defaultYear=$defaultYear&altYear=$altYear"
  $semUpload = Upload-PdfMultipart $semUrl $semesterFile $token
  Write-Host "Semester upload status: $($semUpload.StatusCode)"
  Write-Host $semUpload.Body
  if (-not $semUpload.Ok) { Write-Host "Semester upload failed (continuing anyway)." -ForegroundColor Yellow }
} else {
  Write-Host "`n→ Skipping Semester Timetable upload."
}

# 6) Google OAuth: get consent URL → open browser → poll link status
Write-Host "`n→ Starting Google OAuth..."
try {
  $authUrl = "$gcalBase/auth?studentId=$( [Uri]::EscapeDataString($studentId) )"
  $resp = Invoke-WebRequest -Uri $authUrl -Headers @{ "Authorization" = "Bearer $token" } `
    -MaximumRedirection 0 -ErrorAction SilentlyContinue
  $location = $resp.Headers.Location
  if ($location) {
    Write-Host "Open this once and complete consent:" -ForegroundColor Cyan
    Write-Host $location
    try { Start-Process $location } catch {}
  } else {
    Write-Host "No redirect location returned (you may already be linked)." -ForegroundColor Yellow
  }
} catch {
  Write-Host "Google auth bootstrap failed (non-fatal):" -ForegroundColor Yellow
  Show-WebErr $_
}

Write-Host "`n→ Polling /google/status ..."
function Get-LinkStatus {
  try {
    return Invoke-RestMethod -Uri "$gcalBase/status?studentId=$( [Uri]::EscapeDataString($studentId) )" `
      -Headers @{ "Authorization" = "Bearer $token" }
  } catch { return $null }
}
$maxSeconds = 120; $interval = 3; $elapsed = 0
do {
  Start-Sleep -Seconds $interval
  $elapsed += $interval
  $st = Get-LinkStatus
  if ($st) {
    Write-Host ("Status: " + ($st | ConvertTo-Json -Compress))
    if ($st.ok -and $st.linked -and $st.hasRefresh) { Write-Host "Google linked." -ForegroundColor Green; break }
  } else { Write-Host "Status not available yet..." }
} while ($elapsed -lt $maxSeconds)
if (-not $st -or -not ($st.ok -and $st.linked)) {
  Write-Host "Linking not confirmed yet — you can still proceed; sync will work once consent completes." -ForegroundColor Yellow
}

# 7) Calendar CRUD (create → update → delete)
Write-Host "`n→ Calendar: create event ..."
$startAt = (Get-Date).AddMinutes(10).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$endAt   = (Get-Date).AddMinutes(70).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
try {
  $created = Invoke-RestMethod -Uri "$calBase/events" -Method Post `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body (@{
      title    = "Focus Session E2E Test"
      startsAt = $startAt
      endsAt   = $endAt
      location = "Library"
      notes    = "auto-created by E2E script"
      # category = "USER"  # optional; avoid reserved server-only values
    } | ConvertTo-Json)
  $eventId = $created.id; if (-not $eventId) { throw "Create did not return id" }
  Write-Host "Created: $eventId"
} catch { Write-Host "Create failed:" -ForegroundColor Red; Show-WebErr $_; exit 1 }

Write-Host "→ Calendar: update event ..."
$newStart = (Get-Date).AddMinutes(40).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$newEnd   = (Get-Date).AddMinutes(100).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
try {
  $updated = Invoke-RestMethod -Uri "$calBase/events/$eventId" -Method Patch `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body (@{ title = "Focus Session (Updated)"; startsAt = $newStart; endsAt = $newEnd } | ConvertTo-Json)
  Write-Host "Updated."
} catch { Write-Host "Update failed:" -ForegroundColor Red; Show-WebErr $_; exit 1 }

Write-Host "→ Calendar: delete event ..."
try {
  Invoke-RestMethod -Uri "$calBase/events/$eventId" -Method Delete -Headers @{ "Authorization" = "Bearer $token" }
  Write-Host "Deleted."
} catch { Write-Host "Delete failed:" -ForegroundColor Red; Show-WebErr $_; exit 1 }

# 8) DB → Google sync
Write-Host "`n→ Google sync (DB → Google)..."
try {
  $sync = Invoke-RestMethod -Uri "$gcalBase/sync" -Method Post `
    -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
    -Body (@{ studentId = $studentId } | ConvertTo-Json)
  Write-Host ("Sync response: " + ($sync | ConvertTo-Json -Compress))
  if ($sync.ok -and $sync.created -gt 0) {
    Write-Host "Created/Updated in Google: $($sync.created)" -ForegroundColor Green
  } else {
    Write-Host "No new Google mutations; ensure MainCalendar rows with googleEventId = NULL exist." -ForegroundColor Yellow
  }
} catch { Write-Host "Sync failed:" -ForegroundColor Red; Show-WebErr $_; exit 1 }

Write-Host "`n=== E2E COMPLETE ===`n"
