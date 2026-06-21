/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, Directive, ElementRef, inject, Signal, untracked, ViewEncapsulation} from '@angular/core';
import {coerceSignal, SciComponentDescriptor, SciComponentOutletDirective} from '@scion/components/common';
import {IconProviders} from './icon-providers';
import {fromMutation$} from '@scion/toolkit/observable';
import {animationFrameScheduler, concatWith, defer, map, of, subscribeOn} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';

/**
 * Renders an icon based on registered icon providers.
 *
 * Set the icon name as the slotted content of the `<sci-icon>` component.
 *
 * Example:
 * ```html
 * <sci-icon>home</sci-icon>
 * ```
 *
 * Icons can be contributed via icon providers. Register an icon provider using the {@link provideIconProvider} function.
 *
 * ```ts
 * import {provideIconProvider} from '@scion/components/icon';
 * import {ComponentType} from '@angular/cdk/portal';
 * import {SciComponentDescriptor} from '@scion/components/common';
 *
 * provideIconProvider((icon: string): ComponentType<unknown> | SciComponentDescriptor | undefined => {
 *   return ...;
 * });
 * ```
 *
 * Providers are called in registration order. If a provider does not provide the icon, the next provider is called, and so on.
 * If no provider provides the icon, defaults to a Material icon provider, interpreting the icon as a Material icon font ligature.
 * Refer to https://fonts.google.com/icons for available Material icons and instructions on including the Material icon font.
 *
 * By default, the icon size is `1em`. To change the size, set the font-size on the `<sci-icon>` element or use the `--sci-icon-size` CSS variable.
 *
 * ```scss
 * sci-icon {
 *   --sci-icon-size: 16px;
 * }
 * ```
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
 *
 * @see provideIconProvider
 *
 * TODO [Angular 23] Consider changing encapsulation to `IsolatedShadowDom` when stable. See branch: issue/icon-shadow-dom.
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
    '[attr.icon]': 'slottedContent()', // Public API: Enables selecting the icon by name in CSS
    '[attr.translate]': '`no`',
  },
})
export class SciIconComponent {

  protected readonly slottedContent = this.computeSlottedContent();
  protected readonly iconDescriptor = this.computeIconDescriptor();

  private computeIconDescriptor(): Signal<SciComponentDescriptor | undefined> {
    const iconProviders = inject(IconProviders);

    return computed(() => {
      const slottedContent = this.slottedContent();

      return untracked(() => {
        const iconDescriptor = iconProviders.provide(slottedContent);
        if (!iconDescriptor) {
          return undefined;
        }

        const attributes = coerceSignal(iconDescriptor.attributes);
        const partAttribute = computed(() => attributes?.()['part']?.split(/\s+/) ?? []);

        // Augment icon descriptor.
        return iconDescriptor && {
          ...iconDescriptor,
          attributes: computed(() => ({
            ...attributes?.(),
            // Prevent user agent translating the icon.
            translate: 'no',
            // Add `::part(icon)` pseudo-element to allow custom styling of the icon inside the shadow tree, for example, to change font characteristics of icons of an icon provider.
            // ```scss
            // sci-icon::part(icon) {
            //   font-variation-settings: 'opsz' 20, 'FILL' 0
            // }
            // ```
            part: [
              ...partAttribute(),
              'icon',
            ].join(' '),
          })),
          directives: [
            ...iconDescriptor.directives ?? [],
            // Set icon font size to 'var(--sci-icon-size, 1em)', required to inherit the location's font size for icons with a fixed font size.
            // For example, Material sets a fixed font size of 24px.
            IconFontSizeDirective,
          ],
        } satisfies SciComponentDescriptor;
      });
    });
  }

  /**
   * Reads the icon from slotted content.
   */
  private computeSlottedContent(): Signal<string | undefined> {
    const host = inject(ElementRef).nativeElement as HTMLElement;

    return toSignal(defer(() => of(host.textContent))
      .pipe(
        subscribeOn(animationFrameScheduler),
        concatWith(fromMutation$(host, {characterData: true, subtree: true}).pipe(map(() => host.textContent))),
        map(slottedContent => slottedContent.trim() || undefined),
      ),
    );
  }
}

/**
 * Sets the font size to 'var(--sci-icon-size, 1em)', required to inherit the location's font size for icons with a fixed font size.
 * For example, Material sets a fixed font size of 24px.
 */
@Directive({host: {'[style.font-size]': `'var(--sci-icon-size, 1em)'`}})
class IconFontSizeDirective {
}
