// Copyright Contributors to the Open Cluster Management project

// Package acceptenc parses Accept-Encoding list elements and their q-values.
package acceptenc

import "strings"

// Parse splits one Accept-Encoding list element into a coding and its q-value
// in thousandths (0-1000). A missing q-value defaults to 1000. ok is false
// when the element is empty or its q-value is not a valid weight, so callers
// skip that element.
func Parse(part string) (name string, milli int, ok bool) {
	part = strings.TrimSpace(part)
	if part == "" {
		return "", 0, false
	}
	name = part
	params := ""
	if i := strings.IndexByte(part, ';'); i >= 0 {
		name = strings.TrimSpace(part[:i])
		params = part[i+1:]
	}
	if name == "" || strings.ContainsAny(name, " \t") {
		return "", 0, false
	}
	name = strings.ToLower(name)
	milli = 1000
	if strings.TrimSpace(params) == "" {
		return name, milli, true
	}
	for _, param := range strings.Split(params, ";") {
		param = strings.TrimSpace(param)
		if param == "" {
			continue
		}
		key, val, found := strings.Cut(param, "=")
		if !strings.EqualFold(strings.TrimSpace(key), "q") {
			continue
		}
		if !found {
			return "", 0, false
		}
		parsed, valid := parseQMilli(val)
		if !valid {
			return "", 0, false
		}
		milli = parsed
	}
	return name, milli, true
}

// parseQMilli accepts the RFC 9110 qvalue grammar: 0, 1, or those values with
// up to three decimal digits. The result is thousandths in the range 0–1000.
func parseQMilli(raw string) (int, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "0" {
		return 0, true
	}
	if raw == "1" {
		return 1000, true
	}
	// RFC 9110 allows "0." / "1." with zero fractional digits (len 2).
	if len(raw) < 2 || len(raw) > 5 || raw[1] != '.' {
		return 0, false
	}
	frac := raw[2:]
	n := 0
	for _, c := range frac {
		if c < '0' || c > '9' {
			return 0, false
		}
		n = n*10 + int(c-'0')
	}
	for i := len(frac); i < 3; i++ {
		n *= 10
	}
	switch raw[0] {
	case '0':
		return n, true
	case '1':
		if n == 0 {
			return 1000, true
		}
	}
	return 0, false
}
