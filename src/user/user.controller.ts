// import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
// import { UserService } from '../user/user.service';
// import { Roles } from '../auth/roles.decorator';
// import { AuthGuard } from '../auth/auth.guard';
// // import { UserRole } from '@prisma/client';
// import { UserRole } from './user-role.enum';

// @Controller('users')
// export class UserController {
//   constructor(private userService: UserService) {}

//   @Patch(':id/role')
//   @Roles(UserRole.ADMIN) // Only admins can access this route
//   @UseGuards(AuthGuard) // AuthGuard will check both authentication and role
//   async updateUserRole(
//     @Param('id') userId: string,
//     @Body('role') newRole: UserRole,
//   ) {
//     return this.userService.updateUserRole(parseInt(userId), newRole);
//   }
// }
