import {Page} from '@playwright/test';
import {TablePagePO} from '../table-page.po';
import {TablePO} from '../table.po';
import {waitUntilStable} from '../../../helper/testing.utils';
import {SciTableRequest, SciTableResponse} from '@scion/components/table';

/**
 * Sets the table datasource to `loader-http` and provides a mocked HTTP endpoint for end-to-end tests using the given products.
 *
 * Missing properties on the provided partial {@link Product} items are populated with random values.
 */
export async function provideHttpDatasource(page: Page, productLike: Partial<Product>[]): Promise<void> {
  // Populate missing properties with random values.
  const products: Product[] = productLike.map((product, i) => ({
    id: product.id ?? i,
    name: product.name ?? `Product ${i + 1}`,
    price: product.price ?? Math.floor(Math.random() * 1000) + 1,
    inStock: product.inStock ?? Math.random() > 0.5,
  }));

  // Provide HTTP mock endpoint.
  await page.route('**/sci-table/products', (route, request) => {
    const tableRequest: SciTableRequest = request.postDataJSON();
    return route.fulfill({
      json: {
        items: products.slice(tableRequest.start, tableRequest.end),
        totalCount: products.length,
      } satisfies SciTableResponse<Product>,
    })
  });

  // Select HTTP datasource.
  const tablePage = new TablePagePO(page);
  await tablePage.setDatasource('loader-http')

  // Wait for products to be rendered.
  const table = new TablePO(tablePage.table);
  await waitUntilStable(() => table.rows.count());
}

/**
 * Represents a product used in end-to-end table tests.
 */
export interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
}

/**
 * Generates an array of `count` items using a factory function.
 */
export function generateData<T>(count: number, factoryFn: (index: number) => T): T[] {
  return Array.from(Array(count), (_, index) => factoryFn(index));
}
