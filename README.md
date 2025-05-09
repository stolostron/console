[comment]: # ' Copyright Contributors to the Open Cluster Management project '

# @stolostron/console

[![License](https://img.shields.io/:license-apache-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
[![Build](https://img.shields.io/badge/build-Prow-informational)](https://prow.ci.openshift.org/?repo=stolostron%2Fconsole)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=coverage&token=678092fc6e15fad203b8883681417cca4c477c6b)](https://sonarcloud.io/dashboard?id=open-cluster-management_console)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=sqale_rating&token=678092fc6e15fad203b8883681417cca4c477c6b)](https://sonarcloud.io/dashboard?id=open-cluster-management_console)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=security_rating&token=678092fc6e15fad203b8883681417cca4c477c6b)](https://sonarcloud.io/dashboard?id=open-cluster-management_console)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=vulnerabilities&token=678092fc6e15fad203b8883681417cca4c477c6b)](https://sonarcloud.io/dashboard?id=open-cluster-management_console)

## What is console?

The console provides the user interface for Red Hat Advanced Cluster Management (ACM) for Kubernetes and Red Hat MultiCluster Engine (MCE).

Go to the [Contributing guide](CONTRIBUTING.md) to learn how to get involved.

## Prerequisites

-   [Node.js](https://nodejs.org) 20
-   NPM 8

## Active Release Branches

The same codebase is used to build images for **Red Hat Advanced Cluster Management for Kubernetes** (from `release-*` branches) and **multicluster engine for Kubernetes** (from `backplane-*` branches). The build system fast-forwards between branches to keep the content in sync. Pull requests should only be opened against the first branch in each line listed below. The arrow represents an automatic fast-forwarding of commits from one branch to the next.

```
main → release-2.14 → backplane-2.9
release-2.13 → backplane-2.8
release-2.12 → backplane-2.7
release-2.11 → backplane-2.6
release-2.10 → backplane-2.5
release-2.9 → backplane-2.4
```

## Core Dependencies - Release Branch Mapping

A number of the core NPM package dependencies are published from other repositories. To allow development of new features in these projects, branches are created each time a new release is started.

| console branch                          | patternfly-labs/react-form-wizard | stolostron/react-data-view |
| --------------------------------------- | --------------------------------- | -------------------------- |
| main<br/>release-2.14<br/>backplane-2.9 | main                              | main                       |
| release-2.13<br/>backplane-2.8          | v2.4.z                            | v2.3.z                     |
| release-2.12<br/>backplane-2.7          | v1.32.z                           | v1.15.z                    |
| release-2.11<br/>backplane-2.6          | v1.29.z                           | v1.14.z                    |
| release-2.10<br/>backplane-2.5          | v1.27.z                           | v1.13.z                    |
| release-2.9<br/>backplane-2.4           | v1.26.z                           | v1.12.z                    |

## Running

1. Clone repository

2. Install dependencies

    ```
    npm ci
    ```

3. Setup environment

    You need:

    - to be connected to a OpenShift 4.x.x cluster
    - to have Red Hat Advanced Cluster Management or multicluster engine for Kubernetes installed on the cluster

    ```
    npm run setup
    ```

    This will create a `.env` file in the backend directory containing environment variables.

4. Start the development services

    ```
    npm start
    ```

    This will start the frontend and the backend in parallel. (It may take up to 30 seconds for the UI to appear)

**NOTE:** If any port conflict appears or you want to run different versions of the console simultaneously, all ports are customizable via environment variables. 
The default values are defined in [port-defaults.sh](port-defaults.sh). Several of these ports are used during setup.

| Port Variable | Description | Used by |
|-|-|-|
| FRONTEND_PORT | Port for standalone version of this console (access console at https://localhost:<FRONTEND_PORT>) | `npm run setup`, `npm start` |
| BACKEND_PORT | Port for the backend APIs used by both standalone and plugin versions of the console | `npm run setup`, `npm start`, `npm run plugins` |
| CONSOLE_PORT | Port for OpenShift console (access console at http://localhost:<CONSOLE_PORT>) | `npm run setup`, `npm run plugins` |
| MCE_PORT | Port on which the `mce` dynamic plugin is served to OpenShift console | `npm run plugins` |
| ACM_PORT | Port on which the `acm` dynamic plugin is served to OpenShift console | `npm run plugins` |

## Running as an OpenShift console plugin-in

See [Dynamic Plugins - Development](frontend/PLUGIN.md#development)

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Chrome

To develop with self signed certificates goto `chrome://flags/`and enable

-   Allow invalid certificates for resources loaded from localhost.
-   Insecure origins treated as secure.
    -   <http://localhost>

### Authentication

Frontend has a cookie `acm-access-token-cookie` that contains the user's token.

If the backend responds with a `401 Unauthorized` the frontend starts an OAuth flow to authorize with the cluster.

1. Frontend redirects to the backend `/login` endpoint.
2. Backend redirects to the cluster `/authorize` endpoint.
3. Cluster OAuth redirects back to the backend `/login/callback` endpoint.
4. Backend redirects to the frontend and sets the `acm-access-token-cookie`.

## Optional Features

In some cases there are development preview (Dev Preview) features or technical preview (Tech Preview) features that can optionally be enabled and used in the product. These features are enabled by updating the `console-config` configmap in the installation namepsace (default: `open-cluster-management`). The following features are available:

### Single node OpenShift

Enabling this feature will allow the user to create a cluster that only contains a single control plane node. This option is only available for providers AWS, Azure, GCP, OpenStack and VMware when the OpenShift release image is version 4.8 or higher.

## References

`console` is an add-on for the open-cluster-management community. For more information, visit: [open-cluster-management.io](https://open-cluster-management.io)

## Troubleshooting

### [webpack-cli] Failed to load './console/frontend/webpack.config.ts'

After executing the `npm start` command (either T the root level of the project or at `./frontend` folder) an error on `frontend` project is produced like

```
[start:frontend] [webpack-cli] Failed to load 'console/frontend/webpack.config.ts' config
[start:frontend] [webpack-cli] Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'console/frontend/src/lib/supportedLanguages' imported from console/frontend/webpack.config.ts
[start:frontend]     at finalizeResolution (node:internal/modules/esm/resolve:275:11)
[start:frontend]     at moduleResolve (node:internal/modules/esm/resolve:860:10)
[start:frontend]     at defaultResolve (node:internal/modules/esm/resolve:984:11)
[start:frontend]     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:719:12)
[start:frontend]     at #cachedDefaultResolve (node:internal/modules/esm/loader:643:25)
[start:frontend]     at #resolveAndMaybeBlockOnLoaderThread (node:internal/modules/esm/loader:678:38)
[start:frontend]     at ModuleLoader.resolveSync (node:internal/modules/esm/loader:701:52)
[start:frontend]     at #cachedResolveSync (node:internal/modules/esm/loader:662:25)
[start:frontend]     at ModuleLoader.getModuleJobForRequire (node:internal/modules/esm/loader:390:50)
[start:frontend]     at new ModuleJobSync (node:internal/modules/esm/module_job:342:34) {
[start:frontend]   code: 'ERR_MODULE_NOT_FOUND',
[start:frontend]   url: 'file://console/frontend/src/lib/supportedLanguages'
[start:frontend] }
[start:frontend] npm run start:frontend exited with code 2
```

This is due to wrond node/npm set of versions. See [Prerequisites section](#prerequisites)

### [start:backend] ERROR:Error reading service account token

After executing the `npm start` command (either at the root level of the project or at `./backend` folder) an error on `backend` project is produced like

```
[start:backend] ERROR:Error reading service account token
[start:backend] ERROR:process exit, code:1
[start:backend] [nodemon] app crashed - waiting for file changes before starting...
```

`./backend/.env` file is not present or it is wrongly produced. Please follow [Running section guidelines](#running).

### certs issues

The application starts up apparently normally but the browser produces an error `Error occurred while trying to proxy: localhost:3000/multicloud/login`

In the logs there are errors like

```
[start:frontend] (node:1777197) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 close listeners added to [Server]. MaxListeners is 10. Use emitter.setMaxListeners() to increase limit
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/username to https://localhost:4000/ [EPROTO] (https://nodejs.org/api/errors.html#errors_common_system_errors)
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/events to https://localhost:4000/ [EPROTO] (https://nodejs.org/api/errors.html#errors_common_system_errors)
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/authenticated to https://localhost:4000/ [EPROTO] (https://nodejs.org/api/errors.html#errors_common_system_errors)
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/events to https://localhost:4000/ [EPROTO] (https://nodejs.org/api/errors.html#errors_common_system_errors)
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/username to https://localhost:4000/ [EPROTO] (https://nodejs.org/api/errors.html#errors_common_system_errors)
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/hub to https://localhost:4000/ [EPROTO] (https://nodejs.org/api/errors.html#errors_common_system_errors)
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/authenticated to https://localhost:4000/ [EPROTO] (https://nodejs.org/api/errors.html#errors_common_system_errors)
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/login to https://localhost:4000/ [EPROTO] (https://nodejs.org/api/errors.html#errors_common_system_errors)
```

And if the logs are inspected right after running `npm start` command an error is produced

`[start:backend] ERROR:no certs`

The problems is about the certs not being generated properly, `./backend/certs` folder is most probably empty.

The solution is about to completely remove `./backend/certs` folder and then to execute `npm run ci:backend` at the root level of the project.

> Be sure openssl library is installed before running `npm run ci:backend` command.
