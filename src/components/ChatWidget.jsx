import { useState } from 'react'
import { MessageCircle, Send, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react'
import { getErrorMessage, sendFeedback, streamAssistant } from '../api/client'
import { useAnalysis } from '../context/AnalysisContext'

const SUGGESTIONS = [
  "Comment est calculé le score ?",
  "Qu'est-ce que la fuite de données ?",
  'How is the best model chosen?',
]

// Nombre de messages envoyés au serveur (6 messages = 3 allers-retours)
const HISTORY_SIZE = 6
const MAX_TURN_CHARS = 1000

export default function ChatWidget() {
  const { analysis } = useAnalysis()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  /** Met à jour le dernier message assistant (texte, sources, mode). */
  function updateLastAssistant(patch) {
    setMessages((prev) => {
      const copy = [...prev]
      const last = copy[copy.length - 1]
      copy[copy.length - 1] = { ...last, ...patch(last) }
      return copy
    })
  }

  async function send(text) {
    const question = text.trim()
    if (!question || loading) return

    // Historique : uniquement les messages utilisateur et assistant, sans les erreurs
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-HISTORY_SIZE)
      .map((m) => ({ role: m.role, content: m.text.slice(0, MAX_TURN_CHARS) }))

    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)

    let assistantCreated = false
    try {
      await streamAssistant(question, analysis, history, (event) => {
        if (event.type === 'meta') {
          // Le message assistant apparaît dès que le mode et les sources sont connus
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', text: '', mode: event.mode, sources: event.sources, vote: null },
          ])
          assistantCreated = true
        } else if (event.type === 'token') {
          updateLastAssistant((last) => ({ text: last.text + event.text }))
        } else if (event.type === 'error') {
          throw new Error(event.detail)
        }
      })
    } catch (err) {
      // Si le message assistant a été créé, on remplace son contenu ; sinon on ajoute une erreur
      if (assistantCreated) {
        updateLastAssistant(() => ({ role: 'error', text: getErrorMessage(err) }))
      } else {
        setMessages((prev) => [...prev, { role: 'error', text: getErrorMessage(err) }])
      }
    } finally {
      setLoading(false)
    }
  }

  /** Enregistre un vote sur la réponse à l'index donné. */
  async function vote(index, value) {
    const answerMsg = messages[index]
    const questionMsg = messages.slice(0, index).reverse().find((m) => m.role === 'user')
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, vote: value } : m)))
    try {
      await sendFeedback(questionMsg?.text ?? '', answerMsg.text, answerMsg.mode, value)
    } catch {
      // Le vote reste affiché ; l'échec d'enregistrement n'est pas bloquant
    }
  }

  function clearConversation() {
    setMessages([])
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border-[1.5px] border-ink bg-violet text-white shadow-[4px_4px_0_0_#1f1d2b] transition hover:-translate-y-0.5"
        aria-label="Ouvrir l'assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] flex-col rounded-2xl border-[1.5px] border-ink bg-white shadow-[4px_4px_0_0_#1f1d2b]">
          <div className="flex items-start justify-between border-b-[1.5px] border-line px-4 py-3">
            <div>
              <p className="font-bold text-ink">Assistant ML</p>
              <p className="text-xs text-muted">
                {analysis ? 'Je connais votre analyse en cours.' : 'Questions sur le machine learning.'}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearConversation}
                className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Effacer la conversation"
                title="Effacer la conversation"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full cursor-pointer rounded-xl border-[1.5px] border-line bg-surface-2 px-3 py-2 text-left text-muted hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === 'user'
                    ? 'ml-8 rounded-xl bg-violet/15 px-3 py-2 text-ink'
                    : m.role === 'error'
                      ? 'rounded-xl bg-rose/10 px-3 py-2 text-rose'
                      : 'mr-4 rounded-xl bg-surface-2 px-3 py-2 text-ink'
                }
              >
                <p className="whitespace-pre-wrap">{m.text}</p>

                {m.role === 'assistant' && (
                  <>
                    <p className="mt-2 text-xs text-muted">
                      {m.mode === 'rag'
                        ? `Source : base de connaissances${m.sources?.length
                          ? ' (' + [...new Set(m.sources.map((s) => s.source))].join(', ') + ')'
                          : ''
                        }`
                        : 'Réponse générale, sans document de la base'}
                    </p>

                    {/* Vote seulement une fois la réponse terminée */}
                    {!(loading && i === messages.length - 1) && m.text && (
                      <div className="mt-2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => vote(i, 'up')}
                          disabled={Boolean(m.vote)}
                          className={`cursor-pointer rounded-lg p-1 disabled:cursor-default ${
                            m.vote === 'up' ? 'text-emerald' : 'text-muted hover:text-ink'
                          }`}
                          aria-label="Bonne réponse"
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => vote(i, 'down')}
                          disabled={Boolean(m.vote)}
                          className={`cursor-pointer rounded-lg p-1 disabled:cursor-default ${
                            m.vote === 'down' ? 'text-rose' : 'text-muted hover:text-ink'
                          }`}
                          aria-label="Mauvaise réponse"
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <p className="text-xs text-muted">L'assistant réfléchit…</p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex gap-2 border-t-[1.5px] border-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={500}
              placeholder="Votre question…"
              className="flex-1 rounded-xl border-[1.5px] border-ink/30 bg-surface-2 px-3 py-2 text-sm outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex cursor-pointer items-center justify-center rounded-xl border-[1.5px] border-ink bg-violet px-3 text-white disabled:cursor-not-allowed disabled:bg-muted"
              aria-label="Envoyer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}