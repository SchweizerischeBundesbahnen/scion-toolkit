import {TestBed} from '@angular/core/testing';
import {table} from './table';
import {SciTableComponent} from './table.component';
import {Component, computed, Injector, input, inputBinding, signal, TemplateRef, viewChild} from '@angular/core';
import {TablePO} from './table.po';
import {SciTableRequest, SciTableResponse} from '@scion/components/table';
import {rangeInclusive} from './common';
import {ɵSciTable} from './ɵtable.model';
import {TableSelectionService} from './table-selection.service';
import {of} from 'rxjs';

describe('Table', () => {

  describe('Array Data Source', () => {

    it('should update table on data change', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.rows.length).toEqual(3);

      data.update(d => d.concat({id: 4}));
      await fixture.whenStable();
      expect(po.rows.length).toEqual(4);
    });

    it('should update table on columns change', async () => {
      const data = signal([{id: 1, name: 'a'}, {id: 2, name: 'b'}, {id: 3, name: 'c'}]);
      const columns = signal(['id']);
      const model = table(data, table => {
        for (const column of columns()) {
          table.addStringColumn(column, item => item[column as 'id' | 'name'].toString());
        }
      }, {injector: TestBed.inject(Injector)});

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.columns.length).toEqual(1);

      columns.update(c => c.concat(['name']));
      await fixture.whenStable();
      expect(po.columns.length).toEqual(2);
    });

    describe('Columns', () => {

      it('should support custom component cell', async () => {
        const value = signal(10);
        const data = signal([{id: 1}]);
        const model = table(data, table => table
          .addNumberColumn(item => item.id)
          .addComponentColumn({
            header: 'Value',
            component: () => ({
              component: TestComponent,
              bindings: [inputBinding('value', value)],
            }),
          }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);
        expect(po.columnEntries('Value')).toEqual(['5']);

        // Update input signal => should update inside component.
        value.set(20);
        await fixture.whenStable();
        expect(po.columnEntries('Value')).toEqual(['10']);
      });

      it('should support custom template cell', async () => {
        const fixture = TestBed.createComponent(TestTemplate);
        await fixture.whenStable();

        const po = new TablePO(fixture);
        expect(po.columnEntries('ID')).toEqual(['1', '2', '3']);
        expect(po.columnEntries('Price')).toEqual(['50', '100', '200']);
      });
    });

    describe('Sorting', () => {

      it('should sort number column', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn({
          name: 'id',
          header: 'ID',
          value: item => item.id,
        }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model.sort('id', false);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['1', '2', '3']);

        model.sort('id', false);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['3', '2', '1']);
      });

      it('should sort string column', async () => {
        const data = signal([{name: 'b'}, {name: 'c'}, {name: 'a'}]);
        const model = table(data, table => table.addStringColumn({
          name: 'name',
          header: 'Name',
          value: item => item.name,
        }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model.sort('name', false);
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['a', 'b', 'c']);

        model.sort('name', false);
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['c', 'b', 'a']);
      });

      it('should sort boolean column', async () => {
        const data = signal([{active: true}, {active: false}, {active: true}]);
        const model = table(data, table => table.addBooleanColumn({
          name: 'active',
          header: 'Active',
          value: item => item.active,
        }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model.sort('active', false);
        await fixture.whenStable();
        expect(po.columnEntries('Active')).toEqual(['clear', 'checkmark', 'checkmark']);

        model.sort('active', false);
        await fixture.whenStable();
        expect(po.columnEntries('Active')).toEqual(['checkmark', 'checkmark', 'clear']);
      });

      it('should sort custom template column', async () => {
        const fixture = TestBed.createComponent(TestTemplate);
        await fixture.whenStable();

        const po = new TablePO(fixture);
        expect(po.columnEntries('Price')).toEqual(['50', '100', '200']);

        fixture.componentInstance.table.sort('price', false);
        await fixture.whenStable();
        expect(po.columnEntries('Price')).toEqual(['50', '100', '200']);

        fixture.componentInstance.table.sort('price', false);
        await fixture.whenStable();
        expect(po.columnEntries('Price')).toEqual(['200', '100', '50']);
      });

      it('should sort with custom sort function', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table
          .addNumberColumn({
            header: 'ID',
            name: 'id',
            value: item => item.id,
            sort: (a, b) => a.value === 2 ? -1 : 1,
          }), {injector: TestBed.inject(Injector)},
        );

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model.sort('id', false);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['2', '1', '3']);

        model.sort('id', false);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['3', '1', '2']);
      });

      it('should sort with header click', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn('ID', item => item.id), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);
        const column = po.getColumnByHeader('ID')!;

        await column.toggleSort();
        expect(po.columnEntries('ID')).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(po.columnEntries('ID')).toEqual(['3', '2', '1']);
      });
    });

    describe('Filtering', () => {
      it('should filter number column', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn({
          name: 'id',
          header: 'ID',
          value: item => item.id,
        }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model.filter('id', 3);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['3']);

        model.resetFilter();
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['1', '3', '2']);
      });

      it('should filter string column', async () => {
        const data = signal([{name: 'a'}, {name: 'c'}, {name: 'b'}]);
        const model = table(data, table => table.addStringColumn({
          name: 'name',
          header: 'Name',
          value: item => item.name,
        }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model.filter('name', 'c');
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['c']);

        model.resetFilter();
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['a', 'c', 'b']);
      });

      it('should filter boolean column', async () => {
        const data = signal([{active: true}, {active: false}, {active: true}]);
        const model = table(data, table => table.addBooleanColumn({
          name: 'active',
          header: 'Active',
          value: item => item.active,
        }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model.filter('active', true);
        await fixture.whenStable();
        expect(po.columnEntries('Active')).toEqual(['checkmark', 'checkmark']);

        model.resetFilter();
        await fixture.whenStable();
        expect(po.columnEntries('Active')).toEqual(['checkmark', 'clear', 'checkmark']);
      });

      it('should support filter with custom filter function', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]);
        const model = table(data, table => table.addStringColumn({
          name: 'name',
          header: 'Name',
          value: item => item.name,
          filter: (text, context) => context.value.length === text.length,
        }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model.filter('name', 'abcd');
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['beta']);

        model.resetFilter();
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should filter number with filter field', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn({
          name: 'id',
          header: 'ID',
          value: item => item.id,
        }), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);
        const column = po.getColumnByHeader('ID')!;

        await column.filter('3');
        expect(po.columnEntries('ID')).toEqual(['3']);
      });
    });

    describe('Multi Selection', () => {

      it('should set active item and replace selection on row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);
        selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 2}]));
      });

      it('should toggle selection on control/meta row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);

        selectionService.onRowClick(0, {ctrlKey: true, metaKey: false, shiftKey: false});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));

        selectionService.onRowClick(0, {ctrlKey: false, metaKey: true, shiftKey: false});
        expect(model.selectedItems()).toEqual(new Set());
      });

      it('should select range on shift row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}]);
        const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);

        selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});
        selectionService.onRowClick(4, {ctrlKey: false, metaKey: false, shiftKey: true});

        expect(model.activeItem()).toEqual({id: 5});
        expect(model.selectedItems()).toEqual(new Set([{id: 2}, {id: 3}, {id: 4}, {id: 5}]));
      });

      it('should navigate with arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);
        const arrowDownEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;
        const arrowUpEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;

        selectionService.onArrowDown(arrowDownEvent);
        expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));

        selectionService.onArrowDown(arrowDownEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 2}]));

        selectionService.onArrowUp(arrowUpEvent);
        expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));
      });

      it('should extend selection on shift arrow and keep selection on control/meta arrow', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: true, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}, {id: 2}]));

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 3});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}, {id: 2}]));

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: true} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}, {id: 2}]));
      });

      it('should ignore arrow up/down at table boundaries', async () => {
        const data = signal([{id: 1}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toBeUndefined();

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 2}]));
      });

      it('should toggle active row selection on space and ignore when no active row', async () => {
        const data = signal([{id: 1}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);

        selectionService.onSpace({preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent);
        expect(model.selectedItems()).toEqual(new Set());

        selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        selectionService.onSpace({preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent);
        expect(model.selectedItems()).toEqual(new Set());

        selectionService.onSpace({preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent);
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));
      });

      it('should select all loaded rows on control/meta+a', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table(data, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);
        const event = {preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent;

        selectionService.onControlA(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(model.allSelected()).toBeFalse();
        expect(model.selectedItems()).toEqual(new Set([{id: 1}, {id: 2}, {id: 3}]));
      });
    });

    describe('Single Selection', () => {

      it('should set active item and replace selection on row click', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table({data, selectionType: 'single'}, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);
        selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});
        selectionService.onRowClick(1, {ctrlKey: false, metaKey: false, shiftKey: false});

        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 2}]));
      });

      it('should navigate with arrow up and down', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table({data, selectionType: 'single'}, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);
        const arrowDownEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;
        const arrowUpEvent = {preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent;

        selectionService.onArrowDown(arrowDownEvent);
        expect(arrowDownEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));

        selectionService.onArrowDown(arrowDownEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 2}]));

        selectionService.onArrowUp(arrowUpEvent);
        expect(arrowUpEvent.preventDefault).toHaveBeenCalled();
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));
      });

      it('should keep selection on control/meta arrow', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table({data, selectionType: 'single'}, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);

        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: true} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 3});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: true} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: true, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));
      });

      it('should not extend selection on shift arrow', async () => {
        const data = signal([{id: 1}, {id: 2}, {id: 3}]);
        const model = table({data, selectionType: 'single'}, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);

        expect(model.activeItem()).toEqual({id: 1});
        expect(model.selectedItems()).toEqual(new Set([{id: 1}]));

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: true, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 2}]));

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: true, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 3});
        expect(model.selectedItems()).toEqual(new Set([{id: 3}]));

        selectionService.onArrowUp({preventDefault: jasmine.createSpy(), shiftKey: true, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        expect(model.activeItem()).toEqual({id: 2});
        expect(model.selectedItems()).toEqual(new Set([{id: 2}]));
      });

      it('should scroll active row into viewport', async () => {
        const data = signal(new Array(100).fill(0).map((_, i) => ({id: i})));
        const model = table({
          data,
          itemSize: 20,
          showHeader: false,
          selectionType: 'single',
        }, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});
        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        (fixture.nativeElement as HTMLElement).style.height = '200px';
        await fixture.whenStable();
        const po = new TablePO(fixture);

        const selectionService = fixture.componentRef.injector.get(TableSelectionService<number, number>);

        selectionService.onRowClick(9, {ctrlKey: false, shiftKey: false, metaKey: false});
        await fixture.whenStable();
        expect(po.scrollTop).toBe(0);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        await fixture.whenStable();
        expect(po.scrollTop).toBe(20);

        selectionService.onArrowDown({preventDefault: jasmine.createSpy(), shiftKey: false, ctrlKey: false, metaKey: false} as unknown as KeyboardEvent);
        await fixture.whenStable();
        expect(po.scrollTop).toBe(40);

        selectionService.onRowClick(49, {ctrlKey: false, shiftKey: false, metaKey: false});
        await fixture.whenStable();
        expect(po.scrollTop).toBe(800);
      });
    });

    describe('Row Actions', () => {
      it('should show actions', async () => {
        const onSelect = jasmine.createSpy();
        const data = signal([{id: 1}, {id: 2}]);
        const model = table({
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
        }, table => table.addNumberColumn(item => item.id), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);
        await po.rows[0]!.clickAction('testee');

        expect(onSelect).toHaveBeenCalledOnceWith({id: 1});
      });

      it('should show actions on hover', async () => {
        const onSelect = jasmine.createSpy();
        const data = signal([{id: 1}, {id: 2}]);
        const model = table({
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
        }, table => table.addNumberColumn(item => item.id), {injector: TestBed.inject(Injector)});

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', () => model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);
        await po.rows[1]!.clickActionAfterHover('testee');

        expect(onSelect).toHaveBeenCalledOnceWith({id: 2});
      });
    });
  });

  describe('Custom Data Source', () => {
    it('should cache pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
      }) as SciTableResponse<{id: number}>);

      const model = table<{id: number}, number>({
        itemSize: 20,
        overscan: 0,
        identity: item => item.id,
        data: {
          loader,
          pageSize: 10,
        },
      }, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '200px';
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.rows.length).toEqual(10); // 200px / 20px per row
      expect(po.rows[0]?.cells[0]?.value).toEqual('0');
      expect(loader).toHaveBeenCalledTimes(1);

      await po.scrollY(400);
      expect(po.rows[0]?.cells[0]?.value).toEqual('20'); // 400px = 20 rows
      expect(loader).toHaveBeenCalledTimes(2);

      await po.scrollY(-400);
      expect(po.rows[0]?.cells[0]?.value).toEqual('0');
      expect(loader).toHaveBeenCalledTimes(2); // Should cache page 0 and not call loader again
    });

    it('should load pages based on overscan', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => ({
        totalCount: 1_000,
        items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
      }) as SciTableResponse<{id: number}>);

      const model = table<{id: number}, number>({
        itemSize: 20,
        overscan: 3,
        identity: item => item.id,
        data: {
          loader,
          pageSize: 20,
        },
      }, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '200px';
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.rows.length).toEqual(16); // (200px / 20px per row) + (2 * 6 rows overscan) = 16 rows in DOM
      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining({start: 0, end: 20}));

      await po.scrollY(160); // Scroll 8 rows so viewport is ID 7-17 and overscan is 4-6 and 17-20 => should load page 2 because row 20 is loaded
      expect(loader).toHaveBeenCalledTimes(2);
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({start: 20, end: 40}));
    });

    it('should filter', async () => {
      const model = table<{id: number}, number>({
        identity: item => item.id,
        data: {
          loader: request => {
            const filter = request.filterCriteria[0];
            return {
              totalCount: filter ? 1 : 1_000,
              items: filter?.columnName === 'id' ?
                [{id: +filter.text}] :
                rangeInclusive(request.start, request.end - 1).map(id => ({id})),
            };
          },
          pageSize: 20,
        },
      }, table => table.addNumberColumn({
        name: 'id',
        header: 'ID',
        value: item => item.id,
      }), {injector: TestBed.inject(Injector)});

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.rows[0]?.cells[0]?.value).toEqual('0');

      model.filter('id', '5');
      await fixture.whenStable();
      expect(po.columnEntries('ID')).toEqual(['5']);
    });

    it('should sort', async () => {
      const model = table<{id: number}, number>({
        identity: item => item.id,
        data: {
          pageSize: 20,
          loader: request => {
            const sortCriterion = request.sortCriteria[0];
            const data = rangeInclusive(request.start, 1_000).map(id => ({id}));
            return {
              totalCount: 1_000,
              items: sortCriterion?.columnName === 'id' ? data.reverse().slice(request.start, request.end) : data.slice(request.start, request.end),
            };
          },
        },
      }, table => table.addNumberColumn({
        name: 'id',
        header: 'ID',
        value: item => item.id,
      }), {injector: TestBed.inject(Injector)});

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.rows[0]?.cells[0]?.value).toEqual('0');

      model.sort('id', false);
      await fixture.whenStable();
      expect(po.rows[0]?.cells[0]?.value).toEqual('1000');
    });

    it('should abort in flight loads', async () => {
      const onAbort = jasmine.createSpy();
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => {
        if (request.page === 2) {
          request.abortSignal.addEventListener('abort', onAbort);
        }

        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              totalCount: request.page === 2 ? 10 : 1_000, // set wrong totalCount on canceled page.
              items: rangeInclusive(request.start, request.end).map(id => ({id})),
            });
          }, 50);
        });
      });

      const model = table({
        identity: item => item.id,
        itemSize: 20,
        overscan: 0,
        data: {
          pageSize: 10,
          loader,
        },
      }, table => table.addNumberColumn({
        name: 'id',
        header: 'ID',
        value: item => item.id,
      }), {injector: TestBed.inject(Injector)}) as ɵSciTable<{id: number}, number>;

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '200px';
      await fixture.whenStable();

      const po = new TablePO(fixture);
      // Wait for load timeout.
      await new Promise(resolve => setTimeout(resolve, 50));

      // Scroll to page 2 (400px-600px from top)
      await po.scrollY(420);
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining({page: 2}));
      await new Promise(resolve => setTimeout(resolve, 25));

      // Scroll back up before the page load finishes
      await po.scrollY(-420);
      expect(onAbort).toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 50));
      await fixture.whenStable();
      expect(model.totalCount()).toBe(1_000); // Should not set wrong totalCount when canceled.
      expect(model.rows().map(r => r.id).filter(Boolean).length).toBe(10); // Should only have one page loaded.
    });

    it('should fallback to single selection when shift range contains unloaded rows', async () => {
      const model = table({
        identity: item => item.id,
        itemSize: 20,
        overscan: 0,
        data: {
          pageSize: 20,
          loader: request => ({
            totalCount: 100,
            items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
          }),
        },
      }, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)}) as ɵSciTable<{id: number}, number>;

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '200px';
      await fixture.whenStable();

      model.loadPages(40, 60, [], [], new AbortController());
      await fixture.whenStable();

      const selectionService = fixture.componentRef.injector.get(TableSelectionService<{id: number}, number>);
      selectionService.onRowClick(0, {ctrlKey: false, metaKey: false, shiftKey: false});

      selectionService.onRowClick(40, {ctrlKey: false, metaKey: false, shiftKey: true});

      expect(model.activeItem()).toBe(40);
      expect(model.selectedItems()).toEqual(new Set([40]));
    });

    it('should activate all selected mode on control/meta+a with unloaded rows', async () => {
      const model = table({
        identity: item => item.id,
        itemSize: 20,
        overscan: 0,
        selectionType: 'multi',
        data: {
          pageSize: 20,
          loader: request => ({
            totalCount: 100,
            items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
          }),
        },
      }, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)}) as ɵSciTable<{id: number}, number>;

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '200px';
      await fixture.whenStable();

      const selectionService = fixture.componentRef.injector.get(TableSelectionService<{id: number}, number>);
      selectionService.onControlA({preventDefault: jasmine.createSpy()} as unknown as KeyboardEvent);

      expect(model.allSelected()).toBeTrue();
      expect(model.selectedItems()).toEqual(new Set());
    });

    it('should load data from observable', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => of({
        totalCount: 1_000,
        items: rangeInclusive(request.start, request.end - 1).map(id => ({id})),
      } as SciTableResponse<{id: number}>));

      const model = table<{id: number}, number>({
        itemSize: 20,
        overscan: 0,
        data: {
          pageSize: 20,
          loader,
        },
      }, table => table.addNumberColumn(i => i.id), {injector: TestBed.inject(Injector)});

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', () => model)],
      });
      (fixture.nativeElement as HTMLElement).style.height = '200px';
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.rows.length).toEqual(10); // 200px / 20px per row
      expect(po.rows[0]?.cells[0]?.value).toEqual('0');
      expect(loader).toHaveBeenCalledTimes(1);
    });
  });
});

@Component({
  selector: 'spec-test-cell',
  template: `
    {{ half() }}
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
      {{ product.price / 2 }}
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
  public readonly table = table(this._data, table => table
    .addNumberColumn({
      header: 'ID',
      value: item => item.id,
    })
    .addTemplateColumn({
      name: 'price',
      header: 'Price',
      sort: (a, b) => a.item.price - b.item.price,
      template: product => ({
        template: this._cellTemplate(),
      }),
    }),
  );
}
