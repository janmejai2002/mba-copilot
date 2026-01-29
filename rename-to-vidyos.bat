@echo off
echo ========================================
echo Renaming MBA Copilot to Vidyos
echo ========================================
echo.

REM Update TermsOfService.tsx
echo Updating TermsOfService.tsx...
powershell -Command "(Get-Content 'components\TermsOfService.tsx') -replace 'MBA Copilot', 'Vidyos' | Set-Content 'components\TermsOfService.tsx'"

REM Update PrivacyPolicy.tsx
echo Updating PrivacyPolicy.tsx...
powershell -Command "(Get-Content 'components\PrivacyPolicy.tsx') -replace 'MBA Copilot', 'Vidyos' | Set-Content 'components\PrivacyPolicy.tsx'"

REM Update Layout.tsx footer
echo Updating Layout.tsx footer...
powershell -Command "(Get-Content 'components\Layout.tsx') -replace 'Privacy-First Academic Assistant', 'Knowledge, Reimagined' | Set-Content 'components\Layout.tsx'"

REM Update logo icon in Layout.tsx
echo Updating logo icon...
powershell -Command "(Get-Content 'components\Layout.tsx') -replace '<span className=\""text-\[var\(--card-bg\)\] font-bold text-\[10px\]\"">MBA</span>', '<span className=\""text-\[var\(--card-bg\)\] font-bold text-lg\"">V</span>' | Set-Content 'components\Layout.tsx'"

echo.
echo ========================================
echo Rename Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run build
echo 2. Test locally: npm run dev
echo 3. Commit: git add . ^&^& git commit -m "Rebrand to Vidyos"
echo 4. Deploy: git push
echo.
pause
