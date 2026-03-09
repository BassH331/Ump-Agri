# PowerShell TCP Listener - Alternative to netcat
param(
    [int]$Port = 9001,
    [string]$OutputFile = "received-file.zip"
)

Write-Host "Starting TCP listener on port $Port..."
Write-Host "Output will be saved to: $OutputFile"

try {
    # Create TCP listener
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
    $listener.Start()
    
    Write-Host "Listening on port $Port. Waiting for connection..."
    
    # Accept connection
    $client = $listener.AcceptTcpClient()
    $clientEndpoint = $client.Client.RemoteEndPoint
    Write-Host "Connection accepted from: $clientEndpoint"
    
    # Get network stream and create file stream
    $networkStream = $client.GetStream()
    $fileStream = [System.IO.File]::Create($OutputFile)
    
    Write-Host "Receiving data..."
    
    # Copy data from network to file
    $networkStream.CopyTo($fileStream)
    
    Write-Host "File received successfully: $OutputFile"
    
} catch {
    Write-Error "Error: $($_.Exception.Message)"
} finally {
    # Cleanup
    if ($fileStream) { $fileStream.Close() }
    if ($client) { $client.Close() }
    if ($listener) { $listener.Stop() }
    Write-Host "Connection closed."
}