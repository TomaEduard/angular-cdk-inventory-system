import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList } from '@angular/cdk/drag-drop';
import { MatSliderModule } from '@angular/material/slider';
import { SelectedItemService, InventoryItem, Description } from '../services/selected-item.service';
import { InventoryService } from '../services/inventory.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, MatSliderModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit, AfterViewInit {
  @ViewChildren(CdkDropList) dropLists!: QueryList<CdkDropList>;
  @ViewChild('personalInventory') personalInventory!: ElementRef;

  rowCount = 6;
  columnCount = 6;
  itemDensity = 36;

  // Track the current item count and total slots
  itemCount = 0;
  totalSlots = 0;

  selectedItem: InventoryItem | null = null;


  // Personal inventory data - initialized as empty, will be populated in ngOnInit
  personalInventoryData: InventoryItem[][] = [];

  // Not inventory
  // Chest inventory data
  chestInventoryData: InventoryItem[][] = [
    [
      { 
        type: 'grape', 
        class: 'inventory-item', 
        itemTypes: ['food'], 
        imagePath: 'assets/images/items_34x34/item_0_0.png',
        description: {
          title: 'Grape',
          body: 'A juicy purple grape. Restores a small amount of health.'
        }
      },
      { 
        type: 'sword1', 
        class: 'inventory-item', 
        itemTypes: ['weapon', 'sword'], 
        imagePath: 'assets/images/items_34x34/item_0_5.png',
        description: {
          title: 'Sword',
          body: 'A sharp sword for combat. Deals moderate damage.'
        }
      },
      { 
        type: 'carrot', 
        class: 'inventory-item', 
        itemTypes: ['food'], 
        imagePath: 'assets/images/items_34x34/item_1_1.png',
        description: {
          title: 'Carrot',
          body: 'A fresh orange carrot. Can be eaten for health.'
        }
      },
      { 
        type: 'fire-sword1', 
        class: 'inventory-item', 
        itemTypes: ['weapon', 'sword', 'enchanted'], 
        imagePath: 'assets/images/items_34x34/item_28_1.png',
        description: {
          title: 'Fire Sword',
          body: 'A magical sword imbued with fire. Deals additional fire damage.'
        }
      },
      { 
        type: 'fire-bow1', 
        class: 'inventory-item', 
        itemTypes: ['weapon', 'bow', 'enchanted'], 
        imagePath: 'assets/images/items_34x34/item_11_7.png',
        description: {
          title: 'Fire Bow',
          body: 'A magical bow that shoots flaming arrows. Effective at long range.'
        }
      }
    ],
    [
      { 
        type: 'carrot', 
        class: 'inventory-item', 
        itemTypes: ['food'], 
        imagePath: 'assets/images/items_34x34/item_1_1.png',
        description: {
          title: 'Carrot',
          body: 'A fresh orange carrot. Can be eaten for health.'
        }
      },
      { 
        type: 'fire-axe1', 
        class: 'inventory-item', 
        itemTypes: ['weapon', 'axe', 'enchanted'], 
        imagePath: 'assets/images/items_34x34/item_10_9.png',
        description: {
          title: 'Fire Axe',
          body: 'A magical axe imbued with fire. Deals additional fire damage and can burn trees.'
        }
      },
      { type: '', class: '', itemTypes: [], imagePath: '' },
      { type: '', class: '', itemTypes: [], imagePath: '' },
      { type: '', class: '', itemTypes: [], imagePath: '' }
    ]
  ];

  // Furnace inventory data
  furnaceInventoryData: InventoryItem[][] = [
    [
      { type: '', class: '', itemTypes: [], imagePath: '' },
      { type: '', class: '', itemTypes: [], imagePath: '' }
    ],
    [
      { type: '', class: '', itemTypes: [], imagePath: '' },
      { type: '', class: '', itemTypes: [], imagePath: '' }
    ]
  ];

  // Enchanted weapons inventory data
  enchantedWeaponsInventoryData: InventoryItem[][] = [
    [
      { 
        type: 'fire-bow1', 
        class: 'inventory-item', 
        itemTypes: ['weapon', 'bow', 'enchanted'], 
        imagePath: 'assets/images/items_34x34/item_11_7.png',
        description: {
          title: 'Fire Bow',
          body: 'A magical bow that shoots flaming arrows. Effective at long range.'
        }
      },
      { type: '', class: '', itemTypes: [], imagePath: '' }
    ],
    [
      { type: '', class: '', itemTypes: [], imagePath: '' },
      { type: '', class: '', itemTypes: [], imagePath: '' }
    ]
  ];

  constructor(
    private selectedItemService: SelectedItemService,
    private inventoryService: InventoryService
  ) { }

  ngOnInit(): void {
    // Subscribe to the selectedItem$ observable to track the currently selected item
    this.selectedItemService.selectedItem$.subscribe(item => {
      this.selectedItem = item;
    });

    // Initialize the inventory with a default structure and populate it with items
    // This ensures that the inventory is populated with itemDensity items during initialization
    this.initializeInventory();
    this.populateInventoryWithItems();
    this.updateItemCountAndTotalSlots();

    // Wait for item definitions to be loaded before repopulating the inventory with real items
    // Use take(1) to automatically unsubscribe after the first emission
    this.inventoryService.itemDefinitionsLoaded$.pipe(take(1)).subscribe(loaded => {
      if (loaded) {
        console.log('Item definitions loaded, repopulating inventory with real items...');
        // Repopulate the inventory with real items from item definitions
        this.repopulateInventory();
        // Calculate item count and total slots
        this.updateItemCountAndTotalSlots();
      } else {
        console.log('Item definitions not loaded, inventory already populated with default items...');

        // Still try to subscribe again in case the item definitions are loaded later
        this.inventoryService.itemDefinitionsLoaded$.pipe(
          // Skip the first emission (which we just processed)
          // and take only the next one where loaded is true
          take(1)
        ).subscribe(loaded => {
          if (loaded) {
            console.log('Item definitions now loaded, repopulating inventory with real items...');
            this.repopulateInventory();
            this.updateItemCountAndTotalSlots();
          }
        });
      }
    });
  }

  // Calculate and update the item count and total slots
  updateItemCountAndTotalSlots(): void {
    // Calculate total slots
    this.totalSlots = this.rowCount * this.columnCount;

    // Calculate current item count
    this.itemCount = this.getCurrentInventoryItems().length;
  }

  // Initialize the inventory with a default structure
  initializeInventory(): void {
    // Create a default inventory structure with empty cells
    this.personalInventoryData = [];
    for (let i = 0; i < this.rowCount; i++) {
      const row: InventoryItem[] = [];
      for (let j = 0; j < this.columnCount; j++) {
        row.push(this.inventoryService.createEmptyCell());
      }
      this.personalInventoryData.push(row);
    }

    // Update the item count and total slots
    this.updateItemCountAndTotalSlots();
  }

  onItemClick(item: InventoryItem): void {
    if (item.type) {
      this.selectedItemService.selectItem(item);
    }
  }

  ngAfterViewInit(): void {
    // Connect drop lists after view init and whenever they change
    this.connectDropLists();

    // Re-connect drop lists when they change (e.g., when rows/columns are added/removed)
    this.dropLists.changes.subscribe(() => {
      this.connectDropLists();
    });

    // Use setTimeout to defer the call to onItemDensityChange until after the change detection cycle is complete
    // This prevents ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.onItemDensityChange(this.itemDensity);
    });
  }

  connectDropLists(): void {
    const lists = this.dropLists.toArray();
    lists.forEach(list => {
      const siblings = lists.filter(l => l !== list);
      list.connectedTo = siblings;
    });
  }

  onRowCountChange(value: number): void {
    this.rowCount = value;
    this.adjustPersonalInventorySize();
    this.updateItemCountAndTotalSlots();
  }

  onColumnCountChange(value: number): void {
    this.columnCount = value;
    this.adjustPersonalInventorySize();
    this.updateItemCountAndTotalSlots();
  }

  onItemDensityChange(value: number): void {
    this.itemDensity = value;
    // We don't need to call adjustPersonalInventorySize() here anymore
    // as it would add/remove rows/columns but not handle the item count correctly
    // Instead, we'll just repopulate the inventory with the new item count

    // Wait for item definitions to be loaded before repopulating
    // Use take(1) to automatically unsubscribe after the first emission
    this.inventoryService.itemDefinitionsLoaded$.pipe(take(1)).subscribe(loaded => {
      if (loaded) {
        console.log('Item definitions loaded, repopulating inventory after density change...');
        this.repopulateInventory();
        this.updateItemCountAndTotalSlots();
      } else {
        console.log('Item definitions not loaded, using default inventory for density change...');
        // If item definitions couldn't be loaded, try to populate the inventory anyway
        // This will use default items if necessary
        try {
          this.repopulateInventory();
          this.updateItemCountAndTotalSlots();
        } catch (error) {
          console.error('Error populating inventory with default items after density change:', error);
          // If there's an error, make sure we at least have an empty grid
          this.initializeInventory();
        }

        // Still try to subscribe again in case the item definitions are loaded later
        this.inventoryService.itemDefinitionsLoaded$.pipe(
          // Skip the first emission (which we just processed)
          // and take only the next one where loaded is true
          take(1)
        ).subscribe(loaded => {
          if (loaded) {
            console.log('Item definitions now loaded, repopulating inventory after density change...');
            this.repopulateInventory();
            this.updateItemCountAndTotalSlots();
          }
        });
      }
    });
  }

  // This method is kept for backward compatibility
  // but now it uses the new approach
  applyItemDensityToExistingCells(): void {
    // Wait for item definitions to be loaded before repopulating
    // Use take(1) to automatically unsubscribe after the first emission
    this.inventoryService.itemDefinitionsLoaded$.pipe(take(1)).subscribe(loaded => {
      if (loaded) {
        console.log('Item definitions loaded, applying item density to existing cells...');
        this.repopulateInventory();
      } else {
        console.log('Item definitions not loaded, using default inventory for applying item density...');
        // If item definitions couldn't be loaded, try to populate the inventory anyway
        // This will use default items if necessary
        try {
          this.repopulateInventory();
        } catch (error) {
          console.error('Error populating inventory with default items when applying item density:', error);
          // If there's an error, make sure we at least have an empty grid
          this.initializeInventory();
        }

        // Still try to subscribe again in case the item definitions are loaded later
        this.inventoryService.itemDefinitionsLoaded$.pipe(
          // Skip the first emission (which we just processed)
          // and take only the next one where loaded is true
          take(1)
        ).subscribe(loaded => {
          if (loaded) {
            console.log('Item definitions now loaded, applying item density to existing cells...');
            this.repopulateInventory();
          }
        });
      }
    });
  }

  // Get a random item from the pre-defined item definitions
  getRandomItem(): InventoryItem {
    // Use the inventory service to get a random item from item-definitions
    return this.inventoryService.getRandomItem();
  }

  // This method is no longer used with the new approach
  // It's kept for backward compatibility
  shouldHaveItem(): boolean {
    return false; // Always return false as we now use a different approach
  }

  // Helper method to get all current inventory items
  private getCurrentInventoryItems(): InventoryItem[] {
    const allItems: InventoryItem[] = [];

    // If personalInventoryData is empty, return an empty array
    if (this.personalInventoryData.length === 0) {
      return allItems;
    }

    // Collect all items from the personal inventory
    this.personalInventoryData.forEach(row => {
      row.forEach(item => {
        if (item.type) {
          allItems.push(item);
        }
      });
    });

    return allItems;
  }

  // Repopulate the inventory with the specified number of items
  repopulateInventory(): void {
    this.clearInventory();
    this.populateInventoryWithItems();
    this.updateItemCountAndTotalSlots();
  }

  // Clear all items from the inventory
  clearInventory(): void {
    // If personalInventoryData is empty, there's nothing to clear
    if (this.personalInventoryData.length === 0) {
      return;
    }

    this.personalInventoryData.forEach(row => {
      for (let i = 0; i < row.length; i++) {
        row[i] = this.inventoryService.createEmptyCell();
      }
    });
  }

  // Populate the inventory with the specified number of items
  populateInventoryWithItems(): void {
    try {
      // Use the inventory service to populate the grid
      this.personalInventoryData = this.inventoryService.populateInventoryGrid(
        this.rowCount, 
        this.columnCount, 
        this.itemDensity
      );
    } catch (error) {
      console.error('Error populating inventory grid:', error);
      // If there's an error, make sure we at least have an empty grid
      this.initializeInventory();
    }

    // Update the item count after populating
    this.updateItemCountAndTotalSlots();
  }

  adjustPersonalInventorySize(): void {
    // If personalInventoryData is empty, create a new array with the correct number of rows and columns
    if (this.personalInventoryData.length === 0) {
      this.personalInventoryData = [];
      for (let i = 0; i < this.rowCount; i++) {
        const newRow: InventoryItem[] = [];
        for (let j = 0; j < this.columnCount; j++) {
          newRow.push(this.inventoryService.createEmptyCell());
        }
        this.personalInventoryData.push(newRow);
      }
    } else {
      // Adjust rows
      if (this.personalInventoryData.length < this.rowCount) {
        // Add rows
        while (this.personalInventoryData.length < this.rowCount) {
          const newRow: InventoryItem[] = [];
          for (let i = 0; i < this.columnCount; i++) {
            // Add empty cells
            newRow.push(this.inventoryService.createEmptyCell());
          }
          this.personalInventoryData.push(newRow);
        }
      } else if (this.personalInventoryData.length > this.rowCount) {
        // Remove rows
        this.personalInventoryData = this.personalInventoryData.slice(0, this.rowCount);
      }

      // Adjust columns in each row
      this.personalInventoryData.forEach(row => {
        if (row.length < this.columnCount) {
          // Add cells
          while (row.length < this.columnCount) {
            // Add empty cells
            row.push(this.inventoryService.createEmptyCell());
          }
        } else if (row.length > this.columnCount) {
          // Remove cells
          row.length = this.columnCount;
        }
      });
    }

    // After adjusting the size, repopulate the inventory with the correct number of items
    // Wait for item definitions to be loaded before repopulating
    // Use take(1) to automatically unsubscribe after the first emission
    this.inventoryService.itemDefinitionsLoaded$.pipe(take(1)).subscribe(loaded => {
      if (loaded) {
        console.log('Item definitions loaded, repopulating inventory after size adjustment...');
        this.repopulateInventory();
      } else {
        console.log('Waiting for item definitions to be loaded before repopulating after size adjustment...');
        // If not loaded yet, subscribe again to wait for it to be loaded
        this.inventoryService.itemDefinitionsLoaded$.pipe(
          // Skip the first emission (which we just processed)
          // and take only the next one where loaded is true
          take(1)
        ).subscribe(loaded => {
          if (loaded) {
            console.log('Item definitions now loaded, repopulating inventory after size adjustment...');
            this.repopulateInventory();
          }
        });
      }
    });
  }

  dragStarted(event: any): void {
    // Add the dragging class to the item being dragged
    const draggedItem = event.source.element.nativeElement;
    draggedItem.classList.add('dragging');

    // Get the item data and select it in the service (same behavior as clicking)
    const itemData = event.source.data;
    if (itemData && itemData.type) {
      this.selectedItemService.selectItem(itemData);
    }
  }

  dragMoved(event: any): void {
    // You can add additional logic here if needed
    // This method will be called continuously as the item is being dragged
  }

  drop(event: CdkDragDrop<InventoryItem[]>, rowIndex: number, targetInventory: InventoryItem[][]): void {
    // Remove the dragging class from the item when it's dropped
    const draggedItem = event.item.element.nativeElement;
    draggedItem.classList.remove('dragging');
    // Get the cell indices
    const targetCellIndex = this.getCellIndexFromContainer(event.container);
    const sourceCellIndex = this.getCellIndexFromContainer(event.previousContainer);

    // Remove the drag-source class from all cells
    document.querySelectorAll('.inventory-cell.drag-source').forEach(cell => {
      cell.classList.remove('drag-source');
    });

    if (event.previousContainer === event.container) {
      // Move within the same container (same cell)
      // This shouldn't happen with our setup, but handle it just in case
      console.log("Moving within the same cell");
      return;
    } else if (targetInventory === this.getInventoryFromContainer(event.previousContainer)) {
      // Move within the same inventory but different cells
      const sourceRowIndex = this.getRowIndexFromContainer(event.previousContainer);

      if (sourceRowIndex !== null && targetCellIndex !== null && sourceCellIndex !== null) {
        // Get the items
        const sourceItem = targetInventory[sourceRowIndex][sourceCellIndex];
        const targetItem = targetInventory[rowIndex][targetCellIndex];

        console.log("Swapping items within same inventory", sourceItem, targetItem);

        // Swap the items
        targetInventory[rowIndex][targetCellIndex] = sourceItem;
        targetInventory[sourceRowIndex][sourceCellIndex] = targetItem;

        // Update the UI to reflect the changes
        event.container.data[0] = sourceItem;
        event.previousContainer.data[0] = targetItem;

        // Animate the swap if the target cell had an item
        if (targetItem.type) {
          // Find the DOM elements for animation
          const sourceCell = event.previousContainer.element.nativeElement;
          const targetCell = event.container.element.nativeElement;

          // We need to wait for the Angular change detection to update the DOM
          setTimeout(() => {
            // Find the items in both cells
            const itemInSourceCell = sourceCell.querySelector('.inventory-item');
            const itemInTargetCell = targetCell.querySelector('.inventory-item');

            if (itemInSourceCell) {
              // Add a temporary class for animation
              itemInSourceCell.classList.add('swapping');

              // Remove the class after animation completes
              setTimeout(() => {
                itemInSourceCell.classList.remove('swapping');
              }, 300);
            }

            if (itemInTargetCell) {
              // Add a temporary class for animation
              itemInTargetCell.classList.add('swapping');

              // Remove the class after animation completes
              setTimeout(() => {
                itemInTargetCell.classList.remove('swapping');
              }, 300);
            }
          }, 0);
        }
      }
    } else {
      // Move between different inventories
      const sourceInventory = this.getInventoryFromContainer(event.previousContainer);
      const sourceRowIndex = this.getRowIndexFromContainer(event.previousContainer);

      if (sourceInventory && sourceRowIndex !== null && targetCellIndex !== null && sourceCellIndex !== null) {
        // Check if the item can be moved to the target container
        const sourceItem = sourceInventory[sourceRowIndex][sourceCellIndex];
        const targetElement = event.container.element.nativeElement;
        const targetTable = targetElement.closest('.inventory-table');

        if (targetTable) {
          const whitelist = targetTable.getAttribute('data-item-filter-whitelist');
          const blacklist = targetTable.getAttribute('data-item-filter-blacklist');

          if (this.canMoveItem(sourceItem, whitelist, blacklist)) {
            // Get the target item (if any)
            const targetItem = targetInventory[rowIndex][targetCellIndex];

            console.log("Moving between inventories", sourceItem, targetItem);

            // Update the data model
            targetInventory[rowIndex][targetCellIndex] = sourceItem;
            sourceInventory[sourceRowIndex][sourceCellIndex] = targetItem;

            // Update the UI to reflect the changes
            event.container.data[0] = sourceItem;
            event.previousContainer.data[0] = targetItem;

            // If the target cell had an item, log the swap and animate it back
            if (targetItem.type) {
              console.log("Swapping items between containers");

              // Find the DOM elements for animation
              const sourceCell = event.previousContainer.element.nativeElement;
              const targetCell = event.container.element.nativeElement;

              // We need to wait for the Angular change detection to update the DOM
              setTimeout(() => {
                // Find the items in both cells
                const itemInSourceCell = sourceCell.querySelector('.inventory-item');
                const itemInTargetCell = targetCell.querySelector('.inventory-item');

                if (itemInSourceCell) {
                  // Add a temporary class for animation
                  itemInSourceCell.classList.add('swapping');

                  // Remove the class after animation completes
                  setTimeout(() => {
                    itemInSourceCell.classList.remove('swapping');
                  }, 300);
                }

                if (itemInTargetCell) {
                  // Add a temporary class for animation
                  itemInTargetCell.classList.add('swapping');

                  // Remove the class after animation completes
                  setTimeout(() => {
                    itemInTargetCell.classList.remove('swapping');
                  }, 300);
                }
              }, 0);
            } else {
              console.log("Moving to empty cell");
            }

            // Force change detection to update the view
            setTimeout(() => {
              // This timeout helps ensure the UI updates properly
            }, 0);
          } else {
            // If the item can't be moved, prevent the drop and show visual feedback
            console.log("Can't move to this slot");
            event.item.element.nativeElement.classList.add('invalid-drop');
            setTimeout(() => {
              event.item.element.nativeElement.classList.remove('invalid-drop');
            }, 500);
          }
        }
      }
    }

    // Update item count and total slots after inventory changes
    this.updateItemCountAndTotalSlots();
  }

  getCellIndexFromContainer(container: CdkDropList): number | null {
    const element = container.element.nativeElement;
    const rowElement = element.closest('.inventory-row');

    if (rowElement) {
      const cells = Array.from(rowElement.querySelectorAll('.inventory-cell'));
      return cells.indexOf(element);
    }
    return null;
  }

  getInventoryFromContainer(container: CdkDropList): InventoryItem[][] | null {
    const element = container.element.nativeElement;
    const tableElement = element.closest('.inventory-table');

    if (tableElement) {
      if (tableElement.id === 'personal-inventory') {
        return this.personalInventoryData;
      } else if (tableElement.hasAttribute('data-item-filter-whitelist')) {
        const whitelist = tableElement.getAttribute('data-item-filter-whitelist');
        if (whitelist === 'cookable') {
          return this.furnaceInventoryData;
        } else if (whitelist === 'weapon+enchanted') {
          return this.enchantedWeaponsInventoryData;
        }
      } else {
        return this.chestInventoryData;
      }
    }
    return null;
  }

  getRowIndexFromContainer(container: CdkDropList): number | null {
    const element = container.element.nativeElement;
    const rowElement = element.closest('.inventory-row');
    const tableElement = element.closest('.inventory-table');

    if (rowElement && tableElement) {
      const rows = Array.from(tableElement.querySelectorAll('.inventory-row'));
      return rows.indexOf(rowElement);
    }
    return null;
  }

  canMoveItem(item: InventoryItem, whitelist: string | null, blacklist: string | null): boolean {
    if (!item.type) return true; // Empty items can always be moved

    if (!whitelist && !blacklist) return true;

    const whitelistArray = whitelist ? whitelist.split(/\s+/) : [];
    const blacklistArray = blacklist ? blacklist.split(/\s+/) : [];

    return this.verifyWithWhiteBlackLists(item.itemTypes, whitelistArray, blacklistArray);
  }

  verifyWithWhiteBlackLists(itemTypes: string[], whitelist: string[], blacklist: string[]): boolean {
    // If white and black lists are empty, return true
    if (whitelist.length === 0 && blacklist.length === 0) {
      return true;
    }

    // Check if the item is in the blacklist
    let inBlacklist = false;
    blacklist.forEach(blacklistItem => {
      const blacklistAndArray = blacklistItem.split('+');
      let andedResult = true;

      for (const blacklistType of blacklistAndArray) {
        // Check if the item type includes the blacklist type
        andedResult = andedResult && itemTypes.includes(blacklistType);
      }

      if (andedResult) {
        inBlacklist = true;
      }
    });

    // Check if the item is in the whitelist
    let inWhitelist = false;
    whitelist.forEach(whitelistItem => {
      const whitelistAndArray = whitelistItem.split('+');
      let andedResult = true;

      for (const whitelistType of whitelistAndArray) {
        // Check if the item type includes the whitelist type
        andedResult = andedResult && itemTypes.includes(whitelistType);
      }

      if (andedResult) {
        inWhitelist = true;
      }
    });

    // If whitelist is empty, we don't need to check it
    // If blacklist is empty, we don't need to check it
    inWhitelist = whitelist.length > 0 ? inWhitelist : true;
    inBlacklist = blacklist.length > 0 ? inBlacklist : false;

    // Item can be moved if it's in the whitelist (or whitelist is empty) and not in the blacklist
    return inWhitelist && !inBlacklist;
  }
}
