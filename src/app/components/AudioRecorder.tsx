"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAudioRecorder } from "@/app/hooks/useAudioRecorder";
import { useProntuarioUpload } from "@/app/hooks/useProntuarioUpload";
import { get, del } from "idb-keyval"; // 👈 Importamos o leitor do IndexedDB

export default function AudioRecorder() {
  const [dentistName, setDentistName] = useState("");
  const [crosp, setCrosp] = useState("");
  const [dentistEmail, setDentistEmail] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  // 🛡️ Estado para controlar o Backup Local
  const [pendingAudio, setPendingAudio] = useState<Blob | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const {
    isRecording,
    formattedTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const { isProcessing, statusMessage, setStatusMessage, uploadAndProcess } =
    useProntuarioUpload();

  // 1. Busca os dados do Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (user.email) setDentistEmail(user.email);
      setDentistId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, crosp")
        .eq("id", user.id)
        .single();

      if (profile?.full_name && profile?.crosp) {
        setDentistName(profile.full_name);
        setCrosp(profile.crosp);
        setIsReady(true);
      } else {
        router.push("/settings");
      }
    };
    fetchUserData();
  }, [router, supabase]);

  // 2. 🔄 NOVO: Verifica se há áudio preso no dispositivo ao carregar a tela
  useEffect(() => {
    const checkPendingAudio = async () => {
      try {
        const backup = await get("pending_audio_backup");
        if (backup instanceof Blob) {
          setPendingAudio(backup);
        }
      } catch (error) {
        console.error("Erro ao verificar backup local:", error);
      }
    };
    checkPendingAudio();
  }, []);

  const handleStartRecording = async () => {
    if (!isReady || !consentGiven) return;
    setStatusMessage("");
    await startRecording();
  };

  const handleStopRecording = async () => {
    setConsentGiven(false);
    const audioBlob = await stopRecording();

    if (audioBlob) {
      await uploadAndProcess(audioBlob, {
        dentistName,
        crosp,
        dentistEmail,
        dentistId,
      });
    }
  };

  const handleCancelRecording = () => {
    cancelRecording();
    setConsentGiven(false);
    setStatusMessage("Gravação cancelada.");
  };

  // 🔄 NOVO: Funções de Recuperação do Backup
  const handleRetryUpload = async () => {
    if (!pendingAudio) return;
    const success = await uploadAndProcess(pendingAudio, {
      dentistName,
      crosp,
      dentistEmail,
      dentistId,
    });
    if (success) {
      setPendingAudio(null); // Remove o aviso da tela se deu certo
    }
  };

  const handleDiscardBackup = async () => {
    await del("pending_audio_backup");
    setPendingAudio(null);
    setStatusMessage("Backup antigo descartado com sucesso.");
  };

  if (!isReady) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-pulse text-gray-400">
          Preparando ambiente seguro...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl">
      <div className="text-center w-full mb-2">
        <h2 className="text-2xl font-semibold text-gray-800">
          Olá, {dentistName}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Pronto para iniciar uma nova consulta.
        </p>
      </div>

      {/* 🚨 NOVO: Banner de Áudio Pendente */}
      {pendingAudio && !isRecording && (
        <div className="w-full p-4 bg-orange-50 border border-orange-200 rounded-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-orange-800 font-semibold">
            <span>⚠️ Consulta Pendente Encontrada</span>
          </div>
          <p className="text-sm text-orange-700 leading-snug">
            Um áudio anterior não pôde ser enviado devido a uma falha de
            conexão. Deseja enviar agora ou descartar?
          </p>
          <div className="flex gap-3 mt-1">
            <button
              onClick={handleRetryUpload}
              disabled={isProcessing}
              className="flex-1 bg-orange-600 text-white py-2.5 rounded-lg font-medium hover:bg-orange-700 transition-all disabled:opacity-50 shadow-sm"
            >
              {isProcessing ? "Enviando..." : "Enviar Agora"}
            </button>
            <button
              onClick={handleDiscardBackup}
              disabled={isProcessing}
              className="flex-1 bg-white text-orange-600 border border-orange-300 py-2.5 rounded-lg font-medium hover:bg-orange-50 transition-all disabled:opacity-50"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="text-5xl font-mono font-bold text-red-500 animate-pulse my-4">
          {formattedTime}
        </div>
      )}

      {statusMessage && (
        <div
          className={`font-medium mb-2 text-center ${
            statusMessage.includes("✅")
              ? "text-green-600"
              : statusMessage.includes("❌")
                ? "text-red-600"
                : statusMessage.includes("cancelada") ||
                    statusMessage.includes("descartado")
                  ? "text-gray-500"
                  : "text-blue-600 animate-pulse"
          }`}
        >
          {statusMessage}
        </div>
      )}

      <div className="w-full max-w-md flex flex-col items-center gap-4">
        {!isRecording && !isProcessing && (
          <div className="w-full flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-left transition-all">
            <input
              type="checkbox"
              id="lgpd-consent"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            />
            <label
              htmlFor="lgpd-consent"
              className="text-sm text-gray-700 leading-snug cursor-pointer select-none"
            >
              Confirmo que possuo o consentimento explícito do paciente para a
              gravação de áudio desta consulta, de acordo com a LGPD.
            </label>
          </div>
        )}

        {isRecording ? (
          <div className="flex w-full gap-4">
            <button
              onClick={handleCancelRecording}
              className="flex-1 py-4 rounded-xl font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all text-lg shadow-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleStopRecording}
              className="flex-1 py-4 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition-all text-lg shadow-sm"
            >
              Finalizar Gravação
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartRecording}
            disabled={isProcessing || !consentGiven || pendingAudio !== null}
            className={`w-full py-5 rounded-xl font-bold text-white transition-all text-xl shadow-md ${
              isProcessing || !consentGiven || pendingAudio !== null
                ? "bg-gray-400 cursor-not-allowed opacity-70"
                : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-lg"
            }`}
          >
            {isProcessing ? "Processando..." : "Gravar Consulta"}
          </button>
        )}
      </div>
    </div>
  );
}
