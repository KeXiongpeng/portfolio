# Generate tabBar icons (81x81, transparent bg, line style)
Add-Type -AssemblyName System.Drawing

$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) "assets\tabbar"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$inactive = [System.Drawing.Color]::FromArgb(156, 163, 175)
$active   = [System.Drawing.Color]::FromArgb(59, 130, 246)

function New-Icon($name, $color, $drawFn) {
    $bmp = New-Object System.Drawing.Bitmap(81, 81)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    $pen = New-Object System.Drawing.Pen($color, 3.0)
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    & $drawFn $g $pen
    $path = Join-Path $outDir "$name.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Output "  -> $name.png"
}

$drawHome = {
    param($g, $pen)
    $p1 = New-Object System.Drawing.PointF(40, 16)
    $p2 = New-Object System.Drawing.PointF(16, 42)
    $p3 = New-Object System.Drawing.PointF(64, 42)
    $g.DrawLines($pen, @($p1, $p2, $p3))
    $g.DrawRectangle($pen, 22, 42, 36, 26)
    $g.DrawRectangle($pen, 35, 54, 10, 14)
}

$drawFolder = {
    param($g, $pen)
    $g.DrawRectangle($pen, 30, 22, 8, 8)
    $rect = New-Object System.Drawing.Rectangle(15, 30, 50, 34)
    $radius = 8
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($rect.X, $rect.Y, $radius, $radius, 180, 90)
    $path.AddArc($rect.Right - $radius, $rect.Y, $radius, $radius, 270, 90)
    $path.AddArc($rect.Right - $radius, $rect.Bottom - $radius, $radius, $radius, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $radius, $radius, $radius, 90, 90)
    $path.CloseFigure()
    $g.DrawPath($pen, $path)
}

$drawBlog = {
    param($g, $pen)
    $g.DrawRectangle($pen, 22, 12, 37, 56)
    $g.DrawLine($pen, 30, 28, 52, 28)
    $g.DrawLine($pen, 30, 40, 52, 40)
    $g.DrawLine($pen, 30, 52, 44, 52)
}

$drawAbout = {
    param($g, $pen)
    $g.DrawEllipse($pen, 29, 14, 24, 24)
    $g.DrawArc($pen, 18, 44, 46, 40, 180, 180)
}

Write-Output "Inactive icons (gray):"
New-Icon "home"    $inactive $drawHome
New-Icon "folder"  $inactive $drawFolder
New-Icon "blog"    $inactive $drawBlog
New-Icon "about"   $inactive $drawAbout

Write-Output "Active icons (blue):"
New-Icon "home-active"    $active $drawHome
New-Icon "folder-active"  $active $drawFolder
New-Icon "blog-active"    $active $drawBlog
New-Icon "about-active"   $active $drawAbout

Write-Output "Done! 8 icons generated."
Get-ChildItem $outDir | Format-Table Name, Length -AutoSize
