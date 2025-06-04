/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {distinctUntilChanged, Observable, ReplaySubject, share} from 'rxjs';
import {DOCUMENT, inject, Injectable} from '@angular/core';
import {fromMutation$} from '@scion/toolkit/observable';
import {map, startWith} from 'rxjs/operators';

/**
 * Enables switching between themes.
 */
@Injectable({providedIn: 'root'})
export class ThemeSwitcher {

  private readonly _documentRoot = inject<Document>(DOCUMENT).documentElement;

  /**
   * Emits the name of the current theme.
   *
   * Upon subscription, emits the name of the current theme, and then continuously emits when switching the theme. It never completes.
   */
  public readonly theme$: Observable<string | null>;

  constructor() {
    this.theme$ = this.detectTheme$();
  }

  /**
   * Switches the theme of the application.
   *
   * @param theme - The name of the theme to switch to.
   */
  public switchTheme(theme: string): void {
    this._documentRoot.setAttribute('sci-theme', theme);
  }

  /**
   * Detects the current theme from the HTML root element.
   */
  private detectTheme$(): Observable<string | null> {
    return new Observable<string | null>(observer => {
      const subscription = fromMutation$(this._documentRoot, {attributeFilter: ['sci-theme']})
        .pipe(
          startWith(undefined as void),
          map(() => getComputedStyle(this._documentRoot).getPropertyValue('--sci-theme') || null),
          distinctUntilChanged(),
          share({connector: () => new ReplaySubject(1), resetOnRefCountZero: false}),
        )
        .subscribe(observer);

      return () => subscription.unsubscribe();
    });
  }
}
