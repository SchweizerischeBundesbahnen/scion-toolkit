/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, Directive, ElementRef, inject, Signal, ViewEncapsulation} from '@angular/core';
import {coerceSignal, SciComponentDescriptor, SciComponentOutletDirective} from '@scion/components/common';
import {IconProviders} from './icon-providers';
import {fromMutation$} from '@scion/toolkit/observable';
import {animationFrameScheduler, concatWith, defer, map, MonoTypeOperatorFunction, of, subscribeOn} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';

/**
 * Renders an icon based on registered icon providers.
 *
 * Set the icon name as slotted content of the `<sci-icon>` component.
 *
 * Example:
 * ```html
 * <sci-icon>home</sci-icon>
 * ```
 *
 * Providers are called in registration order. If a provider does not provide the icon, the next provider is called, and so on.
 * If no provider provides the icon, defaults to a Material icon provider, interpreting the icon as a Material icon ligature.
 *
 * The icon size depends on the font size at its position in the DOM.
 * To change the size, set a font-size on the `<sci-icon>` element or set the `--sci-icon-size` CSS variable.
 *
 * The icon can be styled using the `::part()` pseudo-element selector, for example, to change font characteristics. Supported part names:
 * - `::part(icon)`: styles any icon
 * - `::part(material-icon)`: styles Material icons
 * - `::part(scion-icon)`: styles SCION icons
 *
 * Example:
 * ```scss
 * sci-icon::part(material-icon) {
 *   font-variation-settings: 'opsz' 20, 'FILL' 0
 * }
 * ```
 * @see provideIconProvider
 *
 * TODO [Angular 23] Consider changing encapsulation to `IsolatedShadowDom` when stable. See branch issue/icon-shadow-dom
 */
@Component({
  selector: 'sci-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  encapsulation: ViewEncapsulation.ExperimentalIsolatedShadowDom,
  imports: [
    SciComponentOutletDirective,
  ],
  host: {
    '[attr.translate]': '`no`',
  },
})
export class SciIconComponent {

  protected readonly icon = this.computeIcon();

  /**
   * Reads the icon from slotted content and passes it to registered icon providers for resolution.
   */
  private computeIcon(): Signal<SciComponentDescriptor | undefined> {
    const iconProviders = inject(IconProviders);
    const host = inject(ElementRef).nativeElement as HTMLElement;

    return toSignal(defer(() => of(host.textContent))
      .pipe(
        subscribeOn(animationFrameScheduler),
        concatWith(fromMutation$(host, {characterData: true, subtree: true}).pipe(map(() => host.textContent))),
        map(slottedContent => iconProviders.provide(slottedContent.trim() || undefined)),
        augmentIconDescriptor(),
      ),
    );
  }
}

/**
 * Augments the icon descriptor:
 *
 * - Prevents the browser from translating the icon.
 * - Sets the icon's font size to 'var(--sci-icon-size, 1em)', required to inherit the location's font size for icons with a fixed font size.
 *   For example, Material sets a fixed font size of 24px.
 * - Adds the `::part(icon)` pseudo-element to allow custom styling of the icon inside the shadow tree, for example, to change font characteristics of icons of an icon provider.
 *   ```scss
 *   sci-icon::part(icon) {
 *     font-variation-settings: 'opsz' 20, 'FILL' 0
 *   }
 * ```
 */
function augmentIconDescriptor(): MonoTypeOperatorFunction<SciComponentDescriptor | undefined> {
  return map((iconDescriptor: SciComponentDescriptor | undefined) => {
    if (!iconDescriptor) {
      return undefined;
    }

    const attributes = coerceSignal(iconDescriptor.attributes);
    const partAttribute = computed(() => attributes?.()['part']?.split(/\s+/) ?? []);

    return {
      ...iconDescriptor,
      attributes: computed(() => ({
        ...attributes?.(),
        translate: 'no',
        part: [
          ...partAttribute(),
          'icon', // Public API to change the font characteristics of any icon
        ].join(' '),
      })),
      directives: [
        ...iconDescriptor.directives ?? [],
        IconFontSizeDirective,
      ],
    } satisfies SciComponentDescriptor;
  });
}

/**
 * Sets the font size to 'var(--sci-icon-size, 1em)', required to inherit the location's font size for icons with a fixed font size.
 * For example, Material sets a fixed font size of 24px.
 */
@Directive({host: {'[style.font-size]': `'var(--sci-icon-size, 1em)'`}})
class IconFontSizeDirective {
}
