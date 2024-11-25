/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component} from '@angular/core';

/**
 * Represents a circular throbber with points rotating around the center of a circle. Points have a delayed acceleration, which leads to an accordion effect.
 *
 * Throbber type: `roller`
 */
@Component({
  selector: 'sci-roller-throbber',
  templateUrl: './roller-throbber.component.html',
  styleUrls: ['./roller-throbber.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SciRollerThrobberComponent {
}
