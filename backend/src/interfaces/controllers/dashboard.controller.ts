import type { Request, Response, NextFunction } from 'express';
import { GetDashboardDataUseCase } from '../../application/use-cases/dashboard/get-dashboard-data.use-case.js';
import { success } from '../../shared/response/index.js';

export class DashboardController {
  constructor(private readonly getDashboardDataUseCase: GetDashboardDataUseCase) {}

  getData = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.getDashboardDataUseCase.execute();
      res.json(success(data, 'Estadísticas obtenidas exitosamente'));
    } catch (error) {
      next(error);
    }
  };
}
