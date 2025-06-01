import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InventoryItem } from './selected-item.service';
import { Observable, BehaviorSubject, of, timer } from 'rxjs';
import { tap, catchError, retry, delay, retryWhen, take, concatMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  // Item definitions loaded from JSON file
  private itemDefinitions: any[] = [];

  // BehaviorSubject to track the loading state of item definitions
  private itemDefinitionsLoaded = new BehaviorSubject<boolean>(false);

  // Observable that components can subscribe to know when the definitions are loaded
  public itemDefinitionsLoaded$ = this.itemDefinitionsLoaded.asObservable();

  constructor(private http: HttpClient) {
    // Load item definitions when the service is instantiated
    this.loadItemDefinitions();
  }

  /**
   * Load item definitions from JSON file with retry logic
   */
  private loadItemDefinitions(): void {
    this.http.get<any[]>('assets/item-definitions.json')
      .pipe(
        // Retry up to 3 times with a 1-second delay between retries
        retryWhen(errors => 
          errors.pipe(
            concatMap((error, index) => {
              // If we've retried 3 times, throw the error
              if (index >= 3) {
                console.error('Failed to load item definitions after 3 retries:', error);
                return of(error);
              }
              console.log(`Retry attempt ${index + 1} for loading item definitions...`);
              // Otherwise, retry after a delay
              return timer(1000);
            })
          )
        )
      )
      .subscribe(
        (data) => {
          console.log('Item definitions loaded successfully:', data.length, 'items');
          this.itemDefinitions = data;
          this.itemDefinitionsLoaded.next(true);
        },
        (error) => {
          console.error('Error loading item definitions:', error);
          // Fallback to empty array if JSON file can't be loaded
          this.itemDefinitions = [];
          this.itemDefinitionsLoaded.next(false);
        }
      );
  }


  getRandomItem(): InventoryItem {
    // Check if item definitions are loaded
    if (this.itemDefinitions.length === 0) {
      console.warn('Item definitions not loaded yet, returning temporary default item. Loading status:', this.itemDefinitionsLoaded.getValue());
      console.warn('This may happen if you try to use items before the definitions are loaded from item-definitions.json.');
      console.warn('Consider waiting for itemDefinitionsLoaded$ to emit true before requesting items.');

      // FALLBACK ONLY: Return a temporary default item until real items are loaded
      // This is not a "generated" item but a placeholder until we can select from real items
      const imageIndex = Math.floor(Math.random() * 30);
      const rowIndex = Math.floor(Math.random() * 15);

      return {
        type: `default_${Date.now()}_${Math.random()}`,
        class: 'inventory-item',
        itemTypes: ['default'],
        imagePath: `assets/images/items_34x34/item_${imageIndex}_${rowIndex}.png`,
        description: {
          title: `Temporary Default Item (${new Date().toISOString()})`,
          body: 'This is a temporary placeholder used when item definitions are not loaded yet.'
        },
        _uniqueId: Date.now() + '_' + Math.random()
      };
    }

    // Simply select a random item from the item definitions
    const randomIndex = Math.floor(Math.random() * this.itemDefinitions.length);
    // Create a deep copy of the item to ensure each instance is unique
    const originalItem = this.itemDefinitions[randomIndex];
    return {
      ...originalItem,
      // Add a unique identifier to ensure each instance is unique
      // This won't affect the item's functionality but will make it a unique object
      _uniqueId: Date.now() + '_' + Math.random()
    };
  }

  /**
   * Select multiple random items from the pre-defined item definitions
   * @param count Number of items to select
   * @returns Array of randomly selected inventory items from item-definitions
   */
  getRandomItems(count: number): InventoryItem[] {
    const items: InventoryItem[] = [];

    for (let i = 0; i < count; i++) {
      const newItem = this.getRandomItem();
      items.push(newItem);
    }

    return items;
  }

  /**
   * Populate an inventory grid with random items from item-definitions
   * @param rows Number of rows in the grid
   * @param columns Number of columns in the grid
   * @param itemCount Number of items to place in the grid
   * @returns 2D array of inventory items
   */
  populateInventoryGrid(rows: number, columns: number, itemCount: number): InventoryItem[][] {
    // Check if item definitions are loaded
    if (this.itemDefinitions.length === 0) {
      console.warn('Item definitions not loaded yet in populateInventoryGrid. Loading status:', this.itemDefinitionsLoaded.getValue());
      console.warn('This may result in default items being used. Consider waiting for itemDefinitionsLoaded$ to emit true before calling this method.');
    }

    // Create empty grid
    const grid: InventoryItem[][] = [];
    for (let i = 0; i < rows; i++) {
      grid.push(Array(columns).fill(null).map(() => ({ type: '', class: '', itemTypes: [], imagePath: '' })));
    }

    // Calculate the total number of cells
    const totalCells = rows * columns;

    // Ensure itemCount doesn't exceed the total number of cells
    const actualItemCount = Math.min(itemCount, totalCells);

    // Create an array of all cell positions
    const positions: {row: number, col: number}[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        positions.push({row, col});
      }
    }

    // Shuffle the positions array
    this.shuffleArray(positions);

    // Place items in the first 'itemCount' positions
    for (let i = 0; i < actualItemCount; i++) {
      const pos = positions[i];
      const newItem = this.getRandomItem();
      grid[pos.row][pos.col] = newItem;
    }

    return grid;
  }

  /**
   * Create an empty inventory cell
   * @returns Empty inventory item
   */
  createEmptyCell(): InventoryItem {
    return { type: '', class: '', itemTypes: [], imagePath: '' };
  }

  /**
   * Count occurrences of each item type
   * @param items Array of inventory items
   * @returns Object with counts of each item type
   */
  private getItemTypeCounts(items: InventoryItem[]): { [key: string]: number } {
    const counts: { [key: string]: number } = {};

    items.forEach(item => {
      if (item.type) {
        counts[item.type] = (counts[item.type] || 0) + 1;
      }
    });

    return counts;
  }

  /**
   * Analyze category balance
   * @param items Array of inventory items
   * @returns Object with counts of each category
   */
  private getCategoryBalance(items: InventoryItem[]): { [key: string]: number } {
    const categories = ['weapon', 'armor', 'food', 'potion', 'gem', 'scroll'];
    const counts: { [key: string]: number } = {};

    // Initialize counts
    categories.forEach(category => {
      counts[category] = 0;
    });

    // Count items in each category
    items.forEach(item => {
      if (item.itemTypes) {
        item.itemTypes.forEach(type => {
          if (categories.includes(type)) {
            counts[type]++;
          }
        });
      }
    });

    return counts;
  }

  /**
   * Find the least common category
   * @param categoryBalance Object with counts of each category
   * @returns Least common category or null if no categories
   */
  private getLeastCommonCategory(categoryBalance: { [key: string]: number }): string | null {
    const categories = Object.keys(categoryBalance);

    if (categories.length === 0) {
      return null;
    }

    // Find the category with the lowest count
    let leastCommonCategory = categories[0];
    let lowestCount = categoryBalance[leastCommonCategory];

    categories.forEach(category => {
      if (categoryBalance[category] < lowestCount) {
        leastCommonCategory = category;
        lowestCount = categoryBalance[category];
      }
    });

    return leastCommonCategory;
  }

  /**
   * Shuffle an array using the Fisher-Yates algorithm
   * @param array Array to shuffle
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
