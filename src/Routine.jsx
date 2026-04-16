import React, { useState, useEffect, useMemo, useRef } from 'react';
import { sendSupabaseRequest } from './offlineSync';

/* ============================================================
   FORM — Daily food & skincare ritual tracker  v6
   Single-file React JSX. localStorage persistence. Mobile-first.
   v1 → original
   v2 → 13-fix rewrite (tab tinting, lion→panda, water+morning, toast,
         egg cap, food log categories, snack simplify, notes confirm,
         skin routine editor, log detail, xlsx export, settings reorg)
   v3 → panda emoji restored, flat food log w/ tags, download DOM fix
   v4 → export = xlsx only, backup = json only, nuke = single confirm
   v5 → inline nuke confirmation UI (no confirm() dialog)
   v6 → progress dots, streak badge, end-of-day card, AM/PM auto-expand,
         haptic feedback, confirm btn filled, avg water stat, empty state
   v7 → progress dots UI fix: column layout (dot + label + value), no wrap
   ============================================================ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');

#nomad-routine {
  --bg: #f7f5f0;
  --bg2: #ede9e1;
  --sf: #ffffff;
  --bd: rgba(0,0,0,0.08);
  --bde: rgba(0,0,0,0.14);
  --tx: rgba(10,12,8,0.90);
  --txm: rgba(10,12,8,0.55);
  --txd: rgba(10,12,8,0.32);
  --green: #639922;
  --green-sf: #EAF3DE;
  --green-deep: #3B6D11;
  --amber: #EF9F27;
  --amber-sf: #FAEEDA;
  --amber-deep: #854F0B;
  --teal: #1D9E75;
  --teal-sf: #E1F5EE;
  --teal-deep: #0F6E56;
  --r: 16px;
  --rsm: 10px;
  --rpill: 100px;
  --font: 'DM Sans', sans-serif;
  --mono: 'DM Mono', monospace;
  --food-bg: #FBF6EC;
  --skin-bg: #F0F8F3;
}
#nomad-routine.dark {
  --bg: #0d1a0f;
  --bg2: #111f13;
  --sf: #162019;
  --bd: rgba(255,255,255,0.08);
  --bde: rgba(255,255,255,0.14);
  --tx: rgba(240,245,238,0.90);
  --txm: rgba(240,245,238,0.50);
  --txd: rgba(240,245,238,0.28);
  --green-sf: rgba(99,153,34,0.15);
  --amber-sf: rgba(239,159,39,0.12);
  --teal-sf: rgba(29,158,117,0.12);
  --food-bg: #0f1a0b;
  --skin-bg: #0c1814;
}

#nomad-routine * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

#nomad-routine .hd { display: none !important; }
#nomad-routine .skin-hd .date { display: none !important; }
#nomad-routine .app {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--bg);
  position: relative;
  display: flex;
  flex-direction: column;
  padding-bottom: 76px;
}
#nomad-routine .app[data-tab="food"] { background: var(--food-bg); }
#nomad-routine .app[data-tab="skin"] { background: var(--skin-bg); }

#nomad-routine .screen {
  flex: 1;
  overflow-y: auto;
  padding: 20px 18px 24px;
  scrollbar-width: none;
}
#nomad-routine .screen::-webkit-scrollbar { display: none; }

#nomad-routine .hd {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
}
#nomad-routine .hd h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
}
#nomad-routine .hd .sub {
  font-size: 12px;
  color: var(--txm);
  font-family: var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

#nomad-routine .card {
  background: var(--sf);
  border: 1px solid var(--bd);
  border-radius: var(--r);
  padding: 16px;
  margin-bottom: 12px;
}
#nomad-routine .card.done { background: var(--green-sf); border-color: transparent; }
#nomad-routine .card.skin-done { background: var(--teal-sf); border-color: transparent; }
#nomad-routine .card.confirmed { background: var(--bg2); }

#nomad-routine .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
#nomad-routine .label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--txm);
  font-weight: 500;
  margin-bottom: 8px;
}

/* ---- Mascot bubble ---- */
#nomad-routine .mascot {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: var(--sf);
  border: 1px solid var(--bd);
  border-left: 3px solid var(--amber);
  border-radius: var(--r);
  padding: 12px 14px;
  margin-bottom: 16px;
}
#nomad-routine .mascot.skin { border-left-color: var(--teal); }
#nomad-routine .mascot .av {
  width: 28px; height: 28px;
  background: var(--bg2);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
#nomad-routine .mascot .msg { font-size: 14px; color: var(--tx); line-height: 1.4; padding-top: 4px; }

/* ---- Checkbox ---- */
#nomad-routine .check {
  width: 22px; height: 22px;
  border-radius: 7px;
  border: 1.5px solid var(--bde);
  background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
#nomad-routine .check.on {
  background: var(--green);
  border-color: var(--green);
  animation: checkPop 0.25s ease;
}
#nomad-routine .check.on.teal { background: var(--teal); border-color: var(--teal); }
#nomad-routine .check svg { stroke: #fff; stroke-width: 3; fill: none; }
@keyframes checkPop {
  0% { transform: scale(0.8); }
  60% { transform: scale(1.12); }
  100% { transform: scale(1); }
}

/* ---- Morning water row ---- */
#nomad-routine .mw-row {
  display: flex; align-items: center; gap: 12px;
  padding: 4px 2px;
}
#nomad-routine .mw-row .txt { flex: 1; font-size: 15px; font-weight: 500; }
#nomad-routine .mw-input {
  background: var(--bg2);
  border: 1px solid var(--bd);
  border-radius: var(--rsm);
  padding: 6px 10px;
  font-family: var(--mono);
  font-size: 13px;
  color: var(--tx);
  width: 70px;
  outline: none;
}

/* ---- Water track ---- */
#nomad-routine .water-big {
  font-family: var(--mono);
  font-size: 36px;
  font-weight: 500;
  color: var(--amber);
  letter-spacing: -0.02em;
  margin-bottom: 2px;
}
#nomad-routine .water-big .u { font-size: 18px; color: var(--txm); margin-left: 2px; }
#nomad-routine .water-target { font-size: 11px; color: var(--txm); font-family: var(--mono); letter-spacing: 0.04em; }
#nomad-routine .track {
  display: flex;
  justify-content: space-between;
  margin: 16px 0 10px;
  position: relative;
}
#nomad-routine .track-pt {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--txd);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}
#nomad-routine .track-pt.on { color: var(--amber-deep); background: var(--amber-sf); font-weight: 500; }
#nomad-routine .track-pt:active { transform: scale(0.95); }
#nomad-routine .prog {
  height: 6px;
  background: var(--bg2);
  border-radius: 100px;
  overflow: hidden;
  margin-top: 4px;
}
#nomad-routine .prog-fill {
  height: 100%;
  background: var(--amber);
  border-radius: 100px;
  transition: width 0.3s ease;
}
#nomad-routine .prog-fill.teal { background: var(--teal); }
#nomad-routine .prog-fill.green { background: var(--green); }

/* ---- Stepper ---- */
#nomad-routine .stepper {
  display: flex; align-items: center; gap: 10px;
}
#nomad-routine .stepper button {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: var(--bg2);
  border: 1px solid var(--bd);
  color: var(--tx);
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font);
}
#nomad-routine .stepper button:active { transform: scale(0.92); }
#nomad-routine .stepper button:disabled { opacity: 0.35; pointer-events: none; }
#nomad-routine .stepper .val {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 500;
  min-width: 28px;
  text-align: center;
  color: var(--tx);
}

/* ---- Pills / chips ---- */
#nomad-routine .pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--rpill);
  background: var(--bg2);
  border: 1px solid var(--bd);
  font-size: 13px;
  color: var(--tx);
  cursor: pointer;
  font-family: var(--font);
  transition: all 0.15s;
}
#nomad-routine .pill:active { transform: scale(0.96); }
#nomad-routine .pill.on { background: var(--amber-sf); border-color: var(--amber); color: var(--amber-deep); font-weight: 500; }
#nomad-routine .pill.on.teal { background: var(--teal-sf); border-color: var(--teal); color: var(--teal-deep); }
#nomad-routine .pill.on.green { background: var(--green-sf); border-color: var(--green); color: var(--green-deep); }
#nomad-routine .pills { display: flex; flex-wrap: wrap; gap: 6px; }

#nomad-routine .chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--rpill);
  background: var(--amber-sf);
  border: 1px solid var(--bd);
  font-size: 12px;
  color: var(--amber-deep);
  font-weight: 500;
  animation: chipIn 0.25s ease;
}
#nomad-routine .chip button {
  background: none; border: none; padding: 0;
  color: var(--amber-deep);
  cursor: pointer; font-size: 14px;
  line-height: 1;
}
@keyframes chipIn {
  from { opacity: 0; transform: translateY(4px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ---- Curd toggle card ---- */
#nomad-routine .tap-card {
  padding: 18px;
  border-radius: var(--r);
  background: var(--bg2);
  border: 1px solid var(--bd);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}
#nomad-routine .tap-card.on {
  background: var(--green-sf);
  border-color: var(--green);
  color: var(--green-deep);
}
#nomad-routine .tap-card.teal.on {
  background: var(--teal-sf);
  border-color: var(--teal);
  color: var(--teal-deep);
}
#nomad-routine .tap-card:active { transform: scale(0.98); }

/* ---- Inputs ---- */
#nomad-routine .inp {
  width: 100%;
  background: var(--bg2);
  border: 1px solid var(--bd);
  border-radius: var(--rsm);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--tx);
  font-family: var(--font);
  outline: none;
}
#nomad-routine .inp:focus { border-color: var(--bde); }
textarea.inp { resize: none; min-height: 60px; line-height: 1.4; }
input[type=number].inp { -moz-appearance: textfield; }
input[type=number].inp::-webkit-outer-spin-button,
input[type=number].inp::-webkit-inner-spin-button {
  -webkit-appearance: none; margin: 0;
}

/* ---- Bottom nav ---- */
#nomad-routine .nav {
  position: fixed;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  background: var(--sf);
  border-top: 1px solid var(--bd);
  display: flex;
  padding: 10px 0 18px;
  z-index: 100;
}
#nomad-routine .nav button {
  flex: 1;
  background: none; border: none;
  padding: 6px 0;
  cursor: pointer;
  display: flex; flex-direction: column; align-items: center;
  gap: 3px;
  color: var(--txm);
  font-family: var(--font);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
#nomad-routine .nav button svg { width: 22px; height: 22px; stroke: currentColor; fill: none; stroke-width: 1.6; }
#nomad-routine .nav button.active.food { color: var(--amber-deep); }
#nomad-routine .nav button.active.skin { color: var(--teal-deep); }
#nomad-routine .nav button.active.log { color: var(--green-deep); }
#nomad-routine .nav button.active.settings { color: var(--tx); }
#nomad-routine .nav button:active { transform: scale(0.94); }

/* ---- Skin header ---- */
#nomad-routine .skin-hd {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
#nomad-routine .skin-hd .date { font-size: 13px; color: var(--txm); font-family: var(--mono); }
#nomad-routine .phase-badge {
  background: var(--teal-sf);
  color: var(--teal-deep);
  border-radius: var(--rpill);
  padding: 5px 11px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--teal);
}

/* ---- Collapsible card ---- */
#nomad-routine .coll-hd {
  display: flex; justify-content: space-between; align-items: center;
  cursor: pointer;
}
#nomad-routine .coll-hd .t { font-weight: 500; font-size: 15px; }
#nomad-routine .coll-hd .t .ct { color: var(--txm); font-size: 12px; font-weight: 400; margin-left: 6px; }
#nomad-routine .chev {
  transition: transform 0.2s;
  color: var(--txm);
}
#nomad-routine .chev.open { transform: rotate(90deg); }
#nomad-routine .steps {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--bd);
}
#nomad-routine .step {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 10px 0;
}
#nomad-routine .step .info { flex: 1; }
#nomad-routine .step .info .name { font-size: 14px; font-weight: 500; }
#nomad-routine .step .info .kind { font-size: 11px; color: var(--txm); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }

#nomad-routine .btn {
  width: 100%;
  background: var(--tx);
  color: var(--bg);
  border: none;
  border-radius: var(--rsm);
  padding: 12px;
  font-family: var(--font);
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
}
#nomad-routine .btn.teal { background: var(--teal); color: #fff; }
#nomad-routine .btn.green { background: var(--green); color: #fff; }
#nomad-routine .btn.amber { background: var(--amber); color: #fff; }
#nomad-routine .btn:active { transform: scale(0.98); }
#nomad-routine .btn.ghost {
  background: var(--bg2);
  color: var(--tx);
  border: 1px solid var(--bd);
}
#nomad-routine .btn.danger { background: #c23c3c; color: #fff; }

/* ---- Notes confirm ---- */
#nomad-routine .confirm-btn {
  width: 100%;
  background: none;
  border: 1px solid var(--bd);
  border-radius: var(--rsm);
  padding: 10px 12px;
  font-family: var(--font);
  font-size: 13px;
  color: var(--txm);
  cursor: pointer;
  margin-top: 12px;
  text-align: center;
}
#nomad-routine .confirm-btn:hover { background: var(--bg2); }
#nomad-routine .saved-link {
  display: block;
  text-align: center;
  font-size: 12px;
  color: var(--txm);
  margin-top: 12px;
  cursor: pointer;
  font-family: var(--mono);
}
#nomad-routine .saved-link:hover { color: var(--tx); }

/* ---- Free food log categories ---- */
#nomad-routine .food-cat { margin-bottom: 14px; }
#nomad-routine .food-cat:last-child { margin-bottom: 0; }
#nomad-routine .food-cat-lbl {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--txm);
  font-weight: 500;
  margin-bottom: 6px;
}
#nomad-routine .food-cat .free-list { margin-top: 6px; }

/* ---- Log screen ---- */
#nomad-routine .stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}
#nomad-routine .stat {
  background: var(--sf);
  border: 1px solid var(--bd);
  border-radius: var(--rsm);
  padding: 12px 10px;
  text-align: center;
}
#nomad-routine .stat .v {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.01em;
}
#nomad-routine .stat .l {
  font-size: 9px;
  color: var(--txm);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 3px;
}
#nomad-routine .stat.green .v { color: var(--green-deep); }
#nomad-routine .stat.teal .v { color: var(--teal-deep); }
#nomad-routine .stat.amber .v { color: var(--amber-deep); }

#nomad-routine .cal-hd {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
#nomad-routine .cal-hd .m { font-size: 14px; font-weight: 500; }
#nomad-routine .cal-hd button {
  background: var(--bg2);
  border: 1px solid var(--bd);
  width: 30px; height: 30px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--tx);
  font-size: 14px;
}
#nomad-routine .cal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  animation: monthIn 0.25s ease;
}
@keyframes monthIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
#nomad-routine .cal-day-lbl {
  font-size: 9px;
  color: var(--txd);
  text-align: center;
  font-family: var(--mono);
  text-transform: uppercase;
}
#nomad-routine .cal-cell {
  aspect-ratio: 1;
  border-radius: 6px;
  background: var(--bg2);
  border: 1px solid transparent;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--txd);
  cursor: pointer;
}
#nomad-routine .cal-cell.empty { visibility: hidden; }
#nomad-routine .cal-cell.lvl1 { background: var(--green-sf); color: var(--green-deep); }
#nomad-routine .cal-cell.lvl2 { background: #B8D68F; color: var(--green-deep); }
#nomad-routine .cal-cell.lvl3 { background: var(--green); color: #fff; }
#nomad-routine .cal-cell.lvl4 { background: var(--green-deep); color: #fff; font-weight: 500; }
#nomad-routine .cal-cell.today { border-color: var(--tx); }

#nomad-routine .sheet {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 150;
  display: flex; align-items: flex-end;
  animation: fadeIn 0.2s ease;
}
#nomad-routine .sheet-body {
  width: 100%;
  max-width: 430px;
  margin: 0 auto;
  background: var(--bg);
  border-radius: 24px 24px 0 0;
  padding: 22px 20px 26px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.28s ease;
}
#nomad-routine .sheet-body::-webkit-scrollbar { display: none; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
#nomad-routine .sheet-hd {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
#nomad-routine .sheet-hd h2 { margin: 0; font-size: 18px; font-weight: 700; }
#nomad-routine .sheet-hd button {
  background: var(--bg2); border: none; width: 30px; height: 30px;
  border-radius: 8px; cursor: pointer; font-size: 16px; color: var(--tx);
}
#nomad-routine .sum-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
#nomad-routine .sum-chip {
  padding: 5px 10px;
  border-radius: var(--rpill);
  background: var(--sf);
  border: 1px solid var(--bd);
  font-size: 11px;
  color: var(--tx);
}

/* ---- Sheet detail ---- */
#nomad-routine .detail-section { margin-bottom: 16px; }
#nomad-routine .detail-section-lbl {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  color: var(--txd);
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--bd);
}
#nomad-routine .detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 12px;
  padding: 3px 0;
  color: var(--tx);
}
#nomad-routine .detail-row .dk { color: var(--txm); flex-shrink: 0; margin-right: 10px; }
#nomad-routine .detail-row .dv { text-align: right; color: var(--tx); word-break: break-word; max-width: 65%; }

/* ---- Settings ---- */
#nomad-routine .sec { margin-bottom: 22px; }
#nomad-routine .sec h3 {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--txm);
  font-weight: 500;
  margin: 0 0 10px;
  padding: 0 4px;
}
#nomad-routine .set-row {
  background: var(--sf);
  border: 1px solid var(--bd);
  border-radius: var(--rsm);
  padding: 12px 14px;
  margin-bottom: 8px;
}
#nomad-routine .set-row .lbl { font-size: 13px; font-weight: 500; }
#nomad-routine .set-row .desc { font-size: 11px; color: var(--txm); margin-top: 2px; }
#nomad-routine .set-row .r { display: flex; justify-content: space-between; align-items: center; gap: 12px; }

#nomad-routine .toggle {
  width: 42px; height: 24px;
  background: var(--bg2);
  border: 1px solid var(--bd);
  border-radius: 100px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
#nomad-routine .toggle::after {
  content: '';
  position: absolute;
  top: 2px; left: 2px;
  width: 18px; height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
#nomad-routine .toggle.on { background: var(--green); border-color: var(--green); }
#nomad-routine .toggle.on::after { transform: translateX(18px); }

#nomad-routine .seg {
  display: flex;
  background: var(--bg2);
  border-radius: var(--rsm);
  padding: 3px;
  gap: 2px;
}
#nomad-routine .seg button {
  flex: 1;
  padding: 7px 8px;
  border: none;
  background: none;
  border-radius: 7px;
  font-size: 12px;
  color: var(--txm);
  cursor: pointer;
  font-family: var(--font);
  font-weight: 500;
}
#nomad-routine .seg button.on { background: var(--sf); color: var(--tx); box-shadow: 0 1px 3px rgba(0,0,0,0.06); }

#nomad-routine .free-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }

/* ---- Skin routine editor ---- */
#nomad-routine .routine-day-row { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--bd); }
#nomad-routine .routine-day-row:last-child { border-bottom: none; margin-bottom: 0; }
#nomad-routine .routine-day-lbl { font-size: 13px; font-weight: 600; color: var(--tx); margin-bottom: 8px; }
#nomad-routine .routine-sub { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 6px; }
#nomad-routine .routine-sub-label {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--txm); font-weight: 500; min-width: 24px; padding-top: 6px;
}
#nomad-routine .routine-chips { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; flex: 1; }
#nomad-routine .routine-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 9px; border-radius: 100px;
  background: var(--teal-sf); border: 1px solid var(--bd);
  font-size: 11px; color: var(--teal-deep); font-weight: 500;
}
#nomad-routine .routine-chip button {
  background: none; border: none; padding: 0;
  color: var(--teal-deep); cursor: pointer; font-size: 13px; line-height: 1;
}
#nomad-routine .add-step-btn {
  display: inline-flex; align-items: center; padding: 4px 9px;
  border-radius: 100px; background: var(--bg2); border: 1px dashed var(--bd);
  font-size: 11px; color: var(--txm); cursor: pointer; font-family: var(--font);
}
#nomad-routine .product-picker {
  margin-top: 6px; background: var(--bg); border: 1px solid var(--bd);
  border-radius: 8px; padding: 8px; display: flex; flex-wrap: wrap; gap: 5px; width: 100%;
}
#nomad-routine .product-picker-item {
  padding: 4px 10px; border-radius: 100px; background: var(--bg2);
  border: 1px solid var(--bd); font-size: 11px; color: var(--tx); cursor: pointer;
}

/* ---- Toast animation ---- */
@keyframes toastPill {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  15% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
}

/* ---- Progress dots row ---- */
#nomad-routine .prog-dots {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--sf);
  border: 1px solid var(--bd);
  border-radius: var(--rsm);
  margin-bottom: 14px;
}
#nomad-routine .prog-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}
#nomad-routine .prog-dot .dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--bg2);
  border: 1.5px solid var(--bd);
  flex-shrink: 0;
  transition: all 0.2s;
}
#nomad-routine .prog-dot .dot.on { background: var(--green); border-color: var(--green); box-shadow: 0 0 0 3px var(--green-sf); }
#nomad-routine .prog-dot .dot.on.amber { background: var(--amber); border-color: var(--amber); box-shadow: 0 0 0 3px var(--amber-sf); }
#nomad-routine .prog-dot .dot.on.teal { background: var(--teal); border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-sf); }
#nomad-routine .prog-dot .dot-lbl {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--txd);
  font-family: var(--mono);
  white-space: nowrap;
}
#nomad-routine .prog-dot .dot-val {
  font-size: 10px;
  font-family: var(--mono);
  color: var(--txm);
  font-weight: 500;
}
#nomad-routine .prog-dot-sep { width: 1px; height: 24px; background: var(--bd); flex-shrink: 0; }

/* ---- End of day summary card ---- */
#nomad-routine .eod-card {
  background: var(--tx);
  color: var(--bg);
  border-radius: var(--r);
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
#nomad-routine .eod-card .eod-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.55;
  font-weight: 500;
}
#nomad-routine .eod-card .eod-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
#nomad-routine .eod-card .eod-item {
  font-size: 13px;
  font-family: var(--mono);
  display: flex;
  align-items: center;
  gap: 5px;
}
#nomad-routine .eod-card .eod-item .eod-ok { opacity: 1; }
#nomad-routine .eod-card .eod-item .eod-miss { opacity: 0.38; }

/* ---- Confirm button polish ---- */
#nomad-routine .confirm-btn {
  width: 100%;
  background: var(--green);
  border: none;
  border-radius: var(--rsm);
  padding: 11px 12px;
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  margin-top: 12px;
  text-align: center;
  transition: opacity 0.15s;
}
#nomad-routine .confirm-btn:active { opacity: 0.85; }
#nomad-routine .confirm-btn.teal { background: var(--teal); }
`;

/* ---------- helpers ---------- */
const todayKey = () => new Date().toISOString().slice(0, 10);
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayOfWeek = (d = new Date()) => DOW[d.getDay()];
const isAfterNoon = () => new Date().getHours() >= 12;

/* Parse morning water amount string → litres */
const parseMorningWater = (s) => {
    if (!s) return 0;
    const str = s.trim().toLowerCase();
    const mlMatch = str.match(/^([\d.]+)\s*ml$/);
    if (mlMatch) return parseFloat(mlMatch[1]) / 1000;
    const lMatch = str.match(/^([\d.]+)\s*l$/);
    if (lMatch) return parseFloat(lMatch[1]);
    const numOnly = parseFloat(str);
    if (!isNaN(numOnly)) {
        if (numOnly <= 10) return numOnly;
        if (numOnly >= 100) return numOnly / 1000;
    }
    return 0;
};

/* Migrate freeFoodLog to flat [{text, tag}] format */
const migrateFreeFoodLog = (log) => {
    if (!log) return [];
    // Already new format: array of objects
    if (Array.isArray(log) && (log.length === 0 || typeof log[0] === 'object')) return log;
    // Old format: array of strings
    if (Array.isArray(log)) return log.map(t => ({ text: t, tag: 'other' }));
    // v2 categorized object format
    if (typeof log === 'object') {
        const result = [];
        (log.breakfast || []).forEach(t => result.push({ text: t, tag: 'breakfast' }));
        (log.lunch || []).forEach(t => result.push({ text: t, tag: 'lunch' }));
        (log.dinner || []).forEach(t => result.push({ text: t, tag: 'dinner' }));
        (log.other || []).forEach(t => result.push({ text: t, tag: 'other' }));
        return result;
    }
    return [];
};

const PRODUCT_KEYS = ['cleanser', 'niacinamide', 'sunscreen', 'bhaSerum', 'retinol'];
const PRODUCT_LABELS = { cleanser: 'Cleanser', niacinamide: 'Niacinamide', sunscreen: 'Sunscreen', bhaSerum: 'BHA serum', retinol: 'Retinol' };

const DEFAULT_ROUTINES = {
    Mon: { am: ['cleanser', 'niacinamide', 'sunscreen'], pm: ['cleanser', 'retinol'] },
    Tue: { am: ['cleanser', 'niacinamide', 'sunscreen'], pm: ['cleanser', 'niacinamide', 'bhaSerum'] },
    Wed: { am: ['cleanser', 'niacinamide', 'sunscreen'], pm: ['cleanser', 'retinol'] },
    Thu: { am: ['cleanser', 'niacinamide', 'sunscreen'], pm: ['cleanser', 'niacinamide', 'bhaSerum'] },
    Fri: { am: ['cleanser', 'niacinamide', 'sunscreen'], pm: ['cleanser'] },
    Sat: { am: ['cleanser', 'niacinamide', 'sunscreen'], pm: ['cleanser', 'niacinamide', 'bhaSerum'] },
    Sun: { am: ['cleanser', 'niacinamide', 'sunscreen'], pm: ['cleanser', 'retinol'] },
};

const DEFAULT_DAY = {
    morningWater: false,
    morningWaterAmount: '',
    water: 0,
    eggs: 0,
    snack: '',
    curd: false,
    amSkinDone: false,
    pmSkinDone: false,
    freeFoodLog: [],
    moodChip: '',       // kept in model for old export compat, not rendered
    skinFeelChip: '',
    energyChip: '',
    skinTodayChip: '',
    retinolReactionChip: '',
    notes: '',
    skinNotes: '',
    notesConfirmed: false,
    skinNotesConfirmed: false,
};

const DEFAULT_CONFIG = {
    waterTarget: 3.5,
    eggsTarget: 2,
    retinolPhase: 1,
    darkMode: false,
    showProductNames: true,
    snackRotation: {
        Mon: 'Banana',
        Tue: 'Cucumber + rock salt',
        Wed: 'Carrot',
        Thu: 'Banana',
        Fri: 'Carrot + Cucumber',
        Sat: 'Guava or Apple',
        Sun: 'Whatever looks fresh',
    },
    snackOptions: ['Banana', 'Carrot', 'Cucumber', 'Guava', 'Apple', 'Pomegranate', 'Papaya', 'Other'],
    products: {
        cleanser: 'Barclay Italy SA Face Wash',
        niacinamide: 'Minimalist Niacinamide 10%',
        sunscreen: 'Barclay Italy Mineral SPF 50+',
        bhaSerum: 'Barclay Italy SA Serum',
        retinol: 'Minimalist Retinol 0.3%',
    },
    routines: DEFAULT_ROUTINES,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const pickRoutineList = (saved, fallback) => Array.isArray(saved) ? saved : fallback;
const sanitizeConfig = (value) => {
    const c = value || {};
    return {
        ...DEFAULT_CONFIG,
        ...c,
        waterTarget: clamp(Number(c.waterTarget ?? DEFAULT_CONFIG.waterTarget) || DEFAULT_CONFIG.waterTarget, 0.5, 5),
        eggsTarget: clamp(Number(c.eggsTarget ?? DEFAULT_CONFIG.eggsTarget) || DEFAULT_CONFIG.eggsTarget, 1, 4),
        retinolPhase: clamp(Number(c.retinolPhase ?? DEFAULT_CONFIG.retinolPhase) || DEFAULT_CONFIG.retinolPhase, 1, 3),
        products: { ...DEFAULT_CONFIG.products, ...(c.products || {}) },
        snackRotation: { ...DEFAULT_CONFIG.snackRotation, ...(c.snackRotation || {}) },
        routines: Object.fromEntries(
            Object.entries(DEFAULT_ROUTINES).map(([day, def]) => [
                day,
                {
                    am: pickRoutineList(c.routines?.[day]?.am, def.am),
                    pm: pickRoutineList(c.routines?.[day]?.pm, def.pm),
                },
            ])
        ),
    };
};
const sanitizeDayRecord = (record) => {
    const merged = { ...DEFAULT_DAY, ...(record || {}), freeFoodLog: migrateFreeFoodLog(record?.freeFoodLog) };
    if (!merged.notesConfirmed) {
        merged.notes = '';
        merged.skinFeelChip = '';
        merged.energyChip = '';
    }
    if (!merged.skinNotesConfirmed) {
        merged.skinNotes = '';
        merged.skinTodayChip = '';
        merged.retinolReactionChip = '';
    }
    return merged;
};
const sanitizeAllData = (data) => Object.fromEntries(Object.entries(data || {}).map(([k, v]) => [k, sanitizeDayRecord(v)]));

const loadData = () => {
    try { return sanitizeAllData(JSON.parse(localStorage.getItem('form_data') || '{}')); } catch { return {}; }
};

const loadConfig = () => {
    try {
        const c = JSON.parse(localStorage.getItem('form_config') || 'null');
        if (!c) return DEFAULT_CONFIG;
        return sanitizeConfig(c);
    } catch { return DEFAULT_CONFIG; }
};

// Supabase
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SB_ENABLED = Boolean(SB_URL && SB_KEY);
const sbH = SB_ENABLED ? { "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` } : {};
const FETCH_TIMEOUT_MS = 8000;
const sbGetR = async (table, id) => {
    if (!SB_ENABLED) return null;
    try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
        const r = await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}&select=*`, { headers: sbH, signal: ctrl.signal });
        clearTimeout(timer);
        if (!r.ok) return null;
        const d = await r.json();
        return d[0] || null;
    } catch { return null }
};
const sbUpsertR = async (table, row, dedupeKey = null) => SB_ENABLED ? sendSupabaseRequest({ path: `${SB_URL}/rest/v1/${table}`, method: "POST", headers: { ...sbH, "Prefer": "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(row), dedupeKey }) : { ok: false, queued: false, offline: false, response: null };
const sbDeleteR = async (table, id) => SB_ENABLED ? sendSupabaseRequest({ path: `${SB_URL}/rest/v1/${table}?id=eq.${id}`, method: "DELETE", headers: sbH, dedupeKey: `${table}:delete:${id}` }) : { ok: false, queued: false, offline: false, response: null };

const BANNERS_KEY = 'form_banners';
const getBanners = () => { try { return JSON.parse(localStorage.getItem(BANNERS_KEY) || '{}'); } catch { return {}; } };

/* ---------- icons ---------- */
const Icon = ({ name }) => {
    const icons = {
        food: <svg viewBox="0 0 24 24"><path d="M12 3c-4 0-7 3-7 7v1h14v-1c0-4-3-7-7-7zM4 13h16l-1 6a2 2 0 01-2 2H7a2 2 0 01-2-2l-1-6z" /></svg>,
        skin: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M9 11c0 1 .5 2 1 2M15 11c0 1-.5 2-1 2M9 16c1 1 5 1 6 0" /></svg>,
        log: <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 11h16" /></svg>,
        settings: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>,
        check: <svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>,
        chev: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>,
    };
    return icons[name];
};

/* ---------- Panda messages ---------- */
const getPandaFoodMessage = (day, config) => {
    if (!day.morningWater) return "Start with morning water. Before anything else.";
    if (day.eggs < config.eggsTarget && isAfterNoon()) return "Eggs. Don't skip them.";
    const mwL = parseMorningWater(day.morningWaterAmount);
    const total = mwL + day.water;
    if (total >= config.waterTarget && day.eggs >= config.eggsTarget && day.curd)
        return "Clean day. That's the standard.";
    if (total >= config.waterTarget * 0.7) return "Water on track. Keep the pattern.";
    return "Ritual in progress.";
};

const getPandaSkinMessage = (day, config) => {
    const dow = dayOfWeek();
    const routine = (config.routines && config.routines[dow]) || { am: [], pm: [] };
    const hasRetinol = routine.pm.includes('retinol');
    const isPmShort = routine.pm.length <= 1;
    if (!day.amSkinDone) return "AM routine first. Face wash → Niacinamide → SPF.";
    if (hasRetinol && !day.pmSkinDone) return "Last step, nothing on top. Let it work.";
    if (isPmShort && !day.pmSkinDone) return "Rest night. Face wash only.";
    if (day.amSkinDone && day.pmSkinDone) return "Skin ritual done. Consistent beats perfect.";
    return "PM routine when ready.";
};

const PANDA_SRC = "data:image/png;base64,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";

const Panda = ({ msg, mode }) => (
    <div className={`mascot ${mode === 'skin' ? 'skin' : ''}`}>
        <div className="av">
            <img src={PANDA_SRC} alt="mascot" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        </div>
        <div className="msg">{msg}</div>
    </div>
);

const PandaM = ({ message }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '12px 0' }}>
        <img src={PANDA_SRC} alt="panda" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', fontSize: 13, color: 'var(--tx)', maxWidth: 220, fontFamily: 'var(--font)', lineHeight: 1.5 }}>{message}</div>
    </div>
);

const Check = ({ on, onClick, teal }) => (
    <div className={`check ${on ? 'on' : ''} ${teal ? 'teal' : ''}`} onClick={onClick}>
        {on && <Icon name="check" />}
    </div>
);

/* ---------- Haptic ---------- */
const haptic = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) { } };

/* ---------- Progress dots ---------- */
const ProgressDots = ({ day, config, mode }) => {
    const mwL = parseMorningWater(day.morningWaterAmount);
    const waterTotal = mwL + day.water;
    const waterOk = waterTotal >= config.waterTarget;
    const waterPct = Math.min(100, Math.round((waterTotal / config.waterTarget) * 100));
    const eggsOk = day.eggs >= config.eggsTarget;

    if (mode === 'food') return (
        <div className="prog-dots">
            <div className="prog-dot">
                <div className={`dot ${day.morningWater ? 'on amber' : ''}`} />
                <div className="dot-lbl">Morning</div>
                <div className="dot-val">{day.morningWater ? '✓' : '—'}</div>
            </div>
            <div className="prog-dot-sep" />
            <div className="prog-dot">
                <div className={`dot ${waterOk ? 'on amber' : ''}`} />
                <div className="dot-lbl">Water</div>
                <div className="dot-val">{waterPct}%</div>
            </div>
            <div className="prog-dot-sep" />
            <div className="prog-dot">
                <div className={`dot ${eggsOk ? 'on' : ''}`} />
                <div className="dot-lbl">Eggs</div>
                <div className="dot-val">{day.eggs}/{config.eggsTarget}</div>
            </div>
            <div className="prog-dot-sep" />
            <div className="prog-dot">
                <div className={`dot ${day.curd ? 'on' : ''}`} />
                <div className="dot-lbl">Curd</div>
                <div className="dot-val">{day.curd ? '✓' : '—'}</div>
            </div>
            <div className="prog-dot-sep" />
            <div className="prog-dot">
                <div className={`dot ${day.snack ? 'on' : ''}`} />
                <div className="dot-lbl">Snack</div>
                <div className="dot-val">{day.snack ? '✓' : '—'}</div>
            </div>
        </div>
    );

    return (
        <div className="prog-dots">
            <div className="prog-dot">
                <div className={`dot ${day.amSkinDone ? 'on teal' : ''}`} />
                <div className="dot-lbl">AM</div>
                <div className="dot-val">{day.amSkinDone ? '✓' : '—'}</div>
            </div>
            <div className="prog-dot-sep" />
            <div className="prog-dot">
                <div className={`dot ${day.pmSkinDone ? 'on teal' : ''}`} />
                <div className="dot-lbl">PM</div>
                <div className="dot-val">{day.pmSkinDone ? '✓' : '—'}</div>
            </div>
            <div className="prog-dot-sep" />
            <div className="prog-dot">
                <div className={`dot ${day.skinTodayChip ? 'on teal' : ''}`} />
                <div className="dot-lbl">Skin</div>
                <div className="dot-val">{day.skinTodayChip || '—'}</div>
            </div>
            <div className="prog-dot-sep" />
            <div className="prog-dot">
                <div className={`dot ${day.skinNotesConfirmed ? 'on teal' : ''}`} />
                <div className="dot-lbl">Notes</div>
                <div className="dot-val">{day.skinNotesConfirmed ? '✓' : '—'}</div>
            </div>
        </div>
    );
};

/* ---------- End of day summary ---------- */
const EodCard = ({ day, config }) => {
    const mwL = parseMorningWater(day.morningWaterAmount);
    const waterTotal = (mwL + day.water).toFixed(1);
    const waterOk = (mwL + day.water) >= config.waterTarget;
    const eggsOk = day.eggs >= config.eggsTarget;

    return (
        <div className="eod-card">
            <div className="eod-title">Today at a glance</div>
            <div className="eod-row">
                <div className="eod-item">
                    <span className={waterOk ? 'eod-ok' : 'eod-miss'}>💧</span>
                    <span>{waterTotal}L</span>
                </div>
                <div className="eod-item">
                    <span className={eggsOk ? 'eod-ok' : 'eod-miss'}>🥚</span>
                    <span>{day.eggs}/{config.eggsTarget}</span>
                </div>
                <div className="eod-item">
                    <span className={day.curd ? 'eod-ok' : 'eod-miss'}>🥛</span>
                    <span>{day.curd ? 'Curd ✓' : 'No curd'}</span>
                </div>
                <div className="eod-item">
                    <span className={day.snack ? 'eod-ok' : 'eod-miss'}>🍌</span>
                    <span>{day.snack || 'No snack'}</span>
                </div>
            </div>
        </div>
    );
};

/* ============================================================
   FOOD SCREEN
   ============================================================ */
const FoodScreen = ({ day, update, config, onComplete, streak }) => {
    const suggested = config.snackRotation[dayOfWeek()] || 'Banana';
    const waterPts = [0.5, 1, 1.5, 2, 2.5, 3, 3.5];
    const mwL = parseMorningWater(day.morningWaterAmount);
    const foodLog = migrateFreeFoodLog(day.freeFoodLog);
    const isEvening = new Date().getHours() >= 20;

    const prevComplete = useRef(false);
    useEffect(() => {
        const complete = day.morningWater && day.eggs >= config.eggsTarget && day.curd;
        if (complete && !prevComplete.current) onComplete('food');
        prevComplete.current = complete;
    }, [day.morningWater, day.eggs, day.curd, config.eggsTarget]);

    const [logInput, setLogInput] = useState('');
    const [logTag, setLogTag] = useState('breakfast');
    const LOG_TAGS = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

    const addEntry = () => {
        const t = logInput.trim();
        if (!t) return;
        haptic();
        update({ freeFoodLog: [...foodLog, { text: t, tag: logTag }] });
        setLogInput('');
    };

    const removeEntry = (i) => {
        haptic(4);
        update({ freeFoodLog: foodLog.filter((_, idx) => idx !== i) });
    };

    const totalWater = (mwL + day.water).toFixed(1);

    return (
        <div className="screen">
            <div className="hd">
                <h1>NOMAD</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {streak > 0 && (
                        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', background: 'var(--amber-sf)', color: 'var(--amber-deep)', padding: '3px 8px', borderRadius: 100, border: '1px solid var(--amber)', fontWeight: 500 }}>
                            🔥 {streak}
                        </div>
                    )}
                    <div className="sub">{dayOfWeek()} · {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                </div>
            </div>

            <ProgressDots day={day} config={config} mode="food" />
            <PandaM message={getPandaFoodMessage(day, config)} />

            {/* Morning water */}
            <div className={`card ${day.morningWater ? 'done' : ''}`}>
                <div className="label">01 · Morning water</div>
                <div className="mw-row">
                    <Check on={day.morningWater} onClick={() => { haptic(); update({ morningWater: !day.morningWater }); }} />
                    <div className="txt">First glass of the day</div>
                    <input
                        className="mw-input"
                        placeholder="700ml"
                        value={day.morningWaterAmount}
                        onChange={(e) => update({ morningWaterAmount: e.target.value })}
                    />
                </div>
            </div>

            {/* Water total */}
            <div className="card">
                <div className="label">02 · Water total</div>
                <div className="water-big">{totalWater}<span className="u">L</span></div>
                <div className="water-target">
                    Target · {config.waterTarget}L
                    {mwL > 0 && <span style={{ marginLeft: 8, color: 'var(--txd)' }}>{mwL.toFixed(1)}L from morning</span>}
                </div>
                <div className="track">
                    {waterPts.filter(p => p <= config.waterTarget + 0.01).map((p) => {
                        const currentTotal = parseFloat((mwL + day.water).toFixed(1));
                        const isOn = Math.abs(currentTotal - p) < 0.05;
                        return (
                            <div
                                key={p}
                                className={`track-pt ${isOn ? 'on' : ''}`}
                                onClick={() => update({ water: isOn ? 0 : Math.max(0, parseFloat((p - mwL).toFixed(2))) })}
                            >
                                {p.toFixed(1)}L
                            </div>
                        );
                    })}
                </div>
                <div className="prog">
                    <div className="prog-fill" style={{ width: `${Math.min(100, ((mwL + day.water) / config.waterTarget) * 100)}%` }} />
                </div>
            </div>

            {/* Eggs */}
            <div className={`card ${day.eggs >= config.eggsTarget ? 'done' : ''}`}>
                <div className="label">03 · Eggs</div>
                <div className="row">
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>Protein base</div>
                        <div style={{ fontSize: 11, color: 'var(--txm)', marginTop: 2 }}>Target · {config.eggsTarget}</div>
                    </div>
                    <div className="stepper">
                        <button onClick={() => update({ eggs: Math.max(0, day.eggs - 1) })}>−</button>
                        <div className="val">{day.eggs}</div>
                        <button disabled={day.eggs >= config.eggsTarget} onClick={() => update({ eggs: day.eggs + 1 })}>+</button>
                        {day.eggs >= config.eggsTarget && <Check on={true} />}
                    </div>
                </div>
            </div>

            {/* Snack — simplified, no override */}
            <div className="card">
                <div className="label">04 · Evening snack</div>
                <div style={{ fontSize: 12, color: 'var(--txm)', marginBottom: 10 }}>
                    Today's pick · <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{suggested}</span>
                </div>
                <div
                    className={`tap-card ${day.snack === suggested ? 'on' : ''}`}
                    onClick={() => { haptic(); update({ snack: day.snack === suggested ? '' : suggested }); }}
                >
                    {day.snack === suggested ? `✓ ${suggested} logged` : `Tap to log ${suggested}`}
                </div>
            </div>

            {/* Curd */}
            <div className="card">
                <div className="label">05 · Curd</div>
                <div
                    className={`tap-card ${day.curd ? 'on' : ''}`}
                    onClick={() => { haptic(); update({ curd: !day.curd }); }}
                >
                    {day.curd ? '✓ Curd logged' : 'Tap when done'}
                </div>
            </div>

            {/* Free food log — flat running log with tags */}
            <div className="card">
                <div className="label">06 · Free food log</div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {LOG_TAGS.map(t => (
                        <div
                            key={t}
                            className={`pill ${logTag === t ? 'on' : ''}`}
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => setLogTag(t)}
                        >
                            {t[0].toUpperCase() + t.slice(1)}
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        className="inp"
                        placeholder="What did you eat?"
                        value={logInput}
                        onChange={(e) => setLogInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') addEntry(); }}
                        style={{ flex: 1 }}
                    />
                    <button
                        className="btn"
                        style={{ width: 'auto', marginTop: 0, padding: '0 14px', fontSize: 13 }}
                        onClick={addEntry}
                    >Add</button>
                </div>
                {foodLog.length > 0 && (
                    <div className="free-list" style={{ marginTop: 10 }}>
                        {foodLog.map((entry, i) => (
                            <div key={i} className="chip" style={{ background: 'var(--amber-sf)' }}>
                                <span style={{ fontSize: 10, opacity: 0.7, marginRight: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{entry.tag}</span>
                                · {entry.text}
                                <button onClick={() => removeEntry(i)}>×</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes — no mood, with confirm */}
            <div className={`card ${day.notesConfirmed ? 'confirmed' : ''}`}>
                <div className="label">07 · Notes</div>
                <div style={{ fontSize: 11, color: 'var(--txm)', marginBottom: 6 }}>Skin feel</div>
                <div className="pills" style={{ marginBottom: 10, opacity: day.notesConfirmed ? 0.6 : 1 }}>
                    {['oily', 'normal', 'dry'].map((k) => (
                        <div key={k} className={`pill ${day.skinFeelChip === k ? 'on' : ''}`}
                            onClick={() => !day.notesConfirmed && update({ skinFeelChip: day.skinFeelChip === k ? '' : k })}>
                            {k[0].toUpperCase() + k.slice(1)}
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--txm)', marginBottom: 6 }}>Energy</div>
                <div className="pills" style={{ marginBottom: 12, opacity: day.notesConfirmed ? 0.6 : 1 }}>
                    {['high', 'medium', 'low'].map((k) => (
                        <div key={k} className={`pill ${day.energyChip === k ? 'on' : ''}`}
                            onClick={() => !day.notesConfirmed && update({ energyChip: day.energyChip === k ? '' : k })}>
                            {k[0].toUpperCase() + k.slice(1)}
                        </div>
                    ))}
                </div>
                <textarea
                    className="inp"
                    placeholder="Anything else..."
                    value={day.notes}
                    readOnly={day.notesConfirmed}
                    onChange={(e) => !day.notesConfirmed && update({ notes: e.target.value })}
                />
                {!day.notesConfirmed
                    ? <button className="confirm-btn" onClick={() => { haptic(); update({ notesConfirmed: true }); }}>Confirm notes</button>
                    : <span className="saved-link" onClick={() => update({ notesConfirmed: false })}>✓ Saved · Edit</span>
                }
            </div>
        </div>
    );
};

/* ============================================================
   SKIN SCREEN
   ============================================================ */
const SkinScreen = ({ day, update, config, onComplete, streak }) => {
    const dow = dayOfWeek();
    const routine = (config.routines && config.routines[dow]) || { am: ['cleanser', 'niacinamide', 'sunscreen'], pm: ['cleanser'] };

    const [amOpen, setAmOpen] = useState(!day.amSkinDone);
    const [pmOpen, setPmOpen] = useState(day.amSkinDone && !day.pmSkinDone);
    const [amSteps, setAmSteps] = useState([false, false, false, false, false]);
    const [pmSteps, setPmSteps] = useState([false, false, false, false, false]);

    const phaseLabel = { 1: 'Phase 1 · 2×/wk', 2: 'Phase 2 · 3×/wk', 3: 'Phase 3 · nightly' }[config.retinolPhase];

    const amStepList = routine.am.map(k => ({ key: k, name: config.products[k] || k, kind: PRODUCT_LABELS[k] || k }));
    const pmStepList = routine.pm.map(k => ({ key: k, name: config.products[k] || k, kind: PRODUCT_LABELS[k] || k }));

    const amLabel = `Morning routine · ${routine.am.length} step${routine.am.length !== 1 ? 's' : ''}`;
    const pmLabel = `Evening routine · ${routine.pm.length} step${routine.pm.length !== 1 ? 's' : ''}`;

    const prevComplete = useRef(false);
    useEffect(() => {
        const complete = day.amSkinDone && day.pmSkinDone;
        if (complete && !prevComplete.current) onComplete('skin');
        prevComplete.current = complete;
    }, [day.amSkinDone, day.pmSkinDone]);

    const toggleAmStep = (i) => {
        const next = [...amSteps]; next[i] = !next[i]; setAmSteps(next);
        if (next.slice(0, amStepList.length).every(Boolean)) update({ amSkinDone: true });
    };
    const togglePmStep = (i) => {
        const next = [...pmSteps]; next[i] = !next[i]; setPmSteps(next);
        if (next.slice(0, pmStepList.length).every(Boolean)) update({ pmSkinDone: true });
    };

    return (
        <div className="screen">
            <div className="hd">
                <h1>NOMAD</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {streak > 0 && (
                        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', background: 'var(--teal-sf)', color: 'var(--teal-deep)', padding: '3px 8px', borderRadius: 100, border: '1px solid var(--teal)', fontWeight: 500 }}>
                            🔥 {streak}
                        </div>
                    )}
                    <div className="sub">{dow} · {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                </div>
            </div>

            <div className="skin-hd">
                <div className="date">Routine today</div>
                <div className="phase-badge">{phaseLabel}</div>
            </div>

            <ProgressDots day={day} config={config} mode="skin" />
            <Panda msg={getPandaSkinMessage(day, config)} mode="skin" />

            {/* AM Card */}
            <div className={`card ${day.amSkinDone ? 'skin-done' : ''}`}>
                <div className="coll-hd" onClick={() => setAmOpen(!amOpen)}>
                    <div className="t">
                        {day.amSkinDone && '✓ '}{amLabel.split(' · ')[0]}<span className="ct">{amLabel.split(' · ')[1]}</span>
                    </div>
                    <div className={`chev ${amOpen ? 'open' : ''}`}><Icon name="chev" /></div>
                </div>
                {amOpen && (
                    <div className="steps">
                        {amStepList.map((s, i) => (
                            <div key={i} className="step">
                                <Check on={amSteps[i] || day.amSkinDone} teal onClick={() => toggleAmStep(i)} />
                                <div className="info">
                                    <div className="name">{config.showProductNames ? s.name : s.kind}</div>
                                    <div className="kind">{s.kind}</div>
                                </div>
                            </div>
                        ))}
                        {!day.amSkinDone && (
                            <button className="btn teal" onClick={() => { haptic(10); update({ amSkinDone: true }); setAmSteps([true, true, true, true, true]); }}>
                                Mark AM done
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* PM Card */}
            <div className={`card ${day.pmSkinDone ? 'skin-done' : ''}`}>
                <div className="coll-hd" onClick={() => setPmOpen(!pmOpen)}>
                    <div className="t">
                        {day.pmSkinDone && '✓ '}{pmLabel.split(' · ')[0]}<span className="ct">{pmLabel.split(' · ')[1]}</span>
                    </div>
                    <div className={`chev ${pmOpen ? 'open' : ''}`}><Icon name="chev" /></div>
                </div>
                {pmOpen && (
                    <div className="steps">
                        {pmStepList.map((s, i) => (
                            <div key={i} className="step">
                                <Check on={pmSteps[i] || day.pmSkinDone} teal onClick={() => togglePmStep(i)} />
                                <div className="info">
                                    <div className="name">{config.showProductNames ? s.name : s.kind}</div>
                                    <div className="kind">{s.kind}</div>
                                </div>
                            </div>
                        ))}
                        {!day.pmSkinDone && (
                            <button className="btn teal" onClick={() => { haptic(10); update({ pmSkinDone: true }); setPmSteps([true, true, true, true, true]); }}>
                                Mark PM done
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Skin notes — with confirm */}
            <div className={`card ${day.skinNotesConfirmed ? 'confirmed' : ''}`}>
                <div className="label">Skin notes</div>
                <div style={{ fontSize: 11, color: 'var(--txm)', marginBottom: 6 }}>Skin today</div>
                <div className="pills" style={{ marginBottom: 10, opacity: day.skinNotesConfirmed ? 0.6 : 1 }}>
                    {['clear', 'breakouts', 'purging', 'oily', 'dry'].map((k) => (
                        <div key={k} className={`pill ${day.skinTodayChip === k ? 'on teal' : ''}`}
                            onClick={() => !day.skinNotesConfirmed && update({ skinTodayChip: day.skinTodayChip === k ? '' : k })}>
                            {k[0].toUpperCase() + k.slice(1)}
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--txm)', marginBottom: 6 }}>Retinol reaction</div>
                <div className="pills" style={{ marginBottom: 12, opacity: day.skinNotesConfirmed ? 0.6 : 1 }}>
                    {[['none', 'None'], ['mild', 'Mild dryness'], ['irritation', 'Irritation']].map(([k, l]) => (
                        <div key={k} className={`pill ${day.retinolReactionChip === k ? 'on teal' : ''}`}
                            onClick={() => !day.skinNotesConfirmed && update({ retinolReactionChip: day.retinolReactionChip === k ? '' : k })}>{l}</div>
                    ))}
                </div>
                <textarea
                    className="inp"
                    placeholder="Anything else about skin..."
                    value={day.skinNotes}
                    readOnly={day.skinNotesConfirmed}
                    onChange={(e) => !day.skinNotesConfirmed && update({ skinNotes: e.target.value })}
                />
                {!day.skinNotesConfirmed
                    ? <button className="confirm-btn teal" onClick={() => { haptic(); update({ skinNotesConfirmed: true }); }}>Confirm notes</button>
                    : <span className="saved-link" onClick={() => update({ skinNotesConfirmed: false })}>✓ Saved · Edit</span>
                }
            </div>
        </div>
    );
};

/* ============================================================
   LOG SCREEN
   ============================================================ */
const LogScreen = ({ allData, config }) => {
    const [monthOffset, setMonthOffset] = useState(0);
    const [activeDay, setActiveDay] = useState(null);
    const [exported, setExported] = useState(false);

    const viewDate = useMemo(() => {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() + monthOffset);
        return d;
    }, [monthOffset]);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const monthName = viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const dayLevel = (d) => {
        if (!d) return 0;
        let pts = 0;
        if (d.morningWater) pts++;
        const mwL = parseMorningWater(d.morningWaterAmount);
        if ((mwL + (d.water || 0)) >= config.waterTarget) pts++;
        if ((d.eggs || 0) >= config.eggsTarget) pts++;
        if (d.curd) pts++;
        if (d.amSkinDone) pts++;
        if (d.pmSkinDone) pts++;
        if (pts >= 6) return 4;
        if (pts >= 4) return 3;
        if (pts >= 2) return 2;
        if (pts >= 1) return 1;
        const log = migrateFreeFoodLog(d.freeFoodLog);
        if (d.snack || log.length || d.notes || d.skinNotes) return 1;
        return 0;
    };

    const streak = useMemo(() => {
        let s = 0;
        const d = new Date();
        while (true) {
            const key = d.toISOString().slice(0, 10);
            const rec = allData[key];
            if (rec && dayLevel(rec) > 0) { s++; d.setDate(d.getDate() - 1); }
            else break;
        }
        return s;
    }, [allData, config]);

    const daysTrackedThisMonth = useMemo(() => {
        const now = new Date();
        let c = 0;
        for (const k in allData) {
            const d = new Date(k + 'T12:00:00');
            if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && dayLevel(allData[k]) > 0) c++;
        }
        return c;
    }, [allData, config]);

    const completionPct = useMemo(() => {
        const now = new Date();
        const daysSoFar = now.getDate();
        let full = 0;
        for (let i = 1; i <= daysSoFar; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), i);
            const key = d.toISOString().slice(0, 10);
            if (allData[key] && dayLevel(allData[key]) >= 4) full++;
        }
        return Math.round((full / daysSoFar) * 100);
    }, [allData, config]);

    const avgWater = useMemo(() => {
        const now = new Date();
        let total = 0, count = 0;
        for (let i = 1; i <= now.getDate(); i++) {
            const k = new Date(now.getFullYear(), now.getMonth(), i).toISOString().slice(0, 10);
            const rec = allData[k];
            if (rec) {
                const mwL = parseMorningWater(rec.morningWaterAmount);
                total += mwL + (rec.water || 0);
                count++;
            }
        }
        return count > 0 ? (total / count).toFixed(1) : '—';
    }, [allData]);

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push({ empty: true, key: `e${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const key = date.toISOString().slice(0, 10);
        const rec = allData[key];
        const lvl = dayLevel(rec);
        const isToday = key === todayKey();
        cells.push({ d, key, lvl, isToday, rec });
    }

    const loadXLSX = () => new Promise((resolve, reject) => {
        if (window.XLSX) return resolve(window.XLSX);
        const s = document.createElement('script');
        s.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        s.onload = () => resolve(window.XLSX);
        s.onerror = reject;
        document.head.appendChild(s);
    });

    const exportData = async () => {
        // XLSX only
        try {
            const XLSX = await loadXLSX();
            const wb = XLSX.utils.book_new();

            // Daily sheet
            const hdr = ['Date', 'Day', 'Water (L)', 'Water target', 'Morning water', 'Eggs', 'Eggs target', 'Curd', 'Snack', 'Breakfast', 'Lunch', 'Dinner', 'Other food', 'Skin feel', 'Energy', 'AM skin', 'PM skin', 'AM products', 'PM products', 'Skin today', 'Retinol reaction', 'Notes', 'Skin notes'];
            const rows = [hdr];
            Object.keys(allData).sort().forEach((k) => {
                const d = allData[k];
                const dow2 = dayOfWeek(new Date(k + 'T12:00:00'));
                const mwL = parseMorningWater(d.morningWaterAmount);
                const log = migrateFreeFoodLog(d.freeFoodLog);
                const r2 = (config.routines && config.routines[dow2]) || { am: [], pm: [] };
                rows.push([
                    k, dow2,
                    parseFloat((mwL + (d.water || 0)).toFixed(2)),
                    config.waterTarget,
                    d.morningWaterAmount || '',
                    d.eggs || 0, config.eggsTarget,
                    d.curd ? 'yes' : 'no', d.snack || '',
                    log.filter(e => e.tag === 'breakfast').map(e => e.text).join('; '),
                    log.filter(e => e.tag === 'lunch').map(e => e.text).join('; '),
                    log.filter(e => e.tag === 'dinner').map(e => e.text).join('; '),
                    log.filter(e => e.tag === 'snack' || e.tag === 'other').map(e => e.text).join('; '),
                    d.skinFeelChip || '', d.energyChip || '',
                    d.amSkinDone ? 'yes' : 'no', d.pmSkinDone ? 'yes' : 'no',
                    r2.am.map(pk => config.products[pk] || pk).join(', '),
                    r2.pm.map(pk => config.products[pk] || pk).join(', '),
                    d.skinTodayChip || '', d.retinolReactionChip || '',
                    d.notes || '', d.skinNotes || '',
                ]);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Daily');

            // Config sheet
            const cfgRows = [['Key', 'Value']];
            cfgRows.push(['waterTarget', config.waterTarget], ['eggsTarget', config.eggsTarget], ['retinolPhase', config.retinolPhase], ['showProductNames', config.showProductNames]);
            Object.entries(config.products || {}).forEach(([k, v]) => cfgRows.push([`product.${k}`, v]));
            Object.entries(config.snackRotation || {}).forEach(([k, v]) => cfgRows.push([`snack.${k}`, v]));
            Object.entries(config.routines || {}).forEach(([day, r]) => {
                cfgRows.push([`routine.${day}.am`, r.am.join(', ')]);
                cfgRows.push([`routine.${day}.pm`, r.pm.join(', ')]);
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cfgRows), 'Config');

            const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const xlsxBlob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const xlsxUrl = URL.createObjectURL(xlsxBlob);
            const ax = document.createElement('a');
            ax.href = xlsxUrl; ax.download = `form-export-${todayKey()}.xlsx`;
            document.body.appendChild(ax); ax.click(); document.body.removeChild(ax);
            URL.revokeObjectURL(xlsxUrl);
        } catch (err) {
            console.error('XLSX export failed:', err);
        }

        setExported(true);
        setTimeout(() => setExported(false), 2000);
    };

    const renderDetail = (key, rec) => {
        const mwL = parseMorningWater(rec.morningWaterAmount);
        const totalW = (mwL + (rec.water || 0)).toFixed(1);
        const dow2 = dayOfWeek(new Date(key + 'T12:00:00'));
        const log = migrateFreeFoodLog(rec.freeFoodLog);
        const r2 = (config.routines && config.routines[dow2]) || { am: [], pm: [] };
        const amNames = r2.am.map(pk => config.products[pk] || PRODUCT_LABELS[pk] || pk).join(', ');
        const pmNames = r2.pm.map(pk => config.products[pk] || PRODUCT_LABELS[pk] || pk).join(', ');

        return (
            <>
                <div className="detail-section">
                    <div className="detail-section-lbl">Food</div>
                    <div className="detail-row"><span className="dk">Water</span><span className="dv">{totalW} / {config.waterTarget}L</span></div>
                    <div className="detail-row"><span className="dk">Eggs</span><span className="dv">{rec.eggs || 0} / {config.eggsTarget}</span></div>
                    <div className="detail-row"><span className="dk">Curd</span><span className="dv">{rec.curd ? '✓' : '—'}</span></div>
                    <div className="detail-row"><span className="dk">Snack</span><span className="dv">{rec.snack || '—'}</span></div>
                    {log.length > 0 && (
                        <div style={{ marginTop: 6 }}>
                            {['breakfast', 'lunch', 'dinner', 'snack', 'other'].map(tag => {
                                const items = log.filter(e => e.tag === tag).map(e => e.text);
                                if (!items.length) return null;
                                return <div key={tag} className="detail-row"><span className="dk" style={{ textTransform: 'capitalize' }}>{tag}</span><span className="dv">{items.join(', ')}</span></div>;
                            })}
                        </div>
                    )}
                    {(rec.skinFeelChip || rec.energyChip) && (
                        <div className="sum-chips" style={{ marginTop: 8, marginBottom: 0 }}>
                            {rec.skinFeelChip && <div className="sum-chip">Skin feel · {rec.skinFeelChip}</div>}
                            {rec.energyChip && <div className="sum-chip">Energy · {rec.energyChip}</div>}
                        </div>
                    )}
                    {rec.notes && <div style={{ fontSize: 12, color: 'var(--txm)', marginTop: 8, padding: '8px 10px', background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 8 }}>{rec.notes}</div>}
                </div>

                <div className="detail-section">
                    <div className="detail-section-lbl">Skin</div>
                    <div className="detail-row">
                        <span className="dk">AM</span>
                        <span className="dv">{rec.amSkinDone ? '✓' : '—'} {amNames && <span style={{ fontSize: 11, color: 'var(--txm)' }}>{amNames}</span>}</span>
                    </div>
                    <div className="detail-row">
                        <span className="dk">PM</span>
                        <span className="dv">{rec.pmSkinDone ? '✓' : '—'} {pmNames && <span style={{ fontSize: 11, color: 'var(--txm)' }}>{pmNames}</span>}</span>
                    </div>
                    {(rec.skinTodayChip || rec.retinolReactionChip) && (
                        <div className="sum-chips" style={{ marginTop: 8, marginBottom: 0 }}>
                            {rec.skinTodayChip && <div className="sum-chip">Skin today · {rec.skinTodayChip}</div>}
                            {rec.retinolReactionChip && <div className="sum-chip">Retinol · {rec.retinolReactionChip}</div>}
                        </div>
                    )}
                    {rec.skinNotes && <div style={{ fontSize: 12, color: 'var(--txm)', marginTop: 8, padding: '8px 10px', background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 8 }}>{rec.skinNotes}</div>}
                </div>
            </>
        );
    };

    return (
        <div className="screen">
            <div className="hd">
                <h1>Log</h1>
                <div className="sub">History</div>
            </div>

            <div className="stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="stat green"><div className="v">{streak}</div><div className="l">Streak</div></div>
                <div className="stat teal"><div className="v">{daysTrackedThisMonth}</div><div className="l">This month</div></div>
                <div className="stat amber"><div className="v">{completionPct}%</div><div className="l">Completion</div></div>
                <div className="stat" style={{ '--v-color': 'var(--teal-deep)' }}>
                    <div className="v" style={{ color: 'var(--teal-deep)' }}>{avgWater}{avgWater !== '—' ? 'L' : ''}</div>
                    <div className="l">Avg water</div>
                </div>
            </div>

            <div className="card">
                <div className="cal-hd">
                    <button onClick={() => setMonthOffset(monthOffset - 1)}>‹</button>
                    <div className="m">{monthName}</div>
                    <button onClick={() => setMonthOffset(Math.min(0, monthOffset + 1))}>›</button>
                </div>
                {Object.keys(allData).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--txm)' }}>
                        <div style={{ fontSize: 32, marginBottom: 10 }}>🌱</div>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>No data yet</div>
                        <div style={{ fontSize: 12 }}>Start logging on the Food and Skin tabs — your history will appear here.</div>
                    </div>
                ) : (
                    <div className="cal" key={monthOffset}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="cal-day-lbl">{d}</div>)}
                        {cells.map((c) => c.empty
                            ? <div key={c.key} className="cal-cell empty" />
                            : <div
                                key={c.key}
                                className={`cal-cell lvl${c.lvl} ${c.isToday ? 'today' : ''}`}
                                onClick={() => c.rec && setActiveDay({ key: c.key, rec: c.rec })}
                            >{c.d}</div>
                        )}
                    </div>
                )}
            </div>

            <button className={`btn ${exported ? 'green' : ''}`} onClick={exportData}>
                {exported ? 'Exported ✓' : 'Export data'}
            </button>

            {activeDay && (
                <div className="sheet" onClick={() => setActiveDay(null)}>
                    <div className="sheet-body" onClick={(e) => e.stopPropagation()}>
                        <div className="sheet-hd">
                            <h2>{new Date(activeDay.key + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                            <button onClick={() => setActiveDay(null)}>×</button>
                        </div>
                        {renderDetail(activeDay.key, activeDay.rec)}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ============================================================
   ROUTINE EDITOR (Settings sub-component)
   ============================================================ */
const RoutineEditor = ({ config, setConfig }) => {
    const [picker, setPicker] = useState(null); // { day, slot } | null

    const updateRoutine = (day, slot, keys) => {
        setConfig(sanitizeConfig({
            ...config,
            routines: {
                ...config.routines,
                [day]: { ...config.routines[day], [slot]: keys },
            },
        }));
    };

    return (
        <div className="set-row">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                const r = (config.routines && config.routines[day]) || { am: [], pm: [] };
                return (
                    <div key={day} className="routine-day-row">
                        <div className="routine-day-lbl">{day}</div>
                        {['am', 'pm'].map((slot) => {
                            const keys = r[slot] || [];
                            const pickerOpen = picker && picker.day === day && picker.slot === slot;
                            const available = PRODUCT_KEYS.filter(k => !keys.includes(k));
                            return (
                                <div key={slot} className="routine-sub">
                                    <div className="routine-sub-label">{slot.toUpperCase()}</div>
                                    <div style={{ flex: 1 }}>
                                        <div className="routine-chips">
                                            {keys.map((k, i) => (
                                                <div key={i} className="routine-chip">
                                                    {PRODUCT_LABELS[k] || k}
                                                    <button onClick={() => updateRoutine(day, slot, keys.filter((_, idx) => idx !== i))}>×</button>
                                                </div>
                                            ))}
                                            <div className="add-step-btn" onClick={() => setPicker(pickerOpen ? null : { day, slot })}>
                                                + Add
                                            </div>
                                        </div>
                                        {pickerOpen && (
                                            <div className="product-picker">
                                                {available.length > 0 ? available.map(k => (
                                                    <div key={k} className="product-picker-item" onClick={() => {
                                                        updateRoutine(day, slot, [...keys, k]);
                                                        setPicker(null);
                                                    }}>{PRODUCT_LABELS[k]}</div>
                                                )) : <span style={{ fontSize: 11, color: 'var(--txm)' }}>All added</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
};

/* ============================================================
   SETTINGS SCREEN
   ============================================================ */
const SettingsScreen = ({ config, setConfig, allData, setAllData }) => {
    const update = (patch) => setConfig(sanitizeConfig({ ...config, ...patch }));
    const updateProducts = (patch) => setConfig(sanitizeConfig({ ...config, products: { ...config.products, ...patch } }));
    const updateRotation = (day, val) => setConfig(sanitizeConfig({ ...config, snackRotation: { ...config.snackRotation, [day]: val } }));

    const [newSnack, setNewSnack] = useState('');
    const [restoreMsg, setRestoreMsg] = useState('');
    const [open, setOpen] = useState({ targets: true, skincare: false, routine: false, snackrot: false, snackopts: false, data: false });
    const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));
    const SecHd = ({ label, k }) => (
        <div onClick={() => toggle(k)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', marginBottom: open[k] ? 14 : 0 }}>
            <h3 style={{ margin: 0 }}>{label}</h3>
            <span style={{ fontSize: 20, lineHeight: 1, color: 'var(--txm)', fontWeight: 300, userSelect: 'none' }}>{open[k] ? '−' : '+'}</span>
        </div>
    );
    const fileRef = useRef(null);

    const handleBackup = () => {
        const json = JSON.stringify({ data: allData, config, version: 2 }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `form-backup-${todayKey()}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestore = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!parsed.data || !parsed.config) { setRestoreMsg('Invalid file ✗'); setTimeout(() => setRestoreMsg(''), 2500); return; }
                const mergedConfig = sanitizeConfig(parsed.config);
                const cleanData = sanitizeAllData(parsed.data);
                setAllData(cleanData);
                setConfig(mergedConfig);
                sbUpsertR("daily_logs", { id: "all_data", data: cleanData }, "routine:daily_logs");
                sbUpsertR("user_config", { id: "singleton", data: mergedConfig }, "routine:user_config");
                setRestoreMsg('Restored ✓');
                setTimeout(() => setRestoreMsg(''), 2500);
            } catch { setRestoreMsg('Failed to read ✗'); setTimeout(() => setRestoreMsg(''), 2500); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const [nukeStep, setNukeStep] = useState(0); // 0=idle, 1=confirming

    const handleNuke = () => {
        if (nukeStep === 0) { setNukeStep(1); return; }
        localStorage.removeItem('form_data');
        localStorage.removeItem('form_config');
        localStorage.removeItem(BANNERS_KEY);
        sbDeleteR("daily_logs", "all_data");
        sbDeleteR("user_config", "singleton");
        setAllData({});
        setConfig(DEFAULT_CONFIG);
        setNukeStep(0);
    };

    return (
        <div className="screen">
            <div className="hd">
                <h1>Settings</h1>
                <div className="sub">Configure</div>
            </div>

            {/* Appearance — FIRST */}
            {/* Targets */}
            <div className="sec">
                <SecHd label="Targets" k="targets" />
                {open.targets && <>
                <div className="set-row">
                    <div className="r">
                        <div>
                            <div className="lbl">Water target</div>
                            <div className="desc">Daily goal in litres</div>
                        </div>
                        <div className="stepper">
                            <button onClick={() => update({ waterTarget: Math.max(1.5, config.waterTarget - 0.5) })}>−</button>
                            <div className="val">{config.waterTarget}L</div>
                            <button onClick={() => update({ waterTarget: Math.min(5, config.waterTarget + 0.5) })}>+</button>
                        </div>
                    </div>
                </div>
                <div className="set-row">
                    <div className="r">
                        <div>
                            <div className="lbl">Egg target</div>
                            <div className="desc">Daily count</div>
                        </div>
                        <div className="stepper">
                            <button onClick={() => update({ eggsTarget: Math.max(1, config.eggsTarget - 1) })}>−</button>
                            <div className="val">{config.eggsTarget}</div>
                            <button onClick={() => update({ eggsTarget: Math.min(4, config.eggsTarget + 1) })}>+</button>
                        </div>
                    </div>
                </div>
                </>}
            </div>

            {/* Skincare */}
            <div className="sec">
                <SecHd label="Skincare" k="skincare" />
                {open.skincare && <>
                <div className="set-row">
                    <div className="lbl" style={{ marginBottom: 10 }}>Retinol phase</div>
                    <div className="seg">
                        {[1, 2, 3].map((p) => (
                            <button key={p} className={config.retinolPhase === p ? 'on' : ''} onClick={() => update({ retinolPhase: p })}>
                                {p === 1 ? '2×/wk' : p === 2 ? '3×/wk' : 'Nightly'}
                            </button>
                        ))}
                    </div>
                </div>
                {[['cleanser', 'Cleanser'], ['niacinamide', 'Niacinamide serum'], ['sunscreen', 'Sunscreen'], ['bhaSerum', 'BHA serum'], ['retinol', 'Retinol']].map(([k, label]) => (
                    <div key={k} className="set-row">
                        <div className="lbl" style={{ marginBottom: 6 }}>{label}</div>
                        <input className="inp" value={config.products[k]} onChange={(e) => updateProducts({ [k]: e.target.value })} />
                    </div>
                ))}
                <div className="set-row">
                    <div className="r">
                        <div>
                            <div className="lbl">Show product names</div>
                            <div className="desc">Off = show step types only</div>
                        </div>
                        <div className={`toggle ${config.showProductNames ? 'on' : ''}`} onClick={() => update({ showProductNames: !config.showProductNames })} />
                    </div>
                </div>
                </>}
            </div>

            {/* Skin routine */}
            <div className="sec">
                <SecHd label="Skin routine" k="routine" />
                {open.routine && <RoutineEditor config={config} setConfig={setConfig} />}
            </div>

            {/* Snack rotation */}
            <div className="sec">
                <SecHd label="Snack rotation" k="snackrot" />
                {open.snackrot && ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div key={d} className="set-row">
                        <div className="r">
                            <div className="lbl" style={{ width: 42 }}>{d}</div>
                            <input className="inp" value={config.snackRotation[d] || ''} onChange={(e) => updateRotation(d, e.target.value)} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Snack options */}
            <div className="sec">
                <SecHd label="Snack options" k="snackopts" />
                {open.snackopts && <div className="set-row">
                    <div className="free-list" style={{ marginBottom: 10 }}>
                        {config.snackOptions.map((s, i) => (
                            <div key={i} className="chip">
                                {s}
                                <button onClick={() => update({ snackOptions: config.snackOptions.filter((_, idx) => idx !== i) })}>×</button>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input className="inp" placeholder="Add snack..." value={newSnack} onChange={(e) => setNewSnack(e.target.value)} />
                        <button className="btn" style={{ width: 'auto', marginTop: 0, padding: '0 16px' }} onClick={() => {
                            if (newSnack.trim()) { update({ snackOptions: [...config.snackOptions, newSnack.trim()] }); setNewSnack(''); }
                        }}>Add</button>
                    </div>
                </div>}
            </div>

            {/* Data */}
            <div className="sec">
                <SecHd label="Data" k="data" />
                {open.data && <>
                <button className="btn ghost" onClick={handleBackup}>Backup data</button>
                <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleRestore} />
                <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => fileRef.current && fileRef.current.click()}>
                    {restoreMsg || 'Restore from backup'}
                </button>

                {nukeStep === 0 ? (
                    <button className="btn danger" onClick={handleNuke} style={{ marginTop: 8 }}>
                        Clear all data
                    </button>
                ) : (
                    <div style={{ marginTop: 8, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--rsm)', padding: '14px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 4 }}>Clear all data?</div>
                        <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 12 }}>This will permanently delete all your tracked days and reset settings. Cannot be undone.</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={handleNuke}
                                style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                            >
                                Yes, clear everything
                            </button>
                            <button
                                onClick={() => setNukeStep(0)}
                                style={{ flex: 1, background: 'var(--bg2)', color: 'var(--tx)', border: '1px solid var(--bd)', borderRadius: 8, padding: '10px', fontSize: 13, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                </>}
            </div>
        </div>
    );
};

/* ============================================================
   APP
   ============================================================ */
export default function RoutineApp({ darkMode = false, onTabChange }) {
    const [allData, setAllData] = useState(loadData);
    const [config, setConfig] = useState(loadConfig);
    const [activeTab, setActiveTab] = useState('food');
    const [toast, setToast] = useState(null);

    const handleTabChange = (t) => { setActiveTab(t); if (onTabChange) onTabChange(t); };

    useEffect(() => {
        if (document.getElementById('form-style')) return;
        const s = document.createElement('style');
        s.id = 'form-style';
        s.textContent = CSS;
        document.head.appendChild(s);
    }, []);

    useEffect(() => {
        const el = document.getElementById('nomad-routine');
        if (el) el.classList.toggle('dark', !!darkMode);
    }, [darkMode]);

    const [sbLoaded, setSbLoaded] = useState(false);

    // Load from Supabase on mount, fall back to localStorage
    useEffect(() => {
        const load = async () => {
            const [dbData, dbConfig] = await Promise.all([
                sbGetR("daily_logs", "all_data"),
                sbGetR("user_config", "singleton"),
            ]);
            if (dbData?.data) {
                const cleanData = sanitizeAllData(dbData.data);
                setAllData(cleanData);
                localStorage.setItem('form_data', JSON.stringify(cleanData));
            }
            if (dbConfig?.data) {
                try {
                    const merged = sanitizeConfig(dbConfig.data);
                    setConfig(merged);
                    localStorage.setItem('form_config', JSON.stringify(merged));
                } catch { }
            }
            setSbLoaded(true);
        };
        load();
    }, []);

    useEffect(() => {
        if (!sbLoaded) return;
        const cleanData = sanitizeAllData(allData);
        localStorage.setItem('form_data', JSON.stringify(cleanData));
        sbUpsertR("daily_logs", { id: "all_data", data: cleanData }, "routine:daily_logs");
    }, [allData, sbLoaded]);

    useEffect(() => {
        if (!sbLoaded) return;
        const cleanConfig = sanitizeConfig(config);
        localStorage.setItem('form_config', JSON.stringify(cleanConfig));
        sbUpsertR("user_config", { id: "singleton", data: cleanConfig }, "routine:user_config");
    }, [config, sbLoaded]);

    const key = todayKey();
    const rawDay = allData[key] || {};
    const day = sanitizeDayRecord(rawDay);
    const updateDay = (patch) => setAllData(prev => ({ ...prev, [key]: { ...day, ...patch } }));

    const appStreak = useMemo(() => {
        const dayLevel = (d) => {
            if (!d) return 0;
            let pts = 0;
            if (d.morningWater) pts++;
            const mwL = parseMorningWater(d.morningWaterAmount);
            if ((mwL + (d.water || 0)) >= config.waterTarget) pts++;
            if ((d.eggs || 0) >= config.eggsTarget) pts++;
            if (d.curd) pts++;
            if (d.amSkinDone) pts++;
            if (d.pmSkinDone) pts++;
            return pts;
        };
        let s = 0;
        const d = new Date();
        while (true) {
            const k = d.toISOString().slice(0, 10);
            const rec = allData[k];
            if (rec && dayLevel(rec) > 0) { s++; d.setDate(d.getDate() - 1); }
            else break;
        }
        return s;
    }, [allData, config]);

    const onComplete = (type) => {
        const banners = getBanners();
        const todayStr = todayKey();
        const bKey = type === 'food' ? 'foodBannerShown' : 'skinBannerShown';
        if (banners[bKey] === todayStr) return;
        banners[bKey] = todayStr;
        localStorage.setItem(BANNERS_KEY, JSON.stringify(banners));
        const id = Date.now();
        setToast({ type, id });
        setTimeout(() => setToast(prev => (prev && prev.id === id ? null : prev)), 2500);
    };

    return (
        <div id="nomad-routine">
            <div className="app" data-tab={activeTab}>
                {activeTab === 'food' && <FoodScreen day={day} update={updateDay} config={config} onComplete={onComplete} streak={appStreak} />}
                {activeTab === 'skin' && <SkinScreen day={day} update={updateDay} config={config} onComplete={onComplete} streak={appStreak} />}
                {activeTab === 'log' && <LogScreen allData={allData} config={config} />}
                {activeTab === 'settings' && <SettingsScreen config={config} setConfig={setConfig} allData={allData} setAllData={setAllData} />}

                {toast && (
                    <div
                        key={toast.id}
                        style={{
                            position: 'fixed',
                            top: 14,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 300,
                            animation: 'toastPill 2.5s ease forwards',
                            pointerEvents: 'none',
                        }}
                    >
                        <div style={{
                            padding: '10px 22px',
                            borderRadius: 100,
                            background: toast.type === 'food' ? 'var(--green)' : 'var(--teal)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                            fontFamily: 'var(--font)',
                        }}>
                            {toast.type === 'food' ? 'Food ritual complete ✓' : 'Skin ritual complete ✓'}
                        </div>
                    </div>
                )}

                <nav className="nav">
                    {[['food', 'Food'], ['skin', 'Skin'], ['log', 'Log'], ['settings', 'Settings']].map(([k, l]) => (
                        <button key={k} className={activeTab === k ? `active ${k}` : ''} onClick={() => handleTabChange(k)}>
                            <Icon name={k} />
                            {l}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
