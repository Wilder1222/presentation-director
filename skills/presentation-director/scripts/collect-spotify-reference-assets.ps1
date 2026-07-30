param(
    [ValidateSet("brand", "principles", "systems")]
    [string]$Group,
    [switch]$All,
    [string]$Workspace,
    [string]$CacheDir,
    [string]$OutputRoot
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Workspace)) {
    $current = [System.IO.Path]::GetFullPath((Get-Location).Path)
    if ((Split-Path -Leaf $current) -ieq "presentation-director" -and (Test-Path -LiteralPath (Join-Path $current "presentation.json"))) {
        $Workspace = $current
    } else {
        $Workspace = Join-Path $current "presentation-director"
    }
} elseif ((Split-Path -Leaf $Workspace) -ine "presentation-director") {
    $Workspace = Join-Path $Workspace "presentation-director"
}
$Workspace = [System.IO.Path]::GetFullPath($Workspace)
$expectedCache = [System.IO.Path]::GetFullPath((Join-Path $Workspace "reference-library"))
if (-not [string]::IsNullOrWhiteSpace($CacheDir) -and [System.IO.Path]::GetFullPath($CacheDir) -ne $expectedCache) {
    throw "Reference cache must be workspace-local: expected $expectedCache"
}
$CacheDir = $expectedCache
if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $CacheDir "captures\spotify\source-assets"
}
$OutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)
$workspacePrefix = $Workspace.TrimEnd('\') + '\'
if (-not $OutputRoot.StartsWith($workspacePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "OutputRoot must stay inside $Workspace"
}

$assets = @(
    @{ Group = "brand"; File = "00-hero.jpg"; Url = "https://miro.medium.com/v2/resize:fit:1200/0*BoJhmycIKONb3CHM.jpg" },
    @{ Group = "brand"; File = "01-brand-system.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*3nmUqngR9VgdSoXHZjoQKA.png" },
    @{ Group = "brand"; File = "02-brand-expression.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*8C20ghYbKA8XqF1gap3wrg.png" },
    @{ Group = "brand"; File = "03-layout-language.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*B9zhurLyL18weUdxCvYOPQ.png" },
    @{ Group = "brand"; File = "04-type-and-color.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*crBuW4GCgbaOpVRCk4jegQ.png" },
    @{ Group = "brand"; File = "05-expression-range.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*GZ6JaGVvgz2sJjQqrPpXAQ.png" },
    @{ Group = "brand"; File = "06-brand-in-use.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*wIphQu9EOFo_eCx2WoYjNA.png" },
    @{ Group = "principles"; File = "00-hero.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*Iuuk_z6B-2kbbprpUDhItA.png" },
    @{ Group = "principles"; File = "01-principles-overview.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*0y6ShUVh_EaGhDVNd81iJQ.png" },
    @{ Group = "principles"; File = "02-relevant.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*5FEIqF7EIx64R7LV-uhBuw.png" },
    @{ Group = "principles"; File = "03-human.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*9HY9QEoDGG742pu82bx3ZA.png" },
    @{ Group = "principles"; File = "04-unified.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*COknYy85Xa7vsbtW0y-BSQ.png" },
    @{ Group = "principles"; File = "05-principle-example.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*k6zDChMAcrlvPM_VXbjj_A.png" },
    @{ Group = "principles"; File = "06-product-expression.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*O_YpJRoQh2tbQa4B3AUknA.png" },
    @{ Group = "principles"; File = "07-content-hierarchy.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*p7eoknnOv4z8jIOVwKRUZg.png" },
    @{ Group = "principles"; File = "08-experience-system.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*s6mjV-_3d7-OaSNj_XHo3w.png" },
    @{ Group = "principles"; File = "09-principles-in-use.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*v8gdyjGtbPiFgjFv22NwuA.png" },
    @{ Group = "systems"; File = "00-hero.png"; Url = "https://miro.medium.com/v2/resize:fit:2600/0*ZgvcdXzLLLJZcZcc.png" },
    @{ Group = "systems"; File = "01-system-overview.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*9Vc6kujQ1Ph6rpKNnmX5IA.png" },
    @{ Group = "systems"; File = "02-foundations.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*v1cPhFHhStEWc8KTkJJnyg.png" },
    @{ Group = "systems"; File = "03-components.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*qEoqEbPaRgAZvFpWZoIuOg.png" },
    @{ Group = "systems"; File = "04-token-architecture.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*aDCNZQEjV1LVqZAxoJA7uw.png" },
    @{ Group = "systems"; File = "05-system-model.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*AwiFEjuGRY3nwdqskzpQvg.png" },
    @{ Group = "systems"; File = "06-cross-platform.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*usV_ySSG-isd5QzhE7Bs1A.png" },
    @{ Group = "systems"; File = "07-design-ops.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*k8j0pSVzP7KCVMWzOuxhiA.png" },
    @{ Group = "systems"; File = "08-component-process.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*wWhRGSpY9eHreLb97ETI5A.png" },
    @{ Group = "systems"; File = "09-collaboration-model.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*gWOif3qa0TgGRcp_azd42Q.png" },
    @{ Group = "systems"; File = "10-system-evolution.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*A3uZPQc-gfEIMES20xuZVA.png" },
    @{ Group = "systems"; File = "11-library-view.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*mOdV8wsIhevmAdWKsHf2sQ.png" },
    @{ Group = "systems"; File = "12-governance.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*qo-e6vuUTSCiyi0vJFqXeQ.png" },
    @{ Group = "systems"; File = "13-system-impact.png"; Url = "https://miro.medium.com/v2/resize:fit:2000/1*7u3rwVSGz7CV_rCsFwswRg.png" }
)

$headers = @{
    "User-Agent" = "Mozilla/5.0 Codex-Presentation-Reference-Collector/1.0"
    "Referer" = "https://medium.com/spotify-design/"
}

if (-not $All -and [string]::IsNullOrWhiteSpace($Group)) {
    $assets | Group-Object Group | ForEach-Object { Write-Host "remote $($_.Name): $($_.Count) assets" }
    Write-Host "cacheDir=$CacheDir"
    Write-Host "Load one group with -Group brand|principles|systems. Use -All only for an intentional full refresh."
    exit 0
}

if (-not [string]::IsNullOrWhiteSpace($Group)) {
    $assets = @($assets | Where-Object { $_.Group -eq $Group })
}

foreach ($asset in $assets) {
    $directory = Join-Path $OutputRoot $asset.Group
    $destination = Join-Path $directory $asset.File
    New-Item -ItemType Directory -Force -Path $directory | Out-Null

    if ((Test-Path -LiteralPath $destination) -and ((Get-Item -LiteralPath $destination).Length -gt 0)) {
        Write-Host "skip $($asset.Group)/$($asset.File)"
        continue
    }

    $success = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            Invoke-WebRequest -Uri $asset.Url -OutFile $destination -Headers $headers -TimeoutSec 90
            Write-Host "saved $($asset.Group)/$($asset.File)"
            $success = $true
            break
        }
        catch {
            Write-Warning "attempt $attempt failed for $($asset.Group)/$($asset.File): $($_.Exception.Message)"
            if (Test-Path -LiteralPath $destination) {
                Remove-Item -LiteralPath $destination -Force
            }
        }
    }

    if (-not $success) {
        throw "Unable to download $($asset.Url)"
    }
}
