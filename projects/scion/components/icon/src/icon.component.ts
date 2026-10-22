/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, Directive, inject, ResourceRef, Signal, TemplateRef, untracked, viewChild} from '@angular/core';
import {coerceSignal, SciComponentDescriptor, SciComponentOutletDirective} from '@scion/components/common';
import {IconProviders} from './icon-providers';
import {fromMutation$} from '@scion/toolkit/observable';
import {concatWith, map, Observable, of} from 'rxjs';
import {rxResource} from '@angular/core/rxjs-interop';

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
 * @see provideIconProvider
 *
 * TODO [Angular 23] Consider changing encapsulation to `IsolatedShadowDom` when stable. See branch: issue/icon-shadow-dom.
 */
@Component({
  selector: 'sci-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  imports: [
    SciComponentOutletDirective,
  ],
  host: {
    '[attr.icon]': 'slottedContent.value()', // Public API: Enables selecting the icon by name in CSS
  },
})
export class SciIconComponent {

  protected readonly slottedContent = this.computeSlottedContent();
  protected readonly iconDescriptor = this.computeIconDescriptor();

  private readonly _slotTemplate = viewChild.required<TemplateRef<void>>('slot_template');

  private computeIconDescriptor(): Signal<SciComponentDescriptor | undefined> {
    const iconProviders = inject(IconProviders);

    return computed(() => {
      const slottedContent = this.slottedContent.value();

      return untracked(() => {
        const iconDescriptor = iconProviders.provide(slottedContent);

        // Augment icon descriptor.
        return iconDescriptor && {
          ...iconDescriptor,
          attributes: computed(() => ({
            ...coerceSignal(iconDescriptor.attributes)?.(),
            // Prevent user agent translating the icon.
            translate: 'no',
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
  private computeSlottedContent(): ResourceRef<string | undefined> {
    return rxResource({
      params: () => this._slotTemplate(),
      stream: ({params: slotTemplate}) => new Observable<string | undefined>(observer => {
        // Instantiate template to read slotted content.
        const view = slotTemplate.createEmbeddedView(undefined);

        // Return if empty, i.e., no icon to render.
        if (!view.rootNodes.length) {
          observer.next(undefined);
          return;
        }

        // Ensure only text is provided as slotted content.
        if (view.rootNodes.length > 1 || (view.rootNodes[0] as Element).nodeType !== Node.TEXT_NODE) {
          observer.error(Error('[InvalidInputError] Only text (ligature) is allowed in slotted content of <sci-icon>.'));
          return;
        }

        // Observe slotted content.
        const textNode = view.rootNodes[0] as Text;
        const subscription = of(textNode.textContent)
          .pipe(
            concatWith(fromMutation$(textNode, {characterData: true}).pipe(map(() => textNode.textContent))),
            map(slottedContent => slottedContent.trim() || undefined),
          )
          .subscribe(observer);

        return () => {
          subscription.unsubscribe();
          view.destroy();
        };
      }),
    });
  }
}

/**
 * Sets the font size to 'var(--sci-icon-size, 1em)', required to inherit the location's font size for icons with a fixed font size.
 * For example, Material sets a fixed font size of 24px.
 */
@Directive({host: {'[style.font-size]': `'var(--sci-icon-size, 1em)'`}})
class IconFontSizeDirective {
}
