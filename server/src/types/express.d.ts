import 'express';
import type { UserRole } from '../models/User.model';
import type { ITenant } from '../models/Tenant.model';

/** The authenticated principal attached to a request by `authenticate`. */
export interface AuthUser {
  id: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      /** Set by `authenticate` after a valid access token is verified. */
      user?: AuthUser;
      /** Set by `tenantResolver` from subdomain or `x-tenant-*` headers. */
      tenantId?: string;
      /** The resolved tenant document (set by `tenantResolver` when found). */
      tenant?: ITenant;
    }
  }
}
