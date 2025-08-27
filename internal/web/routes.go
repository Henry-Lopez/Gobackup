package web

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v4/disk" // Importa la librería para el uso del disco
	"github.com/sqweek/dialog"

	"gobackup/internal/backup"
)

// setupRoutes configura todas las rutas del servidor web.
func setupRoutes(router *gin.Engine) {
	// Archivos estáticos
	router.Static("/static", "./internal/web/static")

	// Página principal
	router.GET("/", func(c *gin.Context) {
		c.File("./internal/web/static/index.html")
	})

	// Endpoints para abrir selector nativo de carpetas y devolver ruta absoluta
	router.GET("/pick/source", pickSource)
	router.GET("/pick/dest", pickDest)

	// NUEVO: Endpoint para obtener el tamaño de la carpeta de origen
	router.GET("/folder-size", getFolderSize)

	// Endpoint para obtener el uso del disco de destino
	router.GET("/disk-space", getDiskUsage)

	// Iniciar backup
	router.POST("/backup", handleBackup)

	// Estado
	router.GET("/status", handleStatus)
}

// ----------------------------------------------
// Handlers de selección de directorios nativos
// ----------------------------------------------
func pickSource(c *gin.Context) { pickDirectory(c, "Selecciona carpeta de ORIGEN") }
func pickDest(c *gin.Context)   { pickDirectory(c, "Selecciona carpeta de DESTINO") }

func pickDirectory(c *gin.Context, title string) {
	dir, err := dialog.Directory().Title(title).Browse()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if dir == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "selección cancelada"})
		return
	}

	abs, err := filepath.Abs(dir)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	info, err := os.Stat(abs)
	if err != nil || !info.IsDir() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "directorio inválido"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"path": abs})
}

// ----------------------------------------------
// NUEVO: Handler para obtener el tamaño de una carpeta
// ----------------------------------------------
func getFolderSize(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "La ruta no puede estar vacía"})
		return
	}

	// Calcula el tamaño de la carpeta de manera recursiva
	size, err := calculateFolderSize(path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo calcular el tamaño de la carpeta"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"size": size})
}

// Función auxiliar para calcular el tamaño total de una carpeta
func calculateFolderSize(path string) (int64, error) {
	var size int64
	err := filepath.Walk(path, func(_ string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			size += info.Size()
		}
		return nil
	})
	return size, err
}

// ----------------------------------------------
// Handler para obtener el uso del disco
// ----------------------------------------------
func getDiskUsage(c *gin.Context) {
	path := c.Query("path")
	if path == "" {
		if os.PathSeparator == '\\' {
			path = "C:\\"
		} else {
			path = "/"
		}
	}

	usage, err := disk.Usage(path)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo obtener el espacio en disco"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total": usage.Total, // en bytes
		"free":  usage.Free,  // en bytes
	})
}

// ----------------------------------------------
// Handlers existentes
// ----------------------------------------------
type backupRequest struct {
	Source      string `json:"source"`
	Destination string `json:"destination"`
}

// Inicia el backup usando las rutas recibidas (absolutas)
func handleBackup(c *gin.Context) {
	var req backupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	go func() {
		if err := backup.RunBackup(req.Source, req.Destination); err != nil {
			backup.Status.SetError(err.Error())
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Backup iniciado"})
}

func handleStatus(c *gin.Context) {
	status := backup.Status.Get()
	c.JSON(http.StatusOK, status)
}
