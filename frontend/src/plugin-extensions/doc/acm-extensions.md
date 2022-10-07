# ACM Plugin Extension Types

1.  [`acm.application/action`](#acmapplicationaction)
2.  [`acm.application/list/column`](#acmapplicationlistcolumn)

---

## `acm.application/action`

### Summary

Application action is used to add extra actions for the applications.

### Properties

| Name             | Value Type                                                                    | Optional | Description                                                                                    |
| ---------------- | ----------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| `id`             | `string`                                                                      | no       | Action identifier                                                                              |
| `tooltip`        | `string`                                                                      | yes      | Display a tooltip for the action                                                               |
| `tooltipProps`   | `React.ReactNode`                                                             | yes      | Additional tooltip props forwarded to tooltip component                                        |
| `addSeparator`   | `boolean`                                                                     | yes      | Inject a separator horizontal rule immediately before an action invoked                        |
| `isAriaDisabled` | `boolean`                                                                     | yes      | Display an action as being ariaDisabled                                                        |
| `isDisabled`     | `any`                                                                         | yes      | Display an action as being disabled                                                            |
| `title`          | `string \| React.ReactNode`                                                   | yes      | Visible text for action                                                                        |
| `model`          | `{apiVersion: string, kind: string}[]`                                        | yes      | Represent for which application type this action belongs. The default action type is OpenShift |
| `component`      | `React.ComponentType<{ isOpen: boolean; close: () => void; resource?: any }>` | no       | A callback modal component when the action is invoked                                          |

---

## `acm.application/list/column`

### Summary

Application list column is used to add an extra column for the application list page.

### Properties

| Name             | Value Type                                | Optional | Description                                  |
| ---------------- | ----------------------------------------- | -------- | -------------------------------------------- |
| `header`         | `string`                                  | no       | The header of the column                     |
| `tooltip`        | `React.ReactNode`                         | yes      | Display a tooltip for the column             |
| `transforms`     | `ITransform[]`                            | yes      | Transformations applied to the column        |
| `cellTransforms` | `ITransform[]`                            | yes      | Transformations applied to the column's body |
| `cell`           | `React.ComponentType<{ resource?: any }>` | no       | A callback component for the column's body   |
