/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, input, Signal, signal} from '@angular/core';
import {RowSelection, SciTableComponent, table} from '@scion/components/table';
import {Station, stations} from './sci-table-page.data';
import {httpResource} from '@angular/common/http';

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
      {{ res.sloid }}      
    }
  `,
})
class CustomCellComponent {
  public readonly station = input.required<Station>();
  public readonly sloid = httpResource<{sloid: string}>(() => `http://localhost:3000/api?placeRef=${this.station().sloid}`);
}

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  imports: [
    SciTableComponent,
  ],
})
export default class SciTablePageComponent {
  protected data = signal(stations);
  protected activeRow = signal<RowSelection<{sloid: string}> | undefined>(undefined);
  protected selectedRows = signal<string | undefined>(undefined);

  // TODO: Example language switch

  private _additionalData = signal(0);

  protected table = table(this.data, table => table
    .addStringColumn({
      label: station => computed(() => `${station.sloid} (${this._additionalData()})`),
      width: '150px',
      maxWidth: '200px',
      minWidth: '100px',
      header: 'Sloid',
    })
    .addColumn({
      width: '150px',
      header: 'Custom Component',
      label: station => ({
        component: CustomCellComponent, inputs: {station}}),
    })
    .addNumberColumn({
      label: station => this.getData(station),
      width: '150px',
      header: 'Sloid Nr.',
    })
    .addStringColumn({
      label: station => station.designationofficial,
      width: '150px',
      header: 'Name',
    })
    .addStringColumn({
      label: station => station.districtname,
      width: '1fr',
      header: 'District',
    }));

  private getData(station: Station): Signal<number> {
    const data = signal<number>(0);

    void fetch(`http://localhost:3000/api?placeRef=${station.sloid}`)
      .then(res => res.json())
      .then((res: {sloid: string}) => data.set(+res.sloid));

    return data;
    // return httpResource<{sloid: string}>(() => `http://localhost:3000/api?placeRef=${station.sloid}`).value;
  }

  protected onSelectRows(selection: RowSelection<any>[]): void {
    this.selectedRows.set(selection.length ? selection.map(s => s.index).join(', ') : undefined);
  }

  protected onUpdateSignal(): void {
    this._additionalData.update(d => d + 1);
  }
}
