package web

import (
	"github.com/gin-gonic/gin"
	"gobackup/internal/backup"
)

// setupRoutes configura todas las rutas del servidor web.
func setupRoutes(router *gin.Engine) {
	// Sirve los archivos estáticos desde el directorio 'static'
	router.Static("/static", "./internal/web/static")

	// Ruta para el archivo principal (index.html)
	router.GET("/", func(c *gin.Context) {
		c.File("./internal/web/static/index.html")
	})

	// Ruta para iniciar el backup
	router.POST("/backup", handleBackup)

	// Ruta para el estado del backup
	router.GET("/status", handleStatus)
}

// handleBackup maneja la solicitud de backup
func handleBackup(c *gin.Context) {
	var req backupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Aquí está la solución universal: usar directamente las rutas de la solicitud
	// El frontend ya envió la ruta completa, no necesitas manipularla
	go func() {
		if err := backup.RunBackup(req.Source, req.Destination); err != nil {
			backup.Status.SetError(err.Error())
		}
	}()

	c.JSON(200, gin.H{"message": "Backup iniciado"})
}

// backupRequest representa la estructura de la solicitud de backup.
type backupRequest struct {
	Source      string `json:"source"`
	Destination string `json:"destination"`
}

// handleStatus maneja la solicitud de estado del backup.
func handleStatus(c *gin.Context) {
	status := backup.Status.Get()
	c.JSON(200, status)
}
