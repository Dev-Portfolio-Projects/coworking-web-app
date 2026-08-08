import type { DashboardRepository } from '../../../domain/repositories/dashboard.repository.js';

export class GetDashboardDataUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async execute() {
    return this.dashboardRepository.getData();
  }
}
