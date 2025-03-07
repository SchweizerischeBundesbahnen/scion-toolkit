import {Component, DestroyRef, ElementRef, inject, InjectionToken, input} from '@angular/core';
import {fromResize$} from '@scion/toolkit/observable';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

export const CONTENT = new InjectionToken<string>('CONTENT');
export const LABEL = new InjectionToken<string>('LABEL');

@Component({
  selector: 'app-sash-content',
  templateUrl: './sash-content.component.html',
  styleUrl: './sash-content.component.scss',
})
export class SashContentComponent {

  /**
   * Specifies the content to display, falling back to {@link CONTENT} DI token if not specified.
   */
  public readonly content = input<string | undefined>(inject(CONTENT, {optional: true}) ?? undefined);

  /**
   * Specifies the label to use in log messages, falling back to {@link LABEL} DI token if not specified.
   */
  public readonly label = input<string | undefined>(inject(LABEL, {optional: true}) ?? undefined);

  constructor() {
    this.installSizeLogger();
    this.installDestroyLogger();
  }

  private installSizeLogger(): void {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    fromResize$(host)
      .pipe(takeUntilDestroyed())
      .subscribe(() => console.log(`[SashContentComponent][${this.label()}] resize to ${host.clientWidth}`));
  }

  private installDestroyLogger(): void {
    inject(DestroyRef).onDestroy(() => console.log(`[SashContentComponent][${this.label()}] destroy`));
  }
}
