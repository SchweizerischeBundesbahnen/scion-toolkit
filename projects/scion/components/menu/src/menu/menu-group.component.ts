/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, Component, computed, createComponent, effect, ElementRef, EnvironmentInjector, inject, Injector, input, inputBinding, untracked} from '@angular/core';
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
    const elementInjector = inject(Injector);
    const environmentInjector = inject(EnvironmentInjector);
    const hostElement = inject(ElementRef).nativeElement as HTMLElement;
    const applicationRef = inject(ApplicationRef);

    effect(onCleanup => untracked(() => {
      const componentRef = createComponent(SciMenuComponent, {
        elementInjector,
        environmentInjector,
        hostElement,
        bindings: [
          inputBinding('menuItems', computed(() => this.group().children)),
          inputBinding('disabled', this.disabled),
          inputBinding('cssClass', this.cssClass),
          inputBinding('group', computed((): SciMenuGroupConfig => ({
            label: this.group().label?.(),
            collapsible: !!this.group().collapsible,
            collapsed: this.group().collapsible?.collapsed ?? false,
            hideGlyphArea: this.group().glyphArea === false,
            actions: this.group().actions ?? [],
          }))),
          inputBinding('glyphArea', this.glyphArea),
        ],
        directives: [
          provideMenuComponentRole('group')],
      });

      // Attach component to Angular component tree for change detection.
      applicationRef.attachView(componentRef.hostView);
      componentRef.changeDetectorRef.detectChanges();

      // Destroy component when host is destroyed.
      onCleanup(() => componentRef.destroy());
    }));
  }
}
