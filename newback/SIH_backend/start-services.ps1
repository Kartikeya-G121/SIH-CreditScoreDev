# Start Python OCR Service
Write-Host "Starting Python OCR Service..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\sih - Copy (6)\Generated_Documentation\ocr-service'; Write-Host 'Python OCR Service' -ForegroundColor Cyan; python app.py"

# Wait for OCR service to start
Write-Host "Waiting 5 seconds for OCR service to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Spring Boot
Write-Host "Starting Spring Boot Application..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\sih - Copy (6)\Generated_Documentation'; Write-Host 'Spring Boot Application' -ForegroundColor Cyan; mvn spring-boot:run"

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Services Starting..." -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Python OCR Service: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Spring Boot API:    http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check health:" -ForegroundColor Yellow
Write-Host "  OCR:    curl http://localhost:5000/health" -ForegroundColor Gray
Write-Host "  Spring: curl http://localhost:8080/actuator/health" -ForegroundColor Gray
Write-Host ""
