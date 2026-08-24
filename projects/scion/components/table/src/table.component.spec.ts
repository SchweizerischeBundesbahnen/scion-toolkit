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
import {Component, computed, EnvironmentProviders, Injector, input, inputBinding, Signal, signal, TemplateRef, viewChild} from '@angular/core';
import {TablePO} from './table.po';
import {rangeInclusive} from './common';
import {ɵSciTable} from './ɵtable.model';
import {TableSelectionService} from './table-selection.service';
import {map, Subject, take, tap} from 'rxjs';
import {provideTableStorage} from './table-storage';
import {SciTableDescriptor} from './table.model';
import {SciTableFactory} from './table.factory';
import {SciDataLoaderFn, SciTableRequest, SciTableResponse} from './table-data-source';

fdescribe('Table', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideNullTableStorage(),
      ],
    });
  });

  describe('Array Data Source', () => {

    it('should update table on data change', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const model = createTable(data, table => table.addNumberColumn(i => i.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.rows.length).toEqual(3);

      data.update(d => d.concat({id: 4}));
      await fixture.whenStable();
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
      });
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.columns).toHaveSize(1);

      columns.update(c => c.concat(['name']));
      await fixture.whenStable();
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);
        expect(table.columnEntries('Value')).toEqual(['5']);

        // Update input signal => should update inside component.
        value.set(20);
        await fixture.whenStable();
        expect(table.columnEntries('Value')).toEqual(['10']);
      });

      it('should support custom template cell', async () => {
        const fixture = TestBed.createComponent(TestTemplate);
        await fixture.whenStable();

        const table = new TablePO(fixture);
        expect(table.columnEntries('ID')).toEqual(['1', '2', '3']);
        expect(table.columnEntries('Price')).toEqual(['50', '100', '200']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);

        model.sort('column:id', false);
        await fixture.whenStable();
        expect(table.columnEntries('ID')).toEqual(['1', '2', '3']);

        model.sort('column:id', false);
        await fixture.whenStable();
        expect(table.columnEntries('ID')).toEqual(['3', '2', '1']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);

        model.sort('column:name', false);
        await fixture.whenStable();
        expect(table.columnEntries('Name')).toEqual(['a', 'b', 'c']);

        model.sort('column:name', false);
        await fixture.whenStable();
        expect(table.columnEntries('Name')).toEqual(['c', 'b', 'a']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);

        model.sort('column:active', false);
        await fixture.whenStable();
        expect(table.columnEntries('Active')).toEqual(['clear', 'checkmark', 'checkmark']);

        model.sort('column:active', false);
        await fixture.whenStable();
        expect(table.columnEntries('Active')).toEqual(['checkmark', 'checkmark', 'clear']);
      });

      it('should sort custom template column', async () => {
        const fixture = TestBed.createComponent(TestTemplate);
        await fixture.whenStable();

        const table = new TablePO(fixture);
        expect(table.columnEntries('Price')).toEqual(['50', '100', '200']);

        fixture.componentInstance.table.sort('column:price', false);
        await fixture.whenStable();
        expect(table.columnEntries('Price')).toEqual(['50', '100', '200']);

        fixture.componentInstance.table.sort('column:price', false);
        await fixture.whenStable();
        expect(table.columnEntries('Price')).toEqual(['200', '100', '50']);
      });

      it('should sort with header click', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = createTable(data,
          table => table.addNumberColumn('ID', item => item.id));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);
        const column = table.getColumnByHeader('ID')!;

        await column.toggleSort();
        expect(table.columnEntries('ID')).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(table.columnEntries('ID')).toEqual(['3', '2', '1']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);

        model.filter('alpha');
        await fixture.whenStable();
        expect(table.columnEntries('Name')).toEqual(['alpha']);

        model.filter('a');
        await fixture.whenStable();
        expect(table.columnEntries('Name')).toEqual(['alpha', 'beta', 'gamma']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);

        model.filter(3, {columnName: 'column:id'});
        await fixture.whenStable();
        expect(table.columnEntries('ID')).toEqual(['3']);

        model.filter(null, {columnName: 'column:id'});
        await fixture.whenStable();
        expect(table.columnEntries('ID')).toEqual(['1', '3', '2']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);

        model.filter('c', {columnName: 'column:name'});
        await fixture.whenStable();
        expect(table.columnEntries('Name')).toEqual(['c']);

        model.filter(null, {columnName: 'column:name'});
        await fixture.whenStable();
        expect(table.columnEntries('Name')).toEqual(['a', 'c', 'b']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);

        model.filter(true, {columnName: 'column:active'});
        await fixture.whenStable();
        expect(table.columnEntries('Active')).toEqual(['checkmark', 'checkmark']);

        model.filter(null, {columnName: 'column:active'});
        await fixture.whenStable();
        expect(table.columnEntries('Active')).toEqual(['checkmark', 'clear', 'checkmark']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);

        model.filter('abcd', {columnName: 'column:name'});
        await fixture.whenStable();
        expect(table.columnEntries('Name')).toEqual(['beta']);

        model.filter(null, {columnName: 'column:name'});
        await fixture.whenStable();
        expect(table.columnEntries('Name')).toEqual(['alpha', 'beta', 'gamma']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);
        const column = table.getColumnByHeader('ID')!;

        await column.filter('3');
        expect(table.columnEntries('ID')).toEqual(['3']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);
        const column = table.getColumnByHeader('ID')!;

        await column.filter('invalid');
        expect(table.columnEntries('ID')).toEqual(['1', '3', '2']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);
        const column = table.getColumnByHeader('Name')!;

        await column.filter(' beta ');
        expect(table.columnEntries('Name')).toEqual(['beta']);
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
        });
        await fixture.whenStable();

        const table = new TablePO(fixture);
        const column = table.getColumnByHeader('Name')!;

        await column.filter('ALPHA');
        expect(table.columnEntries('Name')).toEqual(['Alpha']);
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
      });
      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);
      await fixture.whenStable();

      const table = new TablePO(fixture);
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
      });
      fixture.componentInstance.primaryAction.subscribe(onPrimaryAction);
      await fixture.whenStable();

      const table = new TablePO(fixture);
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
      });
      await fixture.whenStable();

      const table = new TablePO(fixture);
      table.rows[1]!.hover();
      await fixture.whenStable();
      table.clickRowAction('testee');
      await fixture.whenStable();

      expect(onSelect).toHaveBeenCalledOnceWith({id: 2});
    });
  });

  describe('Selection', () => {
    describe('Multi Selection', () => {

      it('should set active item and replace selection on row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        void selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);
      });

      it('should toggle selection on control/meta row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        void selectionService.onRowClick(0, {ctrlKey: true, metaKey: false, shiftKey: false});
        expect(model.selectedItems()).toEqual([{id: 1}]);

        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: true, shiftKey: false});
        expect(model.selectedItems()).toEqual([]);
      });

      it('should select range on shift row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}]);
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        void selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});
        void selectionService.onRowClick(4, {ctrlKey: false, metaKey: false, shiftKey: true});

        expect(model.activeItem()).toEqual({id: 5});
        expect(model.selectedItems()).toEqual([{id: 2}, {id: 3}, {id: 4}, {id: 5}]);
      });

      it('should navigate with arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        selectionService.onControlSpace({preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent);
        expect(model.selectedItems()).toEqual([]);

        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        selectionService.onControlSpace({preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent);
        expect(model.selectedItems()).toEqual([]);

        selectionService.onControlSpace({preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent);
        expect(model.selectedItems()).toEqual([{id: 1}]);
      });

      it('should select all rows on control/meta+a', async () => {
        const data = signal(Array.from({length: 200}, (_, id) => ({id})));
        const model = createTable(data, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        void selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([{id: 2}]);
      });

      it('should navigate with arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const event = {preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent;
        await selectionService.onControlA(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(model.selectedItems()).toEqual([]);
      });

      it('should keep selection on control/meta arrow', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable({name: 'table:test', data, selectable: 'single'}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        }, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        (fixture.nativeElement as HTMLElement).style.height = '300px';
        await fixture.whenStable();
        const table = new TablePO(fixture);

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);

        void selectionService.onRowClick(9, {ctrlKey: false, shiftKey: false, metaKey: false});
        await fixture.whenStable();
        expect(table.scrollTop).toBe(0);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        await fixture.whenStable();
        expect(table.scrollTop).toBe(30);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        await fixture.whenStable();
        expect(table.scrollTop).toBe(60);

        void selectionService.onRowClick(15, {ctrlKey: false, shiftKey: false, metaKey: false});
        await fixture.whenStable();
        expect(table.scrollTop).toBe(180);
      });
    });

    describe('Disabled Selection', () => {
      it('should only set active item on row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: false}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        void selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        void selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual([]);
      });

      it('should only set active item on arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = createTable({name: 'table:test', data, selectable: false}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

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
        const model = createTable({name: 'table:test', data, selectable: false}, table => table.addNumberColumn(i => i.id));
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
        const event = {preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent;
        await selectionService.onControlA(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(model.selectedItems()).toEqual([]);
      });
    });
  });

  describe('Resize', () => {
    it('should auto-resize column', async () => {
      const data = signal([{id: 1, name: 'test-1'}, {id: 2, name: 'test-2'}, {id: 3, name: 'test-2'}]);
      const model = createTable(data, table => table
        .addNumberColumn(i => i.id)
        .addStringColumn(i => i.name));
      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.width = '400px';
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.columns[0]?.width).toBe(200);
      expect(table.columns[1]?.width).toBe(200);

      await table.autoResize(model.columns()[1]!);
      expect(table.columns[0]?.width).toBe(200);
      expect(table.columns[1]?.width).toBe(100);

      await table.autoResize(model.columns()[0]!);
      expect(table.columns[0]?.width).toBe(100);
      expect(table.columns[1]?.width).toBe(100);
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
      const model = createTable(data, table => table
        .addNumberColumn(i => i.id)
        .addStringColumn(i => i.name));
      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.width = '400px';
      await fixture.whenStable();

      const table = new TablePO(fixture);
      await table.autoResize(model.columns()[0]!);

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
        .addNumberColumn(i => i.id)
        .addStringColumn(i => i.name));
      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.width = '400px';
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.columns[0]?.width).toBe(100);
      expect(table.columns[1]?.width).toBe(300);
    });
  });

  describe('Custom Data Source', () => {
    it('should cache pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
      }) as SciTableResponse<{id: number}>) as SciDataLoaderFn<{id: number}>;

      const model = createTable({
        name: 'table:test',
        data: loader,
        headerVisible: false,
        filterable: false,
        bufferSize: 0,
        trackBy: item => item.id,
      }, table => table.addNumberColumn(i => i.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      (fixture.nativeElement as HTMLElement).style.setProperty('--sci-table-row-height', '30px');
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.rows.length).toEqual(10); // 300px / 30px per row
      expect(table.rows[0]?.cells[0]?.value).toEqual('0');
      expect(loader).toHaveBeenCalledTimes(1);

      await table.scrollY(600);
      expect(table.rows[0]?.cells[0]?.value).toEqual('20'); // 600px = 20 rows
      expect(loader).toHaveBeenCalledTimes(2);

      await table.scrollY(-600);
      expect(table.rows[0]?.cells[0]?.value).toEqual('0');
      expect(loader).toHaveBeenCalledTimes(2); // Should cache page 0 and not call loader again
    });

    it('should load pages based on bufferSize', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
      }) as SciTableResponse<{id: number}>) as SciDataLoaderFn<{id: number}>;

      const model = createTable<{id: number}>({
        name: 'table:test',
        bufferSize: 3,
        trackBy: item => item.id,
        data: loader,
        headerVisible: false,
        filterable: false,
      }, table => table.addNumberColumn(i => i.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      (fixture.nativeElement as HTMLElement).style.setProperty('--sci-table-row-height', '30px');
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.rows.length).toEqual(16); // (300px / 30px per row) + (2 * 3 rows buffer) = 16 rows in DOM
      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({start: 0, end: 16}));

      await table.scrollY(120); // Scroll 4 rows so viewport is ID 3-13 and overscan is 0-2 and 14-17 => should load page 2 because row 17 is loaded
      expect(loader).toHaveBeenCalledTimes(2);
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({start: 16, end: 32}));
    });

    it('should allow global filtering', async () => {
      const model = createTable<{id: number}>({
        name: 'table:test',
        data: request => ({
          totalCount: request.globalFilter ? 1 : 1_000,
          items: request.globalFilter === 'test' ?
            [{id: 1_000}] :
            rangeInclusive(request.start, request.end - 1).map(id => ({id})),
        }),
      }, table => table.addNumberColumn({
        name: 'column:id',
        header: 'ID',
        value: item => item.id,
      }));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.rows[0]?.cells[0]?.value).toEqual('0');

      model.filter('test');
      await fixture.whenStable();
      expect(table.rows[0]?.cells[0]?.value).toEqual('1000');
    });

    it('should filter', async () => {
      const model = createTable<{id: number}>({
        name: 'table:test',
        trackBy: item => item.id,
        data: request => {
          const filter = request.columnFilters[0];
          return {
            totalCount: filter ? 1 : 1_000,
            items: filter?.columnName === 'column:id' ?
              [{id: +filter.text}] :
              rangeInclusive(request.start, request.end - 1).map(id => ({id})),
          };
        },
      }, table => table.addNumberColumn({
        name: 'column:id',
        header: 'ID',
        value: item => item.id,
      }));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.rows[0]?.cells[0]?.value).toEqual('0');

      model.filter('5', {columnName: 'column:id'});
      await fixture.whenStable();
      expect(table.columnEntries('ID')).toEqual(['5']);
    });

    it('should sort', async () => {
      const model = createTable<{id: number}>({
        name: 'table:test',
        trackBy: item => item.id,
        data: request => {
          const sortCriterion = request.sortCriteria[0];
          const data = rangeInclusive(request.start, 1_000).map(id => ({id}));
          return {
            totalCount: 1_000,
            items: sortCriterion?.columnName === 'column:id' ? data.reverse().slice(request.start, request.end) : data.slice(request.start, request.end),
          };
        },
      }, table => table.addNumberColumn({
        name: 'column:id',
        header: 'ID',
        value: item => item.id,
      }));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      await fixture.whenStable();

      const table = new TablePO(fixture);
      expect(table.rows[0]?.cells[0]?.value).toEqual('0');

      model.sort('column:id', false);
      await fixture.whenStable();
      expect(table.rows[0]?.cells[0]?.value).toEqual('1000');
    });

    it('should load data from observable', async () => {
      const update$ = new Subject<number>();
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => update$.pipe(
        map(update => ({
          totalCount: 1_000,
          items: rangeInclusive(request.start, request.end - 1).map(id => ({id, update})),
        })),
      ));

      const model = createTable<{id: number; update: number}>({
        name: 'table:test',
        bufferSize: 0,
        data: loader,
      }, table => table.addNumberColumn(i => i.id)
        .addNumberColumn(i => i.update));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      await fixture.whenStable();
      const table = new TablePO(fixture);

      update$.next(0); // trigger initial load.
      await fixture.whenStable();
      expect(table.rows[0]?.cells.map(c => c.value)).toEqual(['0', '0']);
      expect(loader).toHaveBeenCalledTimes(1);

      update$.next(1); // send update from loader.
      await fixture.whenStable();
      expect(table.rows[0]?.cells.map(c => c.value)).toEqual(['0', '1']);
      expect(loader).toHaveBeenCalledTimes(1); // should not call the loader again.
    });

    it('should cancel load', async () => {
      const loaded: Array<number> = [];
      const release$ = new Subject<void>();
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => release$.pipe(
        take(1),
        map(() => ({
          totalCount: 1_000,
          items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
        })),
        tap(() => loaded.push(request.page)),
      ));

      const model = createTable<{id: number}>({
        name: 'table:test',
        bufferSize: 0,
        data: loader,
        headerVisible: false,
        filterable: false,
      }, table => table.addNumberColumn(i => i.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      await fixture.whenStable();

      const table = new TablePO(fixture);
      release$.next(); // trigger initial loader response (so scrolling is possible).
      await fixture.whenStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({page: 0}));

      await table.scrollY(300); // scroll one page.
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({page: 1}));

      await table.scrollY(300); // scroll again before loader response.
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({page: 2}));

      release$.next();
      await fixture.whenStable();

      expect(loaded).toEqual([0, 2]); // should only have loaded the initial page and the last.
    });

    it('should allow selection over multiple pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
      }) as SciTableResponse<{id: number}>) as SciDataLoaderFn<{id: number}>;

      const model = createTable({
        name: 'table:test',
        data: loader,
        headerVisible: false,
        filterable: false,
        bufferSize: 0,
        trackBy: item => item.id,
      }, table => table.addNumberColumn(i => i.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      (fixture.nativeElement as HTMLElement).style.setProperty('--sci-table-row-height', '30px');
      await fixture.whenStable();

      const table = new TablePO(fixture);
      const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
      await selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

      await table.scrollY(3000);
      expect(table.rows[0]?.cells[0]?.value).toEqual('100'); // 3000px = 100 rows

      await selectionService.onRowClick(100, {ctrlKey: false, metaKey: false, shiftKey: true});
      expect(loader).toHaveBeenCalledTimes(11); // page 0-10
      expect(model.selectedItems()).toHaveSize(100);
    });

    it('should load and select all rows on Ctrl+a', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
      }) as SciTableResponse<{id: number}>) as SciDataLoaderFn<{id: number}>;

      const model = createTable({
        name: 'table:test',
        data: loader,
        bufferSize: 0,
        trackBy: item => item.id,
      }, table => table.addNumberColumn(i => i.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '300px';
      await fixture.whenStable();

      const selectionService = fixture.componentRef.injector.get(TableSelectionService<number>);
      await selectionService.onControlA({preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent);

      expect(loader).toHaveBeenCalledTimes(100);
      expect(model.selectedItems()).toHaveSize(1_000);
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
