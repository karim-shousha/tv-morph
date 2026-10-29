param(
 [Parameter(Mandatory=$true)][System.Net.IPAddress]$TVIP,
 [Parameter(Mandatory=$true)][string]$CertificateProfile,
 [string]$TizenStudio='C:\tizen-studio'
)
$ErrorActionPreference='Stop'
$tizenCli=Join-Path $TizenStudio 'tools\ide\bin\tizen.bat'
$sdbCli=Join-Path $TizenStudio 'tools\sdb.exe'
if(!(Test-Path -LiteralPath $tizenCli) -or !(Test-Path -LiteralPath $sdbCli)){throw 'Install Tizen Studio, Certificate Manager, TV Extension and Samsung Certificate Extension.'}
$candidate=Join-Path $PSScriptRoot 'Morph-TV-Tizen2-Lite-0.8.206-candidate.wgt'
if(!(Test-Path -LiteralPath $candidate)){throw 'Keep the candidate WGT beside this script.'}
& $sdbCli connect ($TVIP.IPAddressToString+':26101')
$deviceList=(& $sdbCli devices | Out-String)
if($deviceList -notmatch ([regex]::Escape($TVIP.IPAddressToString)+':26101\s+device')){throw 'TV not connected. Check Developer Mode, Host PC IP and port 26101.'}
$work=Join-Path $env:TEMP ('Morph-Tizen2-'+[guid]::NewGuid().ToString('N'))
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($candidate,$work)
& $tizenCli package -t wgt -s $CertificateProfile -- $work
if($LASTEXITCODE -ne 0){throw 'Signing failed. Check Certificate Manager and TV DUID.'}
$package=Get-ChildItem -LiteralPath $work -Filter '*.wgt' | Select-Object -First 1
if(!$package){throw 'No signed WGT produced.'}
& $tizenCli install -s ($TVIP.IPAddressToString+':26101') -n $package.Name -- $work
if($LASTEXITCODE -ne 0){throw 'Installation failed. Check the full installer log and Permit to install applications.'}
Write-Host 'Open Morph TV Lite 2 from Apps. Physical Tizen 2 compatibility remains experimental.'
