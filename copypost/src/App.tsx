import { useEffect, useRef, useState, type FC } from 'react'
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

        <div className="groups-container">
          <div className="group">
            <h2>Beleza e Estética</h2>
            <div className="items-list">
              <div className="item">Alongamento de cílios (fio a fio, volume russo, híbrido)</div>
              <div className="item">Lifting de cílios (curvatura natural sem extensão)</div>
              <div className="item">Tintura de cílios (realce da cor sem maquiagem)</div>
              <div className="item">Máscaras de cílios (tipos: alongamento, volume, definição)</div>
              <div className="item">Cuidados com cílios naturais (fortalecimento, séruns, higiene)</div>
              <div className="item">Design de cílios artísticos (para eventos e moda)</div>
              <div className="item">Design de sobrancelhas (modelagem com pinça, cera ou linha)</div>
              <div className="item">Micropigmentação (fio a fio, shadow, ombré)</div>
              <div className="item">Henna para sobrancelhas (pigmentação temporária)</div>
              <div className="item">Laminado de sobrancelhas (brow lamination)</div>
              <div className="item">Tintura de sobrancelhas</div>
              <div className="item">Cuidados naturais (óleos fortalecedores, crescimento)</div>
              <div className="item">Correção com maquiagem (lápis, sombras, gel)</div>
              <div className="item">Maquiagem profissional (técnicas, tendências, produtos)</div>
              <div className="item">Skincare (rotinas de cuidados com a pele, hidratação, anti-idade)</div>
              <div className="item">Unhas (manicure, nail art, alongamento em gel/acrílico)</div>
              <div className="item">Cabelos (cortes, colorações, hidratações, alisamentos, penteados)</div>
              <div className="item">Estética facial (peelings, limpeza de pele, hidratação profunda)</div>
              <div className="item">Estética corporal (massagens, drenagem linfática, tratamentos redutores)</div>
              <div className="item">Bem-estar e autoimagem (autoestima, cuidados integrados de beleza e saúde)</div>
              <div className="item">Moda clássica</div>
              <div className="item">Moda contemporânea</div>
              <div className="item">Moda minimalista</div>
              <div className="item">Moda streetwear</div>
              <div className="item">Moda sustentável</div>
              <div className="item">Moda futurista (tecidos tecnológicos, wearables)</div>
              <div className="item">Moda vintage e retrô</div>
              <div className="item">Moda feminina (vestidos, acessórios, sapatos)</div>
              <div className="item">Moda masculina (alfaiataria, casual, esportiva)</div>
              <div className="item">Moda infantil</div>
              <div className="item">Moda plus size</div>
              <div className="item">Moda praia</div>
              <div className="item">Moda fitness</div>
              <div className="item">Cores e paletas da estação</div>
              <div className="item">Tecidos e texturas (jeans, seda, couro, linho)</div>
              <div className="item">Acessórios (bolsas, óculos, joias, chapéus)</div>
              <div className="item">Calçados (sneakers, salto alto, botas)</div>
              <div className="item">Maquiagem e cabelo como parte do look</div>
              <div className="item">Semanas de moda (Paris, Milão, Nova York, São Paulo)</div>
              <div className="item">Grandes estilistas e marcas de luxo</div>
              <div className="item">Fast fashion vs slow fashion</div>
              <div className="item">Moda e identidade cultural</div>
              <div className="item">Moda e tecnologia (e-commerce, realidade aumentada)</div>
              <div className="item">Moda inclusiva (roupas adaptadas, diversidade)</div>
              <div className="item">Moda sustentável (upcycling, tecidos ecológicos)</div>
              <div className="item">Moda de celebridades e influenciadores</div>
              <div className="item">Moda de rua (street style)</div>
              <div className="item">Moda e música (looks icônicos de artistas)</div>
            </div>
          </div>

          <div className="group">
            <h2>Culinária</h2>
            <div className="items-list">
              <div className="item">Culinária Mineira</div>
              <div className="item">Culinária Baiana</div>
              <div className="item">Culinária Amazônica</div>
              <div className="item">Culinária Nordestina</div>
              <div className="item">Culinária Gaúcha</div>
              <div className="item">Culinária Portuguesa</div>
              <div className="item">Culinária Espanhola</div>
              <div className="item">Culinária Alemã</div>
              <div className="item">Culinária Coreana</div>
              <div className="item">Culinária Tailandesa</div>
              <div className="item">Culinária Vietnamita</div>
              <div className="item">Culinária Peruana</div>
              <div className="item">Culinária Chilena</div>
              <div className="item">Culinária Argentina</div>
              <div className="item">Culinária Africana</div>
              <div className="item">Culinária Marroquina</div>
              <div className="item">Culinária Turca</div>
              <div className="item">Culinária Grega</div>
              <div className="item">Culinária Russa</div>
              <div className="item">Culinária Polonesa</div>
              <div className="item">Culinária Judaica</div>
              <div className="item">Culinária de Festivais</div>
              <div className="item">Culinária de Confeitaria</div>
              <div className="item">Culinária de Sorvetes e Gelados</div>
              <div className="item">Culinária de Conservas e Compotas</div>
              <div className="item">Culinária de Molhos e Temperos</div>
              <div className="item">Culinária de Assados</div>
              <div className="item">Culinária de Grelhados</div>
              <div className="item">Culinária de Ensopados</div>
              <div className="item">Culinária de Risotos</div>
              <div className="item">Culinária de Sanduíches</div>
              <div className="item">Culinária de Saladas</div>
              <div className="item">Culinária de Tapas e Petiscos</div>
              <div className="item">Culinária de Brunch</div>
              <div className="item">Culinária de Café da Manhã</div>
              <div className="item">Culinária de Almoços Rápidos</div>
              <div className="item">Culinária de Jantares Elaborados</div>
              <div className="item">Culinária de Sobremesas Tradicionais</div>
              <div className="item">Culinária de Doces Regionais</div>
              <div className="item">Culinária de Festas Juninas</div>
            </div>
          </div>

          <div className="group">
            <h2> Saúde e Bem-estar </h2>
            <div className="items-list">
              <div className="item">Sistema Nervoso: coordenação, percepção, memória, movimentos</div>
              <div className="item">Sistema Cardiovascular: transporte de sangue, oxigênio e nutrientes</div>
              <div className="item">Sistema Respiratório: troca de gases, pulmões e vias aéreas</div>
              <div className="item">Sistema Digestivo: ingestão, digestão e absorção de nutrientes</div>
              <div className="item">Sistema de Nutrição: integração entre digestivo, circulatório e urinário</div>
              <div className="item">Sistema Esquelético: suporte, proteção e produção de células sanguíneas</div>
              <div className="item">Sistema Muscular: movimento e postura</div>
              <div className="item">Sistema Imunológico: defesa contra agentes patogênicos</div>
              <div className="item">Sistema Endócrino: regulação por hormônios</div>
              <div className="item">Sistema Urinário: filtra sangue e elimina resíduos</div>
              <div className="item">Sistema Reprodutor: reprodução da espécie</div>
              <div className="item">Sistema Tegumentar: pele, pelos e unhas, proteção e regulação térmica</div>
              <div className="item">Reiki</div>
              <div className="item">Acupuntura</div>
              <div className="item">Auriculoterapia</div>
              <div className="item">Terapia de Florais</div>
              <div className="item">Tai Chi Chuan, Lian Gong</div>
              <div className="item">Shantala</div>
              <div className="item">Quiropraxia</div>
              <div className="item">Musicoterapia</div>
              <div className="item">Dança Circular</div>
              <div className="item">Terapia com Sons (vibracional)</div>
              <div className="item">Meditação Guiada</div>
              <div className="item">Yoga</div>
              <div className="item">Homeopatia</div>
              <div className="item">Fitoterapia</div>
              <div className="item">Aromaterapia</div>
              <div className="item">Apiterapia</div>
              <div className="item">Arteterapia</div>
              <div className="item">Constelação Familiar</div>
              <div className="item">Terapia Comunitária Integrativa</div>
              <div className="item">Medicina Antroposófica</div>
              <div className="item">Mindfulness e relaxamento</div>
              <div className="item">Medicina Tradicional Chinesa</div>
              <div className="item">Medicina Ayurveda</div>
              <div className="item">Osteopatia</div>
              <div className="item">Reflexoterapia</div>
              <div className="item">Hipnoterapia</div>
              <div className="item">Termalismo Social/Crenoterapia</div>
              <div className="item">Biodança</div>
              <div className="item">Rolfing</div>
              <div className="item">Shiatsu</div>
              <div className="item">Do-in</div>
              <div className="item">Massagem Ayurvédica</div>
              <div className="item">Reflexologia Podal</div>
              <div className="item">Pranic Healing</div>
              <div className="item">Radiestesia e Radiônica</div>
              <div className="item">ThetaHealing</div>
              <div className="item">Cromoterapia</div>
              <div className="item">Geoterapia (argilas e minerais)</div>
              <div className="item">Helioterapia (luz solar)</div>
              <div className="item">Hidroterapia</div>
              <div className="item">Terapia com Cristais</div>
              <div className="item">Gestalt-terapia</div>
              <div className="item">Psicodrama</div>
              <div className="item">Hipnose Ericksoniana</div>
              <div className="item">Bioenergética</div>
              <div className="item">Naturopatia</div>
              <div className="item">Iridologia</div>
              <div className="item">Terapia Ortomolecular</div>
              <div className="item">Terapia Transpessoal</div>
            </div>
          </div>

          <div className="group">
            <h2>Produtividade e Gestão de Pessoas</h2>
            <div className="items-list">
              <div className="item">Gestão de tempo (time management)</div>
              <div className="item">Técnicas de foco (Pomodoro, Deep Work)</div>
              <div className="item">Organização de tarefas (Kanban, GTD – Getting Things Done)</div>
              <div className="item">Automação de processos e uso de ferramentas digitais</div>
              <div className="item">Equilíbrio entre vida pessoal e profissional</div>
              <div className="item">Produtividade híbrida (home office + escritório físico)</div>
              <div className="item">Comunicação eficaz (oral e escrita)</div>
              <div className="item">Trabalho em equipe e colaboração</div>
              <div className="item">Liderança e gestão de pessoas</div>
              <div className="item">Inteligência emocional</div>
              <div className="item">Resolução de conflitos</div>
              <div className="item">Pensamento crítico e criatividade</div>
              <div className="item">Adaptabilidade e resiliência</div>
              <div className="item">Networking e habilidades sociais</div>
              <div className="item">Design de escritórios modernos (open space, coworking)</div>
              <div className="item">Bem-estar no ambiente corporativo (ergonomia, pausas ativas)</div>
              <div className="item">Diversidade e inclusão no trabalho</div>
              <div className="item">Cultura organizacional e engajamento de equipes</div>
              <div className="item">Motivação e reconhecimento profissional</div>
              <div className="item">Softwares de produtividade (Notion, Trello, Asana, Slack)</div>
              <div className="item">Metodologias ágeis (Scrum, Kanban, OKRs)</div>
              <div className="item">Gestão de projetos e indicadores de desempenho</div>
              <div className="item">Uso de IA e tecnologia para otimizar rotinas</div>
              <div className="item">Futuro do trabalho (automação, IA, novas profissões)</div>
              <div className="item">Trabalho remoto e globalização das equipes</div>
              <div className="item">Equipes multiculturais e comunicação intercultural</div>
              <div className="item">Desenvolvimento contínuo (lifelong learning)</div>
              <div className="item">Equilíbrio mental e mindfulness no ambiente corporativo</div>
              <div className="item">Evernote – anotações, organização de ideias e documentos</div>
              <div className="item">Todoist – gerenciamento de tarefas e listas pessoais/profissionais</div>
              <div className="item">ClickUp – plataforma completa de gestão de projetos e produtividade</div>
              <div className="item">Monday.com – gestão visual de projetos e equipes</div>
              <div className="item">Airtable – banco de dados flexível com interface de planilha</div>
              <div className="item">Microsoft Teams – reuniões, chat e integração com Office 365</div>
              <div className="item">Zoom – videoconferências e webinars</div>
              <div className="item">Google Meet – reuniões online integrado ao Google Workspace</div>
              <div className="item">Discord – comunicação por voz, vídeo e comunidades</div>
              <div className="item">Zapier – integração e automação entre diferentes apps</div>
              <div className="item">IFTTT (If This Then That) – automação simples de tarefas digitais</div>
              <div className="item">Power Automate (Microsoft) – automação corporativa integrada ao Office</div>
              <div className="item">Jira – gestão de projetos ágeis, muito usado em tecnologia</div>
              <div className="item">Basecamp – colaboração e organização de projetos</div>
              <div className="item">Confluence – documentação e gestão de conhecimento em equipes</div>
              <div className="item">Dropbox – armazenamento em nuvem e compartilhamento de arquivos</div>
              <div className="item">OneDrive – nuvem integrada ao Microsoft Office</div>
              <div className="item">Google Drive – armazenamento e colaboração em tempo real</div>
              <div className="item">Tableau – visualização e análise de dados</div>
              <div className="item">Power BI (Microsoft) – dashboards e relatórios interativos</div>
              <div className="item">Google Data Studio – relatórios e visualizações integrados ao Google</div>
              <div className="item">Canva – criação de apresentações e materiais gráficos</div>
              <div className="item">Figma – design colaborativo de interfaces e protótipos</div>
              <div className="item">Miro – quadro branco digital para brainstorming e colaboração</div>
            </div>
          </div>


        </div>




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
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span><strong>{t.label}</strong> copied</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

