# Simple HTTP Server - Alternative for file sharing
param(
    [int]$Port = 8080,
    [string]$Directory = "."
)

Write-Host "Starting HTTP server on port $Port..."
Write-Host "Serving directory: $(Resolve-Path $Directory)"
Write-Host "Access at: http://localhost:$Port"

try {
    # Create HTTP listener
    $listener = [System.Net.HttpListener]::new()
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Start()
    
    Write-Host "Server started. Press Ctrl+C to stop."
    
    while ($listener.IsListening) {
        # Wait for request
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url.LocalPath
        Write-Host "Request: $($request.HttpMethod) $url"
        
        if ($url -eq "/") {
            # List directory contents
            $files = Get-ChildItem $Directory | ForEach-Object {
                if ($_.PSIsContainer) {
                    "<li><a href='$($_.Name)/'>[DIR] $($_.Name)</a></li>"
                } else {
                    "<li><a href='$($_.Name)'>$($_.Name)</a> ($($_.Length) bytes)</li>"
                }
            }
            
            $html = @"
<!DOCTYPE html>
<html><head><title>File Server</title></head>
<body><h1>Directory Listing</h1><ul>$($files -join '')</ul></body></html>
"@
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
            $response.ContentType = "text/html"
        } else {
            # Serve file
            $filePath = Join-Path $Directory $url.TrimStart('/')
            if (Test-Path $filePath -PathType Leaf) {
                $buffer = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = "application/octet-stream"
            } else {
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("File not found")
                $response.StatusCode = 404
            }
        }
        
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()
    }
} catch {
    Write-Error "Error: $($_.Exception.Message)"
} finally {
    if ($listener) { $listener.Stop() }
    Write-Host "Server stopped."
}