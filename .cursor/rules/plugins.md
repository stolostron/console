# Plugin Development Rules for ACM Console

## Dynamic Plugin Architecture

### Plugin Structure
- Separate ACM and MCE functionality in respective plugin directories
- Define plugin metadata in `console-plugin-metadata.ts`
- Register extensions in `console-extensions.ts`
- Use proper webpack configurations for plugin builds

### Plugin Metadata
```typescript
// ACM Plugin
export const pluginMetadata: ConsolePluginBuildMetadata = {
  name: 'acm',
  version: '2.15.0',
  displayName: 'Red Hat Advanced Cluster Management for Kubernetes',
  description: 'Integrates ACM functionality into OpenShift Console',
  exposedModules: {
    welcome: '../../src/routes/Home/Welcome/WelcomePlugin.tsx',
    overview: '../../src/routes/Home/Overview/OverviewPlugin.tsx',
    applications: '../../src/routes/Applications/ApplicationsPlugin.tsx',
    governance: '../../src/routes/Governance/GovernancePlugin.tsx',
  },
  dependencies: {
    '@console/pluginAPI': '>=4.15.0',
    mce: '>=2.10',
  },
}
```

### Extension Registration
- Use proper extension types from OpenShift Console SDK
- Implement navigation items, pages, and perspectives
- Register context providers appropriately
- Use proper code references for dynamic loading

### Shared Context
- Use SharedContext type with 'acm.shared-context' extension type
- Implement PluginDataContextProvider for data sharing
- Use PluginContext for accessing shared data and extensions
- Handle context updates through usePluginDataContextValue hook

### Plugin Communication
- **Shared Context**: Use `acm.shared-context` type for cross-plugin communication:
  ```typescript
  const sharedContext: EncodedExtension<SharedContext> = {
    type: 'acm.shared-context',
    properties: {
      id: 'mce-data-context',
      context: { $codeRef: 'context.PluginDataContext' },
    },
  }
  ```
- **Plugin Detection**: Use `useResolvedExtensions()` to detect available plugins
- **Data Sharing**: Share atoms, selectors, and utilities via plugin context

### Build Configuration
- Use separate webpack configurations for each plugin
- Implement proper code splitting
- Optimize bundle sizes
- Use appropriate chunk naming

### Testing Plugins
- Test plugin functionality in both modes
- Verify extension registration works
- Test shared context behavior
- Validate plugin metadata

### Plugin Deployment
- Build plugins with proper versioning
- Test plugin loading in OpenShift Console
- Verify plugin compatibility
- Handle plugin updates gracefully

### Performance Considerations
- Optimize plugin bundle sizes
- Use lazy loading for heavy components
- Implement proper code splitting
- Monitor plugin loading times

### Error Handling
- Handle plugin loading errors gracefully
- Provide fallback behavior when plugins fail
- Log plugin errors appropriately
- Implement proper error boundaries
