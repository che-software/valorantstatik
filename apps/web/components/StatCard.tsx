"use client";
import { motion } from "framer-motion";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  delay?: number;
}

export default function StatCard({ label, value, sub, color = "#ff4654", delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card rounded-2xl p-5 flex flex-col gap-1 relative overflow-hidden"
    >
      {/* Neon glow */}
      <div className="absolute inset-0 opacity-5 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)` }} />
      <p className="text-white/40 text-xs uppercase tracking-widest font-medium">{label}</p>
      <p className="text-3xl font-black text-white" style={{ textShadow: `0 0 20px ${color}60` }}>
        {value}
      </p>
      {sub && <p className="text-white/30 text-xs">{sub}</p>}
      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    </motion.div>
  );
}
