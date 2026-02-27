import {Routes} from '@angular/router';
import SciTablePageComponent from './sci-table-page.component';

export default [
  {path: '', component: SciTablePageComponent},
  {path: ':type', component: SciTablePageComponent},
] satisfies Routes;
