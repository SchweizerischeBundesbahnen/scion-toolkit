/* eslint-disable @stylistic/operator-linebreak */

export interface Triebfahrzeug {
  fahrzeugId: string;
  typBaureihe: string;
  evuBetreiber: EVUType;
  depotInstandhaltung: string;
  status: FahrzeugStatus;
  zugsicherung: Zugsicherungssystem;
  betriebsstunden: number;
  kilometerstand: number;
  hoechstgeschwindigkeit: number;
  dienstgewichtTonnen: number;
  sitzplaetze: number;
  baujahr: number;
  istBetriebsbereit: boolean;
  hatWlan: boolean;
  istMehrsystemfaehig: boolean;
  zssAktiviert: boolean;
  hauptuntersuchungFaellig: boolean;
  istSchmalspur: boolean;
  letzteR2Frist: string;
  naechsteRevision: string;
}

export type EVUType =
  | 'SBB Fernverkehr'
  | 'SBB Cargo'
  | 'BLS'
  | 'BLS Cargo'
  | 'Rhätische Bahn (RhB)'
  | 'Schweizerische Südostbahn (SOB)'
  | string;

export type FahrzeugStatus =
  | 'Betriebsbereit'
  | 'Im Einsatz'
  | 'Instandhaltung'
  | 'Abgestellt'
  | 'Werkstatt';

export type Zugsicherungssystem =
  | 'ETCS Level 1'
  | 'ETCS Level 2'
  | 'ETCS Baseline 3'
  | 'ZUB'
  | 'INTEGRA-SIGNUM';
