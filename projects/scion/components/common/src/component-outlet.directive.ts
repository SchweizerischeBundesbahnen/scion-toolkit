/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Binding, ComponentRef, Directive, effect, inject, Injector, input, inputBinding, Provider, Type, untracked, ViewContainerRef} from '@angular/core';
import {ComponentType} from '@angular/cdk/portal';
import {SciAttributesDirective} from './attributes.directive';
import {coerceSignal, MaybeSignal} from './signal.util';

/**
 * Renders a component based on a descriptor, similar to `ngComponentOutlet`, but with input bindings.
 *
 * Usage:
 *
 * ```html
 * <ng-container *sciComponentOutlet="descriptor"/>
 * ````
 *
 * ```ts
 * protected readonly descriptor: SciComponentDescriptor = {
 *   component: FilterComponent,
 *   bindings: [
 *     inputBinding('placeholder', signal('Filter items...')),
 *   ],
 * };
 * ```
 */
@Directive({selector: 'ng-template[sciComponentOutlet]'})
export class SciComponentOutletDirective {

  /**
   * Specifies the component to render.
   */
  public readonly descriptor = input.required<SciComponentDescriptor | undefined | null>({alias: 'sciComponentOutlet'});

  constructor() {
    const viewContainerRef = inject(ViewContainerRef);

    effect(onCleanup => {
      const descriptor = this.descriptor();

      untracked(() => {
        const component = descriptor && createComponent(viewContainerRef, descriptor);
        onCleanup(() => component?.destroy());
      });
    });
  }
}

/**
 * Instantiates the specified component and inserts it after the specified view container.
 */
function createComponent(viewContainerRef: ViewContainerRef, descriptor: SciComponentDescriptor): ComponentRef<unknown> {
  // Provide providers via host directive.
  @Directive({providers: descriptor.providers ?? []})
  class ProvidersDirective {
  }

  // Provide CSS classes via host directive.
  @Directive({host: {'[class]': 'cssClass?.()'}})
  class CssClassDirective {
    protected readonly cssClass = coerceSignal(descriptor.cssClass);
  }

  return viewContainerRef.createComponent(descriptor.component, {
    directives: [
      ProvidersDirective,
      CssClassDirective,
      {type: SciAttributesDirective, bindings: [inputBinding('sciAttributes', coerceSignal(descriptor.attributes ?? {}))]},
      ...descriptor.directives ?? [],
    ],
    bindings: descriptor.bindings,
    injector: descriptor.injector,
  });
}

/**
 * Describes the rendering of a component.
 */
export interface SciComponentDescriptor {
  /**
   * Specifies the component to render.
   */
  component: ComponentType<unknown>;
  /**
   * Specifies input and output bindings.
   *
   * @example - Passing inputs to the component
   * ```ts
   * bindings: [inputBinding('placeholder', signal('Filter items...'))];
   * ```
   *
   * Inputs are available as input properties in the component.
   *
   * @example - Reading inputs in the component
   * ```ts
   * public placeholder = input.required<string>();
   * ```
   *
   * @see inputBinding
   * @see outputBinding
   * @see twoWayBinding
   */
  bindings?: Binding[];
  /**
   * Specifies directives to be applied to the component.
   */
  directives?: Array<Type<unknown> | {type: Type<unknown>; bindings: Binding[]}>;
  /**
   * Specifies the injector used to instantiate the component, giving control over which objects are available for injection. Defaults to the element injector.
   *
   * ```ts
   * Injector.create({
   *   parent: ...,
   *   providers: [
   *    {provide: <TOKEN>, useValue: <VALUE>}
   *   ],
   * })
   * ```
   */
  injector?: Injector;
  /**
   * Specifies providers available for injection in the component.
   */
  providers?: Provider[];
  /**
   * Specifies CSS classes to associate with the component.
   */
  cssClass?: MaybeSignal<string | string[]>;
  /**
   * Specifies HTML attributes to associate with the component.
   *
   * Data attributes should start with the `data-` prefix.
   */
  attributes?: MaybeSignal<{[name: string]: string | undefined}>;
}
