"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-xl text-blue-600 tracking-tight"
          onClick={closeMenu}
        >
          DentalAI
        </Link>

        {/* Navegação Desktop (Escondida no celular) */}
        <nav className="hidden md:flex gap-6 items-center">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Nova Consulta
          </Link>
          <Link
            href="/dental-evaluation"
            className={`text-sm font-medium transition-colors ${
              pathname === "/dental-evaluation"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Avaliações
          </Link>
          <Link
            href="/settings"
            className={`text-sm font-medium transition-colors ${
              pathname === "/settings"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Configurações
          </Link>

          <div className="h-5 w-px bg-gray-300 mx-2"></div>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Sair
          </button>
        </nav>

        {/* Botão Menu Hambúrguer (Apenas no celular) */}
        <button
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Abrir menu"
        >
          {isMobileMenuOpen ? (
            // Ícone de "X" (Fechar)
            <svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // Ícone de "Hambúrguer" (Abrir)
            <svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Menu Mobile Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col px-6 py-4 gap-4">
            <Link
              href="/"
              onClick={closeMenu}
              className={`text-base font-medium transition-colors ${
                pathname === "/" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Nova Consulta
            </Link>
            <Link
              href="/dental-evaluation"
              className={`text-sm font-medium transition-colors ${
                pathname === "/dental-evaluation"
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Avaliações
            </Link>
            <Link
              href="/settings"
              onClick={closeMenu}
              className={`text-base font-medium transition-colors ${
                pathname === "/settings" ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Configurações
            </Link>

            <div className="h-px w-full bg-gray-100 my-1"></div>

            <button
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
              className="text-left text-base font-medium text-red-600"
            >
              Sair da Conta
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
