/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Injectable, Signal} from '@angular/core';
import {ɵSciNativeScrollbarTrackSizeProvider} from './ɵnative-scrollbar-track-size-provider.service';

/**
 * Provides the native scrollbar tracksize.
 */
@Injectable({providedIn: 'root', useClass: ɵSciNativeScrollbarTrackSizeProvider})
export abstract class SciNativeScrollbarTrackSizeProvider {

  /**
   * Provides the track size of the native scrollbar, or `null` if the native scrollbars sit on top of the content.
   */
  public abstract readonly trackSize: Signal<SciNativeScrollbarTrackSize | null>;
}

/**
 * Represents the native scrollbar track size.
 */
export interface SciNativeScrollbarTrackSize {
  hScrollbarTrackHeight: number;
  vScrollbarTrackWidth: number;
}
