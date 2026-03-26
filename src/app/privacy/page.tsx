import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Política de Privacidade
        </h1>
        <div className="prose text-gray-600 space-y-4">
          <p>Última atualização: Março de 2026</p>
          <p>
            O DentalAI está rigorosamente comprometido com a Lei Geral de
            Proteção de Dados (LGPD). Tratamos dados sensíveis de saúde com o
            mais alto padrão de segurança do mercado.
          </p>
          <h2 className="text-xl font-semibold text-gray-800 mt-6">
            1. Coleta e Descarte de Áudio
          </h2>
          <p>
            O áudio capturado durante a consulta é transmitido de forma
            criptografada, processado pelos nossos motores de Inteligência
            Artificial e <strong>deletado permanentemente</strong> em seguida.
            Não armazenamos os arquivos de voz originais dos pacientes.
          </p>
          <h2 className="text-xl font-semibold text-gray-800 mt-6">
            2. Anonimização
          </h2>
          <p>
            Nossa Inteligência Artificial é configurada para não utilizar os
            dados submetidos para treinamento de modelos públicos.
          </p>
          {/* Adicione mais texto conforme necessário */}
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            &larr; Voltar
          </Link>
        </div>
      </div>
    </main>
  );
}
