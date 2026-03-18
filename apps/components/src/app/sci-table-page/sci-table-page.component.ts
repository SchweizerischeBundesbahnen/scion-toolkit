/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, input, inputBinding, resource, signal, TemplateRef, viewChild} from '@angular/core';
import {SciDataSource, SciTableComponent, SciTableRequest, SciTableResponse, SciTableFactory, table} from '@scion/components/table';
import {Station, stations} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {Field, form} from '@angular/forms/signals';
import {Observable, timer, map} from 'rxjs';

class SlowDataSource implements SciDataSource<Station> {
  public getItems(request: SciTableRequest): Observable<SciTableResponse<Station>> {
    return timer(1000).pipe(
      map(() => ({
        items: stations.slice(request.start, request.end),
        totalCount: stations.length,
      })),
    );
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
  protected activeItem = signal<Station | undefined>(undefined);
  protected selectedRows = signal<string | undefined>(undefined);
  protected additionalData = signal(0);

  protected settings = signal({
    filterable: true,
    sortable: true,
    resizable: true,
    language: 'de',
    slowDataSource: false,
  });
  protected form = form(this.settings);

  private cellTemplate = viewChild.required<TemplateRef<unknown>>('cell');

  protected table = table(this.data, table => this.createTable(table));
  protected slowTable = table(new SlowDataSource(), table => this.createTable(table));

  protected createTable(table: SciTableFactory<Station>): SciTableFactory<Station> {
    const settings = this.settings();

    if (!settings.filterable) {
      table.disableFilter();
    }

    if (!settings.sortable) {
      table.disableSort();
    }

    if (!settings.resizable) {
      table.disableResize();
    }

    if (this.additionalData() > 2) {
      table.addStringColumn({
        value: station => computed(() => `${station.sloid} (${this.additionalData()})`),
        width: '150px',
        maxWidth: '200px',
        minWidth: '100px',
        header: 'Sloid',
        resizable: false,
      });
    }

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

  // private getData(station: Station): Signal<number> {
  //   const data = signal<number>(0);
  //
  //   void fetch(`http://localhost:3000/api?placeRef=${station.sloid}`)
  //     .then(res => res.json())
  //     .then((res: {sloid: string}) => data.set(+res.sloid));
  //
  //   return data;
  //   // return httpResource<{sloid: string}>(() => `http://localhost:3000/api?placeRef=${station.sloid}`).value;
  // }

  protected onSelectRows(selection: Station[]): void {
    this.selectedRows.set(selection.length ? selection.map(s => s.sloid).join(', ') : undefined);
  }

  protected onUpdateSignal(): void {
    this.additionalData.update(d => d + 1);
  }
}
