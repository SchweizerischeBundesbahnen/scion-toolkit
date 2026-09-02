/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, inject, Injector, signal} from '@angular/core';
import {SciTableComponent, SciTableDescriptor, table} from '@scion/components/table';
import {companies, Company} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {form, FormField} from '@angular/forms/signals';
import {UUID} from '@scion/toolkit/uuid';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';

const data = signal(new Array(100_000).fill(0).map((_, i) => ({
  ...companies[i % companies.length]!,
  dataId: UUID.randomUUID(),
})));

@Component({
  selector: 'app-table-page-alt',
  templateUrl: './sci-table-page-alt.component.html',
  styleUrls: ['./sci-table-page-alt.component.scss'],
  imports: [
    SciTableComponent,
    FormsModule,
    FormField,
    SciFilterFieldComponent,
  ],
})
export default class SciTablePageComponent {
  protected injector = inject(Injector);

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    showHeader: true,
    selectable: 'multi',
  });
  protected form = form(this.settings);

  protected filter = signal<string | undefined>(undefined);

  protected tableConfig: Omit<SciTableDescriptor<Company>, 'data'> = {
    headerVisible: computed(() => this.settings().showHeader),
    sortable: computed(() => this.settings().sortable),
    filterable: computed(() => this.settings().filterable),
    resizable: computed(() => this.settings().resizable),
    selectable: computed(() => this.settings().selectable === 'disabled' ? false : this.settings().selectable as 'single' | 'multi'),
    trackBy: company => company.dataId,
    rowActions: (company, toolbar) => {
      toolbar.addToolbarButton({
        icon: 'scion.delete',
        onSelect: () => {
          data.update(companies => companies.filter(c => c.dataId !== company.dataId));
        },
      });
      toolbar.addToolbarMenu({
        icon: 'scion.more_vertical',
        visualMenuIndicator: false,
      }, menu => {
        menu.addGroup(group => group.addMenuItem({
          label: 'Edit',
          onSelect: () => {
            console.log('edit', company);
          },
        }).addMenuItem({
          label: 'Duplicate',
          onSelect: () => {
            console.log('duplicate', company);
          },
        }).addMenuItem({
          label: 'Delete',
          onSelect: () => {
            console.log('delete', company);
          },
        })).addGroup(group => {
          group.addMenuItem({
            label: 'Copy to...',
            onSelect: () => {
              console.log('copy', company);
            },
          }).addMenuItem({
            label: 'Move to...',
            onSelect: () => {
              console.log('move', company);
            },
          });
        }).addMenuItem({
          label: 'Info...',
          onSelect: () => {
            console.log('info', company);
          },
        });
      });
    },
  };

  protected table = table({
    data,
    ...this.tableConfig,
  }, table => {
    table
      .addStringColumn(company => company.dataId)
      .addStringColumn({
        value: company => company.name,
      });
  });
}
