import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, fetchProductsFromSupabase, primeProductsCache } from '../supabase';
import type { FlashcardData, ProductType } from '../types';
import { compareProductsByLearningRank, getProductTypeMeta, inferProductTypeFromProduct, PRODUCT_TYPE_OPTIONS } from '../productCategories';

interface AddProductProps {
  onClose: () => void;
  onProductAdded: () => void;
  initialProducts?: FlashcardData[];
}

interface Product extends FlashcardData {
  id: number;
}

type UsageCategory = 'high' | 'medium' | 'low';
type FieldErrors = Partial<Record<'code' | 'name', string>>;

const usageOptions: Array<{ value: UsageCategory; label: string; shortLabel: string }> = [
  { value: 'high', label: 'Muito usado', shortLabel: 'Alta' },
  { value: 'medium', label: 'Usado às vezes', shortLabel: 'Média' },
  { value: 'low', label: 'Pouco usado', shortLabel: 'Baixa' },
];

const productTypeOptions = PRODUCT_TYPE_OPTIONS;

const getUsageCategory = (product?: Product | null): UsageCategory => {
  return (product?.usage_category as UsageCategory) || 'high';
};

const getUsageMeta = (category?: string) => {
  return usageOptions.find((option) => option.value === category) || usageOptions[0];
};

const Icon = ({ name, className = 'h-5 w-5' }: { name: 'x' | 'plus' | 'search' | 'chevron' | 'edit' | 'trash' | 'check' | 'spark'; className?: string }) => {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  if (name === 'x') {
    return <svg {...common}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
  }
  if (name === 'plus') {
    return <svg {...common}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
  }
  if (name === 'search') {
    return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
  }
  if (name === 'chevron') {
    return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
  }
  if (name === 'edit') {
    return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
  }
  if (name === 'trash') {
    return <svg {...common}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></svg>;
  }
  if (name === 'check') {
    return <svg {...common}><path d="m20 6-11 11-5-5" /></svg>;
  }
  return <svg {...common}><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8Z" /></svg>;
};

const UsageBadge = ({ category }: { category?: string }) => {
  const meta = getUsageMeta(category);
  const className = {
    high: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    medium: 'bg-stone-50 text-stone-700 ring-stone-200',
    low: 'bg-slate-100 text-slate-600 ring-slate-200',
  }[meta.value];

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${className}`}>
      {meta.label}
    </span>
  );
};

const SheetShell = ({
  title,
  eyebrow,
  onClose,
  children,
  footer,
  danger = false,
}: {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  danger?: boolean;
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-emerald-950/25 px-3 pb-3 pt-10 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6" onMouseDown={onClose}>
      <section
        className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-slate-950/20 animate-slide-up sm:rounded-3xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
          <div>
            {eyebrow && <p className={`mb-1 text-xs font-black uppercase tracking-[0.16em] ${danger ? 'text-rose-500' : 'text-emerald-600'}`}>{eyebrow}</p>}
            <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Fechar"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
        {footer && <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-6">{footer}</div>}
      </section>
    </div>
  );
};

const ProductSearch = ({
  value,
  resultCount,
  onChange,
  onClear,
}: {
  value: string;
  resultCount: number;
  onChange: (value: string) => void;
  onClear: () => void;
}) => (
  <div className="space-y-2">
    <div className="relative">
      <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar codigo ou produto"
        className="min-h-[52px] w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-base font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Limpar busca"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      )}
    </div>
    {value && (
      <p className="px-1 text-sm font-semibold text-slate-500">
        {resultCount} resultado{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
      </p>
    )}
  </div>
);

const ProductListItem = ({ product, onSelect }: { product: Product; onSelect: (product: Product) => void }) => (
  <button
    type="button"
    onClick={() => onSelect(product)}
    className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md active:scale-[0.99]"
  >
    <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-lg font-black tabular-nums text-emerald-800">
      {product.back}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-base font-black tracking-tight text-slate-950">{product.front}</p>
      <div className="mt-1 flex items-center gap-2">
        <UsageBadge category={product.usage_category} />
        <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
          {getProductTypeMeta(inferProductTypeFromProduct(product)).label}
        </span>
      </div>
    </div>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 transition group-hover:bg-emerald-100 group-hover:text-emerald-700">
      <Icon name="chevron" className="h-5 w-5" />
    </div>
  </button>
);

const CategorySegment = ({
  value,
  disabled,
  onChange,
}: {
  value: UsageCategory;
  disabled?: boolean;
  onChange: (value: UsageCategory) => void;
}) => (
  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1.5">
    {usageOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        disabled={disabled}
        onClick={() => onChange(option.value)}
        className={`rounded-xl px-2 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
          value === option.value
            ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200'
            : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'
        }`}
      >
        {option.shortLabel}
      </button>
    ))}
  </div>
);

const ProductTypeSegment = ({
  value,
  onChange,
}: {
  value: ProductType;
  onChange: (value: ProductType) => void;
}) => (
  <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
    {productTypeOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`rounded-xl px-2 py-3 text-xs font-black transition ${
          value === option.value
            ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100'
            : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

const ProductForm = ({
  code,
  name,
  usageCategory,
  productType,
  fieldErrors,
  autoFocusRef,
  onCodeChange,
  onNameChange,
  onCategoryChange,
  onProductTypeChange,
}: {
  code: string;
  name: string;
  usageCategory: UsageCategory;
  productType: ProductType;
  fieldErrors: FieldErrors;
  autoFocusRef?: React.RefObject<HTMLInputElement | null>;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: UsageCategory) => void;
  onProductTypeChange: (value: ProductType) => void;
}) => (
  <div className="space-y-4">
    <div>
      <label htmlFor="product-code" className="mb-2 block text-sm font-black text-slate-700">Codigo</label>
      <input
        ref={autoFocusRef}
        id="product-code"
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        value={code}
        onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, ''))}
        placeholder="Ex: 250"
        className={`h-14 w-full rounded-2xl border bg-white px-4 text-lg font-black tabular-nums text-slate-950 outline-none transition placeholder:text-slate-300 focus:ring-4 ${
          fieldErrors.code
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'
        }`}
      />
      {fieldErrors.code && <p className="mt-2 text-sm font-semibold text-rose-600">{fieldErrors.code}</p>}
    </div>

    <div>
      <label htmlFor="product-name" className="mb-2 block text-sm font-black text-slate-700">Nome do produto</label>
      <input
        id="product-name"
        type="text"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Ex: X-Burger"
        className={`h-14 w-full rounded-2xl border bg-white px-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-300 focus:ring-4 ${
          fieldErrors.name
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
            : 'border-slate-200 focus:border-emerald-400 focus:ring-emerald-100'
        }`}
      />
      {fieldErrors.name && <p className="mt-2 text-sm font-semibold text-rose-600">{fieldErrors.name}</p>}
    </div>

    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm font-black text-slate-700">Classificação</label>
        <span className="text-xs font-bold text-slate-400">{getUsageMeta(usageCategory).label}</span>
      </div>
      <CategorySegment value={usageCategory} onChange={onCategoryChange} />
    </div>

    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="block text-sm font-black text-slate-700">Categoria</label>
        <span className="text-xs font-bold text-slate-400">Prioridade {getProductTypeMeta(productType).priority}</span>
      </div>
      <ProductTypeSegment value={productType} onChange={onProductTypeChange} />
    </div>
  </div>
);

const CreateProductSheet = ({
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (data: { code: string; name: string; usageCategory: UsageCategory; productType: ProductType }) => Promise<boolean>;
}) => {
  const codeRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [usageCategory, setUsageCategory] = useState<UsageCategory>('high');
  const [productType, setProductType] = useState<ProductType>('lanches');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) return;
    setCode('');
    setName('');
    setUsageCategory('high');
    setProductType('lanches');
    setFieldErrors({});
    window.setTimeout(() => codeRef.current?.focus(), 180);
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!code.trim()) nextErrors.code = 'Digite o codigo.';
    if (!name.trim()) nextErrors.name = 'Digite o nome do produto.';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const saved = await onSubmit({ code: code.trim(), name: name.trim(), usageCategory, productType });
    if (saved) {
      setCode('');
      setName('');
      setUsageCategory('high');
      setProductType('lanches');
    }
  };

  return (
    <SheetShell
      title="Adicionar produto"
      eyebrow="Novo cadastro"
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-12 rounded-2xl bg-slate-100 text-sm font-black text-slate-700 transition hover:bg-slate-200">
            Cancelar
          </button>
          <button type="submit" form="create-product-form" disabled={loading} className="h-12 rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      }
    >
      <form id="create-product-form" onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm font-semibold leading-relaxed text-slate-500">
          Crie um produto novo com um codigo unico para os flashcards.
        </p>
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
        <ProductForm
          code={code}
          name={name}
          usageCategory={usageCategory}
          productType={productType}
          fieldErrors={fieldErrors}
          autoFocusRef={codeRef}
          onCodeChange={setCode}
        onNameChange={(value) => {
          setName(value);
          setProductType(inferProductTypeFromProduct({ front: value, back: code, product_type: undefined }));
        }}
          onCategoryChange={setUsageCategory}
          onProductTypeChange={setProductType}
        />
      </form>
    </SheetShell>
  );
};

const EditProductSheet = ({
  product,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (product: Product, data: { code: string; name: string; usageCategory: UsageCategory; productType: ProductType }) => Promise<boolean>;
}) => {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [usageCategory, setUsageCategory] = useState<UsageCategory>('high');
  const [productType, setProductType] = useState<ProductType>('lanches');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!product) return;
    setCode(product.back);
    setName(product.front);
    setUsageCategory(getUsageCategory(product));
    setProductType(inferProductTypeFromProduct(product));
    setFieldErrors({});
    window.setTimeout(() => nameRef.current?.focus(), 180);
  }, [product]);

  if (!product) return null;

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!code.trim()) nextErrors.code = 'Digite o codigo.';
    if (!name.trim()) nextErrors.name = 'Digite o nome do produto.';
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(product, { code: code.trim(), name: name.trim(), usageCategory, productType });
  };

  return (
    <SheetShell
      title="Editar produto"
      eyebrow={`Codigo ${product.back}`}
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-12 rounded-2xl bg-slate-100 text-sm font-black text-slate-700 transition hover:bg-slate-200">
            Cancelar
          </button>
          <button type="submit" form="edit-product-form" disabled={loading} className="h-12 rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      }
    >
      <form id="edit-product-form" onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm font-semibold leading-relaxed text-slate-500">
          Ajuste os dados deste produto sem misturar com o fluxo de cadastro.
        </p>
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
        <ProductForm
          code={code}
          name={name}
          usageCategory={usageCategory}
          productType={productType}
          fieldErrors={fieldErrors}
          autoFocusRef={nameRef}
          onCodeChange={setCode}
          onNameChange={setName}
          onCategoryChange={setUsageCategory}
          onProductTypeChange={setProductType}
        />
      </form>
    </SheetShell>
  );
};

const ProductDetailsSheet = ({
  product,
  categorySaving,
  onClose,
  onEdit,
  onDelete,
  onCategoryChange,
}: {
  product: Product | null;
  categorySaving: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCategoryChange: (product: Product, category: UsageCategory) => void;
}) => {
  if (!product) return null;

  const usageCategory = getUsageCategory(product);

  return (
    <SheetShell
      title={product.front}
      eyebrow="Detalhes"
      onClose={onClose}
      footer={
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Icon name="edit" className="h-4 w-4" />
            Editar produto
          </button>
          <button
            type="button"
            onClick={() => onDelete(product)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 text-sm font-black text-rose-600 transition hover:bg-rose-100"
          >
            <Icon name="trash" className="h-4 w-4" />
            Excluir
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Codigo</p>
          <p className="mt-2 text-5xl font-black tabular-nums tracking-tight">{product.back}</p>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Status</p>
          <UsageBadge category={usageCategory} />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Categoria</p>
          <span className="text-sm font-black text-emerald-700">{getProductTypeMeta(inferProductTypeFromProduct(product)).label}</span>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-black text-slate-700">Classificação</p>
            {categorySaving && <span className="text-xs font-bold text-emerald-600">Salvando...</span>}
          </div>
          <CategorySegment
            value={usageCategory}
            disabled={categorySaving}
            onChange={(category) => onCategoryChange(product, category)}
          />
        </div>
      </div>
    </SheetShell>
  );
};

const ConfirmDeleteSheet = ({
  product,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  product: Product | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (product: Product) => void;
}) => {
  if (!product) return null;

  return (
    <SheetShell
      title="Excluir produto?"
      eyebrow="Acao permanente"
      danger
      onClose={onClose}
      footer={
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onClose} className="h-12 rounded-2xl bg-slate-100 text-sm font-black text-slate-700 transition hover:bg-slate-200">
            Cancelar
          </button>
          <button type="button" onClick={() => onConfirm(product)} disabled={loading} className="h-12 rounded-2xl bg-rose-600 text-sm font-black text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-sm font-semibold leading-relaxed text-rose-700">
            Isso remove o produto da base de flashcards. Esta acao nao pode ser desfeita por aqui.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Produto</p>
          <p className="mt-2 text-lg font-black text-slate-950">{product.front}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">Codigo {product.back}</p>
        </div>
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
      </div>
    </SheetShell>
  );
};

const AddProduct: React.FC<AddProductProps> = ({ onClose, onProductAdded, initialProducts = [] }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts as Product[]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(initialProducts.length === 0);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [categorySavingId, setCategorySavingId] = useState<number | null>(null);
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const loadProducts = async () => {
    setLoadingProducts((current) => products.length === 0 ? true : current);
    try {
      const supabaseProducts = await fetchProductsFromSupabase();
      setProducts(supabaseProducts as Product[]);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const commitProducts = (nextProducts: Product[]) => {
    const rankedProducts = [...nextProducts].sort(compareProductsByLearningRank);
    setProducts(rankedProducts);
    primeProductsCache(rankedProducts);
  };

  const getDuplicateProduct = (code: string, currentProductId?: number) => {
    const duplicate = products.find((product) => product.back === code && product.id !== currentProductId);
    return duplicate ? { id: duplicate.id, code: duplicate.back, name: duplicate.front } : null;
  };

  const getDuplicateMessage = (code: string, productName?: string) => {
    if (productName) {
      return `O codigo ${code} ja esta sendo usado por "${productName}". Escolha outro codigo.`;
    }
    return `O codigo ${code} ja existe. Escolha outro codigo.`;
  };

  const normalizeMutationError = async (error: any, code: string) => {
    if (error?.code === '23505') {
      const { data: conflictingProduct } = await supabase
        .from('flashcard_products')
        .select('name')
        .eq('code', code)
        .limit(1)
        .single();

      return getDuplicateMessage(code, conflictingProduct?.name);
    }

    if (error?.message?.includes('permission denied') || error?.message?.includes('policy')) {
      return 'Erro de permissao. Verifique as politicas RLS no Supabase.';
    }

    return error?.message || 'Nao foi possivel salvar. Tente novamente.';
  };

  const handleCreateProduct = async (data: { code: string; name: string; usageCategory: UsageCategory; productType: ProductType }) => {
    setCreateLoading(true);
    setCreateError('');

    try {
      const duplicate = getDuplicateProduct(data.code);
      if (duplicate) {
        setCreateError(getDuplicateMessage(data.code, duplicate.name));
        return false;
      }

      const nextId = products.length > 0 ? Math.max(...products.map((product) => product.id)) + 1 : 1;

      const { data: insertedData, error: insertError } = await supabase
        .from('flashcard_products')
        .insert({
          id: nextId,
          code: data.code,
          name: data.name,
          usage_category: data.usageCategory,
          product_type: data.productType,
        })
        .select();

      if (insertError) {
        setCreateError(await normalizeMutationError(insertError, data.code));
        return false;
      }

      const insertedProduct = insertedData?.[0]
        ? {
            id: insertedData[0].id,
            back: insertedData[0].code,
            front: insertedData[0].name,
            usage_category: insertedData[0].usage_category,
            product_type: insertedData[0].product_type || data.productType,
          }
        : {
            id: nextId,
            back: data.code,
            front: data.name,
            usage_category: data.usageCategory,
            product_type: data.productType,
          };

      commitProducts([...products, insertedProduct as Product]);
      onProductAdded();
      setIsCreateOpen(false);
      setToast('Produto adicionado com sucesso.');
      return true;
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      setCreateError(await normalizeMutationError(error, data.code));
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditProduct = async (product: Product, data: { code: string; name: string; usageCategory: UsageCategory; productType: ProductType }) => {
    setEditLoading(true);
    setEditError('');

    try {
      const duplicate = getDuplicateProduct(data.code, product.id);
      if (duplicate) {
        setEditError(getDuplicateMessage(data.code, duplicate.name));
        return false;
      }

      const { error: updateError } = await supabase
        .from('flashcard_products')
        .update({
          code: data.code,
          name: data.name,
          usage_category: data.usageCategory,
          product_type: data.productType,
        })
        .eq('id', product.id);

      if (updateError) {
        setEditError(await normalizeMutationError(updateError, data.code));
        return false;
      }

      const updatedProduct = {
        ...product,
        back: data.code,
        front: data.name,
        usage_category: data.usageCategory,
        product_type: data.productType,
      };
      commitProducts(products.map((item) => (item.id === product.id ? updatedProduct : item)));
      onProductAdded();
      setEditingProduct(null);
      setSelectedProduct(null);
      setToast('Alteracoes salvas.');
      return true;
    } catch (error: any) {
      console.error('Erro ao editar produto:', error);
      setEditError(await normalizeMutationError(error, data.code));
      return false;
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    setDeleteLoading(true);
    setDeleteError('');

    try {
      const { error } = await supabase
        .from('flashcard_products')
        .delete()
        .eq('id', product.id);

      if (error) {
        setDeleteError(error.message || 'Erro ao excluir produto.');
        return;
      }

      commitProducts(products.filter((item) => item.id !== product.id));
      onProductAdded();
      setDeleteCandidate(null);
      setSelectedProduct(null);
      setToast('Produto excluido.');
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      setDeleteError(error?.message || 'Erro ao excluir produto.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCategoryChange = async (product: Product, usageCategory: UsageCategory) => {
    if (getUsageCategory(product) === usageCategory) return;

    setCategorySavingId(product.id);
    try {
      const { error } = await supabase
        .from('flashcard_products')
        .update({ usage_category: usageCategory })
        .eq('id', product.id);

      if (error) throw error;

      const updatedProduct = { ...product, usage_category: usageCategory };
      commitProducts(products.map((item) => (item.id === product.id ? updatedProduct : item)));
      setSelectedProduct(updatedProduct);
      onProductAdded();
      setToast('Classificação atualizada.');
    } catch (error) {
      console.error('Erro ao atualizar classificação:', error);
      setToast('Não foi possível atualizar a classificação.');
    } finally {
      setCategorySavingId(null);
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort(compareProductsByLearningRank);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return sortedProducts;

    const query = searchQuery.toLowerCase().trim();
    return sortedProducts.filter((product) => {
      return product.back.toLowerCase().includes(query) || product.front.toLowerCase().includes(query);
    });
  }, [sortedProducts, searchQuery]);

  const highCount = products.filter((product) => getUsageCategory(product) === 'high').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-emerald-50 text-slate-950">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col bg-emerald-50 px-4 pb-28 pt-0 sm:px-6 sm:pb-10 lg:px-8">
        <header className="sticky top-0 z-20 -mx-4 border-b border-emerald-100 bg-white px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                <Icon name="spark" className="h-4 w-4" />
                Painel
              </p>
              <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Gerenciar Produtos</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="hidden h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 sm:flex"
              >
                <Icon name="plus" className="h-4 w-4" />
                Adicionar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Fechar gerenciamento"
              >
                <Icon name="x" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-4 py-4">
          {toast && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Icon name="check" className="h-4 w-4" />
              </span>
              {toast}
            </div>
          )}

          <section className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white p-2.5 shadow-sm">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex-1 rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">Total</p>
                <p className="text-lg font-black leading-tight text-slate-950">{products.length}</p>
              </div>
              <div className="flex-1 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">Alta</p>
                <p className="text-lg font-black leading-tight text-emerald-800">{highCount}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 sm:hidden"
              aria-label="Adicionar produto"
            >
              <Icon name="plus" className="h-6 w-6" />
            </button>
          </section>

          <ProductSearch
            value={searchQuery}
            resultCount={filteredProducts.length}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />

          <section className="space-y-3">
            {loadingProducts ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                <p className="mt-4 text-sm font-bold text-slate-500">Carregando produtos...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductListItem key={product.id} product={product} onSelect={setSelectedProduct} />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-lg font-black text-slate-900">Nenhum produto encontrado</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {searchQuery ? 'Tente buscar por outro codigo ou nome.' : 'Adicione o primeiro produto para comecar.'}
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-4 left-4 right-4 z-30 flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-black text-white shadow-2xl shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99] sm:hidden"
      >
        <Icon name="plus" className="h-5 w-5" />
        Adicionar Produto
      </button>

      <CreateProductSheet
        open={isCreateOpen}
        loading={createLoading}
        error={createError}
        onClose={() => {
          setCreateError('');
          setIsCreateOpen(false);
        }}
        onSubmit={handleCreateProduct}
      />

      <ProductDetailsSheet
        product={selectedProduct}
        categorySaving={selectedProduct ? categorySavingId === selectedProduct.id : false}
        onClose={() => setSelectedProduct(null)}
        onEdit={(product) => {
          setEditError('');
          setSelectedProduct(null);
          setEditingProduct(product);
        }}
        onDelete={(product) => {
          setDeleteError('');
          setSelectedProduct(null);
          setDeleteCandidate(product);
        }}
        onCategoryChange={handleCategoryChange}
      />

      <EditProductSheet
        product={editingProduct}
        loading={editLoading}
        error={editError}
        onClose={() => {
          setEditError('');
          setEditingProduct(null);
        }}
        onSubmit={handleEditProduct}
      />

      <ConfirmDeleteSheet
        product={deleteCandidate}
        loading={deleteLoading}
        error={deleteError}
        onClose={() => {
          setDeleteError('');
          setDeleteCandidate(null);
        }}
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
};

export default AddProduct;
