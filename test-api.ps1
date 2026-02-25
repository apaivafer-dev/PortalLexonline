# LexOnline API - Teste completo
$BASE = "https://us-central1-portallexonline-app.cloudfunctions.net/api/api"
$ErrorActionPreference = "Continue"

function Test-Endpoint($label, $method, $url, $body = $null, $token = $null) {
    $headers = @{"Content-Type" = "application/json" }
    if ($token) { $headers["Authorization"] = "Bearer $token" }
    
    try {
        if ($body) {
            $resp = Invoke-RestMethod -Uri $url -Method $method -Headers $headers -Body ($body | ConvertTo-Json) -ErrorAction Stop
        }
        else {
            $resp = Invoke-RestMethod -Uri $url -Method $method -Headers $headers -ErrorAction Stop
        }
        Write-Host "  [PASS] $label" -ForegroundColor Green
        return $resp
    }
    catch {
        Write-Host "  [FAIL] $label - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "`n=== LexOnline API Tests ===" -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n[1] Health Check" -ForegroundColor Yellow
Test-Endpoint "GET /health" "GET" "$BASE/health" | Out-Null

# 2. Auth - Login
Write-Host "`n[2] Autenticacao" -ForegroundColor Yellow
$loginResp = Test-Endpoint "POST /auth/login (admin)" "POST" "$BASE/auth/login" @{email = "apaivafer@gmail.com"; password = "admin123" }
$token = $loginResp.data.token

if ($token) {
    Write-Host "     Token: $($token.Substring(0,40))..." -ForegroundColor Gray
    Write-Host "     User: $($loginResp.data.user.name) | Admin: $($loginResp.data.user.is_admin)" -ForegroundColor Gray

    # 3. Auth - Senha errada
    Test-Endpoint "POST /auth/login (senha errada - deve falhar 401)" "POST" "$BASE/auth/login" @{email = "apaivafer@gmail.com"; password = "senhaerrada" } | Out-Null

    # 4. Auth - Me
    Write-Host "`n[3] Perfil" -ForegroundColor Yellow
    $me = Test-Endpoint "GET /auth/me" "GET" "$BASE/auth/me" -token $token
    Write-Host "     Nome: $($me.data.name) | Email: $($me.data.email)" -ForegroundColor Gray

    # 5. Leads
    Write-Host "`n[4] Leads" -ForegroundColor Yellow
    $leads = Test-Endpoint "GET /leads" "GET" "$BASE/leads" -token $token
    Write-Host "     Total leads: $($leads.data.Count)" -ForegroundColor Gray

    # 6. Pipelines
    Write-Host "`n[5] Pipelines" -ForegroundColor Yellow
    $pipelines = Test-Endpoint "GET /pipelines" "GET" "$BASE/pipelines" -token $token
    Write-Host "     Total pipelines: $($pipelines.data.Count)" -ForegroundColor Gray
    foreach ($p in $pipelines.data) {
        Write-Host "     - $($p.name) ($($p.stages.Count) estagios, system=$($p.is_system))" -ForegroundColor Gray
    }

    # 7. Company Profile
    Write-Host "`n[6] Empresa" -ForegroundColor Yellow
    $company = Test-Endpoint "GET /users/company" "GET" "$BASE/users/company" -token $token
    Write-Host "     Empresa: $($company.data.name)" -ForegroundColor Gray

    # 8. Admin Users
    Write-Host "`n[7] Admin" -ForegroundColor Yellow
    $adminUsers = Test-Endpoint "GET /admin/users" "GET" "$BASE/admin/users" -token $token
    Write-Host "     Total usuarios: $($adminUsers.data.Count)" -ForegroundColor Gray

    $stats = Test-Endpoint "GET /admin/stats" "GET" "$BASE/admin/stats" -token $token
    Write-Host "     Stats: totalUsers=$($stats.data.totalUsers) | activeUsers=$($stats.data.activeUsers) | totalLeads=$($stats.data.totalLeads)" -ForegroundColor Gray

    # 9. Criar novo lead
    Write-Host "`n[8] CRUD - Criar Lead" -ForegroundColor Yellow
    $firstPipeline = $pipelines.data[0]
    $firstStage = $firstPipeline.stages[0]
    $newLead = Test-Endpoint "POST /leads (criar)" "POST" "$BASE/leads" @{
        name           = "Teste Automatizado"
        email          = "teste@auto.com"
        phone          = "11999000001"
        pipelineId     = $firstPipeline.id
        stageId        = $firstStage.id
        estimatedValue = 9999
        notes          = "Lead criado via teste automatizado"
    } -token $token
    
    if ($newLead) {
        $leadId = $newLead.data.id
        Write-Host "     Lead criado: id=$leadId" -ForegroundColor Gray

        # 10. Atualizar lead
        Write-Host "`n[9] CRUD - Atualizar Lead" -ForegroundColor Yellow
        Test-Endpoint "PUT /leads/:id (atualizar)" "PUT" "$BASE/leads/$leadId" @{
            name           = "Teste Atualizado"
            estimatedValue = 15000
        } -token $token | Out-Null

        # 11. Deletar lead
        Write-Host "`n[10] CRUD - Deletar Lead" -ForegroundColor Yellow
        Test-Endpoint "DELETE /leads/:id (deletar)" "DELETE" "$BASE/leads/$leadId" -token $token | Out-Null
    }

    # 12. Acesso sem token (deve falhar)
    Write-Host "`n[11] Seguranca" -ForegroundColor Yellow
    Test-Endpoint "GET /leads sem token (deve falhar 401)" "GET" "$BASE/leads" | Out-Null
    Test-Endpoint "GET /admin/users sem admin (registro normal)" "GET" "$BASE/admin/users" | Out-Null

}
else {
    Write-Host "`n[ERRO] Login falhou, nao e possivel testar endpoints autenticados." -ForegroundColor Red
}

Write-Host "`n=== Teste concluido ===" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  http://localhost:3001" -ForegroundColor White
