/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, inject, Injector, Pipe, PipeTransform, Signal, untracked} from '@angular/core';
import {text} from '@scion/components/text';
import {SciEnumColumnValues, SciEnumValueLike} from '../table.model';
import {Arrays} from '@scion/toolkit/util';

/**
 * Creates a comma-separated string with localized labels of the given enum values.
 */
@Pipe({name: 'sciEnumLabel'})
export class SciEnumLabelPipe implements PipeTransform {

  private readonly _injector = inject(Injector);

  public transform(values: SciEnumValueLike | SciEnumValueLike[] | null, enumeration: SciEnumColumnValues): Signal<string | undefined> {
    return computed(() => Arrays.coerce(values)
      .map(value => enumeration.find(entry => entry.value === value)?.label)
      .map(label => untracked(() => text(label, {injector: this._injector}))())
      .filter(Boolean)
      .join(', ') || undefined);
  }
}
