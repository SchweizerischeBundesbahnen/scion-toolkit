<a href="/README.md"><img src="/resources/branding/scion-toolkit-banner.svg" height="50" alt="SCION Toolkit"></a>

| SCION Toolkit | [Projects Overview][menu-projects-overview] | [Changelog][menu-changelog] | [Contributing][menu-contributing] | [Sponsoring][menu-sponsoring] |  
|---------------|---------------------------------------------|-----------------------------|-----------------------------------|-------------------------------|

## [SCION Toolkit][menu-home] > [@scion/toolkit][link-scion-toolkit] > Executor

The NPM sub-module `@scion/toolkit/common` provides common tools.

```
npm install @scion/toolkit
```

<details>
  <summary><strong>Executors</strong></summary>

Provides executors for scheduling tasks.

#### SingleTaskExecutor

Executes tasks sequentially in serial order.

Only a single task executes at any one time. Tasks submitted while an execution is in progress are queued.

```ts
import {SingleTaskExecutor} from '@scion/toolkit/common';

const executor = new SingleTaskExecutor();

// Submit a task for execution.
const task = executor.submit(async () => {
  // Do some work, optionally returning a value.
});

// Wait for the task to complete.
task.then(result => console.log('done', result));
```

#### LatestTaskExecutor

Executes tasks in serial order with a queue size of 1.

At most one task executes concurrently, and at most one task is pending. Submitting a new task replaces any currently queued task.

Unlike `SingleTaskExecutor`, this executor has a queue size of 1, with only the most recently scheduled task being queued.

```ts
import {LatestTaskExecutor} from '@scion/toolkit/common';

const executor = new LatestTaskExecutor();

// Submit a task for execution.
executor.submit(async () => {
  // Do some work.
});
```

</details>


[menu-home]: /README.md
[menu-projects-overview]: /docs/site/projects-overview.md
[menu-changelog]: /docs/site/changelog.md
[menu-contributing]: /CONTRIBUTING.md
[menu-sponsoring]: /docs/site/sponsoring.md

[link-scion-toolkit]: /docs/site/scion-toolkit.md
