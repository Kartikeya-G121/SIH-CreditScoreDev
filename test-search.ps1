# Quick PowerShell Test Script for Application Search

$BASE_URL = "http://localhost:8080/api/v1"
$TOKEN = ""

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Application Search Quick Test" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Logging in..." -ForegroundColor Yellow
$PHONE = Read-Host "Please enter your phone number"
$PASSWORD = Read-Host "Please enter your password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($PASSWORD)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

$loginBody = @{
    phoneNumber = $PHONE
    password = $PlainPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $TOKEN = $loginResponse.data
    Write-Host "✅ Login successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed! Please check your credentials." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Test search without filters
Write-Host "Step 2: Testing search without filters..." -ForegroundColor Yellow
$searchBody = @{
    page = 0
    size = 5
    sortBy = "createdAt"
    sortDirection = "DESC"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/applications/search" -Method Post -Body $searchBody -Headers $headers
    Write-Host "✅ Found $($response.data.totalElements) total applications" -ForegroundColor Green
} catch {
    Write-Host "❌ Search failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# Step 3: Test search by ID
Write-Host "Step 3: Testing search by application ID..." -ForegroundColor Yellow
$APP_ID = Read-Host "Enter an application ID to search for"

$searchBody = @{
    searchText = $APP_ID
    page = 0
    size = 5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/applications/search" -Method Post -Body $searchBody -Headers $headers
    Write-Host "✅ Found $($response.data.totalElements) applications matching ID: $APP_ID" -ForegroundColor Green
} catch {
    Write-Host "❌ Search failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# Step 4: Test filter by status
Write-Host "Step 4: Testing filter by status..." -ForegroundColor Yellow
Write-Host "Available statuses: DRAFT, SUBMITTED, SCORING, APPROVED, REJECTED, SANCTIONED, WITHDRAWN"
$STATUS = Read-Host "Enter status to filter by"

$searchBody = @{
    status = $STATUS
    page = 0
    size = 5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/applications/search" -Method Post -Body $searchBody -Headers $headers
    Write-Host "✅ Found $($response.data.totalElements) applications with status: $STATUS" -ForegroundColor Green
} catch {
    Write-Host "❌ Search failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""

# Step 5: Test search by name/email
Write-Host "Step 5: Testing search by name or email..." -ForegroundColor Yellow
$SEARCH_TEXT = Read-Host "Enter search text (name or email)"

$searchBody = @{
    searchText = $SEARCH_TEXT
    page = 0
    size = 5
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/admin/applications/search" -Method Post -Body $searchBody -Headers $headers
    Write-Host "✅ Found $($response.data.totalElements) applications matching: $SEARCH_TEXT" -ForegroundColor Green
    Write-Host ""
    Write-Host "Sample results:" -ForegroundColor Cyan
    $response.data.applications | Select-Object -First 3 | Format-Table applicationId, userName, userEmail, status, requestedAmount
} catch {
    Write-Host "❌ Search failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
