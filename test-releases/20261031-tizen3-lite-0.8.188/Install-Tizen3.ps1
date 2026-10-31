param(
 [Parameter(Mandatory=$true)][System.Net.IPAddress]$TVIP,
 [Parameter(Mandatory=$true)][string]$CertificateProfile,
 [string]$TizenStudio='C:\tizen-studio'
)
$ErrorActionPreference='Stop'
$tizenCli=Join-Path $TizenStudio 'tools\ide\bin\tizen.bat'
$sdbCli=Join-Path $TizenStudio 'tools\sdb.exe'
if(!(Test-Path -LiteralPath $tizenCli) -or !(Test-Path -LiteralPath $sdbCli)){throw 'Install Tizen Studio with TV Extension and Samsung Certificate Extension, or pass -TizenStudio with its folder.'}
$sourceZip=Join-Path $PSScriptRoot 'Morph-TV-Tizen3-Lite-0.8.188-candidate.zip'
if(!(Test-Path -LiteralPath $sourceZip)){throw 'Keep the candidate ZIP next to this script.'}
Write-Host 'On TV: Apps > 12345 > Developer Mode ON. Host PC IP must be this computer. Restart the TV.'
Write-Host 'Use your existing Samsung author certificate and a distributor certificate containing this TV DUID.'
& $sdbCli connect ($TVIP.IPAddressToString+':26101')
if($LASTEXITCODE -ne 0){throw 'SDB connection failed. Check Developer Mode, Host PC IP and port 26101.'}
$deviceList=(& $sdbCli devices | Out-String)
if($deviceList -notmatch ([regex]::Escape($TVIP.IPAddressToString)+':26101\s+device')){throw 'TV is not connected as an SDB device. Do not continue until Device Manager shows Connected.'}
$work=Join-Path $env:TEMP ('Morph-Tizen3-'+[guid]::NewGuid().ToString('N'))
Expand-Archive -LiteralPath $sourceZip -DestinationPath $work
& $tizenCli package -t wgt -s $CertificateProfile -- $work
if($LASTEXITCODE -ne 0){throw 'Signing failed. Check Certificate Manager and the selected certificate profile.'}
$package=Get-ChildItem -LiteralPath $work -Filter '*.wgt' | Select-Object -First 1
if(!$package){throw 'No signed WGT was produced.'}
& $sdbCli -s ($TVIP.IPAddressToString+':26101') install $package.FullName
if($LASTEXITCODE -ne 0){throw 'Installation failed. Check DUID in the distributor certificate and Permit to install applications in Device Manager.'}
Write-Host 'Open Morph TV Lite 3 from Apps. This candidate installs separately from the main Morph TV app.'
