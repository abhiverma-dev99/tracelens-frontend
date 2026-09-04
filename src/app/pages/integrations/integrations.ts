import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare var lucide: any;

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './integrations.html'
})
export class Integrations implements AfterViewInit {
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 50);
  }
}