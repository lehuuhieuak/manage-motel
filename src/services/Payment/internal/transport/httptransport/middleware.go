package httptransport

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const correlationIDHeader = "X-Correlation-Id"
const correlationIDContextKey = "correlation_id"

func CorrelationID() gin.HandlerFunc {
	return func(c *gin.Context) {
		correlationID := c.GetHeader(correlationIDHeader)
		if correlationID == "" {
			correlationID = uuid.NewString()
		}

		c.Set(correlationIDContextKey, correlationID)
		c.Header(correlationIDHeader, correlationID)
		c.Next()
	}
}

func RequestLogger(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		startedAt := time.Now()

		c.Next()

		attributes := []any{
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration", time.Since(startedAt),
			"correlationId", c.GetString(correlationIDContextKey),
		}

		if c.Writer.Status() >= 500 {
			logger.Error("http request completed", attributes...)
			return
		}
		logger.Info("http request completed", attributes...)
	}

}
