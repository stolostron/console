# Dynamic Plugin

## OCP Console

Checkout <https://github.com/openshift/console>

### Running OCP Console in development mode

Build OCP Console

```
./build.sh
```

Start ocp console bridge with plugin and proxy

```
source ./contrib/oc-environment.sh 
```

```
./bin/bridge -plugins acm-plugin=http://localhost:3000 --plugin-proxy='{"services":[{"consoleAPIPath":"/api/proxy/namespace/open-cluster-management/service/serviceName:9991/","endpoint":"https://localhost:4000","authorize":true}]}'
```

Bridge variables can also be passes in as environment variables

```
BRIDGE_PLUGIN_PROXY='{"services":[{"consoleAPIPath":"/api/proxy/namespace/open-cluster-management/service/serviceName:9991/","endpoint":"https://localhost:4000","authorize":true}]}'
```

## Dynamic Plugin support for getting resources

Q: What support does OCP have for realtime data with websockets?

> `useWatchK8sResource` and `useWatchK8sResources` are the utilities we have right now for that

```
const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: {
        group: 'console.openshift.io',
        version: 'v1',
        kind: 'ConsoleLink',
    },
    isList: true,
    namespaced: false,
});
```
