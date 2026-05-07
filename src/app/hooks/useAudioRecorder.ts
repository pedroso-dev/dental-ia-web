import { useState, useRef, useEffect, useCallback } from "react";

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const isCancelledRef = useRef(false);

  // Usamos essa ref para poder "promisificar" o evento onstop do MediaRecorder
  const resolveBlobRef = useRef<((blob: Blob | null) => void) | null>(null);

  // Efeito do Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingTime(0);
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        // Desliga o microfone (luz vermelha da aba do navegador)
        stream.getTracks().forEach((track) => track.stop());

        if (isCancelledRef.current) {
          if (resolveBlobRef.current) resolveBlobRef.current(null);
        } else {
          // Se não foi cancelado, gera o arquivo de áudio final
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          if (resolveBlobRef.current) resolveBlobRef.current(audioBlob);
        }

        resolveBlobRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erro ao acessar microfone:", error);
      throw new Error(
        "Permissão de microfone negada ou dispositivo não encontrado.",
      );
    }
  }, []);

  // Retorna uma Promise que só resolve quando o evento 'onstop' do navegador terminar de montar o Blob
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        resolveBlobRef.current = resolve;
        isCancelledRef.current = false;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } else {
        resolve(null);
      }
    });
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [isRecording]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    isRecording,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
