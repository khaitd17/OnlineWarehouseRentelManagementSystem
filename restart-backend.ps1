# Dừng process dotnet API hoặc WMS.API cũ (nếu có) rồi restart
Get-Process -Name "WMS.API" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "Đang dừng process WMS.API (PID: $($_.Id))..."
    Stop-Process -Id $_.Id -Force
}

# Fallback: kill all dotnet processes that may be hosting the API
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine
        if ($cmdLine -match "WMS.API") {
            Write-Host "Đang dừng process dotnet (PID: $($_.Id))..."
            Stop-Process -Id $_.Id -Force
        }
    } catch {}
}

Start-Sleep -Seconds 2

Write-Host "Khởi động lại backend..."
Set-Location "$PSScriptRoot\backend\WMS.API"
dotnet run
