/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, inject, input, OnDestroy, TemplateRef, ViewContainerRef, ViewRef} from '@angular/core';

/**
 * Use this directive to model a tab item for {SciTabbarComponent}.
 * The host element of this modelling directive must be a <ng-template>.
 *
 * Tab content is constructed lazily when displayed for the first time. Tab content is not destroyed when selecting another tab.
 *
 * ---
 * Example usage:
 *
 * <sci-tabbar>
 *   @for (item of items$ | async; track item.id) {
 *     <ng-template sciTab [label]="item.label">
 *       ...
 *     </ng-template>
 *   }
 * </sci-tabbar>
 */
@Directive({selector: 'ng-template[sciTab]'})
export class SciTabDirective implements OnDestroy {

  /**
   * Specifies the title of the tab.
   */
  public readonly label = input.required<string>();

  /**
   * Specifies the identity of this tab.
   *
   * Can be used to activate this tab via {@link SciTabbarComponent.activateTab}.
   */
  public readonly name = input<string>();

  /**
   * Specifies CSS class(es) added to the tab item, e.g., to select the tab in end-to-end tests.
   */
  public readonly cssClass = input<string | string[] | null | undefined>();

  private readonly _templateRef = inject<TemplateRef<void>>(TemplateRef);

  private _vcr: ViewContainerRef | undefined;
  private _viewRef: ViewRef | undefined;

  /**
   * Attaches the content of this tab.
   *
   * @param vcr
   *        Specifies where to attach this tab's content.
   */
  public attachContent(vcr: ViewContainerRef): void {
    this._vcr = vcr;

    // Construct the view, if not already constructed.
    this._viewRef ??= this._templateRef.createEmbeddedView(undefined);

    // Attach the content, if not already attached.
    if (!this.isContentAttached()) {
      this._viewRef.reattach();
      vcr.insert(this._viewRef);
    }
  }

  /**
   * Detaches the content of this tab, but does not destroy it.
   */
  public detachContent(): void {
    if (this.isContentAttached()) {
      this._vcr!.detach(this._vcr!.indexOf(this._viewRef!));
      this._viewRef!.detach();
    }
  }

  /**
   * Returns whether the tab content is currently attached to the DOM, meaning that the user has selected the tab.
   */
  public isContentAttached(): boolean {
    return !!this._viewRef && this._vcr?.indexOf(this._viewRef) !== -1;
  }

  public ngOnDestroy(): void {
    this._viewRef?.destroy();
    this._viewRef = undefined;
    this._vcr = undefined;
  }
}
