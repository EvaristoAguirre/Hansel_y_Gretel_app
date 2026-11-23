import { describe, expect, it } from 'vitest';
import {
  formatTipAmount,
  parseTipInput,
  sanitizeTipInput,
  tipToEditString,
} from './tipInput';

function typeAmount(keys: string) {
  let display = '';
  for (const ch of keys) {
    display = sanitizeTipInput(display + ch);
  }
  const value = parseTipInput(display);
  return { display, value, shown: formatTipAmount(value) };
}

describe('tipInput', () => {
  it('toma el entero como pesos', () => {
    expect(typeAmount('550')).toEqual({
      display: '550',
      value: 550,
      shown: '550',
    });
  });

  it('550.00 queda en $550', () => {
    expect(typeAmount('550.00')).toEqual({
      display: '550.00',
      value: 550,
      shown: '550',
    });
  });

  it('550.75 queda en $550,75', () => {
    expect(typeAmount('550.75')).toEqual({
      display: '550.75',
      value: 550.75,
      shown: '550,75',
    });
  });

  it('no convierte los dígitos en centavos mientras se tipea', () => {
    expect(typeAmount('5').value).toBe(5);
    expect(typeAmount('50').value).toBe(50);
    expect(typeAmount('500').value).toBe(500);
    expect(typeAmount('1500').shown).toBe('1.500');
  });

  it('al volver a editar muestra el punto y no la coma', () => {
    expect(tipToEditString(550)).toBe('550');
    expect(tipToEditString(550.75)).toBe('550.75');
    expect(tipToEditString(0)).toBe('');
  });

  it('ignora un tercer decimal y letras', () => {
    expect(sanitizeTipInput('550.756')).toBe('550.75');
    expect(parseTipInput('$550.75abc')).toBe(550.75);
  });
});
