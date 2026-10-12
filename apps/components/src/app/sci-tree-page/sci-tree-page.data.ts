/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

export interface FileNode {
  id: string;
  name: string;
  children?: FileNode[];
}

export const fileExtensionIcons = new Map<string, string>([
  ['bib', 'menu_book'],
  ['css', 'code'],
  ['csv', 'table_chart'],
  ['dmg', 'install_desktop'],
  ['docx', 'description'],
  ['exe', 'install_desktop'],
  ['fig', 'design_services'],
  ['gz', 'folder_zip'],
  ['html', 'code'],
  ['ico', 'image'],
  ['jpg', 'image'],
  ['m3u', 'queue_music'],
  ['md', 'description'],
  ['mp3', 'audio_file'],
  ['mp4', 'video_file'],
  ['pdf', 'picture_as_pdf'],
  ['png', 'image'],
  ['pptx', 'slideshow'],
  ['svg', 'image'],
  ['txt', 'article'],
  ['wav', 'audio_file'],
  ['xlsx', 'table_chart'],
  ['zip', 'folder_zip'],
]);

export const files: FileNode[] = createFileNodes([
  {
    name: 'Documents', children: [
      {
        name: 'Projects', children: [
          {
            name: 'Website', children: [
              {name: 'assets', children: ['logo.svg', 'banner.png', 'favicon.ico']},
              {name: 'designs', children: ['homepage.fig', 'mobile-layout.fig', 'style-guide.pdf']},
              'index.html', 'styles.css', 'README.md',
            ],
          },
          {
            name: 'Mobile-App', children: [
              {name: 'wireframes', children: ['login.png', 'dashboard.png', 'settings.png']},
              {name: 'releases', children: ['release-notes-1.0.md', 'release-notes-1.1.md']},
              'requirements.pdf', 'project-plan.xlsx', 'README.md',
            ],
          },
          {name: 'Research', children: ['interviews.docx', 'survey-results.csv', 'findings.pdf', 'references.bib']},
          'roadmap.pdf',
        ],
      },
      {
        name: 'Reports', children: [
          {name: '2024', children: ['annual-report.pdf', 'budget.xlsx', 'summary.docx']},
          {name: '2025', children: ['annual-report.pdf', 'budget.xlsx', 'summary.docx']},
          {
            name: '2026', children: [
              {name: 'Q1', children: ['sales.pdf', 'expenses.xlsx', 'review.pptx']},
              {name: 'Q2', children: ['sales.pdf', 'expenses.xlsx', 'review.pptx']},
              {name: 'Q3', children: ['sales.pdf', 'expenses.xlsx', 'review.pptx']},
              {name: 'Q4', children: []},
              'forecast.xlsx',
            ],
          },
        ],
      },
      {
        name: 'Personal', children: [
          {name: 'Travel', children: ['itinerary.pdf', 'packing-list.txt', 'hotel-booking.pdf', 'train-tickets.pdf']},
          {name: 'Finance', children: ['household-budget.xlsx', 'insurance.pdf', 'tax-return.pdf']},
          {name: 'Certificates', children: ['diploma.pdf', 'language-certificate.pdf', 'first-aid.pdf']},
          'resume.pdf', 'cover-letter.docx',
        ],
      },
      {name: 'Templates', children: ['letter.docx', 'invoice.xlsx', 'presentation.pptx', 'meeting-notes.md']},
      'notes.txt', 'todo.md',
    ],
  },
  {
    name: 'Pictures', children: [
      {
        name: 'Holidays', children: [
          {
            name: 'Switzerland', children: [
              {name: 'Zermatt', children: ['matterhorn.jpg', 'village.jpg', 'hiking-trail.jpg']},
              {name: 'Lucerne', children: ['chapel-bridge.jpg', 'lake.jpg', 'old-town.jpg']},
              'mountains.jpg', 'panorama.jpg',
            ],
          },
          {name: 'Italy', children: ['rome.jpg', 'venice.jpg', 'florence.jpg', 'coast.jpg']},
          {name: 'Norway', children: ['fjord.jpg', 'northern-lights.jpg', 'cabin.jpg', 'waterfall.jpg']},
        ],
      },
      {
        name: 'Family', children: [
          {name: 'Birthdays', children: ['cake.jpg', 'candles.jpg', 'group-photo.jpg']},
          {name: 'Reunion', children: ['picnic.jpg', 'portraits.jpg', 'garden.jpg']},
          'family-photo.jpg',
        ],
      },
      {name: 'Wallpapers', children: ['forest.jpg', 'ocean.jpg', 'sunset.jpg', 'city.jpg', 'abstract.png']},
      {name: 'Screenshots', children: ['desktop.png', 'dashboard.png', 'map.png', 'receipt.png']},
      {name: 'Unsorted', children: []},
      'profile.png',
    ],
  },
  {
    name: 'Music', children: [
      {
        name: 'Albums', children: [
          {name: 'Morning-Light', children: ['01-awakening.mp3', '02-first-light.mp3', '03-new-day.mp3', '04-open-road.mp3', 'cover.jpg']},
          {name: 'City-Nights', children: ['01-downtown.mp3', '02-neon-lights.mp3', '03-last-train.mp3', '04-midnight.mp3', 'cover.jpg']},
          {name: 'Quiet-Moments', children: ['01-still-water.mp3', '02-rainfall.mp3', '03-autumn-leaves.mp3', '04-home.mp3', 'cover.jpg']},
        ],
      },
      {name: 'Favorites', children: ['morning.mp3', 'evening.mp3', 'weekend.mp3', 'journey.mp3']},
      {name: 'Playlists', children: ['workout.m3u', 'focus.m3u', 'road-trip.m3u', 'relax.m3u']},
      {
        name: 'Recordings', children: [
          {name: 'Piano', children: ['practice-01.wav', 'practice-02.wav', 'recital.wav']},
          {name: 'Guitar', children: ['acoustic-demo.wav', 'chord-exercise.wav']},
        ],
      },
      'playlist.m3u',
    ],
  },
  {
    name: 'Videos', children: [
      {name: 'Holidays', children: ['mountain-hike.mp4', 'boat-trip.mp4', 'city-tour.mp4']},
      {name: 'Tutorials', children: ['photography-basics.mp4', 'photo-editing.mp4', 'video-editing.mp4']},
      {
        name: 'Family', children: [
          {name: 'Birthday', children: ['preparations.mp4', 'celebration.mp4']},
          'reunion.mp4',
        ],
      },
      {name: 'Exports', children: []},
    ],
  },
  {
    name: 'Downloads', children: [
      {name: 'Installers', children: ['photo-editor.dmg', 'media-player.exe', 'font-pack.zip']},
      {name: 'Attachments', children: ['invoice.pdf', 'agenda.docx', 'venue-map.png']},
      {name: 'Archives', children: ['photos-2024.zip', 'project-backup.zip', 'documents.tar.gz']},
      'ebook.pdf', 'user-manual.pdf', 'sample-data.csv',
    ],
  },
  {
    name: 'Desktop', children: [
      {name: 'Inbox', children: []},
      'quick-notes.txt', 'shopping-list.txt', 'presentation.pptx',
    ],
  },
  'README.md',
]);

type FileEntry = string | {name: string; children: FileEntry[]};

function createFileNodes(entries: FileEntry[], parent: string = ''): FileNode[] {
  return entries.map(entry => {
    const name = typeof entry === 'string' ? entry : entry.name;
    const id = `${parent}/${name}`;
    return typeof entry === 'string' ? {id, name} : {id, name, children: createFileNodes(entry.children, id)};
  });
}
