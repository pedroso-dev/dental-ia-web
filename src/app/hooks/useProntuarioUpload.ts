import { useState, useCallback } from "react";
import { set, del } from "idb-keyval";

export interface DentistData {
  dentistName: string;
  crosp: string;
  dentistEmail: string;
  dentistId: string;
}

export function useProntuarioUpload() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const uploadAndProcess = useCallback(
    async (audioBlob: Blob, dentistData: DentistData) => {
      setIsProcessing(true);
      setStatusMessage("Salvando backup local...");

      try {
        // 🛡️ OFFLINE FIRST: Salva o Blob no navegador antes de ir para a rede
        await set("pending_audio_backup", audioBlob);

        setStatusMessage("Fazendo upload do áudio seguro...");
        const filename = `consulta-${Date.now()}.webm`;

        // 1. Pede permissão para o Cloudflare R2
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename, contentType: "audio/webm" }),
        });

        if (!uploadRes.ok)
          throw new Error("Falha ao obter URL segura para upload");
        const { uploadUrl, fileKey } = await uploadRes.json();

        // // 2. Envia o áudio pesado diretamente do navegador para o R2
        // await fetch(uploadUrl, {
        //   method: "PUT",
        //   headers: { "Content-Type": "audio/webm" },
        //   body: audioBlob,
        // });

        // 2. Envia o áudio pesado diretamente do navegador para o R2 (Resiliente para iOS)
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", uploadUrl, true);
          xhr.setRequestHeader("Content-Type", "audio/webm");
          // Força o navegador a segurar a conexão por até 10 minutos (600.000 ms)
          xhr.timeout = 600000;
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
            } else {
              reject(
                new Error(`Falha no upload para o R2. Status: ${xhr.status}`),
              );
            }
          };
          xhr.onerror = () =>
            reject(new Error("Erro de rede durante o upload."));
          xhr.ontimeout = () =>
            reject(new Error("O upload excedeu o tempo limite."));

          xhr.send(audioBlob);
        });

        setStatusMessage("Enviando para a fila de processamento da IA...");

        // 3. Aciona o Inngest para iniciar a IA em background
        const iaRes = await fetch("/api/process-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileKey,
            dentistName: dentistData.dentistName,
            crosp: dentistData.crosp,
            dentistEmail: dentistData.dentistEmail,
            dentistId: dentistData.dentistId,
          }),
        });

        const result = await iaRes.json();

        if (iaRes.ok) {
          // 🗑️ CLEANUP: A rede funcionou perfeitamente! Podemos apagar o backup local.
          await del("pending_audio_backup");

          setStatusMessage(
            "✅ Áudio na fila! O prontuário chegará no seu e-mail em breve.",
          );
          return true;
        } else {
          throw new Error(
            result.error || "Erro ao acionar a Inteligência Artificial",
          );
        }
      } catch (error) {
        console.error("Erro no fluxo de upload/processamento:", error);
        // 🚨 EM CASO DE ERRO: Deixamos o backup lá quieto e avisamos o utilizador
        setStatusMessage(
          "❌ Erro de conexão. O áudio está salvo e seguro no seu dispositivo!",
        );
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return {
    isProcessing,
    statusMessage,
    uploadAndProcess,
    setStatusMessage,
  };
}
