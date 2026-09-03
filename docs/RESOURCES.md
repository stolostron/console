# To add a new resource

1. Add a watch to `/backend-node/src/routes/events.ts` for the resource (still required for Node aggregators / `getKubeResources`).
2. Add the same watch to `/backend/internal/informers/specs.go` `DefaultWatchSpecs()` so Go `GET /events` and the informer cache include it.
3. Add a resource definition in `/frontend/src/resources`.
4. Add recoil setup for the resource in `/frontend/src/atoms.tsx`.
5. In `frontend` use the resources by

    ```
    const namespaces = useRecoilValue(namespacesState)
    ```

# Update console chart or backplane operator

Depending on where your change is made you also need to either update the RBAC role in [console-chart](https://github.com/stolostron/console-chart/) or [backplane-operator](https://github.com/stolostron/backplane-operator/) to add permission for the new resource.

### Console chart

Update this file `stable/console-chart/templates/console-clusterrole.yaml`.

### Backplane opeator

1. Update this file `pkg/templates/charts/toggle/console-mce/templates/console-clusterrole.yaml`
2. Run `go generate` to update the rbac_gen.go
3. Run `make bundle` to update the operator manifest
