/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, inject, Injector, input, inputBinding, runInInjectionContext, Signal, signal, untracked, viewChild} from '@angular/core';
import {SciRowActionFactoryFn, SciTable, SciTableComponent, SciTableFactory, table} from '@scion/components/table';
import {Company, CompanyService} from './sci-table-page.data';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, readonly, required} from '@angular/forms/signals';
import {DatePipe} from '@angular/common';
import {createDestroyableInjector} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {FieldValidationDirective} from '../common/field-validation.directive';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {MinMaxDirective} from '../common/min-max.directive';

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  imports: [
    SciTableComponent,
    FormsModule,
    FormField,
    SciFormFieldComponent,
    FormRoot,
    FieldValidationDirective,
    SciTabDirective,
    SciTabbarComponent,
    MinMaxDirective,
  ],
})
export default class SciTablePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _tabbar = viewChild.required(SciTabbarComponent);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly companyForm: FieldTree<CompanyForm> = this.createCompanyForm();

  protected readonly table = this.computeTable();
  protected readonly rowCount = inject(CompanyService).companyCount;

  private createTable(options: {slowDataSource: boolean}): SciTable<Company> {
    const companyService = inject(CompanyService);
    const companyForm = this.companyForm;
    const tabbar = this._tabbar;

    return table({
      name: 'table:companies',
      headerVisible: computed(() => this.settingsForm.showHeader().value()),
      gridlinesVisible: computed(() => this.settingsForm.showGridlines().value()),
      sortable: computed(() => this.settingsForm.sortable().value()),
      filterable: computed(() => this.settingsForm.filterable().value()),
      resizable: computed(() => this.settingsForm.resizable().value()),
      selectable: computed(() => {
        const selectable = this.settingsForm.selectable().value();
        return selectable === 'false' ? false : selectable;
      }),
      trackBy: company => company.id,
      data: options.slowDataSource ? request => companyService.getCompanies$(request, {slowDataSource: true}) : companyService.companies,
      rowActions: createRowActions(),
    }, (table: SciTableFactory<Company>) => {
      const visibleColumns = this.settingsForm.visibleColumns().value();

      // ID Column.
      if (visibleColumns.id) {
        table.addNumberColumn({
          name: 'column:id',
          header: 'ID',
          value: company => +company.id,
        });
      }

      // Code Column.
      if (visibleColumns.code) {
        table.addNumberColumn({
          name: 'column:code',
          header: 'Code',
          value: company => company.code,
        });
      }

      // Abbreviation Column.
      if (visibleColumns.abbreviation) {
        table.addStringColumn({
          name: 'column:abbreviation',
          header: 'Abbreviation',
          value: company => company.abbreviation,
          width: '1fr',
        });
      }

      // Name Column.
      if (visibleColumns.name) {
        table.addStringColumn({
          name: 'column:name',
          header: 'Name',
          value: company => company.name,
          width: '1fr',
        });
      }

      // EVU Column.
      if (visibleColumns.railwayUndertaking) {
        table.addBooleanColumn({
          name: 'column:railwayUndertaking',
          header: 'EVU',
          value: company => company.railwayUndertaking,
        });
      }

      // Valid From Column.
      if (visibleColumns.validFrom) {
        table.addComponentColumn({
          name: 'column:validFrom',
          header: 'Valid From',
          sortable: this.settingsForm.slowDataSource().value() ? true : {comparator: (a, b) => new Date(a.item.validFrom).getTime() - new Date(b.item.validFrom).getTime()},
          filterable: this.settingsForm.slowDataSource().value() ? true : {matcher: (filterText, item) => item.item.validFrom.includes(filterText)},
          component: (company: Company) => ({
            component: DateCellComponent,
            bindings: [inputBinding('date', () => new Date(company.validFrom))],
          }),
        });
      }

      // Valid To Column.
      if (visibleColumns.validTo) {
        table.addComponentColumn({
          name: 'column:validTo',
          header: 'Valid To',
          filterable: this.settingsForm.slowDataSource().value() ? true : {matcher: (filterText, item) => item.item.validTo.includes(filterText)},
          sortable: this.settingsForm.slowDataSource().value() ? true : {comparator: (a, b) => new Date(a.item.validTo).getTime() - new Date(b.item.validTo).getTime()},
          component: (company: Company) => ({
            component: DateCellComponent,
            bindings: [inputBinding('date', () => new Date(company.validTo))],
          }),
        });
      }
    });

    function createRowActions(): SciRowActionFactoryFn<Company> {
      return (company: Company, toolbar: SciToolbarFactory) => toolbar
        .addToolbarButton({
          icon: 'scion.edit',
          onSelect: () => {
            companyForm().reset(company);
            requestAnimationFrame(() => tabbar().activateTab('company-editor'));
          },
        })
        .addToolbarButton({
          icon: 'scion.delete',
          accelerator: {key: 'delete'},
          onSelect: () => companyService.deleteCompany(company.id),
        })
        .addToolbarButton({
          icon: 'content_copy',
          onSelect: () => companyService.addCompany(company),
        })
        .addToolbarMenu({
          icon: 'scion.more_vertical',
          visualMenuIndicator: false,
        }, menu => menu
          .addMenuItem({
            icon: 'scion.edit',
            label: 'Edit',
            onSelect: () => {
              companyForm().reset(company);
              requestAnimationFrame(() => tabbar().activateTab('company-editor'));
            },
          })
          .addMenuItem({
            label: 'Copy',
            icon: 'content_copy',
            onSelect: () => companyService.addCompany(company),
          })
          .addMenu({label: 'More'}, menu => menu
            .addMenuItem({
              label: 'Copy to...',
              onSelect: () => console.log('copy', company),
            })
            .addMenuItem({
              label: 'Move to...',
              onSelect: () => console.log('move', company),
            })
            .addMenuItem({
              label: 'Info...',
              onSelect: () => console.log('info', company),
            }),
          ));
    }
  }

  private computeTable(): Signal<SciTable<Company> | undefined> {
    const table = signal<SciTable<Company> | undefined>(undefined);

    effect(onCleanup => {
      const slowDataSource = this.settingsForm.slowDataSource().value();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        table.set(runInInjectionContext(injector, () => this.createTable({slowDataSource})));
      });
    });

    return table;
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    const defaults: SettingsForm = {
      filterable: true,
      sortable: true,
      resizable: true,
      showHeader: true,
      showGridlines: false,
      slowDataSource: false,
      selectable: 'multi',
      visibleColumns: {
        id: true,
        code: true,
        abbreviation: true,
        name: true,
        railwayUndertaking: true,
        validFrom: true,
        validTo: true,
      },
    };
    return form(signal(defaults));
  }

  private createCompanyForm(): FieldTree<CompanyForm> {
    const companyService = inject(CompanyService);

    const defaults: CompanyForm = {
      id: '',
      code: null,
      abbreviation: '',
      name: '',
      railwayUndertaking: false,
      validFrom: '',
      validTo: '',
    };

    return form(signal(defaults), company => {
      required(company.id);
      required(company.code);
      required(company.abbreviation);
      required(company.name);
      required(company.validFrom);
      required(company.validTo);
      readonly(company.id);
    }, {
      submission: {
        action: async form => {
          companyService.updateCompany(form().value() as Company);
          this.companyForm().reset(defaults);
          this._tabbar().activateTab('settings');
        },
      },
    });
  }

  protected onCompanyFormCancel(): void {
    this.companyForm.id().value.set('');
    this._tabbar().activateTab('settings');
  }
}

@Component({
  selector: 'app-date-cell',
  imports: [DatePipe],
  template: `{{date() | date : 'dd.MM.yyyy'}}`,
})
class DateCellComponent {

  protected readonly date = input.required<Date>();
}

interface SettingsForm {
  filterable: boolean;
  sortable: boolean;
  resizable: boolean;
  showHeader: boolean;
  showGridlines: boolean;
  slowDataSource: boolean;
  selectable: 'false' | 'single' | 'multi';
  visibleColumns: {
    id: boolean;
    code: boolean;
    abbreviation: boolean;
    name: boolean;
    railwayUndertaking: boolean;
    validFrom: boolean;
    validTo: boolean;
  };
}

export interface CompanyForm {
  id: string;
  code: number | null;
  abbreviation: string;
  name: string;
  railwayUndertaking: boolean;
  validFrom: string;
  validTo: string;
}
