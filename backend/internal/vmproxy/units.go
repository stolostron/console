// Copyright Contributors to the Open Cluster Management project

package vmproxy

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

func parseLeadingInt(s string) (int, bool) {
	i := 0
	for i < len(s) && s[i] >= '0' && s[i] <= '9' {
		i++
	}
	if i == 0 {
		return 0, false
	}
	n, err := strconv.Atoi(s[:i])
	if err != nil {
		return 0, false
	}
	return n, true
}

func convertNanocoresToMillicores(nanocoreString string) float64 {
	n, ok := parseLeadingInt(nanocoreString)
	if !ok {
		return 0
	}
	return float64(n) / 1_000_000
}

func convertKibibytesToMebibytes(kibibyteString string) float64 {
	n, ok := parseLeadingInt(kibibyteString)
	if !ok {
		return 0
	}
	return float64(n) / 1024
}

func convertBytesToGibibytes(bytes float64) float64 {
	if math.IsNaN(bytes) {
		return 0
	}
	return bytes / 1_073_741_824
}

func toMillicores(cpuRequest string) (float64, error) {
	trimmed := strings.TrimSpace(cpuRequest)
	if trimmed == "" {
		return 0, fmt.Errorf("Invalid input: cpuRequest must be a non-empty string.")
	}
	if strings.HasSuffix(trimmed, "m") {
		numericPart := trimmed[:len(trimmed)-1]
		millicores, err := strconv.Atoi(numericPart)
		if err != nil || strconv.Itoa(millicores) != numericPart {
			return 0, fmt.Errorf("Invalid millicore value: %q. The part before \"m\" must be an integer.", cpuRequest)
		}
		return float64(millicores), nil
	}
	coreValue, err := strconv.ParseFloat(trimmed, 64)
	if err != nil {
		return 0, fmt.Errorf("Invalid core value: %q. Must be a number or end with 'm'.", cpuRequest)
	}
	return coreValue * 1000, nil
}

var memoryRE = regexp.MustCompile(`^(\d+(\.\d+)?)\s*([A-Za-z]+)?$`)

func toMebibytes(memoryRequest string) (float64, error) {
	trimmed := strings.TrimSpace(memoryRequest)
	if trimmed == "" {
		return 0, fmt.Errorf("Invalid input: memoryRequest must be a non-empty string.")
	}
	match := memoryRE.FindStringSubmatch(trimmed)
	if match == nil {
		return 0, fmt.Errorf("Invalid memory format: %q. Expected a number followed by an optional unit.", memoryRequest)
	}
	numericValue, err := strconv.ParseFloat(match[1], 64)
	if err != nil {
		return 0, err
	}
	unit := match[3]
	multipliers := map[string]float64{
		"Ki": 1024,
		"Mi": 1024 * 1024,
		"Gi": 1024 * 1024 * 1024,
		"Ti": 1024 * 1024 * 1024 * 1024,
		"Pi": 1024 * 1024 * 1024 * 1024 * 1024,
		"Ei": 1024 * 1024 * 1024 * 1024 * 1024 * 1024,
		"k":  1000,
		"M":  1000 * 1000,
		"G":  1000 * 1000 * 1000,
		"T":  1000 * 1000 * 1000 * 1000,
		"P":  1000 * 1000 * 1000 * 1000 * 1000,
		"E":  1000 * 1000 * 1000 * 1000 * 1000 * 1000,
	}
	var bytes float64
	switch {
	case unit == "":
		bytes = numericValue
	case multipliers[unit] != 0:
		bytes = numericValue * multipliers[unit]
	default:
		return 0, fmt.Errorf("Invalid memory unit: %q.", unit)
	}
	return bytes / (1024 * 1024), nil
}

func calUsagePercent(usage, requested float64) int {
	if usage < 0 || requested < 0 || math.IsNaN(usage) || math.IsNaN(requested) {
		return 0
	}
	if requested == 0 {
		return 0
	}
	return int(math.Round((usage / requested) * 100))
}
