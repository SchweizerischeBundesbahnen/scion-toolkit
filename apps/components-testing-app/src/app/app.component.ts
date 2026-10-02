/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, Component, computed, inject} from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import {contributeMenu, SciMenubarComponent} from '@scion/components/menu';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [RouterOutlet, SciMenubarComponent],
})
export class AppComponent {

  private readonly _router = inject(Router);

  protected readonly url = computed(() => this._router.lastSuccessfulNavigation()?.finalUrl?.toString().substring(1));

  constructor() {
    this.contributeMenubar();
    this.provideWhenAngularStable();
  }

  private contributeMenubar(): void {
    const router = inject(Router);

    contributeMenu('menubar:main', menubar => {
      menubar
        .addMenu({label: 'Components', menu: {filter: {focus: true}}}, menu => menu
          .addMenuItem({label: 'sci-table', onSelect: () => void router.navigate(['components/sci-table'])})
          .addMenu({label: 'sci-sashbox'}, menu => menu
            .addMenuItem({label: 'sci-sashbox', onSelect: () => void router.navigate(['components/sci-sashbox'])})
            .addGroup(group => group
              .addMenuItem({label: 'Animation Test Page', onSelect: () => void router.navigate(['components/sci-sashbox/animation'])}),
            ),
          )
          .addMenu({label: 'sci-viewport'}, menu => menu
            .addMenuItem({label: 'Focus Test Page', onSelect: () => void router.navigate(['components/sci-viewport/focus'])})
            .addMenuItem({label: 'Overlap Test Page', onSelect: () => void router.navigate(['components/sci-viewport/overlap'])})
            .addMenuItem({label: 'Hover Test Page', onSelect: () => void router.navigate(['components/sci-viewport/hover'])}),
          )
          .addMenuItem({label: 'sci-scrollbar', onSelect: () => void router.navigate(['components/sci-scrollbar'])})
          .addMenuItem({label: 'sci-splitter', onSelect: () => void router.navigate(['components/sci-splitter'])})
          .addMenuItem({label: 'sci-icon', onSelect: () => void router.navigate(['components/sci-icon'])}),
        )
        .addMenu({label: 'Toolkit', menu: {filter: {focus: true}}}, menu => menu
          .addMenu({label: 'observable'}, menu => menu
            .addMenuItem({label: 'BoundingClientRect Test Page', onSelect: () => void router.navigate(['toolkit/observable/bounding-client-rect'])}),
          ),
        );
    });
  }

  /**
   * Provides `window.__whenAngularStable` function for tests to wait for Angular to finish pending microtasks and stabilize.
   */
  private provideWhenAngularStable(): void {
    const applicationRef = inject(ApplicationRef);
    (window as unknown as Record<string, unknown>)['__whenAngularStable'] = async (): Promise<void> => {
      await applicationRef.whenStable();
    };
  }
}
