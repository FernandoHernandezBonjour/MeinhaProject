'use server';

import { cookies } from 'next/headers';
import { verifyToken } from '../auth-server';
import {
  createForumPost,
  getAllForumPosts,
  getForumPostById,
  addForumComment,
  toggleForumReaction,
  deleteForumPost,
  getUser,
} from '../firestore-server';
import { storage } from '../firebase-server';
import { ForumPost } from '@/types';

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

export async function getForumPostsAction(): Promise<{
  success: boolean;
  posts?: ForumPost[];
  error?: string;
}> {
  try {
    await getAuthenticatedUser();
    const posts = await getAllForumPosts();

    return {
      success: true,
      posts,
    };
  } catch (error) {
    console.error('Erro ao buscar posts do fórum:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
    };
  }
}

export async function createForumPostAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const userData = await getUser(user.userId);

    if (!userData) {
      return { error: 'Usuário não encontrado' };
    }

    const title = (formData.get('title') as string)?.trim();
    const content = (formData.get('content') as string)?.trim();
    const category = (formData.get('category') as string) || 'geral';
    const imageFiles = formData.getAll('images') as File[];

    if (!title) {
      return { error: 'Título é obrigatório' };
    }

    if (!content) {
      return { error: 'Conteúdo é obrigatório' };
    }

    // Upload images
    const imageUrls: string[] = [];
    for (const imageFile of imageFiles) {
      if (!imageFile || imageFile.size === 0) {
        continue;
      }
      if (!imageFile.type.startsWith('image/')) {
        return { error: 'Apenas imagens são permitidas' };
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return { error: 'Cada imagem deve ter no máximo 5MB' };
      }

      const timestamp = Date.now();
      const fileName = `forum/${user.userId}/${timestamp}_${imageFile.name}`;
      const storageRef = storage.bucket().file(fileName);

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      await storageRef.save(buffer, {
        metadata: {
          contentType: imageFile.type,
        },
      });

      await storageRef.makePublic();
      const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${fileName}`;
      imageUrls.push(publicUrl);
    }

    const postData: Omit<ForumPost, 'id' | 'comments' | 'reactions'> = {
      title,
      content,
      authorId: user.userId,
      authorUsername: userData.username,
      authorName: userData.name,
      category: category as 'debate' | 'votacao' | 'zoeira' | 'geral',
      images: imageUrls,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const postId = await createForumPost(postData);

    return { success: true, postId };
  } catch (error) {
    console.error('Erro ao criar post:', error);
    return { error: 'Erro interno do servidor' };
  }
}

export async function addForumCommentAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const userData = await getUser(user.userId);

    if (!userData) {
      return { error: 'Usuário não encontrado' };
    }

    const postId = formData.get('postId') as string;
    const content = (formData.get('content') as string)?.trim();

    if (!postId) {
      return { error: 'ID do post é obrigatório' };
    }

    if (!content) {
      return { error: 'Conteúdo do comentário é obrigatório' };
    }

    const comment = await addForumComment(postId, {
      postId,
      authorId: user.userId,
      username: userData.username,
      content,
    });

    return { success: true, comment };
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return { error: error instanceof Error ? error.message : 'Erro interno do servidor' };
  }
}

export async function toggleForumReactionAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const userData = await getUser(user.userId);

    if (!userData) {
      return { error: 'Usuário não encontrado' };
    }

    const postId = formData.get('postId') as string;
    const reaction = formData.get('reaction') as string;

    if (!postId) {
      return { error: 'ID do post é obrigatório' };
    }

    if (!reaction) {
      return { error: 'Tipo de reação é obrigatório' };
    }

    const result = await toggleForumReaction(postId, {
      postId,
      userId: user.userId,
      username: userData.username,
      reaction,
    });

    return { success: true, ...result };
  } catch (error) {
    console.error('Erro ao reagir ao post:', error);
    return { error: error instanceof Error ? error.message : 'Erro interno do servidor' };
  }
}

export async function deleteForumPostAction(formData: FormData) {
  try {
    const user = await getAuthenticatedUser();
    const postId = formData.get('postId') as string;

    if (!postId) {
      return { error: 'ID do post é obrigatório' };
    }

    const post = await getForumPostById(postId);

    if (!post) {
      return { error: 'Post não encontrado' };
    }

    // Only author or admin can delete
    if (post.authorId !== user.userId) {
      const userData = await getUser(user.userId);
      if (userData?.role !== 'admin') {
        return { error: 'Você não tem permissão para deletar este post' };
      }
    }

    await deleteForumPost(postId);

    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    return { error: error instanceof Error ? error.message : 'Erro interno do servidor' };
  }
}

