/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableColumnFilter, SciTablePageRequest, SciTablePageResponse, SciTableSortCriterion, SciTableTreeNode, SciTableIdsRequest} from '@scion/components/table';
import {computed, Service, Signal, signal} from '@angular/core';
import {defer, Observable, timer} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {map, switchMap} from 'rxjs/operators';
import {httpResource} from '@angular/common/http';
import {isVehicle, OperatorGroup, Vehicle, VehicleOrOperator} from './vehicle.model';

@Service()
export class VehicleService {

  private readonly _datasource = httpResource<Vehicle[]>(() => '/sample-vehicles-10k.json', {
    parse: vehicles => (vehicles as Vehicle[]).map((vehicle, index) => ({...vehicle, id: index + 1})),
    defaultValue: [],
  });

  public readonly vehicleCount = signal(10_000);
  public readonly vehicles: Signal<Vehicle[]> = computed(() => this._datasource.value().slice(0, this.vehicleCount()));
  public readonly vehiclesByOperator = computed(() => Vehicles.groupByOperator(this.vehicles()));
  public readonly operators = computed<OperatorGroup[]>(() => [...this.vehiclesByOperator()].map(([operator, vehicles]) => ({
    operator,
    kind: 'operator',
    averageMaxSpeedKmh: Math.round(vehicles.reduce((sum, vehicle) => sum + vehicle.maxSpeedKmh, 0) / vehicles.length),
    children: vehicles,
  })));

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

  public getItems$(ids: unknown[]): Observable<Vehicle[]> {
    const items = computed(() => {
      const vehicles = this.vehicles();
      return ids
        .map(id => vehicles.find(vehicle => vehicle.id === id))
        .filter((vehicle): vehicle is Vehicle => !!vehicle);
    });

    const items$ = toObservable(items);
    return defer(() => timer(1000)).pipe(
      switchMap(() => items$),
    );
  }

  public getTreeItems$(parent: VehicleOrOperator | undefined, ids: unknown[]): Observable<VehicleOrOperator[]> {
    const items = computed(() => {
      const vehicles = this.vehicles();
      const operators = Vehicles.getOperators(Vehicles.groupByOperator(vehicles));

      return ids
        .map(id => String(id).startsWith('operator:') ?
          operators.find(operator => operator.operator === String(id).slice(9)) :
          vehicles.find(vehicle => vehicle.id === id))
        .filter((item): item is VehicleOrOperator => item !== undefined);
    });

    const items$ = toObservable(items);

    return defer(() => timer(1000)).pipe(
      switchMap(() => items$),
    );
  }

  // public getGroupedVehicles$(request: SciTableIdsRequest): Observable<SciTableTreeNode<unknown>[]> {
  //   return this.getFilteredAndSortedVehicles$(request)
  //     .pipe(
  //       map(vehicles => Vehicles.groupByOperator(vehicles)),
  //       map(byOperator => Vehicles.getOperators(byOperator)),
  //       map(operators => operators.reduce((nodes, item) => {
  //         const id = isVehicle(item) ? item.id : `operator:${item.operator}`;
  //         if (isVehicle(item)) {
  //           const parentId = `operator:${item.operator}`;
  //           const parentIndex = nodes.findIndex(operator => operator.item === parentId);
  //           const parent = nodes[parentIndex] ?? ({item: parentId, children: []});
  //           parent.children!.push({item: id});
  //           nodes.splice(parentIndex, 1, parent);
  //         }
  //         else {
  //           nodes.push({item: id});
  //         }
  //         return nodes;
  //       }, new Array<SciTableTreeNode<unknown>>())),
  //     );
  // }
  //
  // public getOperatorChildren$(item: OperatorGroup, request: SciTablePageRequest): Observable<SciTablePageResponse<Vehicle>> {
  //   const vehicles$ = toObservable(this.vehicles);
  //   return defer(() => timer(1000))
  //     .pipe(
  //       switchMap(() => vehicles$),
  //       map(vehicles => Vehicles.groupByOperator(vehicles).get(item.operator) ?? []),
  //       map(vehicles => Vehicles.filter(vehicles, request.columnFilters, request.tableFilter)),
  //       map(vehicles => Vehicles.sort(vehicles, request.sortCriteria)),
  //       map(vehicles => ({
  //         items: vehicles.slice(request.start, request.end),
  //         totalCount: vehicles.length,
  //       })),
  //     );
  // }

  public getVehicles$(request: SciTableIdsRequest): Observable<string[]> {
    return this.getFilteredAndSortedVehicles$(request)
      .pipe(
        map(vehicles => vehicles.map(v => v.id.toString())),
      );
  }

  private getFilteredAndSortedVehicles$(request: SciTableIdsRequest): Observable<Vehicle[]> {
    const vehicles$ = toObservable(this.vehicles);
    return defer(() => timer(1000))
      .pipe(
        switchMap(() => vehicles$),
        map(vehicles => Vehicles.filter(vehicles, request.columnFilters, request.tableFilter)),
        map(vehicles => Vehicles.sort(vehicles, request.sortCriteria)),
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

  export function groupByOperator(vehicles: Vehicle[]): Map<string, Vehicle[]> {
    return vehicles.reduce((byOperator, vehicle) => {
      const vehicles = byOperator.get(vehicle.operator) ?? [];
      vehicles.push(vehicle);
      return byOperator.set(vehicle.operator, vehicles);
    }, new Map<string, Vehicle[]>());
  }

  export function getOperators(byOperator: Map<string, Vehicle[]>): OperatorGroup[] {
    return [...byOperator].map(([operator, vehicles]) => ({
      operator,
      kind: 'operator',
      averageMaxSpeedKmh: Math.round(vehicles.reduce((sum, vehicle) => sum + vehicle.maxSpeedKmh, 0) / vehicles.length),
      children: vehicles,
    }));
  }
}
