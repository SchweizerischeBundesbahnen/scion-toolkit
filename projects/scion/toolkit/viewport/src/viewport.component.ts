/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component, ElementRef, EventEmitter, HostBinding, HostListener, Input, Output, ViewChild } from '@angular/core';
import { SciNativeScrollbarTrackSizeProvider } from './native-scrollbar-track-size-provider.service';
import { coerceElement } from '@angular/cdk/coercion';

/**
 * Represents a viewport with its `<ng-content>` used as its scrollable viewport client.
 *
 * ## Usage:
 * ```
 * <sci-viewport>
 *   your content
 * </sci-viewport>
 * ```
 *
 * ## Description:
 * The viewport component displays scrollbars only when the content overflows and while the user moves his mouse over the viewport.
 * Some operating systems place scrollbars next to the content, which shrinks the content by a few pixels when scrollbars are displayed.
 * For this reason, unless the operating system already does, the viewport component hides the native scrollbars and renders scrollbars
 * on top of the content. Nevertheless, the viewport client remains natively scrollable, i.e. it supports native touch gestures and accelerated
 * scrolling speed. In addition, the viewport scrolls natively near the viewport edges during drag and drop operations.
 *
 * ## Layout:
 * By default, the <ng-content> is added to a CSS grid container with a single column, thus, content fills remaining space vertically and horizontally.
 *
 * You can override the following CSS variables to control the grid:
 *
 * - sci-viewport-content-grid-template-columns:   Defines the columns and their track sizes (by default, single column with track size auto)
 * - sci-viewport-content-grid-template-rows:      Defines the rows and their track sizes (by default, single row with track size auto)
 * - sci-viewport-content-grid-auto-columns:       Defines the track size of not explicitly declared columns.
 * - sci-viewport-content-grid-auto-rows:          Defines the track size of not explicitly declared rows.
 * - sci-viewport-content-grid-gap:                Sets the gaps (gutters) between rows and columns.
 *
 * Example of how to control the CSS grid:
 *
 * ```css
 * sci-viewport {
 *   --sci-viewport-content-grid-auto-rows: min-content;
 *   --sci-viewport-content-grid-gap: .5em; // specifies the row and column gap
 * }
 * ```
 *
 * ## Scrollbar Styling:
 *
 * You can override the following CSS variables to control the appearance of the scrollbar:
 *
 * - sci-viewport-scrollbar-color:     Sets the color of the scrollbar (by default, uses `rgb(78, 78, 78)`).
 *
 * ```css
 * sci-viewport {
 *   --sci-viewport-scrollbar-color: blue;
 * }
 * ```
 */
@Component({
  selector: 'sci-viewport',
  templateUrl: './viewport.component.html',
  styleUrls: ['./viewport.component.scss'],
})
export class SciViewportComponent {

  private _viewport: HTMLDivElement;
  private _viewportClient: HTMLDivElement;
  private _scrollbarStyle: ScrollbarStyle = 'on-top';

  @HostBinding('attr.tabindex')
  public tabindex = -1; // make the viewport programmatically focusable but do not include it in the tab order

  /** @internal */
  @ViewChild('viewport', {static: true})
  public set setViewport(viewport: ElementRef<HTMLDivElement>) {
    this._viewport = coerceElement(viewport);
  }

  /** @internal */
  @ViewChild('viewport_client', {static: true})
  public set setViewportClient(viewportClient: ElementRef<HTMLDivElement>) {
    this._viewportClient = coerceElement(viewportClient);
  }

  /**
   * Controls whether to use native scrollbars or, which is by default, emulated scrollbars that sit on top of the viewport client.
   * In the latter, the viewport client remains natively scrollable.
   */
  @Input()
  public set scrollbarStyle(scrollbarStyle: ScrollbarStyle) {
    this._scrollbarStyle = scrollbarStyle || 'on-top';
  }

  /**
   * Emits upon a scroll event.
   *
   * You can add [sciDimension] directive to the viewport or viewport client to be notified about layout changes.
   */
  @Output() // tslint:disable-line:no-output-native
  public scroll = new EventEmitter<Event>();

  constructor(public host: ElementRef<HTMLElement>, public nativeScrollbarTrackSizeProvider: SciNativeScrollbarTrackSizeProvider) {
  }

  @HostListener('focus')
  public focus(): void { // do not rename to expose the same focus method like `HTMLElement.focus()`.
    this._viewport && this._viewport.focus();
  }

  public onScroll(event: Event): void {
    this.scroll.emit(event);
  }

  /**
   * Returns the number of pixels that the viewport client is scrolled vertically.
   *
   * @see Element.scrollTop
   */
  public get scrollTop(): number {
    return this._viewport.scrollTop;
  }

  /**
   * Sets the number of pixels that the viewport client is scrolled vertically.
   *
   * @see Element.scrollTop
   */
  public set scrollTop(scrollTop: number) {
    this._viewport.scrollTop = scrollTop;
  }

  /**
   * Returns the number of pixels that the viewport client is scrolled horizontally.
   *
   * @see Element.scrollLeft
   */
  public get scrollLeft(): number {
    return this._viewport.scrollLeft;
  }

  /**
   * Sets the number of pixels that the viewport client is scrolled horizontally.
   *
   * @see Element.scrollLeft
   */
  public set scrollLeft(scrollLeft: number) {
    this._viewport.scrollLeft = scrollLeft;
  }

  /**
   * Returns the height of the viewport client.
   *
   * @see Element.scrollHeight
   */
  public get scrollHeight(): number {
    return this._viewport.scrollHeight;
  }

  /**
   * Returns the width of the viewport client.
   *
   * @see Element.scrollWidth
   */
  public get scrollWidth(): number {
    return this._viewport.scrollWidth;
  }

  /**
   * Returns the viewport {HTMLElement}.
   */
  public get viewportElement(): HTMLElement {
    return this._viewport;
  }

  /**
   * Returns the viewport client {HTMLElement}.
   */
  public get viewportClientElement(): HTMLElement {
    return this._viewportClient;
  }

  /**
   * Checks if the specified element is scrolled into the viewport.
   *
   * @param element - the element to be checked
   * @param fit - control if the element must fully or partially fit into the viewport
   */
  public isElementInView(element: HTMLElement, fit: 'full' | 'partial'): boolean {
    const elLeft = this.computeOffset(element, 'left');
    const elRight = elLeft + element.offsetWidth;
    const elTop = this.computeOffset(element, 'top');
    const elBottom = elTop + element.offsetHeight;

    const vpLeft = this._viewport.scrollLeft;
    const vpRight = vpLeft + this._viewport.clientWidth;
    const vpTop = this._viewport.scrollTop;
    const vpBottom = vpTop + this._viewport.clientHeight;

    switch (fit) {
      case 'full':
        return (elLeft >= vpLeft && elRight <= vpRight) && (elTop >= vpTop && elBottom <= vpBottom);
      case 'partial':
        return (elRight >= vpLeft && elLeft <= vpRight) && (elBottom >= vpTop && elTop <= vpBottom);
      default:
        throw Error('Unsupported fit strategy');
    }
  }

  /**
   * Scrolls the specified element into the viewport.
   *
   * @param element - the element to scroll into the viewport
   * @param offset - the gap between the element and the viewport
   */
  public scrollIntoView(element: HTMLElement, offset: number = 50): void {
    this._viewport.scrollTop = this.computeOffset(element, 'top') - offset;
    this._viewport.scrollLeft = this.computeOffset(element, 'left') - offset;
  }

  /**
   * Computes the distance of the element to the viewport's left or top border.
   */
  public computeOffset(element: HTMLElement, border: 'left' | 'top'): number {
    if (!isChildOf(element, this._viewport)) {
      throw Error('element not a child of the viewport');
    }

    let offset = 0;
    let el = element;
    do {
      offset += (border === 'left' ? el.offsetLeft : el.offsetTop);
      el = el.offsetParent as HTMLElement;
    } while (el !== null && el !== this._viewport);

    return offset;
  }

  public get scrollbarStyle(): ScrollbarStyle {
    return this._scrollbarStyle;
  }
}

/**
 * Returns 'true' if the given element is a child element of the parent element.
 */
function isChildOf(element: Element, parent: Element): boolean {
  while (element.parentElement !== null) {
    element = element.parentElement;
    if (element === parent) {
      return true;
    }
  }
  return false;
}

/**
 * Represents a scrollbar style.
 */
export type ScrollbarStyle = 'native' | 'on-top' | 'hidden';
