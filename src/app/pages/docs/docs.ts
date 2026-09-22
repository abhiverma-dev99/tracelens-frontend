import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { refreshIcons } from '../../utils/icons';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './docs.html',
})
export class Docs implements AfterViewInit {
  installCode = `npm install @tracelens/node`;

  initCode = `import TraceLens from "@tracelens/node";

TraceLens.init({
  apiKey: process.env.TRACELENS_API_KEY!,
  serviceName: "my-api",
  environment: "production",
});`;

  expressCode = `import TraceLens from "@tracelens/node";

TraceLens.init({
  apiKey: process.env.TRACELENS_API_KEY!,
  serviceName: "my-api",
  environment: "production",
});

// After your routes:
app.use(TraceLens.errorHandler());`;

  envCode = `TRACELENS_API_KEY=your-project-api-key
TRACELENS_BASE_URL=https://tracelens-7hdm.onrender.com`;

  testCode = `import TraceLens from "@tracelens/node";

TraceLens.init({
  apiKey: process.env.TRACELENS_API_KEY!,
  serviceName: "test-service",
  environment: "development",
});

throw new Error("TraceLens SDK test");`;

  copied = '';

  ngAfterViewInit() {
    refreshIcons();
  }

  copyCode(id: string, text: string) {
    void navigator.clipboard.writeText(text).then(() => {
      this.copied = id;
      setTimeout(() => {
        if (this.copied === id) this.copied = '';
      }, 1500);
    });
  }
}
