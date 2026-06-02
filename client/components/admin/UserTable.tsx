'use client';

import Link from 'next/link';
import { cn, timeAgo } from '@/lib/utils';
import type { UserRole } from '@/types';
import type { AdminUserRow } from '@/hooks/useAdminUsers';

interface UserTableProps {
  rows: AdminUserRow[];
  onChangeRole: (id: string, role: UserRole) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

const ROLE_BADGE: Record<string, string> = {
  student: 'bg-blue-500/15 text-blue-500',
  instructor: 'bg-violet-500/15 text-violet-500',
  admin: 'bg-amber-500/15 text-amber-500',
  superadmin: 'bg-red-500/15 text-red-500',
};

/** Admin user table with inline role/status/delete actions. */
export function UserTable({ rows, onChangeRole, onToggleStatus, onDelete }: UserTableProps): JSX.Element {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 text-right font-medium">Enrollments</th>
            <th className="px-4 py-3 font-medium">Last login</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u._id} className="border-b last:border-0">
              <td className="px-4 py-3">
                <Link href={`/admin/users/${u._id}`} className="font-medium hover:text-brand-primary">{u.name}</Link>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </td>
              <td className="px-4 py-3">
                {u.role === 'superadmin' ? (
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', ROLE_BADGE.superadmin)}>superadmin</span>
                ) : (
                  <select
                    value={u.role}
                    onChange={(e) => onChangeRole(u._id, e.target.value as UserRole)}
                    aria-label={`Role for ${u.name}`}
                    className={cn('rounded-full border-0 px-2.5 py-0.5 text-xs font-medium', ROLE_BADGE[u.role])}
                  >
                    <option value="student">student</option>
                    <option value="instructor">instructor</option>
                    <option value="admin">admin</option>
                  </select>
                )}
              </td>
              <td className="px-4 py-3 text-right">{u.enrollmentCount}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.lastLogin ? timeAgo(u.lastLogin) : '—'}</td>
              <td className="px-4 py-3">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', u.isActive ? 'bg-green-500/15 text-green-500' : 'bg-muted text-muted-foreground')}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2 text-xs">
                  <button type="button" onClick={() => onToggleStatus(u._id, !u.isActive)} className="text-muted-foreground hover:text-foreground">
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button type="button" onClick={() => onDelete(u._id)} className="text-red-500 hover:underline">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
