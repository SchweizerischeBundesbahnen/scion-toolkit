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
 * Represents a throbber as an ellipsis consisting of three horizontally arranged points that appear one after the other.
 *
 * Throbber type: `ellipsis`
 */
@Component({
  selector: 'sci-ellipsis-throbber',
  templateUrl: './ellipsis-throbber.component.html',
  styleUrls: ['./ellipsis-throbber.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SciEllipsisThrobberComponent {
}
