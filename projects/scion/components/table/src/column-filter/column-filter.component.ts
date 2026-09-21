/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, debounced, effect, ElementRef, inject, Injector, input, runInInjectionContext, signal, untracked, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SciTableColumnLike} from '../table.model';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '@scion/components/icon';
import {firstValueFrom, skip, timer} from 'rxjs';
import {contributeMenu, SciMenuRef, ɵSciMenuService} from '@scion/components/menu';
import {toObservable} from '@angular/core/rxjs-interop';
import {SciTextPipe} from '@scion/components/text';
import {createDestroyableInjector} from '@scion/components/common';
import {SciColumnFilterBooleanLabelPipe} from './column-filter-boolean-label.pipe';

@Component({
  selector: 'sci-column-filter',
  templateUrl: './column-filter.component.html',
  styleUrl: './column-filter.component.scss',
  imports: [
    FormsModule,
    SciIconComponent,
    SciTextPipe,
    SciColumnFilterBooleanLabelPipe,
  ],
  host: {
    '[attr.data-column]': 'column().name',
    '[attr.data-disabled]': `!column().filterable() ? '' : null`,
    '(click)': 'column().filterable() && onFilterClick()',
  },
})
export class SciColumnFilterComponent<T> {

  public readonly column = input.required<SciTableColumnLike<T>>();

  protected readonly filter = signal<string | boolean | number | null>(null);
  protected readonly input = viewChild<ElementRef<HTMLElement>>('input');

  private readonly _table = inject(ɵSCI_TABLE);
  private readonly _menuService = inject(ɵSciMenuService);
  private readonly _injector = inject(Injector);
  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;

  private _menu: SciMenuRef | undefined;

  constructor() {
    this.bindToModel();
  }

  protected onFilterClick(): void {
    if (this.column().type === 'boolean') {
      this.toggleBooleanMenu();
    }
    this.input()!.nativeElement.focus();
  }

  protected onReset(event: PointerEvent): void {
    this.filter.set(null);
    this.input()!.nativeElement.focus();
    event.stopPropagation(); // prevent opening menu
  }

  private bindToModel(): void {
    const filterDebounced = debounced(computed(() => trim(this.filter())), async value => {
      // Debounce only if not empty.
      if (value !== null && typeof value !== 'boolean') {
        await firstValueFrom(timer(200));
      }
    });

    effect(() => {
      const filter = filterDebounced.value();
      const table = this._table();
      const column = this.column();

      untracked(() => {
        table.filter(filter, {columnName: column.name});
      });
    });
  }

  private toggleBooleanMenu(): void {
    // Close menu if already opened.
    if (this._menu) {
      this._menu.close();
      return;
    }

    const injector = createDestroyableInjector({parent: this._injector});
    runInInjectionContext(injector, () => {
      // Contribute menu items.
      contributeMenu('menu:column-filter', menu => menu
        .addMenuItem({label: '%scion.components.yes.value', attributes: {'data-option': 'true'}, onSelect: () => this.filter.set(true)})
        .addMenuItem({label: '%scion.components.no.value', attributes: {'data-option': 'false'}, onSelect: () => this.filter.set(false)}),
      );

      // Open menu.
      this._menu = this._menuService.open('menu:column-filter', {
        anchor: this._host,
        minWidth: `${this._host.offsetWidth}px`,
        offset: {y: -1},
      });

      // Close menu when start resizing a column. By default, closes the menu only on mouse up.
      toObservable(this._table().resizing)
        .pipe(skip(1))
        .subscribe(() => this._menu?.close());

      this._menu.onClose(() => {
        injector.destroy();
        // Restore focus manually as it is not restored automatically since opening the popover inside Shadow DOM.
        // TODO [menu] Consider restore focus manually in Menu API due to restriction in shadow DOM.
        this.input()!.nativeElement.focus();
        this._menu = undefined;
      });
    });
  }
}

function trim(value: string | number | boolean | null): string | number | boolean | null {
  return typeof value === 'string' ? value.trim() || null : value;
}
