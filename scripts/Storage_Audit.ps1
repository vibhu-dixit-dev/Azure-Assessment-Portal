# ============================================================
#  Azure Storage Security Assessment
#  Generates: AzureStorage_Report.html
# ============================================================

function Get-HtmlTemplate {
    param($Title,$SubName,$Date,$Rows,$Pass,$Fail,$Warn,$Total)

    $score = if ($Total -gt 0) { [math]::Round(($Pass / $Total) * 100) } else { 0 }
    $scoreColor = if ($score -ge 80) { "#00c87a" } elseif ($score -ge 60) { "#ffab40" } else { "#ff4d6d" }

@"
<!DOCTYPE html>
<html lang='en'>
<head>
<meta charset='UTF-8'>
<title>Azure Assessment - $Title</title>
<style>
body{font-family:'Segoe UI';background:#0a0e1a;color:#e8eaf0;padding:30px}
.container{max-width:1200px;margin:auto}
.header{background:linear-gradient(135deg,#0078D4,#003f73);padding:30px;border-radius:12px;margin-bottom:25px}
.score{font-size:28px;font-weight:bold;color:$scoreColor}
table{width:100%;border-collapse:collapse;background:#111}
th,td{padding:12px;border-bottom:1px solid #333}
th{background:#003f73}
</style>
</head>
<body>
<div class='container'>
<div class='header'>
<h2>☁ Azure $Title</h2>
<p>Subscription: $SubName | Generated: $Date</p>
<div class='score'>Security Score: ${score}%</div>
</div>

<p>Total Checks: $Total | Passed: $Pass | Failed: $Fail | Warnings: $Warn</p>

<table>
<thead>
<tr>
<th>Category</th>
<th>Check</th>
<th>Resource</th>
<th>Status</th>
<th>Details</th>
</tr>
</thead>
<tbody>
$Rows
</tbody>
</table>
</div>
</body>
</html>
"@
}

Write-Host "Connecting to Azure..." -ForegroundColor Cyan
Connect-AzAccount | Out-Null

$results=@()
$sub = Get-AzSubscription | Select-Object -First 1
$subName = $sub.Name
$date = (Get-Date).ToUniversalTime().AddHours(5.5).ToString("yyyy-MM-dd HH:mm")

Write-Host "Running Storage checks on $subName" -ForegroundColor Yellow

try {

$accounts = Get-AzStorageAccount

foreach ($sa in $accounts){

$name = $sa.StorageAccountName
$rg = $sa.ResourceGroupName
$ctx = $sa.Context

# Secure Transfer Required
$results += [PSCustomObject]@{
Category="Storage"
Check="Secure transfer required"
Resource=$name
Status=if($sa.EnableHttpsTrafficOnly){"PASS"}else{"FAIL"}
Details=if($sa.EnableHttpsTrafficOnly){"HTTPS enforced"}else{"HTTP allowed"}
}

# Public Blob Access
$results += [PSCustomObject]@{
Category="Storage"
Check="Public blob access disabled"
Resource=$name
Status=if($sa.AllowBlobPublicAccess){"FAIL"}else{"PASS"}
Details=if($sa.AllowBlobPublicAccess){"Public blob access enabled"}else{"Public access disabled"}
}

# Minimum TLS
$results += [PSCustomObject]@{
Category="Storage"
Check="Minimum TLS version"
Resource=$name
Status=if($sa.MinimumTlsVersion -ge "TLS1_2"){"PASS"}else{"FAIL"}
Details="Configured TLS: $($sa.MinimumTlsVersion)"
}

# Network Rules
$results += [PSCustomObject]@{
Category="Storage"
Check="Storage firewall enabled"
Resource=$name
Status=if($sa.NetworkRuleSet.DefaultAction -eq "Deny"){"PASS"}else{"WARN"}
Details=if($sa.NetworkRuleSet.DefaultAction -eq "Deny"){"Restricted network access"}else{"Public access allowed"}
}

# Blob Encryption
$results += [PSCustomObject]@{
Category="Storage"
Check="Blob service encryption"
Resource=$name
Status=if($sa.Encryption.Services.Blob.Enabled){"PASS"}else{"FAIL"}
Details=if($sa.Encryption.Services.Blob.Enabled){"Blob encryption enabled"}else{"Encryption disabled"}
}

# File Encryption
$results += [PSCustomObject]@{
Category="Storage"
Check="File service encryption"
Resource=$name
Status=if($sa.Encryption.Services.File.Enabled){"PASS"}else{"FAIL"}
Details=if($sa.Encryption.Services.File.Enabled){"File encryption enabled"}else{"Encryption disabled"}
}

# Access Key Rotation
try{
Get-AzStorageAccountKey -ResourceGroupName $rg -Name $name | Out-Null
$results += [PSCustomObject]@{
Category="Storage"
Check="Storage access key rotation"
Resource=$name
Status="WARN"
Details="Manual verification required"
}
}catch{}

# SAS Expiry
$results += [PSCustomObject]@{
Category="Storage"
Check="SAS token expiry"
Resource=$name
Status="WARN"
Details="Ensure SAS tokens expire within 1 hour"
}

# SAS HTTPS
$results += [PSCustomObject]@{
Category="Storage"
Check="SAS HTTPS enforcement"
Resource=$name
Status=if($sa.EnableHttpsTrafficOnly){"PASS"}else{"FAIL"}
Details="SAS should only allow HTTPS"
}

# Blob Containers Public Access
try{

$containers = Get-AzStorageContainer -Context $ctx

foreach($c in $containers){

$results += [PSCustomObject]@{
Category="Storage"
Check="Blob container public access"
Resource="$name / $($c.Name)"
Status=if($c.PublicAccess -eq "Off"){"PASS"}else{"FAIL"}
Details=if($c.PublicAccess -eq "Off"){"Private container"}else{"Public access enabled"}
}

}

}catch{}

# Soft Delete
try{

$blobProp = Get-AzStorageServiceProperty -ServiceType Blob -Context $ctx

$results += [PSCustomObject]@{
Category="Storage"
Check="Blob soft delete"
Resource=$name
Status=if($blobProp.DeleteRetentionPolicy.Enabled){"PASS"}else{"WARN"}
Details=if($blobProp.DeleteRetentionPolicy.Enabled){"Enabled ($($blobProp.DeleteRetentionPolicy.Days) days)"}else{"Soft delete disabled"}
}

}catch{}

}

if(-not $accounts){

$results += [PSCustomObject]@{
Category="Storage"
Check="Storage accounts"
Resource="Subscription"
Status="INFO"
Details="No storage accounts found"
}

}

}catch{

$results += [PSCustomObject]@{
Category="Storage"
Check="Storage scan"
Resource="N/A"
Status="ERROR"
Details=$_.Exception.Message
}

}

Write-Host "Generating HTML report..." -ForegroundColor Cyan

$rows=""

foreach($r in $results){

$color = switch ($r.Status){
"PASS"{"#00c87a"}
"FAIL"{"#ff4d6d"}
"WARN"{"#ffab40"}
"INFO"{"#50e6ff"}
default{"#8892a4"}
}

$icon = switch ($r.Status){
"PASS"{"✔"}
"FAIL"{"✘"}
"WARN"{"⚠"}
default{"ℹ"}
}

$rows += "<tr><td>$($r.Category)</td><td>$($r.Check)</td><td>$($r.Resource)</td><td style='color:$color;font-weight:bold'>$icon $($r.Status)</td><td>$($r.Details)</td></tr>"

}

$pass = ($results | Where-Object Status -eq "PASS").Count
$fail = ($results | Where-Object Status -eq "FAIL").Count
$warn = ($results | Where-Object Status -eq "WARN").Count
$total = $results.Count

$html = Get-HtmlTemplate -Title "Storage Security Audit" -SubName $subName -Date $date -Rows $rows -Pass $pass -Fail $fail -Warn $warn -Total $total

$html | Out-File "AzureStorage_Report.html" -Encoding UTF8

Write-Host "===================================="
Write-Host "✅ Report Ready: AzureStorage_Report.html"
Write-Host "===================================="

download AzureStorage_Report.html