# Console Design

The console repository contains both the backend and the frontend code for the console.

## Goals

- Simplicity
- Patternfly
- Typescript
- Dependency Updates
- Accessability
- Translations

## Backend

The backend is written using Typescript.

It is using [TypeGraphQL](https://typegraphql.com/) which exposes decorated classes as GraphQL.

- Define your whole schema, including types, interfaces, enums, unions and subscriptions.
- Create the schema, types and resolvers only with TypeScript, using classes and decorators.

The connection to kubernetes uses the [javascript Kubernetes client](https://github.com/kubernetes-client/javascript) library.

- By defining decorated classes representing the Kubernetes resources, the backend creates straightforward GraphQL interface for Kubernetes.
- Using resolvers it is easy for the backend to embed subresources in graphql queries.
  - Example: ManagedCluster has a field called info which is a ManagedClusterInfo and the resolver in just a couple of lines can stitch those together.
  - This allows the client to make a single query and get a resource with all related resources.
- In addition there are certain fields that need to be generated and resolvers can be used to facilitate that.
  - Example: ManageCluster displayStatus string is calculated in a resolver from all the managedCluster conditions.

The backend server is using fastify. This is because it is the fastest framework for TypeGraphQL and NodeJS. [Benchmarks](https://github.com/benawad/node-graphql-benchmarks)

Unit testing is setup using Jest and the VSCode Jest plugin is highly recommended as it makes testing a breeze.

## Frontend

The frontend is written using Typescript and is using the React framework.

The frontend is using react scripts to simplify dependencies. The react scripts internally handle all the webpacking of the frontend. The goal here is fewer dependencies of the frontend.

The frontend uses a generated library for connecting to the backend. This is using [GraphQL CodeGen](https://graphql-code-generator.com/) and is using the apollo-client plugin.  The library is strongly typed and the frontend will throw compile errors if the frontend does not match the backend.

```
npm run generate
```

Queries using the generated apollo-client library simplifies the code and allows for easy polling, error handling and requerying. Apollo client also handles caching internally and supports some advanced cached query performance enhancements.

The frontend is using [PatternFly](https://www.patternfly.org/) for it's UI framework.

Unit testing is setup using Jest and the VSCode Jest plugin is highly recommended as it makes testing a breeze.

## Console repository contains both frontend and backend

At the root of the project is a package.json containing scripts to help with development and builds.

VSCode works best when the console workspace at the root is opened vs just the console directory.
This is because the Jest plugin wants to run at the root and with the workspace it runs in each subproject.

### Install dependencies

```
npm ci
```

### Setup environment

You need to

- have `oc` installed
- be logged into your openshift ACM hub

### Start the development server

```
npm start
```

This will concurrently start the backend, code generation, and the frontend.

Frontend: http://localhost:3000

Backend: http://localhost:4000

### Build

```
npm run build
```

There is an optimized dockerfile at the root that build the backend, frontend, and merges them into a final image.

## Authentication

Frontend has a cookie that contains the user's token.

If a request comes to the backend without a cookie, or a request comes in with a token that kubernetes responds with a 401, then the backend will respond to the frontend with a 302 redirect to /login.

The backend /login path uses Oauth with the kubernetes cluster. It redirects to the clusters authorization_endpoint and gets a token using the clusters token_endpoint. Successful OAuth finally redirects to /login/callback on the backend which creates a response with the set cookie header of the user token and redirects back to the frontend.
