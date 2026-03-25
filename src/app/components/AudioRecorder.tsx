"use client";

import { useState, useRef, useEffect } from "react";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        console.log("Audio recorded successfully! Size:", audioBlob.size);

        try {
          const filename = `consulta.webm`;
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename, contentType: "audio/webm" }),
          });

          if (!response.ok) throw new Error("Falha ao obter URL de upload");

          const { uploadUrl } = await response.json();

          console.log("Enviando para a nuvem...");
          const uploadResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "audio/webm" },
            body: audioBlob,
          });

          if (uploadResponse.ok) {
            console.log("Upload concluído com sucesso!");
            alert("Áudio enviado com sucesso para a nuvem!");
          } else {
            throw new Error("Falha no upload para o R2");
          }
        } catch (error) {
          console.error("Erro durante o processo de upload:", error);
          alert("Ocorreu um erro ao enviar o áudio.");
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Por favor, permita o acesso ao microfone para gravar a consulta.");
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
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Nova Consulta
        </h2>
        <p className="text-sm text-gray-500">
          {isRecording ? "Gravando áudio..." : "Clique para iniciar a gravação"}
        </p>
      </div>

      {isRecording && (
        <div className="text-4xl font-mono font-bold text-red-500 animate-pulse">
          {formatTime(recordingTime)}
        </div>
      )}

      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-full py-4 rounded-xl font-medium text-white transition-all text-lg shadow-sm ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isRecording ? "Parar Gravação" : "Gravar Consulta"}
      </button>
    </div>
  );
}
