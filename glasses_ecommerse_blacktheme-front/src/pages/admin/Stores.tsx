import React, { useState, useEffect } from 'react'
import { stores as storesApi, getToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MapPin, Plus, Edit, Trash2, Search, Phone, Clock, Gift, Globe, ImageIcon, X } from 'lucide-react'
import { getImageUrl } from '@/lib/utils'
import { products } from '@/lib/api'
import { toast } from 'sonner'

const AdminStores = () => {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    hours: '10:00 AM - 9:00 PM',
    services: 'Free Eye Test, Free Repair',
    isActive: true,
    freeGift: false,
    image: '',
    latitude: '',
    longitude: ''
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const token = getToken()

  const handleGeocode = async () => {
    const address = `${formData.addressLine}, ${formData.city}, ${formData.state} ${formData.pincode}`;
    if (!formData.addressLine || !formData.city) {
      toast.error('Please enter Address and City first');
      return;
    }

    setIsGeocoding(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
      const data = await response.json();

      if (data.status === 'OK') {
        const { lat, lng } = data.results[0].geometry.location;
        setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }));
        toast.success('Location coordinates fetched successfully');
      } else {
        toast.error(`Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      toast.error('Failed to connect to Geocoding service');
    } finally {
      setIsGeocoding(false);
    }
  };

  const fetchStores = async () => {
    try {
      const data = await storesApi.list({ isActive: 'all' }) // Get all for admin
      setStores(data)
    } catch (error) {
      toast.error('Failed to fetch stores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      addressLine: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      hours: '10:00 AM - 9:00 PM',
      services: 'Free Eye Test, Free Repair',
      isActive: true,
      freeGift: false,
      image: '',
      latitude: '',
      longitude: ''
    })
    setEditingStore(null)
    setSelectedFile(null)
    setImagePreview(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    try {
      let finalImageUrl = formData.image

      // 1. Upload image if selected
      if (selectedFile) {
        const uploadRes = await products.uploadImage(selectedFile, 'stores', 'general', formData.name.replace(/\s+/g, '-'), token)
        finalImageUrl = uploadRes.url || uploadRes.path
      }

      const payload = {
        ...formData,
        images: finalImageUrl ? [finalImageUrl] : [],
        services: formData.services.split(',').map(s => s.trim()),
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude) || 0, parseFloat(formData.latitude) || 0]
        }
      }
      delete (payload as any).image // Cleanup local state field
      delete (payload as any).latitude
      delete (payload as any).longitude

      if (editingStore) {
        await storesApi.update(editingStore._id, payload, token)
        toast.success('Store updated successfully')
      } else {
        await storesApi.create(payload, token)
        toast.success('Store created successfully')
      }

      setIsDialogOpen(false)
      resetForm()
      fetchStores()
    } catch (error: any) {
      toast.error(error.message || 'Operation failed')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (store: any) => {
    setEditingStore(store)
    const storeImage = store.images?.[0] || ''
    setFormData({
      name: store.name,
      addressLine: store.addressLine,
      city: store.city,
      state: store.state,
      pincode: store.pincode,
      phone: store.phone,
      email: store.email || '',
      hours: store.hours,
      services: store.services.join(', '),
      isActive: store.isActive,
      freeGift: store.freeGift || false,
      image: storeImage,
      latitude: store.location?.coordinates?.[1]?.toString() || '',
      longitude: store.location?.coordinates?.[0]?.toString() || ''
    })
    setImagePreview(storeImage ? getImageUrl(storeImage) : null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return
    try {
      await storesApi.remove(id, token)
      toast.success('Store deleted')
      fetchStores()
    } catch (error) {
      toast.error('Failed to delete store')
    }
  }

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Store Management
          </h1>
          <p className="text-muted-foreground text-sm">Manage physical store locations and eye checkup centers</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Add New Store
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle>{editingStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Store Name*</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number*</Label>
                    <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="addressLine">Full Address*</Label>
                    <Input id="addressLine" name="addressLine" value={formData.addressLine} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City*</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State*</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode*</Label>
                    <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Operating Hours</Label>
                    <Input id="hours" name="hours" value={formData.hours} onChange={handleInputChange} />
                  </div>

                  <div className="col-span-2 p-4 border rounded-xl bg-primary/5 border-primary/20 relative group transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-primary font-bold flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Map Coordinates
                      </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleGeocode}
                        disabled={isGeocoding}
                        className="bg-background border-primary/30 text-primary hover:bg-primary/5"
                      >
                        {isGeocoding ? 'Locating...' : 'Auto-Locate from Address'}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude" className="text-[10px] uppercase text-muted-foreground">Latitude</Label>
                        <Input id="latitude" name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="e.g. 26.9124" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude" className="text-[10px] uppercase text-muted-foreground">Longitude</Label>
                        <Input id="longitude" name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="e.g. 75.7873" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Click "Auto-Locate" to find coordinates automatically based on the address above.</p>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="services">Services (comma separated)</Label>
                    <Input id="services" name="services" value={formData.services} onChange={handleInputChange} placeholder="Free Eye Test, Free Repair" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.isActive} onCheckedChange={(val) => setFormData({ ...formData, isActive: val })} />
                    <Label>Active Store</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.freeGift} onCheckedChange={(val) => setFormData({ ...formData, freeGift: val })} />
                    <Label className="text-primary font-bold">Free Gift Available</Label>
                  </div>
                </div>

                <div className="col-span-2 space-y-2 border-t pt-4">
                  <Label>Store Front Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-32 h-32 border-2 border-dashed border-border rounded-2xl overflow-hidden bg-secondary/20 flex items-center justify-center group">
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setSelectedFile(null); setImagePreview(null); setFormData({ ...formData, image: '' }) }}
                            className="absolute top-1 right-1 bg-white p-1 rounded-full shadow-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input type="file" accept="image/*" onChange={handleFileChange} />
                      <p className="text-[10px] text-muted-foreground">Recommended: 800x600px. Max size: 2MB.</p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8" disabled={uploading}>
                  {uploading ? 'Processing...' : (editingStore ? 'Update Store' : 'Create Store')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search stores by name or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/20"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/10">
                  <TableHead>Store Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground font-medium">Loading stores...</TableCell></TableRow>
                ) : filteredStores.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground font-medium">No stores found</TableCell></TableRow>
                ) : (
                  filteredStores.map((store) => (
                    <TableRow key={store._id} className="hover:bg-secondary/10 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden shrink-0">
                            {store.images?.[0] ? (
                              <img src={getImageUrl(store.images[0])} alt={store.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-5 h-5" /></div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-base">{store.name}</span>
                            <span className="text-xs text-muted-foreground mt-1 max-w-[200px] leading-relaxed truncate">{store.addressLine}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            {store.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-500" />
                          {store.hours}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className={`px-2 py-1 rounded-full text-[10px] font-bold text-center w-fit ${store.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                            }`}>
                            {store.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </div>
                          {store.freeGift && (
                            <div className="flex items-center gap-1 bg-primary/20 text-primary text-[10px] font-extrabold px-2 py-1 rounded-full w-fit">
                              <Gift className="w-3 h-3" />
                              FREE GIFT
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(store)} className="text-primary hover:bg-primary/10">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(store._id)} className="text-red-500 hover:bg-red-10/20">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminStores
