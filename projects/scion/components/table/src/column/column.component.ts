/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, effect, ElementRef, inject, input, untracked} from '@angular/core';
import {SciColumn} from '../table.model';

@Component({
  selector: 'sci-column',
  template: '',
  host: {
    '[attr.data-column]': 'column().name',
  },
})
export class SciColumnComponent {

  public readonly column = input.required<SciColumn>();

  constructor() {
    this.injectLocationToColumn();
  }

  private injectLocationToColumn(): void {
    const element = inject(ElementRef).nativeElement as HTMLElement;

    effect(onCleanup => {
      const column = this.column();

      untracked(() => {
        const location = column.location = {
          get x(): number {
            return element.getBoundingClientRect().left;
          },
          get width(): number {
            return element.offsetWidth;
          },
        };
        onCleanup(() => {
          if (column.location === location) {
            column.location = {x: 0, width: 0};
          }
        });
      });
    });
  }
}
