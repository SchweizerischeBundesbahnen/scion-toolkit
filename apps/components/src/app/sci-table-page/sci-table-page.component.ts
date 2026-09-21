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
import {SciTable, SciTableComponent, table, ɵillegaldatasource} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, readonly, required} from '@angular/forms/signals';
import {DatePipe} from '@angular/common';
import {createDestroyableInjector} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {FieldValidationDirective} from '../common/field-validation.directive';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {MinMaxDirective} from '../common/min-max.directive';
import {Router} from '@angular/router';
import {SciViewportComponent} from '@scion/components/viewport';
import {VehicleService} from './vehicle.service';
import {Vehicle} from './vehicle.model';

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
  ],
  host: {
    '[style.--sci-table-gridline-color]': 'settingsForm.showGridlines().value() ? "var(--sci-color-border)" : null',
  },
})
export default class SciTablePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _tabbar = viewChild.required(SciTabbarComponent);
  private readonly _router = inject(Router);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly vehicleForm: FieldTree<VehicleForm> = this.createVehicleForm();

  protected readonly table = this.computeTable();
  protected readonly rowCount = inject(VehicleService).vehicleCount;
  protected readonly selectable = computed(() => {
    const selectable = this.table()?.selectable();
    return selectable === false ? 'false' : selectable;
  });
  protected readonly selection = computed(() => this.table()?.selectedItems().map(item => item.id).sort((a, b) => a - b).join(' '));

  private createTable(options: {slowDatasource: boolean}): SciTable<Vehicle> {
    const vehicleService = inject(VehicleService);
    const vehicleForm = this.vehicleForm;
    const tabbar = this._tabbar;

    return table({
      ɵdatasource: options.slowDatasource ? request => inject(VehicleService).getVehicles$(request, {slowDatasource: true}) : inject(VehicleService).vehicles,
      datasource: ɵillegaldatasource(),
      rowBindings: (bindings, _vehicle, index) => {
        if (this.settingsForm.showZebraStriping().value()) {
          bindings.addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd');
        }
      },
      trackBy: vehicle => vehicle.id,
      rowActions: (toolbar, vehicle) => addRowActions(toolbar, vehicle),
      columns: table => {
        const visibleColumns = this.settingsForm.visibleColumns().value();

        visibleColumns.id && table.addNumberColumn({
          name: 'column:id',
          header: 'ID',
          value: vehicle => vehicle.id,
          width: '100px',
        });

        visibleColumns.vehicleId && table.addStringColumn({
          name: 'column:vehicleId',
          header: 'Vehicle ID',
          value: vehicle => vehicle.vehicleId,
        });
        visibleColumns.classType && table.addStringColumn({
          name: 'column:classType',
          header: 'Class / Series',
          value: vehicle => vehicle.classType,
        });
        visibleColumns.operator && table.addStringColumn({
          name: 'column:operator',
          header: 'RU / Operator',
          value: vehicle => vehicle.operator,
        });
        visibleColumns.depot && table.addStringColumn({
          name: 'column:depot',
          header: 'Depot / Maintenance',
          value: vehicle => vehicle.depot,
        });
        visibleColumns.status && table.addStringColumn({
          name: 'column:status',
          header: 'Status',
          value: vehicle => vehicle.status,
          width: '150px',
        });
        visibleColumns.tps && table.addStringColumn({
          name: 'column:tps',
          header: 'Train Protection',
          value: vehicle => vehicle.tps,
          width: '150px',
        });
        visibleColumns.operatingHours && table.addNumberColumn({
          name: 'column:operatingHours',
          header: 'Operating Hours (h)',
          value: vehicle => vehicle.operatingHours,
          width: '175px',
        });
        visibleColumns.mileage && table.addNumberColumn({
          name: 'column:mileage',
          header: 'Mileage (km)',
          value: vehicle => vehicle.mileageKm,
          width: '150px',
        });
        visibleColumns.maxSpeed && table.addNumberColumn({
          name: 'column:maxSpeed',
          header: 'Max Speed (km/h)',
          value: vehicle => vehicle.maxSpeedKmh,
          width: '175px',
        });
        visibleColumns.serviceWeight && table.addNumberColumn({
          name: 'column:serviceWeight',
          header: 'Service Weight (t)',
          value: vehicle => vehicle.serviceWeightT,
          width: '175px',
        });
        visibleColumns.seatingCapacity && table.addNumberColumn({
          name: 'column:seatingCapacity',
          header: 'Seats',
          value: vehicle => vehicle.seatingCapacity,
          width: '100px',
        });
        visibleColumns.buildYear && table.addNumberColumn({
          name: 'column:buildYear',
          header: 'Year Built',
          value: vehicle => vehicle.buildYear,
          width: '125px',
        });
        visibleColumns.isOperational && table.addBooleanColumn({
          name: 'column:isOperational',
          header: 'Operational',
          value: vehicle => vehicle.status === 'In Operation',
          width: '120px',
        });
        visibleColumns.hasWifi && table.addBooleanColumn({
          name: 'column:hasWifi',
          header: 'Wi-Fi',
          value: vehicle => vehicle.hasWifi,
          width: '100px',
        });
        visibleColumns.isMultiSystem && table.addBooleanColumn({
          name: 'column:isMultiSystem',
          header: 'Multi-System',
          value: vehicle => vehicle.isMultiSystem,
          width: '150px',
        });
        visibleColumns.isTpsActive && table.addBooleanColumn({
          name: 'column:isTpsActive',
          header: 'TPS Active',
          value: vehicle => vehicle.isTpsActive,
          width: '110px',
        });
        visibleColumns.isOverhaulDue && table.addBooleanColumn({
          name: 'column:isOverhaulDue',
          header: 'Overhaul Due',
          value: vehicle => vehicle.isOverhaulDue,
          width: '120px',
        });
        visibleColumns.isNarrowGauge && table.addBooleanColumn({
          name: 'column:isNarrowGauge',
          header: 'Narrow Gauge',
          value: vehicle => vehicle.isNarrowGauge,
          width: '150px',
        });
        visibleColumns.lastR2Expiry && table.addComponentColumn({
          name: 'column:lastR2Expiry',
          header: 'Last R2 Expiry',
          sortable: untracked(() => this.settingsForm.slowDatasource().value()) ? true : {comparator: (a, b) => new Date(a.item.lastR2Expiry).getTime() - new Date(b.item.lastR2Expiry).getTime()},
          filterable: untracked(() => this.settingsForm.slowDatasource().value()) ? true : {matcher: (filterText, item) => item.item.lastR2Expiry.includes(filterText)},
          component: (vehicle: Vehicle) => ({
            component: DateCellComponent,
            bindings: [inputBinding('date', () => new Date(vehicle.lastR2Expiry))],
          }),
          width: '150px',
        });
        visibleColumns.nextRevision && table.addComponentColumn({
          name: 'column:nextRevision',
          header: 'Next Revision',
          sortable: untracked(() => this.settingsForm.slowDatasource().value()) ? true : {comparator: (a, b) => new Date(a.item.nextRevision).getTime() - new Date(b.item.nextRevision).getTime()},
          filterable: untracked(() => this.settingsForm.slowDatasource().value()) ? true : {matcher: (filterText, item) => item.item.nextRevision.includes(filterText)},
          component: (vehicle: Vehicle) => ({
            component: DateCellComponent,
            bindings: [inputBinding('date', () => new Date(vehicle.nextRevision))],
          }),
          width: '150px',
        });
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

  private computeTable(): Signal<SciTable<Vehicle> | undefined> {
    const table = signal<SciTable<Vehicle> | undefined>(undefined);

    effect(onCleanup => {
      const slowDatasource = this.settingsForm.slowDatasource().value();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        table.set(runInInjectionContext(injector, () => this.createTable({slowDatasource: slowDatasource})));
      });
    });

    return table;
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    const defaults: SettingsForm = {
      showGridlines: false,
      showZebraStriping: false,
      slowDatasource: false,
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
