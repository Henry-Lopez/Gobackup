package cmd

import (
	"fmt"
	"gobackup/internal/backup"
	"os"

	"github.com/spf13/cobra"
	"gobackup/internal/config"
)

var (
	cfgPath string         // Ruta al archivo config
	Cfg     *config.Config // Config cargada accesible globalmente
)

var rootCmd = &cobra.Command{
	Use:   "gobackup",
	Short: "Gobackup is a backup tool",
	Long:  `Gobackup is a CLI tool to manage backups and optionally run a web server.`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		// Cargar configuración antes de ejecutar cualquier subcomando
		var err error
		Cfg, err = config.LoadConfig(cfgPath)
		if err != nil {
			return fmt.Errorf("failed to load config: %w", err)
		}

		// Inicializar rutas y parámetros de backup desde la configuración
		backup.SourceDir = Cfg.SourceDir
		backup.BackupDir = Cfg.BackupDir
		backup.ModifiedMinutes = Cfg.ModifiedMinutes
		backup.MaxConcurrency = Cfg.MaxConcurrency

		return nil
	},
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Use one of the subcommands: cli or web")
	},
}

func init() {
	// Flag global para especificar archivo de configuración
	rootCmd.PersistentFlags().StringVarP(&cfgPath, "config", "c", "config/default.json", "Path to configuration file")
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
