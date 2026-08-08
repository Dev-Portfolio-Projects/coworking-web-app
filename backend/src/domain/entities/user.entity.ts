import { RoleEntity } from './role.entity.js';

export class UserEntity {
  constructor(
    public readonly id: number,
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly roleId: number,
    public readonly role?: RoleEntity,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
