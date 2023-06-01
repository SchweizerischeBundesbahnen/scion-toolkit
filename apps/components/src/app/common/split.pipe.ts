import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'appSplit', standalone: true})
export class SplitPipe implements PipeTransform {

  public transform(value: string | undefined | null, separator: string): string[] {
    return value ? value.split(new RegExp(separator)) : [];
  }
}
