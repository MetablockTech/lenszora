import React, { useState, useEffect } from "react";
import { Save, UploadCloud, RotateCcw, Link as LinkIcon, Sparkles, Tag, Eye, ArrowUpRight, Check } from "lucide-react";
import { settings, products, getToken, API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export interface NavItem {
  id: string;
  label: string;
  badge?: string | null;
  href: string;
  image: string;
}

export interface NavGroup {
  id: string;
  title: string;
  viewAllHref: string;
  pillBadge?: string | null;
  items: NavItem[];
}

export const DEFAULT_HOMEPAGE_NAV: NavGroup[] = [
  {
    id: "eyeglasses",
    title: "Eyeglasses",
    viewAllHref: "/shop?category=eyeglasses",
    pillBadge: "with Power",
    items: [
      {
        id: "eyeglasses-men",
        label: "Men",
        href: "/shop?category=eyeglasses&gender=men",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "eyeglasses-women",
        label: "Women",
        href: "/shop?category=eyeglasses&gender=women",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "eyeglasses-kids",
        label: "Kids",
        href: "/shop?category=eyeglasses&gender=kids",
        image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "eyeglasses-sale",
        label: "On Sale",
        badge: "Starts @₹500",
        href: "/shop?category=eyeglasses&sale=true",
        image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    id: "sunglasses",
    title: "Sunglasses",
    viewAllHref: "/shop?category=sunglasses",
    pillBadge: null,
    items: [
      {
        id: "sunglasses-men",
        label: "Men",
        href: "/shop?category=sunglasses&gender=men",
        image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "sunglasses-women",
        label: "Women",
        href: "/shop?category=sunglasses&gender=women",
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "sunglasses-kids",
        label: "Kids",
        href: "/shop?category=sunglasses&gender=kids",
        image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "sunglasses-sale",
        label: "On Sale",
        badge: "Starts @₹500",
        href: "/shop?category=sunglasses&sale=true",
        image: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
  {
    id: "contact-lenses-accessories",
    title: "Contact Lenses & Accessories",
    viewAllHref: "/shop?category=contact-lenses",
    pillBadge: null,
    items: [
      {
        id: "contact-lenses-clear",
        label: "Contact Lenses",
        href: "/shop?category=contact-lenses",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "contact-lenses-color",
        label: "Color Lenses",
        href: "/shop?category=contact-lenses&type=color",
        image: "https://images.unsplash.com/photo-1583001809873-a128495da465?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "lens-solution",
        label: "Solutions",
        href: "/shop?category=accessories&search=solution",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "accessories-kit",
        label: "Accessories",
        badge: "Try @ 99",
        href: "/shop?category=accessories",
        image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&auto=format&fit=crop&q=80",
      },
    ],
  },
];

const HomepageCategories: React.FC = () => {
  const [groups, setGroups] = useState<NavGroup[]>(DEFAULT_HOMEPAGE_NAV);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [editGroupIndex, setEditGroupIndex] = useState<number | null>(null);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<NavItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const token = getToken();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await settings.get("homepage_categories_nav");
      if (res && res.value && Array.isArray(res.value) && res.value.length > 0) {
        setGroups(res.value);
      } else {
        setGroups(DEFAULT_HOMEPAGE_NAV);
      }
    } catch (err) {
      console.log("Using default homepage categories navigation");
      setGroups(DEFAULT_HOMEPAGE_NAV);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(dataToSave?: NavGroup[]) {
    setSaving(true);
    try {
      const payload = dataToSave || groups;
      await settings.set("homepage_categories_nav", payload);
      toast.success("Homepage Category Navigation updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    if (confirm("Reset all 3 rows to original defaults? Any custom images and links will be restored.")) {
      setGroups(DEFAULT_HOMEPAGE_NAV);
      saveSettings(DEFAULT_HOMEPAGE_NAV);
    }
  }

  const openEditModal = (groupIdx: number, itemIdx: number) => {
    setEditGroupIndex(groupIdx);
    setEditItemIndex(itemIdx);
    setEditItem({ ...groups[groupIdx].items[itemIdx] });
  };

  const handleSaveModalItem = () => {
    if (editGroupIndex === null || editItemIndex === null || !editItem) return;

    const newGroups = [...groups];
    newGroups[editGroupIndex].items[editItemIndex] = editItem;
    setGroups(newGroups);
    setEditItem(null);
    setEditGroupIndex(null);
    setEditItemIndex(null);
    toast.info("Card modified locally. Click 'Save All Changes' to apply to live website.");
  };

  const handleGroupHeaderChange = (groupIdx: number, field: "title" | "pillBadge" | "viewAllHref", val: string) => {
    const newGroups = [...groups];
    newGroups[groupIdx] = {
      ...newGroups[groupIdx],
      [field]: val,
    };
    setGroups(newGroups);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editItem) return;

    setUploadingImage(true);
    try {
      const res = await products.uploadImage(file, "categories", undefined, undefined, token);
      const uploadedUrl = res.url?.startsWith("http") ? res.url : `${API_URL}${res.url}`;
      setEditItem({ ...editItem, image: uploadedUrl });
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Homepage Categories Navigation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Control the 3 rows on the homepage (Eyeglasses, Sunglasses, Contact Lenses): Pics, Names, Links & Badges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleResetDefaults}
            className="border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </Button>
          <Button
            onClick={() => saveSettings()}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* 3 Rows of Categories */}
      <div className="space-y-8">
        {groups.map((group, groupIdx) => (
          <Card key={group.id} className="bg-slate-900 border-slate-800 text-white overflow-hidden shadow-xl">
            <CardHeader className="bg-slate-950/60 border-b border-slate-800/80 p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Section Title */}
                <div>
                  <Label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Row Title</Label>
                  <Input
                    value={group.title}
                    onChange={(e) => handleGroupHeaderChange(groupIdx, "title", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white font-bold mt-1 text-sm focus:border-amber-400"
                  />
                </div>

                {/* Pill Badge */}
                <div>
                  <Label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    Pill Badge (Optional, e.g. "with Power")
                  </Label>
                  <Input
                    value={group.pillBadge || ""}
                    placeholder="e.g. with Power"
                    onChange={(e) => handleGroupHeaderChange(groupIdx, "pillBadge", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-amber-300 mt-1 text-sm focus:border-amber-400"
                  />
                </div>

                {/* View All Link */}
                <div>
                  <Label className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">View All Redirect URL</Label>
                  <Input
                    value={group.viewAllHref}
                    onChange={(e) => handleGroupHeaderChange(groupIdx, "viewAllHref", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-slate-300 mt-1 text-sm focus:border-amber-400"
                  />
                </div>
              </div>
            </CardHeader>

            {/* 4 Cards Grid */}
            <CardContent className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {group.items.map((item, itemIdx) => (
                  <div
                    key={item.id}
                    onClick={() => openEditModal(groupIdx, itemIdx)}
                    className="group relative cursor-pointer flex flex-col items-center bg-slate-950/80 border border-slate-800 hover:border-amber-400/80 p-3.5 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.01]"
                  >
                    {/* Badge Overlay */}
                    {item.badge && (
                      <div className="absolute top-5 left-5 z-10">
                        <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow uppercase">
                          {item.badge}
                        </span>
                      </div>
                    )}

                    {/* Image Preview */}
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-900 relative mb-3">
                      <img
                        src={item.image}
                        alt={item.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs bg-amber-400 text-black font-bold px-3 py-1 rounded-lg shadow-lg">
                          Click to Edit
                        </span>
                      </div>
                    </div>

                    {/* Label */}
                    <span className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {item.label}
                    </span>

                    {/* URL preview */}
                    <span className="text-[10px] text-slate-400 truncate max-w-full mt-1 flex items-center gap-1">
                      <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                      {item.href}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Item Dialog */}
      {editItem && (
        <Dialog open={true} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                Edit Card: {editItem.label}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Image Preview & Upload */}
              <div>
                <Label className="text-xs font-bold text-slate-300">Card Photo / Image</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-950 border border-slate-700 shrink-0">
                    <img src={editItem.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-white transition-colors">
                      <UploadCloud className="w-4 h-4 text-amber-400" />
                      {uploadingImage ? "Uploading..." : "Upload New Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                    <Input
                      value={editItem.image}
                      placeholder="Or paste image URL"
                      onChange={(e) => setEditItem({ ...editItem, image: e.target.value })}
                      className="bg-slate-950 border-slate-800 text-xs text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Name / Label */}
              <div>
                <Label className="text-xs font-bold text-slate-300">Name / Label</Label>
                <Input
                  value={editItem.label}
                  onChange={(e) => setEditItem({ ...editItem, label: e.target.value })}
                  placeholder="e.g. Men, Women, Kids, On Sale"
                  className="bg-slate-950 border-slate-800 text-white mt-1"
                />
              </div>

              {/* Redirect Link */}
              <div>
                <Label className="text-xs font-bold text-slate-300">Redirect Link (URL)</Label>
                <Input
                  value={editItem.href}
                  onChange={(e) => setEditItem({ ...editItem, href: e.target.value })}
                  placeholder="e.g. /shop?category=eyeglasses&gender=men"
                  className="bg-slate-950 border-slate-800 text-white mt-1"
                />
                {/* Quick Link Helpers */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 self-center mr-1">Quick Presets:</span>
                  {[
                    "/shop?category=eyeglasses&gender=men",
                    "/shop?category=eyeglasses&gender=women",
                    "/shop?category=eyeglasses&sale=true",
                    "/shop?category=sunglasses&gender=men",
                    "/shop?category=sunglasses&sale=true",
                    "/shop?category=contact-lenses",
                    "/shop?category=accessories",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setEditItem({ ...editItem, href: preset })}
                      className="text-[10px] bg-slate-800 hover:bg-amber-400 hover:text-black text-slate-300 px-2 py-0.5 rounded transition-colors"
                    >
                      {preset.split("?")[1] || preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Text (Optional) */}
              <div>
                <Label className="text-xs font-bold text-slate-300">Badge Text (Optional)</Label>
                <Input
                  value={editItem.badge || ""}
                  onChange={(e) => setEditItem({ ...editItem, badge: e.target.value || null })}
                  placeholder="e.g. Starts @₹500, Try @ 99, 50% OFF (leave blank for none)"
                  className="bg-slate-950 border-slate-800 text-amber-300 mt-1"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setEditItem(null)}
                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveModalItem}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
              >
                <Check className="w-4 h-4 mr-1" />
                Done Editing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HomepageCategories;
