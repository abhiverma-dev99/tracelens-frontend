import { AfterViewInit, Component } from '@angular/core';
import { refreshIcons } from '../../utils/icons';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About implements AfterViewInit {
  ngAfterViewInit(): void {
    refreshIcons();
  }
}
