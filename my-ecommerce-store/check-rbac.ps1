$token = (Invoke-RestMethod -Method Post -Uri "http://localhost:9000/auth/user/emailpass" -ContentType "application/json" -Body '{"email":"admin@medusatest.com","password":"admin123"}' | Select-Object -ExpandProperty token)

$headers = @{
    Authorization = "Bearer $token"
}

Write-Output "Checking RBAC roles..."
$roles = Invoke-RestMethod -Uri "http://localhost:9000/admin/rbac/roles" -Headers $headers
Write-Output "Roles: $($roles | ConvertTo-Json -Depth 10)"

Write-Output "`nTrying to get permissions for first role..."
if ($roles.roles -and $roles.roles.Count -gt 0) {
    $roleId = $roles.roles[0].id
    $permissions = Invoke-RestMethod -Uri "http://localhost:9000/admin/rbac/roles/$roleId/policies" -Headers $headers
    Write-Output "Permissions: $($permissions | ConvertTo-Json -Depth 10)"
}
