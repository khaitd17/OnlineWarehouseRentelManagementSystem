$ErrorActionPreference = "Stop"
Write-Host "========================== API Integration Tests ==========================" -ForegroundColor Cyan
$apiUrl = "http://localhost:5276/api"

# 1. Login (Owner)
Write-Host "[Auth] Logging in as owner@owrms.com..." -NoNewline
$loginBody = @{
    email = "owner@owrms.com"
    password = "123456"
} | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host " PASSED!" -ForegroundColor Green
} catch {
    Write-Host " FAILED! ($($_.Exception.Message))" -ForegroundColor Red
    exit
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# 2. View Owner Warehouses
Write-Host "[IT-WH-04] Get Owner Warehouses..." -NoNewline
try {
    $ownerWhs = Invoke-RestMethod -Uri "$apiUrl/Warehouse/my-warehouses" -Method Get -Headers $headers
    $count = if ($null -ne $ownerWhs) { $ownerWhs.Count } else { 0 }
    Write-Host " PASSED! (Found $count warehouses)" -ForegroundColor Green
} catch {
    Write-Host " FAILED! ($($_.Exception.Message))" -ForegroundColor Red
}

# 3. View Public Approved Warehouses
Write-Host "[IT-WH-07] Get Public Approved Warehouses..." -NoNewline
try {
    $publicWhs = Invoke-RestMethod -Uri "$apiUrl/Warehouse/approved" -Method Get
    Write-Host " PASSED!" -ForegroundColor Green
} catch {
    Write-Host " FAILED! ($($_.Exception.Message))" -ForegroundColor Red
}

# 4. View Occupancy Stats
Write-Host "[IT-WH-11] Get Occupancy Stats..." -NoNewline
try {
    $stats = Invoke-RestMethod -Uri "$apiUrl/Warehouse/occupancy-stats" -Method Get -Headers $headers
    Write-Host " PASSED! (Utilization: $($stats.utilizationRate)%)" -ForegroundColor Green
} catch {
    Write-Host " FAILED! ($($_.Exception.Message))" -ForegroundColor Red
}

Write-Host "==========================================================================" -ForegroundColor Cyan
Write-Host "Script completed! You can add more endpoints similarly."
