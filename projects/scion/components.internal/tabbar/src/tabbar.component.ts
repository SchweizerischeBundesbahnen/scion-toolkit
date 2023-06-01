/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, QueryList, ViewChild, ViewContainerRef} from '@angular/core';
import {SciTabDirective} from './tab.directive';
import {map, startWith} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {tapFirst} from '@scion/toolkit/operators';
import {AsyncPipe, NgClass, NgFor} from '@angular/common';
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
 *   <ng-template sciTab [label]="item.label" *ngFor="let item of items$ | async">
 *     ...
 *   </ng-template>
 * </sci-tabbar>
 * ```
 */
@Component({
  selector: 'sci-tabbar',
  templateUrl: './tabbar.component.html',
  styleUrls: ['./tabbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgFor,
    AsyncPipe,
    NgClass,
    SciViewportComponent,
  ],
})
export class SciTabbarComponent implements AfterContentInit {

  @ViewChild('tabcontent', {read: ViewContainerRef, static: true})
  private _vcr!: ViewContainerRef;

  /** @internal */
  @ContentChildren(SciTabDirective)
  public tabs!: QueryList<SciTabDirective>;

  /** @internal */
  public tabs$!: Observable<SciTabDirective[]>;

  constructor(private _cd: ChangeDetectorRef) {
  }

  public ngAfterContentInit(): void {
    this.tabs$ = this.tabs.changes
      .pipe(
        startWith(this.tabs),
        tapFirst(() => this.activateTab(this.tabs.first)),
        map(tabs => tabs.toArray()),
      );
  }

  public onTabClick(tab: SciTabDirective | undefined): void {
    this.activateTab(tab);
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
      tab.attachContent(this._vcr);
    }
    this._cd.markForCheck();
  }

  private getActiveTab(): SciTabDirective | undefined {
    return this.tabs.find(tab => tab.isContentAttached());
  }

  private coerceTab(tabOrIdentity: SciTabDirective | string | undefined): SciTabDirective | undefined {
    if (!tabOrIdentity) {
      return undefined;
    }
    if (typeof tabOrIdentity === 'string') {
      return this.tabs.find(it => it.name === tabOrIdentity) ?? undefined;
    }
    return tabOrIdentity;
  }
}
