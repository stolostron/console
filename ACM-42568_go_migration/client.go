/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"bytes"
	"compress/flate"
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Capture struct {
	Status  int
	Headers http.Header
	Body    []byte
	Decoded []byte // after content-encoding
}

func (c Capture) Header(name string) string {
	return strings.Join(c.Headers.Values(name), ", ")
}

func (c Capture) HeaderMap() map[string][]string {
	out := map[string][]string{}
	for k, v := range c.Headers {
		out[strings.ToLower(k)] = append([]string{}, v...)
	}
	return out
}

func (cfg Config) Do(client *http.Client, base string, cs Case, path string) (Capture, error) {
	url := cfg.ResolveURL(base, path)
	var body io.Reader
	if cs.RawBody != "" {
		body = strings.NewReader(cs.RawBody)
	} else if cs.Body != nil {
		b, err := json.Marshal(cs.Body)
		if err != nil {
			return Capture{}, err
		}
		body = bytes.NewReader(b)
	}
	req, err := http.NewRequest(cs.Method, url, body)
	if err != nil {
		return Capture{}, err
	}
	for k, v := range cs.Headers {
		req.Header.Set(k, v)
	}
	if cs.ContentType != "" {
		req.Header.Set("Content-Type", cs.ContentType)
	} else if cs.Body != nil && req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}
	cfg.applyAuth(req, cs.Auth)

	resp, err := client.Do(req)
	if err != nil {
		return Capture{}, err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 32<<20))
	if err != nil {
		return Capture{}, err
	}
	decoded, err := decodeBody(resp.Header.Get("Content-Encoding"), raw)
	if err != nil {
		decoded = raw
	}
	return Capture{Status: resp.StatusCode, Headers: resp.Header.Clone(), Body: raw, Decoded: decoded}, nil
}

func (cfg Config) applyAuth(req *http.Request, auth string) {
	if cfg.Token == "" {
		return
	}
	switch strings.ToLower(auth) {
	case "bearer":
		req.Header.Set("Authorization", "Bearer "+cfg.Token)
	case "cookie":
		req.AddCookie(&http.Cookie{Name: "acm-access-token-cookie", Value: cfg.Token})
	case "both":
		req.Header.Set("Authorization", "Bearer "+cfg.Token)
		req.AddCookie(&http.Cookie{Name: "acm-access-token-cookie", Value: cfg.Token})
	case "invalid":
		// Must send a syntactically present token. In NODE_ENV=development, getToken()
		// falls back to certs localStorage admin-token when Authorization and cookie are absent.
		req.Header.Set("Authorization", "Bearer acm-42590-invalid-token")
	}
}

func decodeBody(encoding string, body []byte) ([]byte, error) {
	encoding = strings.ToLower(strings.TrimSpace(encoding))
	switch encoding {
	case "", "identity":
		return body, nil
	case "gzip":
		r, err := gzip.NewReader(bytes.NewReader(body))
		if err != nil {
			return nil, err
		}
		defer r.Close()
		return io.ReadAll(r)
	case "deflate":
		r := flate.NewReader(bytes.NewReader(body))
		defer r.Close()
		return io.ReadAll(r)
	default:
		return body, fmt.Errorf("unsupported content-encoding %s", encoding)
	}
}

func ProbeBackend(cfg Config) error {
	client := cfg.NewHTTPClient(8 * time.Second)
	req, err := http.NewRequest(http.MethodGet, cfg.ResolveURL(cfg.BackendURL, "/ping"), nil)
	if err != nil {
		return err
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body) //nolint:errcheck
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("GET /ping -> %d", resp.StatusCode)
	}
	return nil
}
