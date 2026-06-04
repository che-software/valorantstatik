import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "KediPotter Tracker kullanım koşulları ve hizmet şartları.",
};

const SECTIONS = [
  {
    title: "1. Hizmetin Kapsamı",
    content:
      "KediPotter Tracker, Riot Games Developer Portal’da kayıtlı bir uygulama olup Production API ve Riot Sign-On (RSO) çerçevesinde VALORANT verilerini sunar. Hizmet bağımsız bir geliştirici ürünüdür; Riot Games bu uygulamayı resmi olarak onaylamaz veya desteklemez (aşağıdaki yasal feragatnameye bakınız).",
  },
  {
    title: "2. Kullanım Koşulları",
    content: "Bu platformu kullanarak Riot Games'in Kullanım Koşulları'na ve Gizlilik Politikası'na uymayı kabul edersiniz. Platform yalnızca kişisel, ticari olmayan amaçlarla kullanılabilir.",
  },
  {
    title: "3. Opt-in Zorunluluğu",
    content: "Oyuncuların istatistiklerinin platformda görüntülenebilmesi için Riot hesabıyla giriş yaparak veri kullanımına açıkça izin vermeleri gerekmektedir. İzin vermeyen oyuncuların verileri diğer kullanıcılara gösterilmez.",
  },
  {
    title: "4. Veri Sorumluluğu",
    content: "Platform, yalnızca Riot Games API'sinden alınan kamuya açık oyun verilerini işler. Kullanıcıların kişisel bilgileri (ad, e-posta, adres vb.) toplanmaz veya üçüncü taraflarla paylaşılmaz.",
  },
  {
    title: "5. Hizmet Değişiklikleri",
    content: "Platform, önceden bildirim yapılmaksızın hizmetini değiştirme, askıya alma veya sonlandırma hakkını saklı tutar. Riot Games API erişiminin kısıtlanması durumunda hizmet geçici olarak kullanılamayabilir.",
  },
  {
    title: "6. Sorumluluk Reddi",
    content: "Platform, istatistiklerin doğruluğunu garanti etmez. Veriler Riot Games API'sinden alınmakta olup gecikmeli veya eksik olabilir. Platform, bu verilerden kaynaklanan herhangi bir zarardan sorumlu tutulamaz.",
  },
  {
    title: "7. Fikri Mülkiyet",
    content: "Valorant, Riot Games ve ilgili tüm markalar Riot Games, Inc. şirketinin tescilli ticari markalarıdır. Bu platform söz konusu markaları yalnızca tanımlama amacıyla kullanmaktadır.",
  },
  {
    title: "8. İletişim",
    content: "Bu koşullarla ilgili sorularınız için İletişim sayfamızı kullanabilirsiniz.",
  },
];

export default function TermsPage() {
  return (
    <main className="flex-1 px-4 py-12 max-w-2xl mx-auto w-full">
      <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-10">
        <ArrowLeft className="w-4 h-4" /> Ana Sayfa
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#FF4655]/10 border border-[#FF4655]/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#FF4655]" />
        </div>
        <div>
          <h1 className="text-white font-black text-2xl">Kullanım Koşulları</h1>
          <p className="text-white/30 text-xs mt-0.5">Terms of Service · Son güncelleme: Mayıs 2026</p>
        </div>
      </div>

      <div className="space-y-4">
        {SECTIONS.map(s => (
          <div key={s.title} className="glass-card rounded-2xl p-5">
            <h2 className="text-white font-bold text-sm mb-2">{s.title}</h2>
            <p className="text-white/50 text-sm leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 glass-card rounded-2xl p-4 border border-[#FF4655]/10">
        <p className="text-white/40 text-sm">
          Sorularınız için{" "}
          <Link href="/contact" className="text-[#FF4655] hover:underline">İletişim</Link>{" "}
          sayfasını kullanabilirsiniz.
        </p>
      </div>

      <p className="text-white/15 text-[11px] leading-relaxed mt-8">
        KediPotter Tracker isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or
        opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.
        Riot Games, VALORANT, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.
      </p>
    </main>
  );
}
