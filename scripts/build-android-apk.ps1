param(
  [string]$ProjectRoot = "C:\Users\karid\workspace\repos\family-photo-gallary",
  [string]$SdkFolderName = ".android-sdk",
  [string]$ToolingFolderName = ".android-tooling",
  [string]$GradleVersion = "8.7",
  [string]$AndroidCmdlineToolsVersion = "14742923",
  [string]$BuildToolsVersion = "35.0.0",
  [string]$PlatformApi = "35",
  [string]$KeystorePassword = "jjinalbum123!",
  [string]$KeyAlias = "jjinalbum",
  [string]$KeyPassword = "jjinalbum123!"
)

$ErrorActionPreference = "Stop"

function Ensure-Directory([string]$Path) {
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Download-File([string]$Url, [string]$Destination, [long]$MinimumBytes = 5242880) {
  if (Test-Path $Destination) {
    $existing = Get-Item $Destination
    if ($existing.Length -ge $MinimumBytes) {
      return
    }

    Remove-Item $Destination -Force
  }

  & curl.exe --fail --location --output $Destination $Url

  $downloaded = Get-Item $Destination
  if ($downloaded.Length -lt $MinimumBytes) {
    throw "Downloaded file is too small: $Destination ($($downloaded.Length) bytes)"
  }
}

$androidRoot = Join-Path $ProjectRoot "android"
$sdkRoot = Join-Path $ProjectRoot $SdkFolderName
$toolingRoot = Join-Path $ProjectRoot $ToolingFolderName
$distRoot = Join-Path $ProjectRoot "dist"
$keysRoot = Join-Path $androidRoot "keys"

Ensure-Directory $sdkRoot
Ensure-Directory $toolingRoot
Ensure-Directory $distRoot
Ensure-Directory $keysRoot

$javac = Get-Command javac.exe -ErrorAction Stop
$javaHome = Split-Path (Split-Path $javac.Source -Parent) -Parent
$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot

$cmdlineToolsZip = Join-Path $toolingRoot "commandlinetools-win-$AndroidCmdlineToolsVersion`_latest.zip"
$cmdlineToolsExtract = Join-Path $toolingRoot "cmdline-tools"
$cmdlineToolsLatest = Join-Path $sdkRoot "cmdline-tools\latest"

Download-File `
  -Url "https://dl.google.com/android/repository/commandlinetools-win-$AndroidCmdlineToolsVersion`_latest.zip" `
  -Destination $cmdlineToolsZip

if (-not (Test-Path $cmdlineToolsLatest)) {
  if (Test-Path $cmdlineToolsExtract) {
    Remove-Item -Recurse -Force $cmdlineToolsExtract
  }

  Expand-Archive -Path $cmdlineToolsZip -DestinationPath $toolingRoot -Force
  Ensure-Directory (Join-Path $sdkRoot "cmdline-tools")
  Move-Item -Path $cmdlineToolsExtract -Destination $cmdlineToolsLatest
}

$sdkManager = Join-Path $cmdlineToolsLatest "bin\sdkmanager.bat"
$sdkPackagesFile = Join-Path $toolingRoot "sdk-packages.txt"

@("platform-tools", "platforms;android-$PlatformApi", "build-tools;$BuildToolsVersion") |
  Set-Content -Path $sdkPackagesFile

$licenseAnswers = 1..200 | ForEach-Object { "y" }
$licenseAnswers | & $sdkManager --sdk_root=$sdkRoot --licenses | Out-Null
& $sdkManager --sdk_root=$sdkRoot --package_file=$sdkPackagesFile

$gradleZip = Join-Path $toolingRoot "gradle-$GradleVersion-bin.zip"
$gradleRoot = Join-Path $toolingRoot "gradle-$GradleVersion"
$gradleBat = Join-Path $gradleRoot "bin\gradle.bat"

Download-File `
  -Url "https://services.gradle.org/distributions/gradle-$GradleVersion-bin.zip" `
  -Destination $gradleZip

if (-not (Test-Path $gradleBat)) {
  Expand-Archive -Path $gradleZip -DestinationPath $toolingRoot -Force
}

$localProperties = @"
sdk.dir=$($sdkRoot -replace '\\', '\\')
"@
Set-Content -Path (Join-Path $androidRoot "local.properties") -Value $localProperties

$keystoreRelativePath = "keys/jjinalbum-release.keystore"
$keystorePath = Join-Path $androidRoot $keystoreRelativePath
$keytool = Join-Path $javaHome "bin\keytool.exe"

if (-not (Test-Path $keystorePath)) {
  & $keytool `
    -genkeypair `
    -storetype PKCS12 `
    -keystore $keystorePath `
    -alias $KeyAlias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 9125 `
    -storepass $KeystorePassword `
    -keypass $KeyPassword `
    -dname "CN=Jjin Album, OU=Family, O=Windsoft, L=Seoul, S=Seoul, C=KR"
}

$keystoreProperties = @"
storeFile=$keystoreRelativePath
storePassword=$KeystorePassword
keyAlias=$KeyAlias
keyPassword=$KeyPassword
"@
Set-Content -Path (Join-Path $androidRoot "keystore.properties") -Value $keystoreProperties

Push-Location $androidRoot
try {
  & $gradleBat --no-daemon assembleRelease
}
finally {
  Pop-Location
}

$apkSource = Join-Path $androidRoot "app\build\outputs\apk\release\app-release.apk"
$apkTarget = Join-Path $distRoot "jjin-album.apk"

if (-not (Test-Path $apkSource)) {
  throw "APK not found at $apkSource"
}

Copy-Item -Path $apkSource -Destination $apkTarget -Force
Write-Output "APK built: $apkTarget"
