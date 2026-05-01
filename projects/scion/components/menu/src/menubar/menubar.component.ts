/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, Injector, input, linkedSignal, Signal, untracked, ViewContainerRef} from '@angular/core';
import {ɵinstallMenuAccelerators, ɵSciMenuAcceleratorOptions} from '../menu-accelerators';
import {ɵSciMenuService} from '../ɵmenu.service';
import {SciAttributesDirective} from '@scion/components/common';
import {MaybeArray, RequireOne} from '@scion/toolkit/types';
import {SciMenuItem} from '../menu.model';
import {SciMenuFilterConfig} from '../menu/menu.factory';
import {injectMenuAcceleratorTargets, injectMenuContext} from '../menu-environment/menu-environment-providers';

/**
 * TODO [menu]: Explain how to size the menubar. (height can be set)
 */
@Component({
  selector: 'sci-menubar',
  templateUrl: './menubar.component.html',
  styleUrl: './menubar.component.scss',
  imports: [
    SciAttributesDirective,
  ],
  host: {
    '[attr.name]': 'name()', // Enable selection by name if passing the name via dynamic input binding.
  },
})
export class SciMenubarComponent {

  public readonly name = input.required<`menubar:${string}`>();
  public readonly context = input<Map<string, unknown>>();
  public readonly acceleratorTarget = input<MaybeArray<Element | ElementRef<Element>> | undefined>();
  public readonly viewContainerRef = input<ViewContainerRef | undefined>();

  private readonly _environmentContext = injectMenuContext();
  private readonly _context = computed(() => new Map([...this._environmentContext(), ...this.context() ?? new Map()]));

  protected readonly menuItems = inject(ɵSciMenuService).menuItems(this.name, this._context) as Signal<SciMenuItem[]>;

  protected readonly activeMenuItem = linkedSignal<SciMenuItem[], {menuItem: SciMenuItem; element: HTMLElement; closing?: true | 'prevented'} | null>({
    source: this.menuItems, // reset active menu when menus change.
    computation: () => null,
    equal: (a, b) => a?.menuItem === b?.menuItem, // required to ignore clicking an already opened menu item
  });

  constructor() {
    this.installMenuOpener();
    this.installAccelerators();
  }

  /**
   * Method invoked when clicking on a menu item.
   */
  protected onMenuItemClick(menuItem: SciMenuItem, element: HTMLElement): void {
    this.activeMenuItem.update(activeMenuItem => activeMenuItem?.menuItem === menuItem ? null : {menuItem, element});
  }

  /**
   * Method invoked before clicking on a menu item.
   *
   * When clicking on the active menu item, mark it as closing to prevent immediate re-opening race condition on subsequent click event.
   */
  protected onMenuItemMouseDown(menuItem: SciMenuItem): void {
    const activeMenuItem = this.activeMenuItem();

    if (activeMenuItem?.menuItem === menuItem) {
      activeMenuItem.closing = true;
    }
  }

  /**
   * Method invoked when moving the pointer over a menu item.
   */
  protected onMenuItemMouseEnter(menuItem: SciMenuItem, element: HTMLElement): void {
    this.activeMenuItem.update(activeMenuItem => activeMenuItem ? {menuItem, element} : null);
  }

  /**
   * Method invoked when moving the pointer out of a menu item.
   */
  protected onMenuItemMouseLeave(menuItem: SciMenuItem): void {
    const activeMenuItem = this.activeMenuItem();
    if (activeMenuItem?.menuItem !== menuItem) {
      return;
    }

    if (activeMenuItem.closing === 'prevented') {
      this.activeMenuItem.set(null); // unset active menu
    }
    else if (activeMenuItem.closing) {
      delete activeMenuItem.closing; // unset closing state
    }
  }

  /**
   * Opens a menu based on {@link activeMenuItem}.
   */
  private installMenuOpener(): void {
    const popoverViewContainerRef = inject(ViewContainerRef);
    const menuService = inject(ɵSciMenuService);

    effect(onCleanup => {
      if (!this.activeMenuItem()) {
        return;
      }

      const {menuItem, element} = this.activeMenuItem()!;
      const menu = menuItem.menu!;
      const viewContainerRef = this.viewContainerRef() ?? popoverViewContainerRef;

      untracked(() => {
        const menuRef = menuService.open(menu.children, {
          anchor: element,
          viewContainerRef,
          filter: menu.filter as RequireOne<SciMenuFilterConfig> | undefined,
          width: menu.width,
          minWidth: menu.minWidth,
          maxWidth: menu.maxWidth,
          maxHeight: menu.maxHeight,
          cssClass: menuItem.cssClass,
          attributes: menuItem.attributes,
          align: 'vertical',
        });

        // Close when opening another menu.
        onCleanup(() => menuRef.close());

        // Unset when closing menu.
        menuRef.onClose(() => {
          const activeMenuItem = this.activeMenuItem();

          // Do not unset if another menu was opened in the meantime.
          if (activeMenuItem?.menuItem !== menuItem) {
            return;
          }

          // Prevent immediate re-opening race condition when toolbar button is clicked to close.
          if (activeMenuItem.closing) {
            activeMenuItem.closing = 'prevented';
            return;
          }

          this.activeMenuItem.set(null);
        });
      });
    });
  }

  /**
   * Installs accelerators of menu items in this menubar, recursively for menu items in submenus and groups.
   */
  private installAccelerators(): void {
    const injector = inject(Injector);
    const environmentTargets = injectMenuAcceleratorTargets();

    effect(onCleanup => {
      const menuItems = this.menuItems();
      const options: ɵSciMenuAcceleratorOptions = {
        targets: this.acceleratorTarget(),
        environmentTargets: environmentTargets(),
        injector,
      };

      untracked(() => {
        const accelerators = ɵinstallMenuAccelerators(menuItems, options);
        onCleanup(() => accelerators.dispose());
      });
    });
  }
}
