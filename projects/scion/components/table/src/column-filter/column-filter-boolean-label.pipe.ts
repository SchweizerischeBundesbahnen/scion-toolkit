/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'sciColumnFilterBooleanLabel'})
export class ColumnFilterBooleanLabelPipe implements PipeTransform {

  public transform(value: unknown | null): string | null {
    if (value === true) {
      return '%scion.components.yes.value';
    }
    if (value === false) {
      return '%scion.components.no.value';
    }
    return null;
  }
}
