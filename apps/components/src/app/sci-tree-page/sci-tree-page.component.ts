/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, ElementRef, inject, Injector, runInInjectionContext, Signal, signal, untracked, viewChild} from '@angular/core';
import {provideTreeDatasource, SciTree, SciTreeComponent, tree} from '@scion/components/tree';
import {companies, Company} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField} from '@angular/forms/signals';
import {createDestroyableInjector} from '@scion/components/common';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {MinMaxDirective} from '../common/min-max.directive';
import {Router} from '@angular/router';
import {SciViewportComponent} from '@scion/components/viewport';
import {UUID} from '@scion/toolkit/uuid';
import {createDesignTokenForm, DesignTokenForm, DesignTokenFormComponent} from '../styles/design-token-form.component';

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
    SciTabDirective,
    SciTabbarComponent,
    MinMaxDirective,
    SciViewportComponent,
    SciTreeComponent,
    DesignTokenFormComponent,
  ],
})
export default class SciTreePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _router = inject(Router);
  private readonly _treeElement: Signal<ElementRef<HTMLElement> | undefined> = viewChild(SciTreeComponent, {read: ElementRef});

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly designTokenForm: FieldTree<DesignTokenForm> = this.createDesignTokenForm();

  protected readonly tree = this.computeTree();
  protected readonly rowCount = companies.length;
  protected readonly selectable = computed(() => {
    const selectable = this.tree()?.selectable();
    return selectable === false ? 'false' : selectable;
  });
  protected readonly selection = computed(() => this.tree()?.selectedItems().map(item => Number(item.dataId)).sort((a, b) => a - b).join(' '));
  protected readonly host = inject(ElementRef).nativeElement as HTMLElement;

  constructor() {
    this.bindTreeSettings();
  }

  private createTree(): SciTree<Company> {
    return tree<Company>({
      label: company => company.dataId,
      datasource: provideTreeDatasource(computed(() => data().filter(item => item.parent === undefined)), item => data().filter(i => i.parent === item.code)),
      nodeBindings: (bindings, _vehicle, index) => {
        if (this.settingsForm.showZebraStriping().value()) {
          bindings.addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd');
        }
      },
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
    return form(signal({
      header: '',
      showGridlines: false,
      showZebraStriping: false,
      slowDatasource: false,
    }));
  }

  private createDesignTokenForm(): FieldTree<DesignTokenForm> {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    const form = createDesignTokenForm([
      '--sci-table-gridline-color',
      '--sci-table-header-height',
      '--sci-table-header-cursor',
      '--sci-table-header-background-color',
      '--sci-table-header-background-color-hover',
      '--sci-table-header-font-family',
      '--sci-table-header-font-size',
      '--sci-table-header-font-weight',
      '--sci-table-header-text-color',
      '--sci-table-header-column-divider',
      '--sci-table-row-height',
      '--sci-table-row-background-color-hover',
      '--sci-table-row-background-color-selected',
      '--sci-table-row-border-radius',
      '--sci-table-row-outline-color',
      '--sci-table-row-outline-width',
      '--sci-table-row-outline-style',
      '--sci-table-row-action-background-color',
      '--sci-table-row-action-background-color-selected',
      '--sci-table-cell-padding-inline',
    ], this._treeElement, {designTokenRootElement: host});

    // Set/Unset gridline color based on 'Show Gridlines' setting.
    effect(() => {
      const tableElement = this._treeElement()?.nativeElement;
      if (!tableElement) {
        return;
      }

      const showGridlines = this.settingsForm.showGridlines().value();
      const gridlineColor = form['--sci-table-gridline-color']!().value();
      tableElement.style.setProperty('--sci-table-gridline-color', showGridlines ? gridlineColor : 'transparent');
    });

    return form;
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
  showGridlines: boolean;
  showZebraStriping: boolean;
  slowDatasource: boolean;
}
