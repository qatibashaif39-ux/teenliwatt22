import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Twitter,
  Facebook,
  Sparkles,
  Mail,
} from "lucide-react";
import { type Product, CURRENCY } from "@/data/products";

interface ShareModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ product, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareUrl = `${currentUrl.split("#")[0].split("?")[0]}?product=${encodeURIComponent(product.id)}`;
  const shareText = `شاهد هذا المنتج المميز: ${product.name} بسعر ${product.price} ${CURRENCY} ✨`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      toast.success("تم نسخ الرابط ومعلومات المنتج إلى الحافظة!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("تعذر النسخ التلقائي، يرجى نسخ الرابط يدوياً.");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
        toast.success("تمت المشاركة بنجاح!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareTelegram = () => {
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`تين ليوا — ${product.name}`);
    const body = encodeURIComponent(
      `مرحباً،\n\nأود مشاركة هذا المنتج الرائع معك:\n${product.name}\nالسعر: ${product.price} ${CURRENCY}\n\nيمكنك الاطلاع عليه وطلبه عبر الرابط التالي:\n${shareUrl}\n\nشكراً لك!`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border/80 text-foreground p-6 rounded-2xl">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Share2 className="h-5 w-5 text-primary" />
            مشاركة المنتج مع الأصدقاء
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            شارك تفاصيل ورابط {product.name} عبر منصات التواصل الاجتماعي والبريد الإلكتروني.
          </DialogDescription>
        </DialogHeader>

        {/* Product mini preview card */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50 my-2">
          <img
            src={product.image}
            alt={product.name}
            className="w-16 h-16 rounded-lg object-cover border border-border/40"
          />
          <div className="flex-1 min-w-0 text-right">
            <h4 className="font-bold text-sm truncate">{product.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
            <p className="text-primary font-bold text-sm mt-0.5">
              {product.price} {CURRENCY}
            </p>
          </div>
        </div>

        {/* Social Sharing Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-2">
          <Button
            type="button"
            variant="outline"
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30 font-bold py-5 rounded-xl"
          >
            <MessageCircle className="h-5 w-5" />
            واتساب
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={shareTelegram}
            className="flex items-center justify-center gap-2 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] border-[#0088cc]/30 font-bold py-5 rounded-xl"
          >
            <Send className="h-5 w-5" />
            تيليجرام
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={shareEmail}
            className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 font-bold py-5 rounded-xl"
          >
            <Mail className="h-5 w-5" />
            البريد (Email)
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={shareTwitter}
            className="flex items-center justify-center gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/30 font-bold py-5 rounded-xl"
          >
            <Twitter className="h-5 w-5" />
            تويتر (X)
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={shareFacebook}
            className="flex items-center justify-center gap-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30 font-bold py-5 rounded-xl sm:col-span-2"
          >
            <Facebook className="h-5 w-5" />
            فيسبوك
          </Button>
        </div>

        {/* Copy Link Row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <div className="flex-1 bg-secondary/80 px-3 py-2 rounded-xl text-xs font-mono text-muted-foreground truncate text-left dir-ltr">
            {shareUrl}
          </div>
          <Button
            type="button"
            onClick={copyToClipboard}
            className="rounded-xl flex items-center gap-1.5 font-bold text-xs"
          >
            {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            {copied ? "تم النسخ" : "نسخ الرابط"}
          </Button>
        </div>

        {/* Native Web Share Option if available */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleNativeShare}
            className="w-full mt-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            مشاركة عبر تطبيقات الهاتف الأخرى
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
