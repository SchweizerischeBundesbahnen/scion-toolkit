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
import {assertNotInReactiveContext, Component, computed, DestroyRef, EnvironmentProviders, inject, Injector, input, inputBinding, linkedSignal, LOCALE_ID, signal, TemplateRef, viewChild, WritableSignal} from '@angular/core';
import {TablePO} from './table.po';
import {BehaviorSubject, map, NEVER, noop, Observable, Subject, take, tap} from 'rxjs';
import {provideTableStorage} from './table-storage';
import {provideTableRowBinding} from './table-row-binding';
import {SciTableDataLoaderFn, SciTablePageRequest, SciTablePageResponse, ɵillegaldatasource} from './table-datasource';
import {createSciTableComponent, waitUntilStable} from './testing/testing.util';
import {SciTableCellValuePreloader} from './table-cell-value-preloader';
import {registerLocaleData} from '@angular/common';
import localeDeCH from '@angular/common/locales/de-CH';
import localeEnCH from '@angular/common/locales/en-CH';
import {SCI_LOCALE} from '@scion/components/common';
import {Arrays} from '@scion/toolkit/util';

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

    // TODO [dwie] Move after Time column
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

    // TODO [dwie] Move after Time column
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

    describe('String Column', () => {

      it('should have empty cell for `undefined` value', async () => {
        const data = signal([{string: undefined}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addStringColumn(item => item.string),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['']]);
      });

      it('should accept signal as value', async () => {
        const value = signal('a');
        const {fixture} = createSciTableComponent(sciTable({
          datasource: signal([undefined]),
          filterable: true,
          columns: table => table.addStringColumn(() => value),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['a']]);

        // Update value.
        value.set('b');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['b']]);
      });
    });

    describe('Number Column', () => {

      it('should have empty cell for `undefined` value', async () => {
        const data = signal([{number: undefined}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addNumberColumn(item => item.number),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['']]);
      });

      it('should accept signal as value', async () => {
        const value = signal(1);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: signal([undefined]),
          filterable: true,
          columns: table => table.addNumberColumn(() => value),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['1']]);

        // Update value.
        value.set(2);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['2']]);
      });

      it('should have tabular (monospaced) figures', async () => {
        const data = signal([{number: 1}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addNumberColumn(item => item.number),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(getComputedStyle(table.row({nth: 0}).cells[0]!.element!).fontVariantNumeric).toEqual('tabular-nums');
      });

      it('should disable tabular (monospaced) figures via CSS', async () => {
        const data = signal([{number: 1}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addNumberColumn(item => item.number),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        // Disable tabular figures via CSS.
        const styleSheet = new CSSStyleSheet();
        styleSheet.insertRule(`
          sci-table::part(column\\:number) {
            font-variant-numeric: normal;
          }
        `);
        document.adoptedStyleSheets.push(styleSheet);
        TestBed.inject(DestroyRef).onDestroy(() => Arrays.remove(document.adoptedStyleSheets, styleSheet));

        expect(getComputedStyle(table.row({nth: 0}).cells[0]!.element!).fontVariantNumeric).toEqual('normal');
      });
    });

    describe('Boolean Column', () => {

      it('should have empty cell for `undefined` value', async () => {
        const data = signal([{boolean: undefined}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addBooleanColumn(item => item.boolean),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['']]);
      });

      it('should accept signal as value', async () => {
        const value = signal(true);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: signal([undefined]),
          filterable: true,
          columns: table => table.addBooleanColumn(() => value),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['checkmark']]);

        // Update value.
        value.set(false);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['clear']]);
      });
    });

    describe('Date Column', () => {

      it('should have empty cell for `undefined` value', async () => {
        const data = signal([{date: undefined}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addDateColumn(item => item.date),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['']]);
      });

      it('should accept signal as value', async () => {
        const value = signal('2026-02-17');
        const {fixture} = createSciTableComponent(sciTable({
          datasource: signal([undefined]),
          filterable: true,
          columns: table => table.addDateColumn({
            value: () => value,
            format: 'dd.MM.yyyy',
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['17.02.2026']]);

        // Update value.
        value.set('2026-02-18');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([['18.02.2026']]);
      });

      it('should support different date input formats', async () => {
        const data = signal([
          {
            date1: '2026-02-17',
            date2: new Date('2026-02-17'),
            date3: new Date('2026-02-17').getTime(),
            date4: '2026-02-17T20:00:00.000Z',
          },
        ]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addDateColumn({
              value: item => item.date1,
              format: 'dd.MM.yyyy',
            })
            .addDateColumn({
              value: item => item.date2,
              format: 'dd.MM.yyyy',
            })
            .addDateColumn({
              value: item => item.date3,
              format: 'dd.MM.yyyy',
            })
            .addDateColumn({
              value: item => item.date4,
              format: 'dd.MM.yyyy',
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['17.02.2026', '17.02.2026', '17.02.2026', '17.02.2026'],
        ]);
      });

      it('should display date in specified format', async () => {
        const data = signal([{date: '2026-02-17'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addDateColumn(item => item.date)
            .addDateColumn({
              value: item => item.date,
              format: 'dd.MM.yyyy',
            })
            .addDateColumn({
              value: item => item.date,
              format: 'yyyy-MM-dd',
            })
            .addDateColumn({
              value: item => item.date,
              format: 'longDate',
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['Feb 17, 2026', '17.02.2026', '2026-02-17', 'February 17, 2026'],
        ]);
      });

      it('should localize date', async () => {
        TestBed.overrideProvider(LOCALE_ID, {useValue: 'de-CH'});
        registerLocaleData(localeDeCH);
        registerLocaleData(localeEnCH);

        const locale = TestBed.inject(SCI_LOCALE);
        const columnLocale = linkedSignal(locale);

        const data = signal([{date: '2026-02-17'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addDateColumn({
              value: item => item.date,
              format: 'longDate',
            })
            .addDateColumn({
              value: item => item.date,
              format: 'fullDate',
              locale: columnLocale,
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['17. Februar 2026', 'Dienstag, 17. Februar 2026'],
        ]);

        // Expect global locale to be 'de-CH'.
        expect(locale()).toEqual('de-CH');

        // Change global locale to 'en-US'.
        locale.set('en-US');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['February 17, 2026', 'Tuesday, February 17, 2026'],
        ]);

        // Change column locale to 'en-CH'.
        columnLocale.set('en-CH');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['February 17, 2026', 'Tuesday, 17 February 2026'],
        ]);
      });

      it('should default to DATE_PIPE_DEFAULT_OPTIONS.dateFormat', async () => {
        TestBed.overrideProvider(DATE_PIPE_DEFAULT_OPTIONS, {useValue: {dateFormat: 'dd.MM.yyyy'} satisfies DatePipeConfig});

        const data = signal([{date: '2026-02-17'}]);

        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addDateColumn(item => item.date),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['17.02.2026'],
        ]);
      });

      it('should have tabular (monospaced) figures', async () => {
        const data = signal([{date: '2026-02-17'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addDateColumn(item => item.date),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(getComputedStyle(table.row({nth: 0}).cells[0]!.element!).fontVariantNumeric).toEqual('tabular-nums');
      });

      it('should disable tabular (monospaced) figures via CSS', async () => {
        const data = signal([{date: '2026-02-17'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addDateColumn(item => item.date),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        // Disable tabular figures via CSS.
        const styleSheet = new CSSStyleSheet();
        styleSheet.insertRule(`
          sci-table::part(column\\:date) {
            font-variant-numeric: normal;
          }
        `);
        document.adoptedStyleSheets.push(styleSheet);
        TestBed.inject(DestroyRef).onDestroy(() => Arrays.remove(document.adoptedStyleSheets, styleSheet));

        expect(getComputedStyle(table.row({nth: 0}).cells[0]!.element!).fontVariantNumeric).toEqual('normal');
      });
    });

    describe('Date Column (Time)', () => {

      it('should support different time input formats', async () => {
        const data = signal([
          {
            time1: '16:20:45Z',
            time2: 'T16:20:45Z',
            time3: '2026-02-17T16:20:45Z',
            time4: new Date('2026-02-17T16:20:45Z'),
            time5: new Date('2026-02-17T16:20:45Z').getTime(),
          },
        ]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addDateColumn({
              value: item => item.time1,
              format: 'HH:mm:ss',
              timezone: 'UTC',
            })
            .addDateColumn({
              value: item => item.time2,
              format: 'HH:mm:ss',
              timezone: 'UTC',
            })
            .addDateColumn({
              value: item => item.time3,
              format: 'HH:mm:ss',
              timezone: 'UTC',
            })
            .addDateColumn({
              value: item => item.time4,
              format: 'HH:mm:ss',
              timezone: 'UTC',
            })
            .addDateColumn({
              value: item => item.time5,
              format: 'HH:mm:ss',
              timezone: 'UTC',
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['16:20:45', '16:20:45', '16:20:45', '16:20:45', '16:20:45'],
        ]);
      });

      it('should display time in specified format', async () => {
        const data = signal([{time: 'T16:20:45Z'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addDateColumn({
              value: item => item.time,
              format: 'HH:mm',
              timezone: 'UTC',
            })
            .addDateColumn({
              value: item => item.time,
              format: 'HH:mm:ss',
              timezone: 'UTC',
            })
            .addDateColumn({
              value: item => item.time,
              format: 'shortTime',
              timezone: 'UTC',
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['16:20', '16:20:45', '4:20 PM'],
        ]);
      });

      it('should localize time', async () => {
        TestBed.overrideProvider(LOCALE_ID, {useValue: 'de-CH'});
        registerLocaleData(localeDeCH);
        registerLocaleData(localeEnCH);

        const locale = TestBed.inject(SCI_LOCALE);
        const columnLocale = linkedSignal(locale);

        const data = signal([{time: 'T16:20:45Z'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addDateColumn({
              value: item => item.time,
              format: 'longTime',
              timezone: 'UTC',
            })
            .addDateColumn({
              value: item => item.time,
              format: 'fullTime',
              locale: columnLocale,
              timezone: 'UTC',
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['16:20:45 GMT+0', '16:20:45 GMT+00:00'],
        ]);

        // Expect global locale to be 'de-CH'.
        expect(locale()).toEqual('de-CH');

        // Change global locale to 'en-US'.
        locale.set('en-US');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['4:20:45 PM GMT+0', '4:20:45 PM GMT+00:00'],
        ]);

        // Change column locale to 'en-CH'.
        columnLocale.set('en-CH');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['4:20:45 PM GMT+0', '16:20:45 GMT+00:00'],
        ]);
      });

      it('should display time in specified timezone', async () => {
        const data = signal([{time: 'T16:20:45Z'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table
            .addDateColumn({
              value: item => item.time,
              format: 'HH:mm:ss',
              timezone: '+0000',
            })
            .addDateColumn({
              value: item => item.time,
              format: 'HH:mm:ss',
              timezone: '+0100',
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['16:20:45', '17:20:45'],
        ]);
      });

      it('should default to DATE_PIPE_DEFAULT_OPTIONS.timezone', async () => {
        TestBed.overrideProvider(DATE_PIPE_DEFAULT_OPTIONS, {useValue: {timezone: '+0500'} satisfies DatePipeConfig});

        const data = signal([{time: 'T16:20:45Z'}]);

        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addDateColumn({
            value: item => item.time,
            format: 'HH:mm:ss',
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['21:20:45'],
        ]);
      });

      it('should have tabular (monospaced) figures', async () => {
        const data = signal([{time: 'T16:20:45Z'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addDateColumn(item => item.time),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(getComputedStyle(table.row({nth: 0}).cells[0]!.element!).fontVariantNumeric).toEqual('tabular-nums');
      });

      it('should disable tabular (monospaced) figures via CSS', async () => {
        const data = signal([{time: 'T16:20:45Z'}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          columns: table => table.addDateColumn(item => item.time),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        // Disable tabular figures via CSS.
        const styleSheet = new CSSStyleSheet();
        styleSheet.insertRule(`
          sci-table::part(column\\:date) {
            font-variant-numeric: normal;
          }
        `);
        document.adoptedStyleSheets.push(styleSheet);
        TestBed.inject(DestroyRef).onDestroy(() => Arrays.remove(document.adoptedStyleSheets, styleSheet));

        expect(getComputedStyle(table.row({nth: 0}).cells[0]!.element!).fontVariantNumeric).toEqual('normal');
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

    it('should be in state loading while preloading cell values', async () => {
      const preloader = new class implements SciTableCellValuePreloader {
        public readonly loading = signal(false);
        public readonly queue = noop;
      }();
      TestBed.overrideProvider(SciTableCellValuePreloader, {useValue: preloader});

      const {fixture, model} = createSciTableComponent(sciTable({
        datasource: signal([]),
        columns: table => table,
        injector: TestBed.inject(Injector),
      }));
      const table = new TablePO(fixture);

      // Simulate preloading cell values.
      preloader.loading.set(true);
      await fixture.whenStable();
      expect(model.loading()).toEqual(true);
      expect(table.loadingIndicator).toBeDefined();

      // Simulate completed preloading cell values.
      preloader.loading.set(false);
      await fixture.whenStable();

      expect(model.loading()).toEqual(false);
      expect(table.loadingIndicator).toBeNull();
    });

    describe('Sorting', () => {

      it('should be sortable (defaults)', async () => {
        const data = signal(new Array<{string: string; number: number; boolean: boolean; date: string}>());
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
            .addDateColumn({
              name: 'column:date',
              value: item => item.date,
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
        expect(table.column({name: 'column:date'})!.sortable).toBeTrue();
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
        expect(table.column({name: 'column:date'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:component'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:template'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:component-sortable'})!.sortable).toBeFalse();
        expect(table.column({name: 'column:template-sortable'})!.sortable).toBeFalse();
      });

      it('should sort string column', async () => {
        const data = signal([{string: 'b'}, {string: 'c'}, {string: undefined}, {string: 'a'}]);

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
        expect(await column.values()).toEqual(['a', 'b', 'c', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['c', 'b', 'a', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['b', 'c', '', 'a']);
      });

      it('should sort number column', async () => {
        const data = signal([{number: 1}, {number: 3}, {number: undefined}, {number: 2}]);
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
        expect(await column.values()).toEqual(['1', '2', '3', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['3', '2', '1', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '3', '', '2']);
      });

      it('should sort boolean column', async () => {
        const data = signal([{boolean: true}, {boolean: false}, {boolean: undefined}, {boolean: true}]);
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
        expect(await column.values()).toEqual(['clear', 'checkmark', 'checkmark', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['checkmark', 'checkmark', 'clear', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['checkmark', 'clear', '', 'checkmark']);
      });

      it('should sort date column', async () => {
        const date1 = new Date('2026-05-30').getTime();
        const date2 = new Date('2026-06-15');
        const date3 = '2025-04-15';
        const date4 = '2026-02-17T08:16:00.000Z';
        const date5 = '2026-10-04T11:54:43+02:00';

        const data = signal([{date: date1}, {date: date2}, {date: date3}, {date: date4}, {date: undefined}, {date: date5}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addDateColumn({
            name: 'column:date',
            value: item => item.date,
            format: 'dd.MM.yyyy',
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:date'})!;
        expect(await column.values()).toEqual(['30.05.2026', '15.06.2026', '15.04.2025', '17.02.2026', '', '04.10.2026']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['15.04.2025', '17.02.2026', '30.05.2026', '15.06.2026', '04.10.2026', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['04.10.2026', '15.06.2026', '30.05.2026', '17.02.2026', '15.04.2025', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['30.05.2026', '15.06.2026', '15.04.2025', '17.02.2026', '', '04.10.2026']);
      });

      it('should sort time column', async () => {
        const data = signal([
          {row: '1', time: '2025-02-20T08:16:43Z'},
          {row: '2', time: 'T11:55:29+02:00'},
          {row: '3', time: '15:15:08Z'},
          {row: '4', time: 'T15:15:08Z'},
          {row: '5', time: '2025-02-17T10:16:43Z'},
          {row: '6', time: '2025-02-17T09:16:43Z'},
          {row: '7', time: '2025-02-17T09:16:43.000Z'},
          {row: '8', time: '2025-02-17T09:15:43Z'},
          {row: '9', time: '2024-02-17T09:15:43Z'},
          {row: '10', time: undefined},
          {row: '11', time: '2024-10-13:20:00+02:00'},
        ]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
            })
            .addDateColumn({
              name: 'column:time',
              value: item => item.time,
              format: 'HH:mm:ss',
              timezone: 'UTC',
            })
            .addStringColumn({
              name: 'column:string',
              value: item => item.time,
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:time'})!;

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', '08:16:43', '2025-02-20T08:16:43Z'],
          ['2', '09:55:29', 'T11:55:29+02:00'],
          ['3', '15:15:08', '15:15:08Z'],
          ['4', '15:15:08', 'T15:15:08Z'],
          ['5', '10:16:43', '2025-02-17T10:16:43Z'],
          ['6', '09:16:43', '2025-02-17T09:16:43Z'],
          ['7', '09:16:43', '2025-02-17T09:16:43.000Z'],
          ['8', '09:15:43', '2025-02-17T09:15:43Z'],
          ['9', '09:15:43', '2024-02-17T09:15:43Z'],
          ['10', '', ''],
          ['11', '18:00:00', '2024-10-13:20:00+02:00'],
        ]);

        await column.toggleSort();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', '09:55:29', 'T11:55:29+02:00'],
          ['3', '15:15:08', '15:15:08Z'],
          ['4', '15:15:08', 'T15:15:08Z'],
          ['9', '09:15:43', '2024-02-17T09:15:43Z'],
          ['11', '18:00:00', '2024-10-13:20:00+02:00'],
          ['8', '09:15:43', '2025-02-17T09:15:43Z'],
          ['6', '09:16:43', '2025-02-17T09:16:43Z'],
          ['7', '09:16:43', '2025-02-17T09:16:43.000Z'],
          ['5', '10:16:43', '2025-02-17T10:16:43Z'],
          ['1', '08:16:43', '2025-02-20T08:16:43Z'],
          ['10', '', ''],
        ]);

        await column.toggleSort();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', '08:16:43', '2025-02-20T08:16:43Z'],
          ['5', '10:16:43', '2025-02-17T10:16:43Z'],
          ['6', '09:16:43', '2025-02-17T09:16:43Z'],
          ['7', '09:16:43', '2025-02-17T09:16:43.000Z'],
          ['8', '09:15:43', '2025-02-17T09:15:43Z'],
          ['11', '18:00:00', '2024-10-13:20:00+02:00'],
          ['9', '09:15:43', '2024-02-17T09:15:43Z'],
          ['3', '15:15:08', '15:15:08Z'],
          ['4', '15:15:08', 'T15:15:08Z'],
          ['2', '09:55:29', 'T11:55:29+02:00'],
          ['10', '', ''],
        ]);

        await column.toggleSort();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', '08:16:43', '2025-02-20T08:16:43Z'],
          ['2', '09:55:29', 'T11:55:29+02:00'],
          ['3', '15:15:08', '15:15:08Z'],
          ['4', '15:15:08', 'T15:15:08Z'],
          ['5', '10:16:43', '2025-02-17T10:16:43Z'],
          ['6', '09:16:43', '2025-02-17T09:16:43Z'],
          ['7', '09:16:43', '2025-02-17T09:16:43.000Z'],
          ['8', '09:15:43', '2025-02-17T09:15:43Z'],
          ['9', '09:15:43', '2024-02-17T09:15:43Z'],
          ['10', '', ''],
          ['11', '18:00:00', '2024-10-13:20:00+02:00'],
        ]);
      });

      it('should sort string column with custom sort comparator', async () => {
        const data = signal(['1', '3', undefined, '2']);
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

        expect(await column.values()).toEqual(['1', '3', '', '2']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['3', '2', '1', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '2', '3', '']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '3', '', '2']);
      });

      it('should sort component column with custom sort comparator', async () => {
        const data = signal([1, 3, 2]);
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

        expect(await column.values()).toEqual(['1', '3', '2']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['3', '2', '1']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '3', '2']);
      });

      it('should sort template column with custom sort comparator', async () => {
        const templateFixture = TestBed.createComponent(CustomColumnTemplateProviderComponent);

        const data = signal([1, 3, 2]);
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

        expect(await column.values()).toEqual(['1', '3', '2']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '2', '3']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['3', '2', '1']);

        await column.toggleSort();
        expect(await column.values()).toEqual(['1', '3', '2']);
      });
    });

    describe('Filtering (per Column)', () => {

      it('should be filterable (defaults)', async () => {
        const data = signal(new Array<{string: string; number: number; boolean: boolean; date: string}>());
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
            .addDateColumn({
              name: 'column:date',
              value: item => item.date,
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
        expect(table.column({name: 'column:date'})!.filterable).toBeFalse();
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
        expect(table.column({name: 'column:date'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:component'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:template'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:component-filterable'})!.filterable).toBeTrue();
        expect(table.column({name: 'column:template-filterable'})!.filterable).toBeTrue();
      });

      it('should filter string column', async () => {
        const data = signal([{string: 'a'}, {string: 'c'}, {string: undefined}, {string: 'b'}]);
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
        expect(await column.values()).toEqual(['a', 'c', '', 'b']);
      });

      it('should filter number column', async () => {
        const data = signal([{number: 1}, {number: 3}, {number: undefined}, {number: 2}]);
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
        expect(await column.values()).toEqual(['1', '3', '', '2']);
      });

      it('should filter boolean column', async () => {
        const data = signal([{boolean: true}, {boolean: false}, {boolean: undefined}, {boolean: true}]);
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
        expect(await column.values()).toEqual(['checkmark', 'clear', '', 'checkmark']);
      });

      it('should filter date column', async () => {
        const date1 = new Date('2026-05-30').getTime();
        const date2 = new Date('2026-06-15');
        const date3 = '2025-04-15';
        const date4 = '2026-02-17T08:16:00.000Z';
        const date5 = '2026-10-04T11:54:43+02:00';

        const data = signal([{date: date1}, {date: date2}, {date: date3}, {date: date4}, {date: undefined}, {date: date5}]);
        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table.addDateColumn({
            name: 'column:date',
            value: item => item.date,
            format: 'dd.MM.yyyy',
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:date'})!;
        expect(await column.values()).toEqual(['30.05.2026', '15.06.2026', '15.04.2025', '17.02.2026', '', '04.10.2026']);

        await column.filter('2026');
        expect(await column.values()).toEqual(['30.05.2026', '15.06.2026', '17.02.2026', '04.10.2026']);

        await column.filter('2025');
        expect(await column.values()).toEqual(['15.04.2025']);

        await column.filter('15.06.2026');
        expect(await column.values()).toEqual(['15.06.2026']);

        await column.filter('11:54:43'); // Time of date 5 (not displayed)
        expect(await column.values()).toEqual([]);

        await column.filter('06');
        expect(await column.values()).toEqual(['15.06.2026']);

        await column.filter('15');
        expect(await column.values()).toEqual(['15.06.2026', '15.04.2025']);

        await column.filter('');
        expect(await column.values()).toEqual(['30.05.2026', '15.06.2026', '15.04.2025', '17.02.2026', '', '04.10.2026']);
      });

      it('should filter string column with custom filter matcher', async () => {
        const data = signal([{name: 'alpha'}, {name: 'beta'}, {name: undefined}, {name: 'gamma'}]);
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
        expect(await column.values()).toEqual(['alpha', 'beta', '', 'gamma']);
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

      it('should filter by multiple column filters', async () => {
        const data = signal([
          {value1: '1', value2: 'a'},
          {value1: '1', value2: undefined},
          {value1: '3', value2: 'c'},
        ]);

        const {fixture} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table
            .addStringColumn({
              name: 'column:1',
              value: item => item.value1,
            })
            .addStringColumn({
              name: 'column:2',
              value: item => item.value2,
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column1 = table.column({name: 'column:1'})!;
        const column2 = table.column({name: 'column:2'})!;

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'a'],
          ['1', ''],
          ['3', 'c'],
        ]);

        await column1.filter('1');
        await column2.filter('a');
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'a'],
        ]);

        await column1.filter('1');
        await column2.filter(null);
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'a'],
          ['1', ''],
        ]);

        await column1.filter(null);
        await column2.filter('a');
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'a'],
        ]);
      });
    });

    describe('Filtering (per Table)', () => {

      it('should filter string column using a global filter', async () => {
        const data = signal([{row: '1', string: 'alpha'}, {row: '2', string: 'beta'}, {row: '3', string: 'gamma'}, {row: '4', string: undefined}]);
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
          ['4', ''],
        ]);
      });

      it('should filter number column using a global filter', async () => {
        const data = signal([{row: '1', number: 0}, {row: '2', number: 1}, {row: '3', number: 10}, {row: '4', number: 11}, {row: '5', number: undefined}]);
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

        model.filter(null);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', '0'],
          ['2', '1'],
          ['3', '10'],
          ['4', '11'],
          ['5', ''],
        ]);
      });

      it('should filter boolean column using a global filter', async () => {
        const data = signal([{row: '1', boolean: true}, {row: '2', boolean: false}, {row: '3', boolean: true}, {row: '4', boolean: false}, {row: '5', boolean: undefined}]);
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

        model.filter(null);
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'checkmark'],
          ['2', 'clear'],
          ['3', 'checkmark'],
          ['4', 'clear'],
          ['5', ''],
        ]);
      });

      it('should filter date column using a global filter', async () => {
        const date1 = new Date('2026-05-30').getTime();
        const date2 = new Date('2026-06-15');
        const date3 = '2025-04-15';
        const date4 = '2026-02-17T08:16:00.000Z';
        const date5 = '2026-10-04T11:54:43+02:00';

        const data = signal([{row: '1', date: date1}, {row: '2', date: date2}, {row: '3', date: date3}, {row: '4', date: date4}, {row: '5', date: date5}, {row: '6', date: undefined}]);
        const {fixture, model} = createSciTableComponent(sciTable({
          datasource: data,
          filterable: true,
          columns: table => table
            .addStringColumn({
              name: 'column:row',
              value: item => item.row,
              filterable: {matcher: () => false}, // exclude from filtering
            })
            .addDateColumn({
              name: 'column:date',
              value: item => item.date,
              format: 'dd.MM.yyyy',
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', '30.05.2026'],
          ['2', '15.06.2026'],
          ['3', '15.04.2025'],
          ['4', '17.02.2026'],
          ['5', '04.10.2026'],
          ['6', ''],
        ]);

        model.filter('2026');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', '30.05.2026'],
          ['2', '15.06.2026'],
          ['4', '17.02.2026'],
          ['5', '04.10.2026'],
        ]);

        model.filter('2025');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['3', '15.04.2025'],
        ]);

        model.filter('15.06.2026');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', '15.06.2026'],
        ]);

        model.filter('11:54:43');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([]);

        model.filter('06');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', '15.06.2026'],
        ]);

        model.filter('15');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', '15.06.2026'],
          ['3', '15.04.2025'],
        ]);

        model.filter('');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', '30.05.2026'],
          ['2', '15.06.2026'],
          ['3', '15.04.2025'],
          ['4', '17.02.2026'],
          ['5', '04.10.2026'],
          ['6', ''],
        ]);
      });

      it('should filter component column using a global filter (without comparator)', async () => {
        const data = signal([{row: '1', string: 'alpha'}, {row: '2', string: 'beta'}, {row: '3', string: 'gamma'}, {row: '4', string: undefined}]);
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

        model.filter('noop');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha'],
          ['2', 'beta'],
          ['3', 'gamma'],
          ['4', ''],
        ]);
      });

      it('should filter component column using a global filter (with comparator)', async () => {
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

      it('should filter template column using a global filter (without comparator)', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

        const data = signal([{row: '1', string: 'alpha'}, {row: '2', string: 'beta'}, {row: '3', string: 'gamma'}, {row: '4', string: undefined}]);
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

        model.filter('noop');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha'],
          ['2', 'beta'],
          ['3', 'gamma'],
          ['4', ''],
        ]);
      });

      it('should filter template column using a global filter (with comparator)', async () => {
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

      it('should filter cross-column using a global filter', async () => {
        const data = signal([
          {row: '1', string: 'alpha', number: 2, boolean: true, undefined: undefined},
          {row: '2', string: 'beta', number: 1, boolean: false, undefined: undefined},
          {row: '3', string: 'gamma', number: 0, boolean: true, undefined: undefined},
          {row: '4', string: 'delta', number: 10, boolean: false, undefined: undefined},
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
            })
            .addStringColumn({
              name: 'column:undefined',
              value: item => item.undefined,
            }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();

        model.filter('alpha');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark', ''],
        ]);

        model.filter('a');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark', ''],
          ['2', 'beta', '1', 'clear', ''],
          ['3', 'gamma', '0', 'checkmark', ''],
          ['4', 'delta', '10', 'clear', ''],
        ]);

        model.filter('b');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'beta', '1', 'clear', ''],
        ]);

        model.filter('true');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark', ''],
          ['3', 'gamma', '0', 'checkmark', ''],
        ]);

        model.filter('false');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'beta', '1', 'clear', ''],
          ['4', 'delta', '10', 'clear', ''],
        ]);

        model.filter('0');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['2', 'beta', '1', 'clear', ''],
          ['3', 'gamma', '0', 'checkmark', ''],
          ['4', 'delta', '10', 'clear', ''],
        ]);

        model.filter('1');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark', ''],
          ['2', 'beta', '1', 'clear', ''],
          ['3', 'gamma', '0', 'checkmark', ''],
        ]);

        model.filter('2');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['1', 'alpha', '2', 'checkmark', ''],
        ]);

        model.filter('10');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([
          ['4', 'delta', '10', 'clear', ''],
        ]);

        model.filter('11');
        await table.waitUntilStable();
        expect(table.rows.map(row => row.cells.map(cell => cell.value))).toEqual([]);
      });

      it('should call custom column filter matcher using a global filter', async () => {
        const data = signal([{string: 'alpha'}, {string: 'beta'}, {string: 'gamma'}, {string: undefined}]);
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
        expect(await column.values()).toEqual(['alpha', 'beta', 'gamma', '']);
      });
    });
  });

  describe('Pageable Data Source', () => {

    it('should cache pages', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: loader,
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
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 0, end: 5, page: 0, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 5, end: 10, page: 1, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(2);
      loader.calls.reset();

      // Scroll down to row 20
      await table.scrollY({y: 20 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 20, end: 30}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 20, end: 25, page: 4, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 25, end: 30, page: 5, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(2);
      loader.calls.reset();

      // Scroll up to row 0
      await table.scrollY({y: 0});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 0, end: 10}, i => `${i}`));

      // Expect page not to be loaded again.
      expect(loader).not.toHaveBeenCalled();
    });

    it('should load pages based on pageSize [pageSize=5]', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture} = createSciTableComponent(sciTable<number>({
        bufferSize: 3,
        pageSize: 5,
        ɵdatasource: loader,
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
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 0, end: 5, page: 0, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 5, end: 10, page: 1, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 10, end: 15, page: 2, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(3);
      loader.calls.reset();

      // Scroll down to row 4
      // Buffer before:    [1,2,3]
      // Rows in Viewport: [4,..,13]
      // Buffer after:     [14,15,16]
      await table.scrollY({y: 4 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 1, end: 17}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 15, end: 20, page: 3, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      // Scroll down to row 40
      // Buffer before:    [37,38,39]
      // Rows in Viewport: [40,..,49]
      // Buffer after:     [50,51,52]
      await table.scrollY({y: 40 * 30});
      expect(await table.column({index: 0})?.values({rows: 'dom'})).toEqual(generateData({start: 37, end: 53}, i => `${i}`));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 35, end: 40, page: 7, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 40, end: 45, page: 8, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 45, end: 50, page: 9, pageSize: 5}));
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 50, end: 55, page: 10, pageSize: 5}));
      expect(loader).toHaveBeenCalledTimes(4);
    });

    it('should load pages based on pageSize [pageSize=50]', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => ({
        totalCount: 1_000,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture} = createSciTableComponent(sciTable<number>({
        bufferSize: 3,
        pageSize: 50,
        ɵdatasource: loader,
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
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 0, end: 50, page: 0, pageSize: 50}));
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
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 50, end: 100, page: 1, pageSize: 50}));
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should allow global filtering', async () => {
      const data = generateData(100, i => i);
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => {
        const filtered = data.filter(item => !request.tableFilter || `${item}` === request.tableFilter);
        return {
          items: filtered.slice(request.start, request.end),
          totalCount: filtered.length,
        };
      });

      const {fixture, model} = createSciTableComponent(sciTable<number>({
        ɵdatasource: loader,
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

      loader.calls.reset();
      model.filter('50');
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledOnceWith(jasmine.objectContaining<SciTablePageRequest>({
        tableFilter: '50',
        columnFilters: [],
      }));
      expect(await table.column({name: 'column:1'})!.values()).toEqual(['50']);
    });

    it('should filter', async () => {
      const data = generateData(100, i => ({id: `ID: ${i}`, name: `Name: ${i}`}));
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<{id: string; name: string}> => {
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

      const {fixture, model} = createSciTableComponent<{id: string; name: string}>(sciTable({
        ɵdatasource: loader,
        datasource: ɵillegaldatasource(),
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
      loader.calls.reset();

      // Filter by 'column:id'.
      model.filter('ID: 5', {columnName: 'column:id'});
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
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

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 0, end: 20, page: 0, pageSize: 20, columnFilters: []}));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));
      loader.calls.reset();

      // Filter by 'column:name'.
      model.filter('Name: 10', {columnName: 'column:name'});
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
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
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
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
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
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
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<{id: string; name: string}> => {
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

      const {fixture, model} = createSciTableComponent<{id: string; name: string}>(sciTable({
        ɵdatasource: loader,
        datasource: ɵillegaldatasource(),
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

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 20, end: 40, page: 1, pageSize: 20}));
      expect(await table.column({name: 'column:id'})!.values({rows: 'all'})).toEqual(generateData(100, i => `ID: ${i}`));
      expect(await table.column({name: 'column:name'})!.values({rows: 'all'})).toEqual(generateData(100, i => `Name: ${i}`));
      loader.calls.reset();

      // Filter by 'column:id'.
      model.filter('ID: 5', {columnName: 'column:id'});
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
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
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => {
        const sortCriterion = request.sortCriteria.find(criterion => criterion.columnName === 'column:1');
        const sorted = sortCriterion?.direction === 'asc' ? [...data] : [...data].reverse();
        return {
          items: sorted.slice(request.start, request.end),
          totalCount: sorted.length,
        };
      });

      const {fixture} = createSciTableComponent<number>(sciTable({
        ɵdatasource: loader,
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
      loader.calls.reset();

      // Sort 'column:1' in ascending order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        sortCriteria: [{columnName: 'column:1', direction: 'asc'}],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`));
      loader.calls.reset();

      // Sort 'column:1' in descening order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        sortCriteria: [{columnName: 'column:1', direction: 'desc'}],
      }));
      expect(await table.column({name: 'column:1'})!.values({rows: 'all'})).toEqual(generateData(100, i => i).map(i => `${i}`).reverse());
      loader.calls.reset();

      // Reset sort for 'column:1'.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 0, end: 20, page: 0, pageSize: 20}));
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('should scroll to top on sort', async () => {
      const data = generateData(100, i => i);
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => {
        const sortCriterion = request.sortCriteria.find(criterion => criterion.columnName === 'column:1');
        const sorted = sortCriterion?.direction === 'asc' ? [...data] : [...data].reverse();
        return {
          items: sorted.slice(request.start, request.end),
          totalCount: sorted.length,
        };
      });

      const {fixture} = createSciTableComponent<number>(sciTable({
        ɵdatasource: loader,
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

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 20, end: 40, page: 1, pageSize: 20}));
      loader.calls.reset();

      // Sort 'column:1' in ascending order.
      await table.column({name: 'column:1'})!.toggleSort();
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        start: 0, end: 20, page: 0, pageSize: 20,
        sortCriteria: [{columnName: 'column:1', direction: 'asc'}],
      }));
      expect(loader).toHaveBeenCalledTimes(1);
      expect(table.scrollTop).toBe(0);
    });

    it('should load data from observable', async () => {
      const data$ = new BehaviorSubject<string[]>([]);
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): Observable<SciTablePageResponse<string>> => data$
        .pipe(map(data => ({
          items: data.slice(request.start, request.end),
          totalCount: data.length,
        }))),
      );

      const {fixture} = createSciTableComponent(sciTable<string>({
        ɵdatasource: loader,
        datasource: ɵillegaldatasource(),
        columns: table => table.addStringColumn({
          name: 'column:1',
          value: item => item,
        }),
        injector: TestBed.inject(Injector),
      }), {height: '300px'});

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

    // TODO [ego] add test that previous call is canceled

    it('should cancel load', async () => {
      const loaded = new Array<SciTablePageRequest>();
      const onLoad$ = new Subject<void>();
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): Observable<SciTablePageResponse<number>> => onLoad$
        .pipe(
          take(1), // TODO [ego] Remove when previous fetch is canceled.
          map(() => ({
            totalCount: 100,
            items: generateData(request.pageSize, i => request.start + i),
          })),
          tap(() => loaded.push(request)),
        ));

      const {fixture} = createSciTableComponent(sciTable<number>({
        pageSize: 10,
        bufferSize: 0,
        ɵdatasource: loader,
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

      // Continue initial loader response (so scrolling is possible).
      onLoad$.next();
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({page: 0}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      // Scroll one page.
      await table.scrollY({deltaY: 300});
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({page: 1}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      // Scroll again before loader response.
      await table.scrollY({deltaY: 300});
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({page: 2}));
      expect(loader).toHaveBeenCalledTimes(1);
      loader.calls.reset();

      onLoad$.next();
      await table.waitUntilStable();

      // Expect to only have loaded the initial page and the last.
      expect(loaded).toEqual([
        jasmine.objectContaining<SciTablePageRequest>({page: 0}),
        jasmine.objectContaining<SciTablePageRequest>({page: 2}),
      ]);
    });

    it('should load and select all rows on Ctrl+a', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => ({
        totalCount: 100,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const {fixture, model} = createSciTableComponent(sciTable<number>({
        ɵdatasource: loader,
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
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => {
        return ({
          totalCount: 11,
          items: generateData(request.pageSize, i => request.start + i),
        });
      });

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: loader,
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

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 0, end: 50, page: 0, pageSize: 50}));
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
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => {
        return ({
          totalCount: 11,
          items: generateData(request.pageSize, i => request.start + i),
        });
      });

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: loader,
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

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({start: 0, end: 50, page: 0, pageSize: 50}));
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
      const loader = jasmine.createSpy().and.callFake((): Observable<SciTablePageResponse<number>> => NEVER);

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: loader,
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

    it('should call data loader function in injection context', async () => {
      let injector: Injector | undefined;

      const {fixture} = createSciTableComponent(table({
        ɵdatasource: () => {
          injector = inject(Injector);
          return {items: [1, 2, 3], totalCount: 3};
        },
        datasource: ɵillegaldatasource(),
        columns: table => table,
        injector: TestBed.inject(Injector),
      }));

      await fixture.whenStable();
      expect(injector).toBeDefined();
    });

    it('should not call data loader function in reactive context', async () => {
      const loaderFn: SciTableDataLoaderFn<any> = () => {
        assertNotInReactiveContext(loaderFn);
        return {items: [1, 2, 3], totalCount: 3};
      };

      const {fixture, model} = createSciTableComponent(table({
        ɵdatasource: loaderFn,
        datasource: ɵillegaldatasource(),
        columns: table => table,
        injector: TestBed.inject(Injector),
      }));

      await fixture.whenStable();
      expect(model.error()).toBeUndefined();
    });

    it('should destroy previous data loader function injection context', async () => {
      const destroyRefs = new Array<DestroyRef>();

      const {fixture, model} = createSciTableComponent(table({
        ɵdatasource: () => {
          destroyRefs.push(inject(DestroyRef));
          return {items: [1, 2, 3], totalCount: 3};
        },
        datasource: ɵillegaldatasource(),
        columns: table => table,
        injector: TestBed.inject(Injector),
      }));

      await fixture.whenStable();
      expect(destroyRefs).toHaveSize(1);
      expect(destroyRefs[0]!.destroyed).toBeFalse();

      // Force reload of page 1.
      model.filter('reload 1');
      await fixture.whenStable();
      expect(destroyRefs).toHaveSize(2);
      expect(destroyRefs[0]!.destroyed).toBeTrue();
      expect(destroyRefs[1]!.destroyed).toBeFalse();

      // Force reload of page 2.
      model.filter('reload 2');
      await fixture.whenStable();
      expect(destroyRefs).toHaveSize(3);
      expect(destroyRefs[0]!.destroyed).toBeTrue();
      expect(destroyRefs[1]!.destroyed).toBeTrue();
      expect(destroyRefs[2]!.destroyed).toBeFalse();
    });

    it('should remove stale column filter when removing column', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => ({
        totalCount: 10,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const visibleColumns = signal(new Set<`column:${string}`>(['column:1', 'column:2']));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: loader,
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

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({columnFilters: []}));
      loader.calls.reset();

      // Filter by 'column:1'.
      await table.column({name: 'column:1'})!.filter(1);
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        columnFilters: [
          {columnName: 'column:1', text: 1},
        ],
      }));
      loader.calls.reset();

      // Filter by 'column:2'.
      await table.column({name: 'column:2'})!.filter(2);
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        columnFilters: [
          {columnName: 'column:1', text: 1},
          {columnName: 'column:2', text: 2},
        ],
      }));
      loader.calls.reset();

      // Remove 'column:1'.
      visibleColumns.update(columns => deleteFromSet(columns, 'column:1'));
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        columnFilters: [
          {columnName: 'column:2', text: 2},
        ],
      }));
      loader.calls.reset();

      // Remove 'column:2'.
      visibleColumns.update(columns => deleteFromSet(columns, 'column:2'));
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({columnFilters: []}));
      loader.calls.reset();
    });

    it('should remove stale column sort criteria when removing column', async () => {
      const loader = jasmine.createSpy().and.callFake((request: SciTablePageRequest): SciTablePageResponse<number> => ({
        totalCount: 10,
        items: generateData(request.pageSize, i => request.start + i),
      }));

      const visibleColumns = signal(new Set<`column:${string}`>(['column:1', 'column:2']));

      const {fixture} = createSciTableComponent(sciTable<number>({
        ɵdatasource: loader,
        datasource: ɵillegaldatasource(),
        columns: table => visibleColumns().forEach(column => table.addNumberColumn({
          name: column,
          value: item => item,
        })),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({sortCriteria: []}));
      loader.calls.reset();

      // Sort by 'column:1'.
      await table.column({name: 'column:1'})!.toggleSort();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        sortCriteria: [
          {columnName: 'column:1', direction: 'asc'},
        ],
      }));
      loader.calls.reset();

      // Sort by 'column:2'.
      await table.column({name: 'column:2'})!.toggleSort({ctrl: true});
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        sortCriteria: [
          {columnName: 'column:1', direction: 'asc'},
          {columnName: 'column:2', direction: 'asc'},
        ],
      }));
      loader.calls.reset();

      // Sort by 'column:2'.
      await table.column({name: 'column:2'})!.toggleSort({ctrl: true});
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        sortCriteria: [
          {columnName: 'column:1', direction: 'asc'},
          {columnName: 'column:2', direction: 'desc'},
        ],
      }));
      loader.calls.reset();

      // Remove 'column:1'.
      visibleColumns.update(columns => deleteFromSet(columns, 'column:1'));
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
        sortCriteria: [
          {columnName: 'column:2', direction: 'desc'},
        ],
      }));
      loader.calls.reset();

      // Remove 'column:2'.
      visibleColumns.update(columns => deleteFromSet(columns, 'column:2'));
      await table.waitUntilStable();
      expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({sortCriteria: []}));
      loader.calls.reset();
    });

    describe('Filtering', () => {

      it('should filter string column', async () => {
        const loader = jasmine.createSpy().and.callFake((): SciTablePageResponse<{string: string}> => {
          return {items: [], totalCount: 0};
        });

        const {fixture} = createSciTableComponent<{string: string}>(sciTable({
          ɵdatasource: loader,
          datasource: ɵillegaldatasource(),
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
        loader.calls.reset();

        await column.filter('abc');
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [
            {columnName: 'column:string', text: 'abc'},
          ],
        }));
        loader.calls.reset();

        await column.filter('');
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [],
        }));
      });

      it('should filter number column', async () => {
        const loader = jasmine.createSpy().and.callFake((): SciTablePageResponse<{number: number}> => {
          return {items: [], totalCount: 0};
        });

        const {fixture} = createSciTableComponent<{number: number}>(sciTable({
          ɵdatasource: loader,
          datasource: ɵillegaldatasource(),
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
        loader.calls.reset();

        await column.filter(123);
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [
            {columnName: 'column:number', text: 123},
          ],
        }));
        loader.calls.reset();

        await column.filter(null);
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [],
        }));
      });

      it('should filter boolean column', async () => {
        const loader = jasmine.createSpy().and.callFake((): SciTablePageResponse<{boolean: boolean}> => {
          return {items: [], totalCount: 0};
        });

        const {fixture} = createSciTableComponent<{boolean: boolean}>(sciTable({
          ɵdatasource: loader,
          datasource: ɵillegaldatasource(),
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
        loader.calls.reset();

        await column.filter(true);
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [
            {columnName: 'column:boolean', text: true},
          ],
        }));
        loader.calls.reset();

        await column.filter(null);
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [],
        }));
      });

      it('should filter date column', async () => {
        const loader = jasmine.createSpy().and.callFake((): SciTablePageResponse<{date: Date}> => {
          return {items: [], totalCount: 0};
        });

        const {fixture} = createSciTableComponent<{date: Date}>(sciTable({
          ɵdatasource: loader,
          datasource: ɵillegaldatasource(),
          filterable: true,
          columns: table => table.addDateColumn({
            name: 'column:date',
            value: item => item.date,
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:date'})!;
        loader.calls.reset();

        await column.filter('04.10.2026');
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [
            {columnName: 'column:date', text: '04.10.2026'},
          ],
        }));
        loader.calls.reset();

        await column.filter(null);
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [],
        }));
      });

      it('should filter component column', async () => {
        const loader = jasmine.createSpy().and.callFake((): SciTablePageResponse<string> => {
          return {items: [], totalCount: 0};
        });

        const {fixture} = createSciTableComponent<string>(sciTable({
          ɵdatasource: loader,
          datasource: ɵillegaldatasource(),
          filterable: true,
          columns: table => table.addComponentColumn({
            name: 'column:component',
            filterable: true,
            component: item => ({
              component: CustomColumnComponent,
              bindings: [inputBinding('value', () => item)],
            }),
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:component'})!;
        loader.calls.reset();

        await column.filter('abc');
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [
            {columnName: 'column:component', text: 'abc'},
          ],
        }));
        loader.calls.reset();

        await column.filter(null);
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [],
        }));
      });

      it('should filter template column', async () => {
        const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();
        const loader = jasmine.createSpy().and.callFake((): SciTablePageResponse<string> => {
          return {items: [], totalCount: 0};
        });

        const {fixture} = createSciTableComponent<string>(sciTable({
          ɵdatasource: loader,
          datasource: ɵillegaldatasource(),
          filterable: true,
          columns: table => table.addTemplateColumn({
            name: 'column:template',
            filterable: true,
            template: () => ({template}),
          }),
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        const column = table.column({name: 'column:template'})!;
        loader.calls.reset();

        await column.filter('abc');
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [
            {columnName: 'column:template', text: 'abc'},
          ],
        }));
        loader.calls.reset();

        await column.filter(null);
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          columnFilters: [],
        }));
      });

      it('should pass global filter', async () => {
        const loader = jasmine.createSpy().and.callFake((): SciTablePageResponse<unknown> => {
          return {items: [], totalCount: 0};
        });

        const {fixture, model} = createSciTableComponent(sciTable({
          ɵdatasource: loader,
          datasource: ɵillegaldatasource(),
          filterable: true,
          columns: table => table,
          injector: TestBed.inject(Injector),
        }));

        const table = new TablePO(fixture);
        await table.waitUntilStable();
        loader.calls.reset();

        model.filter('abc');
        await table.waitUntilStable();

        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          tableFilter: 'abc',
        }));
        loader.calls.reset();

        model.filter(null);
        await table.waitUntilStable();
        expect(loader).toHaveBeenCalledWith(jasmine.objectContaining<SciTablePageRequest>({
          tableFilter: undefined,
        }));
      });
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

    it('should style rows based on row state (selected/unselected, active/inactive)', async () => {
      const data = signal(['1', '2', '3']);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table.addStringColumn({name: 'column:column-name', value: item => item}),
        rowBindings: bindings => bindings.addPartBinding('row:row-binding'),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      // Expect state of row 1.
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).not.toContain('row:selected');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).not.toContain('row:active');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:not:selected');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:not:active');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('column:string');

      // Expect state of row 2.
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).not.toContain('row:selected');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).not.toContain('row:active');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:not:selected');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:not:active');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('column:string');

      // Expect state of row 3.
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).not.toContain('row:selected');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).not.toContain('row:active');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:not:selected');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:not:active');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('column:string');

      // Select row 2.
      table.row({nth: 1}).select();
      await table.waitUntilStable();
      expect(table.row({nth: 1}).isSelected()).toBeTrue();
      expect(table.row({nth: 1}).isActive()).toBeTrue();

      // Expect state of row 1.
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).not.toContain('row:selected');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).not.toContain('row:active');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:not:selected');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:not:active');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('column:string');

      // Expect state of row 2 (selected, active).
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:selected');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:active');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).not.toContain('row:not:selected');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).not.toContain('row:not:active');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('column:string');

      // Expect state of row 3.
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).not.toContain('row:selected');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).not.toContain('row:active');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:not:selected');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:not:active');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('column:string');

      // Activate row 3.
      table.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', ctrlKey: true}));
      await table.waitUntilStable();
      expect(table.row({nth: 1}).isSelected()).toBeTrue();
      expect(table.row({nth: 1}).isActive()).toBeFalse();
      expect(table.row({nth: 2}).isSelected()).toBeFalse();
      expect(table.row({nth: 2}).isActive()).toBeTrue();

      // Expect state of row 1.
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).not.toContain('row:selected');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).not.toContain('row:active');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:not:selected');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:not:active');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('column:string');

      // Expect state of row 2 (selected).
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:selected');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).not.toContain('row:active');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).not.toContain('row:not:selected');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:not:active');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 1}).cells[0]!.element!.getAttribute('part')).toContain('column:string');

      // Expect state of row 3 (active).
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).not.toContain('row:selected');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:active');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:not:selected');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).not.toContain('row:not:active');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('row:row-binding');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
      expect(table.row({nth: 2}).cells[0]!.element!.getAttribute('part')).toContain('column:string');
    });
  });

  describe('Column Bindings', () => {

    it('should style column based on the column name', async () => {
      const data = signal([{string: 'abc'}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table
          .addStringColumn({
            name: 'column:column-name',
            value: item => item.string,
          }),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('column:column-name');
    });

    it('should style column based on the column data type', async () => {
      const template = TestBed.createComponent(CustomColumnTemplateProviderComponent).componentInstance.template();

      const data = signal([{string: 'abc', number: 123, boolean: true, date: '2026-10-06'}]);
      const {fixture} = createSciTableComponent(sciTable({
        datasource: data,
        columns: table => table
          .addStringColumn(item => item.string)
          .addNumberColumn(item => item.number)
          .addBooleanColumn(item => item.boolean)
          .addDateColumn(item => item.date)
          .addComponentColumn({component: item => ({component: CustomColumnComponent, bindings: [inputBinding('value', () => item)]})})
          .addTemplateColumn({template: () => ({template})}),
        injector: TestBed.inject(Injector),
      }));

      const table = new TablePO(fixture);
      await table.waitUntilStable();

      expect(table.row({nth: 0}).cells[0]!.element!.getAttribute('part')).toContain('column:string');
      expect(table.row({nth: 0}).cells[1]!.element!.getAttribute('part')).toContain('column:number');
      expect(table.row({nth: 0}).cells[2]!.element!.getAttribute('part')).toContain('column:boolean');
      expect(table.row({nth: 0}).cells[3]!.element!.getAttribute('part')).toContain('column:date');
      expect(table.row({nth: 0}).cells[4]!.element!.getAttribute('part')).toContain('column:component');
      expect(table.row({nth: 0}).cells[5]!.element!.getAttribute('part')).toContain('column:template');
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
