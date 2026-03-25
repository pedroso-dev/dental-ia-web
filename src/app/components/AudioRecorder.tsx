"use client";

import { useState, useRef, useEffect } from "react";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prontuario, setProntuario] = useState("");

  const [dentistName, setDentistName] = useState("Mateus");
  const [crosp, setCrosp] = useState("123456");

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
    try {
      setRecordingTime(0);
      setProntuario("");
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

        try {
          // 1. Upload para o R2 (como fizemos antes)
          const filename = `consulta.webm`;
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

          // 2. Chamar a IA com os dados do dentista
          console.log("Gerando prontuário...");
          const iaRes = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey, dentistName, crosp }),
          });

          const { transcription } = await iaRes.json();
          setProntuario(transcription);
        } catch (error) {
          console.error("Erro:", error);
          alert("Erro ao processar a consulta.");
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

        <div className="flex gap-4 my-6">
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
      </div>

      {isRecording && (
        <div className="text-4xl font-mono font-bold text-red-500 animate-pulse">
          {formatTime(recordingTime)}
        </div>
      )}

      {isProcessing && (
        <div className="text-blue-600 font-medium animate-pulse">
          Analisando áudio e gerando prontuário com IA...
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

      {prontuario && (
        <div className="w-full mt-6 text-left">
          <h3 className="font-bold text-gray-700 mb-2">Prontuário Gerado:</h3>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 whitespace-pre-wrap text-sm text-gray-800 font-mono">
            {prontuario}
          </div>
        </div>
      )}
    </div>
  );
}
