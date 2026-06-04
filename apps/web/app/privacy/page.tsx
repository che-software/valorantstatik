// Gizlilik Politikası — Riot Games Developer Policy ve veri işleme ilkeleriyle uyumlu
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "KediPotter Tracker gizlilik politikası ve veri kullanım koşulları.",
};

const SECTIONS = [
  {
    title: "1. Toplanan Veriler",
    content: `Bu platform, Riot Games Developer Portal üzerinde kayıtlı bir uygulama olarak yalnızca Riot Games API kuralları ve izin verilen kapsamda oyun içi verileri (ör. oyuncu kimliği, rank, maç istatistikleri) işler. Riot Sign-On (RSO) ile oturum açan kullanıcılar, Riot’un belirttiği şekilde veri paylaşımına onay vermiş sayılır. Ad, e-posta veya posta adresi gibi ek kimlik bilgisi toplanmaz; iletişim formu dışında kişisel veri talep edilmez.`,
  },
  {
    title: "2. Çerezler (Cookies)",
    content: `Site, temel işlevsellik ve güvenli oturum yönetimi için zorunlu çerezler kullanır (ör. RSO akışında kısa ömürlü durum ve şifreli oturum çerezleri). Reklam veya davranışsal izleme amaçlı çerez kullanılmaz. Tarayıcı ayarlarınızdan çerezleri kısıtlayabilirsiniz; bu durumda oturum özellikleri çalışmayabilir.`,
  },
  {
    title: "3. Üçüncü Taraf Hizmetler",
    content: `Platform, Riot Games API ve politikalara uygun şekilde ek veri sağlayıcıları (ör. topluluk API uçları) kullanabilir. Bu hizmetlerin kendi gizlilik politikaları geçerlidir. Uygulama Vercel altyapısında barındırılmaktadır; Vercel için vercel.com/legal adresine bakınız.`,
  },
  {
    title: "4. Veri Güvenliği",
    content: `Veriler TLS (HTTPS) üzerinden iletilir. API anahtarları ve istemci sırları yalnızca sunucu tarafında tutulur, istemciye aktarılmaz. Performans için veriler geçici önbelleğe alınabilir; yetkisiz erişime karşı makul teknik ve idari önlemler uygulanır.`,
  },
  {
    title: "5. Veri Silme Talebi",
    content: `Profilinizin veya onayınızın platform tarafından işlenmesini durdurmak için İletişim sayfasından talepte bulunabilirsiniz. Talepler makul sürede işleme alınır.`,
  },
  {
    title: "6. Çocukların Gizliliği",
    content: `Bu platform 13 yaşın altındaki bireylere yönelik değildir ve bu kişilerden bilerek veri toplamaz. Riot Games’in yaş ve hesap politikaları geçerlidir.`,
  },
  {
    title: "7. Politika Değişiklikleri",
    content: `Bu gizlilik politikası güncellenebilir; güncel metin bu sayfada yayımlanır. Son güncelleme: Mayıs 2026.`,
  },
  {
    title: "8. Riot Games ile ilişki ve markalar",
    content: `KediPotter Tracker, Riot Games Developer Policy ve VALORANT ürün politikalarına uygun şekilde faaliyet gösterir; Production API ve RSO kullanımı Riot’un geliştirici koşulları çerçevesindedir. Riot Games, VALORANT ve ilgili tüm özellikler Riot Games, Inc. şirketinin ticari markalarıdır. Aşağıdaki İngilizce feragatname, Riot’un üçüncü taraf uygulamalar için beklediği standart yasal bildirimdir ve değiştirilmemiştir.`,
  },
];

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
      <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-10">
        <ArrowLeft className="w-4 h-4" /> Ana Sayfa
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#FF4655]/10 border border-[#FF4655]/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#FF4655]" />
        </div>
        <div>
          <h1 className="text-white font-black text-2xl">Gizlilik Politikası</h1>
          <p className="text-white/30 text-xs mt-0.5">Privacy Policy · Son güncelleme: Mayıs 2026</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 mb-6 border-l-2 border-emerald-500/40">
        <p className="text-white/70 text-sm leading-relaxed">
          KediPotter Tracker, Riot Games geliştirici programı kapsamında kayıtlı bir üründür. Kişisel verilerinizi
          yalnızca hizmeti sunmak, Riot API kurallarına uymak ve güvenliği sağlamak için işleriz.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map(s => (
          <div key={s.title} className="glass-card rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm mb-2">{s.title}</h2>
            <p className="text-white/50 text-sm leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 glass-card rounded-2xl p-5 border border-[#FF4655]/10">
        <p className="text-white/40 text-sm">
          Gizlilik ile ilgili sorularınız için{" "}
          <Link href="/contact" className="text-[#FF4655] hover:underline">
            İletişim sayfasını
          </Link>{" "}
          kullanabilirsiniz.
        </p>
      </div>

      <p className="text-white/15 text-[11px] leading-relaxed mt-8">
        KediPotter Tracker isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions of Riot Games or
        anyone officially involved in producing or managing Riot Games properties. Riot Games, VALORANT, and all
        associated properties are trademarks or registered trademarks of Riot Games, Inc.
      </p>
    </main>
  );
}
