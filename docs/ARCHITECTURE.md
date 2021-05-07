[comment]: # ( Copyright Contributors to the Open Cluster Management project )

# Console Architecture

## Backend

| Method | Path    | Description                                      |
| -----: | ------- | ------------------------------------------------ |
|    ALL | /api    | Proxy request to cluster /api                    |
|    ALL | /apis   | Proxy request to cluster /apis                   |
|    GET | /events | Server side event stream of kubernetes resources |

### Kubernets Cluster API Proxy

The proxy is a passthough to the kubernetes cluster api.

Http requests and responses are streams of data. NodeJS supports piping a request into another request and the response backing the orignial request as the response.

This allows up to proxy requests to a kubernetes cluster very efficiently. As data is streaming out of the cluster it is passing though the backend and reaching the client.

[PROXY CODE](../backend/src/routes/proxy.ts)

#### Q: Why not call the cluster api directly?

For security the frontend javascript should never have access to the tokens used for authentication. By using a secure http only cookie the frontend can use a token without the frontend javascript being able to access the token.

The backend will use the token in the cookie for the proxy request ensuring RBAC enforcement.

#### Q: What is backpressure?

NodeJS handles the stream backpressure, errors, and cleanup.

Backpressure is when data is written to a stream faster than the stream can handle the data. NodeJS ends up buffering up the data, but these buffers never go away, increasing the resident memory of the process. The buffers are reused, but the memory footprint never goes back down.

### Server Side Events

[Server side events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) allow for streaming of changes to a client. It is a http request that stays open and new changes are streamed across. Newlines in the stream indicate the parts of the events. Web browsers [nativly](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) support server side events. Server side events also allow clients to efficiently reconnect and only get newer events and not reload all events.

The backend uses the Kubernetes cluster API to watch resources that are changing in the cluster. Every event sent to a client is RBAC checked for access before being sent. This is done with `SelfSubjectAccessReview` requests.

The backend makes the RBAC checks using an efficient promise chain.

```
 return canListClusterScopedKind(resource, token)
   .then((allowed) => {
      if (allowed) return true
      return canListNamespacedScopedKind(resource, token)
        .then((allowed) => {
          if (allowed) return true
          return canGetResource(resource, token)
        })
    })
```
