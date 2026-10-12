/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, effect, ElementRef, inject, Injector, linkedSignal, runInInjectionContext, Signal, signal, untracked, viewChild} from '@angular/core';
import {provideAsyncTableDatasource, provideAsyncTableTreeDatasource, provideTableTreeDatasource, SciTable, SciTableComponent, SciTableDatasourceFactory, table, ɵillegaldatasource} from '@scion/components/table';
import {FormsModule} from '@angular/forms';
import {FieldTree, form, FormField, FormRoot, readonly, required} from '@angular/forms/signals';
import {createDestroyableInjector, SCI_LOCALE} from '@scion/components/common';
import {contributeMenu, SciToolbarFactory} from '@scion/components/menu';
import {FieldValidationDirective} from '../common/field-validation.directive';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {MinMaxDirective} from '../common/min-max.directive';
import {Router} from '@angular/router';
import {SciViewportComponent} from '@scion/components/viewport';
import {VehicleService} from './vehicle.service';
import {Vehicle, VehicleNode} from './vehicle.model';
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {createDesignTokenForm, DesignTokenForm, DesignTokenFormComponent} from '../styles/design-token-form.component';
import {BreakpointObserver} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrl: './sci-table-page.component.scss',
  imports: [
    SciTableComponent,
    FormsModule,
    FormField,
    FormRoot,
    FieldValidationDirective,
    SciTabDirective,
    SciTabbarComponent,
    MinMaxDirective,
    SciViewportComponent,
    SciFilterFieldComponent,
    DesignTokenFormComponent,
  ],
})
export default class SciTablePageComponent {

  private readonly _injector = inject(Injector);
  private readonly _tabbar = viewChild.required(SciTabbarComponent);
  private readonly _tableFilterField = viewChild.required(SciFilterFieldComponent);
  private readonly _router = inject(Router);
  private readonly _tableElement: Signal<ElementRef<HTMLElement> | undefined> = viewChild(SciTableComponent, {read: ElementRef});
  private readonly _isMobile = toSignal(inject(BreakpointObserver).observe('(max-width: 700px)').pipe(map(breakpoint => breakpoint.matches)));
  private readonly _vehicleService = inject(VehicleService);

  protected readonly settingsForm: FieldTree<SettingsForm> = this.createSettingsForm();
  protected readonly designTokenForm: FieldTree<DesignTokenForm> = this.createDesignTokenForm();
  protected readonly methodsForm: FieldTree<MethodsForm> = this.createMethodsForm();
  protected readonly vehicleForm: FieldTree<VehicleForm> = this.createVehicleForm();

  protected readonly table = this.computeTable();
  protected readonly rowCount = inject(VehicleService).vehicleCount;
  protected readonly selectable = computed(() => {
    const selectable = this.table()?.selectable();
    return selectable === false ? 'false' : selectable;
  });
  protected readonly selection = computed(() => this.table()?.selectedItems().sort((a, b) => a.localeCompare(b)).join(' '));
  protected readonly activeVehicleId = computed(() => {
    const item = this.table()?.activeItem();
    return item?.startsWith('operator') ? undefined : item;
  });
  protected readonly panelOpen = linkedSignal(() => !this._isMobile());
  protected readonly locale = inject(SCI_LOCALE);
  protected readonly host = inject(ElementRef).nativeElement as HTMLElement;

  constructor() {
    this.contributeMainToolbarMenu();
  }

  private createTable(options: {slowDatasource: boolean; hierarchical: boolean}): SciTable<string> {
    const vehicleService = inject(VehicleService);
    const vehicleForm = this.vehicleForm;
    const tabbar = this._tabbar;
    const panelOpen = this.panelOpen;

    return table<VehicleNode, string>({
      ɵdatasource: this.getDataSource(options),
      datasource: ɵillegaldatasource(),
      rowBindings: (bindings, vehicle, index) => {
        if (this.settingsForm.showZebraStriping().value()) {
          bindings.addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd');
        }
        if (vehicle.kind !== 'vehicle') {
          bindings.addPartBinding('row:average');
        }
      },
      trackBy: (item): string => item.id,
      rowActions: (toolbar, item) => item.kind === 'vehicle' && addRowActions(toolbar, item),
      columns: table => {
        const visibleColumns = this.settingsForm.visibleColumns().value();

        options.hierarchical && table.addStringColumn({
          name: 'column:vehicle',
          header: 'Vehicle',
          value: item => item.label,
        });

        (visibleColumns.id && !options.hierarchical) && table.addStringColumn({
          name: 'column:id',
          header: 'ID',
          value: item => item.kind === 'vehicle' ? item.id : undefined,
          width: '100px',
        });

        (visibleColumns.id && !options.hierarchical) && table.addStringColumn({
          name: 'column:vehicleId',
          header: 'Vehicle ID',
          value: item => item.kind === 'vehicle' ? item.vehicleId : '',
        });
        visibleColumns.classType && table.addStringColumn({
          name: 'column:classType',
          header: 'Class / Series',
          value: item => item.kind === 'vehicle' ? item.classType : '',
        });
        (visibleColumns.operator && !options.hierarchical) && table.addStringColumn({
          name: 'column:operator',
          header: 'RU / Operator',
          value: item => item.kind === 'vehicle' ? item.operator : undefined,
        });
        visibleColumns.depot && table.addStringColumn({
          name: 'column:depot',
          header: 'Depot / Maintenance',
          value: item => item.kind === 'vehicle' ? item.depot : '',
        });
        visibleColumns.status && table.addEnumColumn({
          name: 'column:status',
          header: 'Status',
          value: item => item.kind === 'vehicle' ? item.status : '',
          width: '175px',
          values: [
            {value: 'Ready for Service', icon: 'check_circle', label: 'Ready for Service'},
            {value: 'In Operation', icon: 'play_circle', label: 'In Operation'},
            {value: 'Maintenance', icon: 'engineering', label: 'Maintenance'},
            {value: 'Stabled', icon: 'pause_circle', label: 'Stabled'},
          ],
          format: {icon: true, label: true, filter: {icon: true}},
        });
        visibleColumns.tps && table.addStringColumn({
          name: 'column:tps',
          header: 'Train Protection',
          value: item => item.kind === 'vehicle' ? item.tps : '',
          width: '150px',
        });
        visibleColumns.operatingHours && table.addNumberColumn({
          name: 'column:operatingHours',
          header: 'Operating Hours',
          value: vehicle => vehicle.operatingHours,
          format: {style: 'unit', unit: 'hour'},
          width: '175px',
        });
        visibleColumns.mileage && table.addNumberColumn({
          name: 'column:mileage',
          header: 'Mileage',
          value: item => item.mileageKm,
          format: {style: 'unit', unit: 'kilometer'},
          width: '150px',
        });
        visibleColumns.maxSpeed && table.addNumberColumn({
          name: 'column:maxSpeed',
          header: 'Max Speed',
          value: item => item.maxSpeedKmh,
          format: {style: 'unit', unit: 'kilometer-per-hour'},
          width: '175px',
        });
        visibleColumns.serviceWeight && table.addNumberColumn({
          name: 'column:serviceWeight',
          header: 'Service Weight',
          value: item => item.kind === 'vehicle' ? item.serviceWeightT * 1000 : undefined,
          format: {style: 'unit', unit: 'kilogram'},
          width: '175px',
        });
        visibleColumns.seatingCapacity && table.addNumberColumn({
          name: 'column:seatingCapacity',
          header: 'Seats',
          value: vehicle => vehicle.seatingCapacity,
          width: '100px',
        });
        visibleColumns.price && table.addNumberColumn({
          name: 'column:price',
          header: 'Price',
          value: vehicle => vehicle.price,
          format: {style: 'currency', maximumFractionDigits: 0},
          width: '150px',
        });
        visibleColumns.buildYear && table.addNumberColumn({
          name: 'column:buildYear',
          header: 'Year Built',
          value: item => item.kind === 'vehicle' ? item.buildYear : undefined,
          format: {useGrouping: false},
          width: '125px',
        });
        visibleColumns.isOperational && table.addBooleanColumn({
          name: 'column:isOperational',
          header: 'Operational',
          value: item => item.kind === 'vehicle' ? item.status === 'In Operation' : undefined,
          width: '120px',
        });
        visibleColumns.hasWifi && table.addBooleanColumn({
          name: 'column:hasWifi',
          header: 'Wi-Fi',
          value: item => item.kind === 'vehicle' ? item.hasWifi : undefined,
          width: '100px',
        });
        visibleColumns.isMultiSystem && table.addBooleanColumn({
          name: 'column:isMultiSystem',
          header: 'Multi-System',
          value: item => item.kind === 'vehicle' ? item.isMultiSystem : undefined,
          width: '150px',
        });
        visibleColumns.isTpsActive && table.addBooleanColumn({
          name: 'column:isTpsActive',
          header: 'TPS Active',
          value: item => item.kind === 'vehicle' ? item.isTpsActive : undefined,
          width: '110px',
        });
        visibleColumns.isOverhaulDue && table.addBooleanColumn({
          name: 'column:isOverhaulDue',
          header: 'Overhaul Due',
          value: item => item.kind === 'vehicle' ? item.isOverhaulDue : undefined,
          width: '120px',
        });
        visibleColumns.isNarrowGauge && table.addBooleanColumn({
          name: 'column:isNarrowGauge',
          header: 'Narrow Gauge',
          value: item => item.kind === 'vehicle' ? item.isNarrowGauge : undefined,
          width: '150px',
        });
        visibleColumns.lastR2Expiry && table.addDateColumn({
          name: 'column:lastR2Expiry',
          header: 'Last R2 Expiry',
          value: item => item.kind === 'vehicle' ? item.lastR2Expiry : undefined,
          width: '150px',
        });
        visibleColumns.nextRevision && table.addDateColumn({
          name: 'column:nextRevision',
          header: 'Next Revision',
          value: item => item.kind === 'vehicle' ? item.nextRevision : undefined,
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
            requestAnimationFrame(() => {
              tabbar().activateTab('vehicle-editor');
              panelOpen.set(true);
            });
          },
        })
        .addToolbarButton({icon: 'scion.duplicate', tooltip: 'Duplicate', onSelect: () => vehicleService.addVehicle(vehicle)})
        .addToolbarButton({icon: 'scion.delete', tooltip: 'Delete', onSelect: () => vehicleService.deleteVehicle(vehicle.id)})
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

  private computeTable(): Signal<SciTable<string> | undefined> {
    const table = signal<SciTable<string> | undefined>(undefined);

    effect(onCleanup => {
      const slowDatasource = this.settingsForm.slowDatasource().value();
      const hierarchical = this.settingsForm.hierarchical().value();

      untracked(() => {
        const injector = createDestroyableInjector({parent: this._injector});
        onCleanup(() => injector.destroy());
        table.set(runInInjectionContext(injector, () => this.createTable({slowDatasource, hierarchical})));
      });
    });

    return table;
  }

  private getDataSource(options: {slowDatasource: boolean; hierarchical: boolean}): Signal<VehicleNode[]> | SciTableDatasourceFactory<VehicleNode, string> {
    if (options.hierarchical) {
      if (options.slowDatasource) {
        return provideAsyncTableTreeDatasource<VehicleNode, string>(
          request => this._vehicleService.getVehicleNodeIds$(request),
          ids => this._vehicleService.getVehicleNodes$(ids));
      }

      return provideTableTreeDatasource<VehicleNode, string>(this._vehicleService.operatorGroups, item => item.kind === 'vehicle' ? [] : item.children);
    }

    if (options.slowDatasource) {
      return provideAsyncTableDatasource<Vehicle, string>(request => this._vehicleService.getVehicleIds$(request), ids => this._vehicleService.getItems$(ids));
    }

    return this._vehicleService.vehicles;
  }

  private createSettingsForm(): FieldTree<SettingsForm> {
    return form(signal({
      showGridlines: false,
      showZebraStriping: false,
      slowDatasource: false,
      hierarchical: true,
      visibleColumns: {
        id: true,
        vehicleId: true,
        classType: true,
        operator: true,
        depot: false,
        status: false,
        tps: false,
        operatingHours: false,
        mileage: true,
        maxSpeed: true,
        serviceWeight: false,
        seatingCapacity: false,
        buildYear: true,
        isOperational: true,
        hasWifi: false,
        isMultiSystem: false,
        isTpsActive: true,
        isOverhaulDue: false,
        isNarrowGauge: false,
        lastR2Expiry: true,
        nextRevision: true,
        price: true,
      },
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
    ], this._tableElement, {designTokenRootElement: host});

    // Set/Unset gridline color based on 'Show Gridlines' setting.
    effect(() => {
      const tableElement = this._tableElement()?.nativeElement;
      if (!tableElement) {
        return;
      }

      form().value();

      const showGridlines = this.settingsForm.showGridlines().value();
      const gridlineColor = form['--sci-table-gridline-color']!().value();
      tableElement.style.setProperty('--sci-table-gridline-color', showGridlines ? gridlineColor : 'transparent');
    });

    return form;
  }

  private createMethodsForm(): FieldTree<MethodsForm> {
    return form(signal<MethodsForm>({
      selectId: '',
    }));
  }

  private createVehicleForm(): FieldTree<VehicleForm> {
    const vehicleService = inject(VehicleService);

    const defaults: VehicleForm = {
      id: '',
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
          if (this._isMobile()) {
            this.panelOpen.set(false);
          }
        },
      },
    });
  }

  protected onVehicleFormCancel(): void {
    this.vehicleForm.id().value.set('');
    this._tabbar().activateTab('settings');
    if (this._isMobile()) {
      this.panelOpen.set(false);
    }
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
    this.table()!.selectable.set(selectable === 'false' ? false : selectable);
  }

  private contributeMainToolbarMenu(): void {
    contributeMenu('toolbar:main', toolbar => toolbar
      .addToolbarButton({visible: this.panelOpen(), icon: 'right_panel_close', tooltip: 'Hide side panel', onSelect: () => this.panelOpen.set(false)})
      .addToolbarButton({visible: computed(() => !this.panelOpen()), icon: 'right_panel_open', tooltip: 'Show side panel', onSelect: () => this.panelOpen.set(true)}),
    );
  }

  protected onSelect(): void {
    this.table()?.select(this.methodsForm.selectId().value().split(' '));
    this.methodsForm.selectId().reset('');
  }

  protected onExpandAll(): void {
    this.table()?.expandAll();
  }

  protected onCollapseAll(): void {
    this.table()?.collapseAll();
  }
}

interface SettingsForm {
  showGridlines: boolean;
  showZebraStriping: boolean;
  slowDatasource: boolean;
  hierarchical: boolean;
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
    price: boolean;
  };
}

interface MethodsForm {
  selectId: string;
}

export interface VehicleForm {
  id: string;
  vehicleId: string;
  classType: string;
  operator: string;
  tps: string;
  operatingHours: number | null;
  mileageKm: number | null;
  maxSpeedKmh: number | null;
}
