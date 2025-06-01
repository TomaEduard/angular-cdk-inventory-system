import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Description {
  title: string;
  body: string;
}

export interface InventoryItem {
  type: string;
  class: string;
  itemTypes: string[];
  imagePath?: string;
  description?: Description;
  _uniqueId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SelectedItemService {
  private selectedItemSubject = new BehaviorSubject<InventoryItem | null>(null);
  selectedItem$: Observable<InventoryItem | null> = this.selectedItemSubject.asObservable();

  constructor() { }

  selectItem(item: InventoryItem): void {
    this.selectedItemSubject.next(item);
  }

  clearSelection(): void {
    this.selectedItemSubject.next(null);
  }
}
