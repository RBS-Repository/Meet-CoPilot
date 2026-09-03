@echo off
set "SCRIPT_DIR=%~dp0"
set "VBS_PATH=%SCRIPT_DIR%launch.vbs"

powershell -NoProfile -Command ^
  "$desktop = [Environment]::GetFolderPath('Desktop');" ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$s = $ws.CreateShortcut((Join-Path $desktop 'Meeting Copilot.lnk'));" ^
  "$s.TargetPath = 'wscript.exe';" ^
  "$s.Arguments = '\"%VBS_PATH%\"';" ^
  "$s.WorkingDirectory = '%SCRIPT_DIR%';" ^
  "$s.Description = 'Meeting Copilot Assistant';" ^
  "$s.Save();"

echo ===================================================
echo Shortcut created on your Desktop: 'Meeting Copilot'
echo You can now double-click it to launch without terminal!
echo ===================================================
pause
