import {computed, Signal} from '@angular/core';
import {SciTable} from './table.model';
import {SciDataSource} from './table-data-source';
import {SciTableFactory} from './table.factory';
import {ɵSciTableFactory} from './ɵtable.factory';
import {ɵSciTable} from './ɵtable.model';

export function table<T>(dataSource: SciDataSource<T>, factoryFn: (table: SciTableFactory<T>) => void): Signal<SciTable<T>>;
export function table<T>(data: Signal<T[]>, factoryFn: (table: SciTableFactory<T>) => void): Signal<SciTable<T>>;
export function table<T>(dataOrSource: Signal<T[]> | SciDataSource<T>, factoryFn: (table: SciTableFactory<T>) => void): Signal<SciTable<T>> {
  return computed(() => {
    const factory = new ɵSciTableFactory<T>();
    factoryFn(factory);
    return new ɵSciTable(factory, dataOrSource);
  });
}
