# @open-cluster-management/console

[![Build Status](https://travis-ci.com/open-cluster-management/console.svg?token=APpLzibLo9i2xU1nq9kC&branch=master)](https://travis-ci.com/open-cluster-management/console)

## Prerequisites

- Node.js v12.x

## Running

1. Clone repository

2. Install dependencies

   ```
   npm ci
   ```

3. Setup environment

   You need:

   - to be connected to a OpenShift 4.x.x cluster
   - to have Advanced Cluster Management installed on the cluster

   ```
   npm run setup
   ```

   This will create a `.env` file in backend containing the environment variables.

4. Start the development services

   ```
   npm start
   ```

   This will start the frontend and the backend in parallel.

   The frontend will proxy requests to the backend using react scripts.

   The backend will proxy requests to the kubernetes cluster specified by CLUSTER_API_URL in backend/.env.

## Design

### Backend

The backend is a passthrough to kubernetes with a few tweaks.

The header `Bearer TOKEN` will be injected into each request from the `acm-access-token-cookie` cookie. All requests are performed with the users token so kubernetes RBAC is enforced.

- `/api/proxy` will proxy the requests to the kubernetes cluster.
  - PATCH is the only exception, it will change the headers to properly patch a resource.

- `/api/namespaced` will proxy the requests to the kubernetes cluster, but
  - it will try to access the resources at a cluster level for performance
  - if it cannot because cluster level access is forbidden
    - it will determine the namespaces the user can access using `projects` and query each namespace for the resource in parallel as the user.
    - This is needed for performance as it cannot be done from the frontend as browsers limit the number of concurrent requests.

### Frontend

The frontend is using react scripts to simplify dependencies. The react scripts internally handle all the webpacking of the frontend. The goal here is fewer dependencies of the frontend.

React scripts allow for proxying of frontend requests to a backend. This is configured in the package.json of the frontend.

### Authentication

Frontend has a cookie `acm-access-token-cookie` that contains the user's token.

If the backend responds with a `401 Unauthorized` the frontend starts an OAuth flow to authorize with the cluster.

- Frontend redirects to the backend `/login` endpoint.
- Backend redirects to the cluster `/authorize` endpoint.
- Cluster OAuth redirects back to the backend `/login/callback` endpoint.
- Backend redirects to the frontend and sets the `acm-access-token-cookie`.

If you find that you are in an infinite login loop it usualy means that you have a "secure" cookie that the backend cannot update.
Open https://localhost and goto developer tooks -> application and remove the acm token cookie.