/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { Component } from '@angular/core';

@Component({
  selector: 'sci-sashbox-page',
  templateUrl: './sci-sashbox-page.component.html',
  styleUrls: ['./sci-sashbox-page.component.scss'],
})
export class SciSashboxPageComponent {

  public direction: 'row' | 'column' = 'row';

  public sashes: Sash[] = [
    {visible: true, size: '100px', minSize: 75},
    {visible: true, size: '1', minSize: 50},
    {visible: true, size: '100px', minSize: 75},
  ];
}

export interface Sash {
  visible: boolean;
  size?: string;
  minSize?: number;
}
