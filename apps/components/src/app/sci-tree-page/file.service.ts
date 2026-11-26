/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, Service, signal} from '@angular/core';
import {UUID} from '@scion/toolkit/uuid';
import {map, Observable} from 'rxjs';
import {SciTreeDatasourceQuery, SciTreeNode} from '@scion/components/tree';
import {toObservable} from '@angular/core/rxjs-interop';
import {filterArray, mapArray} from '@scion/toolkit/operators';

@Service()
export class FileService {

  private readonly _fileNodes = signal(createFileNodes(fileEntries));
  private readonly _clipboard = signal<FileNode[]>([]);

  public readonly files = computed(() => this.sortFiles(this._fileNodes()));
  public readonly files$ = toObservable(this.files);
  public readonly canPaste = computed(() => this._clipboard().length > 0);

  public getTreeFileNodes$(query: SciTreeDatasourceQuery): Observable<SciTreeNode<string>[]> {
    return this.files$
      .pipe(
        filterArray(file => query.filter ? file.name.toLowerCase().includes(query.filter.toLowerCase()) : true),
        mapArray(file => ({id: file.id, parentId: file.parentId})),
      );
  }

  public getFileNodes$(ids: string[]): Observable<FileNode[]> {
    return this.files$
      .pipe(
        map(files => files.flatMap(file => [file, ...file.children])),
        filterArray(file => ids.includes(file.id)),
      );
  }

  public createFile(name: string, options: {parentId: string | undefined; type: 'file' | 'folder'}): void {
    const parentId = options.parentId;
    const newNode: FileNode = {
      id: UUID.randomUUID(),
      parentId,
      name,
      type: options.type,
      children: [],
    };

    this._fileNodes.update(nodes => parentId ? addChild(nodes, parentId, newNode) : [...nodes, newNode]);
  }

  public editFile(id: string, name: string): void {
    this._fileNodes.update(nodes => updateFile(nodes, id, name));

    function updateFile(nodes: FileNode[], id: string, name: string): FileNode[] {
      return nodes.map(node => {
        if (node.id === id) {
          return {...node, name};
        }

        return {
          ...node,
          children: updateFile(node.children, id, name),
        };
      });
    }
  }

  public getFile(id: string | undefined): FileNode | undefined {
    return findFile(id, this.files());
  }

  public deleteFiles(ids: string[]): void {
    this._fileNodes.update(nodes => removeFiles(nodes, new Set(ids)));

    function removeFiles(nodes: FileNode[], ids: Set<string>): FileNode[] {
      return nodes
        .filter(node => !ids.has(node.id))
        .map(node => ({
          ...node,
          children: removeFiles(node.children, ids),
        }));
    }
  }

  public getFilePath(id: string): string {
    const file = this.getFile(id)!;
    const parentPath = file.parentId ? this.getFilePath(file.parentId) : undefined;
    return parentPath ? `${parentPath}/${file.name}` : file.name;
  }

  private sortFiles(nodes: FileNode[]): FileNode[] {
    return [...nodes]
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      })
      .map(node => ({
        ...node,
        children: this.sortFiles(node.children),
      }));
  }

  public copyFiles(files: FileNode[]): void {
    this._clipboard.set(files.map(file => this.cloneNode(file)));
  }

  private cloneNode(file: FileNode): FileNode {
    return {
      ...file,
      children: file.children.map(child => this.cloneNode(child)),
    };
  }

  public pasteFiles(parentId?: string): void {
    const clipboard = this._clipboard();

    if (clipboard.length === 0) {
      return;
    }

    this._fileNodes.update(nodes => {
      const parent = parentId ? findFile(parentId, nodes) : undefined;

      if (parentId && parent?.type !== 'folder') {
        return nodes;
      }

      const siblings = [...(parent?.children ?? nodes)];

      const newFiles = clipboard.map(file => {
        const copy = cloneNodeWithNewIds(file, parentId);
        copy.name = getUniqueName(file, siblings);
        siblings.push(copy);
        return copy;
      });

      return parentId ? addChildren(nodes, parentId, newFiles) : [...nodes, ...newFiles];
    });
  }
}

export interface FileNode {
  id: string;
  parentId?: string;
  name: string;
  type: 'file' | 'folder';
  children: FileNode[];
}

type FileEntry = {name: string; type: 'file'} | {name: string; type: 'folder'; children: FileEntry[]};

function createFileNodes(entries: FileEntry[], parentId?: string): FileNode[] {
  return entries.map(entry => {
    const id = UUID.randomUUID();

    return {
      id,
      name: entry.name,
      type: entry.type,
      parentId,
      children: entry.type === 'folder' ? createFileNodes(entry.children, id) : [],
    } satisfies FileNode;
  });
}

function findFile(id: string | undefined, nodes: FileNode[]): FileNode | undefined {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    const found = findFile(id, node.children);
    if (found) {
      return found;
    }
  }

  return undefined;
}

function addChild(nodes: FileNode[], parentId: string, child: FileNode): FileNode[] {
  return nodes.map(node => {
    if (node.id === parentId && node.type === 'folder') {
      return {...node, children: [...node.children, child]};
    }

    return {
      ...node,
      children: addChild(node.children, parentId, child),
    };
  });
}

function cloneNodeWithNewIds(file: FileNode, parentId?: string): FileNode {
  const id = UUID.randomUUID();

  return {
    ...file,
    id,
    parentId,
    children: file.children.map(child => cloneNodeWithNewIds(child, id)),
  };
}

function addChildren(nodes: FileNode[], parentId: string, children: FileNode[]): FileNode[] {
  return nodes.map(node => {
    if (node.id === parentId) {
      return {...node, children: [...node.children, ...children]};
    }

    return {
      ...node,
      children: addChildren(node.children, parentId, children),
    };
  });
}

function getUniqueName(file: FileNode, siblings: FileNode[]): string {
  const extensionIndex = file.type === 'file' ? file.name.lastIndexOf('.') : -1;
  const extension = extensionIndex > 0 ? file.name.slice(extensionIndex) : '';
  const stem = extension ? file.name.slice(0, extensionIndex) : file.name;
  const baseName = stem.replace(/ \(copy(?: \d+)?\)$/, '');

  const existingNames = new Set(siblings.map(sibling => sibling.name));

  if (!existingNames.has(file.name)) {
    return file.name;
  }

  let index = 1;
  let name: string;

  do {
    const suffix = index === 1 ? ' (copy)' : ` (copy ${index})`;
    name = `${baseName}${suffix}${extension}`;
    index++;
  }
  while (existingNames.has(name));

  return name;
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

const fileEntries: FileEntry[] = [
  {
    name: 'Documents', type: 'folder', children: [
      {
        name: 'Projects', type: 'folder', children: [
          {
            name: 'Website', type: 'folder', children: [
              {
                name: 'assets', type: 'folder', children: [
                  {name: 'logo.svg', type: 'file'},
                  {name: 'banner.png', type: 'file'},
                  {name: 'favicon.ico', type: 'file'},
                ],
              },
              {
                name: 'designs', type: 'folder', children: [
                  {name: 'homepage.fig', type: 'file'},
                  {name: 'mobile-layout.fig', type: 'file'},
                  {name: 'style-guide.pdf', type: 'file'},
                ],
              },
              {name: 'index.html', type: 'file'},
              {name: 'styles.css', type: 'file'},
              {name: 'README.md', type: 'file'},
            ],
          },
          {
            name: 'Mobile-App', type: 'folder', children: [
              {
                name: 'wireframes', type: 'folder', children: [
                  {name: 'login.png', type: 'file'},
                  {name: 'dashboard.png', type: 'file'},
                  {name: 'settings.png', type: 'file'},
                ],
              },
              {
                name: 'releases', type: 'folder', children: [
                  {name: 'release-notes-1.0.md', type: 'file'},
                  {name: 'release-notes-1.1.md', type: 'file'},
                ],
              },
              {name: 'requirements.pdf', type: 'file'},
              {name: 'project-plan.xlsx', type: 'file'},
              {name: 'README.md', type: 'file'},
            ],
          },
          {
            name: 'Research', type: 'folder', children: [
              {name: 'interviews.docx', type: 'file'},
              {name: 'survey-results.csv', type: 'file'},
              {name: 'findings.pdf', type: 'file'},
              {name: 'references.bib', type: 'file'},
            ],
          },
          {name: 'roadmap.pdf', type: 'file'},
        ],
      },
      {
        name: 'Reports', type: 'folder', children: [
          {
            name: '2024', type: 'folder', children: [
              {name: 'annual-report.pdf', type: 'file'},
              {name: 'budget.xlsx', type: 'file'},
              {name: 'summary.docx', type: 'file'},
            ],
          },
          {
            name: '2025', type: 'folder', children: [
              {name: 'annual-report.pdf', type: 'file'},
              {name: 'budget.xlsx', type: 'file'},
              {name: 'summary.docx', type: 'file'},
            ],
          },
          {
            name: '2026', type: 'folder', children: [
              {
                name: 'Q1', type: 'folder', children: [
                  {name: 'sales.pdf', type: 'file'},
                  {name: 'expenses.xlsx', type: 'file'},
                  {name: 'review.pptx', type: 'file'},
                ],
              },
              {
                name: 'Q2', type: 'folder', children: [
                  {name: 'sales.pdf', type: 'file'},
                  {name: 'expenses.xlsx', type: 'file'},
                  {name: 'review.pptx', type: 'file'},
                ],
              },
              {
                name: 'Q3', type: 'folder', children: [
                  {name: 'sales.pdf', type: 'file'},
                  {name: 'expenses.xlsx', type: 'file'},
                  {name: 'review.pptx', type: 'file'},
                ],
              },
              {name: 'Q4', type: 'folder', children: []},
              {name: 'forecast.xlsx', type: 'file'},
            ],
          },
        ],
      },
      {
        name: 'Personal', type: 'folder', children: [
          {
            name: 'Travel', type: 'folder', children: [
              {name: 'itinerary.pdf', type: 'file'},
              {name: 'packing-list.txt', type: 'file'},
              {name: 'hotel-booking.pdf', type: 'file'},
              {name: 'train-tickets.pdf', type: 'file'},
            ],
          },
          {
            name: 'Finance', type: 'folder', children: [
              {name: 'household-budget.xlsx', type: 'file'},
              {name: 'insurance.pdf', type: 'file'},
              {name: 'tax-return.pdf', type: 'file'},
            ],
          },
          {
            name: 'Certificates', type: 'folder', children: [
              {name: 'diploma.pdf', type: 'file'},
              {name: 'language-certificate.pdf', type: 'file'},
              {name: 'first-aid.pdf', type: 'file'},
            ],
          },
          {name: 'resume.pdf', type: 'file'},
          {name: 'cover-letter.docx', type: 'file'},
        ],
      },
      {
        name: 'Templates', type: 'folder', children: [
          {name: 'letter.docx', type: 'file'},
          {name: 'invoice.xlsx', type: 'file'},
          {name: 'presentation.pptx', type: 'file'},
          {name: 'meeting-notes.md', type: 'file'},
        ],
      },
      {name: 'notes.txt', type: 'file'},
      {name: 'todo.md', type: 'file'},
    ],
  },
  {
    name: 'Pictures', type: 'folder', children: [
      {
        name: 'Holidays', type: 'folder', children: [
          {
            name: 'Switzerland', type: 'folder', children: [
              {
                name: 'Zermatt', type: 'folder', children: [
                  {name: 'matterhorn.jpg', type: 'file'},
                  {name: 'village.jpg', type: 'file'},
                  {name: 'hiking-trail.jpg', type: 'file'},
                ],
              },
              {
                name: 'Lucerne', type: 'folder', children: [
                  {name: 'chapel-bridge.jpg', type: 'file'},
                  {name: 'lake.jpg', type: 'file'},
                  {name: 'old-town.jpg', type: 'file'},
                ],
              },
              {name: 'mountains.jpg', type: 'file'},
              {name: 'panorama.jpg', type: 'file'},
            ],
          },
          {
            name: 'Italy', type: 'folder', children: [
              {name: 'rome.jpg', type: 'file'},
              {name: 'venice.jpg', type: 'file'},
              {name: 'florence.jpg', type: 'file'},
              {name: 'coast.jpg', type: 'file'},
            ],
          },
          {
            name: 'Norway', type: 'folder', children: [
              {name: 'fjord.jpg', type: 'file'},
              {name: 'northern-lights.jpg', type: 'file'},
              {name: 'cabin.jpg', type: 'file'},
              {name: 'waterfall.jpg', type: 'file'},
            ],
          },
        ],
      },
      {
        name: 'Family', type: 'folder', children: [
          {
            name: 'Birthdays', type: 'folder', children: [
              {name: 'cake.jpg', type: 'file'},
              {name: 'candles.jpg', type: 'file'},
              {name: 'group-photo.jpg', type: 'file'},
            ],
          },
          {
            name: 'Reunion', type: 'folder', children: [
              {name: 'picnic.jpg', type: 'file'},
              {name: 'portraits.jpg', type: 'file'},
              {name: 'garden.jpg', type: 'file'},
            ],
          },
          {name: 'family-photo.jpg', type: 'file'},
        ],
      },
      {
        name: 'Wallpapers', type: 'folder', children: [
          {name: 'forest.jpg', type: 'file'},
          {name: 'ocean.jpg', type: 'file'},
          {name: 'sunset.jpg', type: 'file'},
          {name: 'city.jpg', type: 'file'},
          {name: 'abstract.png', type: 'file'},
        ],
      },
      {
        name: 'Screenshots', type: 'folder', children: [
          {name: 'desktop.png', type: 'file'},
          {name: 'dashboard.png', type: 'file'},
          {name: 'map.png', type: 'file'},
          {name: 'receipt.png', type: 'file'},
        ],
      },
      {name: 'Unsorted', type: 'folder', children: []},
      {name: 'profile.png', type: 'file'},
    ],
  },
  {
    name: 'Music', type: 'folder', children: [
      {
        name: 'Albums', type: 'folder', children: [
          {
            name: 'Morning-Light', type: 'folder', children: [
              {name: '01-awakening.mp3', type: 'file'},
              {name: '02-first-light.mp3', type: 'file'},
              {name: '03-new-day.mp3', type: 'file'},
              {name: '04-open-road.mp3', type: 'file'},
              {name: 'cover.jpg', type: 'file'},
            ],
          },
          {
            name: 'City-Nights', type: 'folder', children: [
              {name: '01-downtown.mp3', type: 'file'},
              {name: '02-neon-lights.mp3', type: 'file'},
              {name: '03-last-train.mp3', type: 'file'},
              {name: '04-midnight.mp3', type: 'file'},
              {name: 'cover.jpg', type: 'file'},
            ],
          },
          {
            name: 'Quiet-Moments', type: 'folder', children: [
              {name: '01-still-water.mp3', type: 'file'},
              {name: '02-rainfall.mp3', type: 'file'},
              {name: '03-autumn-leaves.mp3', type: 'file'},
              {name: '04-home.mp3', type: 'file'},
              {name: 'cover.jpg', type: 'file'},
            ],
          },
        ],
      },
      {
        name: 'Favorites', type: 'folder', children: [
          {name: 'morning.mp3', type: 'file'},
          {name: 'evening.mp3', type: 'file'},
          {name: 'weekend.mp3', type: 'file'},
          {name: 'journey.mp3', type: 'file'},
        ],
      },
      {
        name: 'Playlists', type: 'folder', children: [
          {name: 'workout.m3u', type: 'file'},
          {name: 'focus.m3u', type: 'file'},
          {name: 'road-trip.m3u', type: 'file'},
          {name: 'relax.m3u', type: 'file'},
        ],
      },
      {
        name: 'Recordings', type: 'folder', children: [
          {
            name: 'Piano', type: 'folder', children: [
              {name: 'practice-01.wav', type: 'file'},
              {name: 'practice-02.wav', type: 'file'},
              {name: 'recital.wav', type: 'file'},
            ],
          },
          {
            name: 'Guitar', type: 'folder', children: [
              {name: 'acoustic-demo.wav', type: 'file'},
              {name: 'chord-exercise.wav', type: 'file'},
            ],
          },
        ],
      },
      {name: 'playlist.m3u', type: 'file'},
    ],
  },
  {
    name: 'Videos', type: 'folder', children: [
      {
        name: 'Holidays', type: 'folder', children: [
          {name: 'mountain-hike.mp4', type: 'file'},
          {name: 'boat-trip.mp4', type: 'file'},
          {name: 'city-tour.mp4', type: 'file'},
        ],
      },
      {
        name: 'Tutorials', type: 'folder', children: [
          {name: 'photography-basics.mp4', type: 'file'},
          {name: 'photo-editing.mp4', type: 'file'},
          {name: 'video-editing.mp4', type: 'file'},
        ],
      },
      {
        name: 'Family', type: 'folder', children: [
          {
            name: 'Birthday', type: 'folder', children: [
              {name: 'preparations.mp4', type: 'file'},
              {name: 'celebration.mp4', type: 'file'},
            ],
          },
          {name: 'reunion.mp4', type: 'file'},
        ],
      },
      {name: 'Exports', type: 'folder', children: []},
    ],
  },
  {
    name: 'Downloads', type: 'folder', children: [
      {
        name: 'Installers', type: 'folder', children: [
          {name: 'photo-editor.dmg', type: 'file'},
          {name: 'media-player.exe', type: 'file'},
          {name: 'font-pack.zip', type: 'file'},
        ],
      },
      {
        name: 'Attachments', type: 'folder', children: [
          {name: 'invoice.pdf', type: 'file'},
          {name: 'agenda.docx', type: 'file'},
          {name: 'venue-map.png', type: 'file'},
        ],
      },
      {
        name: 'Archives', type: 'folder', children: [
          {name: 'photos-2024.zip', type: 'file'},
          {name: 'project-backup.zip', type: 'file'},
          {name: 'documents.tar.gz', type: 'file'},
        ],
      },
      {name: 'ebook.pdf', type: 'file'},
      {name: 'user-manual.pdf', type: 'file'},
      {name: 'sample-data.csv', type: 'file'},
    ],
  },
  {
    name: 'Desktop', type: 'folder', children: [
      {name: 'Inbox', type: 'folder', children: []},
      {name: 'quick-notes.txt', type: 'file'},
      {name: 'shopping-list.txt', type: 'file'},
      {name: 'presentation.pptx', type: 'file'},
    ],
  },
  {name: 'README.md', type: 'file'},
];
