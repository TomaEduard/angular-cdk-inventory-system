import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SelectedItemDisplayComponent } from './components/selected-item-display/selected-item-display.component';
import { SelectedItemService } from './services/selected-item.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SelectedItemDisplayComponent],
  template: '<router-outlet></router-outlet><app-selected-item-display></app-selected-item-display>',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'angular-cdk-inventory-system';

  constructor(private selectedItemService: SelectedItemService) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Check if the click target is an inventory item
    const target = event.target as HTMLElement;
    const isInventoryItem = target.closest('.inventory-item');

    // If the click is outside of any inventory item, clear the selection
    if (!isInventoryItem) {
      this.selectedItemService.clearSelection();
    }
  }
}
