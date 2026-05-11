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
import {SciQualifierChipListComponent} from '@scion/components.internal/qualifier-chip-list';

@Component({
  selector: 'sci-qualifier-chip-list-page-page',
  templateUrl: './sci-qualifier-chip-list-page.component.html',
  styleUrls: ['./sci-qualifier-chip-list-page.component.scss'],
  imports: [SciQualifierChipListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SciQualifierChipListPageComponent {
}
