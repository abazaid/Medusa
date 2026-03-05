$token = (Invoke-RestMethod -Method Post -Uri "http://localhost:9000/auth/user/emailpass" -ContentType "application/json" -Body '{"email":"admin@medusatest.com","password":"admin123"}' | Select-Object -ExpandProperty token)

$headers = @{
    Authorization = "Bearer $token"
}

Write-Output "Getting current user info..."
$me = Invoke-RestMethod -Uri "http://localhost:9000/admin/users/me" -Headers $headers
Write-Output "Current user: $($me | ConvertTo-Json -Depth 10)"

Write-Output "`nTrying to access admin endpoints..."
try {
    $products = Invoke-RestMethod -Uri "http://localhost:9000/admin/products" -Headers $headers
    Write-Output "Products access: SUCCESS"
} catch {
    Write-Output "Products access: FAILED - $_"
}

try {
    $orders = Invoke-RestMethod -Uri "http://localhost:9000/admin/orders" -Headers $headers
    Write-Output "Orders access: SUCCESS"
} catch {
    Write-Output "Orders access: FAILED - $_"
}
