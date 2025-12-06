@echo off
echo ========================================
echo Starting ML Services
echo ========================================

echo.
echo Starting Risk Classification API (Port 5001)...
start "Risk ML API" cmd /k "cd /d "f:\SIH-CreditScoreDev-soham - Copy\ml models\Risk Bank Classification" && python risk_api.py"

timeout /t 3 /nobreak >nul

echo.
echo Starting Income Category API (Port 5002)...
start "Income ML API" cmd /k "cd /d "f:\SIH-CreditScoreDev-soham - Copy\ml models\Income category classification" && python income_api.py"

echo.
echo ========================================
echo ML Services Starting...
echo ========================================
echo Risk API: http://localhost:5001
echo Income API: http://localhost:5002
echo.
echo Press any key to exit (services will continue running)
pause >nul
