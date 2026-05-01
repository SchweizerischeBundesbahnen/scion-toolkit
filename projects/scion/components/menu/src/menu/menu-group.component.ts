/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, ChangeDetectionStrategy, Component, computed, createComponent, effect, ElementRef, EnvironmentInjector, inject, Injector, input, inputBinding, untracked} from '@angular/core';
import {MenuComponent, provideMenuType} from './menu.component';
import {SciMenuGroup} from '../menu.model';

/**
 * Alias for {@link MenuComponent} with the name `sci-menu-group` instead of `sci-menu`.
 */
@Component({
  selector: 'sci-menu-group',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemGroupComponent {

  public readonly group = input.required<SciMenuGroup>();
  public readonly glyphArea = input.required<boolean>();
  public readonly disabled = input<boolean>();

  constructor() {
    const elementInjector = inject(Injector);
    const environmentInjector = inject(EnvironmentInjector);
    const hostElement = inject(ElementRef).nativeElement as HTMLElement;
    const applicationRef = inject(ApplicationRef);

    effect(onCleanup => untracked(() => {
      const componentRef = createComponent(MenuComponent, {
        elementInjector,
        environmentInjector,
        hostElement,
        directives: [
          provideMenuType('group'),
        ],
        bindings: [
          inputBinding('menuItems', computed(() => this.group().children)),
          inputBinding('disabled', this.disabled),
          inputBinding('group', computed(() => {
            const group = this.group();

            return {
              label: group.label?.(),
              collapsible: !!group.collapsible,
              collapsed: group.collapsible?.collapsed ?? false,
              actions: group.actions,
            };
          })),
          inputBinding('glyphArea', this.glyphArea),
        ],
      });

      // Register the newly created refto include it into change detection cycles.
      applicationRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();

      // Destroy component when host is destroyed.
      onCleanup(() => componentRef.destroy());
    }));
  }
}
