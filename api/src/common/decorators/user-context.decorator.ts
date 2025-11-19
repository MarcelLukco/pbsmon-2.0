import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContext } from '@/common/types/user-context.types';

/**
 * Decorator to inject user context from request
 * User context is always present (guard ensures authorization)
 * Usage: @UserContext() userContext: UserContext
 */
export const UserContextDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest();
    // Guard ensures userContext is always present (throws 403 if not)
    return request.userContext as UserContext;
  },
);
