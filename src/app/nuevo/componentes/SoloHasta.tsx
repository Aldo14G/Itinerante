'use client';
// Oculta un evento pasado su día (hora de Monterrey) aunque la página estática se haya generado antes.
import { useEffect, useState, type ReactNode } from 'react';

function hoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function SoloHasta({ fecha, children }: { fecha: string; children: ReactNode }) {
  const [vigente, setVigente] = useState(true);
  useEffect(() => setVigente(hoy() <= fecha), [fecha]);
  return vigente ? <>{children}</> : null;
}
