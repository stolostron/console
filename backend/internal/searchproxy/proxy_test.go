// Copyright Contributors to the Open Cluster Management project

package searchproxy

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func authOK(_ http.ResponseWriter, _ *http.Request) (string, bool) {
	return "user-token", true
}

func TestUnauthorizedEmptyBody(t *testing.T) {
	h := New(Options{
		Endpoint: func(context.Context) string { return "http://example.invalid" },
	})
	req := httptest.NewRequest(http.MethodPost, "/proxy/search", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}
}

func TestGetWithoutUpgradeNotFound(t *testing.T) {
	h := New(Options{Authn: authOK, Endpoint: func(context.Context) string { return "http://example.invalid" }})
	req := httptest.NewRequest(http.MethodGet, "/proxy/search", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}
}

func TestPostProxiesUserTokenAndStripsCookie(t *testing.T) {
	var (
		gotAuth, gotCookie, gotPath, gotCT, gotXFF string
		gotBody                                    []byte
	)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotCookie = r.Header.Get("Cookie")
		gotPath = r.URL.Path
		gotCT = r.Header.Get("Content-Type")
		gotXFF = r.Header.Get("X-Forwarded-For")
		gotBody, _ = io.ReadAll(r.Body)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":{"searchResult":[]}}`))
	}))
	defer upstream.Close()

	h := New(Options{
		Authn:    authOK,
		Endpoint: func(context.Context) string { return upstream.URL + "/searchapi/graphql" },
	})
	req := httptest.NewRequest(http.MethodPost, "/proxy/search", strings.NewReader(`{"query":"{ __typename }"}`))
	req.Header.Set("Authorization", "Bearer user-token")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Cookie", "session=secret")
	req.Header.Set("X-Forwarded-For", "1.2.3.4")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if gotAuth != "Bearer user-token" {
		t.Fatalf("auth %q", gotAuth)
	}
	if gotCookie != "" {
		t.Fatalf("cookie forwarded %q", gotCookie)
	}
	if gotXFF != "" {
		t.Fatalf("x-forwarded-for forwarded %q", gotXFF)
	}
	if gotPath != "/searchapi/graphql" {
		t.Fatalf("path %q", gotPath)
	}
	if gotCT != "application/json" {
		t.Fatalf("content-type %q", gotCT)
	}
	if string(gotBody) != `{"query":"{ __typename }"}` {
		t.Fatalf("body %s", gotBody)
	}
	if rec.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("resp content-type %q", rec.Header().Get("Content-Type"))
	}
}

func TestInjectConnectionInitAuthorization(t *testing.T) {
	out := InjectConnectionInitAuthorization(`{"type":"connection_init","payload":{"foo":"bar"}}`, "mytoken")
	var msg struct {
		Type    string `json:"type"`
		Payload struct {
			Foo           string `json:"foo"`
			Authorization string `json:"Authorization"`
		} `json:"payload"`
	}
	if err := json.Unmarshal([]byte(out), &msg); err != nil {
		t.Fatal(err)
	}
	if msg.Type != "connection_init" || msg.Payload.Foo != "bar" || msg.Payload.Authorization != "Bearer mytoken" {
		t.Fatalf("%+v", msg)
	}

	out = InjectConnectionInitAuthorization(`{"type":"connection_init","payload":{}}`, "Bearer x")
	if err := json.Unmarshal([]byte(out), &msg); err != nil {
		t.Fatal(err)
	}
	if msg.Payload.Authorization != "Bearer x" {
		t.Fatalf("%q", msg.Payload.Authorization)
	}

	sub := `{"type":"subscribe","id":"1","payload":{}}`
	if InjectConnectionInitAuthorization(sub, "t") != sub {
		t.Fatal("subscribe rewritten")
	}
	out = InjectConnectionInitAuthorization(`{"type":"connection_init","payload":null}`, "tok")
	if err := json.Unmarshal([]byte(out), &msg); err != nil {
		t.Fatal(err)
	}
	if msg.Payload.Authorization != "Bearer tok" {
		t.Fatalf("null payload %q", msg.Payload.Authorization)
	}
	if InjectConnectionInitAuthorization("not-json", "tok") != "not-json" {
		t.Fatal("invalid json")
	}
}

func TestWebSocketUnauthorizedBeforeUpgrade(t *testing.T) {
	h := New(Options{Endpoint: func(context.Context) string { return "http://example.invalid" }})
	req := httptest.NewRequest(http.MethodGet, "/proxy/search", nil)
	req.Header.Set("Upgrade", "websocket")
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Sec-WebSocket-Version", "13")
	req.Header.Set("Sec-WebSocket-Key", "dGhlIHNhbXBsZSBub25jZQ==")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}
	if rec.Header().Get("Upgrade") != "" {
		t.Fatal("upgraded without auth")
	}
}

func TestWebSocketInjectsConnectionInit(t *testing.T) {
	gotInitCh := make(chan string, 1)
	upgrader := websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }, EnableCompression: false}
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer user-token" {
			t.Errorf("upstream auth %q", r.Header.Get("Authorization"))
		}
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()
		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}
		gotInitCh <- string(data)
		_ = conn.WriteMessage(websocket.TextMessage, []byte(`{"type":"connection_ack"}`))
	}))
	defer upstream.Close()

	h := New(Options{
		Authn:    authOK,
		Endpoint: func(context.Context) string { return upstream.URL + "/searchapi/graphql" },
	})
	ts := httptest.NewServer(h)
	defer ts.Close()

	wsURL := "ws" + strings.TrimPrefix(ts.URL, "http") + "/proxy/search"
	client, _, err := websocket.DefaultDialer.Dial(wsURL, http.Header{"Authorization": []string{"Bearer user-token"}})
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()

	initMsg := `{"type":"connection_init","payload":{"extra":true}}`
	if err = client.WriteMessage(websocket.TextMessage, []byte(initMsg)); err != nil {
		t.Fatal(err)
	}
	_, ack, err := client.ReadMessage()
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(ack), "connection_ack") {
		t.Fatalf("ack %s", ack)
	}
	var gotInit string
	select {
	case gotInit = <-gotInitCh:
	case <-time.After(2 * time.Second):
		t.Fatal("timeout waiting for upstream connection_init")
	}
	var parsed map[string]any
	if err = json.Unmarshal([]byte(gotInit), &parsed); err != nil {
		t.Fatalf("init %s: %v", gotInit, err)
	}
	payload, _ := parsed["payload"].(map[string]any)
	if payload["Authorization"] != "Bearer user-token" {
		t.Fatalf("init payload %+v", payload)
	}
	if payload["extra"] != true {
		t.Fatalf("lost extra %+v", payload)
	}
}

func TestWebSocketUpstreamTimeout504(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer ln.Close()
	go func() {
		c, err := ln.Accept()
		if err != nil {
			return
		}
		time.Sleep(500 * time.Millisecond)
		_ = c.Close()
	}()

	h := New(Options{
		Authn:       authOK,
		DialTimeout: 50 * time.Millisecond,
		Endpoint:    func(context.Context) string { return "http://" + ln.Addr().String() + "/searchapi/graphql" },
	})
	req := httptest.NewRequest(http.MethodGet, "/proxy/search", nil)
	req.Header.Set("Upgrade", "websocket")
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Sec-WebSocket-Version", "13")
	req.Header.Set("Sec-WebSocket-Key", "dGhlIHNhbXBsZSBub25jZQ==")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusGatewayTimeout {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestWebSocketUpstreamRefused502(t *testing.T) {
	h := New(Options{
		Authn:       authOK,
		DialTimeout: 200 * time.Millisecond,
		Endpoint:    func(context.Context) string { return "http://127.0.0.1:1/searchapi/graphql" },
	})
	req := httptest.NewRequest(http.MethodGet, "/proxy/search", nil)
	req.Header.Set("Upgrade", "websocket")
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Sec-WebSocket-Version", "13")
	req.Header.Set("Sec-WebSocket-Key", "dGhlIHNhbXBsZSBub25jZQ==")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestSubprotocolsDefault(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/proxy/search", nil)
	got := subprotocolsForUpstream(req)
	if len(got) != 1 || got[0] != "graphql-transport-ws" {
		t.Fatalf("%v", got)
	}
	req.Header.Set("Sec-WebSocket-Protocol", "graphql-ws, graphql-transport-ws")
	got = subprotocolsForUpstream(req)
	if len(got) != 2 || got[0] != "graphql-ws" {
		t.Fatalf("%v", got)
	}
}
