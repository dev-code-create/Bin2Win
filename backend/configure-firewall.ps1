# Configure Windows Firewall for Bin2Win Backend Server
Write-Host "🔥 Configuring Windows Firewall for Bin2Win Backend..." -ForegroundColor Yellow

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "📝 Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "💡 Then run: cd backend && .\configure-firewall.ps1" -ForegroundColor Cyan
    pause
    exit 1
}

try {
    # Remove any existing rules for this port
    Write-Host "🧹 Removing existing firewall rules for port 3001..." -ForegroundColor Cyan
    Remove-NetFirewallRule -DisplayName "Bin2Win Backend Server*" -ErrorAction SilentlyContinue

    # Add inbound rule for Node.js backend
    Write-Host "➕ Adding inbound firewall rule for port 3001..." -ForegroundColor Green
    New-NetFirewallRule -DisplayName "Bin2Win Backend Server (Inbound)" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Domain,Private,Public

    # Add outbound rule for Node.js backend
    Write-Host "➕ Adding outbound firewall rule for port 3001..." -ForegroundColor Green
    New-NetFirewallRule -DisplayName "Bin2Win Backend Server (Outbound)" -Direction Outbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Domain,Private,Public

    Write-Host "✅ Windows Firewall configured successfully!" -ForegroundColor Green
    Write-Host "📱 Your backend should now be accessible from mobile devices" -ForegroundColor Cyan
    Write-Host "🌐 Mobile URL: http://192.168.1.3:3000" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Failed to configure firewall: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running Windows Firewall manually:" -ForegroundColor Yellow
    Write-Host "   1. Open Windows Defender Firewall" -ForegroundColor White
    Write-Host "   2. Click Advanced settings" -ForegroundColor White
    Write-Host "   3. Add new Inbound Rule for TCP port 3001" -ForegroundColor White
}

Write-Host "🔧 Test connectivity with: curl http://192.168.1.3:3001/api/health" -ForegroundColor Cyan
pause
