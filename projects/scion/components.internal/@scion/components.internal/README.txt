## TL;DR
Allows SASS modules of "@scion/components.internal" to be imported by the Components Application via `@use '@scion/components.internal'`.

## Explanation
The SASS CSS loader allows to reference Sass modules of packages installed in the "node_modules" folder. For example, if having installed '@angular/cdk', its Sass modules can be imported as follows: @use '@angular/cdk'. But, when building or starting the components app, the module `@scion/components.internal` is not installed in the "node_modules". Since we didn't find a way to instruct the Sass CSS loader to load certain Sass modules from the "dist" or project folder instead of "node_modules", we have created the folder "@scion/components.internal" and registered it as style preprocessor options in the application's `angular.json`. Note that both folders and contained files are excluded from the library build and not published to NPM. See included assets in `@scion/components.internal/ng-package.json`.

## ng-package.json of "components.internal"
{
  "assets": [
    "{,!(@scion)/**/}_*.scss" // include all SASS files starting with a leading underscore, but only if they are not contained in the directory /@scion/ or its subdirectories
  ]
}

## angular.json of components application
{
  "stylePreprocessorOptions": {
    "includePaths": [
      "projects/scion/components",
      "projects/scion/components.internal"
    ]
  }
}

## Usage in components application
@use '@scion/components.internal/theme';
@use '@scion/components.internal' as sci-ɵcomponents;