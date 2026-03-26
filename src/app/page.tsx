import AudioRecorder from "./components/AudioRecorder";
import LogoutButton from "./components/LogoutButton";

export default function Home() {
  return (
    // Adicionei a classe "relative" aqui no main
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <LogoutButton />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          DentalAI Assistant
        </h1>
        <p className="text-gray-600">
          Grave o áudio da consulta para gerar a evolução clínica.
        </p>
      </div>

      <AudioRecorder />
    </main>
  );
}
