/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, DOCUMENT, effect, ElementRef, inject, input, Signal, signal, untracked} from '@angular/core';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {SciViewportComponent} from '@scion/components/viewport';
import {FieldState, FieldTree, form, FormField} from '@angular/forms/signals';
import {SciIconComponent} from '@scion/components/icon';
import {ThemeSwitcher} from '../theme/theme-switcher.service';

/**
 * Represents a form for viewing and editing design tokens.
 */
@Component({
  selector: 'app-design-token-form',
  templateUrl: './design-token-form.component.html',
  styleUrl: './design-token-form.component.scss',
  imports: [
    SciFilterFieldComponent,
    SciViewportComponent,
    SciIconComponent,
    FormField,
  ],
})
export class DesignTokenFormComponent {

  /**
   * Specifies the form created via {@link createDesignTokenForm}.
   */
  public readonly form = input.required<FieldTree<DesignTokenForm>>();

  /**
   * Specifies the element used to read design token defaults. Defaults to the document root (`<html>`).
   */
  public readonly designTokenRootElement = input<HTMLElement>(inject(DOCUMENT).documentElement);

  protected readonly filter = signal<string | null>(null);

  protected readonly fields = computed(() => {
    const filter = this.filter();
    return Object.entries(this.form()).filter(([name]) => filter !== null ? name.toLocaleLowerCase().includes(filter.toLocaleLowerCase()) : true);
  });

  protected onFilter(filter: string): void {
    this.filter.set(filter || null);
  }

  protected onFieldReset(name: string, field: FieldState<unknown>): void {
    field.reset(getComputedStyle(this.designTokenRootElement()).getPropertyValue(name));
    field.focusBoundControl();
  }
}

/**
 * Creates a form for viewing and editing specified design tokens.
 *
 * Modified design tokens are set on the specified `target` element.
 *
 * Defaults are read from the document root (`<html>`), or from `options.designTokenRootElement` if provided.
 */
export function createDesignTokenForm(designTokens: `--${string}`[], target: Signal<ElementRef<HTMLElement> | undefined>, options?: {designTokenRootElement: HTMLElement}): FieldTree<DesignTokenForm> {
  const designTokenForm = form(signal<DesignTokenForm>(Object.fromEntries(designTokens.map(name => [name, '']))));
  const designTokenRootElement = options?.designTokenRootElement ?? inject(DOCUMENT).documentElement;
  const themeSwitcher = inject(ThemeSwitcher);

  // Initialize fields with theme-specific defaults.
  effect(() => {
    themeSwitcher.theme();

    // Reset fields that have not been modified by the user.
    const computedStyle = getComputedStyle(designTokenRootElement);
    untracked(() => {
      for (const [name, field] of designTokenForm) {
        if (!field().dirty()) {
          field().reset(computedStyle.getPropertyValue(name));
        }
      }
    });
  });

  // Set modified design tokens on the target.
  effect(() => {
    const targetElement = target()?.nativeElement;
    if (!targetElement) {
      return;
    }

    for (const [name, field] of designTokenForm) {
      targetElement.style.setProperty(name, field().dirty() ? field().value() : null);
    }
  });

  return designTokenForm;
}

export interface DesignTokenForm {
  [name: `--${string}`]: string;
}
