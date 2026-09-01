/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type Mode string

const (
	ModeAssert  Mode = "assert"
	ModeCompare Mode = "compare"
	ModeRecord  Mode = "record"
)

// Config is loaded from the environment. Tests talk to a running backend (Node or Go).
type Config struct {
	BackendURL  string
	CompareURL  string
	Token       string
	PathPrefix  string
	Mode        Mode
	RecordDir   string
	SSETimeout  time.Duration
	HTTPTimeout time.Duration
	InsecureTLS bool
}

func LoadConfig() Config {
	mode := Mode(strings.ToLower(getenv("CONTRACT_MODE", "assert")))
	if mode != ModeCompare && mode != ModeRecord {
		mode = ModeAssert
	}
	if getenv("CONTRACT_COMPARE_URL", "") != "" && mode == ModeAssert {
		mode = ModeCompare
	}
	sse := durationSeconds("CONTRACT_SSE_TIMEOUT", 120)
	httpTimeout := durationSeconds("CONTRACT_HTTP_TIMEOUT", 60)
	return Config{
		BackendURL:  strings.TrimRight(getenv("CONTRACT_BACKEND_URL", "https://localhost:4000"), "/"),
		CompareURL:  strings.TrimRight(getenv("CONTRACT_COMPARE_URL", ""), "/"),
		Token:       getenv("CONTRACT_TOKEN", ""),
		PathPrefix:  strings.TrimRight(getenv("CONTRACT_PATH_PREFIX", ""), "/"),
		Mode:        mode,
		RecordDir:   getenv("CONTRACT_RECORD_DIR", "testdata/recorded"),
		SSETimeout:  sse,
		HTTPTimeout: httpTimeout,
		InsecureTLS: getenv("CONTRACT_TLS_INSECURE", "true") != "false",
	}
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func durationSeconds(key string, def int) time.Duration {
	raw := os.Getenv(key)
	if raw == "" {
		return time.Duration(def) * time.Second
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return time.Duration(def) * time.Second
	}
	return time.Duration(n) * time.Second
}

func (c Config) NewHTTPClient(timeout time.Duration) *http.Client {
	if timeout <= 0 {
		timeout = c.HTTPTimeout
	}
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   15 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		// Node's HTTP/2 POST pipeline can stall waiting for headers (curl HTTP/1.1 is fine).
		// Plugin traffic through the OCP console proxy is HTTP/1.1; match that.
		ForceAttemptHTTP2:     false,
		TLSNextProto:          map[string]func(authority string, c *tls.Conn) http.RoundTripper{},
		MaxIdleConns:          20,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   15 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
		DisableCompression:    true, // observe Content-Encoding
		TLSClientConfig: &tls.Config{
			InsecureSkipVerify: c.InsecureTLS, //nolint:gosec // local/dev certs
		},
	}
	return &http.Client{
		Transport: transport,
		Timeout:   timeout,
		CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
}

func (c Config) ResolveURL(base, path string) string {
	p := path
	if !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	if c.PathPrefix != "" && !strings.HasPrefix(p, c.PathPrefix+"/") && p != c.PathPrefix {
		p = c.PathPrefix + p
	}
	return strings.TrimRight(base, "/") + p
}

func (c Config) MulticloudPath(path string) string {
	if strings.HasPrefix(path, "/multicloud/") || path == "/multicloud" {
		return path
	}
	if !strings.HasPrefix(path, "/") {
		path = "/" + path
	}
	return "/multicloud" + path
}

func PrettyJSON(v any) string {
	b, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return fmt.Sprint(v)
	}
	return string(b)
}
