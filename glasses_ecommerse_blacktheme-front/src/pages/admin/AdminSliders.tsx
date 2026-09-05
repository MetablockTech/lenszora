import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X, ImageIcon, UploadCloud } from "lucide-react";
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
  order: number;
  isActive: boolean;
}

const AdminSliders = () => {
  const [slides, setSlides] = useState<Slider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Local state to hold the physical file before saving to server
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize with a default sliding structure to prevent undefined errors
  const defaultSlide: Partial<Slider> = { 
    bannerType: "Main Banner", 
    resourceType: "Custom", 
    image: "", 
    title: "",
    subtitle: "",
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
    try {
      setIsLoading(true);
      
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
         toast.error("Please provide a banner image");
         setIsLoading(false);
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
      toast.error(error.message || "Failed to save slider");
    } finally {
      setIsLoading(false);
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
    setEditingSlide({ ...defaultSlide, order: slides.length });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local blob URL for immediate preview without hitting server
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Banner Setup <span className="text-blue-600 text-lg font-normal">(Default)</span>
        </h1>
      </div>

      {/* Main Table Card */}
      <Card className="bg-[#111111] border-white/10 overflow-hidden shadow-xl rounded-xl">
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">Banner table</h2>
              <Badge variant="secondary" className="bg-white/10 text-white rounded-full px-3">{slides.length}</Badge>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] bg-black border-white/10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="main">Main Banner</SelectItem>
                  <SelectItem value="footer">Footer Banner</SelectItem>
                </SelectContent>
              </Select>
              
              <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700 text-white font-medium whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" /> Add Banner
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-black/40">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-semibold h-12">SL</TableHead>
                  <TableHead className="text-slate-400 font-semibold h-12">Image</TableHead>
                  <TableHead className="text-slate-400 font-semibold h-12">Banner Type</TableHead>
                  <TableHead className="text-slate-400 font-semibold h-12">Resource Type</TableHead>
                  <TableHead className="text-slate-400 font-semibold h-12">Published</TableHead>
                  <TableHead className="text-slate-400 font-semibold h-12 text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.length === 0 && !isLoading ? (
                  <TableRow className="border-white/5">
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No banners found
                    </TableCell>
                  </TableRow>
                ) : (
                  slides.map((slide, index) => (
                    <TableRow key={slide._id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium text-slate-300 py-4">{index + 1}</TableCell>
                      <TableCell className="py-4">
                        <div className="h-12 w-28 rounded-md bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center">
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
                      <TableCell className="text-slate-300 py-4 font-medium">{slide.bannerType}</TableCell>
                      <TableCell className="text-slate-300 py-4">{slide.resourceType}</TableCell>
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
                            className="h-8 w-8 rounded-md border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/50 transition-all"
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
                              className="h-8 w-8 rounded-md border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-all"
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
        <DialogContent className="max-w-4xl bg-[#111111] border border-white/10 p-0 text-slate-200">
          <div className="p-6 border-b border-white/10 flex items-center gap-2">
             <ImageIcon className="h-5 w-5 text-blue-400" />
             <DialogTitle className="text-xl font-bold text-white">Banner Setup <span className="text-blue-400 font-normal">(Default)</span></DialogTitle>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Dropdowns */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-slate-300 text-sm font-semibold">Banner type <span className="text-red-500">*</span></Label>
                  <Select 
                    value={editingSlide.bannerType} 
                    onValueChange={(val) => setEditingSlide(prev => ({ ...prev, bannerType: val }))}
                  >
                    <SelectTrigger className="w-full bg-black border-white/20 h-10">
                      <SelectValue placeholder="Select Banner Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/20">
                      <SelectItem value="Main Banner">Main Banner</SelectItem>
                      <SelectItem value="Footer Banner">Footer Banner</SelectItem>
                      <SelectItem value="Trending Banner">Trending Banner</SelectItem>
                      <SelectItem value="Brand Banner">Brand Banner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingSlide.bannerType !== "Footer Banner" && (
                  <>
                    <div className="space-y-3">
                      <Label className="text-slate-300 text-sm font-semibold">Resource type <span className="text-red-500">*</span></Label>
                      <Select 
                        value={editingSlide.resourceType} 
                        onValueChange={(val) => setEditingSlide(prev => ({ ...prev, resourceType: val }))}
                      >
                        <SelectTrigger className="w-full bg-black border-white/20 h-10">
                          <SelectValue placeholder="Select Resource Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/20">
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editingSlide.resourceType === "Custom" && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Label className="text-slate-300 text-sm font-semibold">Banner URL <span className="text-red-500">*</span></Label>
                        <Input 
                          placeholder="Enter url" 
                          className="bg-black border-white/20 h-10"
                          value={editingSlide.buttonLink || ""}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, buttonLink: e.target.value }))}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Right Column - Image Upload */}
              <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
                <div className="w-full text-center mb-4">
                  <h3 className="font-semibold text-slate-200">Banner image <span className="text-red-500">*</span></h3>
                  <p className="text-blue-400 text-sm">( Ratio 4:1 )</p>
                </div>

                <div className="w-full border-2 border-dashed border-white/20 hover:border-blue-500/50 bg-black/40 rounded-lg group cursor-pointer transition-colors pt-1">
                   <label className="flex flex-col items-center justify-center py-8 px-4 text-center cursor-pointer w-full h-full relative">
                     <input 
                       type="file" 
                       accept="image/*" 
                       className="hidden" 
                       onChange={handleImageUpload} 
                       disabled={isUploading}
                     />
                     <UploadCloud className="h-10 w-10 text-slate-500 group-hover:text-blue-400 transition-colors mb-4" />
                     <p className="text-sm font-medium text-slate-300 mb-1">
                        {isUploading ? "Uploading..." : "Click to upload"}
                     </p>
                     <p className="text-xs text-slate-500 mb-4 px-8 tracking-wide">Or drag and drop</p>
                   </label>
                   
                   {/* Preview if URL exists */}
                   {(previewUrl || editingSlide.image) && (
                     <div className="w-full p-2 bg-black/80 border-t border-white/10 rounded-b-lg flex justify-center">
                        <div className="h-16 w-64 rounded bg-white/5 flex-shrink-0 relative overflow-hidden">
                           <img 
                             src={(previewUrl || editingSlide.image).startsWith('blob:') || (previewUrl || editingSlide.image).startsWith('http') ? (previewUrl || editingSlide.image) : `${API_URL}${(previewUrl || editingSlide.image)}`} 
                             alt="preview" 
                             className="object-cover w-full h-full" 
                           />
                        </div>
                     </div>
                   )}
                </div>

                <div className="w-full text-center mt-6 space-y-2">
                  <p className="text-xs text-slate-500">Only .jpeg .png .jpg .gif .webp Allowed max size 2 mb</p>
                  <p className="text-xs text-slate-500 px-6 leading-relaxed">Banner Image ratio is not same for all sections in website. Please review the ratio before upload</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 pb-2">
              <Button 
                type="button" 
                variant="outline" 
                className="bg-white/5 border-white/10 hover:bg-white/10 text-slate-300"
                onClick={() => {
                   setEditingSlide(defaultSlide);
                   if (!editingSlide._id) setIsDialogOpen(false); // only close if we were adding, otherwise just reset form
                }}
              >
                Reset
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]">
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSliders;
