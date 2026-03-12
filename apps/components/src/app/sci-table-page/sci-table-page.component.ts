/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, input, resource, signal, TemplateRef, viewChild} from '@angular/core';
import {SciTableComponent, table} from '@scion/components/table';
import {Station, stations} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';

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
  ],
})
export default class SciTablePageComponent {
  protected data = signal(stations);
  protected activeItem = signal<Station | undefined>(undefined);
  protected selectedRows = signal<string | undefined>(undefined);
  protected language = signal('de');
  protected additionalData = signal(0);

  private cellTemplate = viewChild.required<TemplateRef<unknown>>('cell');

  protected table = table(this.data, table => {
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
      // .addStringColumn({
      //   value: station => computed(() => `${station.sloid} (${this._additionalData()})`),
      //   width: '150px',
      //   maxWidth: '200px',
      //   minWidth: '100px',
      //   header: 'Sloid',
      //   resizable: false,
      // })
      .addComponentColumn({
        header: 'Custom Component',
        filter: (text, cell) => cell.item.sloid.includes(text),
        sort: (a, b) => a.item.sloid.localeCompare(b.item.sloid),
        component: station => ({
          component: CustomCellComponent, inputs: {station},
        }),
      })
      .addTemplateColumn({
        header: 'Template',
        template: () => computed(() => ({template: this.cellTemplate(), context: {custom: this.additionalData()}})),
      })
      .addNumberColumn('Number', station => station.designationofficial.length)
      .addBooleanColumn('Boolean', station => station.designationofficial.length > 15)
      // .addNumberColumn({
      //   label: station => this.getData(station),
      //   width: '150px',
      //   header: 'Sloid Nr.',
      // })
      .addStringColumn({
        value: station => station.designationofficial,
        header: 'Name',
        name: 'name',
      })
      .addStringColumn({
        value: station => computed(() => this.language() === 'fr' ? station.districtnameFr : station.districtname),
        width: '1fr',
        header: 'District',
      })
      .rowPart(item => item.designationofficial.length > 15 ? 'red-row' : '');
  });

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
