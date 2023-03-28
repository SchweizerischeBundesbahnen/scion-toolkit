/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {SciNativeScrollbarTrackSizeProvider} from './native-scrollbar-track-size-provider.service';
import {coerceElement} from '@angular/cdk/coercion';

/**
 * Represents a viewport with slotted content (`<ng-content>`) used as scrollable content. By default, content is added to a CSS grid layout.
 *
 * The viewport component displays scrollbars when its content overflows. Scrollbars are displayed on top of the content, not next to it.
 * The component uses the native scrollbars of the operating system if they are already sitting on top, or falls back and renders scrollbars on top otherwise.
 * The viewport remains natively scrollable with the native scrollbars shifted out of the viewport's visible area. Consequently, the viewport keeps supporting
 * native scrolling features such as touch gestures, scroll speed acceleration, or scrolling near the viewport edges during drag-and-drop operations.
 *
 * ```html
 * <sci-viewport>
 *   your content
 * </sci-viewport>
 * ```
 *
 * ## Adding the viewport to a layout
 *
 * Typically you would add the viewport component to a flexible layout, filling the remaining space vertically and horizontally, such as a flexbox container
 * with the viewport's `flex` CSS property set to either `flex: auto` or `flex: 1 1 0`.
 *
 * The viewport is sized according to its content width and height. It grows to absorb any free space, thus overflowing its content only when encountering
 * a layout constraint. Depending on the layout, different steps may be necessary to prevent the viewport from growing to infinity.
 *
 * - If practical, give the viewport a fixed size or a maximum size.
 * - If you add the viewport to a flexbox layout, make sure that it cannot exceed the available space. Instead, the viewport should fill the remaining space,
 *   vertically and horizontally. Be aware that, by default, a flex item does not shrink below its minimum content size. To change this, set the viewport's
 *   `flex-basis` to `0` (instead of `auto`), or use the CSS shorthand property `flex: 1 1 0`. The `flex-basis` defines the default size of a flex item before
 *   the remaining extra space is distributed. If the viewport does not appear after setting this property, check its parent elements' content sizes.
 *   As an alternative to setting `flex: 1 1 0`, change the setting to `flex: auto` and hide the overflow in the parent element, as follows: `overflow: hidden`.
 *   Another approach would be to set the minimum height of all parents to `0`, as follows: `min-height: 0`.
 *
 *   For the complete documentation on the flex layout and its features, refer to https://developer.mozilla.org/en-US/docs/Web/CSS/flex.
 *
 *
 * ## Layouting the viewport's slotted content
 *
 * By default, the viewport's content is added to a CSS grid container with a single column, filling remaining space vertically and horizontally.
 * Using the `::part(content)` pseudo element selector, you can configure the grid container or apply a different layout, such as a flex or flow layout.
 *
 * #### Example of adding slotted content to a CSS flex container.
 * ```css
 * sci-viewport::part(content) {
 *   display: flex;
 *   flex-direction: column;
 * }
 * ```
 *
 * #### Example of configuring CSS grid container with two columns
 * ```css
 * sci-viewport::part(content) {
 *   grid-template-columns: 1fr 1fr;
 *   gap: 1em;
 * }
 * ```
 *
 * ## Styling of scrollbars
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
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class SciViewportComponent {

  private _viewportElement!: HTMLDivElement;
  private _viewportClient!: HTMLDivElement;
  private _scrollbarStyle: ScrollbarStyle = 'on-top';

  /** @internal */
  @ViewChild('viewport', {static: true})
  public set setViewport(viewport: ElementRef<HTMLDivElement>) {
    this._viewportElement = coerceElement(viewport);
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

  public get scrollbarStyle(): ScrollbarStyle {
    return this._scrollbarStyle;
  }

  /**
   * Emits upon a scroll event.
   *
   * You can add [sciDimension] directive to the viewport or viewport client to be notified about layout changes.
   */
  @Output()
  public scroll = new EventEmitter<Event>(); // eslint-disable-line @angular-eslint/no-output-native

  constructor(public host: ElementRef<HTMLElement>, public nativeScrollbarTrackSizeProvider: SciNativeScrollbarTrackSizeProvider) {
  }

  @HostListener('focus')
  public focus(): void { // do not rename to expose the same focus method like `HTMLElement.focus()`.
    this._viewportElement?.focus();
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
    return this._viewportElement.scrollTop;
  }

  /**
   * Sets the number of pixels that the viewport client is scrolled vertically.
   *
   * @see Element.scrollTop
   */
  public set scrollTop(scrollTop: number) {
    this._viewportElement.scrollTop = scrollTop;
  }

  /**
   * Returns the number of pixels that the viewport client is scrolled horizontally.
   *
   * @see Element.scrollLeft
   */
  public get scrollLeft(): number {
    return this._viewportElement.scrollLeft;
  }

  /**
   * Sets the number of pixels that the viewport client is scrolled horizontally.
   *
   * @see Element.scrollLeft
   */
  public set scrollLeft(scrollLeft: number) {
    this._viewportElement.scrollLeft = scrollLeft;
  }

  /**
   * Returns the height of the viewport client.
   *
   * @see Element.scrollHeight
   */
  public get scrollHeight(): number {
    return this._viewportElement.scrollHeight;
  }

  /**
   * Returns the width of the viewport client.
   *
   * @see Element.scrollWidth
   */
  public get scrollWidth(): number {
    return this._viewportElement.scrollWidth;
  }

  /**
   * Returns the viewport {HTMLElement}.
   */
  public get viewportElement(): HTMLElement {
    return this._viewportElement;
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
   * @return `true` if the element is scrolled into the viewport, or `false` otherwise.
   */
  public isElementInView(element: ElementRef<HTMLElement> | HTMLElement, fit: 'full' | 'partial'): boolean {
    const elTop = this.computeOffset(element, 'top');
    if (elTop === null) {
      return false;
    }
    const elLeft = this.computeOffset(element, 'left');
    if (elLeft === null) {
      return false;
    }

    // Consider elements as scrolled into view when there is no viewport overflow.
    // The calculation of whether an element is scrolled into view may be wrong by a few pixels if the viewport contains elements with decimal sizes.
    // This can happen because `offsetLeft` and `offsetTop` operate on an integer (not a decimal), losing precision that can accumulate.
    // To avoid incorrect calculation when there is no viewport overflow, we consider all contained elements as scrolled into the view.
    if (this._viewportElement.scrollWidth <= this._viewportElement.clientWidth && this._viewportElement.scrollHeight <= this._viewportElement.clientHeight) {
      return true;
    }

    const elBottom = elTop + coerceElement(element).offsetHeight;
    const elRight = elLeft + coerceElement(element).offsetWidth;

    const vpTop = this._viewportElement.scrollTop;
    const vpLeft = this._viewportElement.scrollLeft;
    const vpBottom = vpTop + this._viewportElement.clientHeight;
    const vpRight = vpLeft + this._viewportElement.clientWidth;

    if (fit === 'full') {
      return (elTop >= vpTop && elBottom <= vpBottom) && (elLeft >= vpLeft && elRight <= vpRight);
    }
    else {
      return (elBottom >= vpTop && elTop <= vpBottom) && (elRight >= vpLeft && elLeft <= vpRight);
    }
  }

  /**
   * Scrolls the specified element into the viewport.
   *
   * @param element - the element to scroll into the viewport
   * @param offset - the gap between the element and the viewport
   */
  public scrollIntoView(element: ElementRef<HTMLElement> | HTMLElement, offset: number = 50): void {
    const top = this.computeOffset(element, 'top');
    if (top === null) {
      return;
    }
    const left = this.computeOffset(element, 'left');
    if (left === null) {
      return;
    }

    this._viewportElement.scrollTop = top - offset;
    this._viewportElement.scrollLeft = left - offset;
  }

  /**
   * Computes the distance of the element to the viewport's left or top border.
   *
   * @return distance of the element to the viewport's left or top border, or `null` if not contained
   *         in the viewport or the element or any ancestor has the `display` property set to `none`.
   */
  public computeOffset(element: ElementRef<HTMLElement> | HTMLElement, border: 'left' | 'top'): number | null {
    let offset = 0;
    let el = coerceElement(element);
    do {
      offset += (border === 'left' ? el.offsetLeft : el.offsetTop);
      const offsetParent = el.offsetParent;
      if (offsetParent === null) {
        // `offsetParent` is `null` in the following situations:
        // - The element or any ancestor has the `display` property set to `none`
        // - The element has the position property set to fixed (Firefox returns <body>).
        // - The element is <body> or <html>.
        // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/offsetParent.
        return null;
      }
      if (!(offsetParent instanceof HTMLElement)) {
        return null;
      }
      el = offsetParent;
    } while (el !== this.host.nativeElement);

    return offset;
  }
}

/**
 * Represents a scrollbar style.
 */
export type ScrollbarStyle = 'native' | 'on-top' | 'hidden';
