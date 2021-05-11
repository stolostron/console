/* Copyright Contributors to the Open Cluster Management project */
export enum Units {
    None = 1,
    K = 1 * 1000,
    M = K * 1000,
    G = M * 1000,
    T = G * 1000,
    P = T * 1000,
    E = P * 1000,
    Ki = 1024,
    Mi = Ki * 1024,
    Gi = Mi * 1024,
    Ti = Gi * 1024,
    Pi = Ti * 1024,
    Ei = Pi * 1024,
}

export function quantityToScalar(quantity: string): number {
    if (typeof quantity !== 'string') {
        return 0
    }

    let units: Units = Units.None
    if (quantity.length > 2) {
        if (quantity.endsWith('i')) {
            switch (quantity[quantity.length - 2]) {
                case 'K':
                    units = Units.Ki
                    break
                case 'M':
                    units = Units.Mi
                    break
                case 'G':
                    units = Units.Gi
                    break
                case 'T':
                    units = Units.Ti
                    break
                case 'P':
                    units = Units.Pi
                    break
                case 'E':
                    units = Units.Ei
                    break
            }
            if (units !== Units.None) {
                quantity = quantity.substr(0, quantity.length - 2)
            }
        } else {
            switch (quantity[quantity.length - 1]) {
                case 'K':
                    units = Units.K
                    break
                case 'M':
                    units = Units.M
                    break
                case 'G':
                    units = Units.G
                    break
                case 'T':
                    units = Units.T
                    break
                case 'P':
                    units = Units.P
                    break
                case 'E':
                    units = Units.E
                    break
            }
            if (units !== Units.None) {
                quantity = quantity.substr(0, quantity.length - 1)
            }
        }
    }
    const num = parseInt(quantity, 10)
    if (isNaN(num)) {
        return 0
    }
    return num * units
}

export function scalarToQuantity(scalar: number): string {
    scalar = scalar || 0

    const decimals = 2

    const threshold = 800 // Steps to next unit if exceeded
    const multiplier = 1024
    const units = ['B', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei']

    let factorize = 1,
        unitIndex

    for (unitIndex = 0; unitIndex < units.length; unitIndex++) {
        if (unitIndex > 0) {
            factorize = Math.pow(multiplier, unitIndex)
        }

        if (scalar < multiplier * factorize && scalar < threshold * factorize) {
            break
        }
    }

    if (unitIndex >= units.length) {
        unitIndex = units.length - 1
    }

    const fileSize = scalar / factorize

    let res = fileSize.toFixed(decimals)

    // This removes unnecessary 0 or . chars at the end of the string/decimals
    if (res.indexOf('.') > -1) {
        res = res.replace(/\.?0*$/, '')
    }

    return `${res}${units[unitIndex + 1]}`
}
