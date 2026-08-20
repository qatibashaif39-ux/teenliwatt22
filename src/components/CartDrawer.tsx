import { Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { CURRENCY } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, total, setQty, remove } = useCart();
  const { t } = useLanguage();

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col bg-card shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/60 p-4">
          <h2 className="text-lg font-bold">{t("cart.title")}</h2>
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-full p-1 hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
            {t("cart.empty")}
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-3 rounded-xl bg-secondary/50 p-2">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  loading="lazy"
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-bold">{item.product.name}</h3>
                    <button
                      onClick={() => remove(item.product.id)}
                      aria-label="حذف"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {item.product.price * item.qty} {CURRENCY}
                  </span>
                  <div className="mt-auto flex items-center gap-2 self-start rounded-full bg-background p-1">
                    <button
                      onClick={() => {
                        const max = item.product.maximum_order_quantity;
                        if (!max || item.qty < max) {
                          setQty(item.product.id, item.qty + 1);
                        }
                      }}
                      disabled={
                        !!item.product.maximum_order_quantity &&
                        item.qty >= item.product.maximum_order_quantity
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground"
                      aria-label="زيادة"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                    <button
                      onClick={() => {
                        const min = item.product.minimum_order_quantity || 1;
                        if (item.qty <= min) {
                          remove(item.product.id);
                        } else {
                          setQty(item.product.id, item.qty - 1);
                        }
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-primary hover:text-primary-foreground"
                      aria-label="إنقاص"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border/60 p-4">
          <div className="mb-3 flex items-center justify-between text-base font-bold">
            <span>{t("cart.total")}</span>
            <span className="text-primary">
              {total.toFixed(2)} {CURRENCY}
            </span>
          </div>
          <Link
            to="/checkout"
            onClick={onClose}
            aria-disabled={items.length === 0}
            className={`block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 ${
              items.length === 0 ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {t("cart.checkout")}
          </Link>
        </div>
      </aside>
    </>
  );
}
