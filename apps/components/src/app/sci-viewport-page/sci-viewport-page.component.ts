/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, HostBinding, inject, OnDestroy, OnInit, Signal, viewChild} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciViewportComponent} from '@scion/components/viewport';
import {startWith} from 'rxjs/operators';
import loremIpsum from './lorem-ipsum.json';
import {Arrays} from '@scion/toolkit/util';
import {DOCUMENT} from '@angular/common';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SplitPipe} from '../common/split.pipe';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'sci-viewport-page',
  templateUrl: './sci-viewport-page.component.html',
  styleUrls: ['./sci-viewport-page.component.scss'],
  imports: [
    ReactiveFormsModule,
    SplitPipe,
    SciFormFieldComponent,
    SciViewportComponent,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciViewportPageComponent implements OnInit, OnDestroy {

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _document = inject(DOCUMENT);
  private readonly _viewportElement: Signal<ElementRef<HTMLElement>> = viewChild.required(SciViewportComponent, {read: ElementRef});

  protected readonly scrollbarStyles = ['native', 'on-top', 'hidden'];
  protected readonly form = this._formBuilder.group({
    content: this._formBuilder.control(loremIpsum),
    viewportContentStyles: this._formBuilder.control(`display: flex;\nflex-direction: row;\ngap: 3em;`),
    viewportMinHeight: this._formBuilder.control('300px'),
    viewportMaxHeight: this._formBuilder.control(''),
    viewportFlex: this._formBuilder.control('1 1 0'),
    scrollbarPresentation: this._formBuilder.control<'native' | 'on-top' | 'hidden'>('on-top'),
    scrollbarColor: this._formBuilder.control(''),
  });

  private _styleSheet: CSSStyleSheet | null = null;

  @HostBinding('style.--viewport-minheight')
  protected get viewportMinHeight(): string {
    return this.form.controls.viewportMinHeight.value;
  }

  @HostBinding('style.--viewport-maxheight')
  protected get viewportMaxHeight(): string {
    return this.form.controls.viewportMaxHeight.value;
  }

  @HostBinding('style.--viewport-flex')
  protected get viewportFlex(): string {
    return this.form.controls.viewportFlex.value;
  }

  constructor() {
    this._styleSheet = this.installStyleSheet();
    this.applyViewportContentStylesOnStyleChange();
  }

  public ngOnInit(): void {
    this.form.controls.scrollbarColor.setValue(this.readCssVariableDefault('--sci-viewport-scrollbar-color'));
  }

  private applyViewportContentStylesOnStyleChange(): void {
    this.form.controls.viewportContentStyles.valueChanges
      .pipe(
        startWith(this.form.controls.viewportContentStyles.value),
        takeUntilDestroyed(),
      )
      .subscribe((styles: string) => {
        this.replaceCssStyleSheetRule(`
          sci-viewport.demo::part(content) {
            ${styles}
          }
        `);
      });
  }

  private readCssVariableDefault(cssVariable: string): string {
    return getComputedStyle(this._viewportElement().nativeElement).getPropertyValue(cssVariable);
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

    this._styleSheet!.deleteRule(0);
    this._styleSheet!.insertRule(rule);
  }

  private supportsConstructableStyleSheets(): boolean {
    return 'adoptedStyleSheets' in this._document;
  }

  public ngOnDestroy(): void {
    this.uninstallStyleSheet();
  }
}
