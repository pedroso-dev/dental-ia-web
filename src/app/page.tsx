"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import AudioRecorder from "./components/AudioRecorder";
import Header from "./components/Header";

export default function Home() {
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/login");
        return;
      }

      if (isMounted) {
        setIsAuthenticating(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  if (isAuthenticating) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <AudioRecorder />
      </div>
    </main>
  );
}
