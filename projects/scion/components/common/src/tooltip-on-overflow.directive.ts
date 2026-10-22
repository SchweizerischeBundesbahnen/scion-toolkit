import {computed, Directive, ElementRef, inject, InjectionToken, input, Signal, signal} from '@angular/core';
import {coerceSignal, MaybeSignal} from '@scion/components/common';
import {coerceElement} from '@angular/cdk/coercion';

/**
 * Displays element text content as a tooltip when the text overflows.
 *
 * Uses the host element text content by default. The content source can be customized
 * via {@link sourceElement} input or {@link TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT} DI token.
 *
 * Supports appending additional tooltip text that is always displayed regardless of overflow status.
 *
 * If used as a host directive, configure via the following DI tokens:
 * - {@link TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT} and
 * - {@link TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT}.
 */
@Directive({
  selector: '[sciTooltipOnOverflow]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '[attr.title]': 'tooltip()',
  },
})
export class SciTooltipOnOverflowDirective {

  /**
   * Specifies the element from which to read text content for displaying as tooltip. Defaults to the host element.
   *
   * If used as a host directive, configure an alternative source using {@link TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT} DI token.
   */
  public readonly sourceElement = input<Element | ElementRef<Element>>(inject(ElementRef), {alias: 'sciTooltipOnOverflowSourceElement'});

  /**
   * Specifies additional text appended to the tooltip.
   *
   * This text is always displayed, regardless of whether text overflows.
   *
   * If used as a host directive, specify additional text via {@link TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT} DI token.
   */
  public readonly additionalText = input<string>(undefined, {alias: 'sciTooltipOnOverflowAdditionalText'});

  private readonly _sourceElement = this.computeSourceElement();
  private readonly _additionalText = this.computeAdditionalText();
  private readonly _hasOverflow = signal(false);

  protected readonly tooltip = this.computeTooltip();

  protected onMouseEnter(): void {
    const sourceElement = this._sourceElement();
    if (sourceElement) {
      this._hasOverflow.set(sourceElement.scrollWidth > sourceElement.clientWidth || sourceElement.scrollHeight > sourceElement.clientHeight);
    }
  }

  protected onMouseLeave(): void {
    this._hasOverflow.set(false);
  }

  private computeSourceElement(): Signal<Element | undefined> {
    const sourceElement = coerceSignal(inject(TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT, {optional: true}) ?? this.sourceElement);
    return computed(() => coerceElement(sourceElement()));
  }

  private computeAdditionalText(): Signal<string | undefined> {
    return coerceSignal(inject(TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT, {optional: true}) ?? this.additionalText);
  }

  private computeTooltip(): Signal<string | undefined> {
    return computed(() => {
      const tooltip = new Array<string>();
      const sourceElement = this._sourceElement();

      if (sourceElement && this._hasOverflow()) {
        tooltip.push(sourceElement instanceof HTMLInputElement ? sourceElement.value : sourceElement.textContent.trim());
      }

      if (this._additionalText()?.length) {
        tooltip.push(this._additionalText()!);
      }

      return tooltip.join('\n\n').trim() || undefined;
    });
  }
}

/**
 * Specifies the element from which to read text content for displaying as tooltip. Defaults to the host element.
 *
 * Use this token to configure {@link SciTooltipOnOverflowDirective} if used as a host directive. Equivalent to {@link SciTooltipOnOverflowDirective.sourceElement}.
 */
export const TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT = new InjectionToken<MaybeSignal<Element | ElementRef<Element>>>('TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT');

/**
 * Specifies additional text appended to the tooltip.
 *
 * Use this token to configure {@link SciTooltipOnOverflowDirective} if used as a host directive. Equivalent to {@link SciTooltipOnOverflowDirective.additionalText}.
 */
export const TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT = new InjectionToken<MaybeSignal<string | undefined>>('TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT');
