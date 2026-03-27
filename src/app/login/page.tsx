"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      } else {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("E-mail ou senha incorretos.");
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "Conta criada! Verifique sua caixa de entrada para confirmar o e-mail.",
      );
    }
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="animate-pulse text-gray-400">Verificando sessão...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            DentalAI Assistant
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Faça login para acessar seus prontuários
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="dr@clinica.com.br"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {loading ? "Processando..." : "Entrar"}
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-200 hover:bg-blue-50 disabled:opacity-50"
            >
              Criar nova conta
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            Ao entrar ou criar uma conta, você concorda com nossos <br />
            <Link href="/terms" className="text-blue-600 hover:underline">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Política de Privacidade
            </Link>
            .
          </div>
        </form>
      </div>
    </div>
  );
}
