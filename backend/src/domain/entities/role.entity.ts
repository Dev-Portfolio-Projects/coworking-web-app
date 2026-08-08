import type { Role } from '../../shared/types/index.js';

export class RoleEntity {
  constructor(
    public readonly id: number,
    public readonly name: Role,
  ) {}
}
