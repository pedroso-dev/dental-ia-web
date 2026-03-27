"use client";

import { useState, useEffect } from "react";

export default function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // 1. Detecta se é um dispositivo iOS (iPhone, iPad, iPod)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    // 2. Detecta se já está rodando como PWA instalado (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true);

    // 3. Verifica se o usuário já dispensou o aviso antes
    const hasDismissed = localStorage.getItem("dismissedIosPrompt");

    // Se for iOS, NÃO estiver instalado, e NÃO tiver sido dispensado, mostra o aviso
    if (isIOS && !isStandalone && !hasDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("dismissedIosPrompt", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-100 bg-white border border-gray-200 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 animate-bounce shadow-blue-900/10">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-gray-800 text-sm">
          Instale o app DentalAI
        </h3>
        <button
          onClick={dismissPrompt}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">
        Para usar o aplicativo em tela cheia no seu iPhone, toque em{" "}
        <strong>Compartilhar</strong> (o quadrado com a seta para cima na barra
        inferior do Safari) e depois selecione{" "}
        <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
      </p>
    </div>
  );
}
