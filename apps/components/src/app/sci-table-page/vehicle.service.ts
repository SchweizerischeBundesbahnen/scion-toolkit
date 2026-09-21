/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableColumnFilter, SciTablePageRequest, SciTablePageResponse, SciTableSortCriterion} from '@scion/components/table';
import {computed, Service, Signal, signal} from '@angular/core';
import {defer, Observable, of, timer} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {map, switchMap} from 'rxjs/operators';
import {httpResource} from '@angular/common/http';
import {Vehicle} from './vehicle.model';

@Service()
export class VehicleService {

  private readonly _datasource = httpResource<Vehicle[]>(() => '/sample-vehicles-10k.json', {
    parse: vehicles => (vehicles as Vehicle[]).map((vehicle, index) => ({...vehicle, id: index + 1})),
    defaultValue: [],
  });

  public readonly vehicleCount = signal(10_000);
  public readonly vehicles: Signal<Vehicle[]> = computed(() => this._datasource.value().slice(0, this.vehicleCount()));

  public updateVehicle(vehicle: Vehicle): void {
    this._datasource.update(vehicles => {
      const index = vehicles.findIndex(it => it.id === vehicle.id);
      if (index === -1) {
        return vehicles;
      }

      const copy = [...vehicles];
      copy.splice(index, 1, vehicle);
      return copy;
    });
  }

  public addVehicle(vehicle: Vehicle): void {
    this._datasource.update(vehicles => {
      const copy = [...vehicles];
      copy.push({...vehicle, id: vehicles.length + 1});
      return copy;
    });
  }

  public deleteVehicle(id: number): void {
    this._datasource.update(vehicles => {
      const index = vehicles.findIndex(vehicle => vehicle.id === id);
      if (index === -1) {
        return vehicles;
      }
      const copy = [...vehicles];
      copy.splice(index, 1);
      return copy;
    });
  }

  public getVehicles$(request: SciTablePageRequest, options?: {slowDatasource?: boolean}): Observable<SciTablePageResponse<Vehicle>> {
    const vehicles$ = toObservable(this.vehicles);
    return defer(() => options?.slowDatasource ? timer(1000) : of(undefined))
      .pipe(
        switchMap(() => vehicles$),
        map(vehicles => Vehicles.filter(vehicles, request.columnFilters, request.tableFilter)),
        map(vehicles => Vehicles.sort(vehicles, request.sortCriteria)),
        map(vehicles => ({
          items: vehicles.slice(request.start, request.end),
          totalCount: vehicles.length,
        })),
      );
  }
}

export namespace Vehicles {

  export function sort(vehicles: Vehicle[], sortCriteria: SciTableSortCriterion[]): Vehicle[] {
    return [...vehicles].sort((a, b) => {
      for (const sortCriterion of sortCriteria) {
        const ascendingComparison = (() => {
          switch (sortCriterion.columnName) {
            case 'column:id':
              return a.id - b.id;
            case 'column:vehicleId':
              return a.vehicleId.localeCompare(b.vehicleId);
            case 'column:classType':
              return a.classType.localeCompare(b.classType);
            case 'column:operator':
              return a.operator.localeCompare(b.operator);
            case 'column:depot':
              return a.depot.localeCompare(b.depot);
            case 'column:status':
              return a.status.localeCompare(b.status);
            case 'column:tps':
              return a.tps.localeCompare(b.tps);
            case 'column:operatingHours':
              return a.operatingHours - b.operatingHours;
            case 'column:mileage':
              return a.mileageKm - b.mileageKm;
            case 'column:maxSpeed':
              return a.maxSpeedKmh - b.maxSpeedKmh;
            case 'column:serviceWeight':
              return a.serviceWeightT - b.serviceWeightT;
            case 'column:seatingCapacity':
              return a.seatingCapacity - b.seatingCapacity;
            case 'column:buildYear':
              return a.buildYear - b.buildYear;
            case 'column:isOperational':
              return Number(a.status === 'In Operation') - Number(b.status === 'In Operation');
            case 'column:hasWifi':
              return Number(a.hasWifi) - Number(b.hasWifi);
            case 'column:isMultiSystem':
              return Number(a.isMultiSystem) - Number(b.isMultiSystem);
            case 'column:isTpsActive':
              return Number(a.isTpsActive) - Number(b.isTpsActive);
            case 'column:isOverhaulDue':
              return Number(a.isOverhaulDue) - Number(b.isOverhaulDue);
            case 'column:isNarrowGauge':
              return Number(a.isNarrowGauge) - Number(b.isNarrowGauge);
            case 'column:lastR2Expiry':
              return new Date(a.lastR2Expiry).getTime() - new Date(b.lastR2Expiry).getTime();
            case 'column:nextRevision':
              return new Date(a.nextRevision).getTime() - new Date(b.nextRevision).getTime();
            default:
              return 0;
          }
        })();

        if (ascendingComparison !== 0) {
          return sortCriterion.direction === 'desc' ? -ascendingComparison : ascendingComparison;
        }
      }

      return 0;
    });
  }

  export function filter(vehicles: Vehicle[], filterCriteria: SciTableColumnFilter[], tableFilter?: string): Vehicle[] {
    let copy = [...vehicles];
    for (const filterCriterion of filterCriteria) {
      const filterText = `${filterCriterion.text}`.toLocaleLowerCase();
      copy = copy.filter(vehicle => {
        switch (filterCriterion.columnName) {
          case 'column:id':
            return vehicle.id.toString().toLocaleLowerCase().includes(filterText);
          case 'column:vehicleId':
            return vehicle.vehicleId.toLocaleLowerCase().includes(filterText);
          case 'column:classType':
            return vehicle.classType.toLocaleLowerCase().includes(filterText);
          case 'column:operator':
            return vehicle.operator.toLocaleLowerCase().includes(filterText);
          case 'column:depot':
            return vehicle.depot.toLocaleLowerCase().includes(filterText);
          case 'column:status':
            return vehicle.status.toLocaleLowerCase().includes(filterText);
          case 'column:tps':
            return vehicle.tps.toLocaleLowerCase().includes(filterText);
          case 'column:operatingHours':
            return vehicle.operatingHours.toString().includes(filterText);
          case 'column:mileage':
            return vehicle.mileageKm.toString().includes(filterText);
          case 'column:maxSpeed':
            return vehicle.maxSpeedKmh.toString().includes(filterText);
          case 'column:serviceWeight':
            return vehicle.serviceWeightT.toString().includes(filterText);
          case 'column:seatingCapacity':
            return vehicle.seatingCapacity.toString().includes(filterText);
          case 'column:buildYear':
            return vehicle.buildYear.toString().includes(filterText);
          case 'column:isOperational':
            return filterCriterion.text === (vehicle.status === 'In Operation');
          case 'column:hasWifi':
            return filterCriterion.text === vehicle.hasWifi;
          case 'column:isMultiSystem':
            return filterCriterion.text === vehicle.isMultiSystem;
          case 'column:isTpsActive':
            return filterCriterion.text === vehicle.isTpsActive;
          case 'column:isOverhaulDue':
            return filterCriterion.text === vehicle.isOverhaulDue;
          case 'column:isNarrowGauge':
            return filterCriterion.text === vehicle.isNarrowGauge;
          case 'column:lastR2Expiry':
            return vehicle.lastR2Expiry.toLocaleLowerCase().includes(filterText);
          case 'column:nextRevision':
            return vehicle.nextRevision.toLocaleLowerCase().includes(filterText);
          default:
            return true;
        }
      });
    }

    if (tableFilter) {
      copy = copy.filter(vehicle => {
        return Object.values(vehicle).some(value => `${value}`.toLocaleLowerCase().includes(tableFilter.toLocaleLowerCase()));
      });
    }

    return copy;
  }
}
