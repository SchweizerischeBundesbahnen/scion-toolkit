import {ComponentFixture} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {ToolbarGroupPO} from '../toolbar/toolbar.po';

export class MenuPO {

  constructor(private _fixture: ComponentFixture<unknown>, private _selector: string = 'sci-menu') {
  }

  public get debugElement(): DebugElement {
    return this._fixture.debugElement.parent!.query(By.css(this._selector));
  }

  public get nativeElement(): HTMLElement {
    return this.debugElement.nativeElement as HTMLElement;
  }

  public get children(): Array<MenuItemPO | MenuGroupPO> {
    let itemIndex = 0;
    let groupIndex = 0;

    return this.debugElement.children.reduce((acc, child) => {
      const nativeElement = child.nativeElement as HTMLElement;

      if (nativeElement.classList.contains('e2e-menu-item')) {
        acc.push(new MenuItemPO(this._fixture, this._selector, `${this._selector} > :nth-child(${++itemIndex} of button.e2e-menu-item)`));
      }
      else if (nativeElement.classList.contains('e2e-menu-group')) {
        acc.push(new MenuGroupPO(this._fixture, `${this._selector} > :nth-child(${++groupIndex} of sci-menu-group.e2e-menu-group)`));
      }
      return acc;
    }, new Array<MenuItemPO | MenuGroupPO>());
  }

  public get groups(): MenuGroupPO[] {
    return this.children.filter(item => item instanceof MenuGroupPO);
  }

  public group(locateBy: {cssClass: string}): MenuGroupPO {
    return this.groups.find(group => group.nativeElement.classList.contains(locateBy.cssClass))!;
  }

  public item(locateBy: {cssClass: string}): MenuItemPO | MenuGroupPO {
    return findItem(this.children, locateBy);
  }

  public async openSubMenu(locateBy: {cssClass: string}): Promise<MenuPO> {
    // Get menu item.
    const menuItem = this.item(locateBy);

    // Simulate 'hover' to open submenu.
    menuItem.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));

    // Wait until fixture stable.
    await this._fixture.whenStable();

    // Return submenu.
    return new MenuPO(this._fixture, `${this._selector} sci-menu.${locateBy.cssClass}`);
  }

  public get filterInputElement(): HTMLInputElement | undefined {
    const filterInput = this.debugElement.query(By.css('input.e2e-menu-filter-input')) as DebugElement | undefined;
    return filterInput?.nativeElement as HTMLInputElement | undefined;
  }

  public filterMenuItems(filterText: string): void {
    this.filterInputElement!.value = filterText;
    this.filterInputElement!.dispatchEvent(new Event('input'));
    this._fixture.detectChanges();
  }

  public get noItemsFoundText(): string {
    return (this.debugElement.query(By.css('div.e2e-no-items')).nativeElement as HTMLElement).textContent;
  }

  public get viewport(): HTMLElement {
    return this.debugElement.query(By.css('sci-viewport')).nativeElement as HTMLElement;
  }
}

export class MenuItemPO {

  constructor(private _fixture: ComponentFixture<unknown>, private _parentSelector: string, private _selector: string) {
  }

  public get subMenu(): MenuPO {
    return new MenuPO(
      this._fixture,
      `${this._parentSelector} sci-menu`,
    );
  }

  public get debugElement(): DebugElement {
    return this._fixture.debugElement.parent!.query(By.css(this._selector));
  }

  public get nativeElement(): HTMLButtonElement {
    return this.debugElement.nativeElement as HTMLButtonElement;
  }

  public get iconLigature(): string {
    return (this.debugElement.query(By.css('sci-icon')).nativeElement as HTMLElement).textContent;
  }

  public iconComponent(selector: string): DebugElement | undefined {
    return this.debugElement.query(By.css('span.icon')).query(By.css(selector));
  }

  public get labelText(): string {
    return (this.debugElement.query(By.css('span.label')).nativeElement as HTMLElement).textContent;
  }

  public labelComponent(selector: string): DebugElement | undefined {
    return this.debugElement.query(By.css('span.label')).query(By.css(selector));
  }

  public get checked(): boolean {
    return this.nativeElement.classList.contains('checked');
  }

  public get active(): boolean {
    return this.nativeElement.classList.contains('active');
  }

  public get actions(): ToolbarGroupPO {
    return new ToolbarGroupPO(this._fixture, `${this._selector} sci-toolbar-group.e2e-actions`);
  }
}

export class MenuGroupPO {

  constructor(private _fixture: ComponentFixture<unknown>, private _selector: string) {
  }

  public get debugElement(): DebugElement {
    return this._fixture.debugElement.parent!.query(By.css(this._selector));
  }

  public get nativeElement(): HTMLElement {
    return this.debugElement.nativeElement as HTMLElement;
  }

  public get header(): DebugElement {
    return (this.debugElement.query(By.css('header.e2e-group-header')) as DebugElement | undefined) ?? this.debugElement.query(By.css('button.e2e-group-header'));
  }

  public get children(): Array<MenuItemPO | MenuGroupPO> {
    let itemIndex = 0;
    let groupIndex = 0;

    return this.debugElement.children.reduce((acc, child) => {
      const nativeElement = child.nativeElement as HTMLElement;

      if (nativeElement.classList.contains('e2e-menu-item')) {
        acc.push(new MenuItemPO(this._fixture, this._selector, `${this._selector} > :nth-child(${++itemIndex} of button.e2e-menu-item)`));
      }
      else if (nativeElement.classList.contains('e2e-menu-group')) {
        acc.push(new MenuGroupPO(this._fixture, `${this._selector} > :nth-child(${++groupIndex} of sci-menu-group.e2e-menu-group)`));
      }
      return acc;
    }, new Array<MenuItemPO | MenuGroupPO>());
  }

  public get label(): string {
    return (this.header.query(By.css('span.label')).nativeElement as HTMLElement).textContent;
  }

  public get collapsed(): boolean {
    const icon = this.header.query(By.css('sci-icon')).nativeElement as HTMLElement;
    return icon.textContent === 'chevron_right';
  }

  public get actions(): ToolbarGroupPO {
    return new ToolbarGroupPO(this._fixture, `${this._selector} sci-toolbar-group.e2e-actions`);
  }
}

function findItem(children: Array<MenuItemPO | MenuGroupPO>, locateBy: {cssClass: string}): MenuItemPO | MenuGroupPO {
  for (const child of children) {
    // Check current node.
    if (child.nativeElement.classList.contains(locateBy.cssClass)) {
      return child;
    }

    // Recurse into groups.
    if (child instanceof MenuGroupPO) {
      try {
        return findItem(child.children, locateBy);
      }
      catch {
        // Ignore and continue searching siblings.
      }
    }
  }

  throw new Error(`Item not found ${locateBy.cssClass}`);
}
