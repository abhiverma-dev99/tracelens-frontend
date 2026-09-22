import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { refreshIcons } from '../../utils/icons';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pricing.html',
})
export class Pricing implements AfterViewInit {
  ngAfterViewInit(): void {
    refreshIcons();
  }
}
