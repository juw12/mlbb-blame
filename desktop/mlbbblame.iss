; WhoThrew for Windows - per-user installer (no admin rights). build.py compiles it with:
;   iscc /DAppVersion=1.0.0 /DSourceDir=<dist\WhoThrew> /DOutputDir=<dist> /DIconFile=<build\mlbbblame.ico> mlbbblame.iss
; Installs to %LOCALAPPDATA%\Programs\WhoThrew, adds WhoThrew to the Start menu (and optionally the desktop) and lists it
; in Settings > Apps. The window keeps its data (what you saved in it) in %LOCALAPPDATA%\WhoThrew, which
; uninstalling leaves in place so a reinstall finds it again.

#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif
#ifndef SourceDir
  #define SourceDir "dist\WhoThrew"
#endif
#ifndef OutputDir
  #define OutputDir "dist"
#endif
#ifndef IconFile
  #define IconFile "build\mlbbblame.ico"
#endif

[Setup]
AppId={{E81247BA-698B-569E-A6DE-E1E1C366EEFB}
AppName=WhoThrew
AppVersion={#AppVersion}
AppVerName=WhoThrew {#AppVersion}
AppPublisher=Juwen Lie
AppPublisherURL=https://juw12.github.io/mlbb-blame/
AppSupportURL=https://github.com/juw12/mlbb-blame
DefaultDirName={autopf}\WhoThrew
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir={#OutputDir}
OutputBaseFilename=WhoThrew-Windows-Setup
SetupIconFile={#IconFile}
UninstallDisplayIcon={app}\WhoThrew.exe
UninstallDisplayName=WhoThrew
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
CloseApplications=no
SetupLogging=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{userprograms}\WhoThrew"; Filename: "{app}\WhoThrew.exe"; Comment: "Settle who threw (or carried) your Mobile Legends match"
Name: "{userdesktop}\WhoThrew"; Filename: "{app}\WhoThrew.exe"; Comment: "Settle who threw (or carried) your Mobile Legends match"; Tasks: desktopicon

[Run]
Filename: "{app}\WhoThrew.exe"; Description: "{cm:LaunchProgram,WhoThrew}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
Filename: "{app}\WhoThrew.exe"; Parameters: "--stop"; Flags: runhidden waituntilterminated; RunOnceId: "StopWhoThrew"

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  Result := '';
  { Updating: close an open WhoThrew window first so its files can be replaced. }
  if FileExists(ExpandConstant('{app}\WhoThrew.exe')) then
    Exec(ExpandConstant('{app}\WhoThrew.exe'), '--stop', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;
