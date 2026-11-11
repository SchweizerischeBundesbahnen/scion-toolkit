/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/* eslint-disable @stylistic/operator-linebreak */

export interface OperatorGroup {
  kind: 'operator';
  id: string;
  label: string;
  maxSpeedKmh: number;
  mileageKm: number;
  price: number;
  seatingCapacity: number;
  operatingHours: number;
  children: ClassTypeGroup[];
}

export interface ClassTypeGroup {
  kind: 'classType';
  id: string;
  label: string;
  maxSpeedKmh: number;
  mileageKm: number;
  price: number;
  seatingCapacity: number;
  operatingHours: number;
  children: DepotGroup[];
}

export interface DepotGroup {
  kind: 'depot';
  id: string;
  label: string;
  maxSpeedKmh: number;
  mileageKm: number;
  price: number;
  seatingCapacity: number;
  operatingHours: number;
  children: Vehicle[];
}

export interface Vehicle {
  kind: 'vehicle';
  id: string;
  label: string;
  vehicleId: string;
  classType: string;
  operator: OperatorType;
  depot: string;
  status: VehicleStatus;
  tps: ProtectionSystem;
  operatingHours: number;
  mileageKm: number;
  maxSpeedKmh: number;
  serviceWeightT: number;
  seatingCapacity: number;
  buildYear: number;
  hasWifi: boolean;
  isMultiSystem: boolean;
  isTpsActive: boolean;
  isOverhaulDue: boolean;
  isNarrowGauge: boolean;
  lastR2Expiry: string;
  nextRevision: string;
  price: number;
}

export type OperatorType =
  | 'SBB Passenger'
  | 'SBB Cargo'
  | 'BLS'
  | 'BLS Cargo'
  | 'Rhaetian Railway (RhB)'
  | 'Südostbahn (SOB)'
  | string;

export type VehicleStatus =
  | 'Ready for Service'
  | 'In Operation'
  | 'Maintenance'
  | 'Stabled';

export type ProtectionSystem =
  | 'ETCS Level 1'
  | 'ETCS Level 2'
  | 'ETCS Baseline 3'
  | 'ZUB'
  | 'INTEGRA-SIGNUM';

export type VehicleNode = Vehicle | OperatorGroup | ClassTypeGroup | DepotGroup;
