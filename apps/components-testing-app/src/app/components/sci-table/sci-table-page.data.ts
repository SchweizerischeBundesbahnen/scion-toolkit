import {SciTableColumnFilter, SciTableColumnType, SciTablePageRequest, SciTablePageResponse, SciTableSortCriterion} from '@scion/components/table';
import {effect, inject, Injector, linkedSignal, Service, Signal, signal, untracked} from '@angular/core';
import {defer, mergeWith, NEVER, Observable, of, tap, timer} from 'rxjs';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {map, switchMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';

@Service()
export class ProductService {

  public readonly productCount = signal(10_000);

  public readonly products = linkedSignal(() => {
    const count = this.productCount();
    return untracked(() => Products.generate(count));
  });

  private readonly _products$ = toObservable(this.products);
  private readonly _httpClient = inject(HttpClient);

  public getProducts$(request: SciTablePageRequest, columnDataTypes: Map<`column:${string}`, SciTableColumnType>, options?: {slowDatasource?: boolean; simulateError?: Signal<boolean>}): Observable<SciTablePageResponse<Product>> {
    return defer(() => options?.slowDatasource ? timer(1000) : of(undefined))
      .pipe(
        mergeWith(simulateError$(options?.simulateError)),
        switchMap(() => this._products$),
        map(products => Products.filter(products, request.columnFilters, request.tableFilter, columnDataTypes)),
        map(products => Products.sort(products, request.sortCriteria, columnDataTypes)),
        map(products => ({
          items: products.slice(request.start, request.end),
          totalCount: products.length,
        })),
      );
  }

  /**
   * Loads products via HTTP from '/sci-table/products', until the calling injection context is destroyed.
   */
  public enableHttpLoader(): void {
    this._httpClient.post<Product[]>('/sci-table/products', undefined)
      .pipe(
        tap({subscribe: () => this.products.set([])}),
        takeUntilDestroyed(),
      )
      .subscribe(products => this.products.set(products));
  }
}

export interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
  expirationDate: string;
}

export namespace Products {

  export function generate(count: number): Product[] {
    return Array.from(Array(count), (_, i) => ({
      id: i + 1,
      name: `Product ${i + 1}`,
      price: randomNumber({integerDigits: 4, fractionDigits: 2}),
      inStock: Math.random() > 0.5,
      expirationDate: randomDate().toISOString(),
    }));
  }

  export function sort(companies: Product[], sortCriteria: SciTableSortCriterion[], columnDataTypes: Map<`column:${string}`, SciTableColumnType>): Product[] {
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

  export function filter(companies: Product[], filterCriteria: SciTableColumnFilter[], tableFilter: string | undefined, columnDataTypes: Map<`column:${string}`, SciTableColumnType>): Product[] {
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

    if (tableFilter) {
      copy = copy.filter(company => {
        return Object.values(company).some(value => `${value}`.toLocaleLowerCase().includes(tableFilter.toLocaleLowerCase()));
      });
    }

    return copy;
  }
}

export function simulateError$(simulateError: Signal<boolean> | undefined, options?: {injector?: Injector}): Observable<never> {
  const injector = options?.injector ?? inject(Injector);

  if (!simulateError) {
    return NEVER;
  }

  return new Observable<never>(observer => {
    const effectRef = effect(() => {
      if (simulateError()) {
        observer.error(new Error('[DatasourceError]'));
      }
    }, {injector});

    return () => effectRef.destroy();
  });
}

function randomDate(): Date {
  const from = new Date();
  const to = new Date();
  to.setFullYear(to.getFullYear() + 15);
  return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));
}

function randomNumber(options?: {integerDigits?: number; fractionDigits?: number}): number {
  const integerDigits = options?.integerDigits ?? 2;
  const fractionDigits = options?.fractionDigits ?? 0;
  return Math.trunc(Math.random() * Math.pow(10, integerDigits + fractionDigits)) / Math.pow(10, fractionDigits);
}
