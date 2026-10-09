/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TestBed} from '@angular/core/testing';
import {DestroyRef, effect, inject, Injector, runInInjectionContext, signal} from '@angular/core';
import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {createSciTableComponent} from './testing/testing.util';
import {table, table as sciTable} from './table.factory';
import {TablePO} from './table.po';
import {ɵillegaldatasource} from './table-datasource';
import {provideAsyncTableDatasource} from '@scion/components/table';

describe('Table Factory', () => {

  it('should create table by passing a column factory function', async () => {
    const data = signal([
      {col1: 'row1/col1', col2: 'row1/col2', col3: 'row1/col3'},
      {col1: 'row2/col1', col2: 'row2/col2', col3: 'row2/col3'},
      {col1: 'row3/col1', col2: 'row3/col2', col3: 'row3/col3'},
    ]);

    const {fixture} = runInInjectionContext(TestBed.inject(Injector), () => createSciTableComponent(sciTable(data, table => table
      .addStringColumn('Header', value => value.col1)
      .addStringColumn(value => value.col2)
      .addStringColumn({value: value => value.col3}),
    )));

    const table = new TablePO(fixture);
    await table.waitUntilStable();

    expect(table.rows[0]!.cells.map(cell => cell.value)).toEqual(['row1/col1', 'row1/col2', 'row1/col3']);
    expect(table.rows[1]!.cells.map(cell => cell.value)).toEqual(['row2/col1', 'row2/col2', 'row2/col3']);
    expect(table.rows[2]!.cells.map(cell => cell.value)).toEqual(['row3/col1', 'row3/col2', 'row3/col3']);
  });

  it('should create table by passing a descriptor (calling injection context)', async () => {
    const data = signal([
      {col1: 'row1/col1', col2: 'row1/col2', col3: 'row1/col3'},
      {col1: 'row2/col1', col2: 'row2/col2', col3: 'row2/col3'},
      {col1: 'row3/col1', col2: 'row3/col2', col3: 'row3/col3'},
    ]);

    const {fixture} = runInInjectionContext(TestBed.inject(Injector), () => createSciTableComponent(sciTable({
      datasource: data,
      columns: table => table
        .addStringColumn('Header', value => value.col1)
        .addStringColumn(value => value.col2)
        .addStringColumn({value: value => value.col3}),
    })));

    const table = new TablePO(fixture);
    await table.waitUntilStable();

    expect(table.rows[0]!.cells.map(cell => cell.value)).toEqual(['row1/col1', 'row1/col2', 'row1/col3']);
    expect(table.rows[1]!.cells.map(cell => cell.value)).toEqual(['row2/col1', 'row2/col2', 'row2/col3']);
    expect(table.rows[2]!.cells.map(cell => cell.value)).toEqual(['row3/col1', 'row3/col2', 'row3/col3']);
  });

  it('should create table by passing a descriptor (manual injector)', async () => {
    const data = signal([
      {col1: 'row1/col1', col2: 'row1/col2', col3: 'row1/col3'},
      {col1: 'row2/col1', col2: 'row2/col2', col3: 'row2/col3'},
      {col1: 'row3/col1', col2: 'row3/col2', col3: 'row3/col3'},
    ]);

    const {fixture} = createSciTableComponent(sciTable({
      datasource: data,
      columns: table => table
        .addStringColumn('Header', value => value.col1)
        .addStringColumn(value => value.col2)
        .addStringColumn({value: value => value.col3}),
      injector: TestBed.inject(Injector),
    }));

    const table = new TablePO(fixture);
    await table.waitUntilStable();

    expect(table.rows[0]!.cells.map(cell => cell.value)).toEqual(['row1/col1', 'row1/col2', 'row1/col3']);
    expect(table.rows[1]!.cells.map(cell => cell.value)).toEqual(['row2/col1', 'row2/col2', 'row2/col3']);
    expect(table.rows[2]!.cells.map(cell => cell.value)).toEqual(['row3/col1', 'row3/col2', 'row3/col3']);
  });

  it('should call column factory function in reactive context', async () => {
    const flag = signal(false);
    const {fixture, model} = createSciTableComponent(table({
      datasource: signal([]),
      columns: table => {
        if (flag()) {
          table.addStringColumn(() => 'test');
        }
        table.addStringColumn(() => 'test2');
      },
      injector: TestBed.inject(Injector),
    }));

    await fixture.whenStable();
    expect(model.columns()).toHaveSize(1);

    flag.set(true);
    await fixture.whenStable();
    expect(model.columns()).toHaveSize(2);
  });

  it('should call column factory function in injection context', async () => {
    let injector: Injector | undefined;

    const {fixture} = createSciTableComponent(table({
      datasource: signal([]),
      columns: () => {
        injector = inject(Injector);
      },
      injector: TestBed.inject(Injector),
    }));

    await fixture.whenStable();
    expect(injector).toBeDefined();
  });

  it('should destroy previous column factory function injection context', async () => {
    const destroyRefs = new Array<DestroyRef>();
    const flag = signal(false);

    const {fixture} = createSciTableComponent(table({
      datasource: signal([]),
      columns: () => {
        flag();
        destroyRefs.push(inject(DestroyRef));
      },
      injector: TestBed.inject(Injector),
    }));

    await fixture.whenStable();
    expect(destroyRefs).toHaveSize(1);
    expect(destroyRefs[0]!.destroyed).toBeFalse();

    // Invalidate reactive context.
    flag.set(true);
    await fixture.whenStable();
    expect(destroyRefs).toHaveSize(2);
    expect(destroyRefs[0]!.destroyed).toBeTrue();
    expect(destroyRefs[1]!.destroyed).toBeFalse();

    // Invalidate reactive context.
    flag.set(false);
    await fixture.whenStable();
    expect(destroyRefs).toHaveSize(3);
    expect(destroyRefs[0]!.destroyed).toBeTrue();
    expect(destroyRefs[1]!.destroyed).toBeTrue();
    expect(destroyRefs[2]!.destroyed).toBeFalse();
  });

  describe('Validation', () => {

    it('should throw error if not called in injection context', () => {
      expect(() => table(signal([]), table => table)).toThrowError(/NG0203:/i);
    });

    it('should error if called in reactive context', done => {
      effect(() => {
        expect(() => table({
          datasource: signal([]),
          columns: table => table,
          injector: TestBed.inject(Injector),
        })).toThrowError(/NG0602:/i);
        done();
      }, {injector: TestBed.inject(Injector)});
    });

    it('should disallow sort comparator if using custom datasource', done => {
      createSciTableComponent(table({
        ɵdatasource: provideAsyncTableDatasource(() => [], () => []),
        datasource: ɵillegaldatasource(),
        columns: table => {
          expect(() => table.addStringColumn({
            value: () => 'test',
            sortable: {comparator: () => 0},
          })).toThrowError('[ColumnDefinitionError] Configuring a sort comparator is not supported for tables using a datasource. Sorting must be done by the datasource.');
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });

    it('should disallow filter matcher if using custom datasource', done => {
      createSciTableComponent(table({
        ɵdatasource: provideAsyncTableDatasource(() => [], () => []),
        datasource: ɵillegaldatasource(),
        columns: table => {
          expect(() => table.addStringColumn({
            value: () => 'test',
            filterable: {matcher: () => true},
          })).toThrowError('[ColumnDefinitionError] Configuring a filter matcher is not supported for tables using a datasource. Filtering must be done by the datasource.');
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });

    it('should require filter matcher for component column', done => {
      createSciTableComponent(table({
        datasource: signal([]),
        columns: table => {
          expect(() => table.addComponentColumn({
            component: () => ({}) as SciComponentDescriptor,
            filterable: true,
          })).toThrowError('[ColumnDefinitionError] Component column requires a filter matcher in order to be filterable.');
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });

    it('should require sort comparator for component column', done => {
      createSciTableComponent(table({
        datasource: signal([]),
        columns: table => {
          expect(() => table.addComponentColumn({
            component: () => ({}) as SciComponentDescriptor,
            sortable: true,
          })).toThrowError('[ColumnDefinitionError] Component column requires a sort comparator in order to be sortable.');
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });

    it('should require filter matcher for template column', done => {
      createSciTableComponent(table({
        datasource: signal([]),
        columns: table => {
          expect(() => table.addTemplateColumn({
            template: () => ({}) as SciTemplateDescriptor,
            filterable: true,
          })).toThrowError('[ColumnDefinitionError] Template column requires a filter matcher in order to be filterable.');
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });

    it('should require sort comparator for template column', done => {
      createSciTableComponent(table({
        datasource: signal([]),
        columns: table => {
          expect(() => table.addTemplateColumn({
            template: () => ({}) as SciTemplateDescriptor,
            sortable: true,
          })).toThrowError('[ColumnDefinitionError] Template column requires a sort comparator in order to be sortable.');
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });

    it('should require unique column name', done => {
      createSciTableComponent(table({
        datasource: signal([]),
        columns: table => {
          expect(() => table
            .addStringColumn({name: 'column:test', value: () => ''})
            .addStringColumn({name: 'column:test', value: () => ''}),
          ).toThrowError('[ColumnDefinitionError] Column names must be unique. "column:test" is defined more than once.');
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });

    it('should require unique generated column name', done => {
      createSciTableComponent(table({
        datasource: signal([]),
        columns: table => {
          expect(() => table
            .addStringColumn('Test', () => '')
            .addStringColumn({name: 'column:0', value: () => ''}),
          ).toThrowError('[ColumnDefinitionError] Column names must be unique. "column:0" is defined more than once.');
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });

    it('should not require a column name', done => {
      createSciTableComponent(table({
        datasource: signal([]),
        columns: table => {
          expect(() => table
            .addStringColumn({value: () => ''})
            .addStringColumn('Test', () => ''),
          ).not.toThrow();
          done();
        },
        injector: TestBed.inject(Injector),
      }));
    });
  });
});
