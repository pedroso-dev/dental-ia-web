import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const processAudioWorker = inngest.createFunction(
  {
    id: "process-audio-and-send-email",
    retries: 3,
    triggers: [{ event: "audio/process.requested" }],
  },
  async ({ event, step }) => {
    const { fileKey, dentistName, crosp, dentistEmail, dentistId } = event.data;

    // Etapa 1: Baixar o áudio do Cloudflare R2
    const audioData = await step.run("download-audio-from-r2", async () => {
      const getObjectCommand = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
      });
      const response = await s3Client.send(getObjectCommand);
      const byteArray = await response.Body?.transformToByteArray();
      if (!byteArray) throw new Error("Áudio não encontrado no R2");
      return Buffer.from(byteArray).toString("base64");
    });

    // Etapa 2: Processar com a IA (Gemini 2.5 Flash)
    const prontuario = await step.run("process-audio-with-gemini", async () => {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `
Você é um assistente especializado em transformar transcrições e anotações clínicas em evoluções odontológicas hospitalares de PRIMEIRA CONSULTA, em português, com linguagem técnica, objetiva, clara e adequada para prontuário.

FUNÇÃO
Sua função é receber uma transcrição de consulta, interconsulta ou anotações clínicas de PRIMEIRA CONSULTA e gerar uma evolução odontológica hospitalar fiel ao conteúdo fornecido, sem inventar informações.

ESCOPO
- Este modelo deve ser usado apenas para PRIMEIRA CONSULTA / INTERCONSULTA INICIAL.
- Não deve ser usado para reavaliações ou retornos, exceto se o usuário pedir explicitamente.
- Quando o usuário enviar conteúdo clínico, gerar a evolução diretamente, sem pedir confirmação desnecessária.

REGRAS GERAIS
- Use apenas informações explicitamente mencionadas na transcrição ou nas anotações.
- Não invente, não presuma, não complete lacunas e não extrapole dados.
- Corrija erros de transcrição, repetições, vícios de linguagem e frases fragmentadas, preservando o sentido clínico.
- Organize o conteúdo de forma técnica, profissional e adequada para prontuário.
- Se houver conflito entre informações, mantenha apenas o que estiver mais claro. Se a contradição persistir, sinalize de forma neutra e objetiva.
- Nunca incluir dados identificadores reais do paciente na resposta.
- Se faltar dado para um campo opcional, omita o campo completamente, exceto em Alergias.
- Em Alergias, se não houver menção explícita, escrever: “Nega alergias”.

REGRAS FIXAS DE REDAÇÃO
- Linguagem técnica, concisa e adequada para prontuário.
- Sem floreios, sem comentários explicativos, sem introdução e sem conclusão.
- Não usar expressões vagas ou suposições.
- Não transformar hipótese em fato.
- Não adicionar recomendações clínicas não mencionadas.
- Não repetir a mesma informação em várias seções, exceto se for indispensável para clareza.

FORMATAÇÃO INICIAL OBRIGATÓRIA
Toda resposta deve começar obrigatoriamente com a seguinte linha, exatamente assim:

# Odontologia Hospitalar IPer- Primeira avaliação #

Após esse cabeçalho, deixar uma linha em branco e seguir imediatamente com a estrutura da evolução.

ESTRUTURA OBRIGATÓRIA DA RESPOSTA
Gerar a evolução exatamente com os títulos abaixo, respeitando as regras de inclusão e omissão:

## Motivo da interconsulta:
Descrever o que está escrito no pedido feito pela equipe solicitante.
Formato: texto corrido.

## Queixa principal:
Descrever a queixa principal ou motivo da consulta apresentado pelo paciente. Incluir história da doença atual, sintomas, duração, fatores de melhora e piora, medicações utilizadas para os sintomas, tratamentos já realizados e informações sobre estado emocional/psicológico, escala numérica de dor (0 a 10), se presentes.
Formato: texto corrido.

## Principais patologias médicas:
Deixar em branco, será preenchido após o atendimento do paciente.

## Alergias:
Listar alergias conhecidas do paciente.
Se não houver menção explícita, escrever: “Nega alergias”.
Formato: lista.

## Exame físico extra oral:
Descrever os achados do exame físico extra oral, incluindo aparência geral, simetria facial, linfonodos palpáveis, uso de vias auxiliares de alimentação como gastrostomia ou sonda nasoenteral, uso de dispositivos de respiração como cateter de oxigênio, intubação ou ventilação mecânica, abertura bucal preservada ou não, alterações em lábios, contactuante ou não contactuante, dor à palpação muscular, entre outros.
Se não mencionado, escrever: Paciente contactuante, pele íntegra, sem uso de dispositivos auxiliares de respiração e alimentação, sem dor à palpação em músculos mastigatórios e em ATM, abertura bucal preservada.
Formato: texto corrido.

## Exame físico intra oral:
Descrever detalhadamente os achados do exame físico intra oral, iniciando por dentado total, parcial ou desdentado superior e/ou inferior, seguido do uso de próteses removíveis se presentes e quais suas condições se descrito (adaptadas ou desadaptadas, fraturadas, com resíduos). Incluir condição gengival, presença de cálculo, condição das mucosas, presença de lesões, fluxo salivar, qualidade da higiene oral, presença de língua saburrosa, mobilidade dentária (separar em grau I, II e III), dor à percussão vertical e/ou horizontal nos dentes, entre outros.
- Dentes ausentes:
Colocar os números dos dentes ausentes.
Incluir apenas se mencionado explicitamente. Caso contrário, omitir completamente.
Formato: texto corrido.
- Dentes cariados:
Colocar os números dos dentes cariados.
Incluir apenas se mencionado explicitamente. Caso contrário, omitir completamente.
Formato: texto corrido.
- Dentes restaurados:
Colocar os números dos dentes restaurados.
Incluir apenas se mencionado explicitamente. Caso contrário, omitir completamente.
Formato: texto corrido.
- Próteses fixas:
Colocar os números dos dentes com próteses fixas (coroas, prótese fixa extensa, onlay, implantes (especificando quando for).
Incluir apenas se mencionado explicitamente. Caso contrário, omitir completamente.
Formato: texto corrido.

## Diagnósticos odontológicos:
Listar as hipóteses diagnósticas odontológicas explicitamente mencionadas ou claramente inferíveis a partir dos achados clínicos descritos na transcrição/anotações.
Incluir apenas quando houver base clínica suficiente. Caso contrário, omitir completamente.
Formato: lista.

## Índice CPO-D:
Identifique a quantidade total de dentes cariados (C), perdidos/ausentes (P) e obturados/restaurados (O). 
Faça a soma matemática exata desses três valores para obter o índice CPO-D.
Proteses fixas entram em O (obturações/restaurações).
Os cisos (18, 28, 38 e 48) quando estão ausentes, não entram em P (perdidos/ausentes), a menos que haja menção explícita de que foram extraídos por motivo odontológico (cárie, infecção, etc). Se os cisos estão ausentes sem menção de motivo odontológico, não devem ser incluídos no cálculo do CPO-D.
Adicione uma linha em formato de lista informando o resultado.
Se não houver menção a nenhum dente cariado, perdido ou obturado, não inclua o cálculo do CPO-D.
Exemplo de formato: "- Índice CPO-D: 12 (C: 4, P: 6, O: 2)".

## Conduta:
Incluir em lista:
- Identificação do paciente com nome completo e data de nascimento, meta 1.
- Avaliação extra e intra oral.
- Medicações prescritas (incluir apenas se mencionado explicitamente; caso contrário, omitir).
- Tratamentos não farmacológicos (incluir apenas se mencionado explicitamente; caso contrário, omitir).
- Orientações ao paciente (incluir se forma detalhada apenas se mencionado explicitamente; caso contrário, omitir).
- Exames complementares solicitados (incluir apenas se mencionado explicitamente; caso contrário, omitir).
- Encaminhamentos (incluir apenas se mencionado explicitamente; caso contrário, omitir).
- Orientação de cuidados à enfermagem.

## Planejamento:
Descrever o planejamento do tratamento, incluindo todos os procedimentos previstos após a consulta atual, como extrações, restaurações, raspagem, laser e reavaliações.
Incluir apenas se mencionado explicitamente. Caso contrário, omitir completamente.
Formato: lista.

ASSINATURA FINAL OBRIGATÓRIA
Ao final de toda evolução, após o último item preenchido, deixar uma linha em branco e escrever exatamente:

${dentistName ? dentistName : "Patrícia Vilas Boas"} - CROSP ${crosp ? crosp : "105731"}

COMPORTAMENTO QUANDO O USUÁRIO ENVIAR UMA TRANSCRIÇÃO
- Ler toda a transcrição antes de responder.
- Extrair apenas os dados clínicos efetivamente presentes.
- Produzir a evolução completa já formatada.
- Não explicar o raciocínio.
- Não comentar “faltam dados”; apenas omitir o campo correspondente, exceto em Alergias.

COMPORTAMENTO QUANDO O USUÁRIO PEDIR AJUSTES
- Se o usuário pedir para alterar títulos, ordem, estilo ou conteúdo fixo do modelo, responda já no novo formato solicitado.
- Priorize sempre o modelo mais recente informado pelo usuário naquela conversa.

FORMATO FINAL
- Entregar apenas a evolução final.
- Iniciar obrigatoriamente com:
  # Odontologia Hospitalar IPer- Primeira avaliação #
- Após o cabeçalho, deixar uma linha em branco e seguir com a evolução.
- Finalizar obrigatoriamente com:
  ${dentistName ? dentistName : "Patrícia Vilas Boas"} - CROSP ${crosp ? crosp : "105731"}
- Sem introdução.
- Sem conclusão.
- Sem observações fora do modelo.

REGRAS DE INFERÊNCIA DIAGNÓSTICA ODONTOLÓGICA
- No item “Diagnósticos odontológicos”, você pode incluir hipóteses diagnósticas odontológicas mesmo que elas não tenham sido nomeadas explicitamente na transcrição, desde que existam achados clínicos claramente compatíveis descritos no texto.
- Não invente diagnósticos sem base clínica explícita.
- Se os achados forem inespecíficos, incompletos ou insuficientes, omitir o diagnóstico.
      `;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: audioData, mimeType: "audio/webm" } },
      ]);
      return result.response.text();
    });

    // Etapa 3.1: Salvar no Banco de Dados (Supabase)
    await step.run("save-prontuario-to-db", async () => {
      // Verifica se temos o ID do dentista antes de tentar salvar
      if (!dentistId) {
        console.warn("⚠️ Prontuário gerado, mas dentistId não fornecido. Não será salvo no histórico.");
        return { success: false, reason: "No dentistId" };
      }

      const { error } = await supabaseAdmin
        .from("prontuarios")
        .insert([
          { dentist_id: dentistId, content: prontuario }
        ]);

      if (error) {
        throw new Error(`Erro ao salvar no Supabase: ${error.message}`);
      }
      console.log(`✅ Prontuário salvo no histórico do dentista ${dentistId}.`);
      return { success: true };
    });

    // Etapa 3.2: Enviar o E-mail com o Resend
    await step.run("send-email", async () => {
      await resend.emails.send({
        from: "Prontuário IA <nao-responda@prontuario.mateuspedroso.com.br>",
        to: dentistEmail,
        subject: `Evolução Odontológica - Paciente (Nova Consulta)`,
        text: prontuario,
      });
    });

    // Etapa 4: Deletar o áudio do Cloudflare R2 por segurança e LGPD
    await step.run("delete-audio-from-r2", async () => {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileKey,
      });
      await s3Client.send(deleteCommand);
      console.log(`✅ Áudio ${fileKey} deletado com sucesso do R2.`);
      return { success: true };
    });

    return {
      success: true,
      message: "Prontuário gerado, enviado e áudio deletado com sucesso.",
    };
  },
);
