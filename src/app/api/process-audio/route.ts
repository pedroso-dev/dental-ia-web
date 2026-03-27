import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.fileKey || !data.dentistEmail || !data.dentistId) {
      return NextResponse.json(
        { error: "Faltam parâmetros obrigatórios para o processamento." },
        { status: 400 },
      );
    }

    await inngest.send({
      name: "audio/process.requested",
      data: {
        fileKey: data.fileKey,
        dentistName: data.dentistName,
        crosp: data.crosp,
        dentistEmail: data.dentistEmail,
        dentistId: data.dentistId,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Áudio recebido! O prontuário está sendo processado e será enviado por e-mail.",
    });
  } catch (error) {
    console.error("Erro ao colocar na fila:", error);
    return NextResponse.json(
      { error: "Falha ao enfileirar processo" },
      { status: 500 },
    );
  }
}
