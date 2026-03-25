"use client";

import { useState, useRef, useEffect } from "react";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Estados para os dados do profissional
  const [dentistName, setDentistName] = useState("Mateus");
  const [crosp, setCrosp] = useState("123456");
  const [dentistEmail, setDentistEmail] = useState("mateuspedroso.dev@gmail.com");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

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
      alert("Por favor, preencha o e-mail para receber o prontuário.");
      return;
    }

    try {
      setRecordingTime(0);
      setStatusMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setIsProcessing(true);
        setStatusMessage("Fazendo upload do áudio seguro...");

        try {
          // 1. Upload para o R2
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

          // 2. Chamar a NOVA rota Assíncrona (Inngest) passando o E-mail
          const iaRes = await fetch("/api/process-audio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, dentistName, crosp, dentistEmail }),
          });

          const result = await iaRes.json();

          if (iaRes.ok) {
            // Sucesso! A tela é liberada na hora.
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
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsRecording(false);
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
            placeholder="Seu E-mail (para receber o prontuário)"
            value={dentistEmail}
            onChange={(e) => setDentistEmail(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg text-black"
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

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`w-full max-w-md py-4 rounded-xl font-medium text-white transition-all text-lg shadow-sm ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : isProcessing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isRecording
          ? "Parar Gravação"
          : isProcessing
            ? "Processando..."
            : "Gravar Consulta"}
      </button>
    </div>
  );
}
