/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {SciListComponent, SciListItemDirective} from '@scion/components.internal/list';
import {AsyncPipe} from '@angular/common';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'sci-list-page',
  templateUrl: './sci-list-page.component.html',
  styleUrls: ['./sci-list-page.component.scss'],
  imports: [
    AsyncPipe,
    SciListComponent,
    SciListItemDirective,
    SciMaterialIconDirective,
  ],
})
export default class SciListPageComponent {

  protected readonly filter$ = new BehaviorSubject<string>('');
  protected readonly flaggedItems = new Set<string>();
  protected readonly items$: Observable<string[]> = of([
    'SCION Microfrontend Platform',
    'SCION Workbench',
    'SCION Toolkit',
    'SCION Toolkit INTERNAL',
    'Angular',
    'Angular CDK',
    'Angular Material',
    'Angular Schematics',
    'Angular Google Maps Component',
    'Angular Youtube Component',
  ]).pipe(
    switchMap(items => this.filter$.pipe(map(filterText => items.filter(item => !filterText || item.toUpperCase().includes(filterText))))),
  );

  protected onFilter(filter: string): void {
    this.filter$.next(filter.toUpperCase());
  }

  protected onFlag(item: string): void {
    this.flaggedItems.add(item);
  }

  protected onUnflag(item: string): void {
    this.flaggedItems.delete(item);
  }

  protected isFlagged(item: string): boolean {
    return this.flaggedItems.has(item);
  }
}
