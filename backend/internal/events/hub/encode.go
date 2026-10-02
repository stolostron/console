// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"compress/gzip"
	"compress/zlib"
	"io"
	"net/http"
	"os"
	"strings"
)

type streamEncoder struct {
	w       http.ResponseWriter
	flusher http.Flusher
	gz      *gzip.Writer
	zl      *zlib.Writer
	closer  io.Closer
}

func negotiateEncoding(accept string, disabled bool) string {
	if disabled {
		return "identity"
	}
	if strings.Contains(accept, "gzip") {
		return "gzip"
	}
	if strings.Contains(accept, "deflate") {
		return "deflate"
	}
	return "identity"
}

func streamCompressionDisabled() bool {
	return os.Getenv("DISABLE_STREAM_COMPRESSION") == "true"
}

func newStreamEncoder(w http.ResponseWriter, flusher http.Flusher, encoding string) *streamEncoder {
	enc := &streamEncoder{w: w, flusher: flusher}
	switch encoding {
	case "gzip":
		gz := gzip.NewWriter(w)
		enc.gz = gz
		enc.closer = gz
	case "deflate":
		zl := zlib.NewWriter(w)
		enc.zl = zl
		enc.closer = zl
	}
	return enc
}

func (s *streamEncoder) Write(p []byte) (int, error) {
	if s.gz != nil {
		return s.gz.Write(p)
	}
	if s.zl != nil {
		return s.zl.Write(p)
	}
	return s.w.Write(p)
}

func (s *streamEncoder) Flush() error {
	if s.gz != nil {
		if err := s.gz.Flush(); err != nil {
			return err
		}
	}
	if s.zl != nil {
		if err := s.zl.Flush(); err != nil {
			return err
		}
	}
	s.flusher.Flush()
	return nil
}

func (s *streamEncoder) Close() {
	if s.closer != nil {
		_ = s.closer.Close()
	}
}
