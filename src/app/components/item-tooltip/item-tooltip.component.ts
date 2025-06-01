import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SelectedItemService, InventoryItem } from '../../services/selected-item.service';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-item-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-tooltip.component.html',
  styleUrls: ['./item-tooltip.component.scss'],
  animations: [
    trigger('tooltipAnimation', [
      state('void', style({
        opacity: 0,
        transform: 'translateY(-20px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('void => visible', animate('200ms ease-out')),
      transition('visible => void', animate('150ms ease-in'))
    ])
  ]
})
export class ItemTooltipComponent implements OnInit, OnDestroy {
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