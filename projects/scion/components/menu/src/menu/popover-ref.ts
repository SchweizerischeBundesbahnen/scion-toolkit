/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {DestroyRef, ElementRef, inject, InjectionToken, signal, WritableSignal} from '@angular/core';

/**
 * Provides a reference to the menu's popover element and child popover, if any.
 *
 * A child popover can be a submenu or a menu opened from a menu item's action toolbar.
 *
 * Can be injected into {@link SciMenuComponent}.
 */
export class PopoverRef {

  private readonly _element = inject(ElementRef).nativeElement as HTMLElement;
  private readonly _parentPopover = inject(PopoverRef, {skipSelf: true, optional: true});
  private readonly _popovers = inject(POPOVER_REFS);

  /**
   * Reference to the child popover, if any. Can be a submenu or a menu opened from a menu item's action toolbar.
   */
  public readonly childPopover = signal<PopoverRef | undefined>(undefined);

  /**
   * Indicates if this is a submenu popover, i.e., not a top-level menu nor a menu opened from a menu item's action toolbar.
   */
  public readonly isSubmenu: boolean;

  constructor(options: {isSubmenu: boolean}) {
    this.isSubmenu = options.isSubmenu;
    this.registerPopover();
    this.registerPopoverInParentPopover();
  }

  /**
   * Registers this popover in {@link POPOVER_REFS}.
   */
  private registerPopover(): void {
    this._popovers.update(popovers => new Set(popovers).add(this));

    // Unregister popover when destroyed.
    inject(DestroyRef).onDestroy(() => this._popovers.update(popovers => {
      const copy = new Set(popovers);
      copy.delete(this);
      return copy;
    }));
  }

  /**
   * Registers this popover in the parent {@link PopoverRef}, if any.
   */
  private registerPopoverInParentPopover(): void {
    const parentPopover = this._parentPopover;
    if (!parentPopover) {
      return;
    }

    parentPopover.childPopover.set(this);

    // Unregister popover when destroyed.
    inject(DestroyRef).onDestroy(() => parentPopover.childPopover.update(childPopover => childPopover == this ? undefined : childPopover));
  }

  /**
   * Closes this popover, and parent popovers if specified.
   *
   * Defaults to not closing parent popovers.
   */
  public close(options?: {closeParents?: boolean}): void {
    this._element.hidePopover();

    if (options?.closeParents) {
      this._parentPopover?.close(options);
    }
  }
}

/**
 * DI token to inject currently open menu popovers.
 */
export const POPOVER_REFS = new InjectionToken<WritableSignal<Set<PopoverRef>>>('POPOVER_REFS', {
  providedIn: 'root',
  factory: () => signal(new Set()),
});
