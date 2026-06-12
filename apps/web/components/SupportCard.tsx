"use client";

import React, { useState } from 'react';
import { Heart, ExternalLink, Copy, CheckCircle2, Wallet, CreditCard } from 'lucide-react';
import Link from 'next/link';

// Kendi Phantom (SOL) Cüzdan adresini buraya eklemelisin
const PHANTOM_ADDRESS = "0x718fD2A8b33B0227684abbaca08Ef88Bf8029FD9";

export default function SupportCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PHANTOM_ADDRESS);
      setCopied(true);
      
      // 2 saniye sonra eski haline geri döner
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Kopyalama işlemi başarısız:", err);
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#101115] border border-gray-800/50 rounded-lg p-6 flex flex-col gap-6 group hover:border-gray-700 transition-all duration-300 mt-8">
      {/* Sol Kenar Valorant Kırmızı Şerit */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#ff4655] shadow-[0_0_10px_rgba(255,70,85,0.5)]"></div>
      
      {/* Hextech / Cyberpunk Arka Plan Deseni (Hafif Noktalı) */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)' }}></div>
      
      {/* Köşede Hafif Neon Parlaması */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#ff4655] opacity-[0.03] blur-3xl rounded-full pointer-events-none"></div>

      {/* Üst Kısım: Açıklama ve Metin */}
      <div className="relative z-10 pl-2">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-[#ff4655] animate-pulse" fill="currentColor" />
          <h3 className="text-xl font-bold text-white tracking-tight">Support an Independent Developer</h3>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed max-w-3xl">
          Hey! I'm <span className="text-white font-semibold">che-software</span>, the solo developer behind this Valorant Tracker. 
          I built this project with a passion for delivering a fast, modern, and ad-free experience. If you enjoy the site, 
          you can support me via <span className="text-[#ff4655]">Papara</span> or <span className="text-purple-400">Crypto</span> to help cover server costs and fuel future updates!
        </p>
      </div>

      {/* Alt Kısım: Destek Yöntemleri (Responsive Grid) */}
      <div className="relative z-10 pl-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Sol Taraf: Papara */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors relative overflow-hidden group/papara">
          {/* Papara Hover Efekti */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ff4655] opacity-0 blur-3xl rounded-full group-hover/papara:opacity-[0.05] transition-opacity duration-300 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 text-white font-semibold mb-1">
            <CreditCard className="w-5 h-5 text-[#ff4655]" />
            <span>Support via Papara</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">You can visit my Papara profile for a fast and fee-free donation.</p>
          
          <Link 
            href="https://ppr.ist/2ooaUb0BD" 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative flex items-center justify-center gap-2 px-5 py-2.5 bg-[#101115] border border-[#ff4655]/30 rounded-md overflow-hidden group/btn hover:border-[#ff4655] transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,70,85,0.2)] w-full mt-auto"
          >
            {/* Neon Parlama (Sweep) Efekti */}
            <span className="absolute top-0 left-0 w-[150%] h-full bg-gradient-to-r from-transparent via-[#ff4655]/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"></span>
            
            <span className="text-gray-200 font-bold group-hover/btn:text-white transition-colors text-sm relative z-10">
              Go to Papara
            </span>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover/btn:text-[#ff4655] transition-colors relative z-10" />
          </Link>
        </div>

        {/* Sağ Taraf: Phantom Wallet (SOL) */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors relative overflow-hidden group/sol">
          {/* Solana Hover Efekti */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500 opacity-0 blur-3xl rounded-full group-hover/sol:opacity-[0.05] transition-opacity duration-300 pointer-events-none"></div>
          
          <div className="flex items-center gap-2 text-white font-semibold mb-1">
            <Wallet className="w-5 h-5 text-purple-400" />
            <span>Crypto Wallet (EVM)</span>
          </div>
          <p className="text-xs text-gray-500 mb-2">You can copy my wallet address if you'd like to support via Crypto.</p>
          
          <div className="mt-auto flex items-center gap-2 p-1.5 bg-[#0a0a0d] border border-white/[0.08] rounded-md hover:border-white/[0.15] transition-colors">
            {/* Cüzdan Adresi Görüntüleme */}
            <code className="text-xs text-gray-400 px-2 truncate flex-1 font-mono">
              {PHANTOM_ADDRESS}
            </code>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-300 shrink-0 ${
                copied 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
                  : "bg-white/[0.05] text-gray-300 hover:bg-white/[0.1] border border-transparent hover:border-white/[0.2]"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Copied! 🚀</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
