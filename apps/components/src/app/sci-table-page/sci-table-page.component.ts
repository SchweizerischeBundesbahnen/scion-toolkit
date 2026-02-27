/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, signal} from '@angular/core';
import {SciTableComponent} from '@scion/components/table';
import {table} from '../../../../../projects/scion/components/table/src/table.component';

@Component({
  selector: 'app-table-page',
  templateUrl: './sci-table-page.component.html',
  styleUrls: ['./sci-table-page.component.scss'],
  imports: [
    SciTableComponent,
  ],
})
export default class SciTablePageComponent {
  protected data = signal([
    {
      name: 'Magglingen, Alte Sporthalle',
      sloid: 'ch:1:sloid:94279',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Langenthal Industrie Nord',
      sloid: 'ch:1:sloid:94258',
      districtname: 'Oberaargau',
    },
    {
      name: 'Hasliberg Wasserwendi, Bidmi',
      sloid: 'ch:1:sloid:94467',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Grindelwald, Schwendi',
      sloid: 'ch:1:sloid:94494',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Burglauenen, Bahnhof',
      sloid: 'ch:1:sloid:94492',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Rubigen, Mühle Hunziken',
      sloid: 'ch:1:sloid:94470',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Thun, Arena Thun',
      sloid: 'ch:1:sloid:94535',
      districtname: 'Thun',
    },
    {
      name: 'Lenk, Schadauli',
      sloid: 'ch:1:sloid:94852',
      districtname: 'Obersimmental-Saanen',
    },
    {
      name: 'Adelboden, Hotel Alpina',
      sloid: 'ch:1:sloid:94931',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Burgdorf, Staldenstrasse',
      sloid: 'ch:1:sloid:94774',
      districtname: 'Emmental',
    },
    {
      name: 'Boltigen, Garstatt',
      sloid: 'ch:1:sloid:94784',
      districtname: 'Obersimmental-Saanen',
    },
    {
      name: 'Zweisimmen, Forellensee',
      sloid: 'ch:1:sloid:94788',
      districtname: 'Obersimmental-Saanen',
    },
    {
      name: 'Ringoldingen, Dorf',
      sloid: 'ch:1:sloid:95094',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Erlenbach i.S., Marktplatz',
      sloid: 'ch:1:sloid:95092',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Lenk, Flüehlistrasse',
      sloid: 'ch:1:sloid:94976',
      districtname: 'Obersimmental-Saanen',
    },
    {
      name: 'Heimberg, Haslikehr',
      sloid: 'ch:1:sloid:94985',
      districtname: 'Thun',
    },
    {
      name: 'Lyss, KUFA',
      sloid: 'ch:1:sloid:95201',
      districtname: 'Seeland',
    },
    {
      name: 'Lenk, Rufeli',
      sloid: 'ch:1:sloid:95624',
      districtname: 'Obersimmental-Saanen',
    },
    {
      name: 'Wangelen, Wendeplatz',
      sloid: 'ch:1:sloid:95480',
      districtname: 'Thun',
    },
    {
      name: 'Hünibach, Riedstrasse',
      sloid: 'ch:1:sloid:95479',
      districtname: 'Thun',
    },
    {
      name: 'Villeret, ETA',
      sloid: 'ch:1:sloid:95504',
      districtname: 'Jura bernois',
    },
    {
      name: 'Heimberg, Dornhalde',
      sloid: 'ch:1:sloid:95560',
      districtname: 'Thun',
    },
    {
      name: 'Port, Bellevue',
      sloid: 'ch:1:sloid:95964',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Uttigen, Bahnhof',
      sloid: 'ch:1:sloid:96124',
      districtname: 'Thun',
    },
    {
      name: 'Langnau i.E., Sonnenarena',
      sloid: 'ch:1:sloid:95989',
      districtname: 'Emmental',
    },
    {
      name: 'Biel/Bienne, Grenchenstrasse',
      sloid: 'ch:1:sloid:95995',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Zollbrück, Sekundarschulhaus',
      sloid: 'ch:1:sloid:96087',
      districtname: 'Emmental',
    },
    {
      name: 'Rüderswil, Dorf',
      sloid: 'ch:1:sloid:96085',
      districtname: 'Emmental',
    },
    {
      name: 'Bern Europaplatz Nord',
      sloid: 'ch:1:sloid:10020',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Biel/Bienne, Anna-Haller-Platz',
      sloid: 'ch:1:sloid:93316',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Leissigen',
      sloid: 'ch:1:sloid:7495',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Herrenschwanden, Halenbrücke',
      sloid: 'ch:1:sloid:71360',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Meikirch, Abzw. Weissenstein',
      sloid: 'ch:1:sloid:80004',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Meikirch, Abzw. Aetzikofen',
      sloid: 'ch:1:sloid:71376',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Gümmenen, Trüllern',
      sloid: 'ch:1:sloid:71450',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Oberbütschel, Bernstrasse',
      sloid: 'ch:1:sloid:7738',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Englisberg, Kühlewil',
      sloid: 'ch:1:sloid:71399',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Belp, Bützacker',
      sloid: 'ch:1:sloid:88703',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Belp, Käsereistrasse',
      sloid: 'ch:1:sloid:88265',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Belp, Schützen',
      sloid: 'ch:1:sloid:88267',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Belp, Zelgweg',
      sloid: 'ch:1:sloid:88275',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Bern Flughafen',
      sloid: 'ch:1:sloid:87776',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Belp, Eissel',
      sloid: 'ch:1:sloid:90124',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Rubigen, Thunstrasse Süd',
      sloid: 'ch:1:sloid:88905',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Münsingen, Schwand',
      sloid: 'ch:1:sloid:88258',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Münsingen, Trimsteinstrasse',
      sloid: 'ch:1:sloid:2907',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Münsingen, Bächlen',
      sloid: 'ch:1:sloid:3334',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Konolfingen,Brunnhaldenstrasse',
      sloid: 'ch:1:sloid:89265',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Bern, Bachmätteli',
      sloid: 'ch:1:sloid:71436',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Bern, Oberbottigen Flühli',
      sloid: 'ch:1:sloid:71440',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Hünibach, Flurweg',
      sloid: 'ch:1:sloid:96025',
      districtname: 'Thun',
    },
    {
      name: 'Hilterfingen, Breitenweg',
      sloid: 'ch:1:sloid:96030',
      districtname: 'Thun',
    },
    {
      name: 'Bern Riedbach',
      sloid: 'ch:1:sloid:4488',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Niederönz, Gemeindehaus',
      sloid: 'ch:1:sloid:479',
      districtname: 'Oberaargau',
    },
    {
      name: 'Schattenhalb, P+R Aareschlucht',
      sloid: 'ch:1:sloid:11838',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Wangenried, Unterdorf',
      sloid: 'ch:1:sloid:76901',
      districtname: 'Oberaargau',
    },
    {
      name: 'Zwieselberg, Hani',
      sloid: 'ch:1:sloid:88503',
      districtname: 'Thun',
    },
    {
      name: 'Bärau, Bahnübergang',
      sloid: 'ch:1:sloid:76666',
      districtname: 'Emmental',
    },
    {
      name: 'Evilard, place du village',
      sloid: 'ch:1:sloid:94272',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Ferenbalm, Dorf',
      sloid: 'ch:1:sloid:2159',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Blankenburg, Dorf',
      sloid: 'ch:1:sloid:11919',
      districtname: 'Obersimmental-Saanen',
    },
    {
      name: 'Oberburg, Gemeindeverwaltung',
      sloid: 'ch:1:sloid:87820',
      districtname: 'Emmental',
    },
    {
      name: 'Brienz West, Bahnhof/Hauptstr.',
      sloid: 'ch:1:sloid:5158',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Biel/Bienne, Eglise française',
      sloid: 'ch:1:sloid:93329',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Steffisburg, Zulgstrasse',
      sloid: 'ch:1:sloid:11966',
      districtname: 'Thun',
    },
    {
      name: 'Gümligen, Seidenberg (Bus)',
      sloid: 'ch:1:sloid:11852',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Schwarzenburg, Bahnhof',
      sloid: 'ch:1:sloid:77860',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Langenthaltunnel NBS',
      sloid: 'ch:1:sloid:18736',
      districtname: 'Oberaargau',
    },
    {
      name: 'Leissigen, Schulhaus',
      sloid: 'ch:1:sloid:88967',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Evilard, Bas du Village',
      sloid: 'ch:1:sloid:9242',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Diessbach bei Büren, Dorf',
      sloid: 'ch:1:sloid:8874',
      districtname: 'Seeland',
    },
    {
      name: 'Poudeille',
      sloid: 'ch:1:sloid:19654',
      districtname: 'Jura bernois',
    },
    {
      name: 'Leissigen, West',
      sloid: 'ch:1:sloid:12053',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Neuenegg',
      sloid: 'ch:1:sloid:4192',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Laupen Ost (Ausw)',
      sloid: 'ch:1:sloid:9308',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Schernelz, Perretes',
      sloid: 'ch:1:sloid:12140',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Bern, Bethlehem Kirche',
      sloid: 'ch:1:sloid:71344',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Bern Brünnen Westside, Bahnhof',
      sloid: 'ch:1:sloid:82262',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Bern, Untermattweg',
      sloid: 'ch:1:sloid:82210',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Ligerz, Schernelz',
      sloid: 'ch:1:sloid:12174',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Biel/Bienne Serviceanlage',
      sloid: 'ch:1:sloid:12178',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Wilderswil, Ufem Sand',
      sloid: 'ch:1:sloid:7896',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Thun GB',
      sloid: 'ch:1:sloid:15628',
      districtname: 'Thun',
    },
    {
      name: 'Hasliberg Reuti, Dorf',
      sloid: 'ch:1:sloid:8778',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Lengnau BE, Rado',
      sloid: 'ch:1:sloid:77949',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Carrosserie Spiez',
      sloid: 'ch:1:sloid:12514',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Calag Carrosserie AG',
      sloid: 'ch:1:sloid:12533',
      districtname: 'Oberaargau',
    },
    {
      name: 'Unterseen, Stedtlizentrum',
      sloid: 'ch:1:sloid:80533',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Uetendorf Allmend, Bahnhof',
      sloid: 'ch:1:sloid:9485',
      districtname: 'Thun',
    },
    {
      name: 'Aespli',
      sloid: 'ch:1:sloid:15299',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Biel/Bienne Aebistrasse',
      sloid: 'ch:1:sloid:15304',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Interlaken Ost [Gleis 3-4]',
      sloid: 'ch:1:sloid:15183',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Bickigen (B)',
      sloid: 'ch:1:sloid:15532',
      districtname: 'Emmental',
    },
    {
      name: 'Lyss Nord',
      sloid: 'ch:1:sloid:15343',
      districtname: 'Seeland',
    },
    {
      name: 'Unterhard BE',
      sloid: 'ch:1:sloid:15368',
      districtname: 'Emmental',
    },
    {
      name: 'Biel Mett (Abzw)',
      sloid: 'ch:1:sloid:15757',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Wengi-Ey (Abzw)',
      sloid: 'ch:1:sloid:15666',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Mitholz (Spw)',
      sloid: 'ch:1:sloid:15668',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Lyss Fulenmatt',
      sloid: 'ch:1:sloid:16186',
      districtname: 'Seeland',
    },
    {
      name: 'Wynau Aegertentunnel Ost',
      sloid: 'ch:1:sloid:16853',
      districtname: 'Oberaargau',
    },
    {
      name: 'Grubi (Spw)',
      sloid: 'ch:1:sloid:16854',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Rohr (Grindelwald)',
      sloid: 'ch:1:sloid:16930',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Burgdorf Unterwerk',
      sloid: 'ch:1:sloid:16975',
      districtname: 'Emmental',
    },
    {
      name: 'Bern Wylerfeld Unterwerk',
      sloid: 'ch:1:sloid:17250',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Wiedlisbach Gürbu',
      sloid: 'ch:1:sloid:16977',
      districtname: 'Oberaargau',
    },
    {
      name: 'Winklen (Spw)',
      sloid: 'ch:1:sloid:16987',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Wynigen Nord',
      sloid: 'ch:1:sloid:17268',
      districtname: 'Emmental',
    },
    {
      name: 'Rüdlen (Km-Sprung)',
      sloid: 'ch:1:sloid:17373',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Frutigen West BZ Alptransit',
      sloid: 'ch:1:sloid:17508',
      districtname: 'Frutigen-Niedersimmental',
    },
    {
      name: 'Zweisimmen Gleisende',
      sloid: 'ch:1:sloid:17510',
      districtname: 'Obersimmental-Saanen',
    },
    {
      name: 'Biel/Bienne Stellwerk',
      sloid: 'ch:1:sloid:18027',
      districtname: 'Biel/Bienne',
    },
    {
      name: 'Schwarzenburg Gleisende',
      sloid: 'ch:1:sloid:18392',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Tunnel de Pierre-Pertuis Nord',
      sloid: 'ch:1:sloid:18387',
      districtname: 'Jura bernois',
    },
    {
      name: 'Mühleberg Kraftwerk',
      sloid: 'ch:1:sloid:18579',
      districtname: 'Bern-Mittelland',
    },
    {
      name: 'Huttwil Fiechten (Agl)',
      sloid: 'ch:1:sloid:18650',
      districtname: 'Oberaargau',
    },
    {
      name: 'Brienz BE, Chilchgasse',
      sloid: 'ch:1:sloid:57129',
      districtname: 'Interlaken-Oberhasli',
    },
    {
      name: 'Innertkirchen,Abzw. Riglisflie',
      sloid: 'ch:1:sloid:70532',
      districtname: 'Interlaken-Oberhasli',
    }]);

  protected table = table(this.data, table => table
    .addStringColumn(station => station.sloid)
    .addStringColumn(station => station.name)
    .addStringColumn(station => station.districtname));
}
