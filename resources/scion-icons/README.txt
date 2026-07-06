---------------------------------------------------------------
The icon font 'scion-icons' is managed with IcoMoon application
---------------------------------------------------------------

The following steps explain how to manage the icon font.

1.  Open IcoMoon 'https://icomoon.io/app/#/projects' web application.
2.  Click 'Import Project' from the file 'scion-icons.json' and click 'Load'
3.  Open 'Selection' tab
4.  Add new icons by using the menu option 'Import to Set'.
5.  Open 'Generate Font' tab and configure the ligatures.
    DO NOT USE HYPHENS IN LIGATURES!
6.  When done, download the font and unzip it.
7.  Copy the font files contained in 'fonts' to '/resources/scion-icons':
    - scion-icons.svg
    - scion-icons.ttf
    - scion-icons.woff
8.  Zip the font files to '/resources/scion-icons/scion-icons.zip' (referenced in SCION Icons Documentation).
9.  Go to 'Manage projects' and download the font definition file 'scion-icons.json' into the folder '/resources/scion-icons'
10. Increment the version in the variable '$version' in 'projects/scion/components/design/icons/_scion-icon-font.scss' to support cache busting
11. Purge jsDelivr CDN cache:
    - Go to https://www.jsdelivr.com/tools/purge
    - Enter the URLs:
      - https://cdn.jsdelivr.net/npm/@scion/components/resources/scion-icons/scion-icons.woff
      - https://cdn.jsdelivr.net/npm/@scion/components/resources/scion-icons/scion-icons.ttf
      - https://cdn.jsdelivr.net/npm/@scion/components/resources/scion-icons/scion-icons.svg
      - https://cdn.jsdelivr.net/npm/@scion/components/resources/scion-icons/scion-icons.zip
12. Icons are available from the CDN at: https://cdn.jsdelivr.net/npm/@scion/components/resources/scion-icons


---------------------------------
How to test updated icons locally
---------------------------------

Change the font directory in styles.scss:
```scss
@use '@scion/components' with (
  $icon-font: (
    directory: '/scion-icons'
  )
);
```
