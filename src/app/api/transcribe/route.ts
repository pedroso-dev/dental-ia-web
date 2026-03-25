import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    const { fileKey, dentistName, crosp } = await request.json();

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    });
    const response = await s3Client.send(getObjectCommand);
    const audioData = await response.Body?.transformToByteArray();

    if (!audioData) throw new Error("Falha ao recuperar áudio do R2");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Você é um assistente especializado em transformar transcrições e anotações clínicas em evoluções odontológicas hospitalares de PRIMEIRA CONSULTA, em português, com linguagem técnica, objetiva, clara e adequada para prontuário.

FUNÇÃO
Sua função é receber uma transcrição de consulta (no formato de áudio anexo) e gerar uma evolução odontológica hospitalar fiel ao conteúdo fornecido, sem inventar informações.

ESCOPO
- Este modelo deve ser usado apenas para PRIMEIRA CONSULTA / INTERCONSULTA INICIAL.
- Não deve ser usado para reavaliações ou retornos.
- Gerar a evolução diretamente, sem pedir confirmação desnecessária.

REGRAS GERAIS
- Use apenas informações explicitamente mencionadas na transcrição ou nas anotações.
- Não invente, não presuma, não complete lacunas e não extrapole dados.
- Corrija erros de transcrição, repetições, vícios de linguagem e frases fragmentadas, preservando o sentido clínico.
- Organize o conteúdo de forma técnica, profissional e adequada para prontuário.
- Se houver conflito entre informações, mantenha apenas o que estiver mais claro.
- Nunca incluir dados identificadores reais do paciente na resposta.
- Se faltar dado para um campo opcional, omita o campo completamente, exceto em Alergias.
- Em Alergias, se não houver menção explícita, escrever: "Nega alergias".

REGRAS FIXAS DE REDAÇÃO
- Linguagem técnica, concisa e adequada para prontuário.
- Sem floreios, sem comentários explicativos, sem introdução e sem conclusão.
- Não usar expressões vagas ou suposições.
- Não transformar hipótese em fato.
- Não adicionar recomendações clínicas não mencionadas.
- Não repetir a mesma informação em várias seções.

FORMATAÇÃO INICIAL OBRIGATÓRIA
Toda resposta deve começar obrigatoriamente com a seguinte linha:
# Odontologia Hospitalar IPer- Primeira avaliação #
Após esse cabeçalho, deixar uma linha em branco e seguir imediatamente com a estrutura da evolução.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA
Gerar a evolução exatamente com os títulos abaixo, respeitando as regras de inclusão e omissão:

## Motivo da interconsulta:
Descrever o que está escrito no pedido feito pela equipe solicitante.

## Queixa principal:
Descrever a queixa principal ou motivo da consulta apresentado pelo paciente. Incluir história da doença atual, sintomas, duração, fatores de melhora e piora, medicações, tratamentos já realizados e informações sobre estado emocional/psicológico, escala numérica de dor (0 a 10), se presentes.

## Principais patologias médicas:
Deixar em branco, será preenchido após o atendimento do paciente.

## Alergias:
Listar alergias conhecidas do paciente. Se não houver, escrever: "Nega alergias".

## Exame físico extra oral:
Descrever achados do exame extra oral (aparência geral, simetria facial, linfonodos, vias auxiliares de alimentação, dispositivos de respiração, abertura bucal, lábios, contato, dor muscular, etc). Se não mencionado, escrever: Paciente contactuante, pele íntegra, sem uso de dispositivos auxiliares de respiração e alimentação, sem dor à palpação em músculos mastigatórios e em ATM, abertura bucal preservada.

## Exame físico intra oral:
Descrever achados (dentado/desdentado, próteses, condição gengival, cálculo, mucosas, lesões, fluxo salivar, higiene, língua saburrosa, mobilidade, dor à percussão).
- Dentes ausentes: Omitir se não mencionado.
- Dentes cariados: Omitir se não mencionado.
- Dentes restaurados: Omitir se não mencionado.
- Próteses fixas: Omitir se não mencionado.

## Diagnósticos odontológicos:
Listar hipóteses diagnósticas explícitas ou claramente inferíveis. Omitir se não houver base.

## Conduta:
Incluir em lista (apenas se mencionado, exceto os 2 primeiros que são obrigatórios):
- Identificação do paciente com nome completo e data de nascimento, meta 1.
- Avaliação extra e intra oral.
- Medicações prescritas.
- Tratamentos não farmacológicos.
- Orientações ao paciente.
- Exames complementares.
- Encaminhamentos.
- Orientação de cuidados à enfermagem.

## Planejamento:
Descrever o planejamento do tratamento. Omitir se não mencionado.

ASSINATURA FINAL OBRIGATÓRIA
Deixar uma linha em branco no final e assinar EXATAMENTE assim:
${dentistName ? dentistName : '{NOME DO DENTISTA}'} - CROSP ${crosp ? crosp : '{NUMERO CROSP}'}
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: Buffer.from(audioData).toString("base64"),
          mimeType: "audio/webm",
        },
      },
    ]);

    const transcription = result.response.text();

    return NextResponse.json({ transcription });

  } catch (error) {
    console.error('Erro na transcrição:', error);
    return NextResponse.json({ error: 'Falha ao processar áudio com IA' }, { status: 500 });
  }
}