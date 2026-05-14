/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, DOCUMENT, effect, inject, Injector, input, linkedSignal, output, signal, untracked, ViewContainerRef} from '@angular/core';
import {SciMenuGroup, SciMenuItem, SciMenuItemLike} from '../menu.model';
import {ɵSciMenuService} from '../ɵmenu.service';
import {SciToolbarControlPipe} from './toolbar-control.directive';
import {FormatAcceleratorPipe} from '../menu/accelerator-format.pipe';
import {MaybeSignal, SciAttributesDirective, SciComponentOutletDirective} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {SciIconComponent} from '@scion/components/icon';
import {RequireOne} from '@scion/toolkit/types';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'sci-toolbar-group',
  templateUrl: './toolbar-group.component.html',
  styleUrl: './toolbar-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SciComponentOutletDirective,
    SciAttributesDirective,
    SciToolbarControlPipe,
    SciIconComponent,
    FormatAcceleratorPipe,
    NgTemplateOutlet,
  ],
  host: {
    '[attr.data-orientation]': 'orientation()',
  },
})
export class SciToolGroupComponent {

  public readonly menuItems = input.required<Array<SciMenuItem | SciMenuGroup>>();
  public readonly orientation = input.required<'horizontal' | 'vertical'>();
  public readonly disabled = input<boolean>();
  public readonly popoverViewContainerRef = input<ViewContainerRef | undefined>();
  public readonly menuOpen = output<boolean>();

  private readonly _menuService = inject(ɵSciMenuService);
  private readonly _childGroupMenuOpen = signal(false);
  private readonly _document = inject(DOCUMENT);

  protected readonly activeMenuItem = linkedSignal<SciMenuItemLike[], {menuItem: SciMenuItem; element: HTMLElement; closing?: true} | null>({
    source: this.menuItems, // reset active sub menu item when this component is re-used
    computation: () => null,
    equal: (a, b) => a?.menuItem === b?.menuItem,
  });

  constructor() {
    const injector = inject(Injector);

    // Open or close popover.
    effect(onCleanup => {
      if (!this.activeMenuItem()) {
        return;
      }

      const {menuItem, element} = this.activeMenuItem()!;
      const menu = menuItem.menu!;

      // Attach popover to configured view ref. Defaults to this component's view ref.
      // Controls where to add the popup, e.g., required for toolbar in menu button to not be child of the menu item (hover state)
      const popoverViewContainerRef = this.popoverViewContainerRef() ?? injector.get(ViewContainerRef);
      untracked(() => {
        const ref = this._menuService.open(menu.children, {
          anchor: element,
          viewContainerRef: popoverViewContainerRef,
          filter: menu.filter as RequireOne<{placeholder?: MaybeSignal<Translatable>; notFoundText?: MaybeSignal<Translatable>; focus?: boolean}> | boolean | undefined,
          size: {
            width: menu.width,
            minWidth: menu.minWidth,
            maxWidth: menu.maxWidth,
            maxHeight: menu.maxHeight,
          },
          cssClass: menuItem.cssClass,
          attributes: menuItem.attributes,
          align: this.orientation() === 'horizontal' ? 'vertical' : 'horizontal',
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

    effect(() => {
      const open = this.activeMenuItem() !== null || this._childGroupMenuOpen();
      untracked(() => this.menuOpen.emit(open));
    });
  }

  protected async onSelect(menuItem: SciMenuItem): Promise<void> {
    // TODO [menu] toggle menu
    if (await menuItem.onSelect!()) {
      this.closeMenus(); // e.g., when clicking an action in a menu's action toolbar
    }
  }

  protected onChildGroupMenuOpen(open: boolean): void {
    this._childGroupMenuOpen.set(open);
  }

  protected onMenuItemMouseDown(menuItem: SciMenuItem): void {
    const activeMenuItem = this.activeMenuItem();

    // Mark opened menu as closing to prevent re-opening it on subsequent click event.
    if (activeMenuItem?.menuItem === menuItem) {
      activeMenuItem.closing = true;
    }
  }

  protected onMenuItemMouseLeave(menuItem: SciMenuItem): void {
    // Cleanup "stale" closing state, i.e., moving mouse out of button while pressed.
    const activeMenuItem = this.activeMenuItem();
    if (activeMenuItem?.menuItem === menuItem && activeMenuItem.closing) {
      this.activeMenuItem.set(null);
    }
  }

  protected onMenuItemClick(menuItem: SciMenuItem, element: HTMLElement): void {
    // Toggle menu state.
    this.activeMenuItem.update(activeMenuItem => activeMenuItem?.menuItem === menuItem ? null : {menuItem, element});
  }

  private closeMenus(): void {
    const popover = this._document.documentElement.appendChild(this._document.createElement('div'));
    popover.setAttribute('popover', '');
    popover.style.setProperty('display', 'none');
    popover.showPopover();
    popover.remove();
  }
}
