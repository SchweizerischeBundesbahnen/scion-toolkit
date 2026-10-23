import {Component} from '@angular/core';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {SciScrollbarComponent} from '@scion/components/viewport';

@Component({
  selector: 'app-testee',
  styleUrl: './testee.component.scss',
  templateUrl: './testee.component.html',
  imports: [
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    SciScrollbarComponent,
  ],
})
export class TesteeComponent {

  protected items = Array.from({length: 100_000}, (_, i) => `${i + 1}`);
}
