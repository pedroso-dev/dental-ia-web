"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Criar nova senha
        </h2>
        <p className="text-gray-600 text-base text-center mb-10">
          Digite a sua nova senha de acesso abaixo.
        </p>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 text-red-900 text-sm rounded-xl border border-red-200 flex items-start gap-3 shadow-inner">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              Nova Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? "A guardar..." : "Guardar e Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
