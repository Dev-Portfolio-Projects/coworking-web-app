import type { Request, Response, NextFunction } from 'express';
import { ChatUseCase } from '../../application/use-cases/chat/chat.use-case.js';
import { chatSchema } from '../../application/dto/chat/chat.dto.js';
import { success } from '../../shared/response/index.js';

export class ChatController {
  constructor(private readonly chatUseCase: ChatUseCase) {}

  send = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = (req as any).user;
      const dto = chatSchema.parse(req.body);
      const result = await this.chatUseCase.execute(userId, dto.message);
      res.json(success(result, 'Respuesta generada'));
    } catch (error) {
      next(error);
    }
  };
}
