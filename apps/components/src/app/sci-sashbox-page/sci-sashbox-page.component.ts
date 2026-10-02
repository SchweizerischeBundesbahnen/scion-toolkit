/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, ElementRef, Signal, signal, viewChild} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {createDesignTokenForm, DesignTokenFormComponent} from '../styles/design-token-form.component';

@Component({
  selector: 'sci-sashbox-page',
  templateUrl: './sci-sashbox-page.component.html',
  styleUrls: ['./sci-sashbox-page.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SciSashboxComponent,
    SciSashDirective,
    SciMaterialIconDirective,
    SciTabDirective,
    SciTabbarComponent,
    DesignTokenFormComponent,
  ],
  host: {
    '(keydown.escape)': 'onGlasspaneToggle()',
  },
})
export default class SciSashboxPageComponent {

  protected readonly direction = signal<'column' | 'row'>('row');

  private readonly _sashboxElement: Signal<ElementRef<HTMLElement>> = viewChild.required(SciSashboxComponent, {read: ElementRef});

  protected readonly designTokenForm = createDesignTokenForm([
    '--sci-sashbox-gap',
    '--sci-sashbox-splitter-background-color',
    '--sci-sashbox-splitter-background-color-hover',
    '--sci-sashbox-splitter-size',
    '--sci-sashbox-splitter-size-hover',
    '--sci-sashbox-splitter-touch-target-size',
    '--sci-sashbox-splitter-cross-axis-size',
    '--sci-sashbox-splitter-cross-axis-start',
    '--sci-sashbox-splitter-cross-axis-end',
    '--sci-sashbox-splitter-border-radius',
    '--sci-sashbox-splitter-opacity-active',
    '--sci-sashbox-splitter-opacity-hover',
  ], this._sashboxElement);

  protected readonly sashes: Sash[] = [
    {visible: true, size: '250px', minSize: 75},
    {visible: true, size: '1', minSize: 50},
    {visible: true, size: '250px', minSize: 75},
  ];

  protected readonly glasspaneVisible = signal(false);

  protected onGlasspaneToggle(): void {
    this.glasspaneVisible.update(value => !value);
  }

  protected onSashEnd(sashSizes: {[sashKey: string]: number}): void {
    console.log('[SciSashboxPageComponent:onSashEnd]', sashSizes);
  }
}

export interface Sash {
  visible: boolean;
  size?: string;
  minSize?: number;
  key?: string;
  animate?: boolean;
}
