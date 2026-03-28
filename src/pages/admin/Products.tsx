import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import SafeProductImage from '@/components/SafeProductImage';
import {
  adminContentClass,
  adminGlassCard,
  adminPageShell,
  AdminStudioBackdrop,
} from '@/components/layout/AdminStudioChrome';
import { getAdminProductThumbnailUrls } from '@/lib/localListingImages';
import adminService, { type AdminProductDTO } from '@/services/adminService';
import { useToast } from '@/hooks/use-toast';
import { adminQueryKeys } from '@/lib/adminQueryKeys';
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  LayoutDashboard,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = [12, 24, 50, 100] as const;

const GENDERS = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'] as const;

type InvRow = { size: string; color: string; stockQuantity: number; colorHex: string };

type SizeRow = {
  size: string;
  chestMeasurementCm?: number;
  shoulderMeasurementCm?: number;
  waistMeasurementCm?: number;
  lengthCm?: number;
};

function money(n: number | undefined) {
  if (n == null || Number.isNaN(n)) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function productStatusClass(status?: string) {
  if (status === 'DISABLED') return 'bg-muted text-muted-foreground border-border';
  return 'bg-emerald-500/15 text-emerald-900 border-emerald-500/25 dark:text-emerald-100';
}

const emptyInvRow = (): InvRow => ({ size: 'M', color: 'Default', stockQuantity: 10, colorHex: '' });

const AdminProducts = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [qInput, setQInput] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(50);

  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProductDTO | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<AdminProductDTO | null>(null);
  const [sizesProduct, setSizesProduct] = useState<AdminProductDTO | null>(null);
  const [sizeRows, setSizeRows] = useState<SizeRow[]>([]);
  const [sizesDirty, setSizesDirty] = useState(false);
  const [sizesInitialEmpty, setSizesInitialEmpty] = useState(false);
  const [confirmSizesSave, setConfirmSizesSave] = useState(false);
  const [savingSizes, setSavingSizes] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(qInput.trim()), 400);
    return () => clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, statusFilter, pageSize]);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: adminQueryKeys.products(statusFilter, debouncedQ, page, pageSize),
    queryFn: () =>
      adminService.getAdminProducts({
        status: statusFilter,
        q: debouncedQ || undefined,
        page,
        size: pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: categories = [] } = useQuery({
    queryKey: adminQueryKeys.categories(),
    queryFn: () => adminService.getCategories(),
    staleTime: 60_000,
  });

  const { data: sizesFromApi = [], isFetching: sizesLoading } = useQuery({
    queryKey: adminQueryKeys.productSizes(sizesProduct?.id ?? 0),
    queryFn: () => adminService.getProductSizes(sizesProduct!.id),
    enabled: !!sizesProduct,
  });

  useEffect(() => {
    if (!sizesProduct) {
      setSizeRows([]);
      setSizesDirty(false);
      return;
    }
    if (sizesLoading) return;
    const empty = sizesFromApi.length === 0;
    setSizesInitialEmpty(empty);
    setSizeRows(
      (sizesFromApi.length ? sizesFromApi : [{ size: 'M' }]).map((r) => ({
        size: r.size,
        chestMeasurementCm: r.chestMeasurementCm ?? undefined,
        shoulderMeasurementCm: r.shoulderMeasurementCm ?? undefined,
        waistMeasurementCm: r.waistMeasurementCm ?? undefined,
        lengthCm: r.lengthCm ?? undefined,
      }))
    );
    setSizesDirty(empty);
  }, [sizesProduct, sizesFromApi, sizesLoading]);

  const products = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const rangeFrom = totalElements === 0 ? 0 : page * pageSize + 1;
  const rangeTo = Math.min((page + 1) * pageSize, totalElements);

  const invalidateProducts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  }, [queryClient]);

  const enableProduct = async (p: AdminProductDTO) => {
    try {
      await adminService.updateProduct(p.id, { status: 'ACTIVE' });
      toast({ title: 'Product enabled', description: 'It is visible in the catalog again.' });
      invalidateProducts();
    } catch {
      toast({ title: 'Could not enable product', variant: 'destructive' });
    }
  };

  /* ——— Create form ——— */
  const [cName, setCName] = useState('');
  const [cBrand, setCBrand] = useState('');
  const [cGender, setCGender] = useState<string>('MEN');
  const [cPrice, setCPrice] = useState('');
  const [cOriginal, setCOriginal] = useState('');
  const [cDiscount, setCDiscount] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cMaterial, setCMaterial] = useState('');
  const [cImages, setCImages] = useState('');
  const [cCats, setCCats] = useState<Set<number>>(new Set());
  const [cInv, setCInv] = useState<InvRow[]>([emptyInvRow()]);

  const resetCreate = () => {
    setCName('');
    setCBrand('');
    setCGender('MEN');
    setCPrice('');
    setCOriginal('');
    setCDiscount('');
    setCDesc('');
    setCMaterial('');
    setCImages('');
    setCCats(new Set());
    setCInv([emptyInvRow()]);
  };

  const toggleCat = (id: number) => {
    setCCats((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const submitCreate = async () => {
    if (!cName.trim() || !cBrand.trim() || !cPrice) {
      toast({ title: 'Name, brand, and price are required', variant: 'destructive' });
      return;
    }
    const price = Number(cPrice);
    if (Number.isNaN(price) || price < 0) {
      toast({ title: 'Invalid price', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const imageUrls = cImages
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const inventory = cInv
        .filter((r) => r.size.trim() && r.color.trim())
        .map((r) => ({
          size: r.size.trim(),
          color: r.color.trim(),
          colorHex: r.colorHex.trim() || undefined,
          stockQuantity: Math.max(0, r.stockQuantity),
        }));
      await adminService.createProduct({
        name: cName.trim(),
        brand: cBrand.trim(),
        gender: cGender,
        price,
        originalPrice: cOriginal ? Number(cOriginal) : undefined,
        discountPercentage: cDiscount ? parseInt(cDiscount, 10) : undefined,
        description: cDesc.trim() || undefined,
        material: cMaterial.trim() || undefined,
        categoryIds: [...cCats],
        imageUrls: imageUrls.length ? imageUrls : undefined,
        inventory: inventory.length ? inventory : undefined,
      });
      toast({ title: 'Product created' });
      setCreateOpen(false);
      resetCreate();
      invalidateProducts();
    } catch {
      toast({ title: 'Could not create product', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ——— Edit form ——— */
  const [eName, setEName] = useState('');
  const [eBrand, setEBrand] = useState('');
  const [eGender, setEGender] = useState('');
  const [ePrice, setEPrice] = useState('');
  const [eOriginal, setEOriginal] = useState('');
  const [eDiscount, setEDiscount] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eMaterial, setEMaterial] = useState('');

  useEffect(() => {
    if (!editProduct) return;
    setEName(editProduct.name);
    setEBrand(editProduct.brand);
    setEGender(editProduct.gender);
    setEPrice(String(editProduct.price));
    setEOriginal(editProduct.originalPrice != null ? String(editProduct.originalPrice) : '');
    setEDiscount(
      editProduct.discountPercentage != null ? String(editProduct.discountPercentage) : ''
    );
    setEDesc(editProduct.description ?? '');
    setEMaterial(editProduct.material ?? '');
  }, [editProduct]);

  const submitEdit = async () => {
    if (!editProduct) return;
    const price = Number(ePrice);
    if (Number.isNaN(price)) {
      toast({ title: 'Invalid price', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await adminService.updateProduct(editProduct.id, {
        name: eName.trim(),
        brand: eBrand.trim(),
        gender: eGender,
        price,
        originalPrice: eOriginal ? Number(eOriginal) : editProduct.originalPrice,
        discountPercentage: eDiscount !== '' ? parseInt(eDiscount, 10) : editProduct.discountPercentage,
        description: eDesc.trim() || null,
        material: eMaterial.trim() || null,
      });
      toast({ title: 'Product updated' });
      setEditProduct(null);
      invalidateProducts();
    } catch {
      toast({ title: 'Could not update product', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteProduct) return;
    setSubmitting(true);
    try {
      await adminService.deleteProduct(deleteProduct.id);
      toast({ title: 'Product disabled', description: 'It no longer appears in the storefront.' });
      setDeleteProduct(null);
      invalidateProducts();
    } catch {
      toast({ title: 'Could not disable product', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const openSizesSave = () => {
    const valid = sizeRows.some((r) => r.size.trim());
    if (!valid) {
      toast({ title: 'Add at least one size label', variant: 'destructive' });
      return;
    }
    setConfirmSizesSave(true);
  };

  const doSaveSizes = async () => {
    if (!sizesProduct) return;
    setConfirmSizesSave(false);
    setSavingSizes(true);
    try {
      const payload = sizeRows
        .filter((r) => r.size.trim())
        .map((r) => ({
          size: r.size.trim(),
          chestMeasurementCm: r.chestMeasurementCm,
          shoulderMeasurementCm: r.shoulderMeasurementCm,
          waistMeasurementCm: r.waistMeasurementCm,
          lengthCm: r.lengthCm,
        }));
      await adminService.saveProductSizes(sizesProduct.id, payload);
      toast({ title: 'Size chart saved', description: 'Inventory rows were rebuilt for fit data.' });
      setSizesProduct(null);
      invalidateProducts();
      queryClient.invalidateQueries({ queryKey: ['admin', 'product-sizes'] });
    } catch {
      toast({ title: 'Could not save sizes', variant: 'destructive' });
    } finally {
      setSavingSizes(false);
    }
  };

  const canSaveSizes =
    !sizesLoading &&
    sizeRows.some((r) => r.size.trim()) &&
    (sizesDirty || sizesInitialEmpty);

  return (
    <div className={adminPageShell}>
      <AdminStudioBackdrop />
      <div className={cn(adminContentClass, 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-500')}>
        <nav className="text-xs text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 rounded-full px-0.5 py-0.5 transition-colors hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="font-medium text-foreground">Products</span>
        </nav>

        <div
          className={cn(
            adminGlassCard,
            'relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7 motion-safe:animate-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500',
          )}
          style={{ animationFillMode: 'both' }}
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-3 h-px rounded-full bg-[length:200%_100%] bg-gradient-to-r from-transparent via-indigo-400/38 to-transparent opacity-90 motion-safe:animate-wardrobe-rail-shine dark:via-indigo-400/28"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-cyan-500/[0.05]" aria-hidden />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-200/60 dark:ring-white/12 motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-[1.02]">
                <Package className="h-8 w-8" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/90 bg-indigo-100/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-100">
                  <span>Catalog</span>
                  <Sparkles className="h-3 w-3 shrink-0 text-amber-600 dark:text-amber-200/80" />
                </div>
                <h1 className="font-display-hero text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  <span className="text-foreground">Product </span>
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-[length:200%_auto] bg-clip-text text-transparent motion-safe:animate-home-gradient-shift dark:from-indigo-300 dark:via-violet-300 dark:to-cyan-300">
                    studio
                  </span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Create items, adjust pricing, manage fit sizes, or disable listings — same chrome as Orders.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search name or brand…"
                  className="h-10 rounded-xl border-border/70 bg-background/90 pl-9 shadow-sm backdrop-blur-sm"
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="h-10 w-full min-w-[140px] rounded-xl border-border/70 bg-background/90 shadow-sm backdrop-blur-sm sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="h-10 w-[120px] shrink-0 rounded-xl border-border/70 bg-background/90 shadow-sm backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl border-border/70 bg-background/80 shadow-sm backdrop-blur-sm"
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Refresh"
              >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              </Button>
              <Button
                type="button"
                className="h-10 gap-2 rounded-xl bg-foreground text-background shadow-sm hover:bg-foreground/90"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                New product
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className={cn(adminGlassCard, 'overflow-hidden')}>
            <CardHeader className="pb-2">
              <CardDescription>Catalog matches</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totalElements}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className={cn(adminGlassCard, 'overflow-hidden sm:col-span-2')}>
            <CardHeader className="pb-2">
              <CardDescription>Page</CardDescription>
              <CardTitle className="text-lg font-medium text-muted-foreground">
                {totalPages === 0 ? '—' : `${page + 1} of ${totalPages}`}
                {totalElements > 0 ? (
                  <span className="mt-1 block text-sm font-normal text-muted-foreground">
                    Rows {rangeFrom}–{rangeTo} of {totalElements}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {error ? (
          <Card className={cn(adminGlassCard, 'border-destructive/30 bg-destructive/5')}>
            <CardContent className="py-10 text-center text-sm text-destructive">
              Failed to load products. Check your connection and try refresh.
            </CardContent>
          </Card>
        ) : (
          <Card className={cn(adminGlassCard, 'overflow-hidden')}>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="w-[108px] min-w-[108px] py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Image
                    </TableHead>
                    <TableHead className="min-w-[220px] py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Product
                    </TableHead>
                    <TableHead className="min-w-[140px] py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Brand
                    </TableHead>
                    <TableHead className="min-w-[120px] py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Price
                    </TableHead>
                    <TableHead className="min-w-[100px] py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Gender
                    </TableHead>
                    <TableHead className="min-w-[110px] py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="min-w-[280px] py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !data ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j} className="py-5">
                            <Skeleton className="h-14 w-full rounded-xl" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2 py-8">
                          <Package className="h-10 w-10 opacity-40" />
                          No products match your filters.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((p) => (
                      <TableRow key={p.id} className="border-border/50 hover:bg-muted/40">
                        <TableCell className="align-middle py-5">
                          <div className="bg-muted relative h-[4.5rem] w-[3.75rem] shrink-0 overflow-hidden rounded-2xl border border-border/60 shadow-sm sm:h-[5.25rem] sm:w-[4.25rem]">
                            <SafeProductImage
                              urls={getAdminProductThumbnailUrls(p.name, p.brand, p.images)}
                              alt={p.name}
                              className="absolute inset-0"
                              classNameImg="h-full w-full object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="align-middle py-5">
                          <div className="max-w-md pr-2">
                            <span className="text-base font-semibold leading-snug text-foreground sm:text-lg">
                              {p.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle py-5 text-base font-medium text-foreground/90">
                          {p.brand}
                        </TableCell>
                        <TableCell className="align-middle py-5 text-right">
                          <div className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
                            {money(p.price)}
                          </div>
                          {p.originalPrice != null && p.originalPrice > p.price ? (
                            <div className="mt-1 text-sm text-muted-foreground line-through tabular-nums">
                              {money(p.originalPrice)}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="align-middle py-5">
                          <Badge
                            variant="secondary"
                            className="rounded-lg px-3 py-1.5 text-sm font-medium normal-case tracking-normal"
                          >
                            {p.gender}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-middle py-5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-sm font-medium',
                              productStatusClass(p.status),
                            )}
                          >
                            {p.status === 'DISABLED' ? 'Disabled' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-middle py-5 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              className="h-10 gap-2 rounded-xl border-border/70 px-4 text-sm font-medium"
                              onClick={() => setEditProduct(p)}
                            >
                              <Pencil className="h-4 w-4 shrink-0" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="default"
                              className="h-10 gap-2 rounded-xl border-border/70 px-4 text-sm font-medium"
                              onClick={() => setSizesProduct(p)}
                            >
                              <Ruler className="h-4 w-4 shrink-0" />
                              Sizes
                            </Button>
                            {p.status === 'DISABLED' ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="h-10 gap-2 rounded-xl border-emerald-500/30 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                                onClick={() => void enableProduct(p)}
                              >
                                <CircleCheck className="h-4 w-4 shrink-0" />
                                Enable
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="default"
                                className="h-10 gap-2 rounded-xl border-destructive/25 px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteProduct(p)}
                              >
                                <Trash2 className="h-4 w-4 shrink-0" />
                                Disable
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!isLoading && totalElements > 0 ? (
              <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 backdrop-blur-sm dark:bg-muted/15 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  Rows {rangeFrom}–{rangeTo} of {totalElements}
                  {totalPages > 1 ? ` · Page ${page + 1} of ${totalPages}` : null}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/70"
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
                    className="rounded-xl border-border/70"
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

      {/* Create */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) resetCreate();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New product</DialogTitle>
            <DialogDescription>Required fields create a sellable SKU; add images and inventory when ready.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-name">Name</Label>
                <Input id="c-name" value={cName} onChange={(e) => setCName(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-brand">Brand</Label>
                <Input id="c-brand" value={cBrand} onChange={(e) => setCBrand(e.target.value)} className="rounded-lg" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={cGender} onValueChange={setCGender}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-price">Price (₹)</Label>
                <Input id="c-price" type="number" min={0} step="0.01" value={cPrice} onChange={(e) => setCPrice(e.target.value)} className="rounded-lg" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-orig">Original price (optional)</Label>
                <Input id="c-orig" type="number" min={0} value={cOriginal} onChange={(e) => setCOriginal(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-disc">Discount % (optional)</Label>
                <Input id="c-disc" type="number" min={0} max={100} value={cDiscount} onChange={(e) => setCDiscount(e.target.value)} className="rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea id="c-desc" rows={3} value={cDesc} onChange={(e) => setCDesc(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-mat">Material</Label>
              <Input id="c-mat" value={cMaterial} onChange={(e) => setCMaterial(e.target.value)} className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label>Image URLs (one per line)</Label>
              <Textarea
                rows={3}
                placeholder="https://…"
                value={cImages}
                onChange={(e) => setCImages(e.target.value)}
                className="rounded-lg font-mono text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Categories</Label>
              <ScrollArea className="h-32 rounded-lg border border-border/60 p-2">
                <div className="space-y-2 pr-3">
                  {categories.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={cCats.has(c.id)} onCheckedChange={() => toggleCat(c.id)} />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Inventory rows</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setCInv((rows) => [...rows, emptyInvRow()])}
                >
                  Add row
                </Button>
              </div>
              <div className="space-y-2">
                {cInv.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 rounded-lg border border-border/50 bg-muted/20 p-2">
                    <Input
                      className="col-span-3 rounded-md text-sm"
                      placeholder="Size"
                      value={row.size}
                      onChange={(e) => {
                        const n = [...cInv];
                        n[idx] = { ...n[idx], size: e.target.value };
                        setCInv(n);
                      }}
                    />
                    <Input
                      className="col-span-4 rounded-md text-sm"
                      placeholder="Color"
                      value={row.color}
                      onChange={(e) => {
                        const n = [...cInv];
                        n[idx] = { ...n[idx], color: e.target.value };
                        setCInv(n);
                      }}
                    />
                    <Input
                      className="col-span-3 rounded-md text-sm"
                      type="number"
                      min={0}
                      placeholder="Qty"
                      value={row.stockQuantity}
                      onChange={(e) => {
                        const n = [...cInv];
                        n[idx] = { ...n[idx], stockQuantity: parseInt(e.target.value, 10) || 0 };
                        setCInv(n);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="col-span-2 rounded-md"
                      disabled={cInv.length <= 1}
                      onClick={() => setCInv((rows) => rows.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-lg" disabled={submitting} onClick={submitCreate}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editProduct} onOpenChange={(o) => !o && setEditProduct(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
            <DialogDescription>Changes apply to the storefront after save.</DialogDescription>
          </DialogHeader>
          {editProduct ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={eName} onChange={(e) => setEName(e.target.value)} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={eBrand} onChange={(e) => setEBrand(e.target.value)} className="rounded-lg" />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={eGender} onValueChange={setEGender}>
                    <SelectTrigger className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" min={0} value={ePrice} onChange={(e) => setEPrice(e.target.value)} className="rounded-lg" />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Original price</Label>
                  <Input type="number" min={0} value={eOriginal} onChange={(e) => setEOriginal(e.target.value)} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input type="number" min={0} max={100} value={eDiscount} onChange={(e) => setEDiscount(e.target.value)} className="rounded-lg" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={3} value={eDesc} onChange={(e) => setEDesc(e.target.value)} className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label>Material</Label>
                <Input value={eMaterial} onChange={(e) => setEMaterial(e.target.value)} className="rounded-lg" />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setEditProduct(null)}>
              Cancel
            </Button>
            <Button type="button" className="rounded-lg" disabled={submitting} onClick={submitEdit}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable */}
      <AlertDialog open={!!deleteProduct} onOpenChange={(o) => !o && setDeleteProduct(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Disable product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteProduct ? (
                <>
                  <span className="font-medium text-foreground">{deleteProduct.name}</span> will be hidden from the
                  catalog. You can still see it here when filtering by Disabled.
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
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sizes */}
      <Sheet open={!!sizesProduct} onOpenChange={(o) => !o && !savingSizes && setSizesProduct(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg">
          <SheetHeader className="border-b border-border/60 pb-4 text-left">
            <SheetTitle>Fit sizes</SheetTitle>
            <SheetDescription>
              Saving rebuilds inventory rows for this product (used for fit recommendations). Confirm before applying.
            </SheetDescription>
          </SheetHeader>
          {sizesLoading && sizesProduct ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="flex-1 py-4">
              <div className="space-y-3 pr-4">
                {sizeRows.map((row, idx) => (
                  <div key={idx} className="space-y-2 rounded-xl border border-border/60 bg-muted/15 p-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Size (e.g. M, 32)"
                        value={row.size}
                        className="rounded-lg"
                        onChange={(e) => {
                          const n = [...sizeRows];
                          n[idx] = { ...n[idx], size: e.target.value };
                          setSizeRows(n);
                          setSizesDirty(true);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-lg"
                        disabled={sizeRows.length <= 1}
                        onClick={() => {
                          setSizeRows((r) => r.filter((_, i) => i !== idx));
                          setSizesDirty(true);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ['Chest (cm)', 'chestMeasurementCm'],
                          ['Shoulder (cm)', 'shoulderMeasurementCm'],
                          ['Waist (cm)', 'waistMeasurementCm'],
                          ['Length (cm)', 'lengthCm'],
                        ] as const
                      ).map(([label, key]) => (
                        <div key={key} className="space-y-1">
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type="number"
                            className="h-8 rounded-md text-sm"
                            value={row[key] ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              const n = [...sizeRows];
                              n[idx] = {
                                ...n[idx],
                                [key]: v === '' ? undefined : parseFloat(v),
                              };
                              setSizeRows(n);
                              setSizesDirty(true);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-xl"
                  onClick={() => {
                    setSizeRows((r) => [...r, { size: '' }]);
                    setSizesDirty(true);
                  }}
                >
                  Add size
                </Button>
              </div>
            </ScrollArea>
          )}
          <SheetFooter className="border-t border-border/60 pt-4">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setSizesProduct(null)}>
              Close
            </Button>
            <Button
              type="button"
              className="rounded-lg"
              disabled={savingSizes || !canSaveSizes}
              onClick={openSizesSave}
            >
              Save measurements
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmSizesSave} onOpenChange={setConfirmSizesSave}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Rebuild inventory for fit data?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces existing size/color stock rows with new defaults so measurements stay aligned. Continue only if
              you intend to refresh fit specs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <Button type="button" className="rounded-lg" disabled={savingSizes} onClick={() => void doSaveSizes()}>
              {savingSizes ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
