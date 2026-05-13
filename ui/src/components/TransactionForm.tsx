import { useState } from 'react'
import axios from 'axios'
import { toast } from './Toaster'

export default function TransactionForm({ userId }: { userId: string }) {
  const [formData, setFormData] = useState({ symbol: '', type: 'BUY', qty: '', price: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/portfolio/transactions`, {
        userId,
        assetSymbol: formData.symbol.toUpperCase(),
        type: formData.type,
        quantity: Number(formData.qty),
        price: Number(formData.price),
      }, { headers: { 'Idempotency-Key': Date.now().toString() }})
      toast('Order executed', 'success')
      setFormData({ symbol: '', type: 'BUY', qty: '', price: '' })
      window.dispatchEvent(new Event('refresh'))
    } catch {
      toast('Failed to execute', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>New Transaction</h2>
      <form onSubmit={handleSubmit} className={`form-inline ${loading ? 'loading' : ''}`}>
        <div className="input-group">
          <label>Asset</label>
          <input value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="AAPL" required />
        </div>
        <div className="input-group">
          <label>Type</label>
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
        </div>
        <div className="input-group">
          <label>Quantity</label>
          <input type="number" value={formData.qty} onChange={e => setFormData({...formData, qty: e.target.value})} placeholder="0" required />
        </div>
        <div className="input-group">
          <label>Price</label>
          <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>Execute</button>
      </form>
    </div>
  )
}
