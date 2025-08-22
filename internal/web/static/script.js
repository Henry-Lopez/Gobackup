document.addEventListener('DOMContentLoaded', () => {
    // Definir los elementos del DOM con los IDs actualizados
    const sourceBtn = document.getElementById('select-source-btn');
    const destBtn = document.getElementById('select-dest-btn');
    const backupBtn = document.getElementById('backup-btn');
    const sourcePathInput = document.getElementById('source-path');
    const destPathInput = document.getElementById('dest-path');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    const totalFilesDisplay = document.getElementById('total-files');
    const copiedFilesDisplay = document.getElementById('copied-files');
    const errorsDisplay = document.getElementById('errors');
    const progressPercentDisplay = document.getElementById('progressPercent');
    const activityLog = document.getElementById('activity-log');
    const clearLogBtn = document.getElementById('clear-log-btn');
    const reconnectBtn = document.getElementById('reconnect-btn');
    const restartBtn = document.getElementById('restart-btn');

    // URL base de la API
    const API_BASE_URL = window.location.origin;

    // Función para manejar la selección de la carpeta de origen
    sourceBtn.addEventListener('click', async () => {
        try {
            const dirHandle = await window.showDirectoryPicker();
            // Llenar el input con la ruta completa usando prompt()
            const sourcePath = prompt("Por favor, introduce la ruta completa de la carpeta de origen:", dirHandle.name);
            if (sourcePath) {
                sourcePathInput.value = sourcePath;
                logActivity(`Carpeta de origen seleccionada: ${sourcePath}`);
                updateBackupButtonState();
            }
        } catch (err) {
            logError(`Error al seleccionar la carpeta de origen: ${err}`);
        }
    });

    // Función para manejar la selección de la carpeta de destino
    destBtn.addEventListener('click', async () => {
        try {
            const dirHandle = await window.showDirectoryPicker();
            // Llenar el input con la ruta completa usando prompt()
            const destPath = prompt("Por favor, introduce la ruta completa de la carpeta de destino:", dirHandle.name);
            if (destPath) {
                destPathInput.value = destPath;
                logActivity(`Carpeta de destino seleccionada: ${destPath}`);
                updateBackupButtonState();
            }
        } catch (err) {
            logError(`Error al seleccionar la carpeta de destino: ${err}`);
        }
    });

    // Actualiza el estado del botón de backup
    function updateBackupButtonState() {
        const currentSourcePath = sourcePathInput.value.trim();
        const currentDestPath = destPathInput.value.trim();

        if (currentSourcePath && currentDestPath) {
            backupBtn.disabled = false;
        } else {
            backupBtn.disabled = true;
        }
    }

    // Función para manejar el inicio del backup
    backupBtn.addEventListener('click', async () => {
        const currentSourcePath = sourcePathInput.value.trim();
        const currentDestPath = destPathInput.value.trim();

        if (!currentSourcePath || !currentDestPath) {
            logError('Por favor, selecciona o introduce las carpetas de origen y destino.');
            return;
        }

        try {
            logActivity('Iniciando backup...');
            const response = await fetch(`${API_BASE_URL}/backup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    source: currentSourcePath,
                    destination: currentDestPath
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en la solicitud de backup');
            }

            logActivity('Backup iniciado correctamente.');
            backupBtn.disabled = true;

        } catch (err) {
            logError(`Error al iniciar el backup: ${err.message}`);
        }
    });

    // Función para manejar el reinicio
    restartBtn.addEventListener('click', () => {
        sourcePathInput.value = '';
        destPathInput.value = '';
        logActivity('Reiniciando la aplicación...');
        updateBackupButtonState();
    });

    // Función para manejar el log de actividad
    function logActivity(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logItem = document.createElement('div');
        logItem.textContent = `[INFO] [${timestamp}] ${message}`;
        activityLog.appendChild(logItem);
        activityLog.scrollTop = activityLog.scrollHeight;
    }

    // Función para manejar errores en el log
    function logError(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logItem = document.createElement('div');
        logItem.textContent = `[ERROR] [${timestamp}] ${message}`;
        logItem.style.color = 'red';
        activityLog.appendChild(logItem);
        activityLog.scrollTop = activityLog.scrollHeight;
    }

    // Función para limpiar el log de actividad
    clearLogBtn.addEventListener('click', () => {
        activityLog.innerHTML = '';
        logActivity('Log de actividad limpiado.');
    });

    // Función para actualizar el estado del UI
    function updateStatusUI(status) {
        if (status.inProgress) {
            statusText.textContent = 'En progreso...';
            document.getElementById('progressBar').style.display = 'block';
            backupBtn.disabled = true;
            restartBtn.disabled = true;
        } else {
            statusText.textContent = 'Inactivo';
            document.getElementById('progressBar').style.display = 'none';
            backupBtn.disabled = false;
            restartBtn.disabled = false;
        }

        totalFilesDisplay.textContent = status.TotalFiles;
        copiedFilesDisplay.textContent = status.FilesCopied;
        errorsDisplay.textContent = status.Errors ? status.Errors.length : 0;

        const progressPercentage = status.TotalFiles > 0 ? (status.FilesCopied / status.TotalFiles) * 100 : 0;
        document.getElementById('progressBar').style.width = `${progressPercentage}%`;
        progressPercentDisplay.textContent = `${progressPercentage.toFixed(0)}%`;

        if (status.Errors && status.Errors.length > 0) {
            logError(`Backup completado con ${status.Errors.length} errores.`);
            status.Errors.forEach(err => logError(`- ${err}`));
        } else if (!status.inProgress && status.TotalFiles > 0) {
            logActivity('Backup completado exitosamente.');
        }
    }

    // Bucle para obtener el estado del servidor
    async function fetchStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/status`);
            if (!response.ok) {
                throw new Error('Error al obtener el estado del servidor');
            }
            const status = await response.json();
            updateStatusUI(status);
        } catch (err) {
            logError(`Error de conexión: ${err.message}. Reintentando...`);
        }
    }

    // Iniciar la actualización del estado cada 2 segundos
    setInterval(fetchStatus, 2000);

    // Conectar/Reconectar
    reconnectBtn.addEventListener('click', () => {
        logActivity('Reconectando...');
        fetchStatus();
    });

    // Inicializar el estado de los botones
    updateBackupButtonState();
});