# PatternFly Rules for ACM Console

## Component Usage

### Core Components
- Always use PatternFly components instead of custom HTML
- Import from `@patternfly/react-core` and `@patternfly/react-icons`
- **EXCEPTION**: Use `../components/Truncate` instead of PatternFly's Truncate (ESLint enforced)
- Follow PatternFly design patterns and accessibility guidelines
- Use established PatternFly layout components

### Layout Structure
```typescript
import { 
  Page, 
  PageSection, 
  Stack, 
  StackItem,
  Split,
  SplitItem 
} from '@patternfly/react-core'

// Proper page structure
<Page>
  <PageSection variant="light">
    <Stack hasGutter>
      <StackItem>
        {/* Page content */}
      </StackItem>
    </Stack>
  </PageSection>
</Page>
```

### Styling Guidelines
- Do NOT modify PatternFly component styles with custom CSS
- Use PatternFly variants and modifiers instead
- Use emotion/css for custom styling when absolutely necessary
- Follow established CSS class naming conventions

### Data Display
- Use AcmTable for all tabular data with proper column definitions
- Implement pagination with AcmTablePaginationContextProvider
- Use AcmEmptyState for empty states with proper messaging
- Use AcmCountCard for dashboard-style data display

### Forms
- **AcmDataForm**: Multi-mode form component (form/wizard/details):
  ```typescript
  <AcmDataFormPage
    formData={formData}
    mode="wizard" // 'form' | 'wizard' | 'details'
    onSubmit={handleSubmit}
    onCancel={handleCancel}
  />
  ```
- **SyncEditor**: Monaco-based YAML editor with validation
- **TemplateEditor**: Complex template editing with control panels
- **Form Structure**: Use `FormData` with sections, inputs, and validation

### Navigation
- Use PatternFly navigation components
- Implement breadcrumbs for deep navigation
- Follow established routing patterns
- Use proper navigation state management

### Notifications
- Use AcmAlert components for notifications
- Implement proper toast notifications with AcmToastProvider
- Follow established alert severity patterns
- Use proper notification timing and dismissal

### Icons and Graphics
- Import icons from `@patternfly/react-icons`
- Use consistent icon sizing and placement
- Follow PatternFly icon usage guidelines
- Implement proper icon accessibility

### Responsive Design
- Use PatternFly's responsive utilities
- Test components on different screen sizes
- Implement proper mobile navigation patterns
- Use PatternFly's grid system appropriately
