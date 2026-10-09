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
import {table, table as sciTable} from './table.factory';
import {assertNotInReactiveContext, Component, computed, DestroyRef, EnvironmentProviders, inject, Injector, input, inputBinding, signal, TemplateRef, viewChild, WritableSignal} from '@angular/core';
import {TablePO} from './table.po';
import {BehaviorSubject, map, NEVER, noop, of, Subject, take, tap, throwError} from 'rxjs';
import {provideTableStorage} from './table-storage';
import {provideTableRowBinding} from './table-row-binding';
import {provideAsyncTableDatasource, provideAsyncTableTreeDatasource, provideTableTreeDatasource, SciTableDataProvider, SciTableIdsRequest, ɵillegaldatasource} from './table-datasource';
import {createSciTableComponent, waitUntilStable} from './testing/testing.util';

describe('Table', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNullTableStorage(),
        provideTableRowBinding((bindings, _item, index) => {
          // Add row index attribute to locate rows by dataset index.
          bindings.addAttributeBinding('data-row-index', index);
        }),
      ],
    });
  });

  describe('Columns', () => {

    describe('Component Column', () => {

      it('should render custom component column', async () => {
        const data = signal(['1', '2', '3']);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addComponentColumn({
            name: 'column:component',
            component: item => ({
              component: CustomColumnComponent,
              bindings: [inputBinding('value', () => item)],
            }),
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:component'})!.values()).toEqual(['1', '2', '3']);
      });
    });

    describe('Template Column', () => {

      it('should render custom template column', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

        const data = signal([1, 2, 3]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addTemplateColumn({
            name: 'column:template',
            template: () => ({template}),
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:template'})?.values()).toEqual(['1', '2', '3']);
      });

      it('should pass context to template', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

        const data = signal([1, 2, 3]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addTemplateColumn({
            name: 'column:template',
            template: item => ({
              template: template,
              context: {context: `[context="${item}"]`},
            }),
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:template'})!.values()).toEqual([
          '1 [context="1"]',
          '2 [context="2"]',
          '3 [context="3"]',
        ]);
      });

      it('should pass context to template as signal', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();
        const context = signal('a');

        const data = signal([1, 2, 3]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addTemplateColumn({
            name: 'column:template',
            template: item => ({
              template: template,
              context: {context: computed(() => `[context="${context()}", item="${item}"]`)},
            }),
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:template'})!.values()).toEqual([
          '1 [context="a", item="1"]',
          '2 [context="a", item="2"]',
          '3 [context="a", item="3"]',
        ]);

        // Change context signal.
        context.set('b');
        await table.waitUntilStable();
        expect(await table.column({name: 'column:template'})!.values()).toEqual([
          '1 [context="b", item="1"]',
          '2 [context="b", item="2"]',
          '3 [context="b", item="3"]',
        ]);
      });

      it('should not fail if context value is undefined', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

        const data = signal([1, 2, 3]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addTemplateColumn({
            name: 'column:template',
            template: () => ({
              template: template,
              context: {context: undefined},
            }),
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:template'})!.values()).toEqual(['1', '2', '3']);
      });
    });
  });

  describe('Column Resize', () => {

    it('should pack column', async () => {
      const data = signal([{id: 1, name: 'test-1'}, {id: 2, name: 'test-2'}, {id: 3, name: 'test-2'}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table
          .addNumberColumn(item => item.id)
          .addStringColumn(item => item.name),
        injector: TestBed.inject(Injector),
      }), {width: '400px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.columns[0]!.width).toBe(200);
      expect(table.columns[1]!.width).toBe(200);

      await table.column({index: 1})!.pack();
      expect(table.columns[0]!.width).toBe(200);
      expect(table.columns[1]!.width).toBe(100);

      await table.column({index: 0})!.pack();
      expect(table.columns[0]!.width).toBe(100);
      expect(table.columns[1]!.width).toBe(100);
    });

    it('should store column widths to storage', async () => {
      const storeFn = jasmine.createSpy();

      TestBed.configureTestingModule({
        providers: [
          provideTableStorage(class {
            public load(): null {
              return null;
            }

            public store(key: string, value: string): void {
              storeFn(key, value);
            }
          }),
        ],
      });

      const data = signal([{id: 1, name: 'test-1'}, {id: 2, name: 'test-2'}, {id: 3, name: 'test-2'}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table
          .addNumberColumn(item => item.id)
          .addStringColumn(item => item.name),
        injector: TestBed.inject(Injector),
      }), {name: 'table:testee', width: '400px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      await table.column({index: 0})!.pack();

      expect(storeFn).toHaveBeenCalledWith('scion.components.table:testee', '{"columns":[{"name":"column:0","width":100}]}');
    });

    it('should load column widths from storage', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideTableStorage(class {
            public load(key: string): string {
              return key === 'scion.components.table:testee' ? JSON.stringify({columns: [{name: 'column:0', width: 100}, {name: 'column:1'}]}) : '';
            }

            public store(): void {
              // NOOP
            }
          }),
        ],
      });

      const data = signal([{id: 1, name: 'test-1'}, {id: 2, name: 'test-2'}, {id: 3, name: 'test-2'}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table
          .addNumberColumn(item => item.id)
          .addStringColumn(item => item.name),
        injector: TestBed.inject(Injector),
      }), {name: 'table:testee', width: '400px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.columns[0]!.width).toBe(100);
      expect(table.columns[1]!.width).toBe(300);
    });
  });

  describe('Array Data Source', () => {

    it('should update table on data change', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));
      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(table.rows.length).toEqual(3);

      data.update(d => d.concat({id: 4}));
      await table.waitUntilStable();
      expect(table.rows.length).toEqual(4);
    });

    it('should update table on columns change', async () => {
      const data = signal([{id: 1, name: 'a'}, {id: 2, name: 'b'}, {id: 3, name: 'c'}]);
      const columns = signal(['id']);

      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => {
          for (const column of columns()) {
            table.addStringColumn(column, item => item[column as 'id' | 'name'].toString());
          }
        },
        injector: TestBed.inject(Injector),
      }));
      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(table.columns).toHaveSize(1);

      columns.update(c => c.concat(['name']));
      await table.waitUntilStable();
      expect(table.columns).toHaveSize(2);
    });

    describe('Sorting', () => {

      it('should be sortable (defaults)', async () => {
        const data = signal(new Array<{string: string; number: number; boolean: boolean}>());
        const templateFixture = TestBed.createComponent(CustomColumnTemplateProviderComponent);

        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:string',
              value: item => item.string,
            })
            .addNumberColumn({
              name: 'column:number',
              value: item => item.number,
            })
            .addBooleanColumn({
              name: 'column:boolean',
              value: item => item.boolean,
            })
            .addComponentColumn({
              name: 'column:component',
              component: item => ({
                component: CustomColumnComponent,
                bindings: [inputBinding('value', () => item)],
              }),
            })
            .addTemplateColumn({
              name: 'column:template',
              template: () => ({
                template: templateFixture.componentInstance.template(),
              }),
            })
            .addComponentColumn({
              name: 'column:component-sortable',
              component: item => ({
                component: CustomColumnComponent,
                bindings: [inputBinding('value', () => item)],
              }),
              sortable: {comparator: () => 0},
            })
            .addTemplateColumn({
              name: 'column:template-sortable',
              template: () => ({
                template: templateFixture.componentInstance.template(),
              }),
              sortable: {comparator: () => 0},
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.column({name: 'column:string'})!.sortable).toBeTrue();
        expect(table.column({name: 'column:number'})!.sortable).toBeTrue();
        expect(table.column({name: 'column:boolean'})!.sortable).toBeTrue();
        expect(table.column({name: 'column:component'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:template'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:component-sortable'})!.sortable).toBeTrue();
        expect(table.column({name: 'column:template-sortable'})!.sortable).toBeTrue();

        // Disable 'sortable' at table-level.
        model.sortable.set(false);
        await table.waitUntilStable();

        expect(table.column({name: 'column:string'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:number'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:boolean'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:component'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:template'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:component-sortable'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:template-sortable'})!.sortable).toBeFalse();
      });

      it('should sort string column', async () => {
        const data = signal([{string: 'b'}, {string: 'c'}, {string: 'a'}]);

        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addStringColumn({
            name: 'column:string',
            value: item => item.string,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:string'})!;

        await column.toggleSort();
        expect(await column.values()).toEqual(['a', 'b', 'c']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['c', 'b', 'a']);
      });

      it('should sort number column', async () => {
        const data = signal([{number: 1}, {number: 3}, {number: 2}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addNumberColumn({
            name: 'column:number',
            value: item => item.number,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:number'})!;

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['3', '2', '1']);
      });

      it('should sort boolean column', async () => {
        const data = signal([{boolean: true}, {boolean: false}, {boolean: true}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addBooleanColumn({
            name: 'column:boolean',
            value: item => item.boolean,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:boolean'})!;

        await column.toggleSort();
        expect(await column.values()).toEqual(['clear', 'checkmark', 'checkmark']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['checkmark', 'checkmark', 'clear']);
      });

      it('should sort string column with custom sort comparator', async () => {
        const data = signal(['1', '2', '3']);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addStringColumn({
            name: 'column:string',
            value: item => item,
            sortable: {comparator: (a, b) => Number(b.item) - Number(a.item)},
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:string'})!;

        expect(await column.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['3', '2', '1']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '2', '3']);
      });

      it('should sort component column with custom sort comparator', async () => {
        const data = signal([1, 2, 3]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addComponentColumn({
            name: 'column:component',
            component: item => ({
              component: CustomColumnComponent,
              bindings: [inputBinding('value', () => item)],
            }),
            sortable: {comparator: (a, b) => a.item - b.item},
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:component'})!;

        expect(await column.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['3', '2', '1']);
      });

      it('should sort template column with custom sort comparator', async () => {
        const templateFixture = TestBed.createComponent(CustomColumnTemplateProviderComponent);

        const data = signal([1, 2, 3]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addTemplateColumn({
            name: 'column:template',
            template: () => ({
              template: templateFixture.componentInstance.template(),
            }),
            sortable: {comparator: (a, b) => a.item - b.item},
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:template'})!;

        expect(await column.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['3', '2', '1']);
      });
    });

    describe('Filtering (per Column)', () => {

      it('should be filterable (defaults)', async () => {
        const data = signal(new Array<{string: string; number: number; boolean: boolean}>());
        const templateFixture = TestBed.createComponent(CustomColumnTemplateProviderComponent);

        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:string',
              value: item => item.string,
            })
            .addNumberColumn({
              name: 'column:number',
              value: item => item.number,
            })
            .addBooleanColumn({
              name: 'column:boolean',
              value: item => item.boolean,
            })
            .addComponentColumn({
              name: 'column:component',
              component: item => ({
                component: CustomColumnComponent,
                bindings: [inputBinding('value', () => item)],
              }),
            })
            .addTemplateColumn({
              name: 'column:template',
              template: () => ({
                template: templateFixture.componentInstance.template(),
              }),
            })
            .addComponentColumn({
              name: 'column:component-filterable',
              component: item => ({
                component: CustomColumnComponent,
                bindings: [inputBinding('value', () => item)],
              }),
              filterable: {matcher: () => false},
            })
            .addTemplateColumn({
              name: 'column:template-filterable',
              template: () => ({
                template: templateFixture.componentInstance.template(),
              }),
              filterable: {matcher: () => false},
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.column({name: 'column:string'})!.filterable).toBeFalse();
        expect(table.column({name: 'column:number'})!.filterable).toBeFalse();
        expect(table.column({name: 'column:boolean'})!.filterable).toBeFalse();
        expect(table.column({name: 'column:component'})!.filterable).toBeFalse();
        expect(table.column({name: 'column:template'})!.filterable).toBeFalse();
        expect(table.column({name: 'column:component-filterable'})!.filterable).toBeFalse();
        expect(table.column({name: 'column:template-filterable'})!.filterable).toBeFalse();

        // Enable 'filterable' at table-level.
        model.filterable.set(true);
        await table.waitUntilStable();

        expect(table.column({name: 'column:string'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:number'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:boolean'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:component'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:template'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:component-filterable'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:template-filterable'})!.filterable).toBeTrue();
      });

      it('should filter string column', async () => {
        const data = signal([{string: 'a'}, {string: 'c'}, {string: 'b'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addStringColumn({
            name: 'column:string',
            value: item => item.string,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:string'})!;

        await column.filter('c');
        expect(await column.values()).toEqual(['c']);

        await column.filter('');
        expect(await column.values()).toEqual(['a', 'c', 'b']);
      });

      it('should filter number column', async () => {
        const data = signal([{number: 1}, {number: 3}, {number: 2}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addNumberColumn({
            name: 'column:number',
            value: item => item.number,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:number'})!;

        await column.filter('3');
        expect(await column.values()).toEqual(['3']);

        await column.filter('');
        expect(await column.values()).toEqual(['1', '3', '2']);
      });

      it('should filter boolean column', async () => {
        const data = signal([{boolean: true}, {boolean: false}, {boolean: true}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addBooleanColumn({
            name: 'column:boolean',
            value: item => item.boolean,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:boolean'})!;

        await column.filter(true);
        expect(await column.values()).toEqual(['checkmark', 'checkmark']);

        await column.filter(null);
        expect(await column.values()).toEqual(['checkmark', 'clear', 'checkmark']);
      });

      it('should filter string column with custom filter matcher', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addStringColumn({
            name: 'column:string',
            value: item => item.name,
            filterable: {matcher: (text, context) => context.value.length === text.length},
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:string'})!;

        await column.filter('abcd');
        expect(await column.values()).toEqual(['beta']);

        await column.filter('');
        expect(await column.values()).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should filter component column with custom filter matcher', async () => {
        const data = signal(['alpha', 'beta', 'gamma']);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addComponentColumn({
            name: 'column:component',
            component: item => ({
              component: CustomColumnComponent,
              bindings: [inputBinding('value', () => item)],
            }),
            filterable: {matcher: (text, context) => context.item.length === text.length},
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:component'})!;

        await column.filter('abcd');
        expect(await column.values()).toEqual(['beta']);

        await column.filter('');
        expect(await column.values()).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should filter template column with custom filter matcher', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

        const data = signal(['alpha', 'beta', 'gamma']);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addTemplateColumn({
            name: 'column:template',
            template: () => ({template: template}),
            filterable: {matcher: (text, context) => context.item.length === text.length},
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:template'})!;

        await column.filter('abcd');
        expect(await column.values()).toEqual(['beta']);

        await column.filter('');
        expect(await column.values()).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should ignore invalid number input', async () => {
        const data = signal([{number: 1}, {number: 3}, {number: 2}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addNumberColumn({
            name: 'column:number',
            value: item => item.number,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:number'})!;

        await column.filter('invalid');
        expect(await column.values()).toEqual(['1', '3', '2']);
      });

      it('should trim string filter input', async () => {
        const data = signal([{string: 'alpha'}, {string: 'beta'}, {string: 'gamma'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addStringColumn({
            name: 'column:string',
            value: item => item.string,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:string'})!;

        await column.filter(' beta ');
        expect(await column.values()).toEqual(['beta']);
      });

      it('should filter string column case-insensitively', async () => {
        const data = signal([{string: 'Alpha'}, {string: 'beta'}, {string: 'gamma'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addStringColumn({
            name: 'column:string',
            value: item => item.string,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:string'})!;

        await column.filter('ALPHA');
        expect(await column.values()).toEqual(['Alpha']);
      });
    });

    describe('Filtering (per Table)', () => {

      it('should filter string column when using a global filter', async () => {
        const data = signal([{row: '1', string: 'alpha'}, {row: '2', string: 'beta'}, {row: '3', string: 'gamma'}]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addStringColumn({
              name: 'column:string',
              value: item => item.string,
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('alpha');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha'],
        ]);

        model.filter('a');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha'],
          ['2', 'beta'],
          ['3', 'gamma'],
        ]);

        model.filter('m');
        await table.waitUntilStable();
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['3', 'gamma'],
        ]);

        model.filter(null);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha'],
          ['2', 'beta'],
          ['3', 'gamma'],
        ]);
      });

      it('should filter number column when using a global filter', async () => {
        const data = signal([{row: '1', number: 0}, {row: '2', number: 1}, {row: '3', number: 10}, {row: '4', number: 11}]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addNumberColumn({
              name: 'column:number',
              value: item => item.number,
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('0');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', '0'],
        ]);

        model.filter('1');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', '1'],
        ]);

        model.filter('2');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([]);

        model.filter('10');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['3', '10'],
        ]);

        model.filter('11');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['4', '11'],
        ]);

        model.filter('12');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([]);
      });

      it('should filter boolean column when using a global filter', async () => {
        const data = signal([{row: '1', boolean: true}, {row: '2', boolean: false}, {row: '3', boolean: true}, {row: '4', boolean: false}]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addBooleanColumn({
              name: 'column:boolean',
              value: item => item.boolean,
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('true');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'checkmark'],
          ['3', 'checkmark'],
        ]);

        model.filter('false');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'clear'],
          ['4', 'clear'],
        ]);

        model.filter('0');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'clear'],
          ['4', 'clear'],
        ]);

        model.filter('1');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'checkmark'],
          ['3', 'checkmark'],
        ]);

        model.filter('2');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([]);
      });

      it('should filter component column when using a global filter (without comparator)', async () => {
        const data = signal([{row: '1', string: 'alpha'}, {row: '2', string: 'beta'}, {row: '3', string: 'gamma'}]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addComponentColumn({
              name: 'column:component',
              component: item => ({
                component: CustomColumnComponent,
                bindings: [inputBinding('value', () => item.string)],
              }),
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('beta');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha'],
          ['2', 'beta'],
          ['3', 'gamma'],
        ]);
      });

      it('should filter component column when using a global filter (with comparator)', async () => {
        const data = signal([{row: '1', string: 'alpha'}, {row: '2', string: 'beta'}, {row: '3', string: 'gamma'}]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addComponentColumn({
              name: 'column:component',
              component: item => ({
                component: CustomColumnComponent,
                bindings: [inputBinding('value', () => item.string)],
              }),
              filterable: {matcher: (text, context) => context.item.string === text},
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('beta');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'beta'],
        ]);
      });

      it('should filter template column when using a global filter (without comparator)', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

        const data = signal([{row: '1', string: 'alpha'}, {row: '2', string: 'beta'}, {row: '3', string: 'gamma'}]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addTemplateColumn({
              name: 'column:template',
              template: item => ({template: template, context: {$implicit: item.string}}),
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('beta');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha'],
          ['2', 'beta'],
          ['3', 'gamma'],
        ]);
      });

      it('should filter template column when using a global filter (with comparator)', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

        const data = signal([{row: '1', string: 'alpha'}, {row: '2', string: 'beta'}, {row: '3', string: 'gamma'}]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addTemplateColumn({
              name: 'column:template',
              template: item => ({template: template, context: {$implicit: item.string}}),
              filterable: {matcher: (text, context) => context.item.string === text},
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('beta');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'beta'],
        ]);
      });

      it('should filter cross-column when using a global filter', async () => {
        const data = signal([
          {row: '1', string: 'alpha', number: 2, boolean: true},
          {row: '2', string: 'beta', number: 1, boolean: false},
          {row: '3', string: 'gamma', number: 0, boolean: true},
          {row: '4', string: 'delta', number: 10, boolean: false},
        ]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addStringColumn({
              name: 'column:string',
              value: item => item.string,
            })
            .addNumberColumn({
              name: 'column:number',
              value: item => item.number,
            })
            .addBooleanColumn({
              name: 'column:boolean',
              value: item => item.boolean,
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('alpha');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark'],
        ]);

        model.filter('a');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark'],
          ['2', 'beta', '1', 'clear'],
          ['3', 'gamma', '0', 'checkmark'],
          ['4', 'delta', '10', 'clear'],
        ]);

        model.filter('b');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'beta', '1', 'clear'],
        ]);

        model.filter('true');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark'],
          ['3', 'gamma', '0', 'checkmark'],
        ]);

        model.filter('false');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'beta', '1', 'clear'],
          ['4', 'delta', '10', 'clear'],
        ]);

        model.filter('0');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'beta', '1', 'clear'],
          ['3', 'gamma', '0', 'checkmark'],
          ['4', 'delta', '10', 'clear'],
        ]);

        model.filter('1');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark'],
          ['2', 'beta', '1', 'clear'],
          ['3', 'gamma', '0', 'checkmark'],
        ]);

        model.filter('2');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark'],
        ]);

        model.filter('10');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['4', 'delta', '10', 'clear'],
        ]);

        model.filter('11');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([]);
      });

      it('should call custom column filter matcher when using a global filter', async () => {
        const data = signal([{string: 'alpha'}, {string: 'beta'}, {string: 'gamma'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addStringColumn({
            name: 'column:string',
            value: item => item.string,
            filterable: {matcher: (text, context) => context.value.length === text.length},
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:string'})!;

        await column.filter('abcd');
        await table.waitUntilStable();
        expect(await column.values()).toEqual(['beta']);

        await column.filter(null);
        await table.waitUntilStable();
        expect(await column.values()).toEqual(['alpha', 'beta', 'gamma']);
      });
    });
  });

  describe('Hierarchical Data Source', () => {

    it('should show the chevron only in the first column by default', async () => {
      const {fixture} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideTableTreeDatasource(signal(['parent', 'leaf']), item => item === 'parent' ? ['child'] : []),
        datasource: ɵillegaldatasource(),
        columns: table => table
          .addStringColumn(item => item)
          .addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).cells[0]!.element!.querySelector('button.e2e-toggle-children')).not.toBeNull();
      expect(table.row({nth: 0}).cells[1]!.element!.querySelector('button.e2e-toggle-children')).toBeNull();
      expect(table.row({nth: 1}).cells[0]!.element!.querySelector('button.e2e-toggle-children')).toBeNull();
    });

    it('should show the chevron in the configured column and toggle the row', async () => {
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideTableTreeDatasource(signal(['parent']), id => id === 'parent' ? ['child'] : []),
        datasource: ɵillegaldatasource(),
        columns: table => table
          .addStringColumn(item => item)
          .addStringColumn({value: item => item, showExpansionControl: true}),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(model.columns().map(column => column.showExpansionControl)).toEqual([false, true]);
      expect(table.row({nth: 0}).cells[0]!.element!.querySelector('button.e2e-toggle-children')).toBeNull();
      const toggle = table.row({nth: 0}).cells[1]!.element!.querySelector<HTMLButtonElement>('button.e2e-toggle-children');
      expect(toggle).not.toBeNull();

      toggle!.click();
      await table.waitUntilStable();
      expect(table.rows).toHaveSize(2);
      expect(table.row({nth: 0}).cells[1]!.element!.querySelector('sci-icon.e2e-expanded')).not.toBeNull();
    });

    it('should expand and collapse nested rows', async () => {
      const children = new Map([
        ['1', ['1.1', '1.2']],
        ['1.1', ['1.1.1']],
      ]);
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideTableTreeDatasource(signal(['1', '2', '3']), item => children.get(item) ?? []),
        datasource: ɵillegaldatasource(),
        columns: table => table.addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      const values = (): string[] => [...model.rowsByIndex().values()].map(row => row!.item!);
      expect(values()).toEqual(['1', '2', '3']);

      model.expand('1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '1.1', '1.2', '2', '3']);

      model.expand('1.1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '1.1', '1.1.1', '1.2', '2', '3']);

      model.collapse('1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '2', '3']);

      model.expand('1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '1.1', '1.1.1', '1.2', '2', '3']);

      model.collapse('1.1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '1.1', '1.2', '2', '3']);
    });

    it('should expand and collapse the last row at the viewport boundary', async () => {
      const {fixture, model} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideTableTreeDatasource(signal(generateData(10, i => i)), item => item === 9 ? [10, 11] : []),
        datasource: ɵillegaldatasource(),
        showHeader: false,
        bufferSize: 0,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {height: '300px', designTokens: {'--sci-table-row-height': '30px'}});

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(model.visibleRowCount()).toBe(10);

      model.expand(9);
      await table.waitUntilStable();
      expect(model.visibleRowCount()).toBe(12);
      await table.scrollY({y: 2 * 30});
      expect(table.row({nth: table.rows.length - 1}).cells[0]!.value).toBe('11');

      model.collapse(9);
      await table.waitUntilStable();
      expect(model.visibleRowCount()).toBe(10);
      expect(table.scrollTop).toBe(0);
    });

    it('should expand the last row when the table is shorter than the viewport', async () => {
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideTableTreeDatasource(signal(['1', '2']), item => item === '2' ? ['2.1'] : []),
        datasource: ɵillegaldatasource(),
        columns: table => table.addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(table.rows).toHaveSize(2);

      model.expand('2');
      await table.waitUntilStable();
      expect(table.rows).toHaveSize(3);
      expect(table.row({nth: 2}).cells[0]!.value).toBe('2.1');

      model.collapse('2');
      await table.waitUntilStable();
      expect(table.rows).toHaveSize(2);
    });
  });

  describe('Pageable Hierarchical Data Source', () => {

    it('should expand and collapse nested rows', async () => {
      const roots = ['1', '2', '3'];
      const getIds = jasmine.createSpy().and.returnValue([
        ...roots.map(id => ({id})),
        {id: '1.1', parentId: '1'},
        {id: '1.2', parentId: '1'},
        {id: '1.1.1', parentId: '1.1'},
      ]);
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(String));
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideAsyncTableTreeDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => table.addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      const values = (): string[] => [...model.rowsByIndex().values()].map(row => row!.item!);
      expect(values()).toEqual(roots);
      expect(getIds).toHaveBeenCalledOnceWith({sortCriteria: [], columnFilters: []});
      expect(getItems).toHaveBeenCalledOnceWith(roots);

      model.expand('1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '1.1', '1.2', '2', '3']);
      expect(getItems).toHaveBeenCalledWith(['1.1', '1.2']);
      expect(getItems).toHaveBeenCalledTimes(2);

      model.expand('1.1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '1.1', '1.1.1', '1.2', '2', '3']);
      expect(getItems).toHaveBeenCalledWith(['1.1.1']);
      expect(getItems).toHaveBeenCalledTimes(3);

      model.collapse('1');
      await table.waitUntilStable();
      expect(values()).toEqual(roots);
      expect(getItems).toHaveBeenCalledTimes(3);

      model.expand('1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '1.1', '1.1.1', '1.2', '2', '3']);
      expect(getItems).toHaveBeenCalledTimes(3);

      model.collapse('1.1');
      await table.waitUntilStable();
      expect(values()).toEqual(['1', '1.1', '1.2', '2', '3']);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledTimes(3);
    });

    it('should show child errors on the table and reload on retry', async () => {
      const getIds = jasmine.createSpy().and.returnValue([{id: 'parent'}, {id: 'child', parentId: 'parent'}]);
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.includes('child') ? throwError(() => new Error('Child load failed')) : of(ids.map(String)));
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideAsyncTableTreeDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => table.addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      model.expand('parent');
      await table.waitUntilStable();
      expect(model.error()).toBeDefined();
      fixture.detectChanges();
      expect(fixture.nativeElement.shadowRoot.querySelector('.e2e-datasource-retry')).not.toBeNull();

      getItems.and.callFake((ids: unknown[]) => of(ids.map(String)));
      getItems.calls.reset();
      (fixture.nativeElement.shadowRoot.querySelector('.e2e-datasource-retry') as HTMLButtonElement).click();
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledOnceWith(['parent', 'child']);
      expect(model.error()).toBeUndefined();
    });

    it('should show skeletons for expanded children until their items load', async () => {
      const children$ = new Subject<string[]>();
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.includes('child') ? children$ : of(ids.map(String)));
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideAsyncTableTreeDatasource(
          () => [{id: 'parent'}, {id: 'child', parentId: 'parent'}, {id: 'sibling'}],
          getItems,
        ),
        datasource: ɵillegaldatasource(),
        pageSize: 1,
        columns: table => table.addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(getItems.calls.allArgs()).toEqual([[['parent']], [['sibling']]]);
      getItems.calls.reset();
      model.expand('parent');
      await table.waitUntilStable();

      expect(getItems).toHaveBeenCalledOnceWith(['child']);
      expect(model.visibleRowCount()).toBe(3);
      expect(table.rows).toHaveSize(3);
      expect(table.row({nth: 0}).cells[0]!.value).toContain('parent');
      expect(table.row({nth: 1}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 2}).cells[0]!.value).toBe('sibling');

      children$.next(['child']);
      await table.waitUntilStable();

      expect(model.visibleRowCount()).toBe(3);
      expect(table.rows).toHaveSize(3);
      expect(table.row({nth: 1}).cells[0]!.value).toBe('child');
      expect(table.row({nth: 2}).cells[0]!.value).toBe('sibling');
      expect(getItems).toHaveBeenCalledTimes(1);
    });

    it('should load children in batches and reuse loaded items when re-expanding', async () => {
      const children = ['1.1', '1.2', '1.3', '1.4'];
      const getIds = jasmine.createSpy().and.returnValue([{id: '1'}, ...children.map(id => ({id, parentId: '1'}))]);
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(String));
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideAsyncTableTreeDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        pageSize: 2,
        columns: table => table.addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledOnceWith(['1']);
      getItems.calls.reset();

      model.expand('1');
      await table.waitUntilStable();
      expect([...model.rowsByIndex().values()].map(row => row!.item)).toEqual(['1', ...children]);
      expect(getItems.calls.allArgs()).toEqual([
        [['1', '1.1']],
        [['1.2', '1.3']],
        [['1.4']],
      ]);
      getItems.calls.reset();

      model.collapse('1');
      await table.waitUntilStable();
      model.expand('1');
      await table.waitUntilStable();
      expect([...model.rowsByIndex().values()].map(row => row!.item)).toEqual(['1', ...children]);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).not.toHaveBeenCalled();
    });

    it('should retain child items across row remapping', async () => {
      const columns = signal(['first']);
      const getIds = jasmine.createSpy().and.returnValue(of([{id: 'parent'}, {id: 'child', parentId: 'parent'}]));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => of(ids.map(String)));
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideAsyncTableTreeDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => {
          for (const column of columns()) {
            table.addStringColumn(column, item => item);
          }
        },
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      model.expand('parent');
      await table.waitUntilStable();
      expect(table.rows).toHaveSize(2);
      expect(getItems).toHaveBeenCalledWith(['parent', 'child']);
      expect(getItems).toHaveBeenCalledTimes(2);

      columns.set(['first', 'second']);
      await table.waitUntilStable();
      expect(table.rows).toHaveSize(2);
      expect(table.row({nth: 1}).cells).toHaveSize(2);
      expect(table.row({nth: 1}).cells.map(cell => cell.value)).toEqual(['child', 'child']);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledTimes(2);
    });

    it('should load children when expanding the last row at the viewport boundary', async () => {
      const roots = generateData(10, i => i);
      const getIds = jasmine.createSpy().and.returnValue([
        ...roots.map(id => ({id})),
        {id: 10, parentId: 9},
        {id: 11, parentId: 9},
      ]);
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));
      const {fixture, model} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableTreeDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        showHeader: false,
        bufferSize: 0,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {height: '300px', designTokens: {'--sci-table-row-height': '30px'}});

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(model.visibleRowCount()).toBe(10);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledOnceWith(roots);

      model.expand(9);
      await table.waitUntilStable();
      expect(getItems).toHaveBeenCalledWith([...roots, 10, 11]);
      expect(getItems).toHaveBeenCalledTimes(2);
      expect(model.visibleRowCount()).toBe(12);
      await table.scrollY({y: 2 * 30});
      expect(table.row({nth: table.rows.length - 1}).cells[0]!.value).toBe('11');
      expect(getItems).toHaveBeenCalledTimes(2);

      model.collapse(9);
      await table.waitUntilStable();
      expect(model.visibleRowCount()).toBe(10);
      expect(table.scrollTop).toBe(0);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledTimes(2);

      model.expand(9);
      await table.waitUntilStable();
      expect(model.visibleRowCount()).toBe(12);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledTimes(2);
    });

    it('should load children when expanding the last row of a table shorter than the viewport', async () => {
      const getIds = jasmine.createSpy().and.returnValue([{id: '1'}, {id: '2'}, {id: '2.1', parentId: '2'}]);
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(String));
      const {fixture, model} = createSciTableComponent(sciTable<string>({
        ɵdatasource: provideAsyncTableTreeDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => table.addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(table.rows).toHaveSize(2);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledOnceWith(['1', '2']);

      model.expand('2');
      await table.waitUntilStable();
      expect(getItems).toHaveBeenCalledWith(['1', '2', '2.1']);
      expect(getItems).toHaveBeenCalledTimes(2);
      expect(table.rows).toHaveSize(3);
      expect(table.row({nth: 2}).cells[0]!.value).toBe('2.1');

      model.collapse('2');
      await table.waitUntilStable();
      expect(table.rows).toHaveSize(2);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pageable Data Source', () => {

    it('should remap columns without loading the page again', async () => {
      const columns = signal(['id']);
      const getIds = jasmine.createSpy().and.returnValue(['1']);
      const getItems = jasmine.createSpy().and.returnValue([{id: '1', name: 'one'}]);
      const {fixture, model} = createSciTableComponent(sciTable<{id: string; name: string}>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        trackBy: item => item.id,
        columns: table => {
          for (const column of columns()) {
            table.addStringColumn(column, item => item[column as 'id' | 'name']);
          }
        },
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(model.rowsByIndex().get(0)?.cells).toHaveSize(1);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledOnceWith(['1']);

      columns.set(['id', 'name']);
      await table.waitUntilStable();
      expect(model.rowsByIndex().get(0)?.cells?.length).toBe(2);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledTimes(1);
    });

    it('should derive the count from the most recent IDs', async () => {
      const ids$ = new BehaviorSubject([0, 1, 2, 3, 4]);
      const getIds = jasmine.createSpy().and.returnValue(ids$);
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));
      const {fixture, model} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        pageSize: 2,
        bufferSize: 0,
        showHeader: false,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {height: '30px', designTokens: {'--sci-table-row-height': '30px'}});

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(model.visibleRowCount()).toBe(5);
      expect(getItems).toHaveBeenCalledOnceWith([0, 1]);

      ids$.next([0, 1, 2, 3]);
      await table.waitUntilStable();
      expect(model.visibleRowCount()).toBe(4);
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledTimes(1);
    });

    it('should cache pages', async () => {
      const getIds = jasmine.createSpy().and.returnValue(generateData(1_000, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        pageSize: 5,
        bufferSize: 0,
        showHeader: false,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 10}, i => `${i}`));
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledWith([0, 1, 2, 3, 4]);
      expect(getItems).toHaveBeenCalledWith([5, 6, 7, 8, 9]);
      expect(getItems).toHaveBeenCalledTimes(2);
      getItems.calls.reset();

      // Scroll down to row 20
      await table.scrollY({y: 20 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 20, end: 30}, i => `${i}`));
      expect(getItems).toHaveBeenCalledWith([20, 21, 22, 23, 24]);
      expect(getItems).toHaveBeenCalledWith([25, 26, 27, 28, 29]);
      expect(getItems).toHaveBeenCalledTimes(2);
      getItems.calls.reset();

      // Scroll up to row 0
      await table.scrollY({y: 0});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 10}, i => `${i}`));

      // Expect page not to be loaded again.
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).not.toHaveBeenCalled();
    });

    it('should load pages based on pageSize [pageSize=5]', async () => {
      const getIds = jasmine.createSpy().and.returnValue(generateData(1_000, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture} = createSciTableComponent(sciTable<number>({
        bufferSize: 3,
        pageSize: 5,
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        showHeader: false,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Buffer before:    []
      // Rows in Viewport: [0,..,9]
      // Buffer after:     [10,11,12]
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 13}, i => `${i}`));
      expect(getItems).toHaveBeenCalledWith([0, 1, 2, 3, 4]);
      expect(getItems).toHaveBeenCalledWith([5, 6, 7, 8, 9]);
      expect(getItems).toHaveBeenCalledWith([10, 11, 12, 13, 14]);
      expect(getItems).toHaveBeenCalledTimes(3);
      getItems.calls.reset();

      // Scroll down to row 4
      // Buffer before:    [1,2,3]
      // Rows in Viewport: [4,..,13]
      // Buffer after:     [14,15,16]
      await table.scrollY({y: 4 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 17}, i => `${i}`));
      expect(getItems).toHaveBeenCalledOnceWith([15, 16, 17, 18, 19]);
      getItems.calls.reset();

      // Scroll down to row 40
      // Buffer before:    [37,38,39]
      // Rows in Viewport: [40,..,49]
      // Buffer after:     [50,51,52]
      await table.scrollY({y: 40 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 37, end: 53}, i => `${i}`));
      expect(getItems).toHaveBeenCalledWith([35, 36, 37, 38, 39]);
      expect(getItems).toHaveBeenCalledWith([40, 41, 42, 43, 44]);
      expect(getItems).toHaveBeenCalledWith([45, 46, 47, 48, 49]);
      expect(getItems).toHaveBeenCalledWith([50, 51, 52, 53, 54]);
      expect(getItems).toHaveBeenCalledTimes(4);
      expect(getIds).toHaveBeenCalledTimes(1);
    });

    it('should load pages based on pageSize [pageSize=50]', async () => {
      const getIds = jasmine.createSpy().and.returnValue(generateData(1_000, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture} = createSciTableComponent(sciTable<number>({
        bufferSize: 3,
        pageSize: 50,
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        showHeader: false,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Buffer before:    []
      // Rows in Viewport: [0,..,9]
      // Buffer after:     [10,11,12]
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 13}, i => `${i}`));
      expect(getItems).toHaveBeenCalledOnceWith(generateData(50, i => i));
      getItems.calls.reset();

      // Scroll down to row 4
      // Buffer before:    [1,2,3]
      // Rows in Viewport: [4,..,13]
      // Buffer after:     [14,15,16]
      await table.scrollY({y: 4 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 17}, i => `${i}`));
      expect(getItems).not.toHaveBeenCalled();

      // Scroll down to row 40
      // Buffer before:    [37,38,39]
      // Rows in Viewport: [40,..,49]
      // Buffer after:     [50,51,52]
      await table.scrollY({y: 40 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 37, end: 53}, i => `${i}`));
      expect(getItems).toHaveBeenCalledOnceWith(generateData({start: 50, end: 100}, i => i));
      expect(getIds).toHaveBeenCalledTimes(1);
    });

    it('should allow global filtering', async () => {
      const data = generateData(100, i => i);
      const getIds = jasmine.createSpy().and.callFake((request: SciTableIdsRequest) => data.filter(item => !request.tableFilter || `${item}` === request.tableFilter));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture, model} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => table.addNumberColumn({
          name: 'column:1',
          value: item => item,
        }),
        injector: TestBed.inject(Injector),
      }), {height: '500px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).cells[0]!.value).toEqual('0');

      getIds.calls.reset();
      getItems.calls.reset();
      model.filter('50');
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        tableFilter: '50',
        columnFilters: [],
      }));
      expect(getItems).toHaveBeenCalledOnceWith([50]);
      expect(await table.column({name: 'column:1'})!.values()).toEqual(['50']);
    });

    it('should filter', async () => {
      const data = generateData(100, i => ({id: `ID: ${i}`, name: `Name: ${i}`}));
      const getIds = jasmine.createSpy().and.callFake((request: SciTableIdsRequest) => {
        const filtered = data.filter(item => {
          const idFilter = request.columnFilters.find(filter => filter.columnName === 'column:id');
          if (idFilter && item.id !== idFilter.text) {
            return false;
          }
          const nameFilter = request.columnFilters.find(filter => filter.columnName === 'column:name');
          if (nameFilter && item.name !== nameFilter.text) {
            return false;
          }
          return true;
        });
        return filtered.map(item => item.id);
      });
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(id => data.find(item => item.id === id)!));

      const {fixture, model} = createSciTableComponent<{id: string; name: string}>(sciTable({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        trackBy: item => item.id,
        bufferSize: 0,
        pageSize: 20,
        columns: table => table
          .addStringColumn({
            name: 'column:id',
            value: item => item.id,
          })
          .addStringColumn({
            name: 'column:name',
            value: item => item.name,
          }),
        injector: TestBed.inject(Injector),
      }), {height: '500px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));
      getIds.calls.reset();
      getItems.calls.reset();

      // Filter by 'column:id'.
      model.filter('ID: 5', {columnName: 'column:id'});
      await table.waitUntilStable();

      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [
          {columnName: 'column:id', text: 'ID: 5'},
        ],
      }));
      expect(getItems).toHaveBeenCalledOnceWith(['ID: 5']);
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 5']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 5']);
      getIds.calls.reset();
      getItems.calls.reset();

      // Clear column filter.
      model.filter(null, {columnName: 'column:id'});
      await table.waitUntilStable();

      // Clearing the filter reuses the unfiltered IDs and reloads the visible items.
      expect(getIds).not.toHaveBeenCalled();
      expect(getItems).toHaveBeenCalledOnceWith(generateData(20, i => `ID: ${i}`));
      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));
      getIds.calls.reset();
      getItems.calls.reset();

      // Filter by 'column:name'.
      model.filter('Name: 10', {columnName: 'column:name'});
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [
          {columnName: 'column:name', text: 'Name: 10'},
        ],
      }));
      expect(getItems).toHaveBeenCalledOnceWith(['ID: 10']);
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 10']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 10']);
      getIds.calls.reset();
      getItems.calls.reset();

      // Filter by 'column:id' (no match).
      model.filter('ID: 11', {columnName: 'column:id'});
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [
          {columnName: 'column:name', text: 'Name: 10'},
          {columnName: 'column:id', text: 'ID: 11'},
        ],
      }));
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({name: 'column:id'})!.values()).toEqual([]);
      expect(await table.column({name: 'column:name'})!.values()).toEqual([]);
      getIds.calls.reset();
      getItems.calls.reset();

      // Filter by 'column:id' (match).
      model.filter('ID: 10', {columnName: 'column:id'});
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [
          {columnName: 'column:name', text: 'Name: 10'},
          {columnName: 'column:id', text: 'ID: 10'},
        ],
      }));
      expect(getItems).toHaveBeenCalledOnceWith(['ID: 10']);
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 10']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 10']);
    });

    it('should scroll to top on filter', async () => {
      const data = generateData(100, i => ({id: `ID: ${i}`, name: `Name: ${i}`}));
      const getIds = jasmine.createSpy().and.callFake((request: SciTableIdsRequest) => {
        const filtered = data.filter(item => {
          const idFilter = request.columnFilters.find(filter => filter.columnName === 'column:id');
          if (idFilter && item.id !== idFilter.text) {
            return false;
          }
          const nameFilter = request.columnFilters.find(filter => filter.columnName === 'column:name');
          if (nameFilter && item.name !== nameFilter.text) {
            return false;
          }
          return true;
        });
        return filtered.map(item => item.id);
      });
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(id => data.find(item => item.id === id)!));

      const {fixture, model} = createSciTableComponent<{id: string; name: string}>(sciTable({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        trackBy: item => item.id,
        bufferSize: 0,
        pageSize: 20,
        columns: table => table
          .addStringColumn({
            name: 'column:id',
            value: item => item.id,
          })
          .addStringColumn({
            name: 'column:name',
            value: item => item.name,
          }),
        injector: TestBed.inject(Injector),
      }), {height: '500px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      await table.scrollY({deltaY: 300});
      await table.waitUntilStable();

      expect(table.scrollTop).toBeGreaterThan(0);
      expect(getItems).toHaveBeenCalledWith(generateData({start: 20, end: 40}, i => `ID: ${i}`));
      getIds.calls.reset();
      getItems.calls.reset();

      // Filter by 'column:id'.
      model.filter('ID: 5', {columnName: 'column:id'});
      await table.waitUntilStable();

      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [
          {columnName: 'column:id', text: 'ID: 5'},
        ],
      }));
      expect(getItems).toHaveBeenCalledOnceWith(['ID: 5']);
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 5']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 5']);
      expect(table.scrollTop).toBe(0);
    });

    it('should sort', async () => {
      const data = generateData(100, i => i);
      const getIds = jasmine.createSpy().and.callFake((request: SciTableIdsRequest) => {
        const sortCriterion = request.sortCriteria.find(criterion => criterion.columnName === 'column:1');
        return sortCriterion?.direction === 'asc' ? [...data] : [...data].reverse();
      });
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture} = createSciTableComponent<number>(sciTable({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        bufferSize: 0,
        pageSize: 20,
        columns: table => table.addNumberColumn({
          name: 'column:1',
          value: item => item,
        }),
        injector: TestBed.inject(Injector),
      }), {height: '500px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      getIds.calls.reset();
      getItems.calls.reset();

      // Sort 'column:1' in ascending order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        sortCriteria: [{columnName: 'column:1', direction: 'asc'}],
      }));
      expect(getItems).toHaveBeenCalledOnceWith(generateData(20, i => i));
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`));
      getIds.calls.reset();
      getItems.calls.reset();

      // Sort 'column:1' in descending order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        sortCriteria: [{columnName: 'column:1', direction: 'desc'}],
      }));
      expect(getItems).toHaveBeenCalledOnceWith(generateData(20, i => 99 - i));
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`).reverse());
      getIds.calls.reset();
      getItems.calls.reset();

      // Reset sort for 'column:1'.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({sortCriteria: []}));
      expect(getItems).toHaveBeenCalledOnceWith(generateData(20, i => 99 - i));
    });

    it('should scroll to top on sort', async () => {
      const data = generateData(100, i => i);
      const getIds = jasmine.createSpy().and.callFake((request: SciTableIdsRequest) => {
        const sortCriterion = request.sortCriteria.find(criterion => criterion.columnName === 'column:1');
        return sortCriterion?.direction === 'asc' ? [...data] : [...data].reverse();
      });
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture} = createSciTableComponent<number>(sciTable({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        bufferSize: 0,
        pageSize: 20,
        columns: table => table.addNumberColumn({
          name: 'column:1',
          value: item => item,
        }),
        injector: TestBed.inject(Injector),
      }), {height: '500px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      await table.scrollY({deltaY: 300});
      await table.waitUntilStable();

      expect(table.scrollTop).toBeGreaterThan(0);
      expect(getItems).toHaveBeenCalledWith(generateData({start: 20, end: 40}, i => 99 - i));
      getIds.calls.reset();
      getItems.calls.reset();

      // Sort 'column:1' in ascending order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        sortCriteria: [{columnName: 'column:1', direction: 'asc'}],
      }));
      expect(getItems).toHaveBeenCalledOnceWith(generateData(20, i => i));
      expect(table.scrollTop).toBe(0);
    });

    it('should load data from observable', async () => {
      const data$ = new BehaviorSubject<{id: number; name: string}[]>([]);
      const getIds = jasmine.createSpy().and.returnValue(of(generateData(20, i => i)));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => data$.pipe(map(data => data.filter(item => ids.includes(item.id)))));

      const {fixture} = createSciTableComponent(sciTable<{id: number; name: string}>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        trackBy: item => item.id,
        columns: table => table.addStringColumn({
          name: 'column:1',
          value: item => item.name,
        }),
        injector: TestBed.inject(Injector),
      }), {height: '300px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Trigger initial load.
      data$.next(generateData(20, i => ({id: i, name: `${i} (initial)`})));
      await table.waitUntilStable();
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(20, i => `${i} (initial)`));
      expect(getItems).toHaveBeenCalledOnceWith(generateData(20, i => i));

      // Trigger update.
      data$.next(generateData(20, i => ({id: i, name: `${i} (updated)`})));
      await table.waitUntilStable();
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(20, i => `${i} (updated)`));

      // Expect loader not to be called again.
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).toHaveBeenCalledTimes(1);
    });

    it('should cancel load', async () => {
      const loaded = new Array<unknown[]>();
      const onLoad$ = new Subject<void>();
      const getIds = jasmine.createSpy().and.returnValue(generateData(100, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => onLoad$
        .pipe(
          take(1),
          map(() => ids.map(Number)),
          tap(() => loaded.push(ids)),
        ));

      const {fixture} = createSciTableComponent(sciTable<number>({
        pageSize: 10,
        bufferSize: 0,
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        showHeader: false,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {
        height: '270px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Complete the initial item load.
      onLoad$.next();
      await table.waitUntilStable();
      expect(getItems).toHaveBeenCalledOnceWith(generateData(10, i => i));
      getItems.calls.reset();

      // Scroll one page.
      await table.scrollY({deltaY: 300});
      expect(getItems).toHaveBeenCalledOnceWith(generateData({start: 10, end: 20}, i => i));
      getItems.calls.reset();

      // Scroll again before loader response.
      await table.scrollY({deltaY: 300});
      expect(getItems).toHaveBeenCalledOnceWith(generateData({start: 20, end: 30}, i => i));
      getItems.calls.reset();

      onLoad$.next();
      await table.waitUntilStable();

      // Expect to only have loaded the initial page and the last.
      expect(loaded).toEqual([
        generateData(10, i => i),
        generateData({start: 20, end: 30}, i => i),
      ]);
      expect(getIds).toHaveBeenCalledTimes(1);
    });

    it('should select all rows on Ctrl+a', async () => {
      const getIds = jasmine.createSpy().and.returnValue(generateData(100, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture, model} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {height: '500px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      table.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', ctrlKey: true}));
      await table.waitUntilStable();

      expect(model.selectedItems()).toEqual(generateData(100, i => i));
    });

    it('should display rows in range [bufferSize=0]', async () => {
      const getIds = jasmine.createSpy().and.returnValue(generateData(11, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        bufferSize: 0,
        pageSize: 50,
        filterable: true,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(getItems).toHaveBeenCalledOnceWith(generateData(11, i => i));
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 8}, i => `${i}`));
      getItems.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 9}, i => `${i}`));
      getItems.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 2, end: 10}, i => `${i}`));
      getItems.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 3, end: 11}, i => `${i}`));
      getItems.calls.reset();

      // Scroll one row down (beyond end)
      await table.scrollY({deltaY: 30});
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 3, end: 11}, i => `${i}`));
    });

    it('should display rows in range [bufferSize=1]', async () => {
      const getIds = jasmine.createSpy().and.returnValue(generateData(11, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        bufferSize: 1,
        pageSize: 50,
        filterable: true,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(getItems).toHaveBeenCalledOnceWith(generateData(11, i => i));
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 9}, i => `${i}`));
      getItems.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 10}, i => `${i}`));
      getItems.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 11}, i => `${i}`));
      getItems.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 2, end: 11}, i => `${i}`));
      getItems.calls.reset();

      // Scroll one row down (beyond end)
      await table.scrollY({deltaY: 30});
      expect(getItems).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 2, end: 11}, i => `${i}`));
    });

    it('should display skeletons until IDs are available', async () => {
      const getIds = jasmine.createSpy().and.returnValue(NEVER);
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        showHeader: false,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Expect 10 rows displaying a skeleton.
      expect(table.rows.length).toEqual(10);
      for (const row of table.rows) {
        expect(row.cells[0]!.isLoading()).toBeTrue();
      }
      expect(getIds).toHaveBeenCalledTimes(1);
      expect(getItems).not.toHaveBeenCalled();

      // Expect no vertical overflow.
      expect(table.viewport.scrollHeight).toEqual(table.viewport.clientHeight);
    });

    it('should call data provider functions in injection context', async () => {
      let idsInjector: Injector | undefined;
      let itemsInjector: Injector | undefined;

      const getIds: SciTableDataProvider<number>['getIds'] = () => {
        idsInjector = inject(Injector);
        return [1, 2, 3];
      };
      const getItems: SciTableDataProvider<number>['getItems'] = ids => {
        itemsInjector = inject(Injector);
        return ids.map(Number);
      };

      const {fixture} = createSciTableComponent(table({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => table,
        injector: TestBed.inject(Injector),
      }));

      await fixture.whenStable();
      expect(idsInjector).toBeDefined();
      expect(itemsInjector).toBeDefined();
    });

    it('should not call data provider functions in reactive context', async () => {
      const getIds: SciTableDataProvider<number>['getIds'] = () => {
        assertNotInReactiveContext(getIds);
        return [1, 2, 3];
      };
      const getItems: SciTableDataProvider<number>['getItems'] = ids => {
        assertNotInReactiveContext(getItems);
        return ids.map(Number);
      };

      const {fixture, model} = createSciTableComponent(table({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => table,
        injector: TestBed.inject(Injector),
      }));

      await fixture.whenStable();
      expect(model.error()).toBeUndefined();
    });

    it('should destroy previous data loader function injection context', async () => {
      const destroyRefs = new Array<DestroyRef>();

      const getItems: SciTableDataProvider<number>['getItems'] = ids => {
        destroyRefs.push(inject(DestroyRef));
        return ids.map(Number);
      };

      const {fixture, model} = createSciTableComponent(table({
        ɵdatasource: provideAsyncTableDatasource(() => [1, 2, 3], getItems),
        datasource: ɵillegaldatasource(),
        columns: table => table,
        injector: TestBed.inject(Injector),
      }));

      await fixture.whenStable();
      expect(destroyRefs).toHaveSize(1);
      expect(destroyRefs[0]!.destroyed).toBeFalse();

      // Force reload of the items.
      model.filter('reload 1');
      await fixture.whenStable();
      expect(destroyRefs).toHaveSize(2);
      expect(destroyRefs[0]!.destroyed).toBeTrue();
      expect(destroyRefs[1]!.destroyed).toBeFalse();

      // Force another reload of the items.
      model.filter('reload 2');
      await fixture.whenStable();
      expect(destroyRefs).toHaveSize(3);
      expect(destroyRefs[0]!.destroyed).toBeTrue();
      expect(destroyRefs[1]!.destroyed).toBeTrue();
      expect(destroyRefs[2]!.destroyed).toBeFalse();
    });

    it('should remove stale column filter when removing column', async () => {
      const getIds = jasmine.createSpy().and.returnValue(generateData(10, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const visibleColumns = signal(new Set<`column:${string}`>(['column:1', 'column:2']));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        filterable: true,
        columns: table => visibleColumns().forEach(column => table.addNumberColumn({
          name: column,
          value: item => item,
        })),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({columnFilters: []}));
      getIds.calls.reset();

      // Filter by 'column:1'.
      await table.column({name: 'column:1'})!.filter(1);
      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [
          {columnName: 'column:1', text: 1},
        ],
      }));
      getIds.calls.reset();

      // Filter by 'column:2'.
      await table.column({name: 'column:2'})!.filter(2);
      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [
          {columnName: 'column:1', text: 1},
          {columnName: 'column:2', text: 2},
        ],
      }));
      getIds.calls.reset();

      // Remove 'column:1'.
      visibleColumns.update(columns => deleteFromSet(columns, 'column:1'));
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [
          {columnName: 'column:2', text: 2},
        ],
      }));
      getIds.calls.reset();

      // Remove 'column:2'.
      visibleColumns.update(columns => deleteFromSet(columns, 'column:2'));
      await table.waitUntilStable();
      expect(getIds).not.toHaveBeenCalled(); // Reuse the unfiltered IDs.

      // Add a new filter and verify the removed columns are not part of the request.
      visibleColumns.set(new Set(['column:3']));
      await table.waitUntilStable();
      await table.column({name: 'column:3'})!.filter(3);
      expect(getIds).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableIdsRequest>({
        columnFilters: [{columnName: 'column:3', text: 3}],
      }));
    });

    it('should remove stale column sort criteria when removing column', async () => {
      const getIds = jasmine.createSpy().and.returnValue(generateData(10, i => i));
      const getItems = jasmine.createSpy().and.callFake((ids: unknown[]) => ids.map(Number));

      const visibleColumns = signal(new Set<`column:${string}`>(['column:1', 'column:2']));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: provideAsyncTableDatasource(getIds, getItems),
        datasource: ɵillegaldatasource(),
        columns: table => visibleColumns().forEach(column => table.addNumberColumn({
          name: column,
          value: item => item,
        })),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({sortCriteria: []}));
      getIds.calls.reset();

      // Sort by 'column:1'.
      await table.column({name: 'column:1'})!.toggleSort();
      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({
        sortCriteria: [
          {columnName: 'column:1', direction: 'asc'},
        ],
      }));
      getIds.calls.reset();

      // Sort by 'column:2'.
      await table.column({name: 'column:2'})!.toggleSort({ctrl: true});
      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({
        sortCriteria: [
          {columnName: 'column:1', direction: 'asc'},
          {columnName: 'column:2', direction: 'asc'},
        ],
      }));
      getIds.calls.reset();

      // Sort by 'column:2'.
      await table.column({name: 'column:2'})!.toggleSort({ctrl: true});
      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({
        sortCriteria: [
          {columnName: 'column:1', direction: 'asc'},
          {columnName: 'column:2', direction: 'desc'},
        ],
      }));
      getIds.calls.reset();

      // Remove 'column:1'.
      visibleColumns.update(columns => deleteFromSet(columns, 'column:1'));
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({
        sortCriteria: [
          {columnName: 'column:2', direction: 'desc'},
        ],
      }));
      getIds.calls.reset();

      // Remove 'column:2'.
      visibleColumns.update(columns => deleteFromSet(columns, 'column:2'));
      await table.waitUntilStable();
      expect(getIds).toHaveBeenCalledWith(jasmine.objectContaining<SciTableIdsRequest>({sortCriteria: []}));
    });
  });

  describe('Row Actions', () => {

    it('should trigger primary action on dbl click', async () => {
      const onPrimaryAction = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));
      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.row({nth: 1}).dblClick();

      expect(onPrimaryAction).toHaveBeenCalledWith(jasmine.objectContaining({items: [{id: 2}], sourceEvent: jasmine.anything()}));
    });

    xit('should trigger primary action on enter', async () => {
      const onPrimaryAction = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));

      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.row({nth: 1}).enter();

      expect(onPrimaryAction).toHaveBeenCalledWith(jasmine.objectContaining({items: [{id: 1}], sourceEvent: jasmine.anything()}));
    });

    it('should show actions', async () => {
      const onSelect = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        rowActions: (toolbar, item) => {
          toolbar.addToolbarButton({
            icon: 'delete',
            cssClass: 'testee',
            onSelect: () => {
              onSelect(item);
            },
          });
        },
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.row({nth: 1}).hover();
      await table.waitUntilStable();
      table.row({nth: 1}).rowAction({cssClass: 'testee'}).click();
      await table.waitUntilStable();

      expect(onSelect).toHaveBeenCalledOnceWith({id: 2});
    });

    /**
     * Regression where closing a menu with groups removed application styles.
     *
     * Angular removed application styles only if used inside `sci-table`, likely due to Shadow DOM.
     */
    it('should not remove styles when closing menu with groups', async () => {
      const data = signal([{id: '1'}, {id: '2'}, {id: '3'}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        rowActions: toolbar => toolbar
          .addToolbarMenu({icon: 'scion.more_vertical', visualMenuIndicator: false, cssClass: 'testee'}, menu => menu
            .addGroup(group => group.addMenuItem({
              icon: 'scion.folder',
              label: 'Menu item 1',
              cssClass: 'testee',
              onSelect: noop,
            }))
            .addGroup(group => group.addMenuItem({
              icon: 'scion.folder',
              label: 'Menu item 2',
              onSelect: noop,
            })),
          ),
        columns: table => table
          .addStringColumn(item => item.id)
          .addStringColumn(item => item.id)
          .addStringColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }), {width: '600px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Hover row to display row actions.
      const row = table.row({nth: 1});
      row.hover();
      await table.waitUntilStable();

      // Open menu.
      row.rowAction({cssClass: 'testee'}).click();
      expect(await waitUntilStable(() => row.element.querySelector('sci-menu.testee'))).not.toBeNull();

      // Close the menu.
      const menuItemn = row.element.querySelector<HTMLElement>('sci-menu.testee button.e2e-menu-item.testee')!;
      menuItemn.click();

      // Expect menu to be closed.
      expect(await waitUntilStable(() => row.element.querySelector('sci-menu.testee'))).toBeNull();

      // Expect correct rendering of columns, verifying that styles have not been removed.
      expect(table.column({index: 0})!.width).toBe(200);
      expect(table.column({index: 1})!.width).toBe(200);
      expect(table.column({index: 2})!.width).toBe(200);
    });
  });

  describe('Row Bindings', () => {

    it('should pass index to row binding function', async () => {
      const data = signal(generateData(100, i => `Row ${i}`));

      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        filterable: true,
        rowBindings: (bindings, _item, index) => bindings
          .addAttributeBinding('data-spec-index', index)
          .addPartBinding(`row:spec-index-${index}`)
          .addClassBinding(`spec-index-${index}`),
        columns: table => table.addStringColumn(item => item),
        injector: TestBed.inject(Injector),
      }), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element.getAttribute('data-spec-index')).toEqual('0');
      expect(table.row({nth: 0}).element).toHaveClass('spec-index-0');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:spec-index-0');

      expect(table.row({nth: 1}).element.getAttribute('data-spec-index')).toEqual('1');
      expect(table.row({nth: 1}).element).toHaveClass('spec-index-1');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:spec-index-1');

      // Scroll down to load another page.
      await table.scrollY({y: 50 * 30});

      // Expect index to be in ascending order without gaps.
      const rowIndex = table.rows.findIndex(row => row.cells[0]!.value === 'Row 50');

      expect(table.row({nth: rowIndex}).element.getAttribute('data-spec-index')).toEqual('50');
      expect(table.row({nth: rowIndex}).element).toHaveClass('spec-index-50');
      expect(table.row({nth: rowIndex}).cells[0]!.element!.getAttribute('part')).toContain('row:spec-index-50');

      expect(table.row({nth: rowIndex + 1}).element.getAttribute('data-spec-index')).toEqual('51');
      expect(table.row({nth: rowIndex + 1}).element).toHaveClass('spec-index-51');
      expect(table.row({nth: rowIndex + 1}).cells[0]!.element!.getAttribute('part')).toContain('row:spec-index-51');

      // Filter table.
      await table.column({index: 0})?.filter('1');

      // Expect index to start at 0 in ascending order without gaps.
      expect(table.row({nth: 0}).element.getAttribute('data-spec-index')).toEqual('0');
      expect(table.row({nth: 0}).element).toHaveClass('spec-index-0');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:spec-index-0');

      expect(table.row({nth: 1}).element.getAttribute('data-spec-index')).toEqual('1');
      expect(table.row({nth: 1}).element).toHaveClass('spec-index-1');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:spec-index-1');

      expect(table.row({nth: 2}).element.getAttribute('data-spec-index')).toEqual('2');
      expect(table.row({nth: 2}).element).toHaveClass('spec-index-2');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:spec-index-2');

      expect(table.row({nth: 3}).element.getAttribute('data-spec-index')).toEqual('3');
      expect(table.row({nth: 3}).element).toHaveClass('spec-index-3');
      expect(table.row({nth: 3}).cells[0]!.element!.getAttribute('part')).toContain('row:spec-index-3');
    });

    it('should bind attribute to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const {fixture} = createSciTableComponent<{id: number}>(sciTable({
        datasource: data,
        rowBindings: (bindings, item) => bindings.addAttributeBinding('data-spec-id', item.id),
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element.getAttribute('data-spec-id')).toEqual('1');
      expect(table.row({nth: 1}).element.getAttribute('data-spec-id')).toEqual('2');
      expect(table.row({nth: 2}).element.getAttribute('data-spec-id')).toEqual('3');
    });

    it('should bind reactive attribute to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const attributes = new Map<number, WritableSignal<{name: string; value: string} | undefined>>([
        [1, signal(undefined)],
        [2, signal({name: 'data-spec-attribute', value: 'a'})],
        [3, signal(undefined)],
      ]);

      const {fixture} = createSciTableComponent<{id: number}>(sciTable({
        datasource: data,
        rowBindings: (bindings, item) => {
          const {name, value} = attributes.get(item.id)?.() ?? {};
          if (name) {
            bindings.addAttributeBinding(name, value);
          }
        },
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element.getAttribute('data-spec-attribute')).toBeNull();
      expect(table.row({nth: 1}).element.getAttribute('data-spec-attribute')).toEqual('a');
      expect(table.row({nth: 2}).element.getAttribute('data-spec-attribute')).toBeNull();

      // Update attribute of row 2.
      attributes.get(2)!.set({name: 'data-spec-attribute', value: 'b'});
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element.getAttribute('data-spec-attribute')).toBeNull();
      expect(table.row({nth: 1}).element.getAttribute('data-spec-attribute')).toEqual('b');
      expect(table.row({nth: 2}).element.getAttribute('data-spec-attribute')).toBeNull();
    });

    it('should bind CSS class to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const {fixture} = createSciTableComponent<{id: number}>(sciTable({
        datasource: data,
        rowBindings: (bindings, item) => bindings.addClassBinding(`spec-${item.id}`),
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element).toHaveClass('spec-1');
      expect(table.row({nth: 1}).element).toHaveClass('spec-2');
      expect(table.row({nth: 2}).element).toHaveClass('spec-3');
    });

    it('should bind reactive CSS class to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const cssClasses = new Map<number, WritableSignal<string | undefined>>([
        [1, signal(undefined)],
        [2, signal('spec-a')],
        [3, signal(undefined)],
      ]);

      const {fixture} = createSciTableComponent<{id: number}>(sciTable({
        datasource: data,
        rowBindings: (bindings, item) => bindings.addClassBinding(cssClasses.get(item.id)?.()),
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element).not.toHaveClass('spec-a');
      expect(table.row({nth: 1}).element).toHaveClass('spec-a');
      expect(table.row({nth: 2}).element).not.toHaveClass('spec-a');

      // Update attribute of row 2.
      cssClasses.get(2)!.set('spec-b');
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element).not.toHaveClass('spec-b');
      expect(table.row({nth: 1}).element).toHaveClass('spec-b');
      expect(table.row({nth: 2}).element).not.toHaveClass('spec-b');
    });

    it('should bind part-attribute to cell', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const {fixture} = createSciTableComponent<{id: number}>(sciTable({
        datasource: data,
        rowBindings: (bindings, item) => bindings.addPartBinding(`row:${item.id}`),
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:1');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:2');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:3');
    });

    it('should bind reactive part-attribute to cell', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const partAttributes = new Map<number, WritableSignal<`row:${string}` | undefined>>([
        [1, signal(undefined)],
        [2, signal('row:negative')],
        [3, signal(undefined)],
      ]);

      const {fixture} = createSciTableComponent<{id: number}>(sciTable({
        datasource: data,
        rowBindings: (bindings, item) => bindings.addPartBinding(partAttributes.get(item.id)?.()),
        columns: table => table.addNumberColumn(item => item.id),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).not.toContain('row:negative');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:negative');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).not.toContain('row:negative');

      // Update part attribute of row 2.
      partAttributes.get(2)!.set('row:positive');
      await table.waitUntilStable();

      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).not.toContain('row:positive');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:positive');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).not.toContain('row:positive');
    });
  });

  describe('Miscellaneous', () => {

    /**
     * Tests that the application becomes stable if using <sci-table>, i.e., that resources used by the table finish loading.
     */
    it('should become stable', async () => {
      const data = signal([1, 2, 3]);

      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table.addNumberColumn(item => item),
        injector: TestBed.inject(Injector),
      }));
      await expectAsync(fixture.whenStable()).toBeResolved();
    });
  });
});

@Component({
  selector: 'spec-custom-column',
  template: `{{value()}}`,
})
class CustomColumnComponent {
  public readonly value = input.required<unknown>();
}

@Component({
  selector: 'spec-custom-column-template-provider',
  template: `
    <ng-template let-item let-context="context">
      {{item}} {{context}}
    </ng-template>
  `,
})
class CustomColumnTemplateProviderComponent {
  public readonly template = viewChild.required<TemplateRef<unknown>>(TemplateRef);
}

function provideNullTableStorage(): EnvironmentProviders {
  return provideTableStorage(class {
    public load(): null {
      return null;
    }

    public store(): void {
      // NOOP
    }
  });
}

/**
 * Generates an array of items using a factory function, either by count or for a given range.
 */
export function generateData<T>(countOrRange: number | {start: number/* inclusive */; end: number/* exclusive */}, factoryFn: (index: number) => T): T[] {
  if (typeof countOrRange === 'number') {
    return generateData({start: 0, end: countOrRange}, factoryFn);
  }
  else {
    return Array.from({length: countOrRange.end - countOrRange.start}, (_, index) => factoryFn(index + countOrRange.start));
  }
}

function deleteFromSet<T>(set: Set<T>, element: T): Set<T> {
  const copy = new Set<T>(set);
  copy.delete(element);
  return copy;
}
