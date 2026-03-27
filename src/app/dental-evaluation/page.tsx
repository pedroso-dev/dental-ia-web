"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface DentalEvaluation {
  id: string;
  content: string;
  created_at: string;
}

export default function DentalEvaluationPage() {
  const [evaluations, setEvaluations] = useState<DentalEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Avaliações Odontológicas
          </h1>
          <Link
            href="/"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Nova Consulta
          </Link>
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
            <Link
              href="/"
              className="text-blue-600 font-medium hover:underline"
            >
              Gravar minha primeira consulta
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="text-sm text-gray-400 mb-4 font-medium border-b pb-2">
                  Gerado em {formatDate(evaluation.created_at)}
                </div>
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {evaluation.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
