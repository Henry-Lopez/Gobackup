document.addEventListener('DOMContentLoaded', () => {
    // DOM
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
    // NUEVO: Referencias a los nuevos elementos
    const diskSpaceDisplay = document.getElementById('disk-space');
    const filesSizeDisplay = document.getElementById('files-size');
    // NUEVO: Referencia al nuevo contenedor lateral
    const preBackupInfoBox = document.getElementById('pre-backup-info-box');

    const API_BASE_URL = window.location.origin;

    // --- Funciones de utilidad ---

    function updateBackupButtonState() {
        const s = sourcePathInput.value.trim();
        const d = destPathInput.value.trim();
        backupBtn.disabled = !(s && d);
    }

    function logActivity(message) {
        const ts = new Date().toLocaleTimeString();
        const div = document.createElement('div');
        div.textContent = `[INFO] [${ts}] ${message}`;
        activityLog.appendChild(div);
        activityLog.scrollTop = activityLog.scrollHeight;
    }

    function logError(message) {
        const ts = new Date().toLocaleTimeString();
        const div = document.createElement('div');
        div.textContent = `[ERROR] [${ts}] ${message}`;
        div.style.color = 'red';
        activityLog.appendChild(div);
        activityLog.scrollTop = activityLog.scrollHeight;
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // NUEVO: Función para mostrar el panel lateral
    function showInfoBox() {
        preBackupInfoBox.classList.add('visible');
    }

    // NUEVO: Función para ocultar el panel lateral
    function hideInfoBox() {
        preBackupInfoBox.classList.remove('visible');
    }

    // ---- util para pedir ruta absoluta al backend
    async function pick(kind /* 'origen' | 'destino' */) {
        const endpoint = kind === 'origen' ? '/pick/source' : '/pick/dest';
        const res = await fetch(`${API_BASE_URL}${endpoint}`);
        if (!res.ok) {
            let msg = 'Error al seleccionar carpeta';
            try { const j = await res.json(); msg = j.error || msg; } catch {}
            throw new Error(msg);
        }
        const data = await res.json();
        return data.path; // absoluta
    }

    // Función para obtener el tamaño de una carpeta desde Go
    async function getFolderSize(path) {
        try {
            const res = await fetch(`${API_BASE_URL}/folder-size?path=${encodeURIComponent(path)}`);
            if (!res.ok) throw new Error('Error al obtener el tamaño de la carpeta');
            const data = await res.json();
            filesSizeDisplay.textContent = formatBytes(data.size);
        } catch (err) {
            filesSizeDisplay.textContent = 'N/A';
            logError(`Error al obtener el tamaño: ${err.message}`);
        }
    }

    // Función para obtener el espacio en disco desde Go
    async function fetchDiskSpace(path) {
        try {
            const response = await fetch(`${API_BASE_URL}/disk-space?path=${encodeURIComponent(path)}`);
            if (!response.ok) throw new Error('Error al obtener el espacio en disco');
            const data = await response.json();
            const freeGB = (data.free / (1024 * 1024 * 1024)).toFixed(2);
            diskSpaceDisplay.textContent = `${freeGB} GB`;
        } catch (err) {
            diskSpaceDisplay.textContent = 'N/A';
            logError(`Error de disco: ${err.message}`);
        }
    }

    // --- Drag & Drop: usamos el gesto para abrir el selector nativo ---
    function setupDropZone(zone, input, kind) {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('hover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('hover'));

        zone.addEventListener('drop', async (e) => {
            e.preventDefault();
            zone.classList.remove('hover');
            try {
                const abs = await pick(kind);
                input.value = abs;
                logActivity(`Carpeta de ${kind} seleccionada: ${abs}`);
                updateBackupButtonState();
                showInfoBox(); // Mostrar el panel al seleccionar una carpeta

                if (kind === 'origen') {
                    getFolderSize(abs);
                } else if (kind === 'destino') {
                    fetchDiskSpace(abs);
                }
            } catch (err) {
                logError(err.message || String(err));
            }
        });
    }

    // Botones "Seleccionar…"
    sourceBtn?.addEventListener('click', async () => {
        try {
            const abs = await pick('origen');
            sourcePathInput.value = abs;
            logActivity(`Carpeta de origen seleccionada: ${abs}`);
            updateBackupButtonState();
            getFolderSize(abs);
            showInfoBox(); // Mostrar el panel al seleccionar una carpeta
        } catch (err) { logError(err.message || String(err)); }
    });

    destBtn?.addEventListener('click', async () => {
        try {
            const abs = await pick('destino');
            destPathInput.value = abs;
            logActivity(`Carpeta de destino seleccionada: ${abs}`);
            updateBackupButtonState();
            fetchDiskSpace(abs);
            showInfoBox(); // Mostrar el panel al seleccionar una carpeta
        } catch (err) { logError(err.message || String(err)); }
    });

    // Iniciar backup
    backupBtn.addEventListener('click', async () => {
        const s = sourcePathInput.value.trim();
        const d = destPathInput.value.trim();
        if (!s || !d) {
            logError('Por favor, selecciona o introduce las carpetas de origen y destino.');
            return;
        }
        try {
            logActivity('Iniciando backup...');
            const res = await fetch(`${API_BASE_URL}/backup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: s, destination: d })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Error en la solicitud de backup');
            }
            logActivity('Backup iniciado correctamente.');
            backupBtn.disabled = true;
        } catch (err) {
            logError(`Error al iniciar el backup: ${err.message}`);
        }
    });

    // Reiniciar
    restartBtn.addEventListener('click', () => {
        sourcePathInput.value = '';
        destPathInput.value = '';
        logActivity('Reiniciando la aplicación...');
        updateBackupButtonState();
        filesSizeDisplay.textContent = '0 MB';
        diskSpaceDisplay.textContent = '? GB';
        hideInfoBox(); // Ocultar el panel al reiniciar
    });

    // Log
    clearLogBtn.addEventListener('click', () => {
        activityLog.innerHTML = '';
        logActivity('Log de actividad limpiado.');
    });

    // Estado UI
    function updateStatusUI(status) {
        if (status.inProgress) {
            statusText.textContent = 'En progreso...';
            progressBar.style.display = 'block';
            backupBtn.disabled = true;
            restartBtn.disabled = true;
        } else {
            statusText.textContent = 'Inactivo';
            progressBar.style.display = 'none';
            backupBtn.disabled = false;
            restartBtn.disabled = false;
        }
        totalFilesDisplay.textContent = status.TotalFiles;
        copiedFilesDisplay.textContent = status.FilesCopied;
        errorsDisplay.textContent = status.Errors ? status.Errors.length : 0;

        const pct = status.TotalFiles > 0 ? (status.FilesCopied / status.TotalFiles) * 100 : 0;
        progressBar.style.width = `${pct}%`;
        progressPercentDisplay.textContent = `${pct.toFixed(0)}%`;

        if (status.Errors && status.Errors.length > 0) {
            logError(`Backup completado con ${status.Errors.length} errores.`);
            status.Errors.forEach(err => logError(`- ${err}`));
        } else if (!status.inProgress && status.TotalFiles > 0) {
            logActivity('Backup completado exitosamente.');
        }
    }

    // Polling de estado
    async function fetchStatus() {
        try {
            const res = await fetch(`${API_BASE_URL}/status`);
            if (!res.ok) throw new Error('Error al obtener el estado del servidor');
            const st = await res.json();
            updateStatusUI(st);
        } catch (err) {
            logError(`Error de conexión: ${err.message}. Reintentando...`);
        }
    }
    setInterval(fetchStatus, 2000);

    reconnectBtn.addEventListener('click', () => {
        logActivity('Reconectando...');
        fetchStatus();
    });

    // Drop zones
    setupDropZone(document.getElementById('source-drop-zone'), sourcePathInput, 'origen');
    setupDropZone(document.getElementById('dest-drop-zone'), destPathInput, 'destino');

    updateBackupButtonState();
    hideInfoBox(); // Ocultar el panel al cargar la página por primera vez
});