"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [crosp, setCrosp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, crosp")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name || "");
        setCrosp(data.crosp || "");
      }
      setLoading(false);
    }

    getProfile();
  }, [router, supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      crosp: crosp,
      updated_at: new Date(),
    });

    if (error) {
      setMessage("❌ Erro ao salvar os dados.");
      console.error(error);
    } else {
      setMessage("✅ Perfil salvo com sucesso!");
      setTimeout(() => router.push("/"), 1500);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">Carregando perfil...</div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Seu Perfil</h1>
          <p className="text-sm text-gray-600">
            Configure seus dados profissionais. Eles serão usados em todos os
            seus prontuários.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome Completo
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              placeholder="Ex: Dra. Patrícia Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Registro (CROSP)
            </label>
            <input
              type="text"
              required
              value={crosp}
              onChange={(e) => setCrosp(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
              placeholder="Ex: 123456"
            />
          </div>

          {message && (
            <p
              className={`text-sm font-medium ${message.includes("✅") ? "text-green-600" : "text-red-600"}`}
            >
              {message}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-gray-400"
            >
              {saving ? "Salvando..." : "Salvar Dados"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
