# PatternFly Labs React Form Wizard [![GitHub package.json version](https://img.shields.io/github/package-json/v/patternfly-labs/react-form-wizard)](https://www.npmjs.com/package/@patternfly-labs/react-form-wizard)

An opinionated framework for wizards using [PatternFly](https://www.patternfly.org/).

[Demo](https://patternfly-labs.github.io/react-form-wizard/)

## Installation

### Install dependencies

#### Using npm

```sh
npm install @patternfly-labs/react-form-wizard @patternfly/react-core @patternfly/react-styles
```

#### Using yarn

```
yarn add @patternfly-labs/react-form-wizard @patternfly/react-core @patternfly/react-styles
```

### Setup Patternfly CSS

Import css from patternfly before importing react-form-wizard.

```typescript
import '@patternfly/react-core/dist/styles/base.css'
import '@patternfly/react-styles/css/components/Wizard/wizard.css'
```

## Concepts

### Wizard structure

A wizard contains steps which contain sections which contain inputs.

```tsx
import { WizardPage, Step, Section, TextInput, Select } from '@patternfly-labs/react-form-wizard'

function Example() {
   return (
      <WizardPage title="My Wizard">
         <Step label="Details" id="details-step">
            <Section label="Details">
               <TextInput label="Name" path="name" required />
               <Select label="Namespace" path="namespace" options={['default', 'namespace-1']} />
            </Section>
         </Step>
      </WizardPage>
   )
}
```

### Item Context

The wizard works by setting an item context which inputs use as a data source.
Inputs then get value or set value in the item context using [path](https://github.com/jonschlinkert/set-value#object-paths) notation.

```tsx
function Example() {
   return (
      <TextInput label="Name" path="metadata.name" required />
   )
}
```

Some inputs can change the item context, such as the `ArrayInput`.

```tsx
function Example() {
   return (
      <ArrayInput path="resources" placeholder="Add new resource">
         <TextInput label="Name" path="metadata.name" required />
         <Select label="Namespace" path="metadata.namespace" options={['default']} required/>
      </ArrayInput>
   )
}
```

### Working with an array of items

The root data can either be an object or an array of objects.
When working with an array of objects an`ItemSelector` can be used to set the item context specific item.

```tsx
function Example() {
   return (
      <ItemSelector selectKey="kind" selectValue="Application">
         <TextInput label="Name" path="metadata.name" required />
         <Select label="Namespace" path="metadata.namespace" options={['default']} required/>
      </ItemSelector>
   )
}
```

`ArrayInput` can also be used to work with a subset of items in this case.

```tsx
function Example() {
   return (
      <ArrayInput path={null} filter={(item) => item.kind === 'Subscription'}>
         <TextInput label="Name" path="metadata.name" required />
         <Select label="Namespace" path="metadata.namespace" options={['default']} required/>
      </ArrayInput>
   )
}
```

### Input common properties

- **label** - The label for the input.
- **path** - The [path](https://github.com/jonschlinkert/set-value#object-paths) the input is getting and setting value to, in the current item context.
- **id** - Optional id of the input control. Used for testing. If not set, defaults to a sanitized version of the path.
- **validation** - Optional validation function that takes in the current item context and input value. It should return an error string if there is an error.
- **hidden** - Optional hidden function that takes in the current item context and returns true if the input should be hidden.

### Validation

Inputs take an optional validation function. The validation function takes in the current item context and input value. It should returns a validation error string if the validation fails.

### Conditional hiding

Inputs take an optional hidden function. The hidden function takes in the current item context, and returns true if the input should be hidden.

`Steps` and `Sections` automatically hide if all its inputs are hidden. This makes it easy to make a wizard with conditional flow.

### Examples

See the [wizards](https://github.com/patternfly-labs/react-form-wizard/tree/main/wizards) directory for example wizards.

## Development

> If you plan on contributing, please fork the repo and create a pull request using your fork.

1. Clone the repo

   ```
   git clone git@github.com:patternfly-labs/react-form-wizard.git
   ```

2. Install dependencies

   ```
   npm ci
   ```

3. Start the project

   ```
   npm start
   ```
