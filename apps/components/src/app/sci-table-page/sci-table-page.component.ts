/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, input, inputBinding, resource, Signal, signal, TemplateRef, viewChild} from '@angular/core';
import {SciDataSource, SciTableComponent, SciTableRequest, SciTableResponse, SciTableFactory, table} from '@scion/components/table';
import {Station, stations} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {Field, form} from '@angular/forms/signals';
import {Observable, timer, map} from 'rxjs';
import {SciTable} from '../../../../../projects/scion/components/table/src/table.model';

class SlowDataSource implements SciDataSource<Station, string> {
  public pageSize = 50;

  public getItems(request: SciTableRequest): Observable<SciTableResponse<Station>> {
    return timer(1000).pipe(
      map(() => ({
        items: stations.slice(request.start, request.end),
        totalCount: stations.length,
      })),
    );
  }

  public identity(item: Station): string {
    return item.sloid;
  }
}

@Component({
  selector: 'app-custom-cell',
  styles: `
    div.skeleton {
      background-color: var(--sci-color-skeleton);
      border-radius: var(--sci-corner-small);
      height: 1em;
      max-width: 100px;
    }
  `,
  template: `
    @if (sloid.isLoading()) {
      <div class="skeleton">
        
      </div>
    } @else if (sloid.value(); as res) {
      {{ res }}      
    }
  `,
})
class CustomCellComponent {
  public readonly station = input.required<Station>();
  public readonly sloid = resource({
    params: () => ({sloid: this.station().sloid}),
    loader: ({params}) => new Promise(resolve => setTimeout(() => resolve(params.sloid.split(':').at(-1)), Math.floor(Math.random() * 1500) + 500)),
  });
}

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  imports: [
    SciTableComponent,
    FormsModule,
    Field,
  ],
})
export default class SciTablePageComponent {
  protected data = signal(stations);
  protected activeItem = signal<string | undefined>(undefined);
  protected selectedItems = signal<string | undefined>(undefined);
  protected additionalData = signal(0);

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    showHeader: true,
    language: 'de',
    slowDataSource: true,
  });
  protected form = form(this.settings);

  private cellTemplate = viewChild.required<TemplateRef<unknown>>('cell');

  protected table: Signal<SciTable<Station, unknown>> = table(this.data, table => this.createTable(table));
  protected slowTable: Signal<SciTable<Station, unknown>> = table(new SlowDataSource(), table => this.createTable(table));

  protected createTable(table: SciTableFactory<Station>): SciTableFactory<Station> {
    const settings = this.settings();

    if (!settings.showHeader) {
      table.hideHeader();
    }

    if (!settings.filterable) {
      table.disableFilter();
    }

    if (!settings.sortable) {
      table.disableSort();
    }

    if (!settings.resizable) {
      table.disableResize();
    }

    // if (this.additionalData() > 2) {
    //   table.addStringColumn({
    //     value: station => computed(() => `${station.sloid} (${this.additionalData()})`),
    //     width: '150px',
    //     maxWidth: '200px',
    //     minWidth: '100px',
    //     header: 'Sloid',
    //     resizable: false,
    //   });
    // }

    return table
      .addComponentColumn({
        header: 'Custom Component',
        filter: (text, cell) => cell.item.sloid.includes(text),
        sort: (a, b) => a.item.sloid.localeCompare(b.item.sloid),
        component: station => ({
          component: CustomCellComponent, bindings: [inputBinding('station', signal(station))],
        }),
      })
      .addTemplateColumn({
        header: 'Template',
        part: station => station.designationofficial.length < 15 ? 'green-cell' : '',
        template: () => computed(() => ({template: this.cellTemplate(), context: {custom: this.additionalData()}})),
      })
      .addNumberColumn({
        header: 'Number',
        value: station => station.designationofficial.length,
      })
      .addBooleanColumn('Boolean', station => station.designationofficial.length > 15)
      .addStringColumn({
        value: station => station.designationofficial,
        header: 'Name',
        name: 'name',
      })
      .addStringColumn({
        value: station => computed(() => settings.language === 'fr' ? station.districtnameFr : station.districtname),
        width: '1fr',
        header: 'District',
      })
      .name('stations')
      .rowPart(item => item.designationofficial.length > 15 ? 'red-row' : '');
  }

  protected onActivateRow(row: unknown): void {
    this.activeItem.set(typeof row === 'string' ? row : (row as Station | undefined)?.sloid);
  }

  protected onSelectRows(selection: Set<unknown>): void {
    const selectionValues = [...selection.values()];
    this.selectedItems.set(selectionValues.length ? selectionValues.map(s => typeof s === 'string' ? s : (s as Station).sloid).join(', ') : undefined);
  }

  protected onUpdateSignal(): void {
    this.additionalData.update(d => d + 1);
  }
}
