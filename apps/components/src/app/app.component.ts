/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, inject, Signal} from '@angular/core';
import {isActive, Router, RouterOutlet} from '@angular/router';
import {ReactiveFormsModule} from '@angular/forms';
import {contributeMenu, SciMenubarComponent, SciMenuFactory, SciToolbarComponent} from '@scion/components/menu';
import {ThemeSwitcherComponent} from './theme/theme-switch-button/theme-switcher.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    SciMenubarComponent,
    SciToolbarComponent,
  ],
})
export class AppComponent {

  private readonly _tools = this.findTools();

  protected readonly activeTool = computed(() => this._tools.find(tool => tool.active()));

  constructor() {
    this.contributeMenubar();
    this.contributeToolbar();
  }

  private contributeMenubar(): void {
    contributeMenu('menubar:main', menubar => {
      const showInternalTools = computeShowInternalTools();

      // Add menu for public tools.
      menubar.addMenu({label: 'Components', menu: {filter: {focus: true}}}, menu => {
        contributeToolsMenuItems(menu, this._tools.filter(tool => !tool.internal));
      });

      // Add menu for internal tools.
      menubar.addMenu({label: 'Internal Components', visible: showInternalTools, menu: {filter: {focus: true}}}, menu => {
        contributeToolsMenuItems(menu, this._tools.filter(tool => tool.internal));
      });
    });

    function contributeToolsMenuItems(menu: SciMenuFactory, tools: Tool[]): void {
      const router = inject(Router);

      tools.forEach(tool => menu.addMenuItem({
        label: tool.name,
        active: tool.active,
        onSelect: () => void router.navigate([tool.routerPath], {queryParamsHandling: 'preserve'}),
      }));
    }
  }

  private contributeToolbar(): void {
    contributeMenu('toolbar:main', toolbar => toolbar
      .addToolbarControl({component: ThemeSwitcherComponent})
      .addToolbarMenu({
        icon: 'scion.more_vertical',
        visualMenuIndicator: false,
        menu: {name: 'menu:toolbar.main'},
      }),
    );
  }

  private findTools(): Tool[] {
    return inject(Router).config.map(route => ({
      routerPath: `/${route.path}`,
      name: route.path!,
      internal: (route.data?.['internal'] ?? false) as boolean,
      active: isActive(route.path!, inject(Router), {queryParams: 'ignored', fragment: 'ignored', matrixParams: 'ignored'}),
    }));
  }
}

function computeShowInternalTools(): Signal<boolean> {
  const router = inject(Router);
  return computed(() => isActive('?internal', router)() || isActive('?internal=true', router)());
}

interface Tool {
  routerPath: string;
  name: string;
  internal: boolean;
  active: Signal<boolean>;
}
