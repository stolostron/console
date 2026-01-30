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
    const anchorPoint = getEllipseAnchorPoint(
      shiftedCenter,
      r.width + offset2x + SHIFT_AMOUNT * 2,
      r.height + offset2x,
      reference
    )

    // Calculate angle from center to anchor point (0-360 degrees, 0 = right, 90 = down)
    const dx = anchorPoint.x - shiftedCenter.x
    const dy = anchorPoint.y - shiftedCenter.y
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI
    if (angle < 0) {
      angle += 360
    }

    // If anchor lands between 260 and 270 degrees, back off an extra 8px
    if (angle >= 200 && angle <= 240) {
      const distance = Math.sqrt(dx * dx + dy * dy)
      const scale = (distance + 8) / distance
      return new Point(shiftedCenter.x + dx * scale, shiftedCenter.y + dy * scale)
    }

    return anchorPoint
  }
}
