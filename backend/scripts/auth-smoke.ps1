param(
    [string]$ApiBaseUrl = "http://127.0.0.1:8081/api",
    [string]$AdminUsername = "admin@example.com",
    [string]$AdminPassword = "Admin@123",
    [string]$AccessCookieName = "access_token",
    [string]$RefreshCookieName = "refresh_token",
    [int]$TimeoutSeconds = 20
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http

function Write-Step {
    param([string]$Message)
    Write-Host "[SMOKE] $Message"
}

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )
    if (-not $Condition) {
        throw "ASSERT FAILED: $Message"
    }
}

function New-ApiSession {
    param(
        [string]$BaseUrl,
        [int]$Timeout
    )

    $cookieContainer = New-Object System.Net.CookieContainer
    $handler = New-Object System.Net.Http.HttpClientHandler
    $handler.UseCookies = $true
    $handler.CookieContainer = $cookieContainer

    $client = New-Object System.Net.Http.HttpClient($handler)
    $client.Timeout = [TimeSpan]::FromSeconds($Timeout)

    return [pscustomobject]@{
        BaseUrl = $BaseUrl.TrimEnd('/')
        Cookies = $cookieContainer
        Client = $client
    }
}

function Invoke-Api {
    param(
        [Parameter(Mandatory = $true)]$Session,
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body
    )

    $url = $Session.BaseUrl + $Path
    $request = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::$Method, $url)
    $request.Headers.Accept.Add([System.Net.Http.Headers.MediaTypeWithQualityHeaderValue]::new("application/json"))

    if ($null -ne $Body) {
        $json = $Body | ConvertTo-Json -Depth 12 -Compress
        $request.Content = New-Object System.Net.Http.StringContent($json, [Text.Encoding]::UTF8, "application/json")
    }

    $response = $Session.Client.SendAsync($request).GetAwaiter().GetResult()
    $raw = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()

    $parsed = $null
    if (-not [string]::IsNullOrWhiteSpace($raw)) {
        try {
            $parsed = $raw | ConvertFrom-Json
        }
        catch {
            $parsed = $null
        }
    }

    return [pscustomobject]@{
        Url = $url
        StatusCode = [int]$response.StatusCode
        IsSuccess = $response.IsSuccessStatusCode
        Raw = $raw
        Json = $parsed
    }
}

function Get-CookieValue {
    param(
        [Parameter(Mandatory = $true)]$Session,
        [Parameter(Mandatory = $true)][string]$Name
    )
    $uri = [Uri]$Session.BaseUrl
    $all = $Session.Cookies.GetCookies($uri)
    foreach ($cookie in $all) {
        if ($cookie.Name -eq $Name) {
            return $cookie.Value
        }
    }
    return $null
}

function Assert-Api200 {
    param(
        [Parameter(Mandatory = $true)]$Response,
        [Parameter(Mandatory = $true)][string]$Action
    )
    Assert-True ($Response.StatusCode -eq 200) "$Action expected HTTP 200, got $($Response.StatusCode). body=$($Response.Raw)"
    Assert-True ($null -ne $Response.Json) "$Action expected JSON response. status=$($Response.StatusCode), raw=$($Response.Raw)"
    Assert-True ($Response.Json.code -eq 200) "$Action expected api.code=200, got $($Response.Json.code)."
}

$admin = New-ApiSession -BaseUrl $ApiBaseUrl -Timeout $TimeoutSeconds

try {
    Write-Step "1/6 admin login"
    $loginResp = Invoke-Api -Session $admin -Method 'Post' -Path '/auth/login' -Body @{
        username = $AdminUsername
        password = $AdminPassword
    }
    Assert-Api200 -Response $loginResp -Action 'admin login'

    $access = Get-CookieValue -Session $admin -Name $AccessCookieName
    $refresh = Get-CookieValue -Session $admin -Name $RefreshCookieName
    Assert-True (-not [string]::IsNullOrWhiteSpace($access)) "missing access cookie: $AccessCookieName"
    Assert-True (-not [string]::IsNullOrWhiteSpace($refresh)) "missing refresh cookie: $RefreshCookieName"

    Write-Step "2/6 fetch /auth/me"
    $meResp = Invoke-Api -Session $admin -Method 'Get' -Path '/auth/me'
    Assert-Api200 -Response $meResp -Action 'auth me (before refresh)'

    Write-Step "3/6 refresh token /auth/refresh"
    $refreshResp = Invoke-Api -Session $admin -Method 'Post' -Path '/auth/refresh'
    Assert-Api200 -Response $refreshResp -Action 'auth refresh'

    $accessAfter = Get-CookieValue -Session $admin -Name $AccessCookieName
    $refreshAfter = Get-CookieValue -Session $admin -Name $RefreshCookieName
    Assert-True (-not [string]::IsNullOrWhiteSpace($accessAfter)) "refresh did not keep access cookie"
    Assert-True (-not [string]::IsNullOrWhiteSpace($refreshAfter)) "refresh did not keep refresh cookie"

    Write-Step "4/6 verify permission denial (low-priv first, fallback unknown api deny)"
    $suffix = [Guid]::NewGuid().ToString('N').Substring(0, 8)
    $lowUser = "smoke_$suffix@example.com"
    $lowPass = "Smoke@123"

    $registerResp = Invoke-Api -Session $admin -Method 'Post' -Path '/auth/register' -Body @{
        email = $lowUser
        password = $lowPass
    }

    if ($registerResp.StatusCode -eq 200 -and $null -ne $registerResp.Json -and $registerResp.Json.code -eq 200) {
        $low = New-ApiSession -BaseUrl $ApiBaseUrl -Timeout $TimeoutSeconds

        $lowLoginResp = Invoke-Api -Session $low -Method 'Post' -Path '/auth/login' -Body @{
            username = $lowUser
            password = $lowPass
        }
        Assert-Api200 -Response $lowLoginResp -Action 'low-priv login'

        $forbiddenResp = Invoke-Api -Session $low -Method 'Get' -Path '/system/users/list'
        Assert-True ($forbiddenResp.StatusCode -eq 403) "low-priv should be forbidden on /system/users/list, got $($forbiddenResp.StatusCode). body=$($forbiddenResp.Raw)"

        $lowLogoutResp = Invoke-Api -Session $low -Method 'Post' -Path '/auth/logout'
        Assert-Api200 -Response $lowLogoutResp -Action 'low-priv logout'

        $low.Client.Dispose()
        Write-Step "permission denial branch passed with low-priv user"
    }
    else {
        Write-Step "register unavailable, fallback unknown api deny"
        $denyResp = Invoke-Api -Session $admin -Method 'Get' -Path '/unknown/smoke-deny-check'
        Assert-True ($denyResp.StatusCode -eq 403) "unknown api should be forbidden, got $($denyResp.StatusCode). body=$($denyResp.Raw)"
    }

    Write-Step "5/6 logout"
    $logoutResp = Invoke-Api -Session $admin -Method 'Post' -Path '/auth/logout'
    Assert-Api200 -Response $logoutResp -Action 'admin logout'

    Write-Step "6/6 verify /auth/me invalid after logout"
    $meAfterLogout = Invoke-Api -Session $admin -Method 'Get' -Path '/auth/me'
    Assert-True ($meAfterLogout.StatusCode -eq 401) "auth me after logout expected 401, got $($meAfterLogout.StatusCode). body=$($meAfterLogout.Raw)"

    Write-Host "[SMOKE] PASS: auth flow + permission denial + logout invalidation"
}
finally {
    if ($null -ne $admin -and $null -ne $admin.Client) {
        $admin.Client.Dispose()
    }
}
