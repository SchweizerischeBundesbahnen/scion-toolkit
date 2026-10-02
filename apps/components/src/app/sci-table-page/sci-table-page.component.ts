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
import {provideHierarchicalTableDatasource, providePageableHierarchicalTableDatasource, providePageableTableDatasource, SciTable, SciTableComponent, table, ɵillegaldatasource} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, readonly, required} from '@angular/forms/signals';
import {DatePipe} from '@angular/common';
import {createDestroyableInjector, SciComponentDescriptor} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {FieldValidationDirective} from '../common/field-validation.directive';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {MinMaxDirective} from '../common/min-max.directive';
import {Router} from '@angular/router';
import {SciViewportComponent} from '@scion/components/viewport';
import {VehicleService} from './vehicle.service';
import {isVehicle, Vehicle, VehicleOrOperator} from './vehicle.model';
import {SciTableDataSourceProvider} from '../../../../../projects/scion/components/table/src/table.model';
import {EMPTY} from 'rxjs';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrl: './sci-table-page.component.scss',
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
    SciViewportComponent,
    SciFilterFieldComponent,
  ],
  host: {
    '[style.--sci-table-gridline-color]': 'settingsForm.showGridlines().value() ? "var(--sci-color-border)" : null',
  },
})
export default class SciTablePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _tabbar = viewChild.required(SciTabbarComponent);
  private readonly _tableFilterField = viewChild.required(SciFilterFieldComponent);
  private readonly _router = inject(Router);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly vehicleForm: FieldTree<VehicleForm> = this.createVehicleForm();

  protected readonly table = this.computeTable();
  protected readonly rowCount = inject(VehicleService).vehicleCount;
  protected readonly selectable = computed(() => {
    const selectable = this.table()?.selectable();
    return selectable === false ? 'false' : selectable;
  });
  protected readonly selection = computed(() => this.table()?.selectedItems().filter(isVehicle).map(item => item.id).sort((a, b) => a - b).join(' '));
  protected readonly activeVehicleId = computed(() => {
    const item = this.table()?.activeItem();
    return item && isVehicle(item) ? item.id : undefined;
  });

  private getDataSource(vehicleService: VehicleService, options: {slowDatasource: boolean; groupByOperator: boolean}): Signal<VehicleOrOperator[]> | SciTableDataSourceProvider<VehicleOrOperator> {
    if (options.groupByOperator) {
      if (options.slowDatasource) {
        return providePageableHierarchicalTableDatasource<VehicleOrOperator>(request => vehicleService.getGroupedVehicles$(request), {
          getChildren: (item, request) => !isVehicle(item) ? vehicleService.getOperatorChildren$(item, request) : EMPTY,
          hasChildren: item => !isVehicle(item),
        });
      }

      return provideHierarchicalTableDatasource<VehicleOrOperator>(vehicleService.operators, {
        getChildren: item => !isVehicle(item) ? vehicleService.vehiclesByOperator().get(item.operator) ?? [] : [],
        hasChildren: item => !isVehicle(item),
      });
    }

    if (options.slowDatasource) {
      return providePageableTableDatasource(request => vehicleService.getVehicles$(request));
    }

    return vehicleService.vehicles;
  }

  private createTable(options: {slowDatasource: boolean; groupByOperator: boolean}): SciTable<VehicleOrOperator> {
    const vehicleService = inject(VehicleService);
    const vehicleForm = this.vehicleForm;
    const tabbar = this._tabbar;

    return table({
      ɵdatasource: this.getDataSource(vehicleService, options),
      datasource: ɵillegaldatasource(),
      rowBindings: (bindings, _vehicle, index) => {
        if (this.settingsForm.showZebraStriping().value()) {
          bindings.addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd');
        }
      },
      trackBy: item => isVehicle(item) ? item.id : `operator:${item.operator}`,
      rowActions: (toolbar, item) => isVehicle(item) && addRowActions(toolbar, item),
      columns: table => {
        const visibleColumns = this.settingsForm.visibleColumns().value();

        options.groupByOperator && table.addStringColumn({
          name: 'column:operator',
          header: 'RU / Operator',
          value: item => item.operator,
        });

        visibleColumns.id && table.addColumn({
          name: 'column:id',
          header: 'ID',
          value: vehicle => isVehicle(vehicle) ? vehicle.id : '',
          width: '100px',
        });

        visibleColumns.vehicleId && table.addStringColumn({
          name: 'column:vehicleId',
          header: 'Vehicle ID',
          value: item => isVehicle(item) ? item.vehicleId : '',
        });
        visibleColumns.classType && table.addStringColumn({
          name: 'column:classType',
          header: 'Class / Series',
          value: item => isVehicle(item) ? item.classType : '',
        });
        (visibleColumns.operator && !options.groupByOperator) && table.addStringColumn({
          name: 'column:operator',
          header: 'RU / Operator',
          value: item => item.operator,
        });
        visibleColumns.depot && table.addStringColumn({
          name: 'column:depot',
          header: 'Depot / Maintenance',
          value: item => isVehicle(item) ? item.depot : '',
        });
        visibleColumns.status && table.addStringColumn({
          name: 'column:status',
          header: 'Status',
          value: item => isVehicle(item) ? item.status : '',
          width: '150px',
        });
        visibleColumns.tps && table.addStringColumn({
          name: 'column:tps',
          header: 'Train Protection',
          value: item => isVehicle(item) ? item.tps : '',
          width: '150px',
        });
        visibleColumns.operatingHours && table.addColumn({
          name: 'column:operatingHours',
          header: 'Operating Hours (h)',
          value: vehicle => isVehicle(vehicle) ? vehicle.operatingHours : '',
          width: '175px',
        });
        visibleColumns.mileage && table.addColumn({
          name: 'column:mileage',
          header: 'Mileage (km)',
          value: vehicle => isVehicle(vehicle) ? vehicle.mileageKm : '',
          width: '150px',
        });
        visibleColumns.maxSpeed && table.addColumn({
          name: 'column:maxSpeed',
          header: 'Max Speed (km/h)',
          value: vehicleOrOperator => isVehicle(vehicleOrOperator) ? vehicleOrOperator.maxSpeedKmh : vehicleOrOperator.averageMaxSpeedKmh,
          width: '175px',
        });
        visibleColumns.serviceWeight && table.addColumn({
          name: 'column:serviceWeight',
          header: 'Service Weight (t)',
          value: vehicle => isVehicle(vehicle) ? vehicle.serviceWeightT : '',
          width: '175px',
        });
        visibleColumns.seatingCapacity && table.addColumn({
          name: 'column:seatingCapacity',
          header: 'Seats',
          value: vehicle => isVehicle(vehicle) ? vehicle.seatingCapacity : '',
          width: '100px',
        });
        visibleColumns.buildYear && table.addColumn({
          name: 'column:buildYear',
          header: 'Year Built',
          value: vehicle => isVehicle(vehicle) ? vehicle.buildYear : '',
          width: '125px',
        });
        visibleColumns.isOperational && table.addColumn({
          name: 'column:isOperational',
          header: 'Operational',
          value: vehicle => isVehicle(vehicle) ? vehicle.status === 'In Operation' : '',
          width: '120px',
        });
        visibleColumns.hasWifi && table.addColumn({
          name: 'column:hasWifi',
          header: 'Wi-Fi',
          value: vehicle => isVehicle(vehicle) ? vehicle.hasWifi : '',
          width: '100px',
        });
        visibleColumns.isMultiSystem && table.addColumn({
          name: 'column:isMultiSystem',
          header: 'Multi-System',
          value: vehicle => isVehicle(vehicle) ? vehicle.isMultiSystem : '',
          width: '150px',
        });
        visibleColumns.isTpsActive && table.addColumn({
          name: 'column:isTpsActive',
          header: 'TPS Active',
          value: vehicle => isVehicle(vehicle) ? vehicle.isTpsActive : '',
          width: '110px',
        });
        visibleColumns.isOverhaulDue && table.addColumn({
          name: 'column:isOverhaulDue',
          header: 'Overhaul Due',
          value: vehicle => isVehicle(vehicle) ? vehicle.isOverhaulDue : '',
          width: '120px',
        });
        visibleColumns.isNarrowGauge && table.addColumn({
          name: 'column:isNarrowGauge',
          header: 'Narrow Gauge',
          value: vehicle => isVehicle(vehicle) ? vehicle.isNarrowGauge : '',
          width: '150px',
        });
        visibleColumns.lastR2Expiry && addDateColumn('column:lastR2Expiry', 'Last R2 Expiry', vehicle => vehicle.lastR2Expiry);
        visibleColumns.nextRevision && addDateColumn('column:nextRevision', 'Next Revision', vehicle => vehicle.nextRevision);

        function addDateColumn(name: `column:${string}`, header: string, value: (vehicle: Vehicle) => string): void {
          const component = (vehicle: Vehicle): SciComponentDescriptor => ({
            component: DateCellComponent,
            bindings: [inputBinding('date', () => new Date(value(vehicle)))],
          });
          if (options.groupByOperator) {
            table.addColumn({name, header, value: item => isVehicle(item) ? component(item) : '', sortable: true, filterable: true, width: '150px'});
          }
          else {
            table.addComponentColumn({
              name,
              header,
              sortable: options.slowDatasource ? true : {comparator: (a, b) => new Date(value(a.item as Vehicle)).getTime() - new Date(value(b.item as Vehicle)).getTime()},
              filterable: options.slowDatasource ? true : {matcher: (filterText, item) => value(item.item as Vehicle).includes(filterText)},
              component: item => component(item as Vehicle),
              width: '150px',
            });
          }
        }
      },
    });

    function addRowActions(toolbar: SciToolbarFactory, vehicle: Vehicle): void {
      toolbar
        .addToolbarButton({
          icon: 'scion.edit',
          tooltip: 'Edit',
          onSelect: () => {
            vehicleForm().reset(vehicle);
            requestAnimationFrame(() => tabbar().activateTab('vehicle-editor'));
          },
        })
        .addToolbarButton({icon: 'scion.duplicate', tooltip: 'Duplicate', onSelect: () => vehicleService.addVehicle(vehicle)})
        .addToolbarButton({icon: 'scion.delete', tooltip: 'Delete', accelerator: {key: 'delete'}, onSelect: () => vehicleService.deleteVehicle(vehicle.id)})
        .addGroup(group => group
          .addToolbarButton({icon: 'play_circle', tooltip: 'In Operation', onSelect: () => vehicleService.updateVehicle({...vehicle, status: 'In Operation'}), disabled: computed(() => vehicle.status === 'In Operation')})
          .addToolbarButton({icon: 'pause_circle', tooltip: 'Stabled', onSelect: () => vehicleService.updateVehicle({...vehicle, status: 'Stabled'}), disabled: computed(() => vehicle.status === 'Stabled')}),
        )
        .addToolbarSplitButton({icon: 'content_copy', menu: {filter: true}, onSelect: () => console.log('copy into clipboard')}, menu => menu
          .addMenuItem({icon: 'content_copy', label: 'Copy Vehicle ID', onSelect: () => console.log('copy to clipboard', vehicle)})
          .addMenuItem({icon: 'code', label: 'Copy as JSON', onSelect: () => console.log('copy as json', vehicle)})
          .addMenuItem({icon: 'picture_as_pdf', label: 'Vehicle Datasheet (PDF)', onSelect: () => console.log('download as pdf', vehicle)}),
        )
        .addToolbarMenu({icon: 'scion.more_vertical', visualMenuIndicator: false}, menu => menu
          .addMenu({icon: 'alt_route', label: 'Change Status'}, menu => menu
            .addMenuItem({icon: 'play_circle', label: 'In Operation', onSelect: () => vehicleService.updateVehicle({...vehicle, status: 'In Operation'}), disabled: computed(() => vehicle.status === 'In Operation')})
            .addGroup(group => group
              .addMenuItem({icon: 'check_circle', label: 'Ready for Service', onSelect: () => vehicleService.updateVehicle({...vehicle, status: 'Ready for Service'}), disabled: computed(() => vehicle.status === 'Ready for Service')})
              .addMenuItem({icon: 'engineering', label: 'Maintenance', onSelect: () => vehicleService.updateVehicle({...vehicle, status: 'Maintenance'}), disabled: computed(() => vehicle.status === 'Maintenance')})
              .addMenuItem({icon: 'pause_circle', label: 'Stabled', onSelect: () => vehicleService.updateVehicle({...vehicle, status: 'Stabled'}), disabled: computed(() => vehicle.status === 'Stabled')}),
            ),
          )
          .addMenuItem({icon: 'location_on', label: 'Transfer Depot', onSelect: () => console.log('transfer to depot', vehicle)})
          .addMenu({icon: 'analytics', label: 'Reports & History'}, menu => menu
            .addMenuItem({icon: 'history', label: 'Overhaul History', onSelect: () => console.log('history', vehicle)})
            .addMenuItem({icon: 'speed', label: 'Telemetry & Mileage', onSelect: () => console.log('telemetry & mileage', vehicle)})
            .addMenuItem({icon: 'assignment_late', label: 'Fault Reports (ETCS/TPS)', onSelect: () => console.log('fault reports', vehicle)}),
          )
          .addGroup(group => group
            .addMenuItem({icon: 'content_copy', label: 'Copy Vehicle ID', onSelect: () => console.log('copy', vehicle)})
            .addMenuItem({icon: 'code', label: 'Copy as JSON', onSelect: () => console.log('json', vehicle)})
            .addMenuItem({icon: 'picture_as_pdf', label: 'Vehicle Datasheet (PDF)', onSelect: () => console.log('pdf', vehicle)}),
          )
          .addGroup(group => group
            .addMenu({label: 'More'}, menu => menu
              .addMenuItem({icon: 'share', label: 'Share', onSelect: () => console.log('share', vehicle)})
              .addMenuItem({icon: 'download', label: 'Download', onSelect: () => console.log('download', vehicle)})
              .addMenuItem({icon: 'print', label: 'Print', onSelect: () => console.log('print', vehicle)}),
            )));
    }
  }

  private computeTable(): Signal<SciTable<VehicleOrOperator> | undefined> {
    const table = signal<SciTable<VehicleOrOperator> | undefined>(undefined);

    effect(onCleanup => {
      const slowDatasource = this.settingsForm.slowDatasource().value();
      const groupByOperator = this.settingsForm.groupByOperator().value();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        table.set(runInInjectionContext(injector, () => this.createTable({slowDatasource, groupByOperator})));
      });
    });

    return table;
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    const defaults: SettingsForm = {
      showGridlines: false,
      showZebraStriping: false,
      slowDatasource: false,
      groupByOperator: false,
      visibleColumns: {
        id: true,
        vehicleId: true,
        classType: true,
        operator: true,
        depot: false,
        status: true,
        tps: true,
        operatingHours: false,
        mileage: false,
        maxSpeed: true,
        serviceWeight: false,
        seatingCapacity: false,
        buildYear: false,
        isOperational: true,
        hasWifi: false,
        isMultiSystem: false,
        isTpsActive: true,
        isOverhaulDue: false,
        isNarrowGauge: false,
        lastR2Expiry: true,
        nextRevision: true,
      },
    };
    return form(signal(defaults));
  }

  private createVehicleForm(): FieldTree<VehicleForm> {
    const vehicleService = inject(VehicleService);

    const defaults: VehicleForm = {
      id: null,
      vehicleId: '',
      classType: '',
      operator: '',
      tps: '',
      operatingHours: null,
      mileageKm: null,
      maxSpeedKmh: null,
    };

    return form(signal(defaults), vehicle => {
      required(vehicle.id);
      required(vehicle.vehicleId);
      required(vehicle.classType);
      required(vehicle.operatingHours);
      required(vehicle.mileageKm);
      required(vehicle.maxSpeedKmh);
      readonly(vehicle.id);
    }, {
      submission: {
        action: async form => {
          vehicleService.updateVehicle(form().value() as Vehicle);
          this.vehicleForm().reset(defaults);
          this._tabbar().activateTab('settings');
        },
      },
    });
  }

  protected onVehicleFormCancel(): void {
    this.vehicleForm.id().value.set(null);
    this._tabbar().activateTab('settings');
  }

  protected onUserSettingsReset(): void {
    localStorage.removeItem('scion.components.table:vehicles');
    sessionStorage.removeItem('scion.components.table:vehicles');
    void this._router.navigate(['/']).then(() => this._router.navigate(['/sci-table']));
  }

  protected onTableFilter(filter: string): void {
    this.table()!.filter(filter);
  }

  /**
   * Delegates focus to table filter when start typing on `sci-table`.
   */
  protected onTableKeydown(event: KeyboardEvent): void {
    this._tableFilterField().focusAndApplyKeyboardEvent(event);
  }

  protected updateSelectable(selectable: 'multi' | 'single' | 'false'): void {
    this.table()?.selectable.set(selectable === 'false' ? false : selectable);
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
  showGridlines: boolean;
  showZebraStriping: boolean;
  slowDatasource: boolean;
  groupByOperator: boolean;
  visibleColumns: {
    id: boolean;
    vehicleId: boolean;
    classType: boolean;
    operator: boolean;
    depot: boolean;
    status: boolean;
    tps: boolean;
    operatingHours: boolean;
    mileage: boolean;
    maxSpeed: boolean;
    serviceWeight: boolean;
    seatingCapacity: boolean;
    buildYear: boolean;
    isOperational: boolean;
    hasWifi: boolean;
    isMultiSystem: boolean;
    isTpsActive: boolean;
    isOverhaulDue: boolean;
    isNarrowGauge: boolean;
    lastR2Expiry: boolean;
    nextRevision: boolean;
  };
}

export interface VehicleForm {
  id: number | null;
  vehicleId: string;
  classType: string;
  operator: string;
  tps: string;
  operatingHours: number | null;
  mileageKm: number | null;
  maxSpeedKmh: number | null;
}
