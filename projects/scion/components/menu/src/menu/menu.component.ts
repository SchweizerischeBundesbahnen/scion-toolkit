/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {afterRenderEffect, Component, computed, Directive, effect, ElementRef, inject, InjectionToken, Injector, input, linkedSignal, NgZone, Provider, Signal, Type, untracked, viewChild, ViewContainerRef, WritableSignal} from '@angular/core';
import {SciFormatAcceleratorPipe} from './accelerator-format.pipe';
import {SciMenuGroupComponent} from './menu-group.component';
import {SciMenuFilterComponent} from './menu-filter.component';
import {MenuFilter} from './menu-filter.service';
import {NgTemplateOutlet} from '@angular/common';
import {SciMenuGroup, SciMenuItem, SciMenuItemLike} from '../menu.model';
import {ɵSciMenuService} from '../ɵmenu.service';
import {SciToolGroupComponent} from '../toolbar/toolbar-group.component';
import {SciViewportComponent} from '@scion/components/viewport';
import {SciTextPipe, Translatable} from '@scion/components/text';
import {SciAttributesDirective, SciComponentOutletDirective} from '@scion/components/common';
import {SciIconComponent} from '@scion/components/icon';
import {RequireOne} from '@scion/toolkit/types';
import {SciMenuGroupLabelComponent} from './menu-group-label.component';
import {SciMenuItemLabelComponent} from './menu-item-label.component';
import {SciMenuItemIconComponent} from './menu-item-icon.component';
import {PopoverRef} from './popover-ref';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {filter, observeOn, raceWith, switchMap, take} from 'rxjs/operators';
import {animationFrameScheduler, EMPTY, fromEvent} from 'rxjs';
import {observeIn, subscribeIn} from '@scion/toolkit/operators';
import {ɵinstallMenuAccelerators, ɵSciMenuAcceleratorOptions} from '../menu-accelerators';
import {SciMenuFilterConfig} from './menu.factory';

/**
 * Represents a menu or a group of menu items.
 */
@Component({
  selector: 'sci-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  imports: [
    SciMenuGroupComponent,
    SciMenuFilterComponent,
    SciToolGroupComponent,
    SciViewportComponent,
    SciTextPipe,
    SciComponentOutletDirective,
    SciAttributesDirective,
    SciIconComponent,
    SciMenuGroupLabelComponent,
    SciMenuItemLabelComponent,
    SciMenuItemIconComponent,
    SciFormatAcceleratorPipe,
    NgTemplateOutlet,
  ],
  providers: [
    provideMenuFilter(),
    providePopoverRef(),
  ],
  host: {
    '[style.--ɵsci-menu-width]': 'menuSize().width',
    '[style.--ɵsci-menu-min-width]': 'menuSize().minWidth',
    '[style.--ɵsci-menu-max-width]': 'menuSize().maxWidth',
    '[style.--ɵsci-menu-max-height]': 'menuSize().maxHeight',
    '[style.--ɵsci-menu-scrolling]': 'scrolling() ? `true` : null',
    '[attr.data-glyph-area]': 'hasGlyphArea() ? null : `none`',
    // Hide popover until computed the initial width to prevent flickering caused by dynamic anchor positioning based on `--ɵsci-menu-width`. See `menu-opener.service.ts` for more details.
    '[style.visibility]': 'popoverHidden() ? `hidden` : null',
    '[attr.tabindex]': 'role === `menu` ? `-1` : null', // enable programmatic focus of popover
    '[class]': 'cssClass()',
  },
  hostDirectives: [
    {directive: SciAttributesDirective, inputs: ['sciAttributes: attributes']},
  ],
})
export class SciMenuComponent {

  /**
   * Specifies the menu items to display in this menu or group.
   */
  public readonly menuItems = input.required<Array<SciMenuItem | SciMenuGroup>>();

  /**
   * Controls whether to disable menu items in this menu or group.
   */
  public readonly disabled = input<boolean>();

  /**
   * Enables and configures filtering of this menu.
   *
   * Has no effect if a menu group.
   */
  public readonly filter = input<SciMenuFilterConfig<Signal<Translatable>>>();

  /**
   * Configures features of this group.
   *
   * Has no effect if a menu or submenu
   */
  public readonly group = input<SciMenuGroupConfig>();

  /**
   * Specifies the preferred menu width.
   *
   * Has no effect if a menu group.
   */
  public readonly width = input<string>();

  /**
   * Specifies the preferred minimum menu width.
   *
   * Defaults to the `--sci-menu-min-width` or `--sci-menu-submenu-min-width` CSS variables.
   *
   * If {@link anchorWidth} is specified (e.g., for toolbar menus), the effective minimum width evaluates to `max(anchorWidth, minWidth)`.
   *
   * Has no effect if a menu group.
   */
  public readonly minWidth = input<string>();

  /**
   * Specifies the maximum menu width.
   *
   * Has no effect if a menu group.
   */
  public readonly maxWidth = input<string>();

  /**
   * Specifies the maximum menu height.
   *
   * Has no effect if a menu group.
   */
  public readonly maxHeight = input<string>();

  /**
   * Controls whether to display the glyph area.
   *
   * The glyph area is the leftmost column for displaying icons and checkmarks.
   */
  public readonly glyphArea = input<boolean>();

  /**
   * Specifies the width of the popover anchor.
   *
   * Used to compute the minimum width of the menu.
   */
  public readonly anchorWidth = input(undefined, {transform: (width: number | undefined): string | undefined => width ? `${width}px` : undefined});

  /**
   * Specifies CSS classes to associate with the menu, submenu, or group.
   */
  public readonly cssClass = input<string[]>();

  private readonly _menuService = inject(ɵSciMenuService);
  private readonly _menuFilter = inject(MenuFilter);
  private readonly _popoverRef = inject(PopoverRef);
  private readonly _filterField = viewChild(SciMenuFilterComponent);
  private readonly _viewport = viewChild(SciViewportComponent);

  protected readonly hasGlyphArea = computed(() => this.glyphArea() ?? requiresGlyphArea(this.menuItems()));
  protected readonly menuItemsFiltered = computed(() => this.menuItems().filter(menuItem => this.matchesFilter(menuItem)()));
  protected readonly popoverViewContainerRef = viewChild.required('popover_view_container_ref', {read: ViewContainerRef});
  protected readonly scrolling = computed(() => this._viewport()?.scrolling());
  protected readonly activeSubmenuItem = linkedSignal<SciMenuItemLike[], {menuItem: SciMenuItem; element: HTMLElement} | null>({
    source: this.menuItemsFiltered, // Unset when filtered menu items change. Otherwise, popopver may lose anchor and render left-top of the page viewport.
    computation: () => null,
    equal: (a, b) => a?.menuItem === b?.menuItem, // required to ignore clicking an already opened menu item
  });

  protected readonly role = inject(SCI_MENU_COMPONENT_ROLE);
  protected readonly isGroupExpanded = this.computeGroupExpanded();
  protected readonly popoverHidden = this.computePopoverHidden();
  protected readonly menuSize = this.computeMenuSize();

  constructor() {
    this.installSubmenuOpener();
    this.installAccelerators();
    this.lockInitialMenuWidth();
    this.closeChildPopoverOnComponentReuse();
    this.requestInitialFocus();
    this.focusFilterFieldOnKeyDown();
    this.stopKeyDownEventPropagation();
  }

  /**
   * Method invoked when clicking on a menu item.
   */
  protected async onSelect(menuItem: SciMenuItem): Promise<void> {
    if (await menuItem.onSelect!()) {
      this._popoverRef.close({closeParents: true});
    }
  }

  /**
   * Method invoked when clicking on the group header of a collapsible group.
   */
  protected onGroupHeaderButtonClick(): void {
    this.isGroupExpanded.update(expanded => !expanded);
  }

  /**
   * Method invoked when moving the pointer over a menu item.
   */
  protected onMenuItemMouseEnter(menuItem: SciMenuItem | null): void {
    const disabled = this.disabled() || menuItem?.disabled?.(); // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
    if (disabled) {
      return;
    }

    this.activeSubmenuItem.set(null);

    // Close submenu of other groups.
    if (this._popoverRef.childPopover()?.isSubmenu) {
      this._popoverRef.childPopover()!.close();
    }
  }

  /**
   * Method invoked when moving the pointer over a submenu item.
   */
  protected onSubmenuItemMouseEnter(menuItem: {menuItem: SciMenuItem; element: HTMLElement}): void {
    this.onSubmenuItemClick(menuItem);
  }

  /**
   * Method invoked when clicking on a submenu item.
   */
  protected onSubmenuItemClick(menuItem: {menuItem: SciMenuItem; element: HTMLElement}): void {
    const disabled = this.disabled() || menuItem.menuItem.disabled?.(); // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
    if (disabled) {
      return;
    }

    this.activeSubmenuItem.set(menuItem);
  }

  /**
   * Method invoked when setting a menu filter.
   */
  protected onFilterChange(filter: string): void {
    this._menuFilter.setFilterText(filter);
  }

  /**
   * Opens a submenu based on {@link activeSubmenuItem}.
   */
  private installSubmenuOpener(): void {
    effect(onCleanup => {
      if (!this.activeSubmenuItem()) {
        return;
      }

      const {menuItem, element} = this.activeSubmenuItem()!;
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
          submenu: true,
          align: 'horizontal',
        });

        // Close when opening another submenu.
        onCleanup(() => menuRef.close());

        // Unset when closing submenu.
        menuRef.onClose(() => {
          const activeSubmenuItem = this.activeSubmenuItem();

          // Do not unset if another submenu was opened in the meantime.
          if (activeSubmenuItem?.menuItem !== menuItem) {
            return;
          }

          this.activeSubmenuItem.set(null);
        });
      });
    });
  }

  /**
   * Installs accelerators of menu items in this menu, recursively for menu items in submenus and groups.
   *
   * Has no effect if a submenu or menu group.
   */
  private installAccelerators(): void {
    if (this.role !== 'menu') {
      return;
    }

    const host = inject(ElementRef).nativeElement as HTMLElement;
    const injector = inject(Injector);

    effect(onCleanup => {
      const menuItems = this.menuItems();
      const options: ɵSciMenuAcceleratorOptions = {
        targets: host,
        onSelect: menuItem => void this.onSelect(menuItem),
        injector,
      };

      untracked(() => {
        const accelerators = ɵinstallMenuAccelerators(menuItems, options);
        onCleanup(() => accelerators.dispose());
      });
    });
  }

  /**
   * Locks the initial menu width to maintain a stable width when expanding/collapsing groups or hovering menu items with a toolbar.
   *
   * Has no effect if a menu group.
   */
  private lockInitialMenuWidth(): void {
    if (this.role === 'group') {
      return;
    }

    const host = inject(ElementRef).nativeElement as HTMLElement;

    // Wait until menu items are available, maximal until idle; may initially be empty due to asynchronous menu contributions.
    toObservable(this.menuItems)
      .pipe(
        filter(menuItems => !!menuItems.length),
        observeOn(animationFrameScheduler), // Wait until next render cycle to capture menu width.
        raceWith(new Promise(resolve => void requestIdleCallback(resolve, {timeout: 250}))), // fallback if no menu items are contributed
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuSize.update(size => ({...size, width: `${host.getBoundingClientRect().width}px`}));
      });
  }

  /**
   * Closes a child popover (submenu or action menu) when this component is reused.
   */
  private closeChildPopoverOnComponentReuse(): void {
    effect(() => {
      // Track menu items.
      this.menuItems();

      // Close child popover, if any.
      untracked(() => this._popoverRef.childPopover()?.close());
    });
  }

  /**
   * Focuses the popover or filter field based on {@link filter.focus} option.
   *
   * The popover must receive focus to enable light dismiss (closing via Escape or clicking outside it) when opened from microfrontends.
   */
  private requestInitialFocus(): void {
    const host = inject(ElementRef).nativeElement as HTMLElement;

    const effectRef = afterRenderEffect(() => {
      if (this.popoverHidden()) {
        return; // cannot be focused until visible
      }

      untracked(() => {
        if (this.filter()?.focus) {
          this._filterField()?.focus();
        }
        else if (this.role === 'menu') {
          host.focus();
        }

        effectRef.destroy();
      });
    });
  }

  /**
   * Focuses the filter field when the user starts typing.
   *
   * Has no effect if filtering is not supported.
   */
  private focusFilterFieldOnKeyDown(): void {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    const zone = inject(NgZone);

    toObservable(this._filterField)
      .pipe(
        switchMap(filterField => filterField ? fromEvent<KeyboardEvent>(host, 'keydown') : EMPTY),
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        filter(event => !event.ctrlKey && !event.altKey && !event.metaKey && event.key?.trim().length === 1), // UNDOCUMENTED: `event.key` can be `undefined`, for example, when selecting an option from an input element's datalist.
        subscribeIn(fn => zone.runOutsideAngular(fn)),
        observeIn(fn => zone.run(fn)),
        takeUntilDestroyed(),
      )
      .subscribe(event => {
        this._filterField()!.focus();
        event.stopPropagation(); // prevent parent filter field from receiving focus.
      });
  }

  /**
   * Stops keydown event propagation to prevent side effects, such as closing an overlay on `Escape` or other keystrokes from triggering.
   *
   * Has no effect if a submenu or menu group.
   */
  private stopKeyDownEventPropagation(): void {
    if (this.role !== 'menu') {
      return;
    }

    const host = inject(ElementRef).nativeElement as HTMLElement;
    const zone = inject(NgZone);

    fromEvent<KeyboardEvent>(host, 'keydown')
      .pipe(
        subscribeIn(fn => zone.runOutsideAngular(fn)),
        takeUntilDestroyed(),
      )
      .subscribe(event => {
        event.stopPropagation();
      });
  }

  /**
   * Computes whether the popover is hidden.
   *
   * The popover must be hidden until the initial width is computed. Otherwise, dynamic anchor positioning based on `--ɵsci-menu-width` causes flickering.
   * See `menu-opener.service.ts` for more details.
   */
  private computePopoverHidden(): Signal<boolean> {
    return computed(() => this.role === 'menu' && !this.menuSize().width);
  }

  /**
   * Computes whether menu items are visible.
   */
  private computeGroupExpanded(): WritableSignal<boolean> {
    return linkedSignal(() => {
      const group = this.group();
      return !group || !group.collapsible || !group.collapsed || this._menuFilter.active();
    });
  }

  /**
   * Computes the menu size based on configured size constraints.
   */
  private computeMenuSize(): WritableSignal<MenuSize> {
    return linkedSignal((): MenuSize => {
      if (this.role === 'group') {
        return {};
      }

      const defaultMinWidth = this.role === 'submenu' ? 'var(--sci-menu-submenu-min-width)' : 'var(--sci-menu-min-width)';
      const preferredMinWidth = this.minWidth() ?? defaultMinWidth;
      return {
        width: this.width(),
        minWidth: this.anchorWidth() ? `max(${preferredMinWidth}, ${this.anchorWidth()})` : preferredMinWidth,
        maxWidth: this.maxWidth() ?? this.width(),
        maxHeight: this.maxHeight(),
      };
    });
  }

  /**
   * Evaluates whether the given menu item (or any of its child menu items) match the active filter.
   */
  private matchesFilter(menuItem: SciMenuItem | SciMenuGroup): Signal<boolean> {
    return computed(() => {
      if (!this._menuFilter.active()) {
        return true;
      }
      switch (menuItem.type) {
        case 'menu-item':
          return menuItem.menu ? menuItem.menu.children.some(menuItem => this.matchesFilter(menuItem)()) : this._menuFilter.matches(menuItem)();
        case 'group':
          return menuItem.children.some(menuItem => this.matchesFilter(menuItem)());
      }
    });
  }
}

/**
 * Evaluates whether the given menu items (or any child groups) require a glyph area for displaying icons and checkmarks.
 */
function requiresGlyphArea(menuItems: SciMenuItemLike[]): boolean {
  return menuItems.some(menuItem => {
    switch (menuItem.type) {
      case 'menu-item':
        return !!menuItem.iconLigature || !!menuItem.iconComponent || !!menuItem.checked;
      case 'group':
        return !!menuItem.collapsible || requiresGlyphArea(menuItem.children);
    }
  });
}

/**
 * Provides {@link SCI_MENU_COMPONENT_ROLE} for injection.
 *
 * Returns a host directive instead of a static provider to support component creation via {@link ViewContainerRef.createComponent}.
 */
export function provideMenuComponentRole(role: 'menu' | 'submenu' | 'group'): Type<unknown> {
  @Directive({providers: [{provide: SCI_MENU_COMPONENT_ROLE, useValue: role}]})
  class RoleProvider {
  }

  return RoleProvider;
}

/**
 * Provides {@link MenuFilter} for injection.
 */
function provideMenuFilter(): Provider {
  return {
    provide: MenuFilter,
    useFactory: () => {
      switch (inject(SCI_MENU_COMPONENT_ROLE)) {
        case 'menu':
          return new MenuFilter(null); // top-level menu or menu in action toolbar
        case 'submenu':
          return new MenuFilter(inject(MenuFilter, {skipSelf: true}));
        case 'group':
          return inject(MenuFilter, {skipSelf: true});
      }
    },
  };
}

/**
 * Provides {@link PopoverRef} for injection.
 */
function providePopoverRef(): Provider {
  return {
    provide: PopoverRef,
    useFactory: () => {
      switch (inject(SCI_MENU_COMPONENT_ROLE)) {
        case 'menu':
          return new PopoverRef({isSubmenu: false}); // top-level menu or menu in action toolbar
        case 'submenu':
          return new PopoverRef({isSubmenu: true});
        case 'group':
          return inject(PopoverRef, {skipSelf: true});
      }
    },
  };
}

/**
 * Indicates whether {@link SciMenuComponent} is acting as a menu, submenu, or group.
 */
const SCI_MENU_COMPONENT_ROLE = new InjectionToken<'menu' | 'submenu' | 'group'>('SCI_MENU_COMPONENT_ROLE');

/**
 * Represents the preferred menu size.
 */
interface MenuSize {
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  maxHeight?: string;
}

/**
 * Specifies the features of the group.
 */
export interface SciMenuGroupConfig {
  label?: string;
  collapsible: boolean;
  collapsed: boolean;
  hideGlyphArea: boolean;
  actions: SciMenuItemLike[];
}
