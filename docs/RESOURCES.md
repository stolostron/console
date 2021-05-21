# To add a new resource

1. Add a watch to `/backend/src/routes/events.ts` for the resource.
2. Add a resource definition in `/fronend/src/resources`.
3. Add recoil setup for the resource in `/frontend/src/atoms.tsx`.
4. In `frontend` use the resources by

    ```
    const [namespaces] = useRecoilState(namespacesState)
    ```
