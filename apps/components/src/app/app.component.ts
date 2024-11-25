/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, inject} from '@angular/core';
import {ActivatedRoute, Router, RouterLink, RouterOutlet} from '@angular/router';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {sortArray} from '@scion/toolkit/operators';
import {AsyncPipe} from '@angular/common';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {SciToggleButtonComponent} from '@scion/components.internal/toggle-button';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {ThemeSwitcher} from './theme-switcher.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    AsyncPipe,
    RouterLink,
    RouterOutlet,
    ReactiveFormsModule,
    SciMaterialIconDirective,
    SciToggleButtonComponent,
  ],
})
export class AppComponent {

  protected readonly tools$: Observable<Tool[]>;
  protected readonly lightThemeFormControl = new FormControl<boolean>(true);

  constructor(private _themeSwitcher: ThemeSwitcher) {
    this.tools$ = this.observeTools$();
    this.installThemeSwitcher();
  }

  protected onActivateLightTheme(): void {
    this.lightThemeFormControl.setValue(true);
  }

  protected onActivateDarkTheme(): void {
    this.lightThemeFormControl.setValue(false);
  }

  private observeTools$(): Observable<Tool[]> {
    const router = inject(Router);
    return inject(ActivatedRoute).queryParamMap
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

  private installThemeSwitcher(): void {
    this._themeSwitcher.theme$
      .pipe(takeUntilDestroyed())
      .subscribe(theme => {
        this.lightThemeFormControl.setValue(theme === 'scion-light', {emitEvent: false});
      });

    this.lightThemeFormControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(lightTheme => {
        this._themeSwitcher.switchTheme(lightTheme ? 'scion-light' : 'scion-dark');
      });
  }
}

export interface Tool {
  routerPath: string;
  name: string;
  internal: boolean;
}
