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
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {

  public links: ComponentLink[];

  constructor(router: Router) {
    this.links = router.config.reduce((links, route) => {
      return links.concat({path: `/${route.path}`, label: route.path});
    }, []);
  }
}

export interface ComponentLink {
  path: string;
  label: string;
}
