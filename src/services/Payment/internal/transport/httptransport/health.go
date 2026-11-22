package httptransport

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterHealthRoutes(router *gin.Engine) {
	healthGroup := router.Group("/health")
	healthGroup.GET("/live", liveHandler)
	healthGroup.GET("/ready", readyHandler)
}

func liveHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
	})
}

func readyHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
	})
}
