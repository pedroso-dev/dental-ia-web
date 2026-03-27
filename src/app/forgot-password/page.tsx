"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "Se este e-mail estiver cadastrado, você receberá um link de recuperação em instantes.",
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Recuperar Senha
        </h2>
        <p className="text-gray-600 text-base text-center mb-10">
          Digite seu e-mail para receber as instruções de redefinição.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-6">
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

          {message && (
            <div className="p-4 bg-green-100 text-green-900 text-sm rounded-xl border border-green-200 flex items-start gap-3 shadow-inner transition-all animate-fade-in">
              <svg
                className="w-5 h-5 text-green-600 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{message}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-800 mb-2"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dr@clinica.com.br"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-100">
          <Link
            href="/login"
            className="text-sm text-blue-600 font-semibold hover:text-blue-500 hover:underline flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
