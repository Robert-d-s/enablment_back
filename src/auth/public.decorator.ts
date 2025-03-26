import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './auth.module';

/**
 * Decorator that marks a route or resolver method as public
 * Public routes/methods don't require authentication
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
