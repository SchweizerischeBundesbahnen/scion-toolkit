/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {afterNextRender, ChangeDetectionStrategy, Component, computed, Directive, DOCUMENT, effect, ElementRef, inject, InjectionToken, input, linkedSignal, Provider, signal, Signal, Type, untracked, viewChild, ViewContainerRef} from '@angular/core';
import {FormatAcceleratorPipe} from './accelerator-format.pipe';
import {MenuItemGroupComponent} from './menu-group.component';
import {MenuFilterComponent} from './menu-filter.component';
import {MenuFilter} from './menu-filter.service';
import {ToolbarStateDirective} from '../toolbar/toolbar-state.directive';
import {NgTemplateOutlet} from '@angular/common';
import {SciMenuGroup, SciMenuItem, SciMenuItemLike} from '../menu.model';
import {ɵSciMenuService} from '../ɵmenu.service';
import {SciToolGroupComponent} from '../toolbar/toolbar-group.component';
import {NULL_MENU_CONTRIBUTIONS} from '../menu-contribution.model';
import {SciViewportComponent} from '@scion/components/viewport';
import {animationFrameScheduler, concat, fromEvent, map, NEVER, of, subscribeOn, switchMap, take, timer} from 'rxjs';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {SciTextPipe, Translatable} from '@scion/components/text';
import {SciAttributesDirective, SciComponentOutletDirective} from '@scion/components/common';
import {SciIconComponent} from '@scion/components/icon';
import {fromResize$} from '@scion/toolkit/observable';
import {RequireOne} from '@scion/toolkit/types';

/**
 * Represents a menu or a group of menu items.
 *
 * TODO [menu] This component is not reused anymore, thus remove comments below.
 */
@Component({
  selector: 'sci-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormatAcceleratorPipe,
    MenuItemGroupComponent,
    MenuFilterComponent,
    SciToolGroupComponent,
    ToolbarStateDirective,
    SciViewportComponent,
    NgTemplateOutlet,
    SciTextPipe,
    SciComponentOutletDirective,
    SciAttributesDirective,
    SciIconComponent,
  ],
  providers: [
    provideMenuFilter(),
  ],
  host: {
    '[class.no-glyph-area]': '!hasGlyphArea()',
    '[style.width]': 'size()?.width',
    '[style.min-width]': 'size()?.minWidth',
    '[style.max-width]': 'size()?.maxWidth',
    '[style.--ɵmenu-max-height]': 'size()?.maxHeight',
    '[style.--ɵmenu-scrolling]': 'scrolling() ? `true` : null',
    '[class]': 'cssClass()',
  },
  hostDirectives: [
    {directive: SciAttributesDirective, inputs: ['sciAttributes: attributes']},
  ],
})
export class MenuComponent {

  // TODO [menu] Can menu items change? Before SciMenuOpener, this was possible. SciMenuOpener, however, always opens a new menu.
  public readonly menuItems = input.required<Array<SciMenuItem | SciMenuGroup>>();
  public readonly disabled = input<boolean>();
  public readonly filter = input<{placeholder?: Signal<Translatable>; notFoundText?: Signal<Translatable>; focus?: boolean}>();
  public readonly group = input<{label?: string; collapsible: boolean; collapsed: boolean; actions: SciMenuItemLike[]}>();
  public readonly sizeInput = input<{width?: string; minWidth?: string; maxWidth?: string; maxHeight?: string}>();
  public readonly glyphArea = input<boolean>();
  public readonly anchorWidth = input(undefined, {transform: (width: number | undefined): string | undefined => width ? `${width}px` : undefined});
  public readonly cssClass = input<string[]>();

  private readonly _menuService = inject(ɵSciMenuService);
  private readonly _menuFilter = inject(MenuFilter);
  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly _document = inject(DOCUMENT);
  private readonly _actionToolbarMenuOpen = signal(false);
  private readonly _filterField = viewChild(MenuFilterComponent, {read: ElementRef<HTMLElement>});
  private readonly _viewport = viewChild(SciViewportComponent);

  protected readonly type = inject(MENU_TYPE);
  protected readonly hasGlyphArea = computed(() => this.glyphArea() ?? requiresGlyphArea(this.menuItems()));
  protected readonly menuItemsFiltered = computed(() => this.menuItems().filter(menuItem => this.matchesFilter(menuItem)()));
  protected readonly popoverAnchor = viewChild.required('popover_anchor', {read: ViewContainerRef});
  protected readonly scrolling = this.computeScrolling();
  protected readonly activeSubMenuItem = linkedSignal<SciMenuItemLike[], {menuItem: SciMenuItem; element: HTMLElement} | null>({
    source: this.menuItemsFiltered, // reset active sub menu item when filter changes (otherwise, popopver would loose its anchor and render left-top of the viewport)
    computation: () => null,
  });

  protected readonly NULL_MENU_CONTRIBUTION = NULL_MENU_CONTRIBUTIONS;

  protected readonly isGroupExpanded = linkedSignal(() => {
    const group = this.group();

    if (!group) {
      return true;
    }

    return this._menuFilter.active() || !group.collapsible || !group.collapsed;
  });

  protected readonly size = linkedSignal<PreferredSize | undefined>(() => {
    if (this.type === 'group') {
      return undefined;
    }

    const defaultMinWidth = this.type === 'submenu' ? 'var(--sci-menu-submenu-min-width)' : 'var(--sci-menu-min-width)';
    const preferredMinWidth = this.sizeInput()?.minWidth ?? defaultMinWidth;
    return {
      width: this.sizeInput()?.width,
      minWidth: this.anchorWidth() ? `max(${preferredMinWidth}, ${this.anchorWidth()})` : preferredMinWidth,
      maxWidth: this.sizeInput()?.maxWidth ?? this.sizeInput()?.width,
      maxHeight: this.sizeInput()?.maxHeight,
    };
  });

  constructor() {
    // Close action menu when this component is re-used.
    effect(() => {
      this.menuItems();

      untracked(() => {
        const popover = this._host.appendChild(this._document.createElement('div'));
        popover.setAttribute('popover', '');
        popover.style.setProperty('display', 'none');
        popover.showPopover();
        popover.remove();
      });
    });

    // Open popover when hovering over a submenu item, or hide it otherwise.
    effect(onCleanup => {
      const activeSubMenuItem = this.activeSubMenuItem();
      untracked(() => {
        if (!activeSubMenuItem) {
          return;
        }
        const menuItem = activeSubMenuItem.menuItem;
        const menu = menuItem.menu!;
        const ref = this._menuService.open(menu.children, {
          anchor: activeSubMenuItem.element,
          viewContainerRef: this.popoverAnchor(),
          cssClass: menuItem.cssClass,
          attributes: menuItem.attributes,
          filter: menu.filter as RequireOne<{placeholder?: Signal<Translatable>; notFoundText?: Signal<Translatable>; focus?: boolean}> | undefined,
          size: {
            width: menu.width,
            minWidth: menu.minWidth,
            maxWidth: menu.maxWidth,
            maxHeight: menu.maxHeight,
          },
          submenu: true,
          align: 'horizontal',
        });
        ref.onClose(() => {
          // do not close other menu
          this.activeSubMenuItem.update(it => it === activeSubMenuItem ? null : it);
        });
        onCleanup(() => ref.close());
      });
    });

    this.freezeCurrentWidth();
    this.focusFilterField();
  }

  protected async onSelect(menuItem: SciMenuItem): Promise<void> {
    // TODO [menu] Disable during action until promise resolved.
    // TODO [menu] toggle menu
    if (await menuItem.onSelect!()) {
      this.close();
    }
  }

  protected onGroupToggle(): void {
    this.isGroupExpanded.update(expanded => !expanded);
  }

  protected onMenuOpen(menuItem: {menuItem: SciMenuItem; element: HTMLElement} | null): void {
    const disabled = this.disabled() || menuItem?.menuItem.disabled?.(); // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
    this.activeSubMenuItem.set(disabled ? null : menuItem);

    // Create and display "fake" popover to close popover when hovering menu items of other groups.
    if (!this.activeSubMenuItem() && !this._actionToolbarMenuOpen()) {
      const popover = this._host.appendChild(this._document.createElement('div'));
      popover.setAttribute('popover', '');
      popover.style.setProperty('display', 'none');
      popover.showPopover();
      popover.remove();
    }
  }

  protected onFilterChange(filter: string): void {
    this._menuFilter.setFilterText(filter);
  }

  protected onActionToolbarMenuOpen(open: boolean): void {
    this._actionToolbarMenuOpen.set(open);
  }

  /**
   * Maintain stable width when expanding/collapsing groups or hovering menu item with an actions toolbar.
   */
  private freezeCurrentWidth(): void {
    if (this.type === 'group') {
      return;
    }

    fromResize$(this._host, {box: 'border-box'})
      .pipe(
        subscribeOn(animationFrameScheduler),
        take(1),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.size.update(size => ({...size, width: `${this._host.getBoundingClientRect().width}px`}));
      });
  }

  /**
   * Focuses filter field if configured.
   */
  private focusFilterField(): void {
    afterNextRender(() => {
      if (this.filter()?.focus) {
        const filterField = this._filterField()?.nativeElement as HTMLElement | undefined;
        filterField?.focus();
      }
    });
  }

  private computeScrolling(): Signal<boolean> {
    return toSignal(toObservable(this._viewport)
      .pipe(
        switchMap(viewport => viewport ? fromEvent(viewport.viewportElement, 'scroll') : NEVER),
        switchMap(() => concat(of(true), timer(150).pipe(map(() => false)))),
      ), {initialValue: false});
  }

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

  private close(): void {
    const popover = this._document.documentElement.appendChild(this._document.createElement('div'));
    popover.setAttribute('popover', '');
    popover.style.setProperty('display', 'none');
    popover.showPopover();
    popover.remove();
  }
}

/**
 * Computes if a glyph area is needed for icons and checkmarks.
 *
 * A glyph area is required if any group needs one, even if the context does not.
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

interface PreferredSize {
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  maxHeight?: string;
}

/**
 * Returns a directive providing the specified menu type for injection.
 */
export function provideMenuType(menuType: 'menu' | 'submenu' | 'group'): Type<unknown> {
  @Directive({providers: [{provide: MENU_TYPE, useValue: menuType}]})
  class MenuTypeProvider {
  }

  return MenuTypeProvider;
}

/**
 * Provides a {@link MenuFilter}, linked to the parent menu filter if a group or submenu.
 */
function provideMenuFilter(): Provider {
  return {
    provide: MenuFilter,
    useFactory: () => {
      // Inherit parent filter if a group or submenu, but not if a top-level menu.
      // Otherwise, menu items of action toolbar would also be filtered.
      const inheritFilter = inject(MENU_TYPE) !== 'menu';
      return new MenuFilter(inheritFilter ? inject(MenuFilter, {skipSelf: true, optional: true}) : null);
    },
  };
}

/**
 * Indicates the usage of {@link MenuComponent}.
 */
const MENU_TYPE = new InjectionToken<'menu' | 'submenu' | 'group'>('SCI_MENU_TYPE');
