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
import {provideAsyncTreeDatasource, provideTreeDatasource, SciTree, SciTreeComponent, tree} from '@scion/components/tree';
import {companies} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField} from '@angular/forms/signals';
import {createDestroyableInjector} from '@scion/components/common';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {MinMaxDirective} from '../common/min-max.directive';
import {Router} from '@angular/router';
import {SciViewportComponent} from '@scion/components/viewport';
import {createDesignTokenForm, DesignTokenForm, DesignTokenFormComponent} from '../styles/design-token-form.component';
import {VehicleNode} from '../sci-table-page/vehicle.model';
import {VehicleService} from '../sci-table-page/vehicle.service';
import {SciTableDataSourceProvider} from '@scion/components/table';

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
  private readonly _vehicleService = inject(VehicleService);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly designTokenForm: FieldTree<DesignTokenForm> = this.createDesignTokenForm();

  protected readonly tree = this.computeTree();
  protected readonly rowCount = signal(companies.length);
  protected readonly selectable = computed(() => {
    const selectable = this.tree()?.selectable();
    return selectable === false ? 'false' : selectable;
  });
  protected readonly selection = computed(() => this.tree()?.selectedItems().map(item => Number(item)).sort((a, b) => a - b).join(' '));
  protected readonly host = inject(ElementRef).nativeElement as HTMLElement;

  private createTree(options: {slowDatasource: boolean}): SciTree<string> {
    return tree<VehicleNode, string>({
      label: item => item.label,
      datasource: this.getDataSource(options),
      trackBy: item => item.id,
    });
  }

  private computeTree(): Signal<SciTree<string> | undefined> {
    const tree = signal<SciTree<string> | undefined>(undefined);

    effect(onCleanup => {
      const slowDatasource = this.settingsForm.slowDatasource().value();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        tree.set(runInInjectionContext(injector, () => this.createTree({slowDatasource})));
      });
    });

    return tree;
  }

  private getDataSource(options: {slowDatasource: boolean}): SciTableDataSourceProvider<VehicleNode, string> {
    if (options.slowDatasource) {
      return provideAsyncTreeDatasource<VehicleNode, string>(
        request => this._vehicleService.getVehicleNodeIds$(request),
        ids => this._vehicleService.getVehicleNodes$(ids),
      );
    }

    return provideTreeDatasource<VehicleNode, string>(this._vehicleService.operatorGroups, item => item.kind === 'vehicle' ? [] : item.children);
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    return form(signal({
      slowDatasource: true,
    }));
  }

  private createDesignTokenForm(): FieldTree<DesignTokenForm> {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    return createDesignTokenForm([
      '--sci-tree-node-height',
      '--sci-tree-node-indent',
      '--sci-tree-node-background-color-hover',
      '--sci-tree-node-background-color-selected',
      '--sci-tree-node-border-radius',
      '--sci-tree-node-outline-color',
      '--sci-tree-node-outline-width',
      '--sci-tree-node-outline-style',
      '--sci-tree-node-action-background-color',
      '--sci-tree-node-action-background-color-selected',
    ], this._treeElement, {designTokenRootElement: host});
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
  slowDatasource: boolean;
}
