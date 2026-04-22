import { processAudioWorker } from "../src/inngest/functions";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

// ==========================================
// 1. MOCKS: SIMULANDO OS SERVIÇOS EXTERNOS
// ==========================================

// Mock do AWS S3 / Cloudflare R2
jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn((command) => {
        if (command instanceof GetObjectCommand) {
          return Promise.resolve({
            Body: {
              transformToByteArray: () =>
                Promise.resolve(new Uint8Array([1, 2, 3])), // Simula o download do áudio
            },
          });
        }
        if (command instanceof DeleteObjectCommand) {
          return Promise.resolve(); // Simula a exclusão com sucesso
        }
        return Promise.resolve();
      }),
    })),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  };
});

// Mock do Google AI File Manager (Upload)
jest.mock("@google/generative-ai/server", () => {
  return {
    GoogleAIFileManager: jest.fn().mockImplementation(() => ({
      uploadFile: jest.fn().mockResolvedValue({
        file: {
          uri: "mock-uri",
          mimeType: "audio/webm",
          name: "mock-file-name",
        },
      }),
      deleteFile: jest.fn().mockResolvedValue({}),
    })),
  };
});

// Mock do Google Gemini (Processamento)
jest.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () =>
              "# Odontologia Hospitalar IPer\n\n## Motivo da interconsulta:\nTeste completo.",
          },
        }),
      }),
    })),
  };
});

// Mock do Supabase (Banco de Dados)
jest.mock("@supabase/supabase-js", () => {
  const insertMock = jest.fn().mockResolvedValue({ error: null });
  return {
    createClient: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        insert: insertMock,
      }),
    }),
  };
});

// Mock do Resend (E-mail)
jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: "mock-email-id" }),
      },
    })),
  };
});

// Mock do File System para não escrever no disco local da máquina durante o teste
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
}));

// ==========================================
// 2. O TESTE DE INTEGRAÇÃO
// ==========================================

describe("Integração Completa: Worker do Inngest", () => {
  it("Deve executar o fluxo completo (Download -> Upload AI -> BD -> Email -> Delete R2)", async () => {
    // Simulamos os dados que o frontend envia para o Inngest
    const mockEvent = {
      data: {
        fileKey: "sessions/audio-teste.webm",
        dentistName: "Dr. Mateus",
        crosp: "12345",
        dentistEmail: "mateus@teste.com",
        dentistId: "uuid-1234",
      },
    };

    // Simulamos o orquestrador do Inngest (bypassando os delays de background)
    const mockStep = {
      run: jest.fn(async (stepName, callback) => {
        return await callback();
      }),
    };

    // Extrai a função principal do Worker que criamos
    // (O Inngest encapsula a função em arrays/objetos, acessamos a lógica interna através dos internals)
    const handler = (processAudioWorker as any).fns
      ? (processAudioWorker as any).fns[0]
      : (processAudioWorker as any).handler ||
        (processAudioWorker as any)["_fn"];

    let result;
    if (typeof processAudioWorker === "function") {
      // @ts-ignore
      result = await processAudioWorker({ event: mockEvent, step: mockStep });
    } else {
      // Acessando a função anônima que passamos pro createFunction
      const workerFn = (processAudioWorker as any).fn;
      result = await workerFn({ event: mockEvent, step: mockStep });
    }

    // 1. Verifica se finalizou com sucesso
    expect(result.success).toBe(true);

    // 2. Verifica se TODAS as etapas do Inngest foram chamadas
    expect(mockStep.run).toHaveBeenCalledWith(
      "download-and-process-audio",
      expect.any(Function),
    );
    expect(mockStep.run).toHaveBeenCalledWith(
      "save-prontuario-to-db",
      expect.any(Function),
    );
    expect(mockStep.run).toHaveBeenCalledWith(
      "send-email",
      expect.any(Function),
    );
    expect(mockStep.run).toHaveBeenCalledWith(
      "delete-audio-from-r2",
      expect.any(Function),
    );

    // 3. Verifica se a limpeza local (LGPD) foi chamada no fs.unlinkSync
    expect(fs.unlinkSync).toHaveBeenCalled();

    // 4. Verifica a chamada de exclusão no AWS SDK (R2) garantindo que o arquivo não fica zumbi
    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: "sessions/audio-teste.webm",
    });
  });
});
