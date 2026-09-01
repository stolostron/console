/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"encoding/json"
	"fmt"
	"strings"
)

func AssertCapture(cs Case, cap Capture, watched map[string]struct{}) error {
	if containsInt(cs.SoftStatuses, cap.Status) && cs.Soft {
		return skipSoft(fmt.Sprintf("status %d is in softStatuses", cap.Status))
	}
	if !containsInt(cs.Expect.Status, cap.Status) {
		if cs.Soft {
			return skipSoft(fmt.Sprintf("status %d not in %v", cap.Status, cs.Expect.Status))
		}
		return fmt.Errorf("status %d, want one of %v; body=%s", cap.Status, cs.Expect.Status, truncate(cap.Decoded, 400))
	}

	headers := cap.HeaderMap()
	exp := cs.Expect

	if exp.ContentTypeContains != "" {
		ct := FirstHeader(headers, "content-type")
		if !strings.Contains(strings.ToLower(ct), strings.ToLower(exp.ContentTypeContains)) {
			return fmt.Errorf("content-type %q does not contain %q", ct, exp.ContentTypeContains)
		}
	}
	for _, name := range exp.HeaderPresent {
		if FirstHeader(headers, name) == "" {
			return fmt.Errorf("missing header %s", name)
		}
	}
	for _, name := range exp.HeaderAbsent {
		if FirstHeader(headers, name) != "" {
			return fmt.Errorf("header %s should be absent, got %q", name, FirstHeader(headers, name))
		}
	}
	for name, want := range exp.HeaderEquals {
		got := FirstHeader(headers, name)
		if !strings.EqualFold(got, want) && got != want {
			return fmt.Errorf("header %s = %q, want %q", name, got, want)
		}
	}
	for _, needle := range exp.SetCookieContains {
		found := false
		for _, c := range HeaderValuesCI(headers, "set-cookie") {
			if strings.Contains(c, needle) {
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("Set-Cookie missing %q; got %v", needle, HeaderValuesCI(headers, "set-cookie"))
		}
	}

	body := cap.Decoded
	if exp.BodyEmpty {
		if len(bytesTrim(body)) != 0 {
			return fmt.Errorf("expected empty body, got %q", truncate(body, 200))
		}
		return nil
	}

	if len(exp.JSONKeys) > 0 || exp.JSONType != "" || len(exp.JSONPathEquals) > 0 {
		var parsed any
		if err := json.Unmarshal(body, &parsed); err != nil {
			return fmt.Errorf("json body: %w; body=%s", err, truncate(body, 300))
		}
		if exp.JSONType == "object" {
			if _, ok := parsed.(map[string]any); !ok {
				return fmt.Errorf("json type %T, want object", parsed)
			}
		}
		if exp.JSONType == "array" {
			if _, ok := parsed.([]any); !ok {
				return fmt.Errorf("json type %T, want array", parsed)
			}
		}
		for _, key := range exp.JSONKeys {
			obj, ok := parsed.(map[string]any)
			if !ok {
				return fmt.Errorf("json keys require object, got %T", parsed)
			}
			if _, exists := obj[key]; !exists {
				return fmt.Errorf("missing json key %q", key)
			}
		}
		for path, want := range exp.JSONPathEquals {
			got, err := jsonPathString(parsed, path)
			if err != nil {
				return err
			}
			if got != want {
				return fmt.Errorf("json path %s = %q, want %q", path, got, want)
			}
		}
	}

	if exp.SSE != nil {
		events, err := ParseSSE(body)
		if err != nil {
			return err
		}
		if err := AssertSSE(exp.SSE, events, watched); err != nil {
			return err
		}
	}
	return nil
}

type softSkip struct{ reason string }

func (s softSkip) Error() string { return s.reason }

func skipSoft(reason string) error { return softSkip{reason: reason} }

func IsSoftSkip(err error) bool {
	_, ok := err.(softSkip)
	return ok
}

func containsInt(list []int, n int) bool {
	for _, v := range list {
		if v == n {
			return true
		}
	}
	return false
}

func bytesTrim(b []byte) []byte {
	return []byte(strings.TrimSpace(string(b)))
}

func truncate(b []byte, n int) string {
	s := string(b)
	if len(s) > n {
		return s[:n] + "…"
	}
	return s
}

func jsonPathString(v any, path string) (string, error) {
	cur := v
	for _, part := range strings.Split(path, ".") {
		obj, ok := cur.(map[string]any)
		if !ok {
			return "", fmt.Errorf("json path %s: not an object at %s", path, part)
		}
		next, ok := obj[part]
		if !ok {
			return "", fmt.Errorf("json path %s: missing %s", path, part)
		}
		cur = next
	}
	switch t := cur.(type) {
	case string:
		return t, nil
	case json.Number:
		return t.String(), nil
	default:
		b, _ := json.Marshal(t)
		return string(b), nil
	}
}
