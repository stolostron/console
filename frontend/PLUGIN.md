# OpenShift Console Plugin Development

This repository delivers two [OpenShift Console dynamic plugins](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/README.md):

- **ACM** (`frontend/plugins/acm`) — Red Hat Advanced Cluster Management features
- **MCE** (`frontend/plugins/mce`) — MultiCluster Engine features

For a quick-start guide, see the [Running section in README.md](../README.md#running-recommended-openshift-console-plugins).

## Running console as OCP dynamic plugins

From the root of the `console` repository, make sure your kubecontext is set to a hub cluster, then run:

```
npm run setup
npm run plugins
```

This concurrently starts the backend server, frontend webpack development server, and a local OpenShift Console container.

The console will be running at http://localhost:9000 (or the value of `CONSOLE_PORT`).

### Loading additional plugins

If you are running [kubevirt-plugin](https://github.com/kubevirt-ui/kubevirt-plugin), [odf-console](https://github.com/red-hat-storage/odf-console), or [gitops-plugin](https://github.com/redhat-developer/gitops-console-plugin), you can have them loaded into the OpenShift Console as well by specifying the port they are served on with the `KUBEVIRT_PORT`, `ODF_PORT`, or `GITOPS_PORT` environment variables, respectively.

```
KUBEVIRT_PORT=9001 npm run plugins
```

### Specifying OpenShift Console version

To specify the version of OpenShift Console to run, set the `CONSOLE_VERSION` environment variable.

```
CONSOLE_VERSION=4.19 npm run plugins
```

## Running against a local development build of OCP Console

If you need to test against a locally-built OpenShift Console (instead of the container image), use:

```
npm run setup
npm run plugins-dev
```

This starts the backend server and frontend webpack development server, but does **not** start the OpenShift Console container. You are responsible for building and running the OCP Console bridge yourself.

### Building and running OCP Console locally

Clone and build the [OCP Console](https://github.com/openshift/console) repository. Ensure that its [dependencies](https://github.com/openshift/console#dependencies) are met in your local environment.

```
git clone git@github.com:openshift/console.git
cd console
./build.sh
```

Start the OCP Console bridge with the ACM and MCE plugins registered:

```
source ./contrib/oc-environment.sh
./bin/bridge \
  -plugins mce=http://localhost:3001 \
  -plugins acm=http://localhost:3002 \
  --plugin-proxy='{"services":[{"consoleAPIPath":"/api/proxy/plugin/mce/console/","endpoint":"https://localhost:4000","authorize":true},{"consoleAPIPath":"/api/proxy/plugin/acm/console/","endpoint":"https://localhost:4000","authorize":true}]}'
```

The console will be running at http://localhost:9000.

Bridge variables can also be passed as environment variables:

```
BRIDGE_PLUGIN_PROXY='{"services":[{"consoleAPIPath":"/api/proxy/plugin/mce/console/","endpoint":"https://localhost:4000","authorize":true},{"consoleAPIPath":"/api/proxy/plugin/acm/console/","endpoint":"https://localhost:4000","authorize":true}]}'
```

**Note:** With recent post-4.10 builds, you need to run OpenShift Console with authentication for authorization to work with the proxied services. Follow [these instructions](https://github.com/openshift/console#openshift-with-authentication). Alternatively, you can revert a commit that regressed the ability to use proxies that require authorization when running without authentication and continue with the instructions above:

```
git revert 1230920afbcd7cbc1d2f0c6b1e48744c72eb60be -m 1 -n
```

## Further Reading

- [OpenShift Console Dynamic Plugin SDK](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/README.md) — comprehensive documentation on building dynamic plugins, shared modules, webpack configuration, and i18n
- [ACM ConsolePlugin manifest](https://github.com/stolostron/multiclusterhub-operator/blob/main/pkg/templates/charts/toggle/console/templates/console-plugin.yaml) — the Helm template used by the ACM installer
- [MCE ConsolePlugin manifest](https://github.com/stolostron/backplane-operator/blob/main/pkg/templates/charts/toggle/console-mce/templates/console-plugin.yaml) — the Helm template used by the MCE installer
- [Multicluster SDK](../frontend/packages/multicluster-sdk/README.md) — APIs for multicluster-aware dynamic plugins
