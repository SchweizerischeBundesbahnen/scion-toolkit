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
 * Represents a throbber with a rippled, centric wave effect, similar to throwing a stone into water.
 *
 * Throbber type: `ripple`
 */
@Component({
  selector: 'sci-ripple-throbber',
  templateUrl: './ripple-throbber.component.html',
  styleUrls: ['./ripple-throbber.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SciRippleThrobberComponent {
}
