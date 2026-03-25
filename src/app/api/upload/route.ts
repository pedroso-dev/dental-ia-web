import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Inicializando o cliente S3 com as credenciais do Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'O nome do arquivo e o formato são obrigatórios.' },
        { status: 400 }
      );
    }

    const fileKey = `sessions/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    console.log(`Pre-signed URL generated for: ${fileKey}`);

    return NextResponse.json({ uploadUrl, fileKey });

  } catch (error) {
    console.error('Error generating Pre-signed URL:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a requisição de upload.' },
      { status: 500 }
    );
  }
}