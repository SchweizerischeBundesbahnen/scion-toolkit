1. Before publish:
   - Change JSDelivr URL in '_scion-icon-font.scss' and 'angular.json'; See TODO [FINAL]  
     - From:
       https://cdn.jsdelivr.net/npm/@scion/components/resources/scion-icons/
     - To:
       https://cdn.jsdelivr.net/gh/SchweizerischeBundesbahnen/scion-toolkit@issue/592/



BREAKING CHANGES




RECOMMENDATIONS:
- Remove icons in assets
- Remove custom directory in @scion/workbench scss module config

DEPRECATIONS:
- Deprecated `Dictionaries.withoutUndefinedEntries`. Use `prune` instead; API will be removed in version 3.0.0.


RELEASE:
- Release @scion/toolkit version "2.2.0"

