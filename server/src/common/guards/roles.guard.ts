import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

// 角色层级：高层级角色隐含低层级权限
const ROLE_HIERARCHY: Record<string, number> = {
  user: 1,
  admin: 2,
  super_admin: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // 没有 @Roles() 装饰器的路由不做角色限制
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.role) {
      throw new ForbiddenException('权限不足，需要管理员角色');
    }
    // 检查用户的角色层级是否 >= 任一要求角色（super_admin 自动满足 admin）
    const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
    const hasAccess = requiredRoles.some(
      (required) => userLevel >= (ROLE_HIERARCHY[required] ?? 0),
    );
    if (!hasAccess) {
      throw new ForbiddenException('权限不足，需要管理员角色');
    }
    return true;
  }
}
