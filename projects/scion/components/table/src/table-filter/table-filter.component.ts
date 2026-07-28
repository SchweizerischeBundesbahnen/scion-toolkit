import {Component, inject} from '@angular/core';
import {SciIconComponent} from '@scion/components/icon';
import {FormsModule} from '@angular/forms';
import {UUID} from '@scion/toolkit/uuid';
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
  protected readonly table = inject(ɵSCI_TABLE);

  protected readonly id = `table-filter-${UUID.randomUUID().substring(0, 8)}`;

  protected reset(): void {
    this.table().filter('');
  }

  protected onChange(filter: string): void {
    this.table().filter(filter);
  }
}
