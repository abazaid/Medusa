$token = (Invoke-RestMethod -Method Post -Uri "http://localhost:9000/auth/user/emailpass" -ContentType "application/json" -Body '{"email":"admin@medusa-test.com","password":"admin123"}' | Select-Object -ExpandProperty token)

Write-Output "Token: $token"

$headers = @{
    Authorization = "Bearer $token"
}

Write-Output "Fetching users..."

try {
    $users = Invoke-RestMethod -Uri "http://localhost:9000/admin/users" -Headers $headers
    Write-Output "Users response: $($users | ConvertTo-Json -Depth 5)"
    
    if ($users.users -and $users.users.Count -gt 0) {
        $userId = $users.users[0].id
        Write-Output "User ID: $userId"
        
        Invoke-RestMethod -Method Post -Uri "http://localhost:9000/admin/users/$userId" -ContentType "application/json" -Headers $headers -Body '{"role":"admin"}'
    } else {
        Write-Output "No users found"
    }
} catch {
    Write-Output "Error: $_"
    Write-Output "Response: $($_.Exception.Response)"
}
