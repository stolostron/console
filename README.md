[comment]: # ' Copyright Contributors to the Open Cluster Management project '

# @stolostron/console

[![License](https://img.shields.io/:license-apache-blue.svg)](http://www.apache.org/licenses/LICENSE-2.0.html)
[![Build](https://img.shields.io/badge/build-Prow-informational)](https://prow.ci.openshift.org/?repo=stolostron%2Fconsole)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=coverage&token=678092fc6e15fad203b8883681417cca4c477c6b)](https://sonarcloud.io/dashboard?id=open-cluster-management_console)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=open-cluster-management_console)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=open-cluster-management_console)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=open-cluster-management_console)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=open-cluster-management_console&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=open-cluster-management_console)

## What is console?

The console provides the user interface for [Red Hat Advanced Cluster Management](https://www.redhat.com/en/technologies/management/advanced-cluster-management) (ACM) for Kubernetes and [Red Hat MultiCluster Engine](https://docs.redhat.com/en/documentation/red_hat_advanced_cluster_management_for_kubernetes/2.12/html/about/welcome-to-red-hat-advanced-cluster-management-for-kubernetes#multicluster_engine_operator) (MCE). It is delivered as two [OpenShift Console dynamic plugins](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/README.md) — one for ACM features and one for MCE features — that integrate into the OpenShift Console.

The ConsolePlugin resource manifests used by the product installers can be found here:
- **ACM plugin**: [multiclusterhub-operator ConsolePlugin](https://github.com/stolostron/multiclusterhub-operator/blob/main/pkg/templates/charts/toggle/console/templates/console-plugin.yaml)
- **MCE plugin**: [backplane-operator ConsolePlugin](https://github.com/stolostron/backplane-operator/blob/main/pkg/templates/charts/toggle/console-mce/templates/console-plugin.yaml)

Go to the [Contributing guide](CONTRIBUTING.md) to learn how to get involved.

## Prerequisites

- [Node.js](https://nodejs.org) 20
- NPM 8
- [oc](https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html) (OpenShift CLI)
- [podman](https://podman.io/) or [docker](https://www.docker.com/) (required for `npm run plugins`)
- [jq](https://stedolan.github.io/jq/download/)

## Active Release Branches

The same codebase is used to build images for **Red Hat Advanced Cluster Management for Kubernetes** (from `release-*` branches) and **multicluster engine for Kubernetes** (from `backplane-*` branches). The build system fast-forwards between branches to keep the content in sync. Pull requests should only be opened against the first branch in each line listed below. The arrow represents an automatic fast-forwarding of commits from one branch to the next.

```
main → release-2.17 → backplane-2.17
release-2.16 → backplane-2.11
release-2.15 → backplane-2.10
release-2.14 → backplane-2.9
release-2.13 → backplane-2.8
release-2.12 → backplane-2.7
release-2.11 → backplane-2.6
```

## Core Dependencies - Release Branch Mapping

A number of the core NPM package dependencies are published from other repositories. To allow development of new features in these projects, branches are created each time a new release is started.

| console branch                           | patternfly-labs/react-form-wizard | stolostron/react-data-view |
| ---------------------------------------- | --------------------------------- | -------------------------- |
| main<br/>release-2.17<br/>backplane-2.17 | N/A                               | main                       |
| release-2.16<br/>backplane-2.11          | N/A                               | v2.6.z                     |
| release-2.15<br/>backplane-2.10          | no longer used, now integrated    | v2.5.z                     |
| release-2.14<br/>backplane-2.9           | v2.7.z                            | v2.4.z                     |
| release-2.13<br/>backplane-2.8           | v2.4.z                            | v2.3.z                     |
| release-2.12<br/>backplane-2.7           | v1.32.z                           | v1.15.z                    |
| release-2.11<br/>backplane-2.6           | v1.29.z                           | v1.14.z                    |
| release-2.10<br/>backplane-2.5           | v1.27.z                           | v1.13.z                    |
| release-2.9<br/>backplane-2.4            | v1.26.z                           | v1.12.z                    |

## Running (Recommended: OpenShift Console Plugins)

The recommended way to run the console for development is as OpenShift Console dynamic plugins using `npm run plugins`. This mode runs the ACM and MCE plugins inside a local OpenShift Console container, matching how the product is deployed in production. **Always test new work in this mode before submitting changes** to ensure production functionality.

### Setup

1. Clone the repository

2. Install dependencies

    ```
    npm ci
    ```

3. Configure environment

    You need:
    - to be connected to an OpenShift 4.x cluster
    - to have Red Hat Advanced Cluster Management or multicluster engine for Kubernetes installed on the cluster

    ```
    npm run setup
    ```

    This will create a `.env` file in the `backend` directory containing environment variables for the cluster connection.

4. Start the console plugins

    ```
    npm run plugins
    ```

    This concurrently starts the backend server, the frontend webpack development server (serving both ACM and MCE plugins), and a local OpenShift Console container. The console will be available at **http://localhost:9000**.

### Options

To specify the version of OpenShift Console to run:

```
CONSOLE_VERSION=4.19 npm run plugins
```

If you are running other OpenShift Console plugins locally (e.g. [kubevirt-plugin](https://github.com/kubevirt-ui/kubevirt-plugin), [odf-console](https://github.com/red-hat-storage/odf-console), or [gitops-plugin](https://github.com/redhat-developer/gitops-console-plugin)), you can have them loaded into the OpenShift Console as well by specifying the port they are served on:

```
KUBEVIRT_PORT=9001 npm run plugins
```

For additional plugin development details, including running against a locally-built OpenShift Console, see [PLUGIN.md](frontend/PLUGIN.md).

## Running (Alternative: Standalone Console)

The `npm start` command runs a standalone development console that **does not** require OpenShift Console or a container runtime. It can be faster and simpler to start up, but it does not use the dynamic plugin SDK and cannot exercise any OpenShift Console integration features. There may also be styling differences compared to the plugin mode.

Use this mode for rapid iteration on features that don't depend on OpenShift Console APIs, but **always verify your work with `npm run plugins` before submitting**.

```
npm run setup   # if not already done
npm start
```

The standalone console will be available at **https://localhost:3000** and a browser tab will be opened automatically.

## Port Configuration

All ports are customizable via environment variables. The default values are defined in [port-defaults.sh](port-defaults.sh). Several of these ports are used during setup.

| Port Variable  | Default | Description                                                                         | Used by                         |
| -------------- | ------- | ----------------------------------------------------------------------------------- | ------------------------------- |
| FRONTEND_PORT  | 3000    | Port for standalone console (access at https://localhost:FRONTEND_PORT)              | `npm run setup`, `npm start`    |
| BACKEND_PORT   | 4000    | Port for the backend APIs used by both standalone and plugin modes                  | `npm run setup`, `npm start`, `npm run plugins` |
| CONSOLE_PORT   | 9000    | Port for OpenShift Console (access at http://localhost:CONSOLE_PORT)                | `npm run setup`, `npm run plugins` |
| MCE_PORT       | 3001    | Port on which the `mce` dynamic plugin is served to OpenShift Console               | `npm run plugins`               |
| ACM_PORT       | 3002    | Port on which the `acm` dynamic plugin is served to OpenShift Console               | `npm run plugins`               |

**NOTE:** If any port conflict appears or you want to run different versions of the console simultaneously, override the relevant port variables before running.

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md)

### Chrome

To develop with self-signed certificates go to `chrome://flags/` and enable:

- Allow invalid certificates for resources loaded from localhost.
- Insecure origins treated as secure.
    - <http://localhost>

### Authentication

Frontend has a cookie `acm-access-token-cookie` that contains the user's token.

If the backend responds with a `401 Unauthorized` the frontend starts an OAuth flow to authorize with the cluster.

1. Frontend redirects to the backend `/login` endpoint.
2. Backend redirects to the cluster `/authorize` endpoint.
3. Cluster OAuth redirects back to the backend `/login/callback` endpoint.
4. Backend redirects to the frontend and sets the `acm-access-token-cookie`.

## Optional Features

In some cases there are development preview (Dev Preview) features or technical preview (Tech Preview) features that can optionally be enabled and used in the product. These features are enabled by updating the `console-config` configmap in the installation namespace (default: `open-cluster-management`). The following features are available:

### Single node OpenShift

Enabling this feature will allow the user to create a cluster that only contains a single control plane node. This option is only available for providers AWS, Azure, GCP, OpenStack and VMware when the OpenShift release image is version 4.8 or higher.

## References

`console` is an add-on for the open-cluster-management community. For more information, visit: [open-cluster-management.io](https://open-cluster-management.io)

## Development

### Feature Flags

It is possible to enable/disable certain features by changing `spec.overrides.components[*].enabled` values from the ACM MultiClusterHub. In order to take a particular flag into account just add a new entry to `FEATURE_FLAGS` from `frontend/src/utils/flags/consts.ts` file, meaning the key as the name for the feature flag on console application side, and the value as the `spec.overrides.components[*].name`.


## Troubleshooting

### Apple Silicon (ARM64) podman crash: `lfstack.push`

When running `npm run plugins` (or `npm run ocp-console`) on a Mac with an Apple Silicon chip, the OpenShift Console container may crash immediately with an error like:

```
runtime: lfstack.push invalid packing: node=0xffff812aec40 cnt=0x1 packed=0xffff812aec400001 -> node=0xffffffff812aec40
fatal error: lfstack.push
```

This is caused by incompatibility between the Rosetta x86 emulation layer in the podman machine's Linux kernel and newer versions of podman. The fix depends on your macOS version:

- **macOS 15 (Sequoia)**: The last working version of podman is **5.5.2**. Downgrade your podman machine to this version or earlier. After installing podman 5.5.2, recreate your podman machine (`podman machine rm` / `podman machine init` / `podman machine start`).

- **macOS 26 (Tahoe)**: Apple has fixed the underlying Rosetta issue, but podman 5.6+ ships with Rosetta disabled by default. You can re-enable it by following the instructions in the [Podman 5.6 release blog post](https://blog.podman.io/2025/08/podman-5-6-released-rosetta-status-update/).

### `[webpack-cli] Failed to load './console/frontend/webpack.config.ts'`

After executing the `npm start` command (either at the root level of the project or at `./frontend` folder) an error on `frontend` project is produced like

```
[start:frontend] [webpack-cli] Failed to load 'console/frontend/webpack.config.ts' config
[start:frontend] [webpack-cli] Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'console/frontend/src/lib/supportedLanguages' imported from console/frontend/webpack.config.ts
```

This is due to wrong node/npm set of versions. See [Prerequisites section](#prerequisites).

### `[start:backend] ERROR:Error reading service account token`

After executing the `npm start` command (either at the root level of the project or at `./backend` folder) an error on `backend` project is produced like

```
[start:backend] ERROR:Error reading service account token
[start:backend] ERROR:process exit, code:1
[start:backend] [nodemon] app crashed - waiting for file changes before starting...
```

`./backend/.env` file is not present or it is wrongly produced. Please follow [Running section guidelines](#running-recommended-openshift-console-plugins).

### Certs issues

The application starts up apparently normally but the browser produces an error `Error occurred while trying to proxy: localhost:3000/multicloud/login`

In the logs there are errors like

```
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/username to https://localhost:4000/ [EPROTO]
[start:frontend] <e> [webpack-dev-server] [HPM] Error occurred while proxying request localhost:3000/multicloud/login to https://localhost:4000/ [EPROTO]
```

And if the logs are inspected right after running `npm start` command an error is produced:

`[start:backend] ERROR:no certs`

The problem is about the certs not being generated properly, `./backend/certs` folder is most probably empty.

The solution is to completely remove `./backend/certs` folder and then execute `npm run ci:backend` at the root level of the project.

> Be sure openssl library is installed before running `npm run ci:backend` command.

## Related Packages

### Multicluster SDK

The [Multicluster SDK for OpenShift Console](frontend/packages/multicluster-sdk/README.md) provides extensions and APIs that dynamic plugins can use to leverage multicluster capabilities provided by Red Hat Advanced Cluster Management. It aims to provide similar functionality to the dynamic plugin SDK but for multicluster scenarios.

For complete documentation and usage examples, see the [Multicluster SDK README](frontend/packages/multicluster-sdk/README.md).

[![npm version](https://img.shields.io/npm/v/@stolostron/multicluster-sdk.svg?style=flat-square)](https://www.npmjs.com/package/@stolostron/multicluster-sdk)
