import { useState, useCallback } from "react";

// Tipagem para garantir que não vamos esquecer nenhum dado do dentista
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
      setStatusMessage("Fazendo upload do áudio seguro...");

      try {
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

        // 2. Envia o áudio pesado diretamente do navegador para o R2 (Bypass)
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "audio/webm" },
          body: audioBlob,
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
        setStatusMessage("❌ Ocorreu um erro ao processar a consulta.");
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
    setStatusMessage, // Exportamos caso o componente queira limpar a mensagem ao gravar novo áudio
  };
}
