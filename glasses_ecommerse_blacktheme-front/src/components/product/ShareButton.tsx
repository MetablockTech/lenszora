import { Share2, Link2, Check } from "lucide-react";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

// Share a product: phones open the system share sheet (WhatsApp, Instagram, …);
// where that isn't available (most laptops) a menu offers WhatsApp, Facebook, X and Copy link.

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
}

const ShareButton = ({ title, text, url, className = "" }: ShareButtonProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const message = text ? `${text}\n${shareUrl}` : `${title}\n${shareUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Link copied", description: "Paste it anywhere to share this product." });
    } catch {
      toast({ title: "Couldn't copy", description: shareUrl });
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    if (typeof navigator.share === "function") {
      e.preventDefault();
      try {
        await navigator.share({ title, text: text || title, url: shareUrl });
      } catch (err) {
        // Closing the share sheet is not an error; anything else falls back to the menu
        if ((err as Error)?.name !== "AbortError") setMenuOpen(true);
      }
      return;
    }
    setMenuOpen(true);
  };

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer");
  const enc = encodeURIComponent;

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          onPointerDown={(e) => e.preventDefault()}
          aria-label="Share this product"
          className={`shrink-0 h-10 w-10 rounded-full border border-white/15 text-slate-300 hover:border-white/30 hover:text-white flex items-center justify-center transition-colors ${className}`}
        >
          <Share2 className="h-[17px] w-[17px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 border-white/10 bg-[#161618] text-slate-200">
        <DropdownMenuItem onClick={() => open(`https://wa.me/?text=${enc(message)}`)} className="cursor-pointer gap-2.5 focus:bg-white/5 focus:text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-black text-white">W</span> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}`)} className="cursor-pointer gap-2.5 focus:bg-white/5 focus:text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-[11px] font-black text-white">f</span> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => open(`https://twitter.com/intent/tweet?text=${enc(text || title)}&url=${enc(shareUrl)}`)} className="cursor-pointer gap-2.5 focus:bg-white/5 focus:text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-[11px] font-black text-white ring-1 ring-white/20">X</span> X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer gap-2.5 focus:bg-white/5 focus:text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
          </span>
          {copied ? "Copied" : "Copy link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
