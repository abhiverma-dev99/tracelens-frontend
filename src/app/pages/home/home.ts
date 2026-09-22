import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { refreshIcons } from '../../utils/icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
})
export class Home implements AfterViewInit {
  ngAfterViewInit(): void {
    refreshIcons();
  }
}
