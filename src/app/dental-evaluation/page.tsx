"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Header from "@/app/components/Header";

interface DentalEvaluation {
  id: string;
  content: string;
  created_at: string;
}

export default function DentalEvaluationPage() {
  const [evaluations, setEvaluations] = useState<DentalEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchEvaluations() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (isMounted) setIsAuthenticating(false);

      const { data, error } = await supabase
        .from("prontuarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (isMounted) {
        if (error) {
          console.error("Erro ao buscar avaliações:", error);
        } else {
          setEvaluations(data || []);
        }
        setIsLoading(false);
      }
    }

    fetchEvaluations();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isAuthenticating) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              Avaliações Odontológicas
            </h1>
            <p className="text-gray-500 mt-1">
              Seu histórico de prontuários gerados por IA.
            </p>
          </div>

          {isLoading ? (
            <p className="text-gray-500 animate-pulse">
              Carregando avaliações...
            </p>
          ) : evaluations.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500 mb-4">
                Você ainda não possui consultas processadas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => {
                const isExpanded = expandedIds.includes(evaluation.id);

                return (
                  <div
                    key={evaluation.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleExpand(evaluation.id)}
                      className="w-full text-left p-5 flex justify-between items-center hover:bg-gray-50 transition-colors focus:outline-none"
                    >
                      <span className="text-sm font-medium text-gray-600">
                        Consulta gerada em{" "}
                        <span className="text-gray-900">
                          {formatDate(evaluation.created_at)}
                        </span>
                      </span>

                      <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
                        <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed mt-4">
                          {evaluation.content}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
