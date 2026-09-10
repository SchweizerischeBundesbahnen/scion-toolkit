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
import {table as sciTable} from './table';
import {Component, computed, EnvironmentProviders, input, inputBinding, signal, TemplateRef, viewChild, WritableSignal} from '@angular/core';
import {TablePO} from './table.po';
import {TableSelectionService} from './table-selection.service';
import {BehaviorSubject, map, NEVER, Observable, Subject, take, tap} from 'rxjs';
import {provideTableStorage} from './table-storage';
import {attributeBinding, classBinding, partBinding, provideTableRowBinding} from './table-row-binding';
import {SciTableRequest, SciTableResponse} from './table-data-source';
import {createSciTableComponent} from './testing/testing.util';

fdescribe('Table', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNullTableStorage(),
        provideTableRowBinding([
          // Add row index attribute to locate rows by dataset index.
          attributeBinding((_item, index) => ({'data-row-index': index})),
        ]),
      ],
    });
  });

  describe('Miscellaneous', () => {

    /**
     * Tests that the application becomes stable if using <sci-table>, i.e., that resources used by the table finish loading.
     */
    it('should become stable', async () => {
      const data = signal([1, 2, 3]);

      const {fixture} = createSciTableComponent(() => sciTable(data, table => table.addNumberColumn(item => item)));
      await expectAsync(fixture.whenStable()).toBeResolved();
    });
  });

  describe('Array Data Source', () => {

    it('should update table on data change', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const {fixture} = createSciTableComponent(() => sciTable(data, table => table.addNumberColumn(item => item.id)));
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

      const {fixture} = createSciTableComponent(() => sciTable(data, table => {
        for (const column of columns()) {
          table.addStringColumn(column, item => item[column as 'id' | 'name'].toString());
        }
      }));
      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(table.columns).toHaveSize(1);

      columns.update(c => c.concat(['name']));
      await table.waitUntilStable();
      expect(table.columns).toHaveSize(2);
    });

    describe('Columns', () => {

      describe('Component Column', () => {

        it('should render custom component column', async () => {
          const data = signal(['1', '2', '3']);
          const {fixture} = createSciTableComponent(() => sciTable(data, table => table
            .addComponentColumn({
              name: 'column:component',
              component: item => ({
                component: CustomColumnComponent,
                bindings: [inputBinding('value', () => item)],
              }),
            })),
          );

          const table = new TablePO(fixture);
          await table.waitUntilStable();
          expect(await table.column({name: 'column:component'})!.values()).toEqual(['1', '2', '3']);
        });
      });

      describe('Template Column', () => {

        it('should render custom template column', async () => {
          const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

          const data = signal([1, 2, 3]);
          const {fixture} = createSciTableComponent(() => sciTable(data, table => table
            .addTemplateColumn({
              name: 'column:template',
              // TODO [egob] Wollen wir hier eine Convenience anbieten?
              template: () => ({template}),
            })),
          );

          const table = new TablePO(fixture);
          await table.waitUntilStable();
          expect(await table.column({name: 'column:template'})?.values()).toEqual(['1', '2', '3']);
        });

        it('should pass context to template', async () => {
          const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

          const data = signal([1, 2, 3]);
          const {fixture} = createSciTableComponent(() => sciTable(data, table => table
            .addTemplateColumn({
              name: 'column:template',
              template: item => ({
                template: template,
                context: {context: `[context="${item}"]`},
              }),
            })),
          );

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
          const {fixture} = createSciTableComponent(() => sciTable(data, table => table
            .addTemplateColumn({
              name: 'column:template',
              template: item => ({
                template: template,
                context: {
                  context: computed(() => `[context="${context()}", item="${item}"]`),
                },
              }),
            })),
          );

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
          const {fixture} = createSciTableComponent(() => sciTable(data, table => table
            .addTemplateColumn({
              name: 'column:template',
              template: () => ({
                template: template,
                context: {
                  context: undefined,
                },
              }),
            })),
          );

          const table = new TablePO(fixture);
          await table.waitUntilStable();
          expect(await table.column({name: 'column:template'})!.values()).toEqual(['1', '2', '3']);
        });
      });
    });

    describe('Sorting', () => {

      it('should sort number column', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const {fixture, model} = createSciTableComponent(() => sciTable(data, table => table.addNumberColumn({
          name: 'column:id',
          label: 'ID',
          value: item => item.id,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.sort('column:id', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:id'})!.values()).toEqual(['1', '2', '3']);

        model.sort('column:id', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:id'})!.values()).toEqual(['3', '2', '1']);
      });

      it('should sort string column', async () => {
        const data = signal([{name: 'b'}, {name: 'c'}, {name: 'a'}]);

        const {fixture, model} = createSciTableComponent(() => sciTable(data, table => table.addStringColumn({
          name: 'column:name',
          label: 'Name',
          value: item => item.name,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.sort('column:name', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['a', 'b', 'c']);

        model.sort('column:name', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['c', 'b', 'a']);
      });

      it('should sort boolean column', async () => {
        const data = signal([{active: true}, {active: false}, {active: true}]);
        const {fixture, model} = createSciTableComponent(() => sciTable(data, table => table.addBooleanColumn({
          name: 'column:active',
          label: 'Active',
          value: item => item.active,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.sort('column:active', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:active'})!.values()).toEqual(['clear', 'checkmark', 'checkmark']);

        model.sort('column:active', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:active'})!.values()).toEqual(['checkmark', 'checkmark', 'clear']);
      });

      it('should sort custom template column', async () => {
        const templateFixture = TestBed.createComponent(CustomColumnTemplateProviderComponent);

        const data = signal([1, 2, 3]);
        const {fixture, model} = createSciTableComponent(() => sciTable(data, table => table
          .addTemplateColumn({
            name: 'column:template',
            // TODO [egob] Wollen wir hier eine Convenience anbieten?
            template: () => ({
              template: templateFixture.componentInstance.template(),
            }),
            sortable: {comparator: (a, b) => a.item - b.item},
          })),
        );

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:template'})!.values()).toEqual(['1', '2', '3']);

        model.sort('column:template', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:template'})!.values()).toEqual(['1', '2', '3']);

        model.sort('column:template', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:template'})!.values()).toEqual(['3', '2', '1']);
      });

      // TODO [egob] Add test: 'should sort custom component column'

      it('should sort with header click', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const {fixture} = createSciTableComponent(() => sciTable(data, table => table.addNumberColumn('ID', item => item.id)));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({label: 'ID'})!;

        await column.toggleSort();
        expect(await table.column({label: 'ID'})!.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await table.column({label: 'ID'})!.values()).toEqual(['3', '2', '1']);
      });
    });

    describe('Filtering', () => {

      it('should allow global filtering', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const {fixture, model} = createSciTableComponent(() => sciTable(data, table => table.addStringColumn({
          name: 'column:name',
          label: 'Name',
          value: item => item.name,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('alpha');
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['alpha']);

        model.filter('a');
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['alpha', 'beta', 'gamma']);

        model.filter('m');
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['gamma']);

        model.filter(null);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should filter number column', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const {fixture} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addNumberColumn({
          name: 'column:id',
          label: 'ID',
          value: item => item.id,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:id'})!;

        await column.filter('3');
        expect(await column.values()).toEqual(['3']);

        await column.filter('');
        expect(await column.values()).toEqual(['1', '3', '2']);
      });

      // TODO [egob] Add test: 'should filter custom template column'
      // TODO [egob] Add test: 'should filter custom component column'

      it('should filter string column', async () => {
        const data = signal([{name: 'a'}, {name: 'c'}, {name: 'b'}]);
        const {fixture} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addStringColumn({
          name: 'column:name',
          label: 'Name',
          value: item => item.name,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:name'})!;

        await column.filter('c');
        expect(await column.values()).toEqual(['c']);

        await column.filter('');
        expect(await column.values()).toEqual(['a', 'c', 'b']);
      });

      it('should filter boolean column', async () => {
        const data = signal([{active: true}, {active: false}, {active: true}]);
        const {fixture} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addBooleanColumn({
          name: 'column:active',
          label: 'Active',
          value: item => item.active,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:active'})!;

        await column.filter('true');
        expect(await column.values()).toEqual(['checkmark', 'checkmark']);

        await column.filter('');
        expect(await column.values()).toEqual(['checkmark', 'clear', 'checkmark']);
      });

      it('should support filter with custom filter function', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const {fixture} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addStringColumn({
          name: 'column:name',
          label: 'Name',
          value: item => item.name,
          filterable: {matcher: (text, context) => context.value.length === text.length},
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:name'})!;

        await column.filter('abcd');
        expect(await column.values()).toEqual(['beta']);

        await column.filter('');
        expect(await column.values()).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should support global filter with custom filter function', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const {fixture, model} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addStringColumn({
          name: 'column:name',
          label: 'Name',
          value: item => item.name,
          filterable: {matcher: (text, context) => context.value.length === text.length},
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        // TODO [egob] Do not set filter vial model, but via column; see 'should filter number with filter field'
        model.filter('abcd');
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['beta']);

        model.filter(null);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should filter number with filter field', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const {fixture} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addNumberColumn({
          name: 'column:id',
          label: 'ID',
          value: item => item.id,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({label: 'ID'})!;

        await column.filter('3');
        expect(await table.column({name: 'column:id'})!.values()).toEqual(['3']);
      });

      it('should ignore invalid number input in filter field', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const {fixture} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addNumberColumn({
          name: 'column:id',
          label: 'ID',
          value: item => item.id,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({label: 'ID'})!;

        await column.filter('invalid');
        expect(await table.column({name: 'column:id'})!.values()).toEqual(['1', '3', '2']);
      });

      it('should trim filter field input', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const {fixture} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addStringColumn({
          name: 'column:name',
          label: 'Name',
          value: item => item.name,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({label: 'Name'})!;

        await column.filter(' beta ');
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['beta']);
      });

      it('should filter string column case-insensitively', async () => {
        const data = signal([{name: 'Alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const {fixture} = createSciTableComponent(() => sciTable({
          data,
          filterable: true,
        }, table => table.addStringColumn({
          name: 'column:name',
          label: 'Name',
          value: item => item.name,
        })));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({label: 'Name'})!;

        await column.filter('ALPHA');
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['Alpha']);
      });
    });
  });

  describe('Row Actions', () => {

    it('should trigger primary action on dbl click', async () => {
      const onPrimaryAction = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const {fixture} = createSciTableComponent(() => sciTable(data, table => table.addNumberColumn(item => item.id)));
      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.row({nth: 1}).dblClick();

      expect(onPrimaryAction).toHaveBeenCalledWith({id: 2});
    });

    it('should trigger primary action on enter', async () => {
      const onPrimaryAction = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const {fixture} = createSciTableComponent(() => sciTable(data, table => table.addNumberColumn(item => item.id)));

      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.row({nth: 1}).enter();

      expect(onPrimaryAction).toHaveBeenCalledWith({id: 2});
    });

    it('should show actions', async () => {
      const onSelect = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const {fixture} = createSciTableComponent(() => sciTable({
        data,
        rowActions: (item, toolbar) => {
          toolbar.addToolbarButton({
            icon: 'delete',
            cssClass: 'testee',
            onSelect: () => {
              onSelect(item);
            },
          });
        },
      }, table => table.addNumberColumn(item => item.id)));

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.row({nth: 1}).hover();
      await table.waitUntilStable();
      table.row({nth: 1}).rowAction({cssClass: 'testee'}).click();
      await table.waitUntilStable();

      expect(onSelect).toHaveBeenCalledOnceWith({id: 2});
    });
  });

  describe('Resize', () => {

    it('should pack column', async () => {
      const data = signal([{id: 1, name: 'test-1'}, {id: 2, name: 'test-2'}, {id: 3, name: 'test-2'}]);
      const {fixture} = createSciTableComponent(() => sciTable(data, table => table
        .addNumberColumn(item => item.id)
        .addStringColumn(item => item.name),
      ), {width: '400px'});

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
      const {fixture} = createSciTableComponent(() => sciTable(data, table => table
        .addNumberColumn(item => item.id)
        .addStringColumn(item => item.name),
      ), {name: 'table:testee', width: '400px'});

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
      const {fixture} = createSciTableComponent(() => sciTable(data, table => table
        .addNumberColumn(item => item.id)
        .addStringColumn(item => item.name),
      ), {name: 'table:testee', width: '400px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.columns[0]!.width).toBe(100);
      expect(table.columns[1]!.width).toBe(300);
    });
  });

  describe('Custom Data Source', () => {

    it('should cache pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture} = createSciTableComponent(() => sciTable<number>({
        data: loader,
        pageSize: 5,
        bufferSize: 0,
        showHeader: false,
      }, table => table.addNumberColumn(item => item)), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 10}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 0, end: 5, page: 0, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 5, end: 10, page: 1, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(2);
      loader.calls.reset();

      // Scroll down to row 20
      await table.scrollY({y: 20 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 20, end: 30}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 20, end: 25, page: 4, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 25, end: 30, page: 5, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(2);
      loader.calls.reset();

      // Scroll up to row 0
      await table.scrollY({y: 0});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 10}, i => `${i}`));

      // Expect page not to be loaded again.
      expect(loader).not.toHaveBeenCalled();
    });

    it('should load pages based on pageSize [pageSize=5]', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture} = createSciTableComponent(() => sciTable<number>({
        bufferSize: 3,
        pageSize: 5,
        data: loader,
        showHeader: false,
      }, table => table.addNumberColumn(item => item)), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Buffer before:    []
      // Rows in Viewport: [0,..,9]
      // Buffer after:     [10,11,12]
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 13}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 0, end: 5, page: 0, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 5, end: 10, page: 1, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 10, end: 15, page: 2, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(3);
      loader.calls.reset();

      // Scroll down to row 4
      // Buffer before:    [1,2,3]
      // Rows in Viewport: [4,..,13]
      // Buffer after:     [14,15,16]
      await table.scrollY({y: 4 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 17}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 15, end: 20, page: 3, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      // Scroll down to row 40
      // Buffer before:    [37,38,39]
      // Rows in Viewport: [40,..,49]
      // Buffer after:     [50,51,52]
      await table.scrollY({y: 40 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 37, end: 53}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 35, end: 40, page: 7, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 40, end: 45, page: 8, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 45, end: 50, page: 9, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 50, end: 55, page: 10, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(4);
    });

    it('should load pages based on pageSize [pageSize=50]', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture} = createSciTableComponent(() => sciTable<number>({
        bufferSize: 3,
        pageSize: 50,
        data: loader,
        showHeader: false,
      }, table => table.addNumberColumn(item => item)), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Buffer before:    []
      // Rows in Viewport: [0,..,9]
      // Buffer after:     [10,11,12]
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 13}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 0, end: 50, page: 0, pageSize: 50}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      // Scroll down to row 4
      // Buffer before:    [1,2,3]
      // Rows in Viewport: [4,..,13]
      // Buffer after:     [14,15,16]
      await table.scrollY({y: 4 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 17}, i => `${i}`));
      expect(loader).not.toHaveBeenCalled();
      loader.calls.reset();

      // Scroll down to row 40
      // Buffer before:    [37,38,39]
      // Rows in Viewport: [40,..,49]
      // Buffer after:     [50,51,52]
      await table.scrollY({y: 40 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 37, end: 53}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 50, end: 100, page: 1, pageSize: 50}));
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should allow global filtering', async () => {
      const data = generateData(100, i => i);
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => {
        const filtered = data.filter(item => !request.tableFilter || `${item}` === request.tableFilter);
        return {
          items: filtered.slice(request.start, request.end),
          totalCount: filtered.length,
        };
      });

      const {fixture, model} = createSciTableComponent(() => sciTable<number>({data: loader}, table => table
        .addNumberColumn({
          name: 'column:1',
          value: item => item,
        })), {
        height: '500px',
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).cells[0]!.value).toEqual('0');

      loader.calls.reset();
      model.filter('50');
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTableRequest>({
        tableFilter: '50',
        columnFilters: [],
      }));
      expect(await table.column({name: 'column:1'})!.values()).toEqual(['50']);
    });

    it('should filter', async () => {
      const data = generateData(100, i => ({id: `ID: ${i}`, name: `Name: ${i}`}));
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<{id: string; name: string}> => {
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
        return {
          items: filtered.slice(request.start, request.end),
          totalCount: filtered.length,
        };
      });

      const {fixture, model} = createSciTableComponent<{id: string; name: string}>(() => sciTable({
        data: loader,
        bufferSize: 0,
        pageSize: 20,
      }, table => table
        .addStringColumn({
          name: 'column:id',
          value: item => item.id,
        })
        .addStringColumn({
          name: 'column:name',
          value: item => item.name,
        })), {
        height: '500px',
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));
      loader.calls.reset();

      // Filter by 'column:id'.
      model.filter('ID: 5', {columnName: 'column:id'});
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        columnFilters: [
          {columnName: 'column:id', text: 'ID: 5'},
        ],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 5']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 5']);
      loader.calls.reset();

      // Clear column filter.
      model.filter(null, {columnName: 'column:id'});
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 0, end: 20, page: 0, pageSize: 20, columnFilters: []}));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));
      loader.calls.reset();

      // Filter by 'column:name'.
      model.filter('Name: 10', {columnName: 'column:name'});
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        columnFilters: [
          {columnName: 'column:name', text: 'Name: 10'},
        ],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 10']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 10']);
      loader.calls.reset();

      // Filter by 'column:id' (no match).
      model.filter('ID: 11', {columnName: 'column:id'});
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        columnFilters: [
          {columnName: 'column:name', text: 'Name: 10'},
          {columnName: 'column:id', text: 'ID: 11'},
        ],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:id'})!.values()).toEqual([]);
      expect(await table.column({name: 'column:name'})!.values()).toEqual([]);
      loader.calls.reset();

      // Filter by 'column:id' (match).
      model.filter('ID: 10', {columnName: 'column:id'});
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        columnFilters: [
          {columnName: 'column:name', text: 'Name: 10'},
          {columnName: 'column:id', text: 'ID: 10'},
        ],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 10']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 10']);
    });

    it('should scroll to top on filter', async () => {
      const data = generateData(100, i => ({id: `ID: ${i}`, name: `Name: ${i}`}));
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<{id: string; name: string}> => {
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
        return {
          items: filtered.slice(request.start, request.end),
          totalCount: filtered.length,
        };
      });

      const {fixture, model} = createSciTableComponent<{id: string; name: string}>(() => sciTable({
        data: loader,
        bufferSize: 0,
        pageSize: 20,
      }, table => table
        .addStringColumn({
          name: 'column:id',
          value: item => item.id,
        })
        .addStringColumn({
          name: 'column:name',
          value: item => item.name,
        })), {
        height: '500px',
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      await table.scrollY({deltaY: 300});
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 20, end: 40, page: 1, pageSize: 20}));
      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));
      loader.calls.reset();

      // Filter by 'column:id'.
      model.filter('ID: 5', {columnName: 'column:id'});
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        columnFilters: [
          {columnName: 'column:id', text: 'ID: 5'},
        ],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 5']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 5']);
      expect(table.scrollTop).toBe(0);
      loader.calls.reset();
    });

    it('should sort', async () => {
      const data = generateData(100, i => i);
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => {
        const sortCriterion = request.sortCriteria.find(criterion => criterion.columnName === 'column:1');
        const sorted = sortCriterion?.direction === 'asc' ? [...data] : [...data].reverse();
        return {
          items: sorted.slice(request.start, request.end),
          totalCount: sorted.length,
        };
      });

      const {fixture} = createSciTableComponent<number>(() => sciTable({
        data: loader,
        bufferSize: 0,
        pageSize: 20,
      }, table => table.addNumberColumn({
        name: 'column:1',
        value: item => item,
      })), {
        height: '500px',
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      loader.calls.reset();

      // Sort 'column:1' in ascending order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        sortCriteria: [{columnName: 'column:1', direction: 'asc'}],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`));
      loader.calls.reset();

      // Sort 'column:1' in descening order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        sortCriteria: [{columnName: 'column:1', direction: 'desc'}],
      }));
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`).reverse());
      loader.calls.reset();

      // Reset sort for 'column:1'.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 0, end: 20, page: 0, pageSize: 20}));
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should scroll to top on sort', async () => {
      const data = generateData(100, i => i);
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => {
        const sortCriterion = request.sortCriteria.find(criterion => criterion.columnName === 'column:1');
        const sorted = sortCriterion?.direction === 'asc' ? [...data] : [...data].reverse();
        return {
          items: sorted.slice(request.start, request.end),
          totalCount: sorted.length,
        };
      });

      const {fixture} = createSciTableComponent<number>(() => sciTable({
        data: loader,
        bufferSize: 0,
        pageSize: 20,
      }, table => table.addNumberColumn({
        name: 'column:1',
        value: item => item,
      })), {
        height: '500px',
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      await table.scrollY({deltaY: 300});
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 20, end: 40, page: 1, pageSize: 20}));
      loader.calls.reset();

      // Sort 'column:1' in ascending order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        sortCriteria: [{columnName: 'column:1', direction: 'asc'}],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.scrollTop).toBe(0);
    });

    it('should load data from observable', async () => {
      const data$ = new BehaviorSubject<string[]>([]);
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): Observable<SciTableResponse<string>> => data$
        .pipe(map(data => ({
          items: data.slice(request.start, request.end),
          totalCount: data.length,
        }))),
      );

      const {fixture} = createSciTableComponent(() => sciTable<string>({data: loader}, table => table
        .addStringColumn({
          name: 'column:1',
          value: item => item,
        })), {
        height: '300px',
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Trigger initial load.
      data$.next(generateData(20, i => `${i} (initial)`));
      await table.waitUntilStable();
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(20, i => `${i} (initial)`));
      expect(loader).toHaveBeenCalledTimes(1);

      // Trigger update.
      data$.next(generateData(20, i => `${i} (updated)`));
      await table.waitUntilStable();
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(20, i => `${i} (updated)`));

      // Expect loader not to be called again.
      expect(loader).toHaveBeenCalledTimes(1);
    });

    // TODO [egob] add test that previous call is canceled

    it('should cancel load', async () => {
      const loaded = new Array<SciTableRequest>();
      const onLoad$ = new Subject<void>();
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): Observable<SciTableResponse<number>> => onLoad$
        .pipe(
          take(1), // TODO [egob] Remove when previous fetch is canceled.
          map(() => ({
            totalCount: 100,
            items: generateData(request.pageSize, i => request.start + i),
          })),
          tap(() => loaded.push(request)),
        ));

      const {fixture} = createSciTableComponent(() => sciTable<number>({
        pageSize: 10,
        bufferSize: 0,
        data: loader,
        showHeader: false,
      }, table => table.addNumberColumn(item => item)), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Continue initial loader response (so scrolling is possible).
      onLoad$.next();
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({page: 0}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      // Scroll one page.
      await table.scrollY({deltaY: 300});
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({page: 1}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      // Scroll again before loader response.
      await table.scrollY({deltaY: 300});
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({page: 2}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      onLoad$.next();
      await table.waitUntilStable();

      // Expect to only have loaded the initial page and the last.
      expect(loaded).toEqual([
        jasmine.objectContaining<SciTableRequest>({page: 0}),
        jasmine.objectContaining<SciTableRequest>({page: 2}),
      ]);
    });

    // TODO [marc] Fix test
    xit('should allow selection over multiple pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture, model} = createSciTableComponent(() => sciTable<number>({
        data: loader,
        showHeader: false,
        bufferSize: 0,
      }, table => table.addNumberColumn(item => item)), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
      await selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

      await table.scrollY({deltaY: 3000});
      expect(table.row({nth: 0}).cells[0]!.value).toEqual('100'); // 3000px = 100 rows

      await selectionService.onRowClick(100, {ctrlKey: false, metaKey: false, shiftKey: true});
      expect(loader).toHaveBeenCalledTimes(11); // page 0-10
      expect(model.selectedItems()).toHaveSize(100);
    });

    it('should load and select all rows on Ctrl+a', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => ({
        totalCount: 100,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture, model} = createSciTableComponent(() => sciTable<number>({data: loader}, table => table
        .addNumberColumn(item => item),
      ), {height: '500px'});

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      table.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', ctrlKey: true}));
      await table.waitUntilStable();

      expect(model.selectedItems()).toEqual(generateData(100, i => i));
    });

    it('should display rows in range [bufferSize=0]', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => {
        return ({
          totalCount: 11,
          items: generateData(request.pageSize, i => request.start + i),
        });
      });

      const {fixture} = createSciTableComponent(() => sciTable<number>({
        data: loader,
        bufferSize: 0,
        pageSize: 50,
        filterable: true,
      }, table => table.addNumberColumn(item => item)), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 0, end: 50, page: 0, pageSize: 50}));
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 8}, i => `${i}`));
      loader.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(loader).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 9}, i => `${i}`));
      loader.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(loader).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 2, end: 10}, i => `${i}`));
      loader.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(loader).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 3, end: 11}, i => `${i}`));
      loader.calls.reset();

      // Scroll one row down (beyond end)
      await table.scrollY({deltaY: 30});
      expect(loader).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 3, end: 11}, i => `${i}`));
    });

    it('should display rows in range [bufferSize=1]', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest): SciTableResponse<number> => {
        return ({
          totalCount: 11,
          items: generateData(request.pageSize, i => request.start + i),
        });
      });

      const {fixture} = createSciTableComponent(() => sciTable<number>({
        data: loader,
        bufferSize: 1,
        pageSize: 50,
        filterable: true,
      }, table => table.addNumberColumn(item => item)), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTableRequest>({start: 0, end: 50, page: 0, pageSize: 50}));
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 9}, i => `${i}`));
      loader.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(loader).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 10}, i => `${i}`));
      loader.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(loader).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 11}, i => `${i}`));
      loader.calls.reset();

      // Scroll one row down.
      await table.scrollY({deltaY: 30});
      expect(loader).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 2, end: 11}, i => `${i}`));
      loader.calls.reset();

      // Scroll one row down (beyond end)
      await table.scrollY({deltaY: 30});
      expect(loader).not.toHaveBeenCalled();
      expect(await table.column({index: 0})!.values({rows: 'dom'})).toEqual(generateData({start: 2, end: 11}, i => `${i}`));
    });

    it('should display single page with skeletons until total count is available', async () => {
      const loader = jasmine.createSpy().and.callFake((): Observable<SciTableResponse<number>> => NEVER);

      const {fixture} = createSciTableComponent(() => sciTable<number>({
        data: loader,
        showHeader: false,
      }, table => table.addNumberColumn(item => item)), {
        height: '300px',
        designTokens: {'--sci-table-row-height': '30px'},
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Expect 10 rows displaying a skeleton.
      expect(table.rows.length).toEqual(10);
      expect(table.row({nth: 0}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 2}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 3}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 4}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 5}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 6}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 7}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 8}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 9}).cells[0]!.isLoading()).toBeTrue();
      expect(table.row({nth: 9}).cells[0]!.isLoading()).toBeTrue();

      // Expect no vertical overflow.
      expect(table.viewport.scrollHeight).toEqual(table.viewport.clientHeight);
    });
  });

  describe('Row Bindings', () => {

    it('should pass index to row binding function', async () => {
      const data = signal(generateData(100, i => `Row ${i}`));

      const {fixture} = createSciTableComponent(() => sciTable({
        data,
        filterable: true,
        rowBindings: [
          attributeBinding((_item, index) => ({'data-spec-index': index})),
          partBinding((_item, index) => `row:spec-index-${index}`),
          classBinding((_item, index) => `spec-index-${index}`),
        ],
      }, table => table.addStringColumn(item => item)), {
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

      const {fixture} = createSciTableComponent<{id: number}>(() => sciTable({
        data,
        rowBindings: [
          attributeBinding(item => ({'data-spec-id': item.id})),
        ],
      }, table => table.addNumberColumn(item => item.id)));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element.getAttribute('data-spec-id')).toEqual('1');
      expect(table.row({nth: 1}).element.getAttribute('data-spec-id')).toEqual('2');
      expect(table.row({nth: 2}).element.getAttribute('data-spec-id')).toEqual('3');
    });

    it('should bind reactive attribute to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const attributes = new Map<number, WritableSignal<{[name: string]: string | undefined}>>([
        [1, signal({})],
        [2, signal({'data-spec-attribute': 'a'})],
        [3, signal({})],
      ]);

      const {fixture} = createSciTableComponent<{id: number}>(() => sciTable({
        data,
        rowBindings: [
          attributeBinding(item => attributes.get(item.id)),
        ],
      }, table => table.addNumberColumn(item => item.id)));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element.getAttribute('data-spec-attribute')).toBeNull();
      expect(table.row({nth: 1}).element.getAttribute('data-spec-attribute')).toEqual('a');
      expect(table.row({nth: 2}).element.getAttribute('data-spec-attribute')).toBeNull();

      // Update attribute of row 2.
      attributes.get(2)!.set({'data-spec-attribute': 'b'});
      await table.waitUntilStable();

      expect(table.row({nth: 0}).element.getAttribute('data-spec-attribute')).toBeNull();
      expect(table.row({nth: 1}).element.getAttribute('data-spec-attribute')).toEqual('b');
      expect(table.row({nth: 2}).element.getAttribute('data-spec-attribute')).toBeNull();
    });

    it('should bind CSS class to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const {fixture} = createSciTableComponent<{id: number}>(() => sciTable({
        data,
        rowBindings: [
          classBinding(item => `spec-${item.id}`),
        ],
      }, table => table.addNumberColumn(item => item.id)));

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

      const {fixture} = createSciTableComponent<{id: number}>(() => sciTable({
        data,
        rowBindings: [
          classBinding(item => cssClasses.get(item.id)),
        ],
      }, table => table.addNumberColumn(item => item.id)));

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

      const {fixture} = createSciTableComponent<{id: number}>(() => sciTable({
        data,
        rowBindings: [
          partBinding(item => `row:${item.id}`),
        ],
      }, table => table.addNumberColumn(item => item.id)));

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

      const {fixture} = createSciTableComponent<{id: number}>(() => sciTable({
        data,
        rowBindings: [
          partBinding(item => partAttributes.get(item.id)),
        ],
      }, table => table.addNumberColumn(item => item.id)));

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
});

@Component({
  selector: 'spec-custom-column',
  template: `{{value()}}`,
})
class CustomColumnComponent {
  public readonly value = input.required<number>();
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
