# Managing Cron Jobs

Cron Jobs are available on [all plans](/docs/plans)

## [Viewing cron jobs](#viewing-cron-jobs)

To view your active cron jobs:

1.  Select your project from the Vercel dashboard
2.  Select the Settings tab
3.  Select the Cron Jobs tab from the left sidebar

## [Cron jobs maintenance](#cron-jobs-maintenance)

*   Updating Cron Jobs: Change the [expression](/docs/cron-jobs#cron-expressions) in `vercel.json` file or the function's configuration, and then redeploy
*   Deleting Cron Jobs: Remove the configuration from the `vercel.json` file or the function's configuration, and then redeploy
*   Disabling Cron Jobs: Navigate to the Cron Jobs tab and then click the Disable Cron Jobs button

Disabled cron jobs will still be listed and will count towards your [cron jobs limits](/docs/cron-jobs/usage-and-pricing)

## [Securing cron jobs](#securing-cron-jobs)

It is possible to secure your cron job invocations by adding an environment variable called `CRON_SECRET` to your Vercel project. We recommend using a random string of at least 16 characters for the value of `CRON_SECRET`. A password generator, like [1Password](https://1password.com/password-generator/), can be used to create one.

The value of the variable will be automatically sent as an `Authorization` header when Vercel invokes your cron job. Your endpoint can then compare both values, the authorization header and the environment variable, to verify the authenticity of the request.

You can use App Router [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) to secure your cron jobs, even when using the Pages Router.

Next.js (/app)Next.js (/pages)Other frameworks

app/api/cron/route.ts

TypeScript

TypeScriptJavaScriptBash

```
import type { NextRequest } from 'next/server';
 
export function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', {
      status: 401,
    });
  }
 
  return Response.json({ success: true });
}
```

The `authorization` header will have the `Bearer` prefix for the value.

For those using TypeScript versions below 5.2, it's important to adapt the code to `import NextResponse from 'next/server'` and use `NextResponse.json` for the response. This ensures compatibility with earlier TypeScript versions in Next.js applications. In TypeScript 5.2 and above, the standard `new Response` pattern should be used.

## [Cron job duration](#cron-job-duration)

The duration limits for Cron jobs are identical to those of [Vercel Functions](/docs/functions#limits). See the [`maxDuration`](/docs/functions/runtimes#max-duration) documentation for more information.

In most cases, these limits are sufficient. However, if you need more processing time, it's recommended to split your cron jobs into different units or distribute your workload by combining cron jobs with regular HTTP requests with your API.

## [Cron job error handling](#cron-job-error-handling)

Vercel will not retry an invocation if a cron job fails. You can check for error [logs](/docs/runtime-logs) through the View Log button in the Cron Jobs tab.

## [Cron jobs with dynamic routes](#cron-jobs-with-dynamic-routes)

Cron jobs can be created for [dynamic routes](https://nextjs.org/docs/routing/dynamic-routes):

vercel.json

```
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/sync-slack-team/T0CAQ10TZ",
      "schedule": "0 5 * * *"
    },
    {
      "path": "/api/sync-slack-team/T4BOE34OP",
      "schedule": "0 5 * * *"
    }
  ]
}
```

## [Handling nonexistent paths](#handling-nonexistent-paths)

If you create a cron job for a path that doesn't exist, it generates a [404 error](/docs/errors/platform-error-codes#404:-not_found). However, Vercel still executes your cron job. You can analyze your logs to check if there are any issues.

## [Cron jobs and deployments](#cron-jobs-and-deployments)

Creating a new deployment will not interrupt your running cron jobs; they will continue until they finish.

## [Controlling cron job concurrency](#controlling-cron-job-concurrency)

When a cron job takes too long to run, you might encounter two concurrent cron job invocations, which could cause problems. Implementing a lock mechanism in your cron job, for example by using [Redis](https://redis.io/docs/manual/patterns/distributed-locks/), is recommended in such cases.

Alternatively, ensure your cron job is fast enough or set it to timeout if it runs for too long.

## [Running cron jobs locally](#running-cron-jobs-locally)

Cron jobs are API routes. You can run them locally by making a request to their endpoint. For example, if your cron job is in `/api/cron`, you could visit the following endpoint in your browser: `http://localhost:3000/api/cron`. You should be aware that while your browser may follow redirects, [cron job invocations in production will not](#cron-jobs-and-redirects) follow redirects.

There is currently no support for `vercel dev`, `next dev`, or other framework-native local development servers.

## [Cron jobs and redirects](#cron-jobs-and-redirects)

Cron jobs do not follow redirects. When a cron-triggered endpoint returns a 3xx redirect status code, the job completes without further requests. Redirect responses are treated as final for each invocation.

The view logs button on the cron job overview can be used to verify the response of the invocations and gain further insights.

## [Cron jobs logs](#cron-jobs-logs)

Cron jobs are logged as function invocations from the Logs tab of your projects [dashboard](/dashboard). You can view the logs for a cron job from the list on the [Cron jobs settings page](/docs/cron-jobs/manage-cron-jobs#viewing-cron-jobs) of the project:

1.  From the list of cron jobs, select View Logs.
2.  This will take you to the [runtime logs](/docs/runtime-logs#request-path) view with a `requestPath` filter to your cron job such as `requestPath:/api/my-cron-job`.

See [how to view runtime logs](/docs/runtime-logs#view-runtime-logs) for more information.

Note that when cron jobs respond with a redirect or a cached response, they will not be shown in the logs.

## [Cron jobs accuracy](#cron-jobs-accuracy)

Hobby users can only create cron jobs with [hourly accuracy](/docs/cron-jobs/usage-and-pricing#hobby-scheduling-limits). Vercel may invoke these cron jobs at any point within the specified hour to help distribute load across all accounts. For example, an expression like `* 8 * * *` could trigger an invocation anytime between `08:00:00` and `08:59:59`.

For all other teams, cron jobs will be invoked within the minute specified. For instance, the expression `5 8 * * *` would trigger an invocation between `08:05:00` and `08:05:59`.

## [Rollbacks with cron jobs](#rollbacks-with-cron-jobs)

If you [Instant Rollback](/docs/instant-rollback) to a previous deployment, active cron jobs will not be updated. They will continue to run as scheduled until they are manually disabled or updated.

# Usage & Pricing for Cron Jobs

Cron Jobs are available on [all plans](/docs/plans)

Cron jobs invoke [Vercel Functions](/docs/functions). This means the same [usage](/docs/limits) and [pricing](/pricing) limits will apply.

|  | Number of cron jobs per account | Schedule |
| --- | --- | --- |
| Hobby | 2 cron jobs | Triggered once a day |
| Pro | 40 cron jobs | Unlimited cron invocations |
| Enterprise | 100 cron jobs | Unlimited cron invocations |

Each project has a hard limit of 20 cron jobs per project.

### [Hobby scheduling limits](#hobby-scheduling-limits)

On the Hobby plan, Vercel cannot assure a timely cron job invocation. For example, a cron job configured as `0 1 * * *` (every day at 1 am) will trigger anywhere between 1:00 am and 1:59 am.

For more specific cron job executions, upgrade to our [Pro](/docs/plans/pro) plan.

## [Pricing](#pricing)

Cron jobs are included in all plans.

You use a function to invoke a cron job, and therefore [usage](/docs/limits) and [pricing](/pricing) limits for these functions apply to all cron job executions:

*   [Functions limits and pricing](/docs/functions/usage-and-pricing)