import os
import sys
import http.server
import socketserver

PORT = 8000
DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

class SPANavigationHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Translate path to local file path
        path = self.translate_path(self.path)
        
        # If the path is a directory, check for index.html
        if os.path.isdir(path):
            path = os.path.join(path, 'index.html')
            
        # If file does not exist and does not have a file extension (it's a route)
        # fallback to index.html for SPA routing
        if not os.path.exists(path):
            _, ext = os.path.splitext(path)
            if not ext:
                self.path = '/index.html'
            
        return super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    # Change current working directory to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Allow socket reuse
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), SPANavigationHandler) as httpd:
        print(f"Serving SPA from '{DIRECTORY}' at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)
