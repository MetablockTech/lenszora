export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

type LoginResponse = {
  token: string
  user: { id: string; email?: string; phone: string; role: string }
}

function getHeaders(token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export const auth = {
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    })
    if (!res.ok) throw new Error(await res.text())
    const data = (await res.json()) as LoginResponse
    return data
  },
  async sendOTP(phone: string) {
    const res = await fetch(`${API_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async verifyOTP(phone: string, otp: string) {
    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone, otp })
    })
    if (!res.ok) throw new Error(await res.text())
    const data = (await res.json()) as LoginResponse
    return data
  }
}

export const products = {
  async list(params?: {
    status?: string;
    isBestSeller?: boolean;
    isFeatured?: boolean;
    sort?: string;
    limit?: number;
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    gender?: string;
    frameType?: string;
    frameShape?: string;
    frameMaterial?: string;
    weightGroup?: string;
    faceShape?: string;
    vendorId?: string;
    isBulk?: string;
    search?: string;
  }) {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.isBestSeller) query.append('isBestSeller', 'true')
    if (params?.isFeatured) query.append('isFeatured', 'true')
    if (params?.isBulk) query.append('isBulk', params.isBulk)
    if (params?.sort) query.append('sort', params.sort)
    if (params?.limit) query.append('limit', params.limit.toString())
    if (params?.category) query.append('category', params.category)
    if (params?.brand) query.append('brand', params.brand)
    if (params?.minPrice !== undefined) query.append('minPrice', params.minPrice.toString())
    if (params?.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString())
    if (params?.gender) query.append('gender', params.gender)
    if (params?.frameType) query.append('frameType', params.frameType)
    if (params?.frameShape) query.append('frameShape', params.frameShape)
    if (params?.frameMaterial) query.append('frameMaterial', params.frameMaterial)
    if (params?.weightGroup) query.append('weightGroup', params.weightGroup)
    if (params?.faceShape) query.append('faceShape', params.faceShape)
    if (params?.vendorId) query.append('vendorId', params.vendorId)
    if (params?.search) query.append('search', params.search)

    const res = await fetch(`${API_URL}/api/products${query.toString() ? `?${query.toString()}` : ''}`)
    if (!res.ok) throw new Error('Failed to fetch products')
    return res.json()
  },
  async stats(token: string) {
    const res = await fetch(`${API_URL}/api/products/stats/counts`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch product stats')
    return res.json()
  },
  async updateStatus(id: string, status: string, token: string, rejectionReason?: string) {
    const res = await fetch(`${API_URL}/api/products/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status, rejectionReason })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async get(id: string) {
    const res = await fetch(`${API_URL}/api/products/${id}`)
    if (!res.ok) throw new Error('Failed to fetch product')
    return res.json()
  },
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async update(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async remove(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async vendorList(token?: string, status?: string) {
    const query = status ? `?status=${status}` : ''
    const res = await fetch(`${API_URL}/api/products/vendor/me${query}`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async uploadImage(file: File, folder: string, subfolder?: string, filename?: string, token?: string) {
    const fd = new FormData()
    fd.append('folder', folder)
    if (subfolder) fd.append('subfolder', subfolder)
    if (filename) fd.append('filename', filename)
    // Append file last so Multer can read the folder fields first
    fd.append('file', file)

    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async deleteFile(filePath: string, token: string) {
    const res = await fetch(`${API_URL}/api/upload/file`, {
      method: 'DELETE',
      headers: getHeaders(token),
      body: JSON.stringify({ filePath })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const gallery = {
  async list(token: string) {
    const res = await fetch(`${API_URL}/api/upload/gallery`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch gallery')
    return res.json()
  }
}

export const categories = {
  async list() {
    const res = await fetch(`${API_URL}/api/categories`)
    if (!res.ok) throw new Error('Failed to fetch categories')
    return res.json()
  },
  async getHierarchy() {
    const res = await fetch(`${API_URL}/api/categories/hierarchy`)
    if (!res.ok) throw new Error('Failed to fetch hierarchy')
    return res.json()
  },
  async getByLevel(level: 'main' | 'sub' | 'subsub') {
    const res = await fetch(`${API_URL}/api/categories/by-level/${level}`)
    if (!res.ok) throw new Error('Failed to fetch categories by level')
    return res.json()
  },
  async getMain() {
    const res = await fetch(`${API_URL}/api/categories/main`)
    if (!res.ok) throw new Error('Failed to fetch main categories')
    return res.json()
  },
  async getByParent(parentId: string) {
    const res = await fetch(`${API_URL}/api/categories/parent/${parentId}`)
    if (!res.ok) throw new Error('Failed to fetch subcategories')
    return res.json()
  },
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/categories`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async update(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async remove(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const brands = {
  async list() {
    const res = await fetch(`${API_URL}/api/brands`)
    if (!res.ok) throw new Error('Failed to fetch brands')
    return res.json()
  },
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/brands`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async update(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async remove(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/brands/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}



export const orders = {
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async verifyPayment(payload: any) {
    const res = await fetch(`${API_URL}/api/orders/verify-payment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async listUserOrders(userId: string, token?: string) {
    const res = await fetch(`${API_URL}/api/orders/user/${userId}`, {
      method: 'GET',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async getOrder(orderId: string, token?: string) {
    const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
      method: 'GET',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async getAll(token?: string) {
    const res = await fetch(`${API_URL}/api/orders/admin/all`, {
      method: 'GET',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async updateStatus(id: string, status: string, note?: string, token?: string) {
    const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status, note })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async verifyManualPayment(id: string, action: 'approve' | 'reject', note?: string, token?: string) {
    const res = await fetch(`${API_URL}/api/orders/${id}/verify-manual-payment`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ action, note })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async uploadProof(file: File, token?: string) {
    const fd = new FormData()
    fd.append('folder', 'proofs')
    fd.append('file', file)
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const settings = {
  async list(category?: string) {
    const query = category ? `?category=${category}` : ''
    const res = await fetch(`${API_URL}/api/settings${query}`)
    if (!res.ok) throw new Error('Failed to fetch settings')
    return res.json()
  },
  async get(key: string) {
    const res = await fetch(`${API_URL}/api/settings/${key}`)
    if (!res.ok) throw new Error('Failed to fetch setting')
    return res.json()
  },
  async update(key: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/settings/${key}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async uploadLogo(file: File, token?: string) {
    const formData = new FormData()
    formData.append('folder', 'settings')
    formData.append('file', file)
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: formData
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const adminAuth = {
  async changePassword(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const wishlist = {
  async get(token?: string) {
    const res = await fetch(`${API_URL}/api/wishlist`, {
      method: 'GET',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async toggle(productId: string, token?: string) {
    const res = await fetch(`${API_URL}/api/wishlist/toggle`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ productId })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const reviews = {
  async getByProduct(productId: string) {
    const res = await fetch(`${API_URL}/api/reviews/product/${productId}`)
    if (!res.ok) throw new Error('Failed to fetch reviews')
    return res.json()
  },
  async submit(payload: { productId: string; rating: number; title: string; comment: string }, token?: string) {
    const res = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const vendors = {
  async list(token?: string, status?: string) {
    const query = status ? `?status=${status}` : ''
    const res = await fetch(`${API_URL}/api/vendors${query}`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch vendors')
    return res.json()
  },
  async register(payload: any) {
    const res = await fetch(`${API_URL}/api/vendors/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async updateStatus(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/vendors/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async getOrders(token?: string, status?: string) {
    const query = status ? `?status=${status}` : ''
    const res = await fetch(`${API_URL}/api/vendors/orders/me${query}`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch vendor orders')
    return res.json()
  },
  async updateOrderStatus(orderId: string, status: string, note?: string, token?: string, otp?: string) {
    const res = await fetch(`${API_URL}/api/vendors/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify({ status, note, otp })
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Update failed' }))
      throw { response: { data: errorData } }
    }
    return res.json()
  },
  async getProfile(token?: string) {
    const res = await fetch(`${API_URL}/api/vendors/profile/me`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch vendor profile')
    return res.json()
  },
  async updateProfile(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/vendors/profile/me`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const payouts = {
  async list(token?: string, params?: { status?: string; vendorId?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.vendorId) query.append('vendorId', params.vendorId)
    const res = await fetch(`${API_URL}/api/payouts?${query}`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch payouts')
    return res.json()
  },
  async updateStatus(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/payouts/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async listVendor(token?: string, params?: { status?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    const res = await fetch(`${API_URL}/api/payouts/vendor/me?${query}`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch vendor payouts')
    return res.json()
  },
  async requestWithdrawal(amount: number, paymentMethod?: string, token?: string) {
    const res = await fetch(`${API_URL}/api/payouts/request`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ amount, paymentMethod })
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(errorData.message || 'Withdrawal request failed')
    }
    return res.json()
  }
}

export const users = {
  async getAll(token?: string) {
    const res = await fetch(`${API_URL}/api/users`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch users')
    return res.json()
  },
  async updateRole(id: string, role: string, token?: string) {
    const res = await fetch(`${API_URL}/api/users/${id}/role`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ role })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async delete(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const inquiries = {
  async create(payload: { productId: string; quantity: number; message: string; userId: string }, token?: string) {
    const res = await fetch(`${API_URL}/api/inquiries`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async listAdmin(token?: string) {
    const res = await fetch(`${API_URL}/api/inquiries/admin`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async updateStatus(id: string, status: string, token?: string) {
    const res = await fetch(`${API_URL}/api/inquiries/admin/${id}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export function getToken() {
  return localStorage.getItem('token') || undefined
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function setUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user))
}

export function getUser() {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : undefined
}

export const pincodes = {
  async check(pincode: string) {
    const res = await fetch(`${API_URL}/api/pincodes/check/${pincode}`)
    if (!res.ok) throw new Error('Failed to check pincode')
    return res.json()
  },
  async list(token?: string, params?: { search?: string; serviceable?: boolean }) {
    const query = new URLSearchParams()
    if (params?.search) query.append('search', params.search)
    if (params?.serviceable !== undefined) query.append('serviceable', String(params.serviceable))

    const res = await fetch(`${API_URL}/api/pincodes?${query}`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch pincodes')
    return res.json()
  },
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/pincodes`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async update(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/pincodes/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async remove(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/pincodes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async bulkUpload(pincodes: any[], token?: string) {
    const res = await fetch(`${API_URL}/api/pincodes/bulk`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ pincodes })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const addresses = {
  async list(token?: string) {
    const res = await fetch(`${API_URL}/api/addresses`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch addresses')
    return res.json()
  },
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/addresses`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async update(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/addresses/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async remove(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/addresses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async setDefault(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/addresses/${id}/default`, {
      method: 'PATCH',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const returnRequests = {
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/return-requests`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async getMyRequests(token?: string) {
    const res = await fetch(`${API_URL}/api/return-requests`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch requests')
    return res.json()
  },
  async getAll(token?: string, params?: { status?: string; type?: string }) {
    const query = new URLSearchParams()
    if (params?.status) query.append('status', params.status)
    if (params?.type) query.append('type', params.type)

    const res = await fetch(`${API_URL}/api/return-requests/admin/all?${query}`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch requests')
    return res.json()
  },
  async updateStatus(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/return-requests/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async uploadProof(file: File, token?: string) {
    const fd = new FormData()
    fd.append('folder', 'returns')
    fd.append('file', file)
    const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const eyewearAttributes = {
  async list() {
    const res = await fetch(`${API_URL}/api/eyewear-attributes`)
    if (!res.ok) throw new Error('Failed to fetch eyewear attributes')
    return res.json()
  },
  async getByType(type: string) {
    const res = await fetch(`${API_URL}/api/eyewear-attributes/type/${type}`)
    if (!res.ok) throw new Error('Failed to fetch eyewear attributes by type')
    return res.json()
  },
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/eyewear-attributes`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async update(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/eyewear-attributes/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async remove(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/eyewear-attributes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const lens = {
  async getPublic(vendorId?: string) {
    const query = vendorId ? `?vendorId=${vendorId}` : ''
    const res = await fetch(`${API_URL}/api/lens/public${query}`)
    if (!res.ok) throw new Error('Failed to fetch lens data')
    return res.json()
  },
  // Admin Endpoints
  async listAdminTypes(token?: string) {
    const res = await fetch(`${API_URL}/api/lens/admin/types`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch lens types')
    return res.json()
  },
  async listAdminPackages(token?: string) {
    const res = await fetch(`${API_URL}/api/lens/admin/packages`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch lens packages')
    return res.json()
  },
  // Vendor Endpoints
  async listVendorTypes(token?: string) {
    const res = await fetch(`${API_URL}/api/lens/vendor/types`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch lens types')
    return res.json()
  },
  async createVendorType(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/vendor/types`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async updateVendorType(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/vendor/types/${id}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async listVendorPackages(token?: string) {
    const res = await fetch(`${API_URL}/api/lens/vendor/packages`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch lens packages')
    return res.json()
  },
  async createVendorPackage(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/vendor/packages`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async updateVendorPackage(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/vendor/packages/${id}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  // Legacy/Compatibility (Proxies to admin for now)
  async listTypes(token?: string) { return this.listAdminTypes(token) },
  async createType(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/types`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    return res.json()
  },
  async updateType(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/types/${id}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    return res.json()
  },
  async listPackages(token?: string) { return this.listAdminPackages(token) },
  async createPackage(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/packages`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    return res.json()
  },
  async updatePackage(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/packages/${id}`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    return res.json()
  },
  async deleteType(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/types/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async deletePackage(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/lens/packages/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const sliders = {
  async list() {
    const res = await fetch(`${API_URL}/api/sliders`)
    if (!res.ok) throw new Error('Failed to fetch sliders')
    return res.json() as Promise<any[]>
  },
  async listAdmin(token: string) {
    const res = await fetch(`${API_URL}/api/sliders/admin/all`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error('Failed to fetch admin sliders')
    return res.json() as Promise<any[]>
  },
  async create(payload: any, token: string) {
    const res = await fetch(`${API_URL}/api/sliders`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async update(id: string, payload: any, token: string) {
    const res = await fetch(`${API_URL}/api/sliders/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async remove(id: string, token: string) {
    const res = await fetch(`${API_URL}/api/sliders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const stores = {
  async list(params?: { city?: string; state?: string; pincode?: string; isActive?: boolean | 'all'; vendorId?: string }) {
    const query = new URLSearchParams()
    if (params?.city) query.append('city', params.city)
    if (params?.state) query.append('state', params.state)
    if (params?.pincode) query.append('pincode', params.pincode)
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive))
    if (params?.vendorId) query.append('vendorId', params.vendorId)

    const res = await fetch(`${API_URL}/api/stores?${query.toString()}`)
    if (!res.ok) throw new Error('Failed to fetch stores')
    return res.json()
  },
  async get(id: string) {
    const res = await fetch(`${API_URL}/api/stores/${id}`)
    if (!res.ok) throw new Error('Failed to fetch store')
    return res.json()
  },
  async create(payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/stores`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async update(id: string, payload: any, token?: string) {
    const res = await fetch(`${API_URL}/api/stores/${id}`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async remove(id: string, token?: string) {
    const res = await fetch(`${API_URL}/api/stores/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}

export const appointments = {
  async create(payload: { storeId: string; customerName: string; customerPhone: string; appointmentDate: string; timeSlot: string; reason?: string }) {
    const res = await fetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async list(params?: { storeId?: string, vendorId?: string, date?: string }, token?: string) {
    const query = new URLSearchParams()
    if (params?.storeId) query.append('storeId', params.storeId)
    if (params?.vendorId) query.append('vendorId', params.vendorId)
    if (params?.date) query.append('date', params.date)

    const res = await fetch(`${API_URL}/api/appointments?${query.toString()}`, {
      headers: getHeaders(token)
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  },
  async updateStatus(id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled', token?: string) {
    const res = await fetch(`${API_URL}/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify({ status })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }
}
