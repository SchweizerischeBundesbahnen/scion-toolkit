import {Page} from '@playwright/test';
import {TablePagePO} from '../table-page.po';
import {TablePO} from '../table.po';
import {waitUntilStable} from '../../../helper/testing.utils';

/**
 * Sets the table datasource to `loader-http` (or `array-http`) and installs HTTP endpoints returning the given products and their IDs.
 *
 * Missing properties on the provided partial {@link Product} items are populated with random values.
 */
export async function provideHttpDatasource(page: Page, productLike: Partial<Product>[], options?: {datasource?: 'array-http' | 'loader-http'}): Promise<void> {
  const datasource = options?.datasource ?? 'loader-http';

  // Populate missing properties with random values.
  const products: Product[] = productLike.map((product, i) => ({
    id: product.id ?? i,
    name: product.name ?? `Product ${i + 1}`,
    price: product.price ?? Math.floor(Math.random() * 1000) + 1,
    inStock: product.inStock ?? Math.random() > 0.5,
    expirationDate: product.expirationDate ?? randomDate().toISOString(),
  }));

  // Install HTTP endpoints.
  await page.route('**/sci-table/products/ids', route => route.fulfill({json: products.map(product => product.id)}));
  await page.route('**/sci-table/products', (route, request) => {
    if (datasource === 'array-http') {
      return route.fulfill({json: products});
    }
    else {
      const ids = request.postDataJSON() as number[];
      return route.fulfill({json: products.filter(product => ids.includes(product.id))});
    }
  });

  // Select HTTP datasource.
  const tablePage = new TablePagePO(page);
  await tablePage.setDatasource(datasource);

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
  expirationDate: string;
}

/**
 * Generates an array of `count` items using a factory function.
 */
export function generateData<T>(count: number, factoryFn: (index: number) => T): T[] {
  return Array.from(Array(count), (_, index) => factoryFn(index));
}

function randomDate(): Date {
  const from = new Date();
  const to = new Date();
  to.setFullYear(to.getFullYear() + 15);
  return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));
}
