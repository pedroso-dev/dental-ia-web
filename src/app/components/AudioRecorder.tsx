"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [dentistName, setDentistName] = useState("");
  const [crosp, setCrosp] = useState("");
  const [dentistEmail, setDentistEmail] = useState("");
  const [isReady, setIsReady] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const isCancelledRef = useRef(false);

  const router = useRouter();
  const supabase = createClient();

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    if (!isReady) return;

    try {
      setRecordingTime(0);
      setStatusMessage("");
      isCancelledRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        if (isCancelledRef.current) {
          isCancelledRef.current = false;
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setIsProcessing(true);
        setStatusMessage("Fazendo upload do áudio seguro...");

        try {
          const filename = `consulta-${Date.now()}.webm`;
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, contentType: "audio/webm" }),
          });

          if (!uploadRes.ok) throw new Error("Falha ao obter URL");
          const { uploadUrl, fileKey } = await uploadRes.json();

          await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "audio/webm" },
            body: audioBlob,
          });

          setStatusMessage("Enviando para a fila de processamento da IA...");

          const iaRes = await fetch("/api/process-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, dentistName, crosp, dentistEmail }),
          });

          const result = await iaRes.json();

          if (iaRes.ok) {
            setStatusMessage(
              "✅ Áudio na fila! O prontuário chegará no seu e-mail em breve.",
            );
          } else {
            throw new Error(result.error || "Erro ao processar");
          }
        } catch (error) {
          console.error("Erro:", error);
          setStatusMessage("❌ Ocorreu um erro ao processar a consulta.");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      alert("Permita o acesso ao microfone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = false;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      setStatusMessage("Gravação cancelada.");
    }
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
      <div className="text-center w-full mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Olá, {dentistName}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Pronto para iniciar uma nova consulta.
        </p>
      </div>

      {isRecording && (
        <div className="text-5xl font-mono font-bold text-red-500 animate-pulse my-4">
          {formatTime(recordingTime)}
        </div>
      )}

      {statusMessage && (
        <div
          className={`font-medium mb-4 ${statusMessage.includes("✅") ? "text-green-600" : statusMessage.includes("❌") ? "text-red-600" : "text-blue-600 animate-pulse"}`}
        >
          {statusMessage}
        </div>
      )}

      {isRecording ? (
        <div className="flex w-full max-w-md gap-4">
          <button
            onClick={cancelRecording}
            className="flex-1 py-4 rounded-xl font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 transition-all text-lg shadow-sm"
          >
            Cancelar
          </button>
          <button
            onClick={stopRecording}
            className="flex-1 py-4 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition-all text-lg shadow-sm"
          >
            Finalizar Gravação
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          disabled={isProcessing}
          className={`w-full max-w-md py-5 rounded-xl font-bold text-white transition-all text-xl shadow-md hover:shadow-lg ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-1"
          }`}
        >
          {isProcessing ? "Processando..." : "Gravar Consulta"}
        </button>
      )}
    </div>
  );
}
