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
  const enumEntry = computed(() => enumeration().find(entry => entry.value === value()));
  const label = text(computed(() => enumEntry()?.label), {injector: options.injector ?? inject(Injector)});
  const tooltip = text(computed(() => enumEntry()?.tooltip), {injector: options.injector ?? inject(Injector)});

  return computed(() => {
    if (value() === undefined) {
      return undefined;
    }

    const enumEntry = enumeration().find(entry => entry.value === value());
    if (!enumEntry) {
      return undefined;
    }

    const isDisplayLabel = options.format.label;
    return {
      value: value()!,
      label: label()!,
      icon: enumEntry.icon,
      // Use tooltip if provided, or fall back to label, but only if it is not configured for display.
      tooltip: tooltip() ?? (tooltip() === null || isDisplayLabel ? undefined : label()),
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
  /** localized tooltip, if any, or `null` to not display a tooltip */
  tooltip?: string;
  icon?: string;
}

/**
 * Represents the internal value of {@link SciDateColumn}.
 */
export interface SciDateValue {
  /**
   * Full ISO 8601 date/time string.
   */
  isoString: string;
  /**
   * Milliseconds since UTC epoch.
   */
  millis: number;
  /**
   * Human-readable formatted date and time string.
   */
  formatted: string;
}
