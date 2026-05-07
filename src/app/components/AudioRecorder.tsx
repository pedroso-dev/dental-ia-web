"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAudioRecorder } from "@/app/hooks/useAudioRecorder";
import { useProntuarioUpload } from "@/app/hooks/useProntuarioUpload";

export default function AudioRecorder() {
  // Estados do usuário e LGPD
  const [dentistName, setDentistName] = useState("");
  const [crosp, setCrosp] = useState("");
  const [dentistEmail, setDentistEmail] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Nossos novos Custom Hooks 🚀
  const {
    isRecording,
    formattedTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  const { isProcessing, statusMessage, setStatusMessage, uploadAndProcess } =
    useProntuarioUpload();

  // Busca os dados da dentista no banco
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

      if (profile && profile.full_name && profile.crosp) {
        setDentistName(profile.full_name);
        setCrosp(profile.crosp);
        setIsReady(true);
      } else {
        router.push("/settings");
      }
    };

    fetchUserData();
  }, [router, supabase]);

  // Funções "ponte" que conectam a interface aos Hooks
  const handleStartRecording = async () => {
    if (!isReady || !consentGiven) return;
    setStatusMessage("");
    await startRecording();
  };

  const handleStopRecording = async () => {
    setConsentGiven(false);
    const audioBlob = await stopRecording(); // A mágica da Promise aqui!

    if (audioBlob) {
      // Passa a bola para o Hook de Upload
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

  // Renderização da Interface (inalterada, apenas consumindo variáveis mais limpas)
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

      {isRecording && (
        <div className="text-5xl font-mono font-bold text-red-500 animate-pulse my-4">
          {formattedTime}
        </div>
      )}

      {statusMessage && (
        <div
          className={`font-medium mb-2 ${
            statusMessage.includes("✅")
              ? "text-green-600"
              : statusMessage.includes("❌")
                ? "text-red-600"
                : statusMessage.includes("cancelada")
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
            disabled={isProcessing || !consentGiven}
            className={`w-full py-5 rounded-xl font-bold text-white transition-all text-xl shadow-md ${
              isProcessing || !consentGiven
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
