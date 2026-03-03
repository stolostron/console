/* Copyright Contributors to the Open Cluster Management project */

import { Checkbox, ExpandableSection } from '@patternfly/react-core'

type HypershiftUpgradeModalNodePoolCheckboxProps = {
  label: string
  isChecked: boolean
  id: string
  name?: string
  onChange: () => void
  isDisabled: boolean
  dataTestId: string
  onToggle: () => void
  isExpanded: boolean
  ariaLabel: string
  isExpandable?: boolean
  children: React.ReactNode
}

/**
 *
 * @param label - The label of the checkbox
 * @param isChecked - Whether the checkbox is checked
 * @param id - The id of the checkbox
 * @param name - The name of the checkbox
 * @param onChange - The function to call when the checkbox is changed
 * @param isDisabled - Whether the checkbox is disabled
 * @param dataTestId - The data-testid of the checkbox
 * @param onToggle - The function to call when the checkbox is toggled
 * @param isExpanded - Whether the checkbox is expanded
 * @param ariaLabel - The aria-label of the checkbox
 * @param isExpandable - Whether the checkbox is expandable
 * @param children - The children of the checkbox in case it is expandable
 * @returns A checkbox component
 */
export const HypershiftUpgradeModalNodePoolCheckbox = ({
  label,
  isChecked,
  id,
  name,
  onChange,
  isDisabled,
  dataTestId,
  onToggle,
  isExpanded,
  ariaLabel,
  isExpandable,
  children,
}: HypershiftUpgradeModalNodePoolCheckboxProps) => {
  const CheckboxContent = () => (
    <Checkbox
      label={label}
      isChecked={isChecked}
      id={id}
      name={name}
      onChange={onChange}
      isDisabled={isDisabled}
      data-testid={dataTestId}
    />
  )

  return isExpandable ? (
    <ExpandableSection
      toggleContent={<CheckboxContent />}
      onToggle={onToggle}
      isExpanded={isExpanded}
      aria-label={ariaLabel}
    >
      {children}
    </ExpandableSection>
  ) : (
    <CheckboxContent />
  )
}
