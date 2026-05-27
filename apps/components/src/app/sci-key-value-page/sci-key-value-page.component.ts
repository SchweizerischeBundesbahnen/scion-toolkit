/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {SciKeyValueComponent} from '@scion/components.internal/key-value';

@Component({
  selector: 'sci-key-value-page',
  templateUrl: './sci-key-value-page.component.html',
  styleUrls: ['./sci-key-value-page.component.scss'],
  imports: [SciKeyValueComponent],
})
export default class SciKeyValuePageComponent {

  protected readonly dictionary = {
    firstname: 'Clarke',
    lastname: 'Noden',
    address: {
      street: '37 Anhalt Street',
      city: 'Columbus - Ohio',
    },
    email: 'cnodene@blogspot.com',
    phone: '839-291-9187',
    profession: 'Budget/Accounting Analyst II',
  };

  protected readonly map = new Map<string, any>()
    .set('firstname', 'Clarke')
    .set('lastname', 'Noden')
    .set('address', new Map<string, string>()
      .set('street', '37 Anhalt Street')
      .set('city', 'Columbus - Ohio'),
    )
    .set('email', 'cnodene@blogspot.com')
    .set('phone', '839-291-9187')
    .set('profession', 'Budget/Accounting Analyst II');
}
