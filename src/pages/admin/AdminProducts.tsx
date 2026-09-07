import { useState, useEffect } from 'react'
import { Plus, Pencil, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Product, Category } from '../../types'
import { formatRupiah } from '../../utils/format'

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({
    name: '', brand: '', model: '', variant: '', category_id: '', description: '', image_url: '', reference_price: '', active: true,
  })

  useEffect(() => {
    loadProducts()
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data as Category[])
    })
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setProducts(data as Product[])
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', brand: '', model: '', variant: '', category_id: '', description: '', image_url: '', reference_price: '', active: true })
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      name: p.name, brand: p.brand, model: p.model, variant: p.variant || '',
      category_id: p.category_id || '', description: p.description || '', image_url: p.image_url || '',
      reference_price: p.reference_price?.toString() || '', active: p.active,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const payload = {
      name: form.name, brand: form.brand, model: form.model, variant: form.variant || null,
      category_id: form.category_id || null, description: form.description || null,
      image_url: form.image_url || null, reference_price: form.reference_price ? Number(form.reference_price) : null,
      active: form.active, updated_at: new Date().toISOString(),
    }
    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('products').insert(payload)
    }
    setShowModal(false)
    loadProducts()
  }

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ active: !p.active, updated_at: new Date().toISOString() }).eq('id', p.id)
    loadProducts()
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Tambah Product
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="p-3 font-semibold">Nama</th>
              <th className="p-3 font-semibold hidden md:table-cell">Brand</th>
              <th className="p-3 font-semibold hidden lg:table-cell">Kategori</th>
              <th className="p-3 font-semibold">Ref. Price</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Memuat...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Belum ada produk</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="p-3 font-medium text-neutral-900">{p.name}</td>
                  <td className="p-3 text-neutral-600 hidden md:table-cell">{p.brand}</td>
                  <td className="p-3 text-neutral-600 hidden lg:table-cell">{p.category?.name || '-'}</td>
                  <td className="p-3 text-neutral-600">{p.reference_price ? formatRupiah(Number(p.reference_price)) : '-'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`badge ${p.active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}
                    >
                      {p.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editing ? 'Edit Product' : 'Tambah Product'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <FormField label="Nama" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
                <FormField label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Variant" value={form.variant} onChange={(v) => setForm({ ...form, variant: v })} />
                <FormField label="Reference Price" value={form.reference_price} onChange={(v) => setForm({ ...form, reference_price: v })} type="number" />
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-700 block mb-1.5">Kategori</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
                  <option value="">Pilih kategori</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <FormField label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
              <div>
                <label className="text-sm font-semibold text-neutral-700 block mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input min-h-[80px]" />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded" />
                Aktif
              </label>
              <button onClick={handleSave} className="btn-primary w-full">
                <Check className="h-4 w-4" />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700 block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="input" />
    </div>
  )
}
