import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SelectedItemService, InventoryItem } from '../../services/selected-item.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-selected-item-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selected-item-display.component.html',
  styleUrls: ['./selected-item-display.component.scss'],
  animations: [
    trigger('displayAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(20px) scale(0.8)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)'
      })),
      transition('void => visible', animate('200ms ease-out')), // More professional, faster animation
      transition('visible => void', animate('150ms ease-in'))
    ])
  ]
})
export class SelectedItemDisplayComponent implements OnInit, OnDestroy {
  selectedItem: InventoryItem | null = null;
  animationState = 'void';
  private subscription: Subscription | null = null;

  constructor(private selectedItemService: SelectedItemService) { }

  ngOnInit(): void {
    this.subscription = this.selectedItemService.selectedItem$.subscribe(item => {
      this.selectedItem = item;
      this.animationState = item ? 'visible' : 'void';
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
