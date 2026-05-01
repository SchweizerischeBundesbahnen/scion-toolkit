The icon font 'scion-icons' is managed with IcoMoon application
---------------------------------------------------------------

The following steps explain how to manage the icon font.

1. Open IcoMoon 'https://icomoon.io/app/#/projects' web application.
2. Click 'Import Project' from the file 'scion-icons.json' and click 'Load'
3. Open 'Selection' tab
4. Import new icon clicking the menu 'Import to Set'
5. Open 'Generate Font' tab and set the ligatures
   DO NOT USE HYPHENS IN LIGATURES!
6. When done, download the font and unzip it.
7. Copy the font files contained in 'fonts' to '/resources/scion-icons/fonts':
  - scion-icons.svg
  - scion-icons.ttf
  - scion-icons.woff
7. Zip the font files to '/resources/scion-icons/fonts/fonts.zip' (referenced in SCION Components Guide).
8. Go to 'Manage projects' and download the font definition file 'scion-icons.json' into the folder '/resources/scion-icons'
9. Increment the version in the variable '$version' in 'projects/scion/components/theme/_icons.scss' to support cache busting
