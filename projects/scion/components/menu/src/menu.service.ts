/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ElementRef, Injectable, ViewContainerRef} from '@angular/core';
import {ɵSciMenuService} from './ɵmenu.service';
import {Translatable} from '@scion/components/text';
import {MaybeSignal} from '@scion/components/common';
import {RequireOne} from '@scion/toolkit/types';

// TODO [menu] Consider moving open (with menuitems) and menuContributions to separate service
@Injectable({providedIn: 'root', useExisting: ɵSciMenuService})
export abstract class SciMenuService {

  public abstract open(name: `menu:${string}`, options: SciMenuOptions): SciMenuRef;
}

export interface SciMenuOptions {
  /**
   * Controls where to open the menu.
   *
   * Can be an HTML element or a coordinate. The coordinate is relative to the page viewport.
   *
   * Supported coordinate pairs:
   * - x/y: Relative to the top/left corner of the page viewport.
   * - top/left: Same as x/y.
   * - top/right: Relative to the top/right corner of the page viewport.
   * - bottom/left: Relative to the bottom/left corner of the page viewport.
   * - bottom/right: Relative to the bottom/right corner of the page viewport.
   */
  anchor: HTMLElement | ElementRef<HTMLElement> | SciMenuOrigin | MouseEvent;
  context?: Map<string, unknown>;
  /**
   * Controls where to align the menu relative to the menu anchor, unless there is not enough space available in that area. Defaults to `vertical`.
   */
  align?: 'vertical' | 'horizontal';
  /**
   * Controls where the menu will be added to the DOM. If not specified, adds the menu after the anchor element.
   */
  viewContainerRef?: ViewContainerRef;
  /**
   * Sets if opening a submenu.
   *
   * Controls min-width and initial focus.
   *
   * @internal
   */
  submenu?: true;
  size?: {
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    maxHeight?: string;
  };
  filter?: boolean | RequireOne<{placeholder?: MaybeSignal<Translatable>; notFoundText?: MaybeSignal<Translatable>; focus?: boolean}>;
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
  /**
   * Arbitrary metadata to be associated with the operation.
   */
  metadata?: {[key: string]: unknown};
}

/**
 * Represents a point on the page, optionally with a dimension, where a menu should be attached.
 */
export interface SciMenuOrigin {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface SciMenuRef {
  close(): void;

  /**
   * Registers a close callback.  Returns a cleanup function that can be invoked to unregister the callback.
   *
   * The callback is immediately called if registering a callback and the menu is already closed.
   */
  onClose: (fn: () => void) => void;
}
