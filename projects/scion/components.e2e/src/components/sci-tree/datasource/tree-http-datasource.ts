import {Page} from '@playwright/test';
import {waitUntilStable} from '../../../helper/testing.utils';
import {SciTableTreeNode} from '@scion/components/table';
import {TreePagePO} from '../tree-page.po';
import {TreePO} from '../tree.po';

/**
 * Sets the tree datasource to `loader-http` (or `array-http`) and installs HTTP endpoints returning the given products and their IDs.
 *
 * Missing properties on the provided partial {@link Product} items are populated with random values.
 */
export async function provideHttpDatasource(page: Page, productLike: PartialProduct[], options?: {datasource?: 'array-http' | 'loader-http'}): Promise<void> {
  const datasource = options?.datasource ?? 'loader-http';

  let nextId = 0;

  // Populate missing properties with random values.
  const createProduct = (product: PartialProduct, i: number): Product => ({
    id: product.id ?? nextId++,
    name: product.name ?? `Product ${i + 1}`,
    price: product.price ?? Math.floor(Math.random() * 1000) + 1,
    inStock: product.inStock ?? Math.random() > 0.5,
    children: product.children?.map((child, childIndex) => createProduct(child, childIndex)),
  });

  const products: Product[] = productLike.map(createProduct);

  const flatten = (items: Product[], parent?: number): SciTableTreeNode<Product, number>[] => items.flatMap(product => [
    {item: product, parent},
    ...flatten(product.children ?? [], product.id),
  ]);
  const nodes = flatten(products);

  // Install HTTP endpoints.
  await page.route('**/sci-table/products/ids', route => route.fulfill({json: nodes.map(node => ({item: node.item.id, parent: node.parent}))}));
  await page.route('**/sci-table/products', (route, request) => {
    if (datasource === 'array-http') {
      return route.fulfill({json: products});
    }
    else {
      const ids = request.postDataJSON() as number[];
      return route.fulfill({json: nodes.filter(node => ids.includes(node.item.id)).map(node => node.item)});
    }
  });

  // Select HTTP datasource.
  const treePage = new TreePagePO(page);
  await treePage.setDatasource(datasource);

  // Wait for products to be rendered.
  const tree = new TreePO(treePage.tree);
  await waitUntilStable(() => tree.nodes.count());
}

/**
 * Represents a product used in end-to-end table tests.
 */
export interface Product {
  id: number;
  name: string;
  price: number;
  inStock: boolean;
  children?: Product[];
}

type PartialProduct = {
  [K in keyof Product]?: NonNullable<Product[K]> extends Product[] ? PartialProduct[] : Product[K];
};

/**
 * Generates an array of `count` items using a factory function.
 */
export function generateData<T>(count: number, factoryFn: (index: number) => T): T[] {
  return Array.from(Array(count), (_, index) => factoryFn(index));
}
