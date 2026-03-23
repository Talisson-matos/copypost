import { useEffect, useRef, useState } from 'react'
import type { ClipItem } from './types'
import './App.css'

const STORAGE_KEY = 'clipboard_buttons'
const COL_COUNT = 3

type Columns = [ClipItem[], ClipItem[], ClipItem[]]

interface Toast {
  id: string
  label: string
}

function distribute(items: ClipItem[]): Columns {
  const cols: Columns = [[], [], []]
  items.forEach((item, i) => cols[i % COL_COUNT].push(item))
  return cols
}

function flatten(cols: Columns): ClipItem[] {
  return cols.flat()
}

export default function App() {
  const [columns, setColumns] = useState<Columns>([[], [], []])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const dragging = useRef<{ colIdx: number; itemIdx: number } | null>(null)
  const [dragOver, setDragOver] = useState<{ col: number; idx: number } | null>(null)

  // ── Persistence ──
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const items: ClipItem[] = JSON.parse(saved)
      setColumns(distribute(items))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flatten(columns)))
  }, [columns])

  // ── Toast ──
  const pushToast = (label: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, label }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2400)
  }

  // ── Form ──
  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return

    if (editingId) {
      setColumns(prev =>
        prev.map(col =>
          col.map(i => (i.id === editingId ? { ...i, title: title.trim(), content: content.trim() } : i))
        ) as Columns
      )
      setEditingId(null)
    } else {
      const newItem: ClipItem = { id: crypto.randomUUID(), title: title.trim(), content: content.trim() }
      setColumns(prev => {
        const lens = prev.map(c => c.length)
        const target = lens.indexOf(Math.min(...lens))
        return prev.map((col, i) => i === target ? [...col, newItem] : col) as Columns
      })
    }

    setTitle('')
    setContent('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit()
  }

  const handleCopy = (item: ClipItem) => {
    navigator.clipboard.writeText(item.content)
    pushToast(item.title)
  }

  const handleDoubleClick = (item: ClipItem) => {
    setEditingId(item.id)
    setTitle(item.title)
    setContent(item.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setContent('')
  }

  // ── Triple click → delete confirm ──
  const clickCount = useRef<Record<string, number>>({})
  const clickTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const handleCardClick = (e: React.MouseEvent, id: string) => {
    // ignore if clicking the copy button
    if ((e.target as HTMLElement).closest('.copy-btn')) return

    clickCount.current[id] = (clickCount.current[id] ?? 0) + 1

    if (clickTimer.current[id]) clearTimeout(clickTimer.current[id])

    if (clickCount.current[id] >= 3) {
      clickCount.current[id] = 0
      setShowConfirm(id)
      return
    }

    clickTimer.current[id] = setTimeout(() => {
      clickCount.current[id] = 0
    }, 500)
  }

  const confirmDelete = (id: string) => {
    setColumns(prev => prev.map(col => col.filter(i => i.id !== id)) as Columns)
    setShowConfirm(null)
  }

  // ── Drag & Drop ──
  const handleDragStart = (colIdx: number, itemIdx: number) => {
    dragging.current = { colIdx, itemIdx }
  }

  const handleDropOnColumn = (e: React.DragEvent, targetCol: number) => {
    e.preventDefault()
    if (!dragging.current) return

    const { colIdx: fromCol, itemIdx: fromIdx } = dragging.current
    const item = columns[fromCol][fromIdx]
    if (!item) return

    setColumns(prev => {
      const next = prev.map(c => [...c]) as Columns
      next[fromCol].splice(fromIdx, 1)
      const dropIdx = dragOver?.col === targetCol ? dragOver.idx : next[targetCol].length
      next[targetCol].splice(dropIdx, 0, item)
      return next
    })

    dragging.current = null
    setDragOver(null)
  }

  const handleDragEnd = () => {
    dragging.current = null
    setDragOver(null)
  }

  const isEditing = !!editingId
  const totalItems = flatten(columns).length

  return (
    <div className="app">

      <header className="header">
        <div className="header-inner">
          <div>
            <span className="eyebrow">clipboard</span>
            <h1>Quick Copy</h1>
          </div>
          {totalItems > 0 && (
            <span className="header-count">{totalItems} snippet{totalItems !== 1 ? 's' : ''}</span>
          )}
        </div>
      </header>

      <main className="main">

        {/* Form */}
        <section className={`form-panel${isEditing ? ' is-editing' : ''}`}>
          <p className="form-label">{isEditing ? 'Editing snippet' : 'New snippet'}</p>
          <div className="form-fields">
            <input
              className="field-input"
              placeholder="Name"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <textarea
              className="field-textarea"
              placeholder="Content to copy…"
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="form-actions">
            {isEditing && (
              <button className="btn btn-ghost" onClick={cancelEdit}>Cancel</button>
            )}
            <button className="btn btn-primary" onClick={handleSubmit}>
              {isEditing ? 'Save changes' : 'Add snippet'}
            </button>
          </div>
        </section>

        {/* Columns */}
        {totalItems > 0 ? (
          <div className="columns">
            {columns.map((col, colIdx) => (
              <div
                key={colIdx}
                className={`column${dragOver?.col === colIdx ? ' column-active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver({ col: colIdx, idx: col.length }) }}
                onDrop={e => handleDropOnColumn(e, colIdx)}
              >
                <div className="column-header">
                  <span className="column-label">Column {colIdx + 1}</span>
                  <span className="column-count">{col.length}</span>
                </div>

                <div className="column-body">
                  {col.map((item, itemIdx) => (
                    <div
                      key={item.id}
                      className={`card${dragOver?.col === colIdx && dragOver.idx === itemIdx ? ' card-drop-before' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(colIdx, itemIdx)}
                      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver({ col: colIdx, idx: itemIdx }) }}
                      onDrop={e => handleDropOnColumn(e, colIdx)}
                      onDragEnd={handleDragEnd}
                      onDoubleClick={() => handleDoubleClick(item)}
                      onClick={e => handleCardClick(e, item.id)}
                    >
                      <div className="drag-handle">
                        <span /><span /><span />
                      </div>
                      <span className="card-title">{item.title}</span>
                      <button
                        className="copy-btn"
                        onClick={e => { e.stopPropagation(); handleCopy(item) }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                      </button>
                    </div>
                  ))}
                  {col.length === 0 && (
                    <div className="col-empty">Drop here</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No snippets yet — add one above.</p>
        )}
      </main>

      {/* Delete confirm */}
      {showConfirm && (
        <div className="overlay" onClick={() => setShowConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-title">Delete this snippet?</p>
            <p className="modal-sub">This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => confirmDelete(showConfirm)}>Delete</button>
              <button className="btn btn-ghost" onClick={() => setShowConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span><strong>{t.label}</strong> copied</span>
          </div>
        ))}
      </div>
    </div>
  )
}