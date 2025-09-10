# Security Rules for ACM Console

## Authentication & Authorization

### Token Handling
- Use established cookie-based token authentication
- Validate tokens on all protected operations
- Implement proper token refresh mechanisms
- Handle token expiration gracefully

### RBAC Implementation
- Use RbacDropdown and RbacButton components from components/Rbac.tsx
- Use createSubjectAccessReview with ResourceAttributes for permission checks
- Use rbacCreate, rbacUpdate, rbacDelete helper functions from lib/rbac-util
- Handle unauthorized access with proper tooltip messages

### Permission Checking
```typescript
// Use RBAC components for permission checking
<RbacButton
  rbac={[rbacCreate(ClusterDefinition)]}
  onClick={handleCreateCluster}
>
  {t('Create cluster')}
</RbacButton>

// Or use createSubjectAccessReview directly
const rbacRequest = rbacCreate(ClusterDefinition, cluster.metadata?.namespace)
const result = await createSubjectAccessReview(rbacRequest).promise
const canCreate = result?.status?.allowed
```

## Input Validation

### User Input Sanitization
- Validate all user inputs on both client and server
- Sanitize inputs to prevent XSS attacks
- Use proper validation libraries (Yup, Joi)
- Implement consistent validation patterns

### API Parameter Validation
- Validate all API parameters
- Use proper type checking and constraints
- Implement rate limiting for API endpoints
- Handle malformed requests appropriately

## Data Security

### Sensitive Data Handling
- Never log sensitive information (tokens, passwords, keys)
- Use secure storage for sensitive data
- Implement proper data encryption where needed
- Follow established patterns for secret management

### API Security
- Use HTTPS for all communications
- Implement proper CORS policies
- Use secure headers and CSP policies
- Validate all API responses

## Frontend Security

### XSS Prevention
- Sanitize all user-generated content
- Use React's built-in XSS protection
- Avoid dangerouslySetInnerHTML unless absolutely necessary
- Validate and escape all dynamic content

### CSRF Protection
- Use established CSRF protection patterns
- Implement proper request validation
- Use secure cookie settings
- Validate request origins appropriately

## Kubernetes Security

### Resource Access
- Validate user permissions for all resource operations
- Use proper service account patterns
- Implement resource-level access control
- Handle unauthorized access gracefully

### Cluster Communication
- Use secure connections to managed clusters
- Validate cluster certificates and identities
- Implement proper cluster authentication
- Handle cluster communication errors securely

## Logging and Monitoring

### Security Logging
- Log security-relevant events
- Monitor for suspicious activities
- Implement proper audit trails
- Avoid logging sensitive information

### Error Handling
- Don't expose sensitive information in error messages
- Implement proper error sanitization
- Log security errors appropriately
- Handle errors gracefully without information disclosure

## Compliance

### Security Standards
- Follow Red Hat security guidelines
- Implement industry security best practices
- Regular security audits and reviews
- Keep dependencies updated for security patches
