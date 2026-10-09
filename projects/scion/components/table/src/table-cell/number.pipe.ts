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

/**
 * Formats a given number based on the provided {@link Intl.NumberFormat}.
 */
@Pipe({name: 'sciNumber'})
export class SciNumberPipe implements PipeTransform {

  public transform(number: number | undefined, format: Intl.NumberFormat): string | undefined {
    return number !== undefined ? format.format(number) : undefined;
  }
}
