package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"gobackup/internal/web"
)

var webCmd = &cobra.Command{
	Use:   "web",
	Short: "Run gobackup web server",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Starting web server on http://localhost:8080 ...")
		// Pasa la configuración global Cfg a la función de inicio del servidor.
		web.StartServer(Cfg)
	},
}

func init() {
	rootCmd.AddCommand(webCmd)
}
