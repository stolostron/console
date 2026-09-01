/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"sort"
)

type Recorded struct {
	ID      string              `json:"id"`
	Path    string              `json:"path"`
	Status  int                 `json:"status"`
	Headers map[string][]string `json:"headers"`
	Body    any                 `json:"body"`
}

func DiffCaptures(a, b Capture) error {
	if a.Status != b.Status {
		return fmt.Errorf("status %d vs %d", a.Status, b.Status)
	}
	ha := NormalizeHeaders(a.HeaderMap())
	hb := NormalizeHeaders(b.HeaderMap())
	// Only compare headers that both sides set among a small allowlist plus expected ones.
	interesting := []string{
		"content-type", "content-encoding", "cache-control",
		"x-frame-options", "content-security-policy", "location",
	}
	for _, name := range interesting {
		va, vb := FirstHeader(ha, name), FirstHeader(hb, name)
		if va != vb && va != "" && vb != "" {
			return fmt.Errorf("header %s %q vs %q", name, va, vb)
		}
	}
	na := NormalizeBody(a.Decoded)
	nb := NormalizeBody(b.Decoded)
	if !reflect.DeepEqual(na, nb) {
		return fmt.Errorf("body mismatch\nA=%s\nB=%s", PrettyJSON(na), PrettyJSON(nb))
	}
	return nil
}

func WriteRecord(dir string, rec Recorded) error {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	b, err := json.MarshalIndent(rec, "", "  ")
	if err != nil {
		return err
	}
	name := rec.ID
	if rec.Path != "" {
		name = rec.ID + "_" + sanitizeFile(rec.Path)
	}
	return os.WriteFile(filepath.Join(dir, name+".json"), b, 0o644)
}

func sanitizeFile(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9', r == '-', r == '_':
			out = append(out, r)
		default:
			out = append(out, '_')
		}
	}
	return string(out)
}

func SortedKeys(m map[string][]string) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return keys
}
