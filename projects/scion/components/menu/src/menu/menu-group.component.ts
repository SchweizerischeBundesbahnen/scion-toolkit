/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, Component, computed, createComponent, DestroyRef, ElementRef, EnvironmentInjector, inject, Injector, input, inputBinding} from '@angular/core';
import {provideMenuComponentRole, SciMenuComponent, SciMenuGroupConfig} from './menu.component';
import {SciMenuGroup} from '../menu.model';

/**
 * Alias for {@link SciMenuComponent} with `sci-menu-group` as tag name.
 */
@Component({
  selector: 'sci-menu-group',
  template: '',
})
export class SciMenuGroupComponent {

  public readonly group = input.required<SciMenuGroup>();
  public readonly glyphArea = input.required<boolean>();
  public readonly disabled = input<boolean>();
  public readonly cssClass = input<string[]>();

  constructor() {
    const menuComponent = createComponent(SciMenuComponent, {
      elementInjector: inject(Injector),
      environmentInjector: inject(EnvironmentInjector),
      hostElement: inject(ElementRef).nativeElement as HTMLElement,
      bindings: [
        inputBinding('menuItems', computed(() => this.group().children)),
        inputBinding('disabled', this.disabled),
        inputBinding('cssClass', this.cssClass),
        inputBinding('glyphArea', this.glyphArea),
        inputBinding('group', computed((): SciMenuGroupConfig => ({
          label: this.group().label?.(),
          collapsible: !!this.group().collapsible,
          collapsed: this.group().collapsible?.collapsed ?? false,
          hideGlyphArea: this.group().glyphArea === false,
          actions: this.group().actions ?? [],
        }))),
      ],
      directives: [
        provideMenuComponentRole('group'),
      ],
    });

    // Attach component to Angular component tree for change detection.
    inject(ApplicationRef).attachView(menuComponent.hostView);

    // Destroy component when host is destroyed.
    inject(DestroyRef).onDestroy(() => menuComponent.destroy());
  }
}
