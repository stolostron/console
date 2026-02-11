# Backend Rules for ACM Console

## API Development

### Route Structure
- Use find-my-way router with maxParamLength: 500 for long resource names:
  ```typescript
  export const router = Router<Router.HTTPVersion.V2>({ maxParamLength: 500 })
  router.get('/api/v1/events', events)
  router.all('/api/v1/proxy/*', proxy)
  router.get('/managedclusterproxy/*', managedClusterProxy)
  ```
- Route handler signature: `(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void>`
- URL rewriting for multicloud paths: `/multicloud` → `/`, `/multicloud/path` → `/path`

### Authentication & Authorization
- Validate tokens on all protected routes
- Use SubjectAccessReview for permission checks
- Implement proper RBAC patterns
- Handle authentication errors gracefully

### Resource Management
- Use established resource utility functions
- Implement proper Kubernetes API proxying
- Follow resource watching patterns
- Handle resource events efficiently

### Error Handling
```typescript
try {
  const result = await performOperation()
  return { success: true, data: result }
} catch (error) {
  logger.error('Operation failed', { error: error.message })
  return { 
    success: false, 
    error: getErrorMessage(error),
    statusCode: getStatusCode(error)
  }
}
```

### Logging
- Use structured logging with pino
- Log at appropriate levels (error, warn, info, debug)
- Include relevant context in log messages
- Avoid logging sensitive information

### Performance
- Use `pipeline()` from 'stream' for all proxy operations:
  ```typescript
  pipeline(
    req,
    request(options, (response) => {
      res.writeHead(response.statusCode ?? 500, responseHeaders)
      pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
    }),
    (err) => { if (err) logger.error(err) }
  )
  ```
- HTTP/2 server with connection tracking and graceful shutdown
- Server-side event compression with `getEncodeStream()`

### Security
- Validate all input parameters
- Sanitize user inputs to prevent injection
- Use secure headers and CORS policies
- Implement rate limiting where appropriate

### Configuration
- Load settings from config files in config/ directory
- Use environment variables like CLUSTER_API_URL, NODE_ENV
- Settings are watched and updated dynamically
- Feature flags are managed through MultiClusterHub components

### Health Checks
- Implement proper health check endpoints
- Monitor external service dependencies
- Provide detailed health status information
- Use appropriate health check intervals

### API Documentation
- Document all endpoints with proper schemas
- Include request/response examples
- Document authentication requirements
- Maintain up-to-date API specifications
