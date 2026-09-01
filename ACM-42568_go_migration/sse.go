/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"bufio"
	"bytes"
	"compress/flate"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type SSEEvent struct {
	ID     string
	Event  string
	Data   string
	Parsed map[string]any
}

func ParseSSE(body []byte) ([]SSEEvent, error) {
	var events []SSEEvent
	scanner := bufio.NewScanner(bytes.NewReader(body))
	scanner.Buffer(make([]byte, 0, 64*1024), 8<<20)
	var cur SSEEvent
	flush := func() {
		if cur.ID == "" && cur.Event == "" && cur.Data == "" {
			return
		}
		if cur.Data != "" {
			var parsed any
			if json.Unmarshal([]byte(cur.Data), &parsed) == nil {
				if m, ok := parsed.(map[string]any); ok {
					cur.Parsed = m
				}
			}
		}
		events = append(events, cur)
		cur = SSEEvent{}
	}
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			flush()
			continue
		}
		if strings.HasPrefix(line, ":") {
			continue // keepalive comment
		}
		field, value, _ := strings.Cut(line, ":")
		value = strings.TrimPrefix(value, " ")
		switch field {
		case "id":
			cur.ID = value
		case "event":
			cur.Event = value
		case "data":
			if cur.Data != "" {
				cur.Data += "\n"
			}
			cur.Data += value
		}
	}
	flush()
	return events, scanner.Err()
}

func (cfg Config) CaptureSSE(base string, cs Case, path string, timeout time.Duration) (Capture, []SSEEvent, error) {
	if timeout <= 0 {
		timeout = cfg.SSETimeout
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	client := cfg.NewHTTPClient(0)
	client.Timeout = 0

	url := cfg.ResolveURL(base, path)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return Capture{}, nil, err
	}
	for k, v := range cs.Headers {
		req.Header.Set(k, v)
	}
	if req.Header.Get("Accept") == "" {
		req.Header.Set("Accept", "text/event-stream")
	}
	cfg.applyAuth(req, cs.Auth)

	resp, err := client.Do(req)
	if err != nil {
		return Capture{}, nil, err
	}
	defer resp.Body.Close()

	headers := resp.Header.Clone()
	stream := io.Reader(resp.Body)
	if enc := strings.ToLower(headers.Get("Content-Encoding")); enc == "gzip" {
		gr, err := gzip.NewReader(resp.Body)
		if err != nil {
			return Capture{Status: resp.StatusCode, Headers: headers}, nil, fmt.Errorf("sse gzip: %w", err)
		}
		defer gr.Close()
		stream = gr
	} else if enc == "deflate" {
		fr := flate.NewReader(resp.Body)
		defer fr.Close()
		stream = fr
	}
	decoded, err := readUntilLoaded(ctx, stream)
	if err != nil && len(decoded) == 0 {
		return Capture{}, nil, err
	}
	events, parseErr := ParseSSE(decoded)
	cap := Capture{Status: resp.StatusCode, Headers: headers, Body: decoded, Decoded: decoded}
	if parseErr != nil {
		return cap, events, parseErr
	}
	return cap, events, nil
}

func readUntilLoaded(ctx context.Context, r io.Reader) ([]byte, error) {
	var out bytes.Buffer
	tmp := make([]byte, 32*1024)
	for {
		if ctx.Err() != nil {
			return out.Bytes(), ctx.Err()
		}
		n, err := r.Read(tmp)
		if n > 0 {
			out.Write(tmp[:n])
			if bytes.Contains(out.Bytes(), []byte(`"type":"LOADED"`)) || bytes.Contains(out.Bytes(), []byte(`"type": "LOADED"`)) {
				return out.Bytes(), nil
			}
		}
		if err == io.EOF {
			return out.Bytes(), nil
		}
		if err != nil {
			if out.Len() > 0 {
				return out.Bytes(), nil
			}
			return out.Bytes(), err
		}
	}
}

func AssertSSE(exp *SSEExpect, events []SSEEvent, watched map[string]struct{}) error {
	if len(events) == 0 {
		return fmt.Errorf("no SSE events parsed")
	}
	types := make([]string, 0, len(events))
	typeSet := map[string]struct{}{}
	for _, e := range events {
		t := sseType(e)
		if t == "" {
			continue
		}
		types = append(types, t)
		typeSet[t] = struct{}{}
	}
	if exp.FirstType != "" {
		first := firstNonEmpty(types)
		if first != exp.FirstType {
			return fmt.Errorf("first SSE type %q, want %q", first, exp.FirstType)
		}
	}
	if exp.LastType != "" {
		last := lastNonEmpty(types)
		if last != exp.LastType {
			return fmt.Errorf("last SSE type %q, want %q (types=%v)", last, exp.LastType, summarizeTypes(types))
		}
	}
	for _, t := range exp.RequireTypes {
		if _, ok := typeSet[t]; !ok {
			return fmt.Errorf("missing SSE type %s; saw %v", t, summarizeTypes(types))
		}
	}
	for _, e := range events {
		t := sseType(e)
		switch t {
		case "ADDED", "MODIFIED", "DELETED":
			if exp.ObjectHasKindAPIVersionName {
				obj, _ := e.Parsed["object"].(map[string]any)
				if obj == nil {
					return fmt.Errorf("%s event missing object: %s", t, e.Data)
				}
				if str(obj["kind"]) == "" || str(obj["apiVersion"]) == "" {
					return fmt.Errorf("%s object missing kind/apiVersion", t)
				}
				meta, _ := obj["metadata"].(map[string]any)
				if meta == nil || str(meta["name"]) == "" {
					return fmt.Errorf("%s object missing metadata.name", t)
				}
			}
			if exp.KindsSubsetOfWatched && len(watched) > 0 {
				obj, _ := e.Parsed["object"].(map[string]any)
				if obj != nil {
					k := str(obj["kind"])
					if k != "" {
						if _, ok := watched[k]; !ok {
							return fmt.Errorf("unexpected watched kind %s", k)
						}
					}
				}
			}
		case "SETTINGS":
			settings, _ := e.Parsed["settings"].(map[string]any)
			for _, key := range exp.SettingsKeys {
				if settings == nil {
					return fmt.Errorf("SETTINGS missing settings object")
				}
				if _, ok := settings[key]; !ok {
					return fmt.Errorf("SETTINGS missing key %s", key)
				}
			}
		}
	}
	return nil
}

func sseType(e SSEEvent) string {
	if e.Parsed == nil {
		return ""
	}
	return str(e.Parsed["type"])
}

func str(v any) string {
	s, _ := v.(string)
	return s
}

func firstNonEmpty(s []string) string {
	for _, v := range s {
		if v != "" {
			return v
		}
	}
	return ""
}

func lastNonEmpty(s []string) string {
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] != "" {
			return s[i]
		}
	}
	return ""
}

func summarizeTypes(types []string) []string {
	counts := map[string]int{}
	order := []string{}
	for _, t := range types {
		if counts[t] == 0 {
			order = append(order, t)
		}
		counts[t]++
	}
	out := make([]string, 0, len(order))
	for _, t := range order {
		out = append(out, fmt.Sprintf("%s×%d", t, counts[t]))
	}
	return out
}
