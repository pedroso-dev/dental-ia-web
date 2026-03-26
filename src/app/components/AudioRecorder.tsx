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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const isCancelledRef = useRef(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
      } else {
        if (user.email) {
          setDentistEmail(user.email);
        }
      }
    };

    checkUser();
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
    if (!dentistEmail) {
      alert("Por favor, aguarde o carregamento do seu e-mail.");
      return;
    }

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
        setStatusMessage("A fazer o upload do áudio de forma segura...");

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

          setStatusMessage("A enviar para a fila de processamento da IA...");

          const iaRes = await fetch("/api/process-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, dentistName, crosp, dentistEmail }),
          });

          const result = await iaRes.json();

          if (iaRes.ok) {
            setStatusMessage(
              "✅ Áudio na fila! O prontuário chegará ao seu e-mail em breve.",
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

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl">
      <div className="text-center w-full">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Nova Consulta
        </h2>

        <div className="flex flex-col gap-4 my-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Nome do Dentista"
              value={dentistName}
              onChange={(e) => setDentistName(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg text-black"
            />
            <input
              type="text"
              placeholder="CROSP"
              value={crosp}
              onChange={(e) => setCrosp(e.target.value)}
              className="w-1/3 p-3 border border-gray-300 rounded-lg text-black"
            />
          </div>

          <input
            type="email"
            placeholder="A carregar utilizador..."
            value={dentistEmail}
            disabled={true}
            className="w-full p-3 border border-gray-200 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>

      {isRecording && (
        <div className="text-4xl font-mono font-bold text-red-500 animate-pulse">
          {formatTime(recordingTime)}
        </div>
      )}

      {statusMessage && (
        <div
          className={`font-medium ${statusMessage.includes("✅") ? "text-green-600" : statusMessage.includes("❌") ? "text-red-600" : "text-blue-600 animate-pulse"}`}
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
          className={`w-full max-w-md py-4 rounded-xl font-medium text-white transition-all text-lg shadow-sm ${
            isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isProcessing ? "A processar..." : "Gravar Consulta"}
        </button>
      )}
    </div>
  );
}
