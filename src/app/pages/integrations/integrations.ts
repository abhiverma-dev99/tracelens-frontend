import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { refreshIcons } from '../../utils/icons';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './integrations.html',
})
export class Integrations implements AfterViewInit {
  ngAfterViewInit(): void {
    refreshIcons();
  }
}
