/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Represents a classic spinner throbber with strokes arranged radially. The strokes light up one after the other in clockwise direction
 * and then then fade out again.
 *
 * Throbber type: `spinner`
 */
@Component({
  selector: 'sci-spinner-throbber',
  templateUrl: './spinner-throbber.component.html',
  styleUrls: ['./spinner-throbber.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SciSpinnerThrobberComponent {
}
