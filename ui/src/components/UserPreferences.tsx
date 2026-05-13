import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from './Toaster'

interface Preference {
  emailEnabled: boolean;
  email: string;
  notificationThreshold: number;
}

export default function UserPreferences({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Preference>({
    emailEnabled: true,
    email: '',
    notificationThreshold: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const res = await axios.get(`${apiUrl}/api/notifications/preferences/${userId}`)
        if (res.data.data) {
          setPrefs({
            emailEnabled: res.data.data.emailEnabled ?? true,
            email: res.data.data.email || '',
            notificationThreshold: Number(res.data.data.notificationThreshold || 0)
          })
        }
      } catch (err) {
        console.error('Failed to fetch preferences', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [apiUrl, userId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.put(`${apiUrl}/api/notifications/preferences/${userId}`, prefs)
      toast('Preferences updated', 'success')
    } catch {
      toast('Failed to update preferences', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="card">Loading settings...</div>

  return (
    <div className="card">
      <h2>Notification Settings</h2>
      <form onSubmit={handleSave} className={`form-inline ${saving ? 'loading' : ''}`}>
        <div className="input-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
            <input 
              type="checkbox" 
              id="emailEnabled"
              checked={prefs.emailEnabled} 
              onChange={e => setPrefs({...prefs, emailEnabled: e.target.checked})} 
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="emailEnabled" style={{ cursor: 'pointer', fontWeight: '600', fontSize: '12px', margin: 0 }}>Enable Alerts</label>
          </div>
        </div>

        <div className="input-group">
          <label>Email</label>
          <input 
            type="email" 
            value={prefs.email} 
            onChange={e => setPrefs({...prefs, email: e.target.value})} 
            placeholder="user@example.com" 
            disabled={!prefs.emailEnabled}
            required={prefs.emailEnabled}
          />
        </div>

        <div className="input-group">
          <label>Alert Threshold ($)</label>
          <input 
            type="number" 
            value={prefs.notificationThreshold} 
            onChange={e => setPrefs({...prefs, notificationThreshold: Number(e.target.value)})} 
            placeholder="0.00" 
            min="0"
          />
        </div>

        <div className="input-group">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
