/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, Injector, input, linkedSignal, Signal, untracked, ViewContainerRef} from '@angular/core';
import {installMenuAccelerators} from '../menu-accelerators';
import {ɵSciMenuService} from '../ɵmenu.service';
import {MaybeSignal, SciAttributesDirective} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {MaybeArray, RequireOne} from '@scion/toolkit/types';
import {SciMenuEnvironmentProviders} from '../menu-environment-providers';
import {SciMenuItem} from '../menu.model';

/**
 * TODO [menu]: Explain how to size the menubar. (height can be set)
 */
@Component({
  selector: 'sci-menubar',
  templateUrl: './menubar.component.html',
  styleUrl: './menubar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SciAttributesDirective,
  ],
})
export class SciMenubarComponent {

  public readonly name = input.required<`menubar:${string}`>();
  public readonly context = input<Map<string, unknown>>();
  public readonly acceleratorTarget = input<MaybeArray<Element | ElementRef<Element>> | undefined>();
  public readonly viewContainerRef = input<ViewContainerRef | undefined>();

  private readonly _menuService = inject(ɵSciMenuService);
  private readonly _context = inject(SciMenuEnvironmentProviders).provideContext(this.context);

  protected readonly menuItems = inject(ɵSciMenuService).menuItems(this.name, this._context) as Signal<SciMenuItem[]>;

  protected readonly activeMenuItem = linkedSignal<SciMenuItem[], {menuItem: SciMenuItem; element: HTMLElement; closing?: true} | null>({
    source: this.menuItems, // reset active menu when menus change.
    computation: () => null,
    equal: (a, b) => a?.menuItem === b?.menuItem,
  });

  constructor() {
    this.installAccelerators();

    const injector = inject(Injector);

    // Open or close popover.
    effect(onCleanup => {
      if (!this.activeMenuItem()) {
        return;
      }

      const {menuItem, element} = this.activeMenuItem()!;
      const menu = menuItem.menu!;
      // Attach popover to configured view ref. Defaults to this component's view ref.
      // Controls where to add the popup.
      const viewContainerRef = this.viewContainerRef() ?? injector.get(ViewContainerRef);

      untracked(() => {
        const ref = this._menuService.open(menu.children, {
          anchor: element,
          viewContainerRef,
          filter: menu.filter as RequireOne<{placeholder?: MaybeSignal<Translatable>; notFoundText?: MaybeSignal<Translatable>; focus?: boolean}> | boolean | undefined,
          size: {
            width: menu.width,
            minWidth: menu.minWidth,
            maxWidth: menu.maxWidth,
            maxHeight: menu.maxHeight,
          },
          cssClass: menuItem.cssClass,
          attributes: menuItem.attributes,
          align: 'vertical',
        });
        ref.onClose(() => {
          const activeMenuItem = this.activeMenuItem();

          // Do not clear state if menu button was clicked to close it. Otherwise, the menu would re-open.
          if (activeMenuItem?.menuItem === menuItem && activeMenuItem.closing) {
            return;
          }

          // Do not clear state if another menu was opened in the meantime.
          if (activeMenuItem?.menuItem !== menuItem) {
            return;
          }

          this.activeMenuItem.set(null);
        });
        onCleanup(() => ref.close());
      });
    });
  }

  protected onMenuItemMouseDown(menuItem: SciMenuItem): void {
    const activeMenuItem = this.activeMenuItem();

    // Mark opened menu as closing to prevent re-opening it on subsequent click event.
    if (activeMenuItem?.menuItem === menuItem) {
      activeMenuItem.closing = true;
    }
  }

  protected onMenuItemClick(menuItem: SciMenuItem, element: HTMLElement): void {
    // Toggle menu state.
    this.activeMenuItem.update(activeMenuItem => activeMenuItem?.menuItem === menuItem ? null : {menuItem, element});
  }

  protected onMenuItemMouseEnter(menuItem: SciMenuItem, element: HTMLElement): void {
    this.activeMenuItem.update(activeMenuItem => activeMenuItem ? {menuItem, element} : null);
  }

  protected onMenuItemMouseLeave(menuItem: SciMenuItem): void {
    // Cleanup "stale" closing state, i.e., moving mouse out of button while pressed.
    const activeMenuItem = this.activeMenuItem();
    if (activeMenuItem?.menuItem === menuItem && activeMenuItem.closing) {
      this.activeMenuItem.set(null);
    }
  }

  private installAccelerators(): void {
    const injector = inject(Injector);

    // TODO [menu] Do we have to use a root effect? Was the case in previous implementation
    // // Use root effect to run even if the parent component is detached from change detection (e.g., if the view is not visible).
    // rootEffect(onCleanup => {

    effect(onCleanup => {
      const name = this.name();
      const target = this.acceleratorTarget();
      const context = this._context();

      untracked(() => {
        const ref = installMenuAccelerators(name, {target, context, injector});
        onCleanup(() => ref.dispose());
      });
    });
  }
}
