# ACM-Console Goals

## Long Term Goals

- Integrate with OCP 4.10 using the OCP dynamic plugin architecture.
- Support ACM back to OCP 4.6 without dynamic plugins

## NPM Workspaces

Convert the ACM Console repo to use npm workspaces.

This will enable each route in acm to be compiled and developed as an indiviual project, but allow all the routes to be pulled together in a single frontend.

## ACM Dynamic Plugins

In addition to building a single frontend, the build should expose each route as a dynamic plugin whicch can be loaded in OCP 4.10.

This involves pulling in the OCP dynamic plugin SDK and building using webpack. Each route is exposed as a federated module and injected into the OCP console by configuring json that tells OCP where to inject the module.

- OCP 4.9 will not support dynamic proxies so initially targeting 4.10 unless a workaround can be found.

## Tasks

|      Status | Issue                                                                     | Description                        | Assigned |
| ----------: | ------------------------------------------------------------------------- | ---------------------------------- | -------- |
|             | [#12087](https://github.com/open-cluster-management/backlog/issues/12087) | Fix strong type checking           |
|      Review |                                                                           | Support NPM workspaces             | James    |
| In Progress |                                                                           | Resource routes                    | James    |
|     Blocked |                                                                           | Credentials/Infrastructure routes  | James    |
| In Progress | [#12644](https://github.com/open-cluster-management/backlog/issues/12644) | Webpack 5 federated modules        | James    |
|     Blocked |                                                                           | Credentials/Infrastructure plugins | James    |
