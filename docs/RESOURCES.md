# To add a new resource

1. Add a watch to `/backend/src/routes/events.ts` for the resource.
2. Add a resource definition in `/fronend/src/resources`.
3. Add recoil setup for the resource in `/frontend/src/atoms.tsx`.
4. In `frontend` use the resources by

    ```
    const [namespaces] = useRecoilState(namespacesState)
    ```

# Update console chart or backplane operator

Depending on where your change is made you also need to either update the RBAC role in [console-chart](https://github.com/stolostron/console-chart/) or [backplane-operator](https://github.com/stolostron/backplane-operator/) to add permission for the new resource.

### Console chart

Update this file `stable/console-chart/templates/console-clusterrole.yaml`.

### Backplane opeator

1. Update this file `pkg/templates/charts/toggle/console-mce/templates/console-clusterrole.yaml`
2. Run `go generate` to update the rbac_gen.go
3. Run `make bundle` to update the operator manifest
