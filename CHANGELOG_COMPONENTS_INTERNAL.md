***
**SEPARATION OF @SCION/TOOLKIT INTO @SCION/TOOLKIT@1.0.0 AND @SCION/COMPONENTS@13.0.0**

Previously, framework-agnostic and Angular-specific tools were published as a single NPM package, which often led to confusion and prevented framework-agnostic tools from having a release cycle independent of the Angular project.

Therefore, we have moved Angular-specific components and directives to the NPM package `@scion/components`. It will continue to be versioned according to the Angular major release train. On the other hand, framework-agnostic tools will continue to be released under `@scion/toolkit`, but now starting with version `1.0.0` instead of pre-release versions.

The changelog before the separation into `@scion/toolkit` and `@scion/components` can be found [here](/docs/site/changelog-toolkit/changelog.md).

***