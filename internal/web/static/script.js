const progressBar = document.getElementById("progressBar");
const logsDiv = document.getElementById("logs");
const startBtn = document.getElementById("startBackup");
const resetBtn = document.getElementById("resetApp");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const totalFilesEl = document.getElementById("totalFiles");
const copiedFilesEl = document.getElementById("copiedFiles");
const errorCountEl = document.getElementById("errorCount");
const progressPercentEl = document.getElementById("progressPercent");

startBtn.addEventListener("click", () => {
    startBtn.disabled = true;
    logsDiv.innerHTML = '';
    appendLog("[INFO] Iniciando proceso de respaldo...", "info");

    statusDot.classList.remove("active");
    statusText.textContent = "Iniciando respaldo...";

    totalFilesEl.textContent = "0";
    copiedFilesEl.textContent = "0";
    errorCountEl.textContent = "0";
    progressPercentEl.textContent = "0%";

    fetch("/backup", { method: "POST" })
        .then(res => res.json())
        .then(data => {
            appendLog("[INFO] " + data.message, "info");
        })
        .catch(err => {
            appendLog("[ERROR] Error al iniciar el respaldo: " + err, "error");
            startBtn.disabled = false;
            statusText.textContent = "Error al iniciar";
        });
});

resetBtn.addEventListener("click", () => {
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";
    logsDiv.innerHTML = '';
    startBtn.disabled = false;
    resetBtn.style.display = "none";
    statusDot.classList.remove("active");
    statusText.textContent = "Listo para iniciar respaldo";
    progressPercentEl.textContent = "0%";
    appendLog("[INFO] Aplicación reiniciada. Lista para el próximo respaldo.", "info");
});

function appendLog(msg, type = "info") {
    const p = document.createElement("p");
    p.textContent = msg;
    p.setAttribute("data-type", type);
    logsDiv.appendChild(p);
    logsDiv.scrollTop = logsDiv.scrollHeight;
}

function updateStatus() {
    fetch("/status")
        .then(res => res.json())
        .then(data => {
            const { TotalFiles, FilesCopied, Errors, InProgress } = data;

            totalFilesEl.textContent = TotalFiles;
            copiedFilesEl.textContent = FilesCopied;
            errorCountEl.textContent = Errors ? Errors.length : 0;

            let percent = 0;
            if (TotalFiles > 0) {
                percent = Math.round((FilesCopied / TotalFiles) * 100);
            } else if (!InProgress) {
                percent = 100;
            }

            progressBar.style.width = percent + "%";
            progressBar.textContent = percent + "%";
            progressPercentEl.textContent = percent + "%";

            if (Errors && Errors.length > 0) {
                Errors.forEach(err => appendLog("[ERROR] " + err, "error"));
            }

            if (InProgress) {
                appendLog(`[INFO] Respaldo en progreso: ${FilesCopied}/${TotalFiles} archivos`, "info");
                statusDot.classList.add("active");
                statusText.textContent = "Respaldo en progreso";
            } else if (TotalFiles > 0 && FilesCopied === TotalFiles) {
                appendLog("[ÉXITO] Respaldo completado correctamente!", "success");
                startBtn.disabled = false;
                resetBtn.style.display = "inline-block";
                statusDot.classList.remove("active");
                statusText.textContent = "Respaldo completado";
            } else if (!InProgress && TotalFiles === 0) {
                appendLog("[INFO] Respaldo completado. No se encontraron archivos para copiar.", "info");
                startBtn.disabled = false;
                resetBtn.style.display = "inline-block";
                statusDot.classList.remove("active");
                statusText.textContent = "Respaldo completado (0 archivos)";
            }
        })
        .catch(err => {
            console.error(err);
            appendLog("[ERROR] No se pudo obtener el estado del respaldo", "error");
        });
}

setInterval(updateStatus, 2000);