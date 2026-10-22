import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, UploadCloud, RotateCcw, Link as LinkIcon, Sparkles, Tag, Eye, ArrowUpRight, Check, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { settings, products, categories as categoriesAPI, getToken, clearToken, API_URL } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
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

interface CategoryOption {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  level?: string;
  parentId?: string | { _id: string } | null;
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
  const navigate = useNavigate();
  const [groups, setGroups] = useState<NavGroup[]>(DEFAULT_HOMEPAGE_NAV);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Edit Modal State
  const [editGroupIndex, setEditGroupIndex] = useState<number | null>(null);
  const [editItemIndex, setEditItemIndex] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<NavItem | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Add Row (from an existing category) dialog state
  const [allCategories, setAllCategories] = useState<CategoryOption[]>([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowCategoryId, setNewRowCategoryId] = useState("");
  const [newRowPosition, setNewRowPosition] = useState(0);

  useEffect(() => {
    loadSettings();
    categoriesAPI.list().then((cats) => setAllCategories(Array.isArray(cats) ? cats : [])).catch(() => setAllCategories([]));
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await settings.get("homepage_categories_nav");
      let val = res?.value;
      if (typeof val === "string") {
        try {
          val = JSON.parse(val);
        } catch {
          // ignore
        }
      }
      if (Array.isArray(val) && val.length > 0) {
        setGroups(val);
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
    const token = getToken();
    if (!token) {
      toast.error("Admin session expired. Please log in again.");
      clearToken();
      setTimeout(() => navigate("/admin/login?expired=1"), 1000);
      return;
    }

    setSaving(true);
    try {
      const payload = dataToSave || groups;
      await settings.update(
        "homepage_categories_nav",
        {
          value: payload,
          category: "homepage",
          type: "array",
        },
        token
      );
      setHasUnsavedChanges(false);
      toast.success("Homepage Category Navigation saved successfully!");
    } catch (err: any) {
      console.error("Save settings error:", err);
      const isAuthError =
        err.message?.toLowerCase().includes("token") ||
        err.message?.toLowerCase().includes("unauthorized") ||
        err.message?.toLowerCase().includes("forbidden");
      if (isAuthError) {
        toast.error("Admin session expired or invalid token. Redirecting to login...");
        clearToken();
        setTimeout(() => navigate("/admin/login?expired=1"), 1200);
      } else {
        toast.error(err.message || "Failed to save settings");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleResetDefaults() {
    if (confirm("Reset to the original 3 default rows? Custom rows, images and links will be removed.")) {
      setGroups(DEFAULT_HOMEPAGE_NAV);
      saveSettings(DEFAULT_HOMEPAGE_NAV);
    }
  }

  const openEditModal = (groupIdx: number, itemIdx: number) => {
    setEditGroupIndex(groupIdx);
    setEditItemIndex(itemIdx);
    setEditItem({ ...groups[groupIdx].items[itemIdx] });
  };

  const handleSaveModalItem = async (saveImmediately: boolean = false) => {
    if (editGroupIndex === null || editItemIndex === null || !editItem) return;

    const newGroups = groups.map((g, gIdx) => {
      if (gIdx !== editGroupIndex) return g;
      return {
        ...g,
        items: editItemIndex === -1
          ? [...g.items, editItem]
          : g.items.map((item, iIdx) => (iIdx === editItemIndex ? editItem : item)),
      };
    });

    setGroups(newGroups);
    setEditItem(null);
    setEditGroupIndex(null);
    setEditItemIndex(null);

    if (saveImmediately) {
      await saveSettings(newGroups);
    } else {
      setHasUnsavedChanges(true);
      toast.info("Card modified. Click 'Save All Changes' to apply to live website.");
    }
  };

  const handleGroupHeaderChange = (groupIdx: number, field: "title" | "pillBadge" | "viewAllHref", val: string) => {
    const newGroups = groups.map((group, idx) => {
      if (idx !== groupIdx) return group;
      return {
        ...group,
        [field]: val,
      };
    });
    setGroups(newGroups);
    setHasUnsavedChanges(true);
  };

  const updateGroups = (newGroups: NavGroup[], message?: string) => {
    setGroups(newGroups);
    setHasUnsavedChanges(true);
    if (message) toast.info(message);
  };

  const moveGroup = (groupIdx: number, direction: -1 | 1) => {
    const target = groupIdx + direction;
    if (target < 0 || target >= groups.length) return;
    const next = [...groups];
    [next[groupIdx], next[target]] = [next[target], next[groupIdx]];
    updateGroups(next);
  };

  const deleteGroup = (groupIdx: number) => {
    if (!confirm(`Remove the "${groups[groupIdx].title}" row from the homepage?`)) return;
    updateGroups(groups.filter((_, idx) => idx !== groupIdx), "Row removed. Click 'Save All Changes' to publish.");
  };

  const openAddCardModal = (groupIdx: number) => {
    setEditGroupIndex(groupIdx);
    setEditItemIndex(-1);
    setEditItem({ id: `card-${Date.now()}`, label: "", href: groups[groupIdx].viewAllHref || "/shop", image: "", badge: null });
  };

  const deleteEditingCard = () => {
    if (editGroupIndex === null || editItemIndex === null || editItemIndex < 0) return;
    if (!confirm("Delete this card?")) return;
    updateGroups(
      groups.map((g, gIdx) => (gIdx === editGroupIndex ? { ...g, items: g.items.filter((_, iIdx) => iIdx !== editItemIndex) } : g)),
      "Card deleted. Click 'Save All Changes' to publish."
    );
    setEditItem(null);
    setEditGroupIndex(null);
    setEditItemIndex(null);
  };

  const mainCategories = allCategories.filter((c) => !c.parentId || c.level === "main");

  const openAddRowDialog = () => {
    // Default position: right after the Sunglasses row, else at the end
    const sunIdx = groups.findIndex((g) => g.id === "sunglasses" || g.title.toLowerCase().includes("sunglass"));
    setNewRowPosition(sunIdx >= 0 ? sunIdx + 1 : groups.length);
    setNewRowCategoryId(mainCategories[0]?._id || "");
    setShowAddRow(true);
  };

  const handleAddRow = () => {
    const cat = allCategories.find((c) => c._id === newRowCategoryId);
    if (!cat) {
      toast.error("Please select a category");
      return;
    }
    const catSlug = cat.slug || cat._id;
    const parentIdOf = (c: CategoryOption) => (c.parentId && typeof c.parentId === "object" ? c.parentId._id : c.parentId);
    const subs = allCategories.filter((c) => parentIdOf(c) === cat._id);
    const items: NavItem[] = (subs.length > 0 ? subs : [cat]).map((c) => ({
      id: `${catSlug}-${c.slug || c._id}`,
      label: c.name,
      href: `/shop?category=${encodeURIComponent(c.slug || c._id)}`,
      image: c.image || cat.image || "",
      badge: null,
    }));
    const newGroup: NavGroup = {
      id: `cat-${cat._id}-${Date.now()}`,
      title: cat.name,
      viewAllHref: `/shop?category=${encodeURIComponent(catSlug)}`,
      pillBadge: null,
      items,
    };
    const next = [...groups];
    next.splice(newRowPosition, 0, newGroup);
    updateGroups(next, `"${cat.name}" row added with ${items.length} card(s). Add photos, then click 'Save All Changes'.`);
    setShowAddRow(false);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editItem) return;

    setUploadingImage(true);
    try {
      const token = getToken();
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
      <div className="flex items-center justify-center min-h-[400px] text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Homepage Categories Navigation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Control the category rows on the homepage: add rows from any category, reorder them, and edit pics, names, links & badges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={openAddRowDialog}
            className="border-amber-500/40 bg-amber-500/10 text-amber-700 hover:text-black hover:bg-amber-400 text-xs flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </Button>
          <Button
            variant="outline"
            onClick={handleResetDefaults}
            className="border-slate-300 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </Button>
          <Button
            onClick={() => saveSettings()}
            disabled={saving}
            className={`font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all ${
              hasUnsavedChanges
                ? "bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/30 ring-2 ring-amber-400/50 animate-pulse"
                : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
            }`}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : hasUnsavedChanges ? "Save All Changes (Unsaved)" : "Save All Changes"}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="flex items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/30 text-amber-700 px-5 py-3 rounded-2xl text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>You have unsaved changes. Remember to click <strong>Save All Changes</strong> to publish them to your live website.</span>
          </div>
          <Button
            size="sm"
            onClick={() => saveSettings()}
            disabled={saving}
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs px-3 h-8 shrink-0"
          >
            {saving ? "Saving..." : "Save Now"}
          </Button>
        </div>
      )}

      {/* 3 Rows of Categories */}
      <div className="space-y-8">
        {groups.map((group, groupIdx) => (
          <Card key={group.id} className="bg-white border-slate-200 text-slate-900 overflow-hidden shadow-xl">
            <CardHeader className="bg-slate-50 border-b border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Row {groupIdx + 1}</span>
                <div className="flex items-center gap-1.5">
                  <Button size="icon" variant="ghost" title="Move up" disabled={groupIdx === 0} onClick={() => moveGroup(groupIdx, -1)} className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" title="Move down" disabled={groupIdx === groups.length - 1} onClick={() => moveGroup(groupIdx, 1)} className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" title="Delete row" onClick={() => deleteGroup(groupIdx)} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-950/40">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Section Title */}
                <div>
                  <Label className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Row Title</Label>
                  <Input
                    value={group.title}
                    onChange={(e) => handleGroupHeaderChange(groupIdx, "title", e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 font-bold mt-1 text-sm focus:border-amber-400"
                  />
                </div>

                {/* Pill Badge */}
                <div>
                  <Label className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Pill Badge (Optional, e.g. "with Power")
                  </Label>
                  <Input
                    value={group.pillBadge || ""}
                    placeholder="e.g. with Power"
                    onChange={(e) => handleGroupHeaderChange(groupIdx, "pillBadge", e.target.value)}
                    className="bg-white border-slate-300 text-amber-700 mt-1 text-sm focus:border-amber-400"
                  />
                </div>

                {/* View All Link */}
                <div>
                  <Label className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">View All Redirect URL</Label>
                  <Input
                    value={group.viewAllHref}
                    onChange={(e) => handleGroupHeaderChange(groupIdx, "viewAllHref", e.target.value)}
                    className="bg-white border-slate-300 text-slate-600 mt-1 text-sm focus:border-amber-400"
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
                    className="group relative cursor-pointer flex flex-col items-center bg-slate-50 border border-slate-200 hover:border-amber-400/80 p-3.5 rounded-2xl transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.01]"
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
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-white relative mb-3">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs bg-amber-400 text-black font-bold px-3 py-1 rounded-lg shadow-lg">
                          Click to Edit
                        </span>
                      </div>
                    </div>

                    {/* Label */}
                    <span className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {item.label}
                    </span>

                    {/* URL preview */}
                    <span className="text-[10px] text-slate-500 truncate max-w-full mt-1 flex items-center gap-1">
                      <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                      {item.href}
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => openAddCardModal(groupIdx)}
                  className="flex flex-col items-center justify-center gap-2 min-h-[160px] border-2 border-dashed border-slate-300 hover:border-amber-400/70 rounded-2xl text-slate-500 hover:text-amber-700 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase tracking-wider">Add Card</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Row Dialog */}
      {showAddRow && (
        <Dialog open={true} onOpenChange={() => setShowAddRow(false)}>
          <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-600" />
                Add Homepage Row
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-bold text-slate-600">Category</Label>
                <select
                  value={newRowCategoryId}
                  onChange={(e) => setNewRowCategoryId(e.target.value)}
                  className="w-full mt-1 h-10 rounded-md bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3 focus:outline-none focus:border-amber-400"
                >
                  {mainCategories.length === 0 && <option value="">No categories found</option>}
                  {mainCategories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Its sub-categories become the cards (or one card for the category itself). You can edit photos and links after adding.
                </p>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-600">Position</Label>
                <select
                  value={newRowPosition}
                  onChange={(e) => setNewRowPosition(Number(e.target.value))}
                  className="w-full mt-1 h-10 rounded-md bg-slate-50 border border-slate-200 text-slate-900 text-sm px-3 focus:outline-none focus:border-amber-400"
                >
                  <option value={0}>At the top</option>
                  {groups.map((g, idx) => (
                    <option key={g.id} value={idx + 1}>After "{g.title}"</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setShowAddRow(false)} className="border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                Cancel
              </Button>
              <Button onClick={handleAddRow} disabled={!newRowCategoryId} className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Row
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Item Dialog */}
      {editItem && (
        <Dialog open={true} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="bg-white border-slate-200 text-slate-900 w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto [&>*]:min-w-0">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600" />
                {editItemIndex === -1 ? "Add Card" : `Edit Card: ${editItem.label}`}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Image Preview & Upload */}
              <div>
                <Label className="text-xs font-bold text-slate-600">Card Photo / Image</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-300 shrink-0">
                    <img src={getImageUrl(editItem.image)} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 transition-colors">
                      <UploadCloud className="w-4 h-4 text-amber-600" />
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
                      className="bg-slate-50 border-slate-200 text-xs text-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Name / Label */}
              <div>
                <Label className="text-xs font-bold text-slate-600">Name / Label</Label>
                <Input
                  value={editItem.label}
                  onChange={(e) => setEditItem({ ...editItem, label: e.target.value })}
                  placeholder="e.g. Men, Women, Kids, On Sale"
                  className="bg-slate-50 border-slate-200 text-slate-900 mt-1"
                />
              </div>

              {/* Redirect Link */}
              <div>
                <Label className="text-xs font-bold text-slate-600">Redirect Link (URL)</Label>
                <Input
                  value={editItem.href}
                  onChange={(e) => setEditItem({ ...editItem, href: e.target.value })}
                  placeholder="e.g. /shop?category=eyeglasses&gender=men"
                  className="bg-slate-50 border-slate-200 text-slate-900 mt-1"
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
                      className="text-[10px] bg-slate-100 hover:bg-amber-400 hover:text-black text-slate-600 px-2 py-0.5 rounded transition-colors"
                    >
                      {preset.split("?")[1] || preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Text (Optional) */}
              <div>
                <Label className="text-xs font-bold text-slate-600">Badge Text (Optional)</Label>
                <Input
                  value={editItem.badge || ""}
                  onChange={(e) => setEditItem({ ...editItem, badge: e.target.value || null })}
                  placeholder="e.g. Starts @₹500, Try @ 99, 50% OFF (leave blank for none)"
                  className="bg-slate-50 border-slate-200 text-amber-700 mt-1"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center">
              {editItemIndex !== null && editItemIndex >= 0 && (
                <Button
                  variant="ghost"
                  onClick={deleteEditingCard}
                  className="text-red-600 hover:text-red-700 hover:bg-red-950/40 sm:mr-auto text-xs px-2"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Delete Card
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setEditItem(null)}
                className="border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSaveModalItem(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs"
              >
                Apply to Draft
              </Button>
              <Button
                onClick={() => handleSaveModalItem(true)}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/20"
              >
                <Check className="w-4 h-4 mr-1.5" />
                {saving ? "Publishing..." : "Save & Publish Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HomepageCategories;
