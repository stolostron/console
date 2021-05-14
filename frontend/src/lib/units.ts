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
    let unit = 1
    while (scalar > 1024) {
        scalar /= 1024
        unit *= 1024
    }
    return `${scalar.toFixed(1)} ${Units[unit]}`
}
