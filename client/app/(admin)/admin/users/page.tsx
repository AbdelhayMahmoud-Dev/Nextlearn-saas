'use client';

import { useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { UserTable } from '@/components/admin/UserTable';
import {
  exportUsersCsv,
  useAdminUsers,
  useChangeRole,
  useDeleteUser,
  useToggleStatus,
} from '@/hooks/useAdminUsers';
import type { UserRole } from '@/types';

/** Admin user management list. */
export default function AdminUsersPage(): JSX.Element {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const debounced = useDebounce(search, 300);

  const { data, isLoading } = useAdminUsers({ page, search: debounced || undefined, role: role || undefined });
  const changeRole = useChangeRole();
  const toggleStatus = useToggleStatus();
  const deleteUser = useDeleteUser();

  const handleRole = (id: string, r: UserRole): void => {
    changeRole.mutate({ id, role: r }, { onSuccess: () => toast.success('Role updated'), onError: (e) => toast.error(e.message) });
  };
  const handleStatus = (id: string, isActive: boolean): void => {
    toggleStatus.mutate({ id, isActive }, { onError: (e) => toast.error(e.message) });
  };
  const handleDelete = (id: string): void => {
    if (!window.confirm('Soft-delete this user? They will be deactivated and anonymized.')) return;
    deleteUser.mutate(id, { onSuccess: () => toast.success('User deleted'), onError: (e) => toast.error(e.message) });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Users {data ? `(${data.meta.total})` : ''}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name/email" className="w-56 pl-8" />
          </div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role" className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="">All roles</option>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => void exportUsersCsv().catch(() => toast.error('Export failed'))}>
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-brand-primary" /></div>
      ) : (
        <>
          <UserTable rows={data.items} onChangeRole={handleRole} onToggleStatus={handleStatus} onDelete={handleDelete} />
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</span>
            <Button variant="outline" size="sm" disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </>
      )}
    </div>
  );
}
