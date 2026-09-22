import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { refreshIcons } from '../../utils/icons';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product.html',
})
export class Product implements AfterViewInit {
  ngAfterViewInit(): void {
    refreshIcons();
  }
}
