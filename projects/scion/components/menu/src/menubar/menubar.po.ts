import {ComponentFixture} from '@angular/core/testing';
import {DebugElement} from '@angular/core';
import {By} from '@angular/platform-browser';
import {OneOf} from '@scion/toolkit/types';

export class MenubarPO {

  private readonly _selector: string;

  constructor(private _fixture: ComponentFixture<unknown>, private _locateBy?: OneOf<{cssClass?: string; selector?: string}>) {
    this._selector = (() => {
      if (this._locateBy?.selector) {
        return this._locateBy.selector;
      }
      if (this._locateBy?.cssClass) {
        return `sci-menubar.${this._locateBy.cssClass}`;
      }
      return 'sci-menubar';
    })();
  }

  public get debugElement(): DebugElement {
    return this._fixture.debugElement.query(By.css(this._selector));
  }

  public get nativeElement(): HTMLElement {
    return this._fixture.debugElement.query(By.css(this._selector)).nativeElement as HTMLElement;
  }

  public items(): MenubarItemPO[] {
    let itemIndex = 0;

    return this.debugElement.children.reduce((acc, child) => {
      const nativeElement = child.nativeElement as HTMLElement;

      if (nativeElement.classList.contains('e2e-menu-item')) {
        acc.push(new MenubarItemPO(this._fixture, `${this._selector} > :nth-child(${++itemIndex} of button.e2e-menu-item)`));
      }
      return acc;
    }, new Array<MenubarItemPO>());
  }

  public item(locateBy: {cssClass: string}): MenubarItemPO {
    return new MenubarItemPO(this._fixture, `${this._selector} button.e2e-menu-item.${locateBy.cssClass}`);
  }
}

export class MenubarItemPO {

  constructor(private _fixture: ComponentFixture<unknown>, private _selector: string) {
  }

  public get debugElement(): DebugElement {
    return this._fixture.debugElement.parent!.query(By.css(this._selector));
  }

  public get nativeElement(): HTMLButtonElement {
    return this.debugElement.nativeElement as HTMLButtonElement;
  }

  public get label(): string {
    return this.nativeElement.innerText;
  }
}
