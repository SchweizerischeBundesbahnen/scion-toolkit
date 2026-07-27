import {Component, effect, inject, signal} from '@angular/core';
import {SciIconComponent} from '@scion/components/icon';
import {form} from '@angular/forms/signals';
import {FormsModule} from '@angular/forms';
import {ɵSCI_TABLE} from '../ɵtable.model';

@Component({
  selector: 'sci-table-filter',
  imports: [
    SciIconComponent,
    FormsModule,
  ],
  templateUrl: './table-filter.component.html',
  styleUrl: './table-filter.component.scss',
})
export class TableFilterComponent {
  private readonly _table = inject(ɵSCI_TABLE);

  protected readonly filter = signal<string>('');

  constructor() {
    effect(() => {
      this._table().filter(this.filter());
    });
  }

  protected reset(): void {
    this.filter.set('');
  }
}
