/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, contentChildren, effect, inject, untracked, viewChild, ViewContainerRef} from '@angular/core';
import {SciTabDirective} from './tab.directive';
import {NgClass} from '@angular/common';
import {SciViewportComponent} from '@scion/components/viewport';

/**
 * Organizes content into separate tabs where only one tab can be visible at a time.
 *
 * A tab's content is constructed lazily when displayed for the first time. Tab content is not destroyed when selecting another tab.
 *
 * Tabs are modelled as content children in the form of a `<ng-template>` decorated with the `sciTab` directive, as following:
 *
 * ```
 * <sci-tabbar>
 *   @for (item of items$ | async; track item.id) {
 *     <ng-template sciTab [label]="item.label">
 *       ...
 *     </ng-template>
 *   }
 * </sci-tabbar>
 * ```
 */
@Component({
  selector: 'sci-tabbar',
  templateUrl: './tabbar.component.html',
  styleUrls: ['./tabbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    SciViewportComponent,
  ],
})
export class SciTabbarComponent {

  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _vcr = viewChild.required('tabcontent', {read: ViewContainerRef});

  protected readonly tabs = contentChildren(SciTabDirective);

  constructor() {
    effect(() => {
      if (this.tabs().length && !this.getActiveTab()) {
        untracked(() => this.activateTab(this.tabs().at(0)));
      }
    });
  }

  /**
   * Activates the given tab.
   */
  public activateTab(tabOrIdentity: SciTabDirective | string | undefined): void {
    const tab = this.coerceTab(tabOrIdentity);

    // Deactivate the currently selected tab, if any.
    const selectedTab = this.getActiveTab();
    if (selectedTab && selectedTab === tab) {
      return;
    }
    if (selectedTab) {
      selectedTab.detachContent();
    }

    // Activate the new tab, if any.
    if (tab) {
      tab.attachContent(this._vcr());
    }
    this._cd.markForCheck();
  }

  protected onTabClick(tab: SciTabDirective | undefined): void {
    this.activateTab(tab);
  }

  private getActiveTab(): SciTabDirective | undefined {
    return this.tabs().find(tab => tab.isContentAttached());
  }

  private coerceTab(tabOrIdentity: SciTabDirective | string | undefined): SciTabDirective | undefined {
    if (!tabOrIdentity) {
      return undefined;
    }
    if (typeof tabOrIdentity === 'string') {
      return this.tabs().find(it => it.name() === tabOrIdentity) ?? undefined;
    }
    return tabOrIdentity;
  }
}
