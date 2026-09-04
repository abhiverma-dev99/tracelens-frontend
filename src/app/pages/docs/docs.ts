import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
declare var lucide: any;

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './docs.html'
})
export class Docs implements AfterViewInit {
  ngAfterViewInit(): void {
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 50);
  }
}