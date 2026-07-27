import { Component } from '@angular/core';
import {TableFilterComponent} from '../table-filter/table-filter.component';

@Component({
  selector: 'sci-table-header',
  imports: [
    TableFilterComponent,
  ],
  templateUrl: './table-header.component.html',
  styleUrl: './table-header.component.scss',
})
export class TableHeaderComponent {

}
