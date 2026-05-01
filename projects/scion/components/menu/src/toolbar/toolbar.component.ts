/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, Injector, input, untracked, ViewContainerRef} from '@angular/core';
import {SciToolGroupComponent} from './toolbar-group.component';
import {ɵinstallMenuAccelerators, ɵSciMenuAcceleratorOptions} from '../menu-accelerators';
import {ɵSciMenuService} from '../ɵmenu.service';
import {MaybeArray} from '@scion/toolkit/types';
import {injectMenuAcceleratorTargets, injectMenuContext} from '../menu-environment/menu-environment-providers';

/**
 * TODO [menu]: Explain how to size the toolbar. (height can be set; icon size by setting a CSS variable)
 *
 * TODO [menu]: Mention that component is :empty if no menu items, e.g., to hide empty toolbar:
 * ```scss
 * sci-toolbar:empty {
 *   display: none;
 * }
 * ```
 *
 * Control the toolbar item size by setting the `--sci-toolbar-item-size` CSS variable, globally in the document root or on a specific toolbar component. Defaults to 16px.
 */
@Component({
  selector: 'sci-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  imports: [
    SciToolGroupComponent,
  ],
  host: {
    '[attr.name]': 'name()', // Enable selection by name if passing the name via dynamic input binding.
  },
})
export class SciToolbarComponent {

  public readonly name = input.required<`toolbar:${string}`>();
  public readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  public readonly context = input<Map<string, unknown>>();
  public readonly acceleratorTarget = input<MaybeArray<Element | ElementRef<Element>>>();
  public readonly popoverViewContainerRef = input<ViewContainerRef>(inject(ViewContainerRef));

  private readonly _environmentContext = injectMenuContext();
  private readonly _context = computed(() => new Map([...this._environmentContext(), ...this.context() ?? new Map()]));

  protected readonly menuItems = inject(ɵSciMenuService).menuItems(this.name, this._context);

  constructor() {
    this.installAccelerators();
  }

  /**
   * Installs accelerators of menu items in this toolbar, recursively for menu items in submenus and groups.
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
