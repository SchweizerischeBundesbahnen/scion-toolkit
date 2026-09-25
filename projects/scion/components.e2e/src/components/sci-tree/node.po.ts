import {Locator} from '@playwright/test';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';
import {TogglePO} from './toggle.po';

export class NodePO {

  public rowActions: Locator;
  public toggle: TogglePO;

  constructor(public locator: Locator) {
    this.rowActions = this.locator.locator('sci-toolbar');
    this.toggle = new TogglePO(this.locator.locator('button.e2e-toggle-children'));
  }

  public async click(modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>): Promise<void> {
    await this.locator.click({modifiers});
  }

  public async hover(): Promise<void> {
    const bounds = await this.bounds();
    await this.locator.page().mouse.move(bounds.left, bounds.vcenter);
  }

  public async label(): Promise<string> {
    const label = (await this.locator.locator('sci-table-cell').textContent())!;

    if (await this.toggle.locator.count()) {
      return label!.replace((await this.toggle.locator.textContent())!, '').trim();
    }

    return label!.trim();
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async rowActionsBounds(): Promise<DomRect> {
    return fromRect(await this.rowActions.boundingBox());
  }
}
