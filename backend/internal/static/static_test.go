// Copyright Contributors to the Open Cluster Management project

package static_test

import (
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stolostron/console/backend/internal/static"
)

const wantCSP = "default-src 'self';connect-src 'self' https://api.github.com;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self' 'unsafe-eval';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"

func writeTree(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	files := map[string]string{
		"index.html":                  "<!doctype html><title>console</title>",
		"plugin/plugin-entry.js":      "console.log('entry')",
		"plugin/plugin-manifest.json": `{"name":"acm"}`,
		"locales/en/translation.json": `{"hello":"world"}`,
		"assets/app.abc123.js":        "window.app=1",
		"logo.png":                    "png-bytes",
	}
	for name, body := range files {
		path := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	gzPath := filepath.Join(dir, "assets", "app.abc123.js.gz")
	gz, err := os.Create(gzPath)
	if err != nil {
		t.Fatal(err)
	}
	w := gzip.NewWriter(gz)
	if _, err := w.Write([]byte("window.app=1")); err != nil {
		t.Fatal(err)
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	if err := gz.Close(); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "assets", "app.abc123.js.br"), []byte("fake-brotli"), 0o644); err != nil {
		t.Fatal(err)
	}
	return dir
}

func get(t *testing.T, h http.Handler, path string, hdr http.Header) *http.Response {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, path, nil)
	for k, vs := range hdr {
		for _, v := range vs {
			req.Header.Add(k, v)
		}
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec.Result()
}

func TestIsStaticPath(t *testing.T) {
	yes := []string{"/", "/index.html", "/plugin/plugin-entry.js", "/plugin/plugin-manifest.json",
		"/locales/en/translation.json", "/assets/app.js", "/logo.png", "/a.woff2"}
	for _, p := range yes {
		if !static.IsStaticPath(p) {
			t.Fatalf("%s should be static", p)
		}
	}
	no := []string{"/hub", "/events", "/username", "/api/v1/pods", "/secret.txt", "/plugin"}
	for _, p := range no {
		if static.IsStaticPath(p) {
			t.Fatalf("%s should not be static", p)
		}
	}
}

func TestIndexHTMLHeaders(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t))})
	for _, path := range []string{"/", "/index.html"} {
		resp := get(t, h, path, nil)
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if !strings.Contains(string(body), "<!doctype html>") {
			t.Fatalf("%s body %s", path, body)
		}
		if resp.Header.Get("Cache-Control") != "no-cache" {
			t.Fatalf("cache %q", resp.Header.Get("Cache-Control"))
		}
		if resp.Header.Get("Content-Security-Policy") != wantCSP {
			t.Fatalf("csp %q", resp.Header.Get("Content-Security-Policy"))
		}
		if resp.Header.Get("X-Frame-Options") != "deny" {
			t.Fatal("missing frame options")
		}
		if resp.Header.Get("Content-Type") != "text/html; charset=utf-8" {
			t.Fatalf("ct %q", resp.Header.Get("Content-Type"))
		}
		if resp.Header.Get("Last-Modified") == "" {
			t.Fatal("missing last-modified")
		}
	}
}

func TestPluginManifestNoCache(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t)), Production: true})
	resp := get(t, h, "/plugin/plugin-manifest.json", nil)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if string(body) != `{"name":"acm"}` {
		t.Fatalf("body %s", body)
	}
	if resp.Header.Get("Cache-Control") != "no-cache" {
		t.Fatalf("cache %q", resp.Header.Get("Cache-Control"))
	}
	if resp.Header.Get("Content-Type") != "application/json; charset=utf-8" {
		t.Fatalf("ct %q", resp.Header.Get("Content-Type"))
	}
}

func TestPluginEntryNoCache(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t)), Production: true})
	resp := get(t, h, "/plugin/plugin-entry.js", nil)
	resp.Body.Close()
	if resp.Header.Get("Cache-Control") != "no-cache" {
		t.Fatalf("cache %q", resp.Header.Get("Cache-Control"))
	}
	if resp.Header.Get("Content-Type") != "application/javascript; charset=UTF-8" {
		t.Fatalf("ct %q", resp.Header.Get("Content-Type"))
	}
}

func TestHashedAssetCacheProduction(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t)), Production: true})
	resp := get(t, h, "/assets/app.abc123.js", nil)
	resp.Body.Close()
	if resp.Header.Get("Cache-Control") != "public, max-age=604800" {
		t.Fatalf("cache %q", resp.Header.Get("Cache-Control"))
	}
}

func TestHashedAssetCacheDevelopment(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t)), Production: false})
	resp := get(t, h, "/assets/app.abc123.js", nil)
	resp.Body.Close()
	if resp.Header.Get("Cache-Control") != "no-store" {
		t.Fatalf("cache %q", resp.Header.Get("Cache-Control"))
	}
}

func TestLocalesCache(t *testing.T) {
	dir := writeTree(t)
	prod := static.New(static.Options{FS: os.DirFS(dir), Production: true})
	resp := get(t, prod, "/locales/en/translation.json", nil)
	resp.Body.Close()
	if resp.Header.Get("Cache-Control") != "public, max-age=3600" {
		t.Fatalf("prod cache %q", resp.Header.Get("Cache-Control"))
	}
	dev := static.New(static.Options{FS: os.DirFS(dir), Production: false})
	resp = get(t, dev, "/locales/en/translation.json", nil)
	resp.Body.Close()
	if resp.Header.Get("Cache-Control") != "no-store" {
		t.Fatalf("dev cache %q", resp.Header.Get("Cache-Control"))
	}
}

func TestBrotliNegotiation(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t))})
	resp := get(t, h, "/assets/app.abc123.js", http.Header{"Accept-Encoding": []string{"gzip, br"}})
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.Header.Get("Content-Encoding") != "br" {
		t.Fatalf("encoding %q", resp.Header.Get("Content-Encoding"))
	}
	if string(body) != "fake-brotli" {
		t.Fatalf("body %q", body)
	}
	if resp.Header.Get("Content-Type") != "application/javascript; charset=UTF-8" {
		t.Fatalf("ct %q", resp.Header.Get("Content-Type"))
	}
}

func TestGzipFallbackWhenNoBrotliAccepted(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t))})
	resp := get(t, h, "/assets/app.abc123.js", http.Header{"Accept-Encoding": []string{"gzip"}})
	defer resp.Body.Close()
	if resp.Header.Get("Content-Encoding") != "gzip" {
		t.Fatalf("encoding %q", resp.Header.Get("Content-Encoding"))
	}
	zr, err := gzip.NewReader(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	defer zr.Close()
	body, _ := io.ReadAll(zr)
	if string(body) != "window.app=1" {
		t.Fatalf("body %q", body)
	}
}

func TestUncompressedWhenNoAcceptEncoding(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t))})
	resp := get(t, h, "/assets/app.abc123.js", nil)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.Header.Get("Content-Encoding") != "" {
		t.Fatalf("encoding %q", resp.Header.Get("Content-Encoding"))
	}
	if string(body) != "window.app=1" {
		t.Fatalf("body %q", body)
	}
}

func TestIfModifiedSince(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t))})
	first := get(t, h, "/logo.png", nil)
	first.Body.Close()
	mod := first.Header.Get("Last-Modified")
	if mod == "" {
		t.Fatal("missing last-modified")
	}
	resp := get(t, h, "/logo.png", http.Header{"If-Modified-Since": []string{mod}})
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotModified {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestNotFound(t *testing.T) {
	h := static.New(static.Options{FS: os.DirFS(writeTree(t))})
	resp := get(t, h, "/plugin/missing.js", nil)
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestUnknownExtension(t *testing.T) {
	dir := writeTree(t)
	if err := os.WriteFile(filepath.Join(dir, "secret.txt"), []byte("nope"), 0o644); err != nil {
		t.Fatal(err)
	}
	h := static.New(static.Options{FS: os.DirFS(dir)})
	resp := get(t, h, "/secret.txt", nil)
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestNilFS(t *testing.T) {
	h := static.New(static.Options{})
	resp := get(t, h, "/index.html", nil)
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestOpenFS(t *testing.T) {
	dir := t.TempDir()
	fsys, ok := static.OpenFS(dir)
	if !ok || fsys == nil {
		t.Fatal("expected dir fs")
	}
	if _, ok := static.OpenFS(filepath.Join(dir, "missing")); ok {
		t.Fatal("missing dir should fail")
	}
	if _, ok := static.OpenFS(""); ok {
		t.Fatal("empty should fail")
	}
}

func TestBundledFS(t *testing.T) {
	fsys := static.BundledFS()
	if fsys == nil {
		t.Fatal("expected bundled fs")
	}
	f, err := fsys.Open("README")
	if err != nil {
		t.Fatal(err)
	}
	_ = f.Close()
}

func TestContentTypes(t *testing.T) {
	dir := writeTree(t)
	if err := os.WriteFile(filepath.Join(dir, "a.css"), []byte("a{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "a.svg"), []byte("<svg/>"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "a.woff2"), []byte("w"), 0o644); err != nil {
		t.Fatal(err)
	}
	h := static.New(static.Options{FS: os.DirFS(dir)})
	cases := map[string]string{
		"/a.css":    "text/css; charset=UTF-8",
		"/a.svg":    "image/svg+xml",
		"/a.woff2":  "font/woff2",
		"/logo.png": "image/png",
	}
	for p, want := range cases {
		resp := get(t, h, p, nil)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", p, resp.StatusCode)
		}
		if resp.Header.Get("Content-Type") != want {
			t.Fatalf("%s ct %q want %q", p, resp.Header.Get("Content-Type"), want)
		}
	}
}
