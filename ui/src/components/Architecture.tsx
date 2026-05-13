import { useEffect, useRef, useState } from 'react'
import simplified from '../docs/simplified_mermaid.md?raw'
import detailed from '../docs/detailed_mermaid.md?raw'
import deployment from '../docs/deployement_mermaid.md?raw'

type View = 'simplified' | 'detailed' | 'deployment'

export default function Architecture({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<View>('simplified')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const render = async () => {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose' })
      if (ref.current) {
        ref.current.innerHTML = ''
        const source = view === 'simplified' ? simplified : view === 'detailed' ? detailed : deployment
        const { svg } = await mermaid.render(`svg-${view}`, source)
        ref.current.innerHTML = svg
      }
    }
    render()
  }, [view])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h2 style={{ margin: 0 }}>System Architecture</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={`btn btn-sm ${view === 'simplified' ? 'btn-primary' : ''}`} onClick={() => setView('simplified')}>Simplified</button>
              <button className={`btn btn-sm ${view === 'detailed' ? 'btn-primary' : ''}`} onClick={() => setView('detailed')}>Detailed</button>
              <button className={`btn btn-sm ${view === 'deployment' ? 'btn-primary' : ''}`} onClick={() => setView('deployment')}>Deployment</button>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div ref={ref} style={{ overflowX: 'auto', background: '#fff', padding: '20px', borderRadius: '4px', border: '1px solid var(--border)' }} />
      </div>
    </div>
  )
}
