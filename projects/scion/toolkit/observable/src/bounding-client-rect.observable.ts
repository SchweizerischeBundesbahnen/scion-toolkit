/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {distinctUntilChanged, fromEvent, Observable, Subject, switchMap, takeUntil} from 'rxjs';
import {fromIntersection$} from './intersection.observable';
import {fromResize$} from './resize.observable';
import {observeIn} from '@scion/toolkit/operators';

/**
 * Observes changes to the bounding box of a specified element.
 *
 * The bounding box includes the element's position relative to the top-left of the viewport and its size.
 * Refer to https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect for more details.
 *
 * Upon subscription, emits the current bounding box, and then continuously when the bounding box changes. The Observable never completes.
 *
 * The element and the document root (`<html>`) must be positioned `relative` or `absolute`.
 * If not, a warning is logged, and positioning changed to `relative`.

 * Note:
 * There is no native browser API to observe the position of an element. The observable uses {@link IntersectionObserver} and
 * {@link ResizeObserver} to detect position changes. For tracking only size changes, use {@link fromResize$} instead.
 *
 * @param element - The element to observe.
 * @returns {Observable<DOMRect>} An observable that emits the bounding box of the element.
 */
export function fromBoundingClientRect$(element: HTMLElement): Observable<DOMRect> {
  return new Observable(observer => {
    const clientRectObserver = new BoundingClientRectObserver(element, clientRect => observer.next(clientRect));
    return () => clientRectObserver.destroy();
  });
}

/**
 * Observes the position and size of an element using {@link IntersectionObserver} and {@link ResizeObserver}.
 *
 * Since there is no native browser API to observe element position, we create four vertices and set up
 * an {@link IntersectionObserver} for each vertex. Configured with root margins aligned to the vertices'
 * bounding boxes, we can detect when the element (specifically its vertices) moves. We then emit the changed
 * bounding box of the element, recompute the root margins for each vertex, and restart observations.
 *
 * Observing vertices instead of the element itself enables position change detection even if the element is partially
 * scrolled out of the viewport.
 */
class BoundingClientRectObserver {

  private readonly _destroy$ = new Subject<void>();
  private readonly _clientRect$ = new Subject<DOMRect>();
  private readonly _vertices: {
    topLeft: Vertex;
    topRight: Vertex;
    bottomRight: Vertex;
    bottomLeft: Vertex;
  };

  constructor(private _element: HTMLElement, onChange: (clientRect: DOMRect) => void) {
    ensureElementPositioned(document.documentElement);
    ensureElementPositioned(this._element);

    this._vertices = {
      topLeft: new Vertex(this._element, {top: 0, left: 0}, () => this.emitClientRect()),
      topRight: new Vertex(this._element, {top: 0, right: 0}, () => this.emitClientRect()),
      bottomRight: new Vertex(this._element, {bottom: 0, right: 0}, () => this.emitClientRect()),
      bottomLeft: new Vertex(this._element, {bottom: 0, left: 0}, () => this.emitClientRect()),
    };

    this.installElementResizeObserver();
    this.installDocumentResizeObserver();
    this.installChangeEmitter(onChange);
  }

  /**
   * Monitors changes to the element's size.
   */
  private installElementResizeObserver(): void {
    fromResize$(this._element, {box: 'border-box'})
      .pipe(
        // Run in animation frame to prevent 'ResizeObserver loop completed with undelivered notifications' error.
        // Do not use `animationFrameScheduler` because the scheduler does not necessarily execute in the current execution context, such as inside or outside Angular.
        // The scheduler always executes tasks in the context (e.g. zone) where the scheduler was first used in the application.
        observeIn(fn => requestAnimationFrame(fn)),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        this.emitClientRect(); // emit for instant update
        this.forEachVertex(vertex => vertex.computeRootMargin());
      });
  }

  /**
   * Monitors changes to the document's size.
   */
  private installDocumentResizeObserver(): void {
    fromEvent(window, 'resize')
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this.emitClientRect(); // emit for instant update
        this.forEachVertex(vertex => vertex.computeRootMargin());
      });
  }

  private installChangeEmitter(onChange: (clientRect: DOMRect) => void): void {
    this._clientRect$
      .pipe(
        distinctUntilChanged(isEqualDomRect),
        takeUntil(this._destroy$),
      )
      .subscribe(boundingBox => {
        onChange(boundingBox);
      });
  }

  private emitClientRect(): void {
    this._clientRect$.next(this._element.getBoundingClientRect());
  }

  private forEachVertex(fn: (vertex: Vertex) => void): void {
    Object.values(this._vertices).forEach(fn);
  }

  public destroy(): void {
    this.forEachVertex(vertex => vertex.destroy());
    this._destroy$.next();
  }
}

class Vertex {

  private readonly _element: HTMLElement;
  private readonly _rootMargin$ = new Subject<string>();
  private readonly _destroy$ = new Subject<void>();

  constructor(parent: HTMLElement,
              position: {top?: 0; right?: 0; bottom?: 0; left?: 0},
              private _onPositionChange: () => void) {
    this._element = parent.appendChild(this.createVertexElement(position));
    this.installIntersectionObserver();
    this.computeRootMargin();
  }

  /**
   * Computes the negative margins ("top right bottom left") to clip this vertex's bounding box.
   */
  public computeRootMargin(): void {
    const documentRoot = document.documentElement;
    const documentClientRect = documentRoot.getBoundingClientRect();
    const elementClientRect = this._element.getBoundingClientRect();

    const top = elementClientRect.top + documentRoot.scrollTop;
    const left = elementClientRect.left + documentRoot.scrollLeft;
    const right = documentClientRect.width - elementClientRect.right - documentRoot.scrollLeft;
    const bottom = documentClientRect.height - elementClientRect.bottom - documentRoot.scrollTop;
    this._rootMargin$.next(`${Math.ceil(-1 * top)}px ${Math.ceil(-1 * right)}px ${Math.ceil(-1 * bottom)}px ${Math.ceil(-1 * left)}px`);
  }

  private installIntersectionObserver(): void {
    this._rootMargin$
      .pipe(
        distinctUntilChanged(),
        switchMap(rootMargin => fromIntersection$(this._element, {rootMargin, threshold: 1, root: document.documentElement})),
        takeUntil(this._destroy$),
      )
      .subscribe((entries: IntersectionObserverEntry[]) => {
        const isIntersecting = entries.at(-1)?.isIntersecting ?? false;
        if (!isIntersecting) {
          this._onPositionChange();
          this.computeRootMargin();
        }
      });

    // Recompute the root margin when the element re-enters the viewport.
    fromIntersection$(this._element, {threshold: 1, root: document})
      .pipe(takeUntil(this._destroy$))
      .subscribe((entries: IntersectionObserverEntry[]) => {
        const isIntersecting = entries.at(-1)?.isIntersecting ?? false;
        if (isIntersecting) {
          this._onPositionChange();
          this.computeRootMargin();
        }
      });
  }

  private createVertexElement(position: {top?: 0; right?: 0; bottom?: 0; left?: 0}): HTMLElement {
    const element = document.createElement<'div'>('div');
    setStyle(element, {
      'position': 'absolute',
      'top': position.top === 0 ? '0' : null,
      'right': position.right === 0 ? '0' : null,
      'bottom': position.bottom === 0 ? '0' : null,
      'left': position.left === 0 ? '0' : null,
      'width': '1px',
      'height': '1px',
      'visibility': 'hidden',
      'pointer-events': 'none',
    });
    return element;
  }

  public destroy(): void {
    this._element.remove();
    this._destroy$.next();
  }
}

/**
 * Ensures that the given HTML element is positioned, setting its position to `relative` if it is not already positioned.
 */
function ensureElementPositioned(element: HTMLElement): void {
  if (getComputedStyle(element).position !== 'static') {
    return;
  }

  // Declare styles for the document root element (`<html>`) in a CSS layer.
  // CSS layers have lower priority than "normal" CSS declarations, and the layer name indicates the styling originates from `@scion/toolkit`.
  if (element === document.documentElement) {
    const styleSheet = new CSSStyleSheet({});
    styleSheet.insertRule(`
    @layer sci-toolkit {
      :root {
        position: relative;
      }
    }`);
    document.adoptedStyleSheets.push(styleSheet);
    console.warn('[@scion/toolkit] fromBoundingClientRect$ requires the document root element (<html>) to be positioned relative or absolute. Changing positioning to relative.');
  }
  else {
    setStyle(element, {position: 'relative'});
  }
}

/**
 * Apples specified styles for given element.
 */
function setStyle(element: HTMLElement, styles: {[style: string]: string | null}): void {
  Object.entries(styles).forEach(([name, value]) => {
    if (value === null) {
      element.style.removeProperty(name);
    }
    else {
      element.style.setProperty(name, value);
    }
  });
}

function isEqualDomRect(a: DOMRect, b: DOMRect): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}
