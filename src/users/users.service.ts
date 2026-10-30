import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../common/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(dto: CreateUserDto) {
    const exists = await this.repo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email đã tồn tại');

    const user = this.repo.create({
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role,
      passwordHash: await bcrypt.hash(dto.password, 10),
    });
    const saved = await this.repo.save(user);
    const { passwordHash, ...result } = saved;
    return result;
  }

  findAll() {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  // dùng cho login: lấy kèm password_hash
  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email })
      .getOne();
  }

  async setActive(id: number, isActive: boolean) {
    const user = await this.findOne(id);
    user.isActive = isActive;
    return this.repo.save(user);
  }

  // Đổi vai trò. Không cho tự đổi vai trò của chính mình để tránh mất quyền ADMIN cuối cùng.
  async updateRole(id: number, role: Role, currentUserId: number) {
    if (id === currentUserId) {
      throw new ConflictException('Không thể tự đổi vai trò của chính mình');
    }
    const user = await this.findOne(id);
    user.role = role;
    return this.repo.save(user);
  }
}
