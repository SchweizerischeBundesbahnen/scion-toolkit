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

export interface Vehicle {
  id: number;
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
