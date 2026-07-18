import React, { useEffect, useState } from 'react'
import { auth, products, getToken, setToken, clearToken } from '../lib/api'

type Product = {
  _id?: string
  title: string
  description?: string
  price: number
  images?: string[]
}

const Admin: React.FC = () => {
  const [token, setLocalToken] = useState<string | undefined>(() => getToken())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [productsList, setProductsList] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [editing, setEditing] = useState<Product | null>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    setLoading(true)
    try {
      const data = await products.list()
      setProductsList(data)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    try {
      const res = await auth.login(email, password)
      setToken(res.token)
      setLocalToken(res.token)
      setEmail('')
      setPassword('')
      await loadProducts()
    } catch (err: any) {
      alert(err.message || 'Login failed')
    }
  }

  function handleLogout() {
    clearToken()
    setLocalToken(undefined)
  }

  async function handleCreateOrUpdate(e: React.FormEvent) {
    e.preventDefault()
    try {
      let images: string[] = []
      if (file && token) {
        const upl = await products.uploadImage(file, token)
        if (upl?.path) images = [upl.path]
      }

      const payload: any = { title, price, description, images }
      if (editing && editing._id) {
        await products.update(editing._id, payload, token)
        setEditing(null)
      } else {
        await products.create(payload, token)
      }
      setTitle('')
      setPrice(0)
      setDescription('')
      setFile(null)
      await loadProducts()
    } catch (err: any) {
      alert(err.message || 'Save failed')
    }
  }

  function startEdit(p: Product) {
    setEditing(p)
    setTitle(p.title)
    setPrice(p.price)
    setDescription(p.description || '')
  }

  async function handleDelete(id?: string) {
    if (!id) return
    if (!confirm('Delete product?')) return
    try {
      await products.remove(id, token)
      await loadProducts()
    } catch (err: any) {
      alert(err.message || 'Delete failed')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin</h1>

      {!token ? (
        <form onSubmit={handleLogin} className="mb-6">
          <h2 className="font-semibold">Admin Login</h2>
          <div className="flex gap-2 mt-2">
            <input className="border p-2 flex-1" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="border p-2 flex-1" placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="bg-blue-600 text-white px-4" type="submit">Login</button>
          </div>
        </form>
      ) : (
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>Logged in as admin</div>
            <button className="text-sm text-red-600" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      )}

      <section className="mb-8">
        <h2 className="font-semibold mb-2">Create / Edit Product</h2>
        <form onSubmit={handleCreateOrUpdate} className="grid gap-2">
          <input className="border p-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input className="border p-2" placeholder="Price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required />
          <textarea className="border p-2" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-4 py-2" type="submit">{editing ? 'Update' : 'Create'}</button>
            {editing && <button type="button" className="px-4 py-2 border" onClick={() => { setEditing(null); setTitle(''); setPrice(0); setDescription('') }}>Cancel</button>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Products</h2>
        {loading ? <div>Loading...</div> : (
          <div className="grid gap-4">
            {productsList.map((p) => (
              <div key={(p as any)._id} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <div className="font-semibold">{p.title} — ${p.price}</div>
                  <div className="text-sm text-gray-600">{(p as any).description}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 border" onClick={() => startEdit(p)}>Edit</button>
                  <button className="px-3 py-1 text-red-600" onClick={() => handleDelete((p as any)._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Admin
