/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, inject, signal, viewChild} from '@angular/core';
import {Route, Router, RouterOutlet} from '@angular/router';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {ReactiveFormsModule} from '@angular/forms';
import {contributeMenu, SciMenubarComponent, SciMenuFactory, SciToolbarComponent} from '@scion/components/menu';
import {readQueryParamFlag} from './common/query-params.util';
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

  private readonly _routerOutlet = viewChild.required(RouterOutlet);
  private readonly _features = this.getFeatures();

  protected readonly activatedFeature = signal<Feature | undefined>(undefined);

  constructor() {
    this.contributeMenubar();
    this.contributeSettingsToolbar();
  }

  private contributeMenubar(): void {
    const showInternalFeatures = readQueryParamFlag('internal', {transform: value => coerceBooleanProperty(value)});
    const activatedFeature = this.activatedFeature;

    contributeMenu('menubar:main', menubar => {
      // Add menu for public features.
      menubar.addMenu({label: 'Components', menu: {filter: {focus: true}}}, menu => {
        contributeFeatureMenuItems(menu, this._features.filter(feature => !feature.internal));
      });

      // Add menu for internal features.
      if (showInternalFeatures()) {
        menubar.addMenu({label: 'Internal Components', menu: {filter: {focus: true}}}, menu => {
          contributeFeatureMenuItems(menu, this._features.filter(feature => feature.internal));
        });
      }
    });

    function contributeFeatureMenuItems(menu: SciMenuFactory, features: Feature[]): void {
      const router = inject(Router);

      features.forEach(feature => {
        menu.addMenuItem({
          label: feature.name,
          active: computed(() => activatedFeature()?.route === feature.route),
          onSelect: () => void router.navigate([feature.routerPath], {queryParamsHandling: 'preserve'}),
        });
      });
    }
  }

  private contributeSettingsToolbar(): void {
    contributeMenu('toolbar:settings', toolbar => toolbar
      .addToolbarControl({component: ThemeSwitcherComponent})
      .addToolbarMenu({icon: 'scion.more_vertical', visualMenuIndicator: false}, menu => menu),
    );
  }

  private getFeatures(): Feature[] {
    return inject(Router).config.map(route => ({
      routerPath: `/${route.path}`,
      route: route,
      name: route.path!,
      internal: (route.data?.['internal'] ?? false) as boolean,
    }));
  }

  protected onRouteActivate(): void {
    const route = this._routerOutlet().activatedRoute;
    this.activatedFeature.set(this._features.find(feature => feature.route === route.routeConfig));
  }
}

interface Feature {
  routerPath: string;
  route: Route;
  name: string;
  internal: boolean;
}
