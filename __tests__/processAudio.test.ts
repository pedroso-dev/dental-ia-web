import fs from "fs";
import path from "path";
// Vamos simular a chamada da IA para não gastar sua cota real durante os testes
jest.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () =>
              "# Odontologia Hospitalar IPer- Primeira avaliação #\n\n## Motivo da interconsulta:\nTeste mockado com sucesso.",
          },
        }),
      }),
    })),
  };
});

describe("Processamento de Áudios Gigantes (>20MB)", () => {
  it("Deve conseguir ler o arquivo local de 25MB sem estourar a memória", () => {
    // Substitua pelo nome real do seu arquivo salvo na pasta __fixtures__
    const fixturePath = path.join(
      __dirname,
      "__fixtures__",
      "test03.webm",
    );

    // Verifica se o arquivo existe para o teste não dar falso-positivo
    expect(fs.existsSync(fixturePath)).toBe(true);

    const fileStats = fs.statSync(fixturePath);
    const fileSizeInMB = fileStats.size / (1024 * 1024);

    console.log(`Tamanho do arquivo de teste: ${fileSizeInMB.toFixed(2)} MB`);

    // Garante que estamos testando o cenário correto (arquivo maior que o limite do inlineData)
    expect(fileSizeInMB).toBeGreaterThan(20);

    // Simula a leitura que faríamos do S3/R2
    const buffer = fs.readFileSync(fixturePath);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
