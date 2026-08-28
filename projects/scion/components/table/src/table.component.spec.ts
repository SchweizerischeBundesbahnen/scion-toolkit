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
import {table} from './table';
import {SciTableComponent} from './table.component';
import {Component, computed, EnvironmentProviders, Injector, input, inputBinding, Signal, signal, TemplateRef, viewChild, WritableSignal} from '@angular/core';
import {TablePO} from './table.po';
import {ɵSciTable} from './ɵtable.model';
import {TableSelectionService} from './table-selection.service';
import {BehaviorSubject, map, Subject, take, tap} from 'rxjs';
import {provideTableStorage} from './table-storage';
import {SciTableDescriptor} from './table.model';
import {SciTableFactory} from './table.factory';
import {SciTableRequest} from './table-data-source';
import {ɵSCI_TABLE_FLAGS, ɵSciTableFlags} from './ɵtable-flags';

fdescribe('Table', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNullTableStorage(),
        // Instruct `SciTableComponent` to add the row index attribute; used by `ColumnPO.values` to identify duplicate rows when collecting data across pages.
        {provide: ɵSCI_TABLE_FLAGS, useFactory: (): ɵSciTableFlags => ({rowIndexAttribute: true})},
      ],
    });
  });

  describe('Array Data Source', () => {

    it('should update table on data change', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const model = createTable(data, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

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
      const model = createTable(data, table => {
        for (const column of columns()) {
          table.addStringColumn(column, item => item[column as 'id' | 'name'].toString());
        }
      });

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      expect(table.columns).toHaveSize(1);

      columns.update(c => c.concat(['name']));
      await table.waitUntilStable();
      expect(table.columns).toHaveSize(2);
    });

    describe('Columns', () => {

      it('should support custom component cell', async () => {
        const value = signal(10);
        const data = signal([{id: 1}]);
        const model = createTable(data, table => table
          .addNumberColumn(item => item.id)
          .addComponentColumn({
            header: 'Value',
            component: () => ({
              component: TestComponent,
              bindings: [inputBinding('value', value)],
            }),
          }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({header: 'Value'})!.values()).toEqual(['5']);

        // Update input signal => should update inside component.
        value.set(20);
        await table.waitUntilStable();
        expect(await table.column({header: 'Value'})!.values()).toEqual(['10']);
      });

      it('should support custom template cell', async () => {
        const fixture = TestBed.createComponent(TestTemplate);

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({header: 'ID'})!.values()).toEqual(['1', '2', '3']);
        expect(await table.column({header: 'Price'})!.values()).toEqual(['50', '100', '200']);
      });
    });

    describe('Sorting', () => {

      it('should sort number column', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = createTable(data, table => table.addNumberColumn({
          name: 'column:id',
          header: 'ID',
          value: item => item.id,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

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
        const model = createTable(data, table => table.addStringColumn({
          name: 'column:name',
          header: 'Name',
          value: item => item.name,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

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
        const model = createTable(data, table => table.addBooleanColumn({
          name: 'column:active',
          header: 'Active',
          value: item => item.active,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

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
        const fixture = TestBed.createComponent(TestTemplate);

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:price'})!.values()).toEqual(['50', '100', '200']);

        fixture.componentInstance.table.sort('column:price', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:price'})!.values()).toEqual(['50', '100', '200']);

        fixture.componentInstance.table.sort('column:price', false);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:price'})!.values()).toEqual(['200', '100', '50']);
      });

      it('should sort with header click', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = createTable(data,
          table => table.addNumberColumn('ID', item => item.id));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({header: 'ID'})!;

        await column.toggleSort();
        expect(await table.column({header: 'ID'})!.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await table.column({header: 'ID'})!.values()).toEqual(['3', '2', '1']);
      });
    });

    describe('Filtering', () => {

      it('should allow global filtering', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const model = createTable(data, table => table.addStringColumn({
          name: 'column:name',
          header: 'Name',
          value: item => item.name,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

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
        const model = createTable(data, table => table.addNumberColumn({
          name: 'column:id',
          header: 'ID',
          value: item => item.id,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter(3, {columnName: 'column:id'});
        await table.waitUntilStable();
        expect(await table.column({name: 'column:id'})!.values()).toEqual(['3']);

        model.filter(null, {columnName: 'column:id'});
        await table.waitUntilStable();
        expect(await table.column({name: 'column:id'})!.values()).toEqual(['1', '3', '2']);
      });

      it('should filter string column', async () => {
        const data = signal([{name: 'a'}, {name: 'c'}, {name: 'b'}]);
        const model = createTable(data, table => table.addStringColumn({
          name: 'column:name',
          header: 'Name',
          value: item => item.name,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('c', {columnName: 'column:name'});
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['c']);

        model.filter(null, {columnName: 'column:name'});
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['a', 'c', 'b']);
      });

      it('should filter boolean column', async () => {
        const data = signal([{active: true}, {active: false}, {active: true}]);
        const model = createTable(data, table => table.addBooleanColumn({
          name: 'column:active',
          header: 'Active',
          value: item => item.active,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter(true, {columnName: 'column:active'});
        await table.waitUntilStable();
        expect(await table.column({name: 'column:active'})!.values()).toEqual(['checkmark', 'checkmark']);

        model.filter(null, {columnName: 'column:active'});
        await table.waitUntilStable();
        expect(await table.column({name: 'column:active'})!.values()).toEqual(['checkmark', 'clear', 'checkmark']);
      });

      it('should support filter with custom filter function', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const model = createTable(data, table => table.addStringColumn({
          name: 'column:name',
          header: 'Name',
          value: item => item.name,
          filterable: {matcher: (text, context) => context.value.length === text.length},
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('abcd', {columnName: 'column:name'});
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['beta']);

        model.filter(null, {columnName: 'column:name'});
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['alpha', 'beta', 'gamma']);
      });

      // TODO [etienne] Fix that global filter uses custom matcher if configured
      xit('should support global filter with custom filter function', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const model = createTable(data, table => table.addStringColumn({
          name: 'column:name',
          header: 'Name',
          value: item => item.name,
          filterable: {matcher: (text, context) => context.value.length === text.length},
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('abcd');
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['beta']);

        model.filter(null);
        await table.waitUntilStable();
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should filter number with filter field', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = createTable(data, table => table.addNumberColumn({
          name: 'column:id',
          header: 'ID',
          value: item => item.id,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({header: 'ID'})!;

        await column.filter('3');
        expect(await table.column({name: 'column:id'})!.values()).toEqual(['3']);
      });

      it('should ignore invalid number input in filter field', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = createTable(data, table => table.addNumberColumn({
          name: 'column:id',
          header: 'ID',
          value: item => item.id,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({header: 'ID'})!;

        await column.filter('invalid');
        expect(await table.column({name: 'column:id'})!.values()).toEqual(['1', '3', '2']);
      });

      it('should trim filter field input', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const model = createTable(data, table => table.addStringColumn({
          name: 'column:name',
          header: 'Name',
          value: item => item.name,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({header: 'Name'})!;

        await column.filter(' beta ');
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['beta']);
      });

      it('should filter string column case-insensitively', async () => {
        const data = signal([{name: 'Alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const model = createTable(data, table => table.addStringColumn({
          name: 'column:name',
          header: 'Name',
          value: item => item.name,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({header: 'Name'})!;

        await column.filter('ALPHA');
        expect(await table.column({name: 'column:name'})!.values()).toEqual(['Alpha']);
      });
    });
  });

  describe('Row Actions', () => {

    it('should trigger primary action on dbl click', async () => {
      const onPrimaryAction = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const model = createTable({
        name: 'table:test',
        data,
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.rows[1]!.dblClick();

      expect(onPrimaryAction).toHaveBeenCalledWith({id: 2});
    });

    it('should trigger primary action on enter', async () => {
      const onPrimaryAction = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const model = createTable({
        name: 'table:test',
        data,
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.rows[1]!.enter();

      expect(onPrimaryAction).toHaveBeenCalledWith({id: 2});
    });

    it('should show actions', async () => {
      const onSelect = jasmine.createSpy();
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const model = createTable({
        name: 'table:test',
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
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();
      table.rows[1]!.hover();
      await table.waitUntilStable();
      table.rows[1]!.rowAction({cssClass: 'testee'}).click();
      await table.waitUntilStable();

      expect(onSelect).toHaveBeenCalledOnceWith({id: 2});
    });
  });

  describe('Selection', () => {

    describe('Multi Selection', () => {

      it('should set active item and replace selection on row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        void selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);
      });

      it('should toggle selection on control/meta row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        void selectionService.onRowClick(0, {ctrlKey: true, metaKey: false, shiftKey: false});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: true, shiftKey: false});
        expect(model.selectedItems()).toEqual([]);
      });

      it('should select range on shift row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}]);
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        void selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});
        void selectionService.onRowClick(4, {ctrlKey: false, metaKey: false, shiftKey: true});

        expect(model.activeItem()).toEqual({id: 5});
        expect(model.selectedItems()).toEqual([{id: 2}, {id: 3}, {id: 4}, {id: 5}]);
      });

      it('should navigate with arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const arrowDownEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;
        const arrowUpEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;

        selectionService.onArrowDown(arrowDownEvent);
        expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowDown(arrowDownEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);

        selectionService.onArrowUp(arrowUpEvent);
        expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([{id: 1}]);
      });

      it('should not extend selection with ctrl + arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const arrowDownEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent;
        const arrowUpEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent;

        await selectionService.onRowClick(0, {shiftKey: false, ctrlKey: false, metaKey: false});
        selectionService.onArrowDown(arrowDownEvent);
        expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowDown(arrowDownEvent);
        expect(model.activeItem()).toEqual({id: 3});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowUp(arrowUpEvent);
        expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 1}]);
      });

      it('should extend selection on shift arrow and keep selection on control/meta arrow', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: true, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 1}, {id: 2}]);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 3});
        expect(model.selectedItems()).toEqual([{id: 1}, {id: 2}]);

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: true} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 1}, {id: 2}]);
      });

      it('should ignore arrow up/down at table boundaries', async () => {
        const data = signal([{id: 1}, {id: 2}]);
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toBeUndefined();

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);
      });

      it('should toggle active row selection on space and ignore when no active row', async () => {
        const data = signal([{id: 1}, {id: 2}]);
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        table.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'space', ctrlKey: true}));
        await table.waitUntilStable();
        expect(model.selectedItems()).toEqual([]);

        table.rows[0]!.element.click();
        await table.waitUntilStable();

        table.body.dispatchEvent(new KeyboardEvent('keydown', {key: ' ', ctrlKey: true}));
        await table.waitUntilStable();
        expect(model.selectedItems()).toEqual([]);

        table.body.dispatchEvent(new KeyboardEvent('keydown', {key: ' ', ctrlKey: true}));
        await table.waitUntilStable();
        expect(model.selectedItems()).toEqual([{id: 1}]);
      });

      it('should select all rows on control/meta+a', async () => {
        const data = signal(Array.from({length: 200}, (_, id) => ({id})));
        const model = createTable(data, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const event = {preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent;
        await selectionService.onControlA(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(model.selectedItems()).toEqual(data());
      });
    });

    describe('Single Selection', () => {

      it('should set active item and replace selection on row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        void selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);
      });

      it('should navigate with arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const arrowDownEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;
        const arrowUpEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;

        selectionService.onArrowDown(arrowDownEvent);
        expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowDown(arrowDownEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);

        selectionService.onArrowUp(arrowUpEvent);
        expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([{id: 1}]);
      });

      it('should not extend selection with ctrl + arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const arrowDownEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent;
        const arrowUpEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent;

        await selectionService.onRowClick(0, {shiftKey: false, ctrlKey: false, metaKey: false});
        selectionService.onArrowDown(arrowDownEvent);
        expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowDown(arrowDownEvent);
        expect(model.activeItem()).toEqual({id: 3});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowUp(arrowUpEvent);
        expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 1}]);
      });

      it('should no select rows on control/meta+a', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const event = {preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent;
        await selectionService.onControlA(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(model.selectedItems()).toEqual([]);
      });

      it('should keep selection on control/meta arrow', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);

        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: true} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 3});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: true} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([{id: 1}]);
      });

      it('should not extend selection on shift arrow', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);

        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: true, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: true, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 3});
        expect(model.selectedItems()).toEqual([{id: 3}]);

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: true, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);
      });

      it('should scroll active row into viewport', async () => {
        const data = signal(new Array(100).fill(0).map((_, i) => ({id: i})));
        const model = createTable({
          name: 'table:test',
          data,
          headerVisible: false,
          filterable: false,
          selectable: 'single',
        }, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });
        (fixture.nativeElement as HTMLElement).style.height = '300px';

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        void selectionService.onRowClick(9, {ctrlKey: false, shiftKey: false, metaKey: false});
        await table.waitUntilStable();
        expect(table.scrollTop).toBe(0);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        await table.waitUntilStable();
        expect(table.scrollTop).toBe(30);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        await table.waitUntilStable();
        expect(table.scrollTop).toBe(60);

        void selectionService.onRowClick(15, {ctrlKey: false, shiftKey: false, metaKey: false});
        await table.waitUntilStable();
        expect(table.scrollTop).toBe(180);
      });
    });

    describe('Disabled Selection', () => {

      it('should only set active item on row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: false}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        void selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([]);
      });

      it('should only set active item on arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: false}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const arrowDownEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;
        const arrowUpEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;

        selectionService.onArrowDown(arrowDownEvent);
        expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([]);

        selectionService.onArrowDown(arrowDownEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([]);

        selectionService.onArrowUp(arrowUpEvent);
        expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual([]);
      });

      it('should no select rows on control/meta+a', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: false}, table => table.addNumberColumn(item => item.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
          inferTagName: true,
        });

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const event = {preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent;
        await selectionService.onControlA(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(model.selectedItems()).toEqual([]);
      });
    });
  });

  describe('Resize', () => {

    it('should pack column', async () => {
      const data = signal([{id: 1, name: 'test-1'}, {id: 2, name: 'test-2'}, {id: 3, name: 'test-2'}]);
      const model = createTable(data, table => table
        .addNumberColumn(item => item.id)
        .addStringColumn(item => item.name));
      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.width = '400px';

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

    // TODO [dwie] fix storage!
    xit('should store column widths to storage', async () => {
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
      const model = createTable(data, table => table
        .addNumberColumn(item => item.id)
        .addStringColumn(item => item.name),
      );
      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.width = '400px';

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      await table.column({index: 0})!.pack();

      expect(storeFn).toHaveBeenCalledWith('scion.components.table:test', '{"columns":[{"name":"column:0","width":100}]}');
    });

    it('should load column widths from storage', async () => {
      TestBed.configureTestingModule({
        providers: [
          provideTableStorage(class {
            public load(key: string): string {
              return key === 'scion.components.table:test' ? JSON.stringify({columns: [{name: 'column:0', width: 100}, {name: 'column:1'}]}) : '';
            }

            public store(): void {
              // noop
            }
          }),
        ],
      });

      const data = signal([{id: 1, name: 'test-1'}, {id: 2, name: 'test-2'}, {id: 3, name: 'test-2'}]);
      const model = createTable(data, table => table
        .addNumberColumn(item => item.id)
        .addStringColumn(item => item.name),
      );
      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.width = '400px';

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.columns[0]!.width).toBe(100);
      expect(table.columns[1]!.width).toBe(300);
    });
  });

  describe('Custom Data Source', () => {

    it('should cache pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const model = createTable<number>({
        name: 'table:test',
        data: loader,
        headerVisible: false,
        filterable: false,
        bufferSize: 0,
      }, table => table.addNumberColumn(item => item));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      (fixture.nativeElement as HTMLElement).style.setProperty('--sci-table-row-height', '30px');

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows.length).toEqual(10); // 300px / 30px per row
      expect(table.rows[0]!.cells[0]!.value).toEqual('0');
      expect(loader).toHaveBeenCalledTimes(1);

      await table.scrollY({deltaY: 600});
      expect(table.rows[0]!.cells[0]!.value).toEqual('20'); // 600px = 20 rows
      expect(loader).toHaveBeenCalledTimes(2);

      await table.scrollY({deltaY: -600});
      expect(table.rows[0]!.cells[0]!.value).toEqual('0');
      expect(loader).toHaveBeenCalledTimes(2); // Should cache page 0 and not call loader again
    });

    it('should load pages based on bufferSize', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const model = createTable<number>({
        name: 'table:test',
        bufferSize: 3,
        data: loader,
        headerVisible: false,
        filterable: false,
      }, table => table.addNumberColumn(item => item));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      (fixture.nativeElement as HTMLElement).style.setProperty('--sci-table-row-height', '30px');

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows.length).toEqual(16); // (300px / 30px per row) + (2 * 3 rows buffer) = 16 rows in DOM
      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({start: 0, end: 16}));

      await table.scrollY({deltaY: 120}); // Scroll 4 rows so viewport is ID 3-13 and overscan is 0-2 and 14-17 => should load page 2 because row 17 is loaded
      expect(loader).toHaveBeenCalledTimes(2);
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({start: 16, end: 32}));
    });

    it('should allow global filtering', async () => {
      const data = generateData(100, i => i);
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => {
        const filtered = data.filter(item => !request.globalFilter || `${item}` === request.globalFilter);
        return {
          items: filtered.slice(request.start, request.end),
          totalCount: filtered.length,
        };
      });

      const model = createTable<number>({
        name: 'table:test',
        data: loader,
      }, table => table.addNumberColumn({
        name: 'column:1',
        value: item => item,
      }));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '500px';

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows[0]!.cells[0]!.value).toEqual('0');

      loader.calls.reset();
      model.filter('50');
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        globalFilter: '50',
        columnFilters: [],
      }));
      expect(await table.column({name: 'column:1'})!.values()).toEqual(['50']);
    });

    it('should filter', async () => {
      const data = generateData(100, i => ({id: `ID: ${i}`, name: `Name: ${i}`}));
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => {
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

      const model = createTable<{id: string; name: string}>({
        name: 'table:test',
        data: loader,
      }, table => table
        .addStringColumn({
          name: 'column:id',
          value: item => item.id,
        })
        .addStringColumn({
          name: 'column:name',
          value: item => item.name,
        }));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '500px';

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));

      // Filter by 'column:id'.
      loader.calls.reset();
      model.filter('ID: 5', {columnName: 'column:id'});
      await table.waitUntilStable();
      // TODO [Etienne] Should only be called once
      // expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      //   columnFilters: [
      //     {columnName: 'column:id', text: 'ID: 5'},
      //   ],
      // }));
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 5']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 5']);
      // Clear column filter.
      loader.calls.reset();
      model.filter(null, {columnName: 'column:id'});
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({columnFilters: []}));
      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));

      // Filter by 'column:name'.
      loader.calls.reset();
      model.filter('Name: 10', {columnName: 'column:name'});
      await table.waitUntilStable();
      // TODO [Etienne] Should only be called once
      // expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      //   columnFilters: [
      //     {columnName: 'column:name', text: 'Name: 10'},
      //   ],
      // }));
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 10']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 10']);

      // Filter by 'column:id' (no match).
      loader.calls.reset();
      model.filter('ID: 11', {columnName: 'column:id'});
      await table.waitUntilStable();
      // TODO [Etienne] Should only be called once
      // expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      //   columnFilters: [
      //     {columnName: 'column:name', text: 'Name: 10'},
      //     {columnName: 'column:id', text: 'ID: 11'},
      //   ],
      // }));
      expect(await table.column({name: 'column:id'})!.values()).toEqual([]);
      expect(await table.column({name: 'column:name'})!.values()).toEqual([]);

      // Filter by 'column:id' (match).
      loader.calls.reset();
      model.filter('ID: 10', {columnName: 'column:id'});
      await table.waitUntilStable();
      // TODO [Etienne] Should only be called once
      // expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      //   columnFilters: [
      //     {columnName: 'column:name', text: 'Name: 10'},
      //     {columnName: 'column:id', text: 'ID: 10'},
      //   ],
      // }));
      expect(await table.column({name: 'column:id'})!.values()).toEqual(['ID: 10']);
      expect(await table.column({name: 'column:name'})!.values()).toEqual(['Name: 10']);
    });

    it('should sort', async () => {
      const data = generateData(100, i => i);
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => {
        const sortCriterion = request.sortCriteria.find(criterion => criterion.columnName === 'column:1');
        const sorted = sortCriterion?.direction === 'asc' ? [...data] : [...data].reverse();
        return {
          items: sorted.slice(request.start, request.end),
          totalCount: sorted.length,
        };
      });

      const model = createTable<number>({
        name: 'table:test',
        data: loader,
      }, table => table.addNumberColumn({
        name: 'column:1',
        value: item => item,
      }));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '500px';

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Sort 'column:1' in ascending order.
      loader.calls.reset();
      model.sort('column:1', false);
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({
        sortCriteria: [{columnName: 'column:1', direction: 'asc'}],
      }));
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`));

      // Sort 'column:1' in descening order.
      loader.calls.reset();
      model.sort('column:1', false);
      await table.waitUntilStable();
      // TODO [Etienne] should only be called once, not for alread loaded pages.
      // expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      //   sortCriteria: [{columnName: 'column:1', direction: 'desc'}],
      // }));
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`).reverse());

      // Sort 'column:1' in ascending order.
      // TODO [Etienne] Why does it not working if sorting again?
      loader.calls.reset();
      model.sort('column:1', false);
      await table.waitUntilStable();
      // TODO [Etienne] should only be called once, not for alread loaded pages.
      // expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      //   sortCriteria: [{columnName: 'column:1', direction: 'desc'}],
      // }));
      // expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`));
    });

    it('should load data from observable', async () => {
      const data$ = new BehaviorSubject<string[]>([]);
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => data$
        .pipe(map(data => ({
          items: data.slice(request.start, request.end),
          totalCount: data.length,
        }))),
      );

      const model = createTable<string>({
        name: 'table:test',
        data: loader,
      }, table => table.addStringColumn({
        name: 'column:1',
        value: item => item,
      }));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';

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

    // TODO [etienne] add test that previous call ised canceled

    it('should cancel load', async () => {
      const loaded = new Array<number>();
      const onLoad$ = new Subject<void>();
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => onLoad$
        .pipe(
          take(1), // TODO [Etienne] Remove when previous fetch is canceled.
          map(() => ({
            totalCount: 100,
            items: generateData(request.pageSize, i => request.start + i),
          })),
          tap(() => loaded.push(request.page)),
        ));

      const model = createTable<number>({
        name: 'table:test',
        bufferSize: 0,
        data: loader,
        headerVisible: false,
        filterable: false,
      }, table => table.addNumberColumn(item => item));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Continue initial loader response (so scrolling is possible).
      onLoad$.next();
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({page: 0}));

      // Scroll one page.
      await table.scrollY({deltaY: 300});
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({page: 1}));

      // Scroll again before loader response.
      await table.scrollY({deltaY: 300});
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({page: 2}));

      onLoad$.next();
      await table.waitUntilStable();

      // Expect to only have loaded the initial page and the last.
      expect(loaded).toEqual([0, 2]);
    });

    // TODO [marc] Fix test
    xit('should allow selection over multiple pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const model = createTable<number>({
        name: 'table:test',
        data: loader,
        headerVisible: false,
        filterable: false,
        bufferSize: 0,
      }, table => table.addNumberColumn(item => item));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      (fixture.nativeElement as HTMLElement).style.setProperty('--sci-table-row-height', '30px');

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
      await selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

      await table.scrollY({deltaY: 3000});
      expect(table.rows[0]!.cells[0]!.value).toEqual('100'); // 3000px = 100 rows

      await selectionService.onRowClick(100, {ctrlKey: false, metaKey: false, shiftKey: true});
      expect(loader).toHaveBeenCalledTimes(11); // page 0-10
      expect(model.selectedItems()).toHaveSize(100);
    });

    it('should load and select all rows on Ctrl+a', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 100,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const model = createTable<number>({
        name: 'table:test',
        data: loader,
      }, table => table.addNumberColumn(item => item));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });
      (fixture.nativeElement as HTMLElement).style.height = '500px';

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      table.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'a', ctrlKey: true}));
      await table.waitUntilStable();

      expect(model.selectedItems()).toEqual(generateData(100, i => i));
    });
  });

  describe('Row Bindings', () => {

    it('should pass index to row binding function', async () => {
      const data = signal(generateData(100, i => `Row ${i}`));
      const model = createTable({
        name: 'table:testee',
        data,
        rowBindings: (_item, index) => {
          return {
            attributes: {
              'data-spec-index': `${index}`,
            },
          };
        },
      }, table => table.addStringColumn(item => item));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      (fixture.nativeElement as HTMLElement).style.height = '300px';
      (fixture.nativeElement as HTMLElement).style.setProperty('--sci-table-row-height', '30px');

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows[0]!.element.getAttribute('data-spec-index')).toEqual('0');
      expect(table.rows[1]!.element.getAttribute('data-spec-index')).toEqual('1');

      // Scroll down to load another page.
      await table.scrollY({y: 50 * 30});

      // Expect index to be in ascending order without gaps.
      const rowIndex = table.rows.findIndex(row => row.cells[0]!.value === 'Row 50');
      expect(table.rows[rowIndex]!.element.getAttribute('data-spec-index')).toEqual('50');
      expect(table.rows[rowIndex + 1]!.element.getAttribute('data-spec-index')).toEqual('51');

      // Filter table.
      await table.column({index: 0})?.filter('1');

      // Expect index to start at 0 in ascending order without gaps.
      expect(table.rows[0]!.element.getAttribute('data-spec-index')).toEqual('0');
      expect(table.rows[1]!.element.getAttribute('data-spec-index')).toEqual('1');
      expect(table.rows[2]!.element.getAttribute('data-spec-index')).toEqual('2');
      expect(table.rows[3]!.element.getAttribute('data-spec-index')).toEqual('3');
    });

    it('should bind attribute to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const model = createTable({
        name: 'table:testee',
        data,
        rowBindings: item => {
          return {
            attributes: {
              'data-spec-id': `${item.id}`,
            },
          };
        },
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows[0]!.element.getAttribute('data-spec-id')).toEqual('1');
      expect(table.rows[1]!.element.getAttribute('data-spec-id')).toEqual('2');
      expect(table.rows[2]!.element.getAttribute('data-spec-id')).toEqual('3');
    });

    it('should bind reactive attribute to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const attributes = new Map<number, WritableSignal<{[name: string]: string | undefined}>>([
        [1, signal({})],
        [2, signal({'data-spec-attribute': 'a'})],
        [3, signal({})],
      ]);

      const model = createTable({
        name: 'table:testee',
        data,
        rowBindings: item => {
          return {
            attributes: attributes.get(item.id),
          };
        },
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows[0]!.element.getAttribute('data-spec-attribute')).toBeNull();
      expect(table.rows[1]!.element.getAttribute('data-spec-attribute')).toEqual('a');
      expect(table.rows[2]!.element.getAttribute('data-spec-attribute')).toBeNull();

      // Update attribute of row 2.
      attributes.get(2)!.set({'data-spec-attribute': 'b'});
      await table.waitUntilStable();

      expect(table.rows[0]!.element.getAttribute('data-spec-attribute')).toBeNull();
      expect(table.rows[1]!.element.getAttribute('data-spec-attribute')).toEqual('b');
      expect(table.rows[2]!.element.getAttribute('data-spec-attribute')).toBeNull();
    });

    it('should bind CSS class to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const model = createTable({
        name: 'table:testee',
        data,
        rowBindings: item => {
          return {
            cssClass: `spec-${item.id}`,
          };
        },
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows[0]!.element).toHaveClass('spec-1');
      expect(table.rows[1]!.element).toHaveClass('spec-2');
      expect(table.rows[2]!.element).toHaveClass('spec-3');
    });

    it('should bind reactive CSS class to row', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const cssClasses = new Map<number, WritableSignal<string | undefined>>([
        [1, signal(undefined)],
        [2, signal('spec-a')],
        [3, signal(undefined)],
      ]);

      const model = createTable({
        name: 'table:testee',
        data,
        rowBindings: item => {
          return {
            cssClass: cssClasses.get(item.id),
          };
        },
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows[0]!.element).not.toHaveClass('spec-a');
      expect(table.rows[1]!.element).toHaveClass('spec-a');
      expect(table.rows[2]!.element).not.toHaveClass('spec-a');

      // Update attribute of row 2.
      cssClasses.get(2)!.set('spec-b');
      await table.waitUntilStable();

      expect(table.rows[0]!.element).not.toHaveClass('spec-b');
      expect(table.rows[1]!.element).toHaveClass('spec-b');
      expect(table.rows[2]!.element).not.toHaveClass('spec-b');
    });

    it('should bind part-attribute to cell', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);

      const model = createTable({
        name: 'table:testee',
        data,
        rowBindings: item => {
          return {
            part: `row:${item.id},`,
          };
        },
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows[0]!.cells[0]!.element.getAttribute('part')).toContain('row:1');
      expect(table.rows[1]!.cells[0]!.element.getAttribute('part')).toContain('row:2');
      expect(table.rows[2]!.cells[0]!.element.getAttribute('part')).toContain('row:3');
    });

    it('should bind reactive part-attribute to cell', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const partAttributes = new Map<number, WritableSignal<`row:${string}` | undefined>>([
        [1, signal(undefined)],
        [2, signal('row:negative')],
        [3, signal(undefined)],
      ]);

      const model = createTable({
        name: 'table:testee',
        data,
        rowBindings: item => {
          return {
            part: partAttributes.get(item.id),
          };
        },
      }, table => table.addNumberColumn(item => item.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
        inferTagName: true,
      });

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.rows[0]!.cells[0]!.element.getAttribute('part')).not.toContain('row:negative');
      expect(table.rows[1]!.cells[0]!.element.getAttribute('part')).toContain('row:negative');
      expect(table.rows[2]!.cells[0]!.element.getAttribute('part')).not.toContain('row:negative');

      // Update part attribute of row 2.
      partAttributes.get(2)!.set('row:positive');
      await table.waitUntilStable();

      expect(table.rows[0]!.cells[0]!.element.getAttribute('part')).not.toContain('row:positive');
      expect(table.rows[1]!.cells[0]!.element.getAttribute('part')).toContain('row:positive');
      expect(table.rows[2]!.cells[0]!.element.getAttribute('part')).not.toContain('row:positive');
    });
  });
});

@Component({
  selector: 'spec-test-cell',
  template: `
    {{half()}}
  `,
})
class TestComponent {
  public readonly value = input.required<number>();
  protected readonly half = computed(() => this.value() / 2);
}

@Component({
  selector: 'spec-test-template',
  imports: [
    SciTableComponent,
  ],
  template: `
    <sci-table [table]="table"></sci-table>
    <ng-template let-product #cell>
      {{product.price / 2}}
    </ng-template>
  `,
})
class TestTemplate {

  private readonly _cellTemplate = viewChild.required<TemplateRef<unknown>>('cell');
  private readonly _data = signal([
    {id: 1, price: 100},
    {id: 2, price: 200},
    {id: 3, price: 400},
  ]);
  public readonly table = createTable(this._data, table => table
    .addNumberColumn({
      name: 'column:id',
      header: 'ID',
      value: item => item.id,
    })
    .addTemplateColumn({
      name: 'column:price',
      header: 'Price',
      sortable: {comparator: (a, b) => a.item.price - b.item.price},
      template: () => ({
        template: this._cellTemplate,
      }),
    }),
  );
}

type TableFactoryFn<T> = (table: SciTableFactory<T>) => void;

function createTable<T>(data: Signal<T[]>, factoryFn: TableFactoryFn<T>): ɵSciTable<T>;
function createTable<T>(descriptor: SciTableDescriptor<T>, factoryFn: TableFactoryFn<T>): ɵSciTable<T>;
function createTable<T>(
  arg1: Signal<T[]> | SciTableDescriptor<T>,
  arg2: TableFactoryFn<T>,
): ɵSciTable<T> {
  const injector = TestBed.inject(Injector);

  if (typeof arg1 === 'object') {
    return table(arg1, arg2, {injector}) as ɵSciTable<T>;
  }

  return table('table:test', arg1, arg2, {injector}) as ɵSciTable<T>;
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
 * Generates an array of `count` items using a factory function.
 */
export function generateData<T>(count: number, factoryFn: (index: number) => T): T[] {
  return Array.from(Array(count), (_, index) => factoryFn(index));
}
