"use client";

import React, { useState } from 'react';
import { Wallet, CheckCircle2 } from 'lucide-react';

const PHANTOM_ADDRESS = "0x718fD2A8b33B0227684abbaca08Ef88Bf8029FD9";

export default function DonateButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PHANTOM_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Kopyalama işlemi başarısız:", err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`relative group flex items-center justify-center px-4 py-2 overflow-hidden rounded-md border transition-all duration-300 ${
        copied 
          ? "bg-emerald-500/10 border-emerald-500/30" 
          : "bg-[#101115] border-gray-800 hover:border-[#ff4655]/50 hover:shadow-[0_0_15px_rgba(255,70,85,0.3)]"
      }`}
    >
      {/* İçten dışa dolan cyberpunk neon efekti */}
      <span className={`absolute inset-0 w-full h-full rounded-md scale-0 opacity-0 transition-all duration-500 ease-out pointer-events-none ${
        copied ? "bg-emerald-500/10 scale-100 opacity-100" : "bg-[#ff4655]/10 group-hover:scale-100 group-hover:opacity-100"
      }`}></span>
      
      {/* Sol kenar Valorant kırmızı çizgisi (Hoverda aşağıdan yukarı dolar) */}
      {!copied && (
        <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#ff4655] transform scale-y-0 origin-bottom transition-transform duration-300 group-hover:scale-y-100 delay-75 pointer-events-none"></span>
      )}
      
      {/* Buton İçeriği */}
      <div className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${
        copied ? "text-emerald-400" : "text-gray-300 group-hover:text-white"
      }`}>
        {copied ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Wallet className="w-4 h-4 text-[#ff4655]" />
        )}
        <span className="font-semibold tracking-wide text-xs uppercase">
          {copied ? "Copied! 🚀" : "Support"}
        </span>
      </div>
    </button>
  );
}
