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
main → release-2.13 → backplane-2.8
release-2.12 → backplane-2.7
release-2.11 → backplane-2.6
release-2.10 → backplane-2.5
release-2.9 → backplane-2.4
release-2.8 → backplane-2.3
```

## Core Dependencies - Release Branch Mapping

A number of the core NPM package dependencies are published from other repositories. To allow development of new features in these projects, branches are created each time a new release is started.

| console branch                          | patternfly-labs/react-form-wizard | stolostron/react-data-view | stolostron/ui-components | stolostron/temptifly |
| --------------------------------------- | --------------------------------- | -------------------------- | ------------------------ | -------------------- |
| main<br/>release-2.13<br/>backplane-2.8 | main                              | main                       | N/A                      | N/A                  |
| release-2.12<br/>backplane-2.7          | v1.32.z                           | v1.15.z                    | N/A                      | N/A                  |
| release-2.11<br/>backplane-2.6          | v1.29.z                           | v1.14.z                    | N/A                      | N/A                  |
| release-2.10<br/>backplane-2.5          | v1.27.z                           | v1.13.z                    | N/A                      | N/A                  |
| release-2.9<br/>backplane-2.4           | v1.26.z                           | v1.12.z                    | N/A                      | N/A                  |
| release-2.8<br/>backplane-2.3           | v1.23.z                           | v1.10.z                    | N/A                      | N/A                  |
| release-2.7<br/>backplane-2.2           | v1.13.z                           | v1.4.z                     | N/A                      | N/A                  |
| release-2.6<br/>backplane-2.1           | v1.8.z                            | v1.0.z                     | N/A                      | N/A                  |
| release-2.5<br/>backplane-2.0           | v1.7.z                            | N/A                        | v1.69.z                  | 2.5                  |
| release-2.4                             | N/A                               | N/A                        | v1.25.z                  | 2.4                  |
| release-2.3                             | N/A                               | N/A                        | v0.180.z                 | 2.3                  |
| release-2.2                             | N/A                               | N/A                        | No branch; uses 0.1.214  | 2.2                  |

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

    **NOTE:** If a port conflict appears with port `4000`, you can override it by exporting `BACKEND_PORT` with a 
    new value like `4001` and re-running the setup and start commands

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
