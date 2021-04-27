/* Copyright Contributors to the Open Cluster Management project */
import { SVGIconProps, getSize, IconSize } from '@patternfly/react-icons/dist/js/createIcon'

export function AcmSvgIcon(props: SVGIconProps) {
    const { size, color, title, noVerticalAlign } = props
    const hasTitle = Boolean(title)
    const width = getSize(size ?? IconSize.sm)
    const baseAlign = -0.125 * Number.parseFloat(width)
    const verticalAlign = noVerticalAlign ? undefined : `${baseAlign}em`
    return (
        <div style={{ width, height: width, verticalAlign, color }}>
            {hasTitle && <title>{title}</title>}
            {props.children}
        </div>
    )
}
