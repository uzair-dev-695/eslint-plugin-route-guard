import { Controller, Get, Post } from '@nestjs/common';

@Controller('users')
export class UsersController {
  // Valid: unique routes
  @Get()
  findAll() {
    return { users: [] };
  }

  @Post()
  create() {
    return { id: 1 };
  }

  // ERROR: Duplicate GET /users route
  @Get()
  findAllDuplicate() {
    return { duplicate: true };
  }
}
