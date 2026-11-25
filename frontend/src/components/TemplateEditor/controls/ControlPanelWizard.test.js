/* Copyright Contributors to the Open Cluster Management project */
import {
  getMaxEnabledStepIndex,
  hasIncompleteRequiredControls,
  isRequiredValueMissing,
} from './ControlPanelWizard'

describe('ControlPanelWizard required-field gating', () => {
  describe('getMaxEnabledStepIndex', () => {
    const step = (id, controls, extras = {}) => ({
      title: { id, type: 'step', title: id, ...extras },
      sections: [],
      controls,
    })
    const strict = { validateRequiredFields: true }

    it('by default ignores empty required fields (legacy mustValidate-only gating)', () => {
      expect(
        getMaxEnabledStepIndex([
          step('details', [{ id: 'clusterName', active: '', validation: { required: true } }]),
          step('workers', []),
          step('network', []),
        ])
      ).toBe(4)
    })

    it('by default still stops on incomplete mustValidate controls', () => {
      expect(
        getMaxEnabledStepIndex([
          step('details', [{ id: 'hosts', mustValidate: true }], { isComplete: false }),
          step('workers', []),
        ])
      ).toBe(0)
    })

    it('with validateRequiredFields returns 0 when the first step has empty required fields', () => {
      expect(
        getMaxEnabledStepIndex(
          [
            step('details', [{ id: 'clusterName', active: '', validation: { required: true } }]),
            step('workers', []),
            step('network', []),
          ],
          strict
        )
      ).toBe(0)
    })

    it('with validateRequiredFields stops at the first incomplete required step', () => {
      expect(
        getMaxEnabledStepIndex(
          [
            step('details', [{ id: 'clusterName', active: 'demo', validation: { required: true } }]),
            step('workers', [{ id: 'size', active: '', validation: { required: true } }]),
            step('network', []),
          ],
          strict
        )
      ).toBe(1)
    })

    it('with validateRequiredFields unlocks all steps when every step is complete', () => {
      expect(
        getMaxEnabledStepIndex(
          [
            step('details', [{ id: 'clusterName', active: 'demo', validation: { required: true } }]),
            step('workers', []),
          ],
          strict
        )
      ).toBe(3)
    })
  })

  describe('isRequiredValueMissing', () => {
    it('returns false when validation is not required', () => {
      expect(isRequiredValueMissing({ active: '', validation: { required: false } })).toBe(false)
      expect(isRequiredValueMissing({ active: '' })).toBe(false)
    })

    it('returns true when required value is empty', () => {
      expect(isRequiredValueMissing({ active: '', validation: { required: true } })).toBe(true)
      expect(isRequiredValueMissing({ active: undefined, validation: { required: true } })).toBe(true)
      expect(isRequiredValueMissing({ active: null, validation: { required: true } })).toBe(true)
    })

    it('returns false when required value is present', () => {
      expect(isRequiredValueMissing({ active: 'demo', validation: { required: true } })).toBe(false)
      expect(isRequiredValueMissing({ active: 0, validation: { required: true } })).toBe(false)
    })

    it('treats empty multiselect and labels arrays as missing', () => {
      expect(
        isRequiredValueMissing({ type: 'multiselect', active: [], validation: { required: true } })
      ).toBe(true)
      expect(isRequiredValueMissing({ type: 'labels', active: [], validation: { required: true } })).toBe(true)
      expect(
        isRequiredValueMissing({
          type: 'labels',
          active: [{ key: 'env', value: 'dev' }],
          validation: { required: true },
        })
      ).toBe(false)
    })

    it('ignores hidden and disabled controls', () => {
      expect(isRequiredValueMissing({ active: '', validation: { required: true }, hidden: true })).toBe(false)
      expect(isRequiredValueMissing({ active: '', validation: { required: true }, disabled: true })).toBe(false)
    })

    it('passes (control, controlData) into functional hidden without throwing', () => {
      const controlData = [{ id: 'other', active: 'x' }]
      const control = {
        active: '',
        validation: { required: true },
        hidden: (ctrl, data) => {
          expect(ctrl).toBeDefined()
          expect(data).toBe(controlData)
          return true
        },
      }
      expect(isRequiredValueMissing(control, controlData)).toBe(false)
    })
  })

  describe('hasIncompleteRequiredControls', () => {
    it('detects incomplete top-level required controls', () => {
      expect(
        hasIncompleteRequiredControls([
          { id: 'clusterName', active: '', validation: { required: true } },
          { id: 'baseDomain', active: 'apps.example.com', validation: { required: true } },
        ])
      ).toBe(true)
    })

    it('returns false when all required controls are filled', () => {
      expect(
        hasIncompleteRequiredControls([
          { id: 'clusterName', active: 'demo', validation: { required: true } },
          { id: 'baseDomain', active: 'apps.example.com', validation: { required: true } },
        ])
      ).toBe(false)
    })

    it('detects incomplete required fields inside worker groups', () => {
      expect(
        hasIncompleteRequiredControls([
          {
            id: 'workerGroups',
            type: 'group',
            active: [[{ id: 'workerGroupName', active: '', validation: { required: true } }]],
          },
        ])
      ).toBe(true)
    })

    it('treats empty worker groups as complete when startWithNone', () => {
      expect(
        hasIncompleteRequiredControls([
          {
            id: 'workerGroups',
            type: 'group',
            active: [],
          },
        ])
      ).toBe(false)
    })

    it('skips hidden or disabled groups when validating required fields', () => {
      expect(
        hasIncompleteRequiredControls([
          {
            id: 'workerGroups',
            type: 'group',
            hidden: true,
            active: [[{ id: 'workerGroupName', active: '', validation: { required: true } }]],
          },
        ])
      ).toBe(false)
      expect(
        hasIncompleteRequiredControls([
          {
            id: 'workerGroups',
            type: 'group',
            disabled: true,
            active: [[{ id: 'workerGroupName', active: '', validation: { required: true } }]],
          },
        ])
      ).toBe(false)
    })

    it('does not let disabled controls with exceptions block navigation', () => {
      expect(
        hasIncompleteRequiredControls([
          { id: 'clusterName', active: 'BAD', validation: { required: true }, exception: 'invalid', disabled: true },
        ])
      ).toBe(false)
      expect(
        hasIncompleteRequiredControls([
          {
            id: 'workerGroups',
            type: 'group',
            active: [
              [{ id: 'workerGroupName', active: 'x', validation: { required: true }, exception: 'bad', disabled: true }],
            ],
          },
        ])
      ).toBe(false)
    })

    it('blocks on validation exceptions even when value is present', () => {
      expect(
        hasIncompleteRequiredControls([
          { id: 'clusterName', active: 'BAD_NAME', validation: { required: true }, exception: 'invalid' },
        ])
      ).toBe(true)
    })
  })
})
