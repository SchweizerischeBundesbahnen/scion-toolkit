/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, inject, Injector, Signal} from '@angular/core';
import {text} from '@scion/components/text';
import {SciEnumColumn, SciEnumColumnValues, SciEnumValueLike} from './table.model';
import {coerceSignal, MaybeSignal} from '@scion/components/common';

/**
 * Creates a {@link SciEnumValue} from the given enum-like input.
 */
export function coerceEnumValue(enumLike: MaybeSignal<SciEnumValueLike | undefined>, options: {enumeration: MaybeSignal<SciEnumColumnValues>; format: SciEnumColumn['format']; injector?: Injector}): Signal<SciEnumValue | undefined> {
  const value = coerceSignal(enumLike, {coerceUndefined: true});
  const enumeration = coerceSignal(options.enumeration);
  const enumEntry = computed(() => value() !== undefined ? enumeration().find(entry => entry.value === value()) : undefined);
  const label = text(computed(() => enumEntry()?.label), {injector: options.injector ?? inject(Injector)});
  const tooltip = text(computed(() => enumEntry()?.tooltip), {injector: options.injector ?? inject(Injector)});

  return computed(() => {
    if (!enumEntry()) {
      return undefined;
    }

    return {
      value: enumEntry()!.value,
      label: label()!,
      icon: enumEntry()!.icon,
      // Use tooltip if provided, or fall back to label, but only if it is not configured for display.
      tooltip: tooltip() ?? (tooltip() === null || options.format.label ? undefined : label()),
    } satisfies SciEnumValue;
  });
}

/**
 * Represents the internal value of {@link SciEnumColumn}.
 */
export interface SciEnumValue {
  value: SciEnumValueLike;
  /** localized text */
  label: string;
  /** localized tooltip */
  tooltip?: string;
  icon?: string;
}
