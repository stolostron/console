/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"bytes"
	"encoding/json"
	"regexp"
	"sort"
	"strings"
)

var isoTime = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}`)

var volatileKeys = map[string]struct{}{
	"resourceversion":   {},
	"uid":               {},
	"creationtimestamp": {},
	"managedfields":     {},
	"generation":        {},
	"selflink":          {},
	"rv":                {},
}

func NormalizeHeaders(h map[string][]string) map[string][]string {
	out := map[string][]string{}
	skip := map[string]struct{}{
		"date": {}, "content-length": {}, "transfer-encoding": {},
		"connection": {}, "keep-alive": {}, "alt-svc": {},
	}
	for k, vals := range h {
		lk := strings.ToLower(k)
		if _, ok := skip[lk]; ok {
			continue
		}
		cleaned := make([]string, 0, len(vals))
		for _, v := range vals {
			if lk == "set-cookie" {
				cleaned = append(cleaned, normalizeSetCookie(v))
				continue
			}
			cleaned = append(cleaned, v)
		}
		sort.Strings(cleaned)
		out[lk] = cleaned
	}
	return out
}

func normalizeSetCookie(v string) string {
	parts := strings.Split(v, ";")
	name := strings.TrimSpace(parts[0])
	if i := strings.IndexByte(name, '='); i >= 0 {
		name = name[:i]
	}
	attrs := []string{strings.ToLower(name) + "=<volatile>"}
	for _, p := range parts[1:] {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if i := strings.IndexByte(p, '='); i >= 0 {
			attrs = append(attrs, strings.ToLower(p[:i]))
		} else {
			attrs = append(attrs, strings.ToLower(p))
		}
	}
	sort.Strings(attrs[1:])
	return strings.Join(attrs, "; ")
}

func NormalizeBody(raw []byte) any {
	raw = bytes.TrimSpace(raw)
	if len(raw) == 0 {
		return ""
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		return string(raw)
	}
	return stripVolatile(v)
}

func stripVolatile(v any) any {
	switch t := v.(type) {
	case map[string]any:
		out := make(map[string]any, len(t))
		for k, val := range t {
			if _, skip := volatileKeys[strings.ToLower(k)]; skip {
				continue
			}
			out[k] = stripVolatile(val)
		}
		return out
	case []any:
		out := make([]any, len(t))
		for i, item := range t {
			out[i] = stripVolatile(item)
		}
		return out
	case string:
		if isoTime.MatchString(t) {
			return "<timestamp>"
		}
		return t
	default:
		return t
	}
}

func HeaderValuesCI(h map[string][]string, name string) []string {
	want := strings.ToLower(name)
	for k, v := range h {
		if strings.ToLower(k) == want {
			return v
		}
	}
	return nil
}

func FirstHeader(h map[string][]string, name string) string {
	vals := HeaderValuesCI(h, name)
	if len(vals) == 0 {
		return ""
	}
	return vals[0]
}
