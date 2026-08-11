/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, ElementRef, viewChild} from '@angular/core';
import {inject, TestBed} from '@angular/core/testing';
import {SciNativeScrollbarTrackSizeProvider} from './native-scrollbar-track-size-provider.service';

describe('SciNativeScrollbarTrackSizeProvider', () => {

  it('computes correct scrollbar track sizes', inject([SciNativeScrollbarTrackSizeProvider], (testee: SciNativeScrollbarTrackSizeProvider) => {
    const fixture = TestBed.createComponent(AppComponent);

    expect(testee.trackSize()!.vScrollbarTrackWidth).withContext('vScrollbarTrackWidth').toEqual(fixture.componentInstance.vScrollbarTrackWidth());
    expect(testee.trackSize()!.hScrollbarTrackHeight).withContext('hScrollbarTrackHeight').toEqual(fixture.componentInstance.hScrollbarTrackHeight());
  }));
});

@Component({
  template: `
    <div #viewport style="width: 100px; height: 100px; border: 0; overflow: scroll">
      <div #viewport_client style="width: 100%; height: 100%;">
      </div>
    </div>
  `,
})
class AppComponent {

  private readonly _viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly _viewportClient = viewChild.required<ElementRef<HTMLElement>>('viewport_client');

  public vScrollbarTrackWidth = computed(() => this._viewport().nativeElement.offsetWidth - this._viewportClient().nativeElement.offsetWidth);
  public hScrollbarTrackHeight = computed(() => this._viewport().nativeElement.offsetHeight - this._viewportClient().nativeElement.offsetHeight);
}
