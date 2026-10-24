import { getImageUrl } from "@/lib/utils";

// Frame shapes come from Admin → Eyewear Attributes (type "frameShape").
// Shared by the homepage Frame Finder and the category shape picker.

export type FrameType = "eyeglasses" | "sunglasses";

export interface Shape {
  _id: string;
  name: string;
  image?: string;
}

// Fallback photos per shape when the admin hasn't uploaded one
const EYEGLASSES_SHAPE_IMAGES: Record<string, string> = {
  aviator: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop&q=80",
  wayfarer: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
  rectangle: "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=600&auto=format&fit=crop&q=80",
  oval: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop&q=80",
  round: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
  "cat-eye": "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  cateye: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  square: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&auto=format&fit=crop&q=80",
  geometric: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
  clubmaster: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  browline: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  hexagonal: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
};
const SUNGLASSES_SHAPE_IMAGES: Record<string, string> = {
  aviator: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  wayfarer: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  rectangle: "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&auto=format&fit=crop&q=80",
  oval: "https://images.unsplash.com/photo-1589782182703-2aaa69037b5b?w=600&auto=format&fit=crop&q=80",
  round: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
  "cat-eye": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  cateye: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  square: "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&auto=format&fit=crop&q=80",
  geometric: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
  clubmaster: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  browline: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
  hexagonal: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
};
const DEFAULT_SHAPE_IMAGE: Record<FrameType, string> = {
  eyeglasses: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&auto=format&fit=crop&q=80",
  sunglasses: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
};

// "Cat Eye", "cat-eye", "Cateye" -> "cateye" so admin shape names match product data
export const normalizeShape = (s?: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
export const slugifyShape = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

// Admin-uploaded photo first for eyeglasses; for sunglasses prefer the tinted stock photo
export function getShapeImage(shape: Shape, frameType: FrameType) {
  const map = frameType === "sunglasses" ? SUNGLASSES_SHAPE_IMAGES : EYEGLASSES_SHAPE_IMAGES;
  const mapped = map[slugifyShape(shape.name)] || map[shape.name.toLowerCase().trim()];
  if (frameType === "sunglasses") return mapped || (shape.image ? getImageUrl(shape.image) : DEFAULT_SHAPE_IMAGE.sunglasses);
  return shape.image ? getImageUrl(shape.image) : mapped || DEFAULT_SHAPE_IMAGE.eyeglasses;
}
