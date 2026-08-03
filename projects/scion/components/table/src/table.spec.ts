import {SciTableComponent, table} from '@scion/components/table';
import {TestBed} from '@angular/core/testing';
import {effect, Injector, inputBinding, signal} from '@angular/core';
import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {ɵSciTable} from './ɵtable.model';

describe('Table Factory', () => {
  describe('validation', () => {
    it('should not allow creation without injection context', () => {
      expect(() => table('table:test', signal([]), table => table)).toThrowError(/NG0203:/i);
    });

    it('should not allow creation in reactive context', done => {
      effect(() => {
        expect(() => table('table:test', signal([]), table => table, {injector: TestBed.inject(Injector)})).toThrowError(/NG0602:/i);
        done();
      }, {injector: TestBed.inject(Injector)});
    });

    it('should not allow loader function with custom sort', done => {
      table({
        data: () => ({totalCount: 0, items: []}),
        name: 'table:test',
      }, table => {
        expect(() => table.addStringColumn({
          value: () => 'test',
          sortable: {comparator: () => 0},
        })).toThrowError('[ColumnDefinitionError] Data sources with a loader function cannot define a custom sort or filter function. Sorting and filtering have to be done within the loader function.');
        done();
      }, {injector: TestBed.inject(Injector)});
    });

    it('should not allow loader function with custom filter', done => {
      table({
        data: () => ({totalCount: 0, items: []}),
        name: 'table:test',
      }, table => {
        expect(() => table.addStringColumn({
          value: () => 'test',
          filterable: {matcher: () => true},
        })).toThrowError('[ColumnDefinitionError] Data sources with a loader function cannot define a custom sort or filter function. Sorting and filtering have to be done within the loader function.');
        done();
      }, {injector: TestBed.inject(Injector)});
    });

    it('should not allow component column with auto filter', done => {
      table({
        data: signal([]),
        name: 'table:test',
      }, table => {
        expect(() => table.addComponentColumn({
          component: () => ({}) as SciComponentDescriptor,
          filterable: true,
        })).toThrowError('[ColumnDefinitionError] Component columns cannot have a auto filter or auto sort.');
        done();
      }, {injector: TestBed.inject(Injector)});
    });

    it('should not allow component column with auto sort', done => {
      table({
        data: signal([]),
        name: 'table:test',
      }, table => {
        expect(() => table.addComponentColumn({
          component: () => ({}) as SciComponentDescriptor,
          sortable: true,
        })).toThrowError('[ColumnDefinitionError] Component columns cannot have a auto filter or auto sort.');
        done();
      }, {injector: TestBed.inject(Injector)});
    });

    it('should not allow template column with auto filter', done => {
      table({
        data: signal([]),
        name: 'table:test',
      }, table => {
        expect(() => table.addTemplateColumn({
          template: () => ({}) as SciTemplateDescriptor,
          filterable: true,
        })).toThrowError('[ColumnDefinitionError] Template columns cannot have a auto filter or auto sort.');
        done();
      }, {injector: TestBed.inject(Injector)});
    });

    it('should not allow template column with auto sort', done => {
      table({
        data: signal([]),
        name: 'table:test',
      }, table => {
        expect(() => table.addTemplateColumn({
          template: () => ({}) as SciTemplateDescriptor,
          sortable: true,
        })).toThrowError('[ColumnDefinitionError] Template columns cannot have a auto filter or auto sort.');
        done();
      }, {injector: TestBed.inject(Injector)});
    });
  });

  it('should call factory in a reactive context', async () => {
    const flag = signal(false);
    const model = table({
      data: signal([]),
      name: 'table:test',
    }, table => {
      if (flag()) {
        table.addStringColumn(() => 'test');
      }

      table.addStringColumn(() => 'test2');
    }, {injector: TestBed.inject(Injector)}) as ɵSciTable<unknown>;

    const fixture = TestBed.createComponent(SciTableComponent, {bindings: [inputBinding('table', () => model)]});

    await fixture.whenStable();
    expect(model.columns()).toHaveSize(1);

    flag.set(true);
    await fixture.whenStable();
    expect(model.columns()).toHaveSize(2);
  });
});
