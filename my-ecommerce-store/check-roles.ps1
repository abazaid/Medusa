$token = (Invoke-RestMethod -Method Post -Uri "http://localhost:9000/auth/user/emailpass" -ContentType "application/json" -Body '{"email":"admin@medusa-test.com","password":"admin123"}' | Select-Object -ExpandProperty token)

$headers = @{
    Authorization = "Bearer $token"
}

Write-Output "Checking invites..."
try {
    $invites = Invoke-RestMethod -Uri "http://localhost:9000/admin/invites" -Headers $headers
    Write-Output "Invites: $($invites | ConvertTo-Json)"
} catch {
    Write-Output "Error getting invites: $_"
}

Write-Output "`nChecking RBAC roles..."
try {
    $roles = Invoke-RestMethod -Uri "http://localhost:9000/admin/rbac/roles" -Headers $headers
    Write-Output "Roles: $($roles | ConvertTo-Json -Depth 5)"
} catch {
    Write-Output "Error getting roles: $_"
}
