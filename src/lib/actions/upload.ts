'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import { storage } from '../firebase-server';

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const payload = verifyToken(token);

  if (!payload) {
    throw new Error('Token inválido');
  }

  return payload;
}

// Função auxiliar para limpar fotos antigas (opcional)
async function cleanupOldPhotos(userId: string, currentFileName: string) {
  try {
    const bucket = storage.bucket('meinha-baf3e.firebasestorage.app');
    const [files] = await bucket.getFiles({
      prefix: `users/${userId}/photo_`,
    });

    // Deletar fotos antigas (manter apenas a mais recente)
    const filesToDelete = files
      .filter((file: any) => file.name !== currentFileName)
      .slice(0, -1); // Manter a mais recente

    await Promise.all(
      filesToDelete.map((file: any) => file.delete())
    );

    console.log(`Limpeza concluída: ${filesToDelete.length} fotos antigas removidas`);
  } catch (error) {
    console.error('Erro na limpeza de fotos antigas:', error);
    // Não falhar o upload por causa da limpeza
  }
}

export async function uploadPhotoAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const file = formData.get('photo') as File;

    if (!file) {
      return { error: 'Nenhum arquivo foi enviado' };
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return { error: 'Apenas arquivos de imagem são permitidos' };
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'A imagem deve ter no máximo 5MB' };
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Criar nome único para o arquivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `users/${user.userId}/photo_${timestamp}.${fileExtension}`;

    // Upload para Firebase Storage
    const bucket = storage.bucket('meinha-baf3e.firebasestorage.app');
    const fileRef = bucket.file(fileName);
    
    // Upload do arquivo
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: user.userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Tornar o arquivo público
    await fileRef.makePublic();

    // Obter URL pública
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Limpar fotos antigas em background (não bloqueia o upload)
    cleanupOldPhotos(user.userId, fileName).catch(console.error);

    return {
      success: true,
      photoURL: downloadURL,
      message: 'Foto enviada com sucesso',
    };
  } catch (error) {
    console.error('Erro no upload:', error);
    return { error: 'Erro interno do servidor' };
  }
}
