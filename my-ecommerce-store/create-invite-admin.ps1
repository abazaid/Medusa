$token = (Invoke-RestMethod -Method Post -Uri "http://localhost:9000/auth/user/emailpass" -ContentType "application/json" -Body '{"email":"admin@medusatest.com","password":"admin123"}' | Select-Object -ExpandProperty token)

$headers = @{
    Authorization = "Bearer $token"
}

Write-Output "Creating invite for new admin..."
$invite = Invoke-RestMethod -Method Post -Uri "http://localhost:9000/admin/invites" -ContentType "application/json" -Headers $headers -Body '{"email":"newadmin2@medusa-test.com"}'
Write-Output "Invite created: $($invite | ConvertTo-Json)"

$tokenFromInvite = $invite.token
Write-Output "`nInvite token: $tokenFromInvite"

Write-Output "`nAccepting invite..."
$accept = Invoke-RestMethod -Method Post -Uri "http://localhost:9000/auth/user/emailpass/register" -ContentType "application/json" -Body "{`"email`":`"newadmin2@medusa-test.com`",`"password`":`"admin456`",`"first_name`":`"New`",`"last_name`":`"Admin`",`"token`":`"$tokenFromInvite`"}"
Write-Output "Registered: $($accept | ConvertTo-Json)"

Write-Output "`nChecking users..."
$users = Invoke-RestMethod -Uri "http://localhost:9000/admin/users" -Headers $headers
Write-Output "Users: $($users | ConvertTo-Json)"
