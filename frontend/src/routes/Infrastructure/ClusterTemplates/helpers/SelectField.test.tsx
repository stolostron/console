/* Copyright Contributors to the Open Cluster Management project */
import SelectField, { getFieldId } from './SelectField';
import { Formik } from 'formik';
import { render, screen } from '@testing-library/react';
import {
  clickByLabel,
  clickByText,
  waitForLabelText,
  waitForTestId,
  waitForText,
} from '../../../../lib/test-util';

describe('getFieldId', () => {
  test('returns correct field id generated from field name and type', () => {
    const expected = 'form-select-input-clusterName-field';
    expect(getFieldId('clusterName', 'select-input')).toEqual(expected);
  });
  test('it replaces dots in field name with dashes', () => {
    const expected = 'form-select-input-cluster-name-field';
    expect(getFieldId('cluster.name', 'select-input')).toEqual(expected);
  });
});

describe('SelectField', () => {
  const onChange = jest.fn();
  beforeEach(() => {
    render(
      <Formik initialValues={{ secretName: 'option1' }} onSubmit={jest.fn()}>
        <SelectField
          name="secretName"
          fieldId="secretName"
          label="Secret name"
          onChange={onChange}
          options={[
            {
              value: 'option1',
              disabled: false,
            },
            {
              value: 'option2',
              disabled: false,
            },
          ]}
        />
      </Formik>,
    );
  });
  test('renders a form group with select', async () => {
    await waitForText('Secret name');
    await waitForTestId('pf-select-toggle-id-0-select-typeahead');
    await waitForTestId('pf-select-toggle-id-0');
  });
  test('clears the selection when clicking the x button', async () => {
    expect(screen.getByLabelText('secretName')).toHaveValue('option1');
    await waitForLabelText('Clear all');
    await clickByLabel('Clear all');
    expect(screen.getByLabelText('secretName')).toHaveValue('');
  });
  test('changes the value when clicking on an option', async () => {
    expect(screen.getByLabelText('secretName')).toHaveValue('option1');
    await clickByLabel('Options menu');
    await clickByText('option2');
    expect(screen.getByLabelText('secretName')).toHaveValue('option2');
  });
  test('calls onChange callback when a value is selected', async () => {
    expect(screen.getByLabelText('secretName')).toHaveValue('option1');
    await clickByLabel('Options menu');
    await clickByText('option2');
    expect(screen.getByLabelText('secretName')).toHaveValue('option2');
    expect(onChange).toHaveBeenCalled();
  });
});
