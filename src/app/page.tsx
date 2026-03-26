import AudioRecorder from "./components/AudioRecorder";
import Header from "./components/Header";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* O nosso novo menu fixo no topo */}
      <Header />

      {/* O conteúdo centralizado da página */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AudioRecorder />
      </div>
    </main>
  );
}
