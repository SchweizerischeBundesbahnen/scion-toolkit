/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, Injectable, input, signal, viewChild} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {SciNativeScrollbarTrackSize, SciNativeScrollbarTrackSizeProvider} from './scrolltrack/native-scrollbar-track-size-provider.service';
import {By} from '@angular/platform-browser';
import {SciScrollableDirective} from './scrollable.directive';
import {SciScrollbarComponent} from './scrollbar/scrollbar.component';

describe('SciScrollableDirective', () => {

  it('should crop native scrollbars if not rendered on-top', async () => {
    TestBed.configureTestingModule({
      providers: [
        NativeScrollbarTrackSizeProviderMock,
        {provide: SciNativeScrollbarTrackSizeProvider, useExisting: NativeScrollbarTrackSizeProviderMock},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);
    const nativeScrollbarTrackSizeProvider = TestBed.inject(NativeScrollbarTrackSizeProviderMock);

    // Simulate the native scrollbar not to render on-top.
    nativeScrollbarTrackSizeProvider.trackSize.set({hScrollbarTrackHeight: 17, vScrollbarTrackWidth: 17});
    await fixture.whenRenderingDone();

    expect(fixture.componentInstance.sciScrollableDirective().isNativeScrollbarCropped()).toBeTrue();
    expect(fixture.debugElement.query(By.css('sci-scrollbar'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['width']).toEqual('calc(100% + 17px)');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['height']).toEqual('calc(100% + 17px)');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['overflow']).toEqual('scroll');

    // Change scrolltrack size, e.g., on zoom.
    nativeScrollbarTrackSizeProvider.trackSize.set({hScrollbarTrackHeight: 45, vScrollbarTrackWidth: 45});
    await fixture.whenRenderingDone();

    expect(fixture.componentInstance.sciScrollableDirective().isNativeScrollbarCropped()).toBeTrue();
    expect(fixture.debugElement.query(By.css('sci-scrollbar'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['width']).toEqual('calc(100% + 45px)');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['height']).toEqual('calc(100% + 45px)');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['overflow']).toEqual('scroll');

    // Simulate the native scrollbar to render on-top.
    nativeScrollbarTrackSizeProvider.trackSize.set(null);
    await fixture.whenRenderingDone();

    expect(fixture.componentInstance.sciScrollableDirective().isNativeScrollbarCropped()).toBeFalse();
    expect(fixture.debugElement.query(By.css('sci-scrollbar'))).toBeNull();
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['width']).toEqual('100%');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['height']).toEqual('100%');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['overflow']).toEqual('auto');
  });

  it('should not crop native scrollbars if already rendered on-top', async () => {
    TestBed.configureTestingModule({
      providers: [
        NativeScrollbarTrackSizeProviderMock,
        {provide: SciNativeScrollbarTrackSizeProvider, useExisting: NativeScrollbarTrackSizeProviderMock},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);
    const nativeScrollbarTrackSizeProvider = TestBed.inject(NativeScrollbarTrackSizeProviderMock);

    // Simulate the native scrollbar to render on-top.
    nativeScrollbarTrackSizeProvider.trackSize.set(null);
    await fixture.whenRenderingDone();

    expect(fixture.componentInstance.sciScrollableDirective().isNativeScrollbarCropped()).toBeFalse();
    expect(fixture.debugElement.query(By.css('sci-scrollbar'))).toBeNull();
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['width']).toEqual('100%');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['height']).toEqual('100%');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['overflow']).toEqual('auto');
  });

  it('should not crop native scrollbars if configured to display native scrollbars', async () => {
    TestBed.configureTestingModule({
      providers: [
        NativeScrollbarTrackSizeProviderMock,
        {provide: SciNativeScrollbarTrackSizeProvider, useExisting: NativeScrollbarTrackSizeProviderMock},
      ],
    });

    const fixture = TestBed.createComponent(SpecRootComponent);
    const nativeScrollbarTrackSizeProvider = TestBed.inject(NativeScrollbarTrackSizeProviderMock);

    // Configure directive to not crop native scrollbars.
    fixture.componentRef.setInput('displayNativeScrollbar', true);
    await fixture.whenRenderingDone();

    // Simulate the native scrollbar not to render on-top.
    nativeScrollbarTrackSizeProvider.trackSize.set({hScrollbarTrackHeight: 17, vScrollbarTrackWidth: 17});
    await fixture.whenRenderingDone();

    expect(fixture.componentInstance.sciScrollableDirective().isNativeScrollbarCropped()).toBeFalse();
    expect(fixture.debugElement.query(By.css('sci-scrollbar'))).toBeNull();
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['width']).toEqual('100%');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['height']).toEqual('100%');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['overflow']).toEqual('auto');

    // Simulate the native scrollbar to render on-top.
    nativeScrollbarTrackSizeProvider.trackSize.set(null);
    await fixture.whenRenderingDone();

    expect(fixture.componentInstance.sciScrollableDirective().isNativeScrollbarCropped()).toBeFalse();
    expect(fixture.debugElement.query(By.css('sci-scrollbar'))).toBeNull();
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['width']).toEqual('100%');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['height']).toEqual('100%');
    expect(fixture.debugElement.query(By.css('div.viewport-internal')).styles['overflow']).toEqual('auto');
  });
});

@Injectable()
class NativeScrollbarTrackSizeProviderMock implements SciNativeScrollbarTrackSizeProvider {

  public readonly trackSize = signal<SciNativeScrollbarTrackSize | null>(null);
}

@Component({
  selector: 'spec-root',
  template: `
    <div class="viewport">
      <div sciScrollable #sciScrollable="sciScrollable" [sciScrollableDisplayNativeScrollbar]="displayNativeScrollbar()"
           class="viewport-internal"
           #viewport>
        <div class="viewport-client">
          <div>top</div>
          <div>bottom</div>
        </div>
      </div>

      @if (sciScrollable.isNativeScrollbarCropped()) {
        <sci-scrollbar [viewport]="viewport"/>
      }
    </div>
  `,
  styles: `
    div.viewport {
      display: grid;
      position: relative;
      overflow: hidden;
      width: 200px;
      height: 200px;
      border: 1px solid black;

      > div.viewport-internal > div.viewport-client {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background-color: lightskyblue;
        height: 1000px;
      }

      > sci-scrollbar {
        position: absolute;
        top: 2px;
        right: 1px;
        bottom: 2px;
      }
    }
  `,
  imports: [
    SciScrollableDirective,
    SciScrollbarComponent,
  ],
})
class SpecRootComponent {

  public readonly displayNativeScrollbar = input<boolean>();

  public readonly sciScrollableDirective = viewChild.required(SciScrollableDirective);
}
