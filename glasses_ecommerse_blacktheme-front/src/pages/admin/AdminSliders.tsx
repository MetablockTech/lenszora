import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, ImageIcon, UploadCloud, Sparkles } from "lucide-react";
import { sliders, products, getToken, API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Where each banner type appears on the site and the image size that fits it
const BANNER_TYPES = [
  { value: 'Main Banner', label: 'Main Banner', hint: 'Large slider at the top of the homepage', ratio: '4:1', size: '1920 × 480 px', aspect: 'aspect-[4/1]', usesText: true, note: 'Text is shown on top of the image, so keep the left side of the photo simple.' },
  { value: 'Hero Sub Banner', label: 'Hero Sub Banner', hint: 'Smaller banners right below the main banner', ratio: '4:1', size: '1600 × 400 px', aspect: 'aspect-[4/1]', usesText: false, note: 'Shown as a short strip: 4:1 on desktop, 3:1 on phones (a little is trimmed from the sides). Keep text and products in the centre of the image.' },
  { value: 'Footer Banner', label: 'Footer Banner', hint: 'Wide offer banner on the homepage', ratio: '4:1', size: '1920 × 480 px', aspect: 'aspect-[4/1]', usesText: true, note: 'Shown as a wide strip; if no image is set a text card is used instead.' },
  { value: 'Footer Sub Banner', label: 'Footer Sub Banner', hint: 'Banners just above the footer on the homepage', ratio: '4:1', size: '1600 × 400 px', aspect: 'aspect-[4/1]', usesText: false, note: 'Shown as a short strip: 4:1 on desktop, 3:1 on phones (a little is trimmed from the sides). Keep text and products in the centre of the image.' },
  { value: 'Trending Banner', label: 'Trending Banner', hint: '"#Trending at LensZora" section on the homepage', ratio: '4:1', size: '1920 × 480 px', aspect: 'aspect-[4/1]', usesText: true, note: 'Shown in the trending section; keep important content in the centre.' },
  { value: 'Brand Banner', label: 'Brand Banner', hint: 'Brand slider on the homepage', ratio: '4:1', size: '1920 × 480 px', aspect: 'aspect-[4/1]', usesText: true, note: 'Shown in the brand slider; keep the brand logo clearly visible.' },
  { value: 'Popup Banner', label: 'Popup Banner (Advertisement)', hint: 'Popup shown on the chosen page after a short delay', ratio: '1:1', size: '1080 × 1080 px', aspect: 'aspect-square', usesText: true, note: 'Opens as a popup; a square image works best on phones.' },
]

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

interface Slider {
  _id: string;
  title?: string;
  subtitle?: string;
  image: string;
  bannerType: string;
  resourceType: string;
  resourceId?: string;
  buttonText?: string;
  buttonLink?: string;
  targetPage?: string;
  delaySeconds?: number;
  order: number;
  isActive: boolean;
}

const AdminSliders = () => {
  const [slides, setSlides] = useState<Slider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  
  // Local state to hold the physical file before saving to server
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize with a default sliding structure to prevent undefined errors
  const defaultSlide: Partial<Slider> = { 
    bannerType: "Main Banner", 
    resourceType: "Custom", 
    image: "", 
    title: "",
    subtitle: "",
    buttonText: "SHOP NOW",
    buttonLink: "/shop",
    targetPage: "/",
    delaySeconds: 1,
    isActive: true,
    order: 0
  };
  const [editingSlide, setEditingSlide] = useState<Partial<Slider>>(defaultSlide);
  
  const token = getToken();

  const fetchSlides = async () => {
    try {
      if (!token) return;
      const data = await sliders.listAdmin(token);
      setSlides(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch sliders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, [token]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    if (isSaving) return;
    try {
      setIsSaving(true);

      let finalImageUrl = editingSlide.image;

      // Only hit the server to upload the image when they actually click Save
      if (selectedFile) {
        setIsUploading(true);
        const res = await products.uploadImage(selectedFile, 'banners', undefined, undefined, token);
        if (res && res.url) {
          finalImageUrl = res.url;
        }
        setIsUploading(false);
      }

      if (!finalImageUrl) {
         toast.error("Please add a banner image");
         return;
      }
      
      const payload = { ...editingSlide, image: finalImageUrl };

      if (editingSlide._id) {
        await sliders.update(editingSlide._id, payload, token);
        toast.success("Slider updated successfully");
      } else {
        await sliders.create(payload, token);
        toast.success("Slider added successfully");
      }
      setIsDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchSlides();
    } catch (error: any) {
      let message = error?.message || "Failed to save banner";
      try {
        const parsed = JSON.parse(message);
        message = parsed.message || parsed.error || message;
      } catch {
        // plain text
      }
      toast.error(message);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, confirmed?: boolean) => {
    if (!token) return;
    
    if (!confirmed) {
      setDeleteConfirmId(id);
      return;
    }

    try {
      await sliders.remove(id, token);
      toast.success("Slider deleted successfully");
      setDeleteConfirmId(null);
      fetchSlides();
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
      setDeleteConfirmId(null);
    }
  };

  const handleToggleActive = async (slide: Slider, newStatus: boolean) => {
    if (!token) return;
    try {
      await sliders.update(slide._id, { isActive: newStatus }, token);
      toast.success("Status updated");
      fetchSlides();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleAddNew = () => {
    setEditingSlide(defaultSlide);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDialogOpen(true);
  };

  const handleAddNewPopup = () => {
    setEditingSlide({
      bannerType: "Popup Banner",
      resourceType: "Custom",
      image: "",
      title: "",
      subtitle: "",
      buttonText: "SHOP NOW",
      buttonLink: "/shop",
      targetPage: "/",
      delaySeconds: 1,
      isActive: true,
      order: 0
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDialogOpen(true);
  };

  // Validate and keep the file locally; it is uploaded when the banner is saved
  const acceptFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please choose an image file (JPG, PNG, WEBP or GIF)");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(`Image is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max allowed is 5 MB.`);
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) acceptFile(file);
  };

  const typeInfo = BANNER_TYPES.find((t) => t.value === editingSlide.bannerType) || BANNER_TYPES[0];
  const rawImage = previewUrl || editingSlide.image || "";
  const currentImageSrc = !rawImage ? "" : rawImage.startsWith('blob:') || rawImage.startsWith('http') ? rawImage : `${API_URL}${rawImage}`;

  const filteredSlides = slides.filter(s => {
    if (filterType === 'main') return s.bannerType === 'Main Banner';
    if (filterType === 'footer') return s.bannerType === 'Footer Banner';
    if (filterType === 'trending') return s.bannerType === 'Trending Banner';
    if (filterType === 'popup') return s.bannerType === 'Popup Banner';
    if (filterType === 'hero-sub') return s.bannerType === 'Hero Sub Banner';
    if (filterType === 'footer-sub') return s.bannerType === 'Footer Sub Banner';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Banner Setup <span className="text-blue-600 text-lg font-normal">(Default)</span>
        </h1>
      </div>

      {/* Main Table Card */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-xl rounded-xl">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Banner table</h2>
              <Badge variant="secondary" className="bg-slate-50 text-slate-900 rounded-full px-3">{filteredSlides.length}</Badge>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px] bg-white border-slate-200">
                  <SelectValue placeholder="All Banners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banners</SelectItem>
                  <SelectItem value="main">Main Banner</SelectItem>
                  <SelectItem value="footer">Footer Banner</SelectItem>
                  <SelectItem value="trending">Trending Banner</SelectItem>
                  <SelectItem value="popup">Popup Banner (Advertisement)</SelectItem>
                  <SelectItem value="hero-sub">Hero Sub Banner</SelectItem>
                  <SelectItem value="footer-sub">Footer Sub Banner</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleAddNewPopup} className="bg-amber-600 hover:bg-amber-700 text-white font-medium whitespace-nowrap shadow-sm shadow-amber-900/40">
                <Sparkles className="mr-2 h-4 w-4" /> + Create Ad Popup
              </Button>
              <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white font-medium whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" /> Add Banner
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white">
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-semibold h-12">SL</TableHead>
                  <TableHead className="text-slate-500 font-semibold h-12">Image</TableHead>
                  <TableHead className="text-slate-500 font-semibold h-12">Banner Type</TableHead>
                  <TableHead className="text-slate-500 font-semibold h-12">Occurs On / Target</TableHead>
                  <TableHead className="text-slate-500 font-semibold h-12">Redirect Link</TableHead>
                  <TableHead className="text-slate-500 font-semibold h-12">Status</TableHead>
                  <TableHead className="text-slate-500 font-semibold h-12 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSlides.length === 0 && !isLoading ? (
                  <TableRow className="border-slate-200">
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No banners found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSlides.map((slide, index) => (
                    <TableRow key={slide._id} className="border-slate-200 hover:bg-slate-100 transition-colors">
                      <TableCell className="font-medium text-slate-600 py-4">{index + 1}</TableCell>
                      <TableCell className="py-4">
                        <div className="h-12 w-28 rounded-md bg-slate-50 overflow-hidden border border-slate-200 flex items-center justify-center">
                          {slide.image ? (
                            <img 
                              src={slide.image.startsWith('http') ? slide.image : `${API_URL}${slide.image}`} 
                              alt="Banner" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 py-4 font-medium">
                        <Badge variant="outline" className={slide.bannerType === 'Popup Banner' ? 'border-amber-500/50 text-amber-600 bg-amber-500/10' : 'border-slate-200 text-slate-600'}>
                          {slide.bannerType === 'Popup Banner' ? '🔥 Ad Popup' : slide.bannerType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 py-4">
                        {slide.bannerType === 'Popup Banner' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 border border-amber-500/30 text-xs font-semibold">
                            🎯 {slide.targetPage === '/' ? 'Home Page (/)' : slide.targetPage === '*' ? 'All Pages (*)' : slide.targetPage || 'Home Page (/)'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">{slide.resourceType || 'Custom'}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600 py-4 text-xs font-mono max-w-[150px] truncate" title={slide.buttonLink}>
                        {slide.buttonLink || '/shop'}
                      </TableCell>
                      <TableCell className="py-4">
                        <Switch 
                          checked={slide.isActive} 
                          onCheckedChange={(checked) => handleToggleActive(slide, checked)}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center gap-2">
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="h-8 w-8 rounded-md border-blue-500/30 text-blue-600 hover:bg-blue-500/10 hover:text-blue-700 hover:border-blue-500/50 transition-all"
                            onClick={() => {
                              setEditingSlide(slide);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {deleteConfirmId === slide._id ? (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-8 px-2 rounded-md hover:bg-red-600 transition-all"
                              onClick={() => handleDelete(slide._id, true)}
                            >
                              Sure?
                            </Button>
                          ) : (
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-8 w-8 rounded-md border-red-500/30 text-red-600 hover:bg-red-500/10 hover:text-red-700 hover:border-red-500/50 transition-all"
                              onClick={() => handleDelete(slide._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingSlide(defaultSlide);
          setSelectedFile(null);
          setPreviewUrl(null);
        }
      }}>
        {/* Add/Edit Dialog Form */}
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] max-h-[92vh] p-0 gap-0 flex flex-col overflow-hidden bg-white border border-slate-200 text-slate-700">
          <div className="shrink-0 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold text-slate-900">{editingSlide._id ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
              <p className="text-xs text-slate-500 truncate">{typeInfo.hint}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6">
                {/* Left: settings */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-sm font-semibold">Banner type <span className="text-red-500">*</span></Label>
                    <Select
                      value={editingSlide.bannerType}
                      onValueChange={(val) => setEditingSlide(prev => ({ ...prev, bannerType: val }))}
                    >
                      <SelectTrigger className="w-full bg-white border-slate-200 h-10">
                        <SelectValue placeholder="Select Banner Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-200">
                        {BANNER_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Advertisement Popup Target Page & Settings */}
                  {editingSlide.bannerType === 'Popup Banner' && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                      <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                        <Sparkles className="w-4 h-4" />
                        <span>Ad Popup Trigger & Target Page</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-900 text-xs font-bold uppercase tracking-wider">
                          Occurs On Page <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '🏠 Home Page (/)', value: '/' },
                            { label: '🛍️ Shop (/shop)', value: '/shop' },
                            { label: '👓 Products (/product)', value: '/product' },
                            { label: '🛒 Checkout (/checkout)', value: '/checkout' },
                            { label: '🌐 All Pages (*)', value: '*' },
                          ].map(item => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => setEditingSlide(prev => ({ ...prev, targetPage: item.value }))}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                editingSlide.targetPage === item.value
                                  ? 'bg-amber-500 text-black shadow-sm font-bold'
                                  : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-500/40'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                        <Input
                          placeholder="e.g. / or /shop or /brands or *"
                          className="bg-white border-slate-200 h-9 text-xs font-mono"
                          value={editingSlide.targetPage || "/"}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, targetPage: e.target.value }))}
                        />
                        <p className="text-[11px] text-slate-500">
                          Popup will trigger when customer lands on this page route (<code>/</code> Home, <code>/shop</code> Shop, <code>*</code> all pages).
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-900 text-xs font-semibold">Popup Delay (Seconds before opening)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          step="0.5"
                          className="bg-white border-slate-200 h-9 text-xs"
                          value={editingSlide.delaySeconds ?? 1}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, delaySeconds: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-sm font-semibold">
                      {editingSlide.bannerType === 'Popup Banner' ? 'Popup click link' : 'Banner click link'}
                    </Label>
                    <Input
                      placeholder="e.g. /shop?category=sunglasses, /sale, /store-locator"
                      className="bg-white border-slate-200 h-10"
                      value={editingSlide.buttonLink || ""}
                      onChange={(e) => setEditingSlide(prev => ({ ...prev, buttonLink: e.target.value }))}
                    />
                    <p className="text-[11px] text-slate-500">Where customers go when they click the banner.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-700 text-sm font-semibold">
                      {typeInfo.usesText ? 'Title / Headline' : 'Title'} <span className="font-normal text-slate-400">(optional)</span>
                    </Label>
                    <Input
                      placeholder={typeInfo.usesText ? "e.g. FLAT 20% OFF ON ALL GLASSES" : "Used as image description for accessibility"}
                      className="bg-white border-slate-200 h-10"
                      value={editingSlide.title || ""}
                      onChange={(e) => setEditingSlide(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  {typeInfo.usesText && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 text-sm font-semibold">Subtitle / Offer description <span className="font-normal text-slate-400">(optional)</span></Label>
                        <Input
                          placeholder="e.g. Use code LENSEZORA20 at checkout"
                          className="bg-white border-slate-200 h-10"
                          value={editingSlide.subtitle || ""}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, subtitle: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700 text-sm font-semibold">Button label <span className="font-normal text-slate-400">(optional)</span></Label>
                        <Input
                          placeholder="e.g. SHOP NOW or CLAIM OFFER"
                          className="bg-white border-slate-200 h-10"
                          value={editingSlide.buttonText || ""}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, buttonText: e.target.value }))}
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-slate-700 text-sm font-semibold">Display order</Label>
                      <Input
                        type="number"
                        min={0}
                        className="bg-white border-slate-200 h-10"
                        value={editingSlide.order ?? 0}
                        onChange={(e) => setEditingSlide(prev => ({ ...prev, order: parseInt(e.target.value, 10) || 0 }))}
                      />
                      <p className="text-[11px] text-slate-500">Lower shows first.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-700 text-sm font-semibold">Status</Label>
                      <label className="flex h-10 items-center gap-2.5 rounded-md border border-slate-200 px-3 cursor-pointer">
                        <Switch
                          checked={editingSlide.isActive !== false}
                          onCheckedChange={(checked) => setEditingSlide(prev => ({ ...prev, isActive: checked }))}
                        />
                        <span className="text-sm text-slate-700">{editingSlide.isActive !== false ? 'Active' : 'Hidden'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right: image */}
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label className="text-slate-700 text-sm font-semibold">Banner image <span className="text-red-500">*</span></Label>
                    <span className="text-xs font-semibold text-blue-600">Ratio {typeInfo.ratio} · {typeInfo.size}</span>
                  </div>

                  {currentImageSrc ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <div className={`relative w-full ${typeInfo.aspect} overflow-hidden rounded-lg bg-slate-100`}>
                        <img src={currentImageSrc} alt="Banner preview" className="absolute inset-0 h-full w-full object-contain" />
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 px-1">
                        <p className="min-w-0 truncate text-xs text-slate-500">{selectedFile ? selectedFile.name : 'Current image'}</p>
                        <div className="flex shrink-0 gap-2">
                          <label className="cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            Change
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                          </label>
                          <button
                            type="button"
                            onClick={() => { setSelectedFile(null); setPreviewUrl(null); setEditingSlide(prev => ({ ...prev, image: "" })); }}
                            className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) acceptFile(file);
                      }}
                      className={`flex ${typeInfo.aspect} min-h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400'}`}
                    >
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                      <UploadCloud className={`h-9 w-9 mb-2 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
                      <p className="text-sm font-semibold text-slate-700">{isDragging ? 'Drop image here' : 'Click to upload or drag & drop'}</p>
                      <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP or GIF · max 5 MB</p>
                    </label>
                  )}

                  <p className="text-[11px] leading-relaxed text-slate-500">{typeInfo.note}</p>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3">
              <Button
                type="button"
                variant="outline"
                className="bg-white border-slate-200 hover:bg-slate-100 text-slate-700"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[130px]">
                {isUploading ? 'Uploading image…' : isSaving ? 'Saving…' : editingSlide._id ? 'Save Changes' : 'Save Banner'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSliders;
