package web

import (
	"github.com/gin-gonic/gin"
	"log"
)

// StartServer inicia el servidor web de Gobackup
func StartServer() {
	router := gin.Default()

	// Servir archivos estáticos (CSS, JS)
	router.Static("/static", "./internal/web/static")

	// Servir el dashboard HTML principal
	router.GET("/", func(c *gin.Context) {
		c.File("./internal/web/static/index.html")
	})

	// Llamar a setupRoutes definido en routes.go para endpoints API
	setupRoutes(router)

	// Arrancar servidor en puerto 8080
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
