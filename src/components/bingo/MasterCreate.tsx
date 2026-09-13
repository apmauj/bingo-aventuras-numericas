// ============================================================
// Master Create Room Component
// ============================================================

'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PipoMascot } from './PipoMascot';
import { ArrowLeft, Plus } from 'lucide-react';
import { GAME_MODES, type GameMode } from '@/types/bingo';
import { MAX_NUMBER_VALUE, clampNumberValue } from '@/lib/bingo-config';

interface MasterCreateProps {
  onCreateRoom: (gridSize: number, numberRange: [number, number], mode: GameMode, freeCell: boolean) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function MasterCreate({ onCreateRoom, onBack, isLoading }: MasterCreateProps) {
  const [gridSize, setGridSize] = useState(3);
  const [numberRange, setNumberRange] = useState<[number, number]>([0, 100]);
  const [mode, setMode] = useState<GameMode>('classic');
  const [freeCell, setFreeCell] = useState(true); // default ON for 3×3 (odd)

  // ── Derived values (order matters: no forward references) ──

  // Helper: how many unique numbers are needed for a given size (accounting for ⭐ cell)
  const numbersNeededForSize = (size: number, withFreeCell: boolean) => {
    const hasFreeCell = withFreeCell && size % 2 === 1;
    return hasFreeCell ? size * size - 1 : size * size;
  };

  // Count available numbers for the selected mode and range
  const availableNumbers = useMemo(() => {
    const [min, max] = numberRange;
    let count = 0;
    for (let n = min; n <= max; n++) {
      if (mode === 'even' && n % 2 !== 0) continue;
      if (mode === 'odd' && n % 2 !== 1) continue;
      count++;
    }
    return count;
  }, [numberRange, mode]);

  // Description + viability for each grid size (dynamic based on freeCell + availableNumbers)
  const gridOptions = useMemo(() => {
    const opts = [
      { size: 3, label: '3×3' },
      { size: 4, label: '4×4' },
      { size: 5, label: '5×5' },
      { size: 6, label: '6×6' },
    ];
    return opts.map((opt) => {
      const hasStar = freeCell && opt.size % 2 === 1;
      const nums = numbersNeededForSize(opt.size, freeCell);
      const isViable = availableNumbers >= nums;
      return {
        ...opt,
        desc: hasStar ? `${nums} NÚMS + ⭐` : `${nums} NÚMEROS`,
        isViable,
        numbersNeeded: nums,
      };
    });
  }, [freeCell, availableNumbers]);

  // Keep the selected size usable without synchronizing state from an effect.
  // When the current range becomes too small, use the largest viable option
  // for the preview and the room creation payload.
  const effectiveGridSize = useMemo(() => {
    const currentOption = gridOptions.find((option) => option.size === gridSize);
    if (currentOption?.isViable) return gridSize;

    return gridOptions
      .filter((option) => option.isViable)
      .sort((a, b) => b.size - a.size)[0]?.size ?? gridSize;
  }, [gridOptions, gridSize]);

  const effectiveFreeCell = freeCell && effectiveGridSize % 2 === 1;

  // Calculate how many unique numbers are needed for current selection
  const numbersNeeded = useMemo(() => {
    return numbersNeededForSize(effectiveGridSize, effectiveFreeCell);
  }, [effectiveFreeCell, effectiveGridSize]);

  // Whether ⭐ toggle is available (only odd grids have a center cell)
  const canToggleFreeCell = effectiveGridSize % 2 === 1;

  // Validate range for current selection
  const rangeError = useMemo(() => {
    const [min, max] = numberRange;
    if (isNaN(min) || isNaN(max)) return 'INGRESÁ NÚMEROS VÁLIDOS';
    if (!Number.isInteger(min) || !Number.isInteger(max)) return 'INGRESÁ NÚMEROS ENTEROS';
    if (min < 0 || max < 0) return 'EL RANGO NO PUEDE CONTENER NÚMEROS NEGATIVOS';
    if (max > MAX_NUMBER_VALUE) return `EL MÁXIMO NO PUEDE SUPERAR ${MAX_NUMBER_VALUE.toLocaleString('es-ES')}`;
    if (min >= max) return 'EL MÍNIMO DEBE SER MENOR QUE EL MÁXIMO';
    if (mode === 'tens') {
      // Tens mode needs at least 2 decades
      const decades = new Set<number>();
      for (let n = min; n <= max; n++) {
        decades.add(Math.floor(n / 10) * 10);
      }
      if (decades.size < 2) return 'NECESITÁ AL MENOS 2 DECENAS EN EL RANGO';
      if (availableNumbers < numbersNeeded) {
        return `NO HAY SUFICIENTES NÚMEROS EN EL RANGO (NECESITA ${numbersNeeded}, HAY ${availableNumbers})`;
      }
    } else if (mode === 'sequence') {
      // Sequence mode needs at least 2 consecutive numbers
      if (max - min < 1) return 'NECESITÁ AL MENOS 2 NÚMEROS CONSECUTIVOS';
      if (availableNumbers < numbersNeeded) {
        return `NO HAY SUFICIENTES NÚMEROS EN EL RANGO (NECESITA ${numbersNeeded}, HAY ${availableNumbers})`;
      }
    } else if (availableNumbers < numbersNeeded) {
      const modeDesc = mode === 'even' ? ' PARES' : mode === 'odd' ? ' IMPARES' : '';
      return `NO HAY SUFICIENTES NÚMEROS${modeDesc} EN EL RANGO (NECESITA ${numbersNeeded}, HAY ${availableNumbers})`;
    }
    return null;
  }, [numberRange, numbersNeeded, availableNumbers, mode]);

  const canCreate = !rangeError && !isLoading;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-4 py-6">
      {/* Header */}
      <div className="w-full max-w-md flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-amber-100 transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5 text-amber-700" />
        </button>
        <h1 className="text-2xl font-bold text-amber-800">CREAR SALA</h1>
      </div>

      {/* Pipo */}
      <div className="mb-4 animate-pipo-breathe">
        <PipoMascot mood="happy" size={100} />
      </div>
      <p className="text-sm text-amber-600 mb-6 text-center">
        CONFIGURÁ LA PARTIDA PARA TUS ESTUDIANTES
      </p>

      <div className="w-full max-w-md space-y-6">
        {/* Game mode selector */}
        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">
            MODO DE JUEGO
          </label>
          <div className="grid grid-cols-3 gap-2">
            {GAME_MODES.map((m) => (
              <Card
                key={m.id}
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  mode === m.id
                    ? 'border-amber-500 bg-amber-50 shadow-md'
                    : 'border-gray-200 hover:border-amber-300'
                }`}
                onClick={() => setMode(m.id)}
                role="button"
                aria-pressed={mode === m.id}
                aria-label={`Modo ${m.label}`}
              >
                <CardContent className="flex flex-col items-center p-2">
                  <span className="text-xl mb-0.5">{m.emoji}</span>
                  <span className="text-xs font-bold text-amber-800">{m.label}</span>
                  <span className="text-[10px] text-amber-600 text-center mt-0.5 leading-tight">{m.desc}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Grid size selector */}
        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">
            TAMAÑO DEL CARTÓN
          </label>
          <div className="grid grid-cols-4 gap-2">
            {gridOptions.map((opt) => (
              <Card
                key={opt.size}
                className={`transition-all duration-200 border-2 ${
                  !opt.isViable
                    ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                    : effectiveGridSize === opt.size
                      ? 'border-amber-500 bg-amber-50 shadow-md cursor-pointer'
                      : 'border-gray-200 hover:border-amber-300 cursor-pointer'
                }`}
                onClick={() => {
                  if (opt.isViable) {
                    setGridSize(opt.size);
                    setFreeCell(opt.size % 2 === 1);
                  }
                }}
                role="button"
                aria-pressed={effectiveGridSize === opt.size && opt.isViable}
                aria-disabled={!opt.isViable}
                aria-label={`Cartón de ${opt.label}${!opt.isViable ? ' (rango insuficiente)' : ''}`}
              >
                <CardContent className="flex flex-col items-center p-2">
                  <span className={`text-xl font-bold ${opt.isViable ? 'text-amber-800' : 'text-gray-400'}`}>{opt.label}</span>
                  <span className={`text-[10px] text-center leading-tight ${opt.isViable ? 'text-amber-600' : 'text-gray-400'}`}>{opt.desc}</span>
                  {!opt.isViable && (
                    <span className="text-[9px] text-red-400 font-semibold mt-0.5">RANGO INSUFICIENTE</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ⭐ Star toggle */}
        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">
            ESTRELLA CENTRAL ⭐
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`cursor-pointer transition-all duration-200 border-2 ${
                effectiveFreeCell && canToggleFreeCell
                  ? 'border-emerald-400 bg-emerald-50 shadow-md'
                  : 'border-gray-200 hover:border-amber-300'
              } ${!canToggleFreeCell ? 'opacity-40 cursor-not-allowed' : ''}`}
              onClick={() => canToggleFreeCell && setFreeCell(true)}
              role="button"
              aria-pressed={effectiveFreeCell && canToggleFreeCell}
              aria-disabled={!canToggleFreeCell}
              aria-label="Con estrella"
            >
              <CardContent className="flex flex-col items-center p-2">
                <span className="text-lg">⭐</span>
                <span className="text-xs font-bold text-emerald-700">CON ESTRELLA</span>
                <span className="text-[10px] text-amber-600">CASILLA GRATIS</span>
              </CardContent>
            </Card>
            <Card
              className={`cursor-pointer transition-all duration-200 border-2 ${
                !effectiveFreeCell || !canToggleFreeCell
                  ? 'border-amber-400 bg-amber-50 shadow-md'
                  : 'border-gray-200 hover:border-amber-300'
              } ${!canToggleFreeCell ? 'opacity-40 cursor-not-allowed' : ''}`}
              onClick={() => canToggleFreeCell && setFreeCell(false)}
              role="button"
              aria-pressed={!effectiveFreeCell || !canToggleFreeCell}
              aria-disabled={!canToggleFreeCell}
              aria-label="Sin estrella"
            >
              <CardContent className="flex flex-col items-center p-2">
                <span className="text-lg">🔢</span>
                <span className="text-xs font-bold text-amber-800">SIN ESTRELLA</span>
                <span className="text-[10px] text-amber-600">TODOS NÚMEROS</span>
              </CardContent>
            </Card>
          </div>
          {!canToggleFreeCell && (
            <p className="text-[10px] text-amber-500 mt-1 text-center">
              LA ESTRELLA SOLO ESTÁ DISPONIBLE EN TABLEROS CON CASILLA CENTRAL (3×3, 5×5)
            </p>
          )}
        </div>

        {/* Number range */}
        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">
            RANGO DE NÚMEROS
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-amber-600">MÍNIMO</label>
              <input
                type="number"
                value={numberRange[0]}
                onChange={(e) => setNumberRange([clampNumberValue(Number.parseInt(e.target.value, 10)), numberRange[1]])}
                className="w-full h-10 rounded-lg border-2 border-amber-200 text-center font-bold text-amber-800 focus:border-amber-500 focus:outline-none"
                min={0}
                max={numberRange[1] - 1}
              />
            </div>
            <span className="text-amber-400 font-bold mt-4">A</span>
            <div className="flex-1">
              <label className="text-xs text-amber-600">MÁXIMO</label>
              <input
                type="number"
                value={numberRange[1]}
                onChange={(e) => setNumberRange([numberRange[0], clampNumberValue(Number.parseInt(e.target.value, 10))])}
                className="w-full h-10 rounded-lg border-2 border-amber-200 text-center font-bold text-amber-800 focus:border-amber-500 focus:outline-none"
                min={numberRange[0] + numbersNeeded}
                max={MAX_NUMBER_VALUE}
              />
            </div>
          </div>
          {/* Range validation error */}
          {rangeError && (
            <p className="text-red-500 text-xs font-semibold mt-2 text-center">
              ⚠ {rangeError}
            </p>
          )}
        </div>

        {/* Create button */}
        <Button
          onClick={() => canCreate && onCreateRoom(effectiveGridSize, numberRange, mode, effectiveFreeCell)}
          disabled={!canCreate}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Crear sala de bingo"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              CREANDO...
            </div>
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2" />
              CREAR SALA
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
