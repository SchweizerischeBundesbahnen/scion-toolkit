import {inject, linkedSignal, Service, Signal, signal, untracked} from '@angular/core';
import {defer, mergeWith, Observable, of, tap, timer} from 'rxjs';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {map, switchMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {SciTableColumnFilter, SciTableColumnType, SciTablePageRequest, SciTablePageResponse, SciTableSortCriterion} from '@scion/components/table';
import {simulateError$} from '../sci-table/sci-table-page.data';

@Service()
export class ProductService {

  public readonly productCount = signal(1_000);

  public readonly products = linkedSignal(() => {
    const count = this.productCount();
    return untracked(() => Products.generate(count));
  });

  private readonly _products$ = toObservable(this.products);
  private readonly _httpClient = inject(HttpClient);

  public getProducts$(request: SciTablePageRequest, columnDataTypes: Map<`column:${string}`, SciTableColumnType>, options?: {slowDataSource?: boolean; simulateError?: Signal<boolean>}): Observable<SciTablePageResponse<Product>> {
    return defer(() => options?.slowDataSource ? timer(1000) : of(undefined))
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

  public getChildren$(item: Product, request: SciTablePageRequest, columnDataTypes: Map<`column:${string}`, SciTableColumnType>, options?: {slowDataSource?: boolean}): Observable<SciTablePageResponse<Product>> {
    return defer(() => options?.slowDataSource ? timer(1000) : of(undefined))
      .pipe(
        map(() => Products.filter(item.children ?? [], request.columnFilters, request.tableFilter, columnDataTypes)),
        map(children => Products.sort(children, request.sortCriteria, columnDataTypes)),
        map(children => ({
          items: children.slice(request.start, request.end),
          totalCount: children.length,
        })),
      );
  }

  public hasChildren(item: Product, request: Pick<SciTablePageRequest, 'tableFilter' | 'columnFilters'>, columnDataTypes: Map<`column:${string}`, SciTableColumnType>): boolean {
    return Products.filter(item.children ?? [], request.columnFilters, request.tableFilter, columnDataTypes).length > 0;
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
  children?: Product[];
}

export namespace Products {

  export function generate(count: number): Product[] {
    let nextId = 1;

    const createProduct = (depth: number): Product => {
      const id = nextId++;

      const product: Product = {
        id,
        name: `Product ${id}`,
        price: Math.floor(Math.random() * 1000) + 1,
        inStock: Math.random() > 0.5,
      };

      if (depth < 5 && Math.random() < 0.9) {
        const childCount = Math.floor(Math.random() * 4) + 1;
        product.children = Array.from(
          {length: childCount},
          () => createProduct(depth + 1),
        );
      }

      return product;
    };

    return Array.from({length: count}, () => createProduct(1));
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
