import {SciColumnFilter, SciColumnType, SciSortCriterion, SciTableRequest, SciTableResponse} from '@scion/components/table';
import {linkedSignal, Service, signal, untracked} from '@angular/core';
import {defer, Observable, of, timer} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {map, switchMap} from 'rxjs/operators';

@Service()
export class ProductService {

  public readonly productCount = signal(10_000);

  public readonly products = linkedSignal(() => {
    const count = this.productCount();
    return untracked(() => Products.generate(count));
  });

  private readonly _products$ = toObservable(this.products);

  public getProducts$(request: SciTableRequest, columnDataTypes: Map<`column:${string}`, SciColumnType>, options?: {slowDataSource?: boolean}): Observable<SciTableResponse<Product>> {
    return defer(() => options?.slowDataSource ? timer(1000) : of(undefined))
      .pipe(
        switchMap(() => this._products$),
        map(products => Products.filter(products, request.columnFilters, request.globalFilter, columnDataTypes)),
        map(products => Products.sort(products, request.sortCriteria, columnDataTypes)),
        map(products => ({
          items: products.slice(request.start, request.end),
          totalCount: products.length,
        })),
      );
  }
}

export interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

export namespace Products {

  export function generate(count: number): Product[] {
    return Array.from(Array(count), (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      price: Math.floor(Math.random() * 1000) + 1,
      inStock: Math.random() > 0.5,
    }));
  }

  export function sort(companies: Product[], sortCriteria: SciSortCriterion[], columnDataTypes: Map<`column:${string}`, SciColumnType>): Product[] {
    return [...companies].sort((a, b) => {
      for (const sortCriterion of sortCriteria) {
        const ascendingComparison = (() => {
          switch (columnDataTypes.get(sortCriterion.columnName)) {
            case 'string':
              return a.name.localeCompare(b.name);
            case 'number':
              return a.price - b.price;
            case 'boolean':
              return Number(a.inStock) - Number(b.inStock);
            default:
              return 0;
          }
        })();

        if (ascendingComparison !== 0) {
          return sortCriterion.direction === 'desc' ? -ascendingComparison : ascendingComparison;
        }
      }

      return 0;
    });
  }

  export function filter(companies: Product[], filterCriteria: SciColumnFilter[], globalFilter: string | undefined, columnDataTypes: Map<`column:${string}`, SciColumnType>): Product[] {
    let copy = [...companies];
    for (const filterCriterion of filterCriteria) {
      const filterText = `${filterCriterion.text}`.toLocaleLowerCase();
      copy = copy.filter(company => {
        switch (columnDataTypes.get(filterCriterion.columnName)) {
          case 'string':
            return company.name.toLocaleLowerCase().includes(filterText);
          case 'number':
            return company.price.toString().includes(filterText);
          case 'boolean':
            return filterCriterion.text === company.inStock;
          default:
            return true;
        }
      });
    }

    if (globalFilter) {
      copy = copy.filter(company => {
        return Object.values(company).some(value => `${value}`.toLocaleLowerCase().includes(globalFilter.toLocaleLowerCase()));
      });
    }

    return copy;
  }
}
