import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { UserQueryDto } from '../../dto/users/user-query.dto.js';
import type { Paginated } from '../../../shared/types/index.js';
import type { UserEntity } from '../../../domain/entities/user.entity.js';
import { paginate } from '../../../shared/pagination.js';

export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: UserQueryDto): Promise<Paginated<UserEntity>> {
    const { page, limit, search, roleId } = dto;
    const { items, total } = await this.userRepository.findAll({ search, roleId, page, limit });

    return paginate(items, total, page, limit);
  }
}
