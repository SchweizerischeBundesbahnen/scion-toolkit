# Transpiling actions

When you change GitHub Actions, run the following command to transpile the actions and include required dependencies.

```
run-s github-actions:*:build
```
 
Actions must be self-contained, so you must commit the actions' dist folder as well. For more information, see https://help.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github.

#### Useful links:
- https://help.github.com/en/actions/creating-actions/creating-a-javascript-action
- https://help.github.com/en/actions/reference/workflow-syntax-for-github-actions
- https://help.github.com/en/actions/configuring-and-managing-workflows/using-environment-variables
- https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets
