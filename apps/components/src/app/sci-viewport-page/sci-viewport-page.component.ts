/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, HostBinding, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {SciViewportComponent} from '@scion/components/viewport';
import {startWith, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import loremIpsum from './lorem-ipsum.json';
import {Arrays} from '@scion/toolkit/util';
import {DOCUMENT} from '@angular/common';

export const VIEWPORT_CONTENT_STYLES = 'viewportContentStyles';
export const VIEWPORT_MIN_HEIGHT = 'viewportMinHeight';
export const VIEWPORT_MAX_HEIGHT = 'viewportMaxHeight';
export const VIEWPORT_FLEX = 'viewportFlex';
export const SCROLLBAR_PRESENTATION = 'scrollbarPresentation';
export const SCROLLBAR_COLOR = 'scrollbarColor';
export const CONTENT = 'content';

@Component({
  selector: 'sci-viewport-page',
  templateUrl: './sci-viewport-page.component.html',
  styleUrls: ['./sci-viewport-page.component.scss'],
})
export class SciViewportPageComponent implements OnInit, OnDestroy {

  public VIEWPORT_CONTENT_STYLES = VIEWPORT_CONTENT_STYLES;
  public VIEWPORT_MIN_HEIGHT = VIEWPORT_MIN_HEIGHT;
  public VIEWPORT_MAX_HEIGHT = VIEWPORT_MAX_HEIGHT;
  public VIEWPORT_FLEX = VIEWPORT_FLEX;
  public SCROLLBAR_PRESENTATION = SCROLLBAR_PRESENTATION;
  public SCROLLBAR_COLOR = SCROLLBAR_COLOR;
  public CONTENT = CONTENT;

  private _destroy$ = new Subject<void>();
  private _styleSheet: CSSStyleSheet | null = null;

  public scrollbarStyles = ['native', 'on-top', 'hidden'];
  public form: FormGroup;

  @ViewChild(SciViewportComponent, {static: true, read: ElementRef})
  public viewportComponent: ElementRef<HTMLElement>;

  @HostBinding('style.--viewport-minheight')
  public get viewportMinHeight(): string {
    return this.form.get(this.VIEWPORT_MIN_HEIGHT).value;
  }

  @HostBinding('style.--viewport-maxheight')
  public get viewportMaxHeight(): string {
    return this.form.get(this.VIEWPORT_MAX_HEIGHT).value;
  }

  @HostBinding('style.--viewport-flex')
  public get viewportFlex(): string {
    return this.form.get(this.VIEWPORT_FLEX).value;
  }

  constructor(formBuilder: FormBuilder, @Inject(DOCUMENT) private _document: any) {
    this.form = formBuilder.group({
      [VIEWPORT_CONTENT_STYLES]: formBuilder.control(`display: grid;\ngrid-template-columns: 1fr 2fr 1fr;\ngap: 5em;\nbackground-color: ivory`),
      [VIEWPORT_MIN_HEIGHT]: formBuilder.control('300px'),
      [VIEWPORT_MAX_HEIGHT]: formBuilder.control(undefined),
      [VIEWPORT_FLEX]: formBuilder.control('1 1 0'),
      [SCROLLBAR_PRESENTATION]: formBuilder.control(undefined),
      [SCROLLBAR_COLOR]: formBuilder.control(undefined),
      [CONTENT]: formBuilder.control(loremIpsum),
    });
    this._styleSheet = this.installStyleSheet();
    this.applyViewportContentStylesOnStyleChange();
  }

  public ngOnInit(): void {
    this.form.get(SCROLLBAR_COLOR).value || this.form.get(SCROLLBAR_COLOR).setValue(this.readCssVariableDefault('--sci-viewport-scrollbar-color'));
  }

  private applyViewportContentStylesOnStyleChange(): void {
    this.form.get(VIEWPORT_CONTENT_STYLES).valueChanges
      .pipe(
        startWith(this.form.get(VIEWPORT_CONTENT_STYLES).value),
        takeUntil(this._destroy$),
      )
      .subscribe((styles: string) => {
        this.replaceCssStyleSheetRule(`
          sci-viewport::part(content) {
            ${styles}
          }
        `);
      });
  }

  private readCssVariableDefault(cssVariable: string): string {
    return getComputedStyle(this.viewportComponent.nativeElement).getPropertyValue(cssVariable);
  }

  private installStyleSheet(): CSSStyleSheet | null {
    if (!this.supportsConstructableStyleSheets()) {
      return null;
    }

    const styleSheet = new CSSStyleSheet();
    styleSheet.insertRule('body {}'); // placeholder rule since a constructable stylesheet requires a single rule at minimum
    this._document.adoptedStyleSheets.push(styleSheet);
    return styleSheet;
  }

  private uninstallStyleSheet(): void {
    if (!this.supportsConstructableStyleSheets()) {
      return;
    }

    Arrays.remove(this._document.adoptedStyleSheets, this._styleSheet);
    this._styleSheet = null;
  }

  private replaceCssStyleSheetRule(rule: string): void {
    if (!this.supportsConstructableStyleSheets()) {
      return;
    }

    this._styleSheet.deleteRule(0);
    this._styleSheet.insertRule(rule);
  }

  private supportsConstructableStyleSheets(): boolean {
    return 'adoptedStyleSheets' in document;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this.uninstallStyleSheet();
  }
}

