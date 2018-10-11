# Common Middleware

Common middleware for Node.js apps

## Available Middleware

Exported functions accept an optional `options` object and return ExpressJS middleware.

- [Access Controler Headers](#access-control-headers)
- [Error Handler](#error-handler)

## Install

Create a local .npmrc file with Artifactory authentication. Where `username` and `password` are your own Artifactory credentials, run:

```
curl -u username:password https://pillarproject.jfrog.io/pillarproject/api/npm/auth >> .npmrc
```

Install the most recent exact version and save to your dependencies.

```
npm i -PE @pillarwallet/common-middleware
```

## Access Control Headers

Common access control headers.

Example usage:

```javascript
const { accessControlHeaders } = require('@pillarwallet/common-middleware');

app.use(accessControlHeaders());
```

## Error Handler

Error handling middleware that handles and accepts [Boom](https://www.npmjs.com/package/boom) error objects.

Accepts an optional [Bunyan logger](https://www.npmjs.com/package/bunyan) such as [Common Logger](https://github.com/pillarwallet/common-logger).

Example usage:

```javascript
const { errorHandler } = require('@pillarwallet/common-middleware');

app.use(errorHandler({ logger }));
```

## Test

```
npm test
```
