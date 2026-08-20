import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useLanguage } from "../context/LanguageContext";
import { fetchProducts, toProduct } from "@/lib/catalog";

export function Hero() {
  const { t, dir } = useLanguage();
  const [emblaRef] = useEmblaCarousel({ loop: true, direction: dir }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  // جلب المنتجات من نفس API الذي تستخدمه في لوحة التحكم
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // اختيار المنتجات المتاحة فقط (available === true) وأخذ أول 4 أو 5 منها
  const activeProducts = products.filter((p) => p.available).slice(0, 10);

  if (isLoading) {
    return <div className="h-[42vh] min-h-[300px] w-full bg-muted animate-pulse sm:h-[50vh]" />;
  }

  if (activeProducts.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {activeProducts.map((product) => (
          <div key={product.id} className="relative min-w-0 flex-[0_0_100%]">
            {/* استخدام نفس طريقة عرض الصورة المتبعة في ProductCard */}
            <img
              src={product.image}
              alt={product.name}
              className="h-[42vh] min-h-[300px] w-full object-cover sm:h-[50vh]"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-6xl px-4 pb-12">
                <h1 className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-1000 text-3xl font-extrabold leading-tight text-foreground sm:text-4xl md:text-5xl">
                  {t("hero.title")}
                  <span className="text-primary">{t("hero.delivery")}</span>
                </h1>
                <p className="mt-3 max-w-md animate-in fade-in slide-in-from-bottom-4 delay-200 duration-1000 text-sm text-muted-foreground sm:text-base md:text-lg">
                  {t("hero.subtitle")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
