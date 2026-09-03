import {Component, computed, signal} from '@angular/core';
import {partBinding, SciTable, SciTableComponent, table} from '@scion/components/table';
import {contributeMenu, SciToolbarFactory} from '@scion/components/menu';
import {httpResource} from '@angular/common/http';
import {Triebfahrzeug} from './triebfahrzeug.model';
import {noop} from 'rxjs';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-triebfahrzeug-table',
  templateUrl: './triebfahrzeug-table.component.html',
  styleUrl: './triebfahrzeug-table.component.scss',
  imports: [
    SciTableComponent,
    DecimalPipe,
  ],
})
export default class TriebfahrzeugTableComponent {

  private filterable = signal(false);
  private sortable = signal(true);
  private resizable = signal(true);
  private showHeader = signal(true);
  private showGridlines = signal(false);
  private zebraStyle = signal(false);
  private selectable = signal<'single' | 'multi' | false>('multi');

  public table = this.defineTriebfahrzeugTable();

  constructor() {
    this.contributeSettingsMenu();
  }

  private defineTriebfahrzeugTable(): SciTable<Triebfahrzeug> {
    return table({
      data: httpResource<Triebfahrzeug[]>(() => '/schweiz_triebfahrzeuge_10k.json', {defaultValue: []}).value,
      filterable: this.filterable,
      sortable: this.sortable,
      headerVisible: this.showHeader,
      gridlinesVisible: this.showGridlines,
      resizable: this.resizable,
      selectable: this.selectable,
      rowBindings: [
        partBinding((_item, index) => this.zebraStyle() ? (index % 2 === 0 ? 'row:even' : 'row:odd') : undefined),
      ],
      rowActions: (fahrzeug, toolbar) => {
        this.addRowActions(fahrzeug, toolbar);
      },
    }, table => table
      .addStringColumn('Fahrzeug ID', fahrzeug => fahrzeug.fahrzeugId)
      .addStringColumn('Baureihe / Typ', fahrzeug => fahrzeug.typBaureihe)
      .addStringColumn('EVU/Betreiber', fahrzeug => fahrzeug.evuBetreiber)
      .addStringColumn('Depot / Instandhaltung', fahrzeug => fahrzeug.depotInstandhaltung)
      .addStringColumn('Status', fahrzeug => fahrzeug.status)
      .addStringColumn('Zugsicherung', fahrzeug => fahrzeug.zugsicherung)
      .addNumberColumn('Betriebsstunden (h)', fahrzeug => fahrzeug.betriebsstunden)
      .addNumberColumn('Kilometerstand (km)', fahrzeug => fahrzeug.kilometerstand)
      .addNumberColumn('Höchstgeschwindigkeit (km/h)', fahrzeug => fahrzeug.hoechstgeschwindigkeit)
      .addNumberColumn('Dienstgewicht (t)', fahrzeug => fahrzeug.dienstgewichtTonnen)
      .addNumberColumn('Sitzplätze', fahrzeug => fahrzeug.sitzplaetze)
      .addNumberColumn('Baujahr', fahrzeug => fahrzeug.baujahr)
      .addBooleanColumn('Betriebsbereit', fahrzeug => fahrzeug.istBetriebsbereit)
      .addBooleanColumn('WLAN vorhanden', fahrzeug => fahrzeug.hatWlan)
      .addBooleanColumn('Mehrsystemfähig', fahrzeug => fahrzeug.istMehrsystemfaehig)
      .addBooleanColumn('ZSS aktiv', fahrzeug => fahrzeug.zssAktiviert)
      .addBooleanColumn('Hauptuntersuchung fällig', fahrzeug => fahrzeug.hauptuntersuchungFaellig)
      .addBooleanColumn('Schmalspur', fahrzeug => fahrzeug.istSchmalspur)
      .addStringColumn('Letzte R2 / Frist', fahrzeug => fahrzeug.letzteR2Frist)
      .addStringColumn('Nächste Revision', fahrzeug => fahrzeug.naechsteRevision));
  }

  private contributeSettingsMenu(): void {
    contributeMenu('menu:toolbar.main', toolbar => toolbar
      .addGroup(group => group
        .addMenuItem({label: 'Filterable', checked: this.filterable, onSelect: () => this.filterable.update(enabled => !enabled)})
        .addMenuItem({label: 'Sortable', checked: this.sortable, onSelect: () => this.sortable.update(enabled => !enabled)})
        .addMenuItem({label: 'Resizable', checked: this.resizable, onSelect: () => this.resizable.update(enabled => !enabled)}),
      )
      .addGroup(group => group
        .addMenuItem({label: 'Show Header', checked: this.showHeader, onSelect: () => this.showHeader.update(enabled => !enabled)})
        .addMenuItem({label: 'Show Gridlines', checked: this.showGridlines, onSelect: () => this.showGridlines.update(enabled => !enabled)})
        .addMenuItem({label: 'Zebra Style', checked: this.zebraStyle, onSelect: () => this.zebraStyle.update(enabled => !enabled)})
        .addGroup(group => group
          .addMenu({icon: 'checklist', label: 'Selection'}, menu => menu
            .addMenuItem({label: 'Single', checked: computed(() => this.selectable() === 'single'), onSelect: () => close(() => this.selectable.set('single'))})
            .addMenuItem({label: 'Multi', checked: computed(() => this.selectable() === 'multi'), onSelect: () => close(() => this.selectable.set('multi'))})
            .addMenuItem({label: 'None', checked: computed(() => this.selectable() === false), onSelect: () => close(() => this.selectable.set(false))}),
          ),
        ),
      ),
    );
  }

  private addRowActions(_fahrzeug: Triebfahrzeug, toolbar: SciToolbarFactory): void {
    toolbar
      .addToolbarButton({icon: 'visibility', tooltip: 'Details anzeigen', onSelect: noop})
      .addToolbarButton({icon: 'edit', tooltip: 'Bearbeiten', onSelect: noop})
      .addToolbarButton({icon: 'build', tooltip: 'Wartung planen', onSelect: noop})
      .addToolbarMenu({icon: 'more_vert', tooltip: 'Weitere Aktionen', visualMenuIndicator: false}, menu => menu
        .addMenu({icon: 'alt_route', label: 'Status ändern'}, menu => menu
          .addMenuItem({icon: 'check_circle', label: 'Betriebsbereit', onSelect: noop})
          .addMenuItem({icon: 'directions_train', label: 'Im Einsatz', onSelect: noop})
          .addMenuItem({icon: 'engineering', label: 'Instandhaltung', onSelect: noop})
          .addMenuItem({icon: 'pause_circle', label: 'Abgestellt', onSelect: noop}),
        )
        .addMenuItem({icon: 'location_on', label: 'Depot umbauen', onSelect: noop})
        .addMenu({icon: 'analytics', label: 'Berichte & Historie'}, menu => menu
          .addMenuItem({icon: 'history', label: 'Revisionshistorie', onSelect: noop})
          .addMenuItem({icon: 'speed', label: 'Telemetrie & Kilometerstand', onSelect: noop})
          .addMenuItem({icon: 'assignment_late', label: 'Störungsmeldungen (ETCS/ZSS)', onSelect: noop}),
        )
        .addMenu({icon: 'content_copy', label: 'Kopieren & Export'}, menu => menu
          .addMenuItem({icon: 'content_copy', label: 'Fahrzeug-ID kopieren', onSelect: noop})
          .addMenuItem({icon: 'code', label: 'Als JSON kopieren', onSelect: noop})
          .addMenuItem({icon: 'picture_as_pdf', label: 'Stammdatenblatt (PDF)', onSelect: noop}),
        )
        .addMenuItem({icon: 'delete', label: 'Fahrzeug ausmustern', onSelect: noop}),
      );
  }
}

function close(fn: () => void): true {
  fn();
  return true;
}
