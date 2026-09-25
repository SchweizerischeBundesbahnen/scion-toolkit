/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, inject, Injector, runInInjectionContext, Signal, signal, untracked} from '@angular/core';
import {provideTreeDatasource, SciTree, SciTreeComponent, tree} from '@scion/components/tree';
import {Company} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField} from '@angular/forms/signals';
import {createDestroyableInjector} from '@scion/components/common';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {MinMaxDirective} from '../common/min-max.directive';
import {Router} from '@angular/router';
import {SciViewportComponent} from '@scion/components/viewport';
import {companies} from '../sci-table-page-alt/sci-table-page.data';
import {CompanyService} from '../sci-table-page/sci-table-page.data';
import {UUID} from '@scion/toolkit/uuid';

const data = signal(new Array(companies.length).fill(0).map((_, i) => ({
  ...companies[i % companies.length]!,
  dataId: UUID.randomUUID(),
})));

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-tree-page.component.html',
  styleUrl: './sci-tree-page.component.scss',
  imports: [
    FormsModule,
    FormField,
    SciFormFieldComponent,
    SciTabDirective,
    SciTabbarComponent,
    MinMaxDirective,
    SciViewportComponent,
    SciTreeComponent,
  ],
})
export default class SciTreePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _router = inject(Router);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();

  protected readonly tree = this.computeTree();
  protected readonly rowCount = inject(CompanyService).companyCount;
  protected readonly selectable = computed(() => {
    const selectable = this.tree()?.selectable();
    return selectable === false ? 'false' : selectable;
  });
  protected readonly selection = computed(() => this.tree()?.selectedItems().map(item => Number(item.dataId)).sort((a, b) => a - b).join(' '));

  constructor() {
    this.bindTreeSettings();
  }

  private createTree(): SciTree<Company> {
    return tree<Company>({
      label: company => company.dataId,
      datasource: provideTreeDatasource(computed(() => data().filter(item => item.parent === undefined)), {
        getChildren: item => {
          return data().filter(i => i.parent === item.code);
        },
        hasChildren: item => data().some(i => i.parent === item.code),
      }),
      trackBy: company => company.dataId,
    });
  }

  private computeTree(): Signal<SciTree<Company> | undefined> {
    const tree = signal<SciTree<Company> | undefined>(undefined);

    effect(onCleanup => {
      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        tree.set(runInInjectionContext(injector, () => this.createTree()));
      });
    });

    return tree;
  }

  private bindTreeSettings(): void {
    effect(() => {
      const tree = this.tree();
      tree?.header.set(this.settingsForm.header().value());
    });
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    const defaults: SettingsForm = {
      header: '',
      slowDataSource: false,
    };
    return form(signal(defaults));
  }

  protected onUserSettingsReset(): void {
    sessionStorage.removeItem('scion.components.table:companies');
    void this._router.navigate(['/']).then(() => this._router.navigate(['/sci-tree']));
  }

  protected updateSelectable(selectable: 'multi' | 'single' | 'false'): void {
    this.tree()?.selectable.set(selectable === 'false' ? false : selectable);
  }
}

interface SettingsForm {
  header: string;
  slowDataSource: boolean;
}
