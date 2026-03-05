$token = (Invoke-RestMethod -Uri "http://localhost:9000/auth/user/emailpass" -Method Post -ContentType "application/json" -Body '{"email":"admin@medusatest.com","password":"admin123"}').token
Write-Output "Token obtained"

Write-Output "`n=== Testing different store endpoints ==="
try {
    Write-Output "`nTesting /admin/stores"
    Invoke-RestMethod -Uri "http://localhost:9000/admin/stores" -Headers @{Authorization="Bearer $token"}
} catch {
    Write-Output "Error: $($_.Exception.Response.StatusCode)"
}

try {
    Write-Output "`nTesting /admin/store"
    Invoke-RestMethod -Uri "http://localhost:9000/admin/store" -Headers @{Authorization="Bearer $token"}
} catch {
    Write-Output "Error: $($_.Exception.Response.StatusCode)"
}

try {
    Write-Output "`nTesting /admin/v1/store"
    Invoke-RestMethod -Uri "http://localhost:9000/admin/v1/store" -Headers @{Authorization="Bearer $token"}
} catch {
    Write-Output "Error: $($_.Exception.Response.StatusCode)"
}

try {
    Write-Output "`nTesting /admin"
    Invoke-RestMethod -Uri "http://localhost:9000/admin" -Headers @{Authorization="Bearer $token"}
} catch {
    Write-Output "Error: $($_.Exception.Response.StatusCode)"
}
