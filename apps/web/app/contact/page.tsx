"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [form,    setForm]    = useState({ name: "", email: "", message: "" });
  const [status,  setStatus]  = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg,  setErrMsg]  = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gönderilemedi.");
      setStatus("success");
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Bir hata oluştu.");
      setStatus("error");
    }
  }

  return (
    <main className="flex-1 px-4 py-12 max-w-lg mx-auto w-full relative">
      {/* Arka plan efekti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.04, 0.07, 0.04] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#FF4655] rounded-full blur-[120px]"
        />
      </div>

      <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-10">
        <ArrowLeft className="w-4 h-4" /> Ana Sayfa
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-white font-black text-2xl mb-1">İletişim</h1>
        <p className="text-white/40 text-sm mb-8">Öneri, hata bildirimi veya iş birliği için yazın.</p>

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-8 text-center space-y-3"
            >
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <p className="text-white font-bold">Mesajınız alındı!</p>
              <p className="text-white/40 text-sm">En kısa sürede dönüş yapılacak.</p>
              <button
                onClick={() => { setStatus("idle"); setForm({ name: "", email: "", message: "" }); }}
                className="text-[#FF4655] text-sm hover:underline mt-2"
              >
                Yeni mesaj gönder
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="glass-card rounded-2xl p-6 space-y-4 border border-white/8"
            >
              {/* İsim */}
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs uppercase tracking-wider">İsim</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Adınız"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[#FF4655]/50 focus:bg-white/8 transition-all text-sm"
                />
              </div>

              {/* E-posta */}
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs uppercase tracking-wider">E-posta</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="ornek@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[#FF4655]/50 focus:bg-white/8 transition-all text-sm"
                />
              </div>

              {/* Mesaj */}
              <div className="space-y-1.5">
                <label className="text-white/50 text-xs uppercase tracking-wider">Mesaj</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Mesajınızı buraya yazın..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[#FF4655]/50 focus:bg-white/8 transition-all text-sm resize-none"
                />
              </div>

              {/* Hata mesajı */}
              <AnimatePresence>
                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={status === "loading"}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-[#FF4655] hover:bg-[#e03545] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                {status === "loading" ? (
                  <motion.span
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <><Send className="w-4 h-4" /> Gönder</>
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
