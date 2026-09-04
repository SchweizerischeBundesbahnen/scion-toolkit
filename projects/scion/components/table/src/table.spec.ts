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
import {effect, Injector, signal} from '@angular/core';
import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {createSciTableComponent} from './testing/testing.util';
import {table} from './table';

fdescribe('Table Factory', () => {
  describe('validation', () => {
    it('should throw error if not called in injection context', () => {
      expect(() => table(signal([]), table => table)).toThrowError(/NG0203:/i);
    });

    it('should error if called in reactive context', done => {
      effect(() => {
        expect(() => table(signal([]), table => table, {injector: TestBed.inject(Injector)})).toThrowError(/NG0602:/i);
        done();
      }, {injector: TestBed.inject(Injector)});
    });

    it('should not allow loader function with custom sort', done => {
      createSciTableComponent(() => table({data: () => ({totalCount: 0, items: []})}, table => {
        expect(() => table.addStringColumn({
          value: () => 'test',
          sortable: {comparator: () => 0},
        })).toThrowError('[ColumnDefinitionError] Data sources with a loader function cannot define a custom sort or filter function. Sorting and filtering have to be done within the loader function.');
        done();
      }));
    });

    it('should not allow loader function with custom filter', done => {
      createSciTableComponent(() => table({data: () => ({totalCount: 0, items: []})}, table => {
        expect(() => table.addStringColumn({
          value: () => 'test',
          filterable: {matcher: () => true},
        })).toThrowError('[ColumnDefinitionError] Data sources with a loader function cannot define a custom sort or filter function. Sorting and filtering have to be done within the loader function.');
        done();
      }));
    });

    it('should not allow component column with auto filter', done => {
      createSciTableComponent(() => table(signal([]), table => {
        expect(() => table.addComponentColumn({
          component: () => ({}) as SciComponentDescriptor,
          filterable: true,
        })).toThrowError('[ColumnDefinitionError] Component columns cannot have a auto filter or auto sort.');
        done();
      }));
    });

    it('should not allow component column with auto sort', done => {
      createSciTableComponent(() => table(signal([]), table => {
        expect(() => table.addComponentColumn({
          component: () => ({}) as SciComponentDescriptor,
          sortable: true,
        })).toThrowError('[ColumnDefinitionError] Component columns cannot have a auto filter or auto sort.');
        done();
      }));
    });

    it('should not allow template column with auto filter', done => {
      createSciTableComponent(() => table(signal([]), table => {
        expect(() => table.addTemplateColumn({
          template: () => ({}) as SciTemplateDescriptor,
          filterable: true,
        })).toThrowError('[ColumnDefinitionError] Template columns cannot have a auto filter or auto sort.');
        done();
      }));
    });

    it('should not allow template column with auto sort', done => {
      createSciTableComponent(() => table(signal([]), table => {
        expect(() => table.addTemplateColumn({
          template: () => ({}) as SciTemplateDescriptor,
          sortable: true,
        })).toThrowError('[ColumnDefinitionError] Template columns cannot have a auto filter or auto sort.');
        done();
      }));
    });

    it('should not allow multiple columns with the same name', done => {
      createSciTableComponent(() => table(signal([]), table => {
        expect(() => table
          .addStringColumn({name: 'column:test', value: () => ''})
          .addStringColumn({name: 'column:test', value: () => ''}),
        ).toThrowError('[ColumnDefinitionError] Column names have to be unique. "column:test" is defined more than once.');
        done();
      }));
    });

    it('should allow multiple columns with no name', done => {
      createSciTableComponent(() => table(signal([]), table => {
        expect(() => table
          .addStringColumn({value: () => ''})
          .addStringColumn('Test', () => ''),
        ).not.toThrow();
        done();
      }));
    });
  });

  it('should call factory in a reactive context', async () => {
    const flag = signal(false);
    const {fixture, model} = createSciTableComponent(() => table(signal([]), table => {
      if (flag()) {
        table.addStringColumn(() => 'test');
      }
      table.addStringColumn(() => 'test2');
    }));

    await fixture.whenStable();
    expect(model.columns()).toHaveSize(1);

    flag.set(true);
    await fixture.whenStable();
    expect(model.columns()).toHaveSize(2);
  });
});
