import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="hidden md:block bg-neutral-900 text-neutral-400 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4 [&_span]:text-white">
              <Logo size="md" />
            </div>
            <p className="text-sm max-w-md">
              Cari sebelum beli. Jangan cuma cari harga termurah. Temukan deal terbaik.
            </p>
            <p className="text-sm mt-2 text-neutral-500">
              DealFinder membantu Anda mengambil keputusan pembelian yang lebih cerdas.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Jelajahi</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition">Beranda</Link></li>
              <li><Link to="/search" className="hover:text-white transition">Cari Produk</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition">Wishlist</Link></li>
              <li><Link to="/alerts" className="hover:text-white transition">Price Alert</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-4">Tentang</h3>
            <ul className="space-y-2 text-sm">
              <li><p className="text-neutral-500">DF Score membantu menilai kualitas deal berdasarkan harga, seller, review, warranty, dan faktor kepercayaan.</p></li>
              <li><p className="text-neutral-500">Sponsored placement tidak memengaruhi DF Score.</p></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-800 mt-8 pt-6 text-sm text-neutral-500">
          <p>&copy; 2026 DealFinder. Semua harga adalah data demo dan dapat berubah.</p>
        </div>
      </div>
    </footer>
  )
}
