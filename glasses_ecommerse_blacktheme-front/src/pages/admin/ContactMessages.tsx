import { useEffect, useState } from 'react'
import { contactMessages, getToken } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Loader2, Mail, Phone, Trash2, Inbox } from 'lucide-react'

type Message = {
  _id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  status: 'new' | 'in_progress' | 'resolved'
  adminNotes?: string
  createdAt: string
}

const STATUS: Record<Message['status'], { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In progress', cls: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', cls: 'bg-green-100 text-green-700' },
}

// Messages customers send from the website's Contact Us page
export default function ContactMessagesPage() {
  const [list, setList] = useState<Message[]>([])
  const [unread, setUnread] = useState(0)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState<Message | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await contactMessages.list(getToken() || undefined, filter)
      setList(data.messages || [])
      setUnread(data.unread || 0)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [filter])

  async function openMessage(m: Message) {
    setOpen(m)
    setNotes(m.adminNotes || '')
    // Opening a new message marks it as being handled
    if (m.status === 'new') {
      try {
        const updated = await contactMessages.update(m._id, { status: 'in_progress' }, getToken() || undefined)
        setList((l) => l.map((x) => (x._id === m._id ? updated : x)))
        setOpen(updated)
        setUnread((u) => Math.max(0, u - 1))
      } catch { /* still readable */ }
    }
  }

  async function save(status?: Message['status']) {
    if (!open) return
    setSaving(true)
    try {
      const updated = await contactMessages.update(open._id, { adminNotes: notes, ...(status ? { status } : {}) }, getToken() || undefined)
      setList((l) => l.map((x) => (x._id === open._id ? updated : x)))
      setOpen(updated)
      toast({ title: 'Saved' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this message?')) return
    try {
      await contactMessages.remove(id, getToken() || undefined)
      setList((l) => l.filter((x) => x._id !== id))
      setOpen(null)
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contact Messages</h1>
          <p className="text-slate-500 mt-1">Queries sent from the website's Contact Us page{unread ? ` · ${unread} new` : ''}.</p>
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm">
          <option value="all">All messages</option>
          <option value="new">New</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-500"><Inbox className="h-10 w-10 mb-2" />No messages yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-3">From</th><th className="px-4 py-3">Subject / message</th><th className="px-4 py-3">Received</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((m) => (
                  <tr key={m._id} className={`cursor-pointer hover:bg-slate-50 ${m.status === 'new' ? 'font-semibold' : ''}`} onClick={() => openMessage(m)}>
                    <td className="px-4 py-3">
                      <div className="text-slate-900">{m.name}</div>
                      <div className="text-xs font-normal text-slate-500">{m.email}{m.phone ? ` · ${m.phone}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[340px]">
                      <div className="truncate text-slate-900">{m.subject || '(no subject)'}</div>
                      <div className="truncate text-xs font-normal text-slate-500">{m.message}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-normal text-slate-500 whitespace-nowrap">{new Date(m.createdAt).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><Badge className={`${STATUS[m.status].cls} border-none`}>{STATUS[m.status].label}</Badge></td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(m._id)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) setOpen(null) }}>
        <DialogContent className="max-w-lg bg-white text-slate-900 border-slate-200 max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{open.subject || 'Message'}</DialogTitle>
                <DialogDescription className="text-slate-500">From {open.name} · {new Date(open.createdAt).toLocaleString('en-IN')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-3">
                  <a href={`mailto:${open.email}?subject=${encodeURIComponent('Re: ' + (open.subject || 'Your message to LensZora'))}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"><Mail className="h-4 w-4" />{open.email}</a>
                  {open.phone && <a href={`tel:${open.phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"><Phone className="h-4 w-4" />{open.phone}</a>}
                </div>
                <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-slate-800">{open.message}</p>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Internal notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 p-2" placeholder="What was done / replied" />
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <Button variant="outline" className="text-red-600" onClick={() => remove(open._id)}><Trash2 className="mr-1.5 h-4 w-4" />Delete</Button>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled={saving} onClick={() => save()}>Save notes</Button>
                    {open.status !== 'resolved'
                      ? <Button disabled={saving} className="bg-green-600 hover:bg-green-700" onClick={() => save('resolved')}>Mark resolved</Button>
                      : <Button disabled={saving} variant="outline" onClick={() => save('in_progress')}>Reopen</Button>}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
