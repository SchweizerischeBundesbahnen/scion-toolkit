/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, Binding, ComponentRef, computed, createComponent, DestroyRef, DOCUMENT, ElementRef, EnvironmentInjector, inject, Injectable, Injector, inputBinding, runInInjectionContext, signal, Signal, ViewContainerRef} from '@angular/core';
import {SciMenuItemLike} from './menu.model';
import {SciMenuOptions, SciMenuOrigin, SciMenuRef} from './menu.service';
import {coerceElement} from '@angular/cdk/coercion';
import {provideMenuComponentRole, SciMenuComponent} from './menu/menu.component';
import {dimension} from '@scion/components/dimension';
import {UUID} from '@scion/toolkit/uuid';
import {coerceSignal, createDestroyableInjector} from '@scion/components/common';
import {ɵSciMenuService} from './ɵmenu.service';
import {Arrays} from '@scion/toolkit/util';
import {Translatable} from '@scion/components/text';
import {SciMenuFilterConfig} from './menu/menu.factory';

@Injectable({providedIn: 'root'})
export class SciMenuOpener {

  private readonly _injector = inject(Injector);

  public openMenu(menu: `menu:${string}` | SciMenuItemLike[], options: SciMenuOptions): SciMenuRef {
    // Create injection context to dispose resources when closing the menu.
    const injector = createDestroyableInjector({parent: this._injector});
    const menuItems = Array.isArray(menu) ? signal(menu) : this.menuService.menuItems(menu, options.context ?? new Map(), {injector, metadata: options.metadata});

    return runInInjectionContext(injector, () => {
      // Get or create anchor at specified origin.
      const anchorElement = options.anchor instanceof ElementRef || options.anchor instanceof HTMLElement ? coerceElement(options.anchor) : this.createVirtualAnchor(options.anchor, {viewContainerRef: options.viewContainerRef});

      // Create menu popover.
      const componentRef = this.createMenuPopover(menuItems, anchorElement, options);
      componentRef.onDestroy(() => injector.destroy());

      return {
        close: () => componentRef.destroy(),
        onClose: onClose => componentRef.hostView.destroyed ? onClose() : componentRef.onDestroy(onClose), // Call callback immediately if already destroyed.
      };
    });
  }

  /**
   * Reference to the menu service.
   *
   * - Do not inject during construction to prevent injection cycle.
   * - Do not use {@link SciMenuRegistry} to proxy calls through the adapter chain.
   */
  private get menuService(): ɵSciMenuService {
    return this._injector.get(ɵSciMenuService);
  }

  private createMenuPopover(menuItems: Signal<SciMenuItemLike[]>, anchorElement: HTMLElement, options: SciMenuOptions): ComponentRef<SciMenuComponent> {
    const anchorSize = dimension(anchorElement);
    const bindings: Binding[] = [
      inputBinding('menuItems', menuItems),
      inputBinding('filter', signal(coerceFilterConfig(options.filter))),
      inputBinding('width', signal(options.width)),
      inputBinding('minWidth', signal(options.minWidth)),
      inputBinding('maxWidth', signal(options.maxWidth)),
      inputBinding('maxHeight', signal(options.maxHeight)),
      inputBinding('anchorWidth', computed(() => options.align === 'vertical' ? anchorSize().offsetWidth : undefined)),
      inputBinding('cssClass', signal(Arrays.coerce(options.cssClass))),
      inputBinding('attributes', signal(options.attributes)),
    ];

    // Create menu component and attach it to the DOM.
    const componentRef = (() => {
      if (options.viewContainerRef) {
        return options.viewContainerRef.createComponent(SciMenuComponent, {
          directives: [provideMenuComponentRole(options.submenu ? 'submenu' : 'menu')],
          bindings,
        });
      }
      else {
        const popoverElement = inject(DOCUMENT).createElement('sci-menu');
        const componentRef = createComponent(SciMenuComponent, {
          environmentInjector: inject(EnvironmentInjector),
          hostElement: popoverElement, // is removed when destroying the component
          directives: [provideMenuComponentRole(options.submenu ? 'submenu' : 'menu')],
          bindings,
        });

        // Insert popover after the anchor node.
        anchorElement.after(popoverElement);

        // Attach component to include in change detection.
        inject(ApplicationRef).attachView(componentRef.hostView);

        return componentRef;
      }
    })();

    // Bind popover to anchor.
    const popoverElement = componentRef.location.nativeElement as HTMLElement;
    this.bindPopoverToAnchor({popoverElement, anchorElement, align: options.align ?? 'vertical'});

    // Destroy component when closing the popover.
    popoverElement.addEventListener('toggle', (event: ToggleEvent): void => {
      if (event.newState === 'closed') {
        componentRef.destroy();
      }
    });

    // Run change detection.
    componentRef.changeDetectorRef.detectChanges();

    // Show popover.
    popoverElement.showPopover();

    return componentRef;
  }

  private bindPopoverToAnchor(binding: {popoverElement: HTMLElement; anchorElement: HTMLElement; align: 'vertical' | 'horizontal'}): void {
    const {popoverElement, anchorElement, align} = binding;
    const popoverId = `scimenu-${UUID.randomUUID().substring(0, 8)}`;

    // Connect anchor to popover.
    setAttributes(anchorElement, {
      'popovertarget': popoverId,
      'popovertargetaction': 'show',
    });

    setStyles(anchorElement, {
      'anchor-name': `--${popoverId}`,
    });

    // Mark the anchor as open if opening the menu from a toolbar push button, not a toolbar menu button, e.g., to support opening a menu via accelerator.
    if (anchorElement.classList.contains('toolbar-button')) {
      anchorElement.classList.add('menu-open');
    }

    // Connect popover to anchor.
    setAttributes(popoverElement, {
      'id': popoverId,
      'popover': 'auto',
    });

    if (align === 'horizontal') {
      setStyles(popoverElement, {
        'position-anchor': `--${popoverId}`,
        'position-try-fallbacks': 'flip-inline, flip-block, flip-inline flip-block',
        'top': `calc(anchor(top) - var(--ɵsci-menu-padding-block))`,
        'left': 'calc(anchor(right) + 1px)',
      });
    }
    else {
      setStyles(popoverElement, {
        'position-anchor': `--${popoverId}`,
        'position-try-fallbacks': 'flip-block',
        'top': 'calc(anchor(bottom) + 1px)',
        'left': 'min(anchor(left), calc(100% - var(--ɵsci-menu-width)))', // `calc(100% - var(--ɵsci-menu-width))` prevents pushing the popover out of the page viewport on the right
      });
    }

    // Remove attributes and styles from the anchor element when the popover is closed, only if not displaying another popover in the meantime.
    // No cleanup is required for the popover element because it is destroyed when closed.
    inject(DestroyRef).onDestroy(() => {
      if (anchorElement.getAttribute('popovertarget') !== popoverId) {
        return;
      }

      setAttributes(anchorElement, {
        'popovertarget': null,
        'popovertargetaction': null,
      });
      setStyles(anchorElement, {
        'anchor-name': null,
      });
      if (anchorElement.classList.contains('toolbar-button')) {
        anchorElement.classList.remove('menu-open');
      }
    });
  }

  private createVirtualAnchor(anchor: MouseEvent | SciMenuOrigin, options: {viewContainerRef?: ViewContainerRef}): HTMLElement {
    // Coerce coordinates.
    const {x, y, width, height} = anchor instanceof MouseEvent ? ({x: anchor.x, y: anchor.y}) : anchor;

    // Create virtual anchor element at anchor bounds.
    const virtualAnchorElement = inject(DOCUMENT).createElement('div');
    inject(DestroyRef).onDestroy(() => virtualAnchorElement.remove());

    // Position the anchor element.
    setStyles(virtualAnchorElement, {
      'position': 'fixed',
      'left': `${x}px`,
      'top': `${y}px`,
      'width': width ? `${width}px` : '0',
      'height': height ? `${height}px` : '0',
      'pointer-events': 'none',
    });

    // Attach the anchor element to the DOM.
    if (options.viewContainerRef) {
      (options.viewContainerRef.element.nativeElement as Element).after(virtualAnchorElement);
    }
    else {
      inject(DOCUMENT).body.appendChild(virtualAnchorElement);
    }

    return virtualAnchorElement;
  }
}

function setAttributes(element: HTMLElement, attributes: {[name: string]: string | null}): void {
  Object.entries(attributes).forEach(([name, value]) => {
    if (value === null) {
      element.removeAttribute(name);
    }
    else {
      element.setAttribute(name, value);
    }
  });
}

function setStyles(element: HTMLElement, styles: {[style: string]: string | null}): void {
  Object.entries(styles).forEach(([name, value]) => {
    if (value === null) {
      element.style.removeProperty(name);
    }
    else {
      element.style.setProperty(name, value);
    }
  });
}

function coerceFilterConfig(filter: SciMenuOptions['filter'] | undefined): SciMenuFilterConfig<Signal<Translatable>> | undefined {
  if (typeof filter === 'object') {
    return {
      placeholder: coerceSignal(filter.placeholder),
      notFoundMessage: coerceSignal(filter.notFoundMessage),
      focus: filter.focus,
    };
  }
  return filter === true ? {} : undefined;
}
