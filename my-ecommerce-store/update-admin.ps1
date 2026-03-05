$token = (Invoke-RestMethod -Method Post -Uri "http://localhost:9000/auth/user/emailpass" -ContentType "application/json" -Body '{"email":"admin@medusa-test.com","password":"admin123"}' | Select-Object -ExpandProperty token)

$headers = @{
    Authorization = "Bearer $token"
}

$userId = "user_01KJNHAPC6BC688J6BFKKQ4QWK"

Write-Output "Testing user update with different payloads..."

# Try with metadata
try {
    $result = Invoke-RestMethod -Method Post -Uri "http://localhost:9000/admin/users/$userId" -ContentType "application/json" -Headers $headers -Body '{"metadata":{"role":"admin"}}'
    Write-Output "Metadata result: $($result | ConvertTo-Json)"
} catch {
    Write-Output "Metadata error: $_"
}

# Try GET to see what fields are available
$user = Invoke-RestMethod -Uri "http://localhost:9000/admin/users/$userId" -Headers $headers
Write-Output "User details: $($user | ConvertTo-Json)"
