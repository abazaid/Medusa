$token = (Invoke-RestMethod -Uri "http://localhost:9000/auth/user/emailpass" -Method Post -ContentType "application/json" -Body '{"email":"admin@medusatest.com","password":"admin123"}').token
Write-Output "Token obtained`n"

$storeId = "store_01KJKT6CV1PQ7J1SVYND8THEEM"

Write-Output "=== Getting Store Info ==="
$storeInfo = Invoke-RestMethod -Uri "http://localhost:9000/admin/stores" -Headers @{Authorization="Bearer $token"}
$storeInfo | ConvertTo-Json -Depth 10

Write-Output "`n=== Updating Store Name to Arabic ==="
$update1 = Invoke-RestMethod -Uri "http://localhost:9000/admin/stores/$storeId" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body '{"name":"متجري","default_currency_code":"sar"}'
$update1 | ConvertTo-Json -Depth 10

Write-Output "`n=== Updating Currencies to Only SAR ==="
$update2 = Invoke-RestMethod -Uri "http://localhost:9000/admin/stores/$storeId" -Method Post -ContentType "application/json" -Headers @{Authorization="Bearer $token"} -Body '{"supported_currencies":[{"currency_code":"sar","is_default":true,"is_tax_inclusive":true}]}'
$update2 | ConvertTo-Json -Depth 10

Write-Output "`n=== Final Store Info ==="
$finalInfo = Invoke-RestMethod -Uri "http://localhost:9000/admin/stores" -Headers @{Authorization="Bearer $token"}
$finalInfo | ConvertTo-Json -Depth 10
