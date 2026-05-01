/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {SCI_TEXT_PROVIDER} from './text-providers';
import {MaybeSignal} from '@scion/components/common';

/**
 * Enables localization of texts used in SCION.
 *
 * A text provider is a function that returns the text for a translation key.
 *
 * Multiple text providers can be registered. Providers are called in registration order. If a provider does not provide the text,
 * the next provider is called, and so on.
 *
 * The translation keys of built-in SCION texts start with the `scion.` prefix. To not localize built-in SCION texts, the text provider can return `undefined` instead.
 *
 * The function:
 * - Can call `inject` to get any required dependencies.
 * - Can call `toSignal` to convert an Observable to a Signal.
 *
 * @see SciTextProviderFn
 * @see text
 */
export function provideTextProvider(textProviderFn: SciTextProviderFn | undefined): EnvironmentProviders {
  return makeEnvironmentProviders(textProviderFn ? [
    {
      provide: SCI_TEXT_PROVIDER,
      useValue: textProviderFn,
      multi: true,
    },
  ] : []);
}

/**
 * Signature of a function to provide texts.
 *
 * Texts starting with the percent symbol (`%`) are passed to text providers for translation, with the percent symbol omitted.
 *
 * A text provider can be registered via {@link provideTextProvider} function.
 *
 * The function:
 * - Can call `inject` to get any required dependencies.
 * - Can call `toSignal` to convert an Observable to a Signal.
 *
 * @param key - Translation key of the text.
 * @param params - Parameters used for text interpolation.
 * @returns Text associated with the key, or `undefined` if not found.
 *          Localized applications should return the text in the current language, and update the signal with the translated text each time when the language changes.
 */
export type SciTextProviderFn = (key: string, params: {[name: string]: string}) => MaybeSignal<string> | undefined;

/**
 * Represents either a text or a key for translation.
 *
 * A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
 *
 * Key and parameters are passed to registered text providers for translation. A text provider can be registered via
 * {@link provideTextProvider} function.
 *
 * Semicolons in interpolation parameters must be escaped with two backslashes (`\\;`).
 *
 * Examples:
 * - `%key`: translation key
 * - `%key;param=value`: translation key with a single interpolation parameter
 * - `%key;param1=value1;param2=value2`: translation key with multiple interpolation parameters
 * - `text`: no translation key, text is returned as is
 *
 * @see provideTextProvider
 */
export type Translatable = string | `%${string}`;
