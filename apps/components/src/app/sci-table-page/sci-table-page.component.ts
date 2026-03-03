/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, signal} from '@angular/core';
import {RowSelection, SciTableComponent, table} from '@scion/components/table';
import {stations} from './sci-table-page.data';

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

  protected table = table(this.data, table => table
    .addStringColumn({
      label: station => station.sloid,
      width: '150px',
      maxWidth: '200px',
      minWidth: '100px',
      header: 'Sloid',
    })
    .addNumberColumn({
      label: station => +station.sloid.split(':').at(-1)!,
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

  protected onSelectRows(selection: RowSelection<any>[]): void {
    this.selectedRows.set(selection.length ? selection.map(s => s.index).join(', ') : undefined);
  }
}