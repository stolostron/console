import { FormFieldGroupExpandableProps } from '@patternfly/react-core'
import { FormFieldGroupToggle } from '@patternfly/react-core/dist/js/components/Form/FormFieldGroupToggle'
import { css } from '@patternfly/react-styles'
import styles from '@patternfly/react-styles/css/components/Form/form'
import * as React from 'react'
import './FieldGroup.css'

export type FieldGroupProps = FormFieldGroupExpandableProps & { setIsExpanded: (expanded: boolean) => void }
export function FieldGroup(props: FieldGroupProps) {
    const { children, header, isExpanded, setIsExpanded, toggleAriaLabel, ...extraProps } = props
    return (
        <InternalFormFieldGroup
            className="input-field-group"
            header={!isExpanded && header}
            isExpandable
            isExpanded={props.isExpanded}
            toggleAriaLabel={toggleAriaLabel}
            onToggle={() => setIsExpanded(!props.isExpanded)}
            {...extraProps}
        >
            {children}
        </InternalFormFieldGroup>
    )
}

export interface InternalFormFieldGroupProps extends Omit<React.HTMLProps<HTMLDivElement>, 'label'> {
    /** Anything that can be rendered as form field group content. */
    children?: React.ReactNode
    /** Additional classes added to the form field group. */
    className?: string
    /** Form filed group header */
    header?: any
    /** Flag indicating if the field group is expandable */
    isExpandable?: boolean
    /** Flag indicate if the form field group is expanded. Modifies the card to be expandable. */
    isExpanded?: boolean
    /** Function callback called when user clicks toggle button */
    onToggle?: () => void
    /** Aria-label to use on the form filed group toggle button */
    toggleAriaLabel?: string
}

export const InternalFormFieldGroup: React.FunctionComponent<InternalFormFieldGroupProps> = ({
    children,
    className,
    header,
    isExpandable,
    isExpanded,
    onToggle,
    toggleAriaLabel,
    ...props
}: InternalFormFieldGroupProps) => {
    const headerTitleText = header ? header.props.titleText : null
    if (isExpandable && !toggleAriaLabel && !headerTitleText) {
        // eslint-disable-next-line no-console
        console.error(
            'FormFieldGroupExpandable:',
            'toggleAriaLabel or the titleText prop of FormfieldGroupHeader is required to make the toggle button accessible'
        )
    }
    return (
        <div
            className={css(className, styles.formFieldGroup, isExpanded && isExpandable && styles.modifiers.expanded)}
            {...props}
            style={{ margin: 0 }}
        >
            {isExpandable && (
                <FormFieldGroupToggle
                    onToggle={onToggle}
                    isExpanded={isExpanded}
                    aria-label={toggleAriaLabel}
                    // toggleId={id}
                    {...(headerTitleText && { 'aria-labelledby': `c` })}
                    style={{ paddingTop: 16 }}
                />
            )}
            {header && header}
            {!isExpandable || (isExpandable && isExpanded) ? (
                <div className={css(styles.formFieldGroupBody)} style={{ paddingTop: 16, paddingBottom: 32 }}>
                    {children}
                </div>
            ) : (
                <div style={{ display: 'none' }}>{children}</div>
            )}
        </div>
    )
}
InternalFormFieldGroup.displayName = 'InternalFormFieldGroup'
