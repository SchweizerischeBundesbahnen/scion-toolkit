/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {AfterViewInit, Component, ContentChildren, EventEmitter, HostBinding, HostListener, Input, OnDestroy, Output, QueryList, TrackByFunction, ViewChild, ViewChildren} from '@angular/core';
import {FocusKeyManager} from '@angular/cdk/a11y';
import {SciListItemDirective} from './list-item.directive';
import {SciListItemComponent} from './list-item/list-item.component';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {Subject} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';
import {SciListStyle} from './metadata';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import {SciViewportComponent} from '@scion/components/viewport';

/**
 * Component that contains a list of items or options which can be optionally filtered and associated with actions.
 *
 * List items are contributed as content children in the form of a `<ng-template>` decorated with `sciListItem` directive.
 * Actions are modelled in the form of a `<ng-template>` and are inputs for respective `sciListItem` directive.
 *
 * ---
 * Example of a simple list:
 *
 * <sci-list (filter)="onFilter($event)">
 *   @for (item of items$ | async; track item.id) {
 *     <ng-template sciListItem>
 *       ...
 *     </ng-template>
 *   }
 * </sci-list>
 *
 *
 * ---
 * Example of a list with actions:
 *
 * <sci-list (filter)="onFilter($event)">
 *   @for (item of items$ | async; track item.id) {
 *     <!-- list item -->
 *     <ng-template sciListItem [actions]="delete_action">
 *       ...
 *     </ng-template>
 *
 *     <!-- action -->
 *     <ng-template #delete_action>
 *       <button class="material-icons" (click)="onDelete(item.id)">delete</button>
 *     </ng-template>
 *     }
 * </sci-list>
 *
 * ## Styling
 *
 * To customize the default look of SCION components or support different themes, configure the `@scion/components` SCSS module in `styles.scss`.
 * To style a specific `sci-list` component, the following CSS variables can be set directly on the component.
 *
 * - --sci-list-item-padding: Sets the padding of a list item.
 *
 * ```css
 * sci-list {
 *   --sci-list-item-padding: 0;
 * }
 * ```
 */
@Component({
  selector: 'sci-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  imports: [
    SciViewportComponent,
    SciListItemComponent,
    SciFilterFieldComponent,
    NgClass,
    NgTemplateOutlet,
  ],
})
export class SciListComponent implements AfterViewInit, OnDestroy {

  private _focusKeyManager: FocusKeyManager<SciListItemComponent> | undefined;
  private _destroy$ = new Subject<void>();

  /**
   * Specifies where to position the filter field.
   * If not specified, does not display the filter field.
   */
  @Input()
  public filterPosition?: 'top' | 'bottom' | undefined;

  /**
   * Specifies whether to render list items or option items.
   */
  @Input()
  public style: SciListStyle = 'list-item';

  /**
   * Sets focus order in sequential keyboard navigation.
   * If not specified, the focus order is according to the position in the document (tabindex=0).
   */
  @Input()
  public tabindex?: number | undefined;

  /**
   * Emits filter text on filter change.
   */
  @Output()
  public filter = new EventEmitter<string>();

  /**
   * Emits selected item key on selection change.
   */
  @Output()
  public selection = new EventEmitter<string>();

  @ContentChildren(SciListItemDirective)
  public listItems!: QueryList<SciListItemDirective>;

  @ViewChildren(SciListItemComponent)
  private _listItemComponents!: QueryList<SciListItemComponent>;

  @ViewChild(SciFilterFieldComponent)
  private _filterField: SciFilterFieldComponent | undefined;

  @HostBinding('attr.tabindex')
  public componentTabindex = -1; // component itself is not focusable in sequential keyboard navigation, but tabindex (if any) set to filter field

  @HostListener('keydown', ['$event'])
  public onKeydown(event: KeyboardEvent): void {
    this._focusKeyManager!.onKeydown(event);
  }

  @HostListener('focus')
  public focus(): void {
    this._filterField?.focus();
  }

  public ngAfterViewInit(): void {
    this._focusKeyManager = new FocusKeyManager(this._listItemComponents);
    this._focusKeyManager.change
      .pipe(
        map(index => this.listItems.toArray()[index]),
        filter(Boolean),
        takeUntil(this._destroy$),
      )
      .subscribe((listItem: SciListItemDirective) => {
        this.selection.emit(listItem.key);
      });
  }

  public onItemClick(item: SciListItemComponent): void {
    this._focusKeyManager!.setActiveItem(item);
  }

  public onFilter(filterText: string): void {
    this._focusKeyManager!.setActiveItem(-1);
    this.filter.emit(filterText);
  }

  public onAnyKey(event: KeyboardEvent): void {
    this._filterField && this._filterField.focusAndApplyKeyboardEvent(event);
  }

  public get activeItem(): SciListItemComponent | null {
    return this._focusKeyManager?.activeItem ?? null;
  }

  public trackByFn: TrackByFunction<SciListItemDirective> = (index: number, item: SciListItemDirective): any => {
    return item.key ?? item;
  };

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
