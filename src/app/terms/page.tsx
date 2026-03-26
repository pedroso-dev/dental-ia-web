import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Termos de Uso</h1>
        <div className="prose text-gray-600 space-y-4">
          <p>Última atualização: Março de 2026</p>
          <p>
            Bem-vindo ao DentalAI. Ao utilizar nossa plataforma, você concorda
            com as condições abaixo, voltadas para o uso ético e seguro de
            Inteligência Artificial na área da saúde.
          </p>
          <h2 className="text-xl font-semibold text-gray-800 mt-6">
            1. Responsabilidade Médica
          </h2>
          <p>
            O DentalAI é uma ferramenta de apoio à transcrição e não substitui o
            julgamento clínico do profissional de odontologia. A
            responsabilidade pela revisão e aprovação do prontuário gerado é
            exclusivamente do dentista assinante.
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
