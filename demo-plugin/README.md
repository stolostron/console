# Demo Plugin for ACM extension

## Local development

1. `yarn install` to install plugin dependencies
2. `yarn build-dev` to build the plugin, generating output to `dist` directory
3. `yarn start` to start the server
4. Follow the [acm dynamic plugin](/frontend/PLUGIN.md) document to deploy acm console plugin on local.
5. Makesure the OCP bridge command has the demo-plugin proxy

   ```sh
   ./bin/bridge -plugins demo-plugin=http://localhost:9001/
   ```

## Deployment on cluster

1. Build the image:

   ```sh
   docker build -f Dockerfile -t <image-tag> .
   ```

2. Push the image to image registry:

   ```sh
   docker push <image-tag>
   ```

3. Edit the image path and apply the yaml:

   ```sh
   oc apply -f oc-manifest.yaml
   ```

### Enabling the plugin

Demo plugin must be enabled before it can be loaded by Console.

To enable the plugin manually, edit [Console operator](https://github.com/openshift/console-operator)
config and make sure the plugin's name is listed in the `spec.plugins` sequence (add one if missing):

```sh
oc patch console.operator.openshift.io cluster --type json --patch  '[{ "op": "add", "path": "/spec/plugins/-", "value": "demo-plugin" }]'
```
