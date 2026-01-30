/* Copyright Contributors to the Open Cluster Management project */
import { AbstractAnchor, getEllipseAnchorPoint, Point } from '@patternfly/react-topology'

const SHIFT_AMOUNT = 7
export default class MultiEllipseAnchor extends AbstractAnchor {
  getLocation(reference: Point): Point {
    const r = this.owner.getBounds()
    if (r.isEmpty()) {
      return r.getCenter()
    }

    const offset2x = this.offset * 2
    const center = r.getCenter()
    // Shift center SHIFT_AMOUNT right so ellipse extends SHIFT_AMOUNT*2 further to the right
    const shiftedCenter = new Point(center.x + SHIFT_AMOUNT, center.y)
    return getEllipseAnchorPoint(shiftedCenter, r.width + offset2x + SHIFT_AMOUNT * 2, r.height + offset2x, reference)
  }
}
