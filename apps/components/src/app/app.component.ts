/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {ActivatedRoute, Router, RouterLink, RouterOutlet} from '@angular/router';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {sortArray} from '@scion/toolkit/operators';
import {AsyncPipe, NgFor} from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    AsyncPipe,
    RouterLink,
    RouterOutlet,
  ],
})
export class AppComponent {

  public tools$: Observable<Tool[]>;

  constructor(router: Router, activatedRoute: ActivatedRoute) {
    this.tools$ = activatedRoute.queryParamMap
      .pipe(
        map(params => coerceBooleanProperty(params.get('internal'))),
        map(includeInternalTools => router.config
          .filter(route => includeInternalTools || !route.data?.['internal'])
          .reduce((tools, route) => {
            return tools.concat({
              routerPath: `/${route.path}`,
              name: route.path!,
              internal: route.data?.['internal'] ?? false,
            });
          }, new Array<Tool>())),
        sortArray((tool1, tool2) => Number(tool1.internal) - Number(tool2.internal)),
      );
  }
}

export interface Tool {
  routerPath: string;
  name: string;
  internal: boolean;
}
