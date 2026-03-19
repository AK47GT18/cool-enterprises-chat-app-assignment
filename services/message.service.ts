import { prisma } from '@/lib/prisma';
import { encryptMessage } from '@/lib/encryption';

export const MessageService = {
  /**
   * Create a new message in a conversation.
   */
  async createMessage({
    conversationId,
    senderId,
    body,
    imageUrl,
    videoUrl,
    documentUrl,
    voiceNoteUrl,
    replyToId
  }: {
    conversationId: string;
    senderId: string;
    body?: string;
    imageUrl?: string;
    videoUrl?: string;
    documentUrl?: string;
    voiceNoteUrl?: string;
    replyToId?: string;
  }) {
    const encryptedBody = body ? encryptMessage(body) : body;

    return prisma.message.create({
      data: {
        conversationId,
        senderId,
        body: encryptedBody,
        imageUrl,
        videoUrl,
        documentUrl,
        voiceNoteUrl,
        replyToId
      },
      include: {
        sender: {
          select: { username: true, image: true }
        },
        replyTo: {
          include: {
            sender: {
              select: { username: true, image: true }
            }
          }
        }
      }
    });
  },

  /**
   * Soft delete a message (hide contents).
   */
  async softDeleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== userId) {
      throw new Error("Unauthorized or not found");
    }

    return prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        body: null,
        imageUrl: null,
        videoUrl: null,
        documentUrl: null,
        voiceNoteUrl: null,
      }
    });
  },

  /**
   * Toggle a reaction on a message
   */
  async toggleReaction(messageId: string, userId: string, emoji: string) {
    const existing = await prisma.reaction.findUnique({
      where: {
        messageId_userId: { messageId, userId }
      }
    });

    if (existing) {
      if (existing.emoji === emoji) {
        // Remove reaction
        await prisma.reaction.delete({
          where: { messageId_userId: { messageId, userId } }
        });
        return { action: 'removed', reaction: existing };
      } else {
        // Update reaction
        const updated = await prisma.reaction.update({
          where: { messageId_userId: { messageId, userId } },
          data: { emoji },
          include: { user: { select: { username: true, image: true } } }
        });
        return { action: 'updated', reaction: updated };
      }
    } else {
      // Create reaction
      const created = await prisma.reaction.create({
        data: { messageId, userId, emoji },
        include: { user: { select: { username: true, image: true } } }
      });
      return { action: 'added', reaction: created };
    }
  },

  /**
   * Search messages in a conversation by query
   */
  async searchMessages(conversationId: string, query: string) {
    if (!query) return [];
    
    return prisma.message.findMany({
      where: {
        conversationId,
        body: {
          contains: query,
          mode: 'insensitive'
        },
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: { username: true, image: true }
        }
      },
      take: 50
    });
  }
};
