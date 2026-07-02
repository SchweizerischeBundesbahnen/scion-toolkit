import {TestBed} from '@angular/core/testing';
import {table} from './table';
import {SciTableComponent} from './table.component';
import {inputBinding, signal} from '@angular/core';
import {TablePO} from './table.po';
import {SciDataSource, SciTableRequest, SciTableResponse} from '@scion/components/table';
import {rangeInclusive} from './common';

describe('Table', () => {

  describe('Array Data Source', () => {

    it('should update table on data change', async () => {
      const data = signal([{id: 1}, {id: 2}, {id: 3}]);
      const model = table(data, table => table.addNumberColumn(i => i.id));

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', model)],
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
      });

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', model)],
      });
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.columns.length).toEqual(1);

      columns.update(c => c.concat(['name']));
      await fixture.whenStable();
      expect(po.columns.length).toEqual(2);
    });

    describe('Sorting', () => {

      it('should sort number column', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn({
          name: 'id',
          header: 'ID',
          value: item => item.id,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model().sort('id', false);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['1', '2', '3']);

        model().sort('id', false);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['3', '2', '1']);
      });

      it('should sort string column', async () => {
        const data = signal([{name: 'b'}, {name: 'c'}, {name: 'a'}]);
        const model = table(data, table => table.addStringColumn({
          name: 'name',
          header: 'Name',
          value: item => item.name,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model().sort('name', false);
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['a', 'b', 'c']);

        model().sort('name', false);
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['c', 'b', 'a']);
      });

      it('should sort boolean column', async () => {
        const data = signal([{active: true}, {active: false}, {active: true}]);
        const model = table(data, table => table.addBooleanColumn({
          name: 'active',
          header: 'Active',
          value: item => item.active,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model().sort('active', false);
        await fixture.whenStable();
        expect(po.columnEntries('Active')).toEqual(['clear', 'checkmark', 'checkmark']);

        model().sort('active', false);
        await fixture.whenStable();
        expect(po.columnEntries('Active')).toEqual(['checkmark', 'checkmark', 'clear']);
      });

      it('should sort with custom sort function', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table
          .addNumberColumn({
            header: 'ID',
            name: 'id',
            value: item => item.id,
            sort: (a, b) => a.value === 2 ? -1 : 1,
          }),
        );

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model().sort('id', false);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['2', '1', '3']);

        model().sort('id', false);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['3', '1', '2']);
      });

      it('should sort with header click', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn('ID', item => item.id));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
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
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model().filter('id', 3);
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['3']);

        model().resetFilter();
        await fixture.whenStable();
        expect(po.columnEntries('ID')).toEqual(['1', '3', '2']);
      });

      it('should filter string column', async () => {
        const data = signal([{name: 'a'}, {name: 'c'}, {name: 'b'}]);
        const model = table(data, table => table.addStringColumn({
          name: 'name',
          header: 'Name',
          value: item => item.name,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model().filter('name', 'c');
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['c']);

        model().resetFilter();
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['a', 'c', 'b']);
      });

      it('should filter boolean column', async () => {
        const data = signal([{active: true}, {active: false}, {active: true}]);
        const model = table(data, table => table.addBooleanColumn({
          name: 'active',
          header: 'Active',
          value: item => item.active,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model().filter('active', true);
        await fixture.whenStable();
        expect(po.columnEntries('Active')).toEqual(['checkmark', 'checkmark']);

        model().resetFilter();
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
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);

        model().filter('name', 'abcd');
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['beta']);

        model().resetFilter();
        await fixture.whenStable();
        expect(po.columnEntries('Name')).toEqual(['alpha', 'beta', 'gamma']);
      });

      it('should filter number with filter field', async () => {
        const data = signal([{id: 1}, {id: 3}, {id: 2}]);
        const model = table(data, table => table.addNumberColumn({
          name: 'id',
          header: 'ID',
          value: item => item.id,
        }));

        const fixture = TestBed.createComponent(SciTableComponent, {
          bindings: [inputBinding('table', model)],
        });
        await fixture.whenStable();

        const po = new TablePO(fixture);
        const column = po.getColumnByHeader('ID')!;

        await column.filter('3');
        expect(po.columnEntries('ID')).toEqual(['3']);
      });
    });
  });

  describe('Custom Data Source', () => {
    it('should cache pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTableRequest) => {
        console.log(request);
        return ({
          totalCount: 1_000,
          items: rangeInclusive(request.start, request.end).map(id => ({id})),
        }) as SciTableResponse<{id: number}>;
      });

      const model = table({
        pageSize: 20,
        identity: item => item.id,
        loader,
      } as SciDataSource<{id: number}, number>, table => table
        .itemSize(10)
        .addNumberColumn(i => i.id),
      );

      const fixture = TestBed.createComponent(SciTableComponent, {
        bindings: [inputBinding('table', model)],
      });
      await fixture.whenStable();

      const po = new TablePO(fixture);
      expect(po.rows.length).toEqual(20);
      expect(loader).toHaveBeenCalledTimes(1);

      await po.scrollY(100);
      expect(po.rows[0]?.cells[0]?.value).toEqual('20');
      expect(loader).toHaveBeenCalledTimes(2);

      await po.scrollY(-100);
      expect(po.rows[0]?.cells[0]?.value).toEqual('0');
      expect(loader).toHaveBeenCalledTimes(2);
    });
  });
});
