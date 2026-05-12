import {ComponentFixture} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';

export class ToolbarPO {

  private readonly _group: ToolbarGroupPO;
  private readonly _selector: string;

  constructor(private _fixture: ComponentFixture<unknown>, private _locateBy: {cssClass: string}) {
    this._selector = `sci-toolbar.${this._locateBy.cssClass}`;
    this._group = new ToolbarGroupPO(this._fixture, `${this._selector} sci-toolbar-group`);
  }

  public get debugElement(): DebugElement {
    return this._fixture.debugElement.query(By.css(this._selector));
  }

  public get nativeElement(): HTMLElement {
    return this.debugElement.nativeElement as HTMLElement;
  }

  public get items(): Array<ToolbarButtonPO | ToolbarSplitButtonPO | ToolbarGroupPO> {
    return this._group.items;
  }

  public button(locateBy: {cssClass: string}): ToolbarButtonPO {
    return this.item(locateBy) as ToolbarButtonPO;
  }

  public splitButton(locateBy: {cssClass: string}): ToolbarSplitButtonPO {
    return this.item(locateBy) as ToolbarSplitButtonPO;
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

  private item(locateBy: {cssClass: string}): ToolbarButtonPO | ToolbarSplitButtonPO | ToolbarGroupPO {
    return this.items.find(item => {
      const nativeElement = item instanceof ToolbarSplitButtonPO ? item.primaryButton.nativeElement : item.nativeElement;
      return nativeElement.classList.contains(locateBy.cssClass);
    })!;
  }
}

export class ToolbarGroupPO {

  constructor(private _fixture: ComponentFixture<unknown>, private _selector: string) {
  }

  public get debugElement(): DebugElement {
    return this._fixture.debugElement.parent!.query(By.css(this._selector));
  }

  public get nativeElement(): HTMLElement {
    return this.debugElement.nativeElement as HTMLElement;
  }

  public get items(): Array<ToolbarButtonPO | ToolbarSplitButtonPO | ToolbarGroupPO> {
    let itemIndex = 0;
    let groupIndex = 0;

    return this.debugElement.children.reduce((acc, child) => {
      const nativeElement = child.nativeElement as HTMLElement;

      if (nativeElement.classList.contains('e2e-split-button')) {
        acc.push(new ToolbarSplitButtonPO(this._fixture, `${this._selector} > :nth-child(${++itemIndex} of div.e2e-menu-item)`));
      }
      else if (nativeElement.classList.contains('e2e-menu-item')) {
        acc.push(new ToolbarButtonPO(this._fixture, `${this._selector} > :nth-child(${++itemIndex} of div.e2e-menu-item) > .e2e-menu-item`)); // Do not use button.e2e-menu-item selector because of custom control.
      }
      else if (nativeElement.classList.contains('e2e-toolbar-group')) {
        acc.push(new ToolbarGroupPO(this._fixture, `${this._selector} > :nth-child(${++groupIndex} of sci-toolbar-group.e2e-toolbar-group)`));
      }
      return acc;
    }, new Array<ToolbarButtonPO | ToolbarSplitButtonPO | ToolbarGroupPO>());
  }
}

export class ToolbarButtonPO {

  constructor(private _fixture: ComponentFixture<unknown>, private _selector: string) {
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

  public get visualMenuHint(): boolean {
    return this.nativeElement.classList.contains('visual-menu-hint');
  }

  public get checked(): boolean {
    return this.nativeElement.classList.contains('checked');
  }
}

export class ToolbarSplitButtonPO {

  public readonly primaryButton: ToolbarButtonPO;
  public readonly menuButton: ToolbarButtonPO;

  constructor(private _fixture: ComponentFixture<unknown>, private _selector: string) {
    this.primaryButton = new ToolbarButtonPO(this._fixture, `${this._selector} > :nth-child(1 of .e2e-menu-item)`);
    this.menuButton = new ToolbarButtonPO(this._fixture, `${this._selector} > :nth-child(2 of .e2e-menu-item)`);
  }
}
