import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
declare var lucide: any;

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs.html',
})
export class Docs implements AfterViewInit {
  nodeCode = `process.on('uncaughtException', async (error) => {
  try {
    await fetch('https://tracelens-7hdm.onrender.com/api/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <YOUR_API_KEY>' // Use process.env in production
      },
      body: JSON.stringify({
        message: error.message,
        stackTrace: error.stack,
        service: 'your-node-service'
      })
    });
  } catch (err) {
    console.error("TraceLens alert failed");
  }
});`;

  pythonCode = `import urllib.request, json, traceback, ssl

def report_error(e, service_name):
    payload = {
        "message": str(e),
        "stackTrace": traceback.format_exc(),
        "service": service_name
    }
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    req = urllib.request.Request(
        'https://tracelens-7hdm.onrender.com/api/incidents',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': 'Bearer <YOUR_API_KEY>'},
        method='POST'
    )
    try:
        urllib.request.urlopen(req, context=ctx)
    except Exception:
        pass

try:
    # Your logic here
    10 / 0
except Exception as e:
    report_error(e, "your-python-worker")`;

  frontendCode = `// Attach this globally in your frontend (e.g., app.js or index.html)
window.addEventListener('error', async function(event) {
  try {
    await fetch('https://tracelens-7hdm.onrender.com/api/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <YOUR_API_KEY>'
      },
      body: JSON.stringify({
        message: event.message,
        stackTrace: event.error ? event.error.stack : 'No stack trace available',
        service: 'frontend-web-app'
      })
    });
  } catch (err) {
    console.error("TraceLens alert failed");
  }
});`;

  ngAfterViewInit() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  copyCode(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Code copied to clipboard!');
    });
  }
}
