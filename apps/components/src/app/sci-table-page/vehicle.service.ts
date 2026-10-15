/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableIdsRequest, SciTableSortCriterion, SciTableTreeNode} from '@scion/components/table';
import {computed, Service, Signal, signal} from '@angular/core';
import {defer, Observable, tap, timer} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {map, switchMap} from 'rxjs/operators';
import {httpResource} from '@angular/common/http';
import {ClassTypeGroup, DepotGroup, OperatorGroup, Vehicle, VehicleNode} from './vehicle.model';
import {filterArray, mapArray} from '@scion/toolkit/operators';
import {SciTreeIdsRequest} from '@scion/components/tree';

@Service()
export class VehicleService {

  private readonly _datasource = httpResource<Vehicle[]>(() => '/sample-vehicles-10k.json', {
    parse: vehicles => (vehicles as Vehicle[]).map((vehicle, index) => ({...vehicle, kind: 'vehicle', id: `${index + 1}`, label: vehicle.vehicleId})),
    defaultValue: [],
  });

  public readonly vehicleCount = signal(10_000);
  public readonly vehicles: Signal<Vehicle[]> = computed(() => this._datasource.value().slice(0, this.vehicleCount()));
  public readonly operatorGroups = computed(() => createOperatorGroups(this.vehicles()));

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
      copy.push({...vehicle, id: `${vehicles.length + 1}`});
      return copy;
    });
  }

  public deleteVehicle(id: string): void {
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

  public getItems$(ids: string[]): Observable<Vehicle[]> {
    const items = computed(() => {
      const vehicles = this.vehicles();
      return ids
        .map(id => vehicles.find(vehicle => vehicle.id.toString() === id))
        .filter((vehicle): vehicle is Vehicle => !!vehicle);
    });

    const items$ = toObservable(items);
    return defer(() => timer(1000)).pipe(
      switchMap(() => items$),
    );
  }

  public getVehicleNodeIds$(request: SciTableIdsRequest | SciTreeIdsRequest): Observable<SciTableTreeNode<string>[]> {
    return this.getOperatorGroups$(request).pipe(
      map(operatorGroups => createVehicleNodes(operatorGroups)),
      mapArray(vehicleNode => ({item: vehicleNode.item.id, parent: vehicleNode.parent})),
      // map(vehicleNodes => {
      //   if ('filter' in request) {
      //     if (request.filter.includes('bls')) {
      //       return vehicleNodes.filter(vehicleNode => vehicleNode.item === 'BLS')
      //     }
      //   }
      //   return vehicleNodes;
      // }),
    );
  }

  public getVehicleNodes$(ids: string[]): Observable<VehicleNode[]> {
    console.log('>>> getVehicleNodes$', ids);
    const operatorGroups$ = toObservable(this.operatorGroups);
    return defer(() => timer(1000))
      .pipe(
        switchMap(() => operatorGroups$),
        map(operatorGroups => createVehicleNodes(operatorGroups)),
        filterArray(vehicleNode => ids.includes(vehicleNode.item.id)),
        mapArray(vehicleNode => vehicleNode.item),
      );
  }

  private getOperatorGroups$(request: SciTableIdsRequest | SciTreeIdsRequest): Observable<OperatorGroup[]> {
    const vehicles$ = toObservable(this.vehicles);
    return defer(() => timer(1000))
      .pipe(
        switchMap(() => vehicles$),
        tap(vehicles => console.log('>>> vehicles', vehicles)),
        map(vehicles => Vehicles.filter(vehicles, request)),
        tap(filteredVehicles => console.log('>>> filteredVehicles', filteredVehicles)),
        tap(() => console.log('>>> filter', request)),
        map(vehicles => Vehicles.sort(vehicles, 'sortCriteria' in request ? request.sortCriteria : [])),
        map(vehicles => createOperatorGroups(vehicles)),
        tap(operatorGroups => console.log('>>> operatorGroups', operatorGroups)),
      );
  }

  public getVehicleIds$(request: SciTableIdsRequest): Observable<string[]> {
    return this.getFilteredAndSortedVehicles$(request).pipe(mapArray(vehicle => vehicle.id));
  }

  private getFilteredAndSortedVehicles$(request: SciTableIdsRequest): Observable<Vehicle[]> {
    const vehicles$ = toObservable(this.vehicles);
    return defer(() => timer(1000))
      .pipe(
        switchMap(() => vehicles$),
        map(vehicles => Vehicles.filter(vehicles, request)),
        map(vehicles => Vehicles.sort(vehicles, 'sortCriteria' in request ? request.sortCriteria : [])),
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
              return a.id.localeCompare(b.id);
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
            case 'column:price':
              return a.price - b.price;
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

  export function filter(vehicles: Vehicle[], request: SciTableIdsRequest | SciTreeIdsRequest): Vehicle[] {
    let copy = [...vehicles];
    if ('columnFilters' in request) {
      for (const filterCriterion of request.columnFilters) {
        const filterText = `${filterCriterion.text}`.toLowerCase();
        copy = copy.filter(vehicle => {
          switch (filterCriterion.columnName) {
            case 'column:id':
              return vehicle.id.toString().toLowerCase().includes(filterText);
            case 'column:vehicleId':
              return vehicle.vehicleId.toLowerCase().includes(filterText);
            case 'column:classType':
              return vehicle.classType.toLowerCase().includes(filterText);
            case 'column:operator':
              return vehicle.operator.toLowerCase().includes(filterText);
            case 'column:depot':
              return vehicle.depot.toLowerCase().includes(filterText);
            case 'column:status':
              return vehicle.status.toLowerCase().includes(filterText);
            case 'column:tps':
              return vehicle.tps.toLowerCase().includes(filterText);
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
              return vehicle.lastR2Expiry.toLowerCase().includes(filterText);
            case 'column:nextRevision':
              return vehicle.nextRevision.toLowerCase().includes(filterText);
            case 'column:price':
              return vehicle.price.toString().includes(filterText);
            default:
              return true;
          }
        });
      }

      if (request.tableFilter) {
        copy = copy.filter(vehicle => Object.values(vehicle).some(value => `${value}`.toLowerCase().includes(request.tableFilter!.toLowerCase())));
      }
    }
    else {
      if (request.filter) {
        const filterTexts = request.filter.map(filter => filter.toLowerCase());
        copy = copy.filter(vehicle => filterTexts.every(filter => vehicle.label.toLowerCase().includes(filter)));
      }
    }
    return copy;
  }
}

function createOperatorGroups(vehicles: Vehicle[]): OperatorGroup[] {
  const operators = new Map<string, Map<string, Map<string, Vehicle[]>>>();

  for (const vehicle of vehicles) {
    let classTypes = operators.get(vehicle.operator);
    if (!classTypes) {
      classTypes = new Map();
      operators.set(vehicle.operator, classTypes);
    }

    let depots = classTypes.get(vehicle.classType);
    if (!depots) {
      depots = new Map();
      classTypes.set(vehicle.classType, depots);
    }

    let vehiclesAtDepot = depots.get(vehicle.depot);
    if (!vehiclesAtDepot) {
      vehiclesAtDepot = [];
      depots.set(vehicle.depot, vehiclesAtDepot);
    }

    vehiclesAtDepot.push(vehicle);
  }

  return [...operators].sort(([a], [b]) => a.localeCompare(b)).map(([operator, classes]): OperatorGroup => {
    const vehicles = [...classes.values()].flatMap(depots => [...depots.values()].flat());
    return ({
      kind: 'operator',
      id: operator,
      label: operator,
      maxSpeedKmh: avg(vehicles, vehicle => vehicle.maxSpeedKmh),
      mileageKm: sum(vehicles, vehicle => vehicle.mileageKm),
      price: sum(vehicles, vehicle => vehicle.price),
      seatingCapacity: sum(vehicles, vehicle => vehicle.seatingCapacity),
      operatingHours: sum(vehicles, vehicle => vehicle.operatingHours),
      children: [...classes].sort(([a], [b]) => a.localeCompare(b)).map(([classType, depots]): ClassTypeGroup => {
        const vehicles = [...depots.values()].flat();
        return ({
          kind: 'classType',
          id: `${operator}-${classType}`,
          label: classType,
          maxSpeedKmh: avg(vehicles, vehicle => vehicle.maxSpeedKmh),
          mileageKm: sum(vehicles, vehicle => vehicle.mileageKm),
          price: sum(vehicles, vehicle => vehicle.price),
          seatingCapacity: sum(vehicles, vehicle => vehicle.seatingCapacity),
          operatingHours: sum(vehicles, vehicle => vehicle.operatingHours),
          children: [...depots].sort(([a], [b]) => a.localeCompare(b)).map(([depot, vehicles]): DepotGroup => ({
            kind: 'depot',
            id: `${operator}-${classType}-${depot}`,
            label: depot,
            maxSpeedKmh: avg(vehicles, vehicle => vehicle.maxSpeedKmh),
            mileageKm: sum(vehicles, vehicle => vehicle.mileageKm),
            price: sum(vehicles, vehicle => vehicle.price),
            seatingCapacity: sum(vehicles, vehicle => vehicle.seatingCapacity),
            operatingHours: sum(vehicles, vehicle => vehicle.operatingHours),
            children: vehicles.sort((a, b) => a.vehicleId.localeCompare(b.vehicleId)),
          })),
        });
      }),
    });
  });
}

function createVehicleNodes(operatorGroups: OperatorGroup[]): SciTableTreeNode<VehicleNode, string>[] {
  const nodes: SciTableTreeNode<VehicleNode, string>[] = [];

  for (const operator of operatorGroups) {
    nodes.push({item: operator});

    for (const classType of operator.children) {
      nodes.push({item: classType, parent: operator.id});

      for (const depot of classType.children) {
        nodes.push({item: depot, parent: classType.id});

        for (const vehicle of depot.children) {
          nodes.push({item: vehicle, parent: depot.id});
        }
      }
    }
  }
  return nodes;
}

function avg(vehicles: Vehicle[], property: (vehicle: Vehicle) => number): number {
  return Math.round(vehicles.reduce((sum, vehicle) => sum + property(vehicle), 0) / vehicles.length)
}

function sum(vehicles: Vehicle[], property: (vehicle: Vehicle) => number): number {
  return vehicles.reduce((sum, vehicle) => sum + property(vehicle), 0);
}
