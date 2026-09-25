/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, input} from '@angular/core';
import {SciIconComponent} from '@scion/components/icon';
import {Product} from './sci-table-page.data';

@Component({
  selector: 'app-custom-column',
  template: `
    <sci-icon [class.up]="product().price > 500" [class.down]="product().price <= 500">
      {{product().price > 500 ? 'trending_up' : 'trending_down'}}
    </sci-icon>
  `,
  styles: `
    :host {
      sci-icon.up {
        color: var(--sci-color-positive);
      }

      sci-icon.down {
        color: var(--sci-color-negative);
      }
    }
  `,
  imports: [
    SciIconComponent,
  ],
})
export class CustomColumnComponent {

  public readonly product = input.required<Product>();
}
