# Testing Rules for ACM Console

## Test Structure

### File Organization
- Place test files adjacent to source files
- Use `.test.tsx` for React component tests
- Use `.test.ts` for utility function tests
- Follow established test naming conventions

### Test Setup
- Import React Testing Library directly: `import { render, screen, waitFor } from '@testing-library/react'`
- **Accessibility Testing**: `jest-axe` required in every component test:
  ```typescript
  test('has zero accessibility defects', async () => {
    const { container } = render(<Component />)
    expect(await axe(container)).toHaveNoViolations()
  })
  ```
- **User Interactions**: `@testing-library/user-event` for all user actions
- Mock external dependencies and use proper test setup with setupTests.ts

### Required Tests
Every component must have:
```typescript
describe('ComponentName', () => {
  test('renders correctly', () => {
    const { getByText } = render(<ComponentName />)
    expect(getByText('Expected Text')).toBeInTheDocument()
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<ComponentName />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

### Accessibility Testing
- Use jest-axe for all component tests
- Test keyboard navigation
- Test screen reader compatibility
- Verify ARIA attributes and roles

### Internationalization Testing
- Test all translation keys exist
- Verify text rendering with different locales
- Test text overflow and wrapping
- Use proper i18n test setup

### State Testing
- Mock Recoil atoms via `useSharedAtoms()`, avoid direct imports
- Keep mocks simple and focused on the specific functionality being tested
- Test server-side events and resource watching
- Verify atom state updates and synchronization

### User Interaction Testing
- Use `user` returned from userEvent for interactions instead of `fireEvent`
- Use `waitFor` for async operations and state updates
- Test form submissions and validation
- Test button clicks and navigation
- Verify modal and dialog interactions
- Test error states and loading states in components

### API Testing & Mocking
- Mock external dependencies and API calls consistently
- Use `jest.mock` at the module level for consistent mocking
- Use `jest.spyOn` for mocking specific methods while preserving others
- Use `jest.clearAllMocks()` in `beforeEach` or `afterEach` hooks
- Avoid mocking child React components unless necessary for isolation
- Test proxy routes and managed cluster communication
- Mock SubjectAccessReview calls for RBAC testing
- Test server-side event streams and resource watching

### Testing Best Practices
- Follow the Arrange-Act-Assert pattern when writing unit tests
- Write descriptive test names that clearly describe what is being tested
- Test behavior, not implementation details
- Use the appropriate query priority: `getByRole`, `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`, `getByAltText`, `getByTitle`, `getByTestId`
- Test custom hooks with `renderHook` when isolated testing is needed
- Create meaningful test fixtures and move them to separate fixture files
- Use descriptive assertion messages when the test failure might be unclear
- Avoid try/catch blocks in unit tests

### Integration Testing
- Test complete user workflows
- Verify component interactions
- Test routing and navigation
- Test plugin integration scenarios

### Coverage Requirements
- Frontend: Comprehensive coverage collection configured in jest.config.ts
- Backend: Coverage enabled but thresholds set to 0 (flexible approach)
- Focus on testing critical user workflows and business logic
- Prioritize accessibility and error state testing over percentage targets
- Use `collectCoverageFrom` patterns to include relevant source files
