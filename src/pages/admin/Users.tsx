import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import adminService, { type AdminUserSummary } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { adminQueryKeys } from '@/lib/adminQueryKeys';
import { useStore } from '@/context/StoreContext';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCircle,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

const PAGE_SIZE = 12;

function rolesToFlags(roles?: string[]) {
  const r = roles ?? [];
  return {
    customer: r.includes('ROLE_CUSTOMER'),
    admin: r.includes('ROLE_ADMIN'),
  };
}

function flagsToRoles(customer: boolean, admin: boolean): string[] {
  const out: string[] = [];
  if (customer) out.push('ROLE_CUSTOMER');
  if (admin) out.push('ROLE_ADMIN');
  return out.length ? out : ['ROLE_CUSTOMER'];
}

const AdminUsers = () => {
  const { user: me } = useStore();
  const myId = me?.id ? Number(me.id) : null;

  const [qInput, setQInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'true' | 'false'>('ALL');
  const [page, setPage] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserSummary | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUserSummary | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUserSummary | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(qInput.trim()), 350);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, activeFilter]);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: adminQueryKeys.users(debouncedQ, activeFilter, page, PAGE_SIZE),
    queryFn: () =>
      adminService.getAllUsers(page, PAGE_SIZE, {
        q: debouncedQ || undefined,
        active: activeFilter,
      }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;

  const invalidateUsers = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  }, [queryClient]);

  /* ——— Create ——— */
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cCustomer, setCCustomer] = useState(true);
  const [cAdmin, setCAdmin] = useState(false);

  const resetCreate = () => {
    setCName('');
    setCEmail('');
    setCPassword('');
    setCPhone('');
    setCCustomer(true);
    setCAdmin(false);
  };

  const submitCreate = async () => {
    if (!cName.trim() || !cEmail.trim() || cPassword.length < 6) {
      toast({ title: 'Name, email, and password (6+ chars) are required', variant: 'destructive' });
      return;
    }
    if (!cCustomer && !cAdmin) {
      toast({ title: 'Select at least one role', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await adminService.createUser({
        name: cName.trim(),
        email: cEmail.trim(),
        password: cPassword,
        phone: cPhone.trim() || undefined,
        roles: flagsToRoles(cCustomer, cAdmin),
      });
      toast({ title: 'User created' });
      setCreateOpen(false);
      resetCreate();
      invalidateUsers();
    } catch (e) {
      const msg = axios.isAxiosError(e) ? (e.response?.data?.message as string) : null;
      toast({ title: msg || 'Could not create user', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ——— Edit ——— */
  const [eName, setEName] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [ePhone, setEPhone] = useState('');
  const [eActive, setEActive] = useState(true);
  const [eCustomer, setECustomer] = useState(true);
  const [eAdmin, setEAdmin] = useState(false);
  const [eNewPassword, setENewPassword] = useState('');

  useEffect(() => {
    if (!editUser) return;
    const f = rolesToFlags(editUser.roles);
    setEName(editUser.name);
    setEEmail(editUser.email);
    setEPhone(editUser.phone ?? '');
    setEActive(editUser.isActive !== false);
    setECustomer(f.customer);
    setEAdmin(f.admin);
    setENewPassword('');
  }, [editUser]);

  const submitEdit = async () => {
    if (!editUser) return;
    if (!eCustomer && !eAdmin) {
      toast({ title: 'Select at least one role', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await adminService.updateUser(editUser.id, {
        name: eName.trim(),
        email: eEmail.trim(),
        phone: ePhone.trim() || null,
        isActive: eActive,
        newPassword: eNewPassword.length >= 6 ? eNewPassword : undefined,
        roles: flagsToRoles(eCustomer, eAdmin),
      });
      toast({ title: 'User updated' });
      setEditUser(null);
      invalidateUsers();
    } catch (e) {
      const msg = axios.isAxiosError(e) ? (e.response?.data?.message as string) : null;
      toast({ title: msg || 'Could not update user', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    setSubmitting(true);
    try {
      await adminService.deleteUser(deleteUser.id);
      toast({ title: 'User removed', description: 'Account and related profile data were deleted.' });
      setDeleteUser(null);
      invalidateUsers();
    } catch (e) {
      const msg = axios.isAxiosError(e) ? (e.response?.data?.message as string) : null;
      toast({ title: msg || 'Could not delete user', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const quickToggleActive = async (u: AdminUserSummary, next: boolean) => {
    try {
      await adminService.updateUserStatus(u.id, next);
      toast({ title: next ? 'User activated' : 'User deactivated' });
      invalidateUsers();
    } catch {
      toast({ title: 'Could not update status', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50/90 to-background dark:from-slate-950/40">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <UserCircle className="h-8 w-8 opacity-90" />
              <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
            </div>
            <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
              Create accounts, edit profiles and roles, reset passwords, activate or deactivate access, and permanently
              remove users who have never placed an order.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search name or email…"
                className="rounded-xl border-border/80 bg-background/80 pl-9 shadow-sm"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
              />
            </div>
            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
              <SelectTrigger className="w-[160px] rounded-xl border-border/80 bg-background/80 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
            <Button type="button" className="rounded-xl gap-2 shadow-sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New user
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardDescription>Matching users</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalElements}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-card/80 shadow-sm backdrop-blur-sm sm:col-span-2">
            <CardHeader className="pb-2">
              <CardDescription>Page</CardDescription>
              <CardTitle className="text-lg font-medium text-muted-foreground">
                {totalPages === 0 ? '—' : `${page + 1} of ${totalPages}`}
              </CardTitle>
            </CardHeader>
          </Card>
      </div>

        {error ? (
          <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
            <div className="py-10 text-center text-sm text-destructive">Failed to load users.</div>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-2xl border-border/60 shadow-md">
            <div className="overflow-x-auto">
        <Table>
          <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                  {isLoading && !data ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground h-36 text-center">
                        No users match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((u) => {
                      const { customer, admin } = rolesToFlags(u.roles);
                      return (
                        <TableRow key={u.id} className="border-border/50 hover:bg-muted/40">
                          <TableCell>
                            <button
                              type="button"
                              className="text-left"
                              onClick={() => setDetailUser(u)}
                            >
                              <div className="font-medium">{u.name}</div>
                              <div className="text-muted-foreground text-sm">{u.email}</div>
                              {u.phone ? <div className="text-muted-foreground text-xs">{u.phone}</div> : null}
                            </button>
                          </TableCell>
                <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {customer ? (
                                <Badge variant="secondary" className="rounded-md font-normal">
                                  Customer
                                </Badge>
                              ) : null}
                              {admin ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-md border-violet-500/30 bg-violet-500/10 font-normal text-violet-900 dark:text-violet-100"
                                >
                                  <Shield className="mr-1 h-3 w-3" />
                                  Admin
                                </Badge>
                              ) : null}
                            </div>
                </TableCell>
                <TableCell>
                            <button
                              type="button"
                              onClick={() => quickToggleActive(u, !u.isActive)}
                              className={cn(
                                'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                                u.isActive
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
                                  : 'bg-muted text-muted-foreground border-border'
                              )}
                            >
                              {u.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-lg"
                                onClick={() => setEditUser(u)}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive h-8 rounded-lg"
                                disabled={myId != null && u.id === myId}
                                title={
                                  myId != null && u.id === myId ? 'You cannot delete your own account here' : undefined
                                }
                                onClick={() => setDeleteUser(u)}
                              >
                                <Trash2 className="mr-1 h-3.5 w-3.5" />
                                Delete
                              </Button>
                  </div>
                </TableCell>
              </TableRow>
                      );
                    })
                  )}
          </TableBody>
        </Table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-muted-foreground text-sm">
                  Showing {rows.length} of {totalElements}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={page <= 0}
                    onClick={() => setPage((x) => Math.max(0, x - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((x) => x + 1)}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
      </Card>
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetCreate();
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New user
            </DialogTitle>
            <DialogDescription>Creates a sign-in the same way as self-registration.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="cu-name">Name</Label>
              <Input id="cu-name" value={cName} onChange={(e) => setCName(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-email">Email</Label>
              <Input id="cu-email" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-pass">Password</Label>
              <Input
                id="cu-pass"
                type="password"
                autoComplete="new-password"
                value={cPassword}
                onChange={(e) => setCPassword(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-phone">Phone (optional)</Label>
              <Input id="cu-phone" value={cPhone} onChange={(e) => setCPhone(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
              <Label>Roles</Label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={cCustomer} onCheckedChange={(v) => setCCustomer(!!v)} />
                Customer
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={cAdmin} onCheckedChange={(v) => setCAdmin(!!v)} />
                Administrator
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-lg" disabled={submitting} onClick={() => void submitCreate()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update profile, access, roles, or set a new password.</DialogDescription>
          </DialogHeader>
          {editUser ? (
            <div className="grid gap-3 py-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={eName} onChange={(e) => setEName(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={ePhone} onChange={(e) => setEPhone(e.target.value)} className="rounded-lg" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                <Checkbox id="e-act" checked={eActive} onCheckedChange={(v) => setEActive(!!v)} />
                <Label htmlFor="e-act" className="cursor-pointer text-sm font-normal">
                  Account active (can sign in)
                </Label>
              </div>
              <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
                <Label>Roles</Label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={eCustomer} onCheckedChange={(v) => setECustomer(!!v)} />
                  Customer
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={eAdmin} onCheckedChange={(v) => setEAdmin(!!v)} />
                  Administrator
                </label>
              </div>
              <div className="space-y-2">
                <Label>New password (optional)</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep current"
                  value={eNewPassword}
                  onChange={(e) => setENewPassword(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-lg" disabled={submitting} onClick={() => void submitEdit()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUser ? (
                <>
                  This removes <span className="font-medium text-foreground">{deleteUser.email}</span> from the
                  database. Allowed only when the user has no orders. Otherwise deactivate the account instead.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="rounded-lg"
              disabled={submitting}
              onClick={() => void confirmDelete()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!detailUser} onOpenChange={(o) => !o && setDetailUser(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {detailUser ? (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{detailUser.name}</SheetTitle>
                <SheetDescription>{detailUser.email}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Phone</div>
                  <div>{detailUser.phone || '—'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Status</div>
                  <div>{detailUser.isActive ? 'Active' : 'Inactive'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Email verified</div>
                  <div>{detailUser.emailVerified ? 'Yes' : 'No'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">Joined</div>
                  <div>{new Date(detailUser.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Roles</div>
                  <div className="flex flex-wrap gap-1">
                    {(detailUser.roles ?? []).map((r) => (
                      <Badge key={r} variant="secondary" className="rounded-md font-mono text-xs">
                        {r.replace('ROLE_', '')}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" className="rounded-lg" onClick={() => { setDetailUser(null); setEditUser(detailUser); }}>
                    Edit user
                  </Button>
                </div>
        </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminUsers;
