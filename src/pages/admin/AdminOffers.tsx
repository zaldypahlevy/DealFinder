import { useState, useEffect } from 'react'
import { Plus, Pencil, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Offer, Product, Marketplace, Seller } from '../../types'
import { formatRupiah } from '../../utils/format'

export function AdminOffers() {
  const [offers, setOffers] = useState<(Offer & { product?: Product; marketplace?: Marketplace; seller?: Seller })[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([])
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Offer | null>(null)
  const [form, setForm] = useState({
    product_id: '', marketplace_id: '', seller_id: '', price: '', shipping_cost: '0',
    seller_rating: '4.8', review_count: '0', warranty: '', return_policy: '',
    product_url: '', affiliate_url: '', active: true,
  })

  useEffect(() => {
    loadOffers()
    supabase.from('products').select('*').order('name').then(({ data }) => { if (data) setProducts(data as Product[]) })
    supabase.from('marketplaces').select('*').order('name').then(({ data }) => { if (data) setMarketplaces(data as Marketplace[]) })
    supabase.from('sellers').select('*, marketplace:marketplaces(*)').then(({ data }) => { if (data) setSellers(data as Seller[]) })
  }, [])

  const loadOffers = async () => {
    try {
      const { data } = await supabase
        .from('offers')
        .select('*, product:products(*), marketplace:marketplaces(*), seller:sellers(*)')
        .order('created_at', { ascending: false })
      if (data) setOffers(data as (Offer & { product?: Product; marketplace?: Marketplace; seller?: Seller })[])
    } catch (err) {
      console.error('Failed to load offers:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ product_id: '', marketplace_id: '', seller_id: '', price: '', shipping_cost: '0', seller_rating: '4.8', review_count: '0', warranty: '', return_policy: '', product_url: '', affiliate_url: '', active: true })
    setShowModal(true)
  }

  const openEdit = (o: Offer) => {
    setEditing(o)
    setForm({
      product_id: o.product_id, marketplace_id: o.marketplace_id, seller_id: o.seller_id || '',
      price: o.price.toString(), shipping_cost: o.shipping_cost.toString(),
      seller_rating: o.seller_rating.toString(), review_count: o.review_count.toString(),
      warranty: o.warranty || '', return_policy: o.return_policy || '',
      product_url: o.product_url || '', affiliate_url: o.affiliate_url || '', active: o.active,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    const payload = {
      product_id: form.product_id, marketplace_id: form.marketplace_id,
      seller_id: form.seller_id || null, price: Number(form.price),
      shipping_cost: Number(form.shipping_cost), seller_rating: Number(form.seller_rating),
      review_count: Number(form.review_count), warranty: form.warranty || null,
      return_policy: form.return_policy || null, product_url: form.product_url || null,
      affiliate_url: form.affiliate_url || null, active: form.active,
      updated_at: new Date().toISOString(),
    }
    if (editing) {
      await supabase.from('offers').update(payload).eq('id', editing.id)
      await supabase.from('price_history').insert({ offer_id: editing.id, price: Number(form.price) })
    } else {
      const { data } = await supabase.from('offers').insert(payload).select('id').single()
      if (data) await supabase.from('price_history').insert({ offer_id: data.id, price: Number(form.price) })
    }
    setShowModal(false)
    loadOffers()
  }

  const toggleActive = async (o: Offer) => {
    await supabase.from('offers').update({ active: !o.active, updated_at: new Date().toISOString() }).eq('id', o.id)
    loadOffers()
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Offers</h1>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Tambah Offer
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="p-3 font-semibold">Produk</th>
              <th className="p-3 font-semibold hidden md:table-cell">Marketplace</th>
              <th className="p-3 font-semibold">Harga</th>
              <th className="p-3 font-semibold hidden lg:table-cell">Seller</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Memuat...</td></tr>
            ) : offers.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-neutral-400">Belum ada offer</td></tr>
            ) : (
              offers.map((o) => (
                <tr key={o.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="p-3 font-medium text-neutral-900 truncate max-w-xs">{o.product?.name || '-'}</td>
                  <td className="p-3 text-neutral-600 hidden md:table-cell">{o.marketplace?.name || '-'}</td>
                  <td className="p-3 font-semibold text-neutral-900">{formatRupiah(Number(o.price))}</td>
                  <td className="p-3 text-neutral-600 hidden lg:table-cell">{o.seller?.name || '-'}</td>
                  <td className="p-3">
                    <button onClick={() => toggleActive(o)} className={`badge ${o.active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}>
                      {o.active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(o)} className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium">
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
              <h3 className="text-lg font-bold">{editing ? 'Edit Offer' : 'Tambah Offer'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-neutral-700 block mb-1.5">Produk</label>
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="input">
                  <option value="">Pilih produk</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-neutral-700 block mb-1.5">Marketplace</label>
                  <select value={form.marketplace_id} onChange={(e) => setForm({ ...form, marketplace_id: e.target.value })} className="input">
                    <option value="">Pilih marketplace</option>
                    {marketplaces.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-neutral-700 block mb-1.5">Seller</label>
                  <select value={form.seller_id} onChange={(e) => setForm({ ...form, seller_id: e.target.value })} className="input">
                    <option value="">Pilih seller</option>
                    {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Harga" value={form.price} onChange={(v) => setForm({ ...form, price: v })} type="number" />
                <FormField label="Shipping Cost" value={form.shipping_cost} onChange={(v) => setForm({ ...form, shipping_cost: v })} type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Seller Rating" value={form.seller_rating} onChange={(v) => setForm({ ...form, seller_rating: v })} type="number" />
                <FormField label="Review Count" value={form.review_count} onChange={(v) => setForm({ ...form, review_count: v })} type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Warranty" value={form.warranty} onChange={(v) => setForm({ ...form, warranty: v })} />
                <FormField label="Return Policy" value={form.return_policy} onChange={(v) => setForm({ ...form, return_policy: v })} />
              </div>
              <FormField label="Product URL" value={form.product_url} onChange={(v) => setForm({ ...form, product_url: v })} />
              <FormField label="Affiliate URL" value={form.affiliate_url} onChange={(v) => setForm({ ...form, affiliate_url: v })} />
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
