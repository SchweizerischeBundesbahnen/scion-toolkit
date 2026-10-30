/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, debounced, effect, ElementRef, inject, Injector, input, Provider, runInInjectionContext, signal, untracked, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SciEnumColumn, SciEnumValueLike, SciTableColumnLike} from '../table.model';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '@scion/components/icon';
import {firstValueFrom, skip, timer} from 'rxjs';
import {contributeMenu, SciMenuRef, ɵSciMenuService} from '@scion/components/menu';
import {toObservable} from '@angular/core/rxjs-interop';
import {SciTooltipOnOverflowDirective, TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT, ɵcreateDestroyableInjector} from '@scion/components/common';
import {SciEnumLabelPipe} from './enum-label.pipe';
import {UUID} from '@scion/toolkit/uuid';
import {SciTextPipe} from '@scion/components/text';
import {dimension} from '@scion/components/dimension';

@Component({
  selector: 'sci-column-filter',
  templateUrl: './column-filter.component.html',
  styleUrl: './column-filter.component.scss',
  imports: [
    FormsModule,
    SciIconComponent,
    SciEnumLabelPipe,
    SciTextPipe,
  ],
  hostDirectives: [
    SciTooltipOnOverflowDirective,
  ],
  host: {
    '[attr.data-column]': 'column().name',
    '[attr.data-disabled]': `!column().filterable() ? '' : null`,
    '(click)': 'column().filterable() && onFilterClick()',
  },
  providers: [
    configureTooltip(),
  ],
})
export class SciColumnFilterComponent<T> {

  public readonly column = input.required<SciTableColumnLike<T>>();
  public readonly inputElement = viewChild<ElementRef<HTMLElement>>('input'); // public visibility required to be accessible in `configureTooltip` function

  protected readonly filter = signal<string | number | boolean | SciEnumValueLike | SciEnumValueLike[] | null>(null);
  protected readonly dimension = dimension(inject(ElementRef));

  private readonly _table = inject(ɵSCI_TABLE);
  private readonly _menuService = inject(ɵSciMenuService);
  private readonly _injector = inject(Injector);
  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;

  protected menu: SciMenuRef | undefined;

  constructor() {
    this.bindToModel();
  }

  protected onFilterClick(): void {
    if (this.column().type === 'enum') {
      this.toggleEnumChooser();
    }
    else {
      this.inputElement()!.nativeElement.focus();
    }
  }

  protected onReset(event: PointerEvent): void {
    this.filter.set(null);
    this.inputElement()!.nativeElement.focus();
    event.stopPropagation(); // prevent opening menu
  }

  private bindToModel(): void {
    const filterDebounced = debounced(computed(() => trim(this.filter())), async value => {
      // Debounce only if not empty and not an enum.
      if (value !== null && this.column().type !== 'enum') {
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

  private toggleEnumChooser(): void {
    // Close menu if already opened.
    if (this.menu) {
      this.menu.close();
      return;
    }

    const column = this.column() as SciEnumColumn;
    const injector = ɵcreateDestroyableInjector({parent: this._injector});

    runInInjectionContext(injector, () => {
      const menuId = `menu:column-filter-${UUID.randomUUID()}` as const;

      // Contribute menu items.
      contributeMenu(menuId, menu => {
        const multi = column.filterable() === 'multi';

        column.enumeration().forEach(entry => menu.addMenuItem({
          label: entry.label,
          checked: multi ? computed(() => (this.filter() as SciEnumValueLike[] | null)?.includes(entry.value) ?? false) : undefined,
          icon: column.format.filter.icon ? entry.icon : undefined,
          attributes: {'data-option': `${entry.value}`},
          onSelect: () => this.filter.update(filter => {
            if (multi) {
              const values = new Set<SciEnumValueLike>(filter as SciEnumValueLike[] | null ?? []);
              values.has(entry.value) ? values.delete(entry.value) : values.add(entry.value);
              return values.size ? Array.from(values) : null;
            }
            else {
              return entry.value;
            }
          }),
        }));
      });

      // Open menu.
      this.menu = this._menuService.open(menuId, {
        anchor: this._host,
        minWidth: `${this._host.offsetWidth}px`,
        maxHeight: '300px',
        cssClass: 'e2e-filter',
        filter: column.enumeration().length >= 8 ? {focus: true} : false,
        maxWidth: `max(300px, ${this._host.offsetWidth}px)`, // overflow long enumeration labels
        offset: {y: -1},
      });

      // Close menu when start resizing a column. By default, closes the menu only on mouse up.
      toObservable(this._table().resizing)
        .pipe(skip(1))
        .subscribe(() => this.menu?.close());

      this.menu.onClose(() => {
        injector.destroy();
        // Restore focus manually as it is not restored automatically since opening the popover inside Shadow DOM.
        // TODO [menu] Consider restore focus manually in Menu API due to restriction in shadow DOM.
        this.inputElement()!.nativeElement.focus();
        this.menu = undefined;
      });
    });
  }
}

function trim(value: string | number | boolean | SciEnumValueLike | SciEnumValueLike[] | null): string | number | boolean | SciEnumValueLike | SciEnumValueLike[] | null {
  return typeof value === 'string' ? value.trim() || null : value;
}

function configureTooltip(): Provider[] {
  return [
    {
      provide: TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT,
      useFactory: () => inject(SciColumnFilterComponent).inputElement,
    },
  ];
}
