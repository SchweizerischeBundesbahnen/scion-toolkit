/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, effect, inject, input, linkedSignal, signal, Signal, untracked, viewChildren, ViewContainerRef} from '@angular/core';
import {SciMenuGroup, SciMenuItem, SciMenuItemLike} from '../menu.model';
import {ɵSciMenuService} from '../ɵmenu.service';
import {SciFormatAcceleratorPipe} from '../menu/accelerator-format.pipe';
import {SciAttributesDirective, SciComponentOutletDirective} from '@scion/components/common';
import {SciIconComponent} from '@scion/components/icon';
import {RequireOne} from '@scion/toolkit/types';
import {NgTemplateOutlet} from '@angular/common';
import {SciToolbarControlComponent} from './toolbar-control.component';
import {SciToolbarSplitButtonComponent} from './toolbar-split-button.component';
import {SciToolbarIconComponent} from './toolbar-icon.component';
import {SciToolbarLabelComponent} from './toolbar-label.component';
import {PopoverRef} from '../menu/popover-ref';
import {SciMenuFilterConfig} from '../menu/menu.factory';

/**
 * Represents a visually separated group of related items within a toolbar.
 */
@Component({
  selector: 'sci-toolbar-group',
  templateUrl: './toolbar-group.component.html',
  styleUrl: './toolbar-group.component.scss',
  imports: [
    SciComponentOutletDirective,
    SciAttributesDirective,
    SciIconComponent,
    SciFormatAcceleratorPipe,
    SciToolbarSplitButtonComponent,
    SciToolbarControlComponent,
    SciToolbarIconComponent,
    SciToolbarLabelComponent,
    NgTemplateOutlet,
  ],
  host: {
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SciToolGroupComponent {

  /**
   * Specifies the toolbar items to display in this group.
   */
  public readonly menuItems = input.required<Array<SciMenuItem | SciMenuGroup>>();

  /**
   * Specifies the orientation of the items in this group.
   */
  public readonly orientation = input.required<'horizontal' | 'vertical'>();

  /**
   * Controls whether to disable the items in this group.
   */
  public readonly disabled = input<boolean>();

  /**
   * Controls where to attach popovers opened in this group.
   */
  public readonly popoverViewContainerRef = input.required<ViewContainerRef>();

  /**
   * Indicates whether a menu is opened in this or any child group.
   */
  public readonly toolbarMenuOpen = this.computeToolbarMenuOpen();

  private readonly _menuService = inject(ɵSciMenuService);
  private readonly _childToolbarGroups = viewChildren(SciToolGroupComponent);

  /** Reference to the popover. Only set if displayed in a menu (menu item action toolbar). */
  private readonly _popoverRef = inject(PopoverRef, {optional: true});

  protected readonly activeMenuItem = linkedSignal<SciMenuItemLike[], {menuItem: SciMenuItem; element: HTMLElement; closing?: true | 'prevented'} | null>({
    source: this.menuItems, // Unset when menu items change.
    computation: () => null,
  });

  constructor() {
    this.installMenuOpener();
  }

  /**
   * Method invoked when clicking on a toolbar button.
   */
  protected async onSelect(menuItem: SciMenuItem): Promise<void> {
    if (await menuItem.onSelect!()) {
      this._popoverRef?.close();
    }
  }

  /**
   * Method invoked when clicking on a menu button.
   */
  protected onToolbarMenuButtonClick(menuItem: SciMenuItem, element: HTMLElement): void {
    this.activeMenuItem.update(activeMenuItem => activeMenuItem?.menuItem === menuItem ? null : {menuItem, element});
  }

  /**
   * Method invoked before clicking on a menu button.
   *
   * When clicking on the active menu button, mark it as closing to prevent immediate re-opening race condition on subsequent click event.
   */
  protected onToolbarMenuButtonMouseDown(menuItem: SciMenuItem): void {
    const activeMenuItem = this.activeMenuItem();

    if (activeMenuItem?.menuItem === menuItem) {
      activeMenuItem.closing = true;
    }
  }

  /**
   * Method invoked when moving the pointer out of a menu button.
   *
   * Clean up closing state set by {@link onToolbarMenuButtonMouseDown}, if any.
   */
  protected onToolbarMenuButtonMouseLeave(menuItem: SciMenuItem): void {
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
    effect(onCleanup => {
      if (!this.activeMenuItem()) {
        return;
      }

      const {menuItem, element} = this.activeMenuItem()!;
      const menu = menuItem.menu!;

      untracked(() => {
        const menuRef = this._menuService.open(menu.children, {
          anchor: element,
          viewContainerRef: this.popoverViewContainerRef(),
          filter: menu.filter as RequireOne<SciMenuFilterConfig> | undefined,
          width: menu.width,
          minWidth: menu.minWidth,
          maxWidth: menu.maxWidth,
          maxHeight: menu.maxHeight,
          cssClass: menuItem.cssClass,
          attributes: menuItem.attributes,
          align: this.orientation() === 'horizontal' ? 'vertical' : 'horizontal',
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
   * Computes whether a menu is open in this group or child group.
   */
  private computeToolbarMenuOpen(): Signal<boolean> {
    // Do not return `computed` signal to prevent illegal access to required component inputs until Angular has completed the initialization of this component,
    // happening when reading the signal from the parent component's template, e.g., via reference variable.
    const toolbarMenuOpen = signal(false);
    effect(() => {
      toolbarMenuOpen.set(!!this.activeMenuItem() || this._childToolbarGroups().some(childGroup => childGroup.toolbarMenuOpen()));
    });
    return toolbarMenuOpen;
  }
}
