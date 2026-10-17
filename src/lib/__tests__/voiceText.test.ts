/**
 * Cümleyi ses parçalarına bölme kuralı.
 *
 * Bu kural hem ses üretirken (scripts/voice/collect.ts) hem de çalarken (src/lib/voice.ts)
 * kullanılıyor. İkisi birebir aynı sonucu vermezse dosya adları tutmaz ve ses çalmaz;
 * o yüzden burada sıkı tutuluyor.
 */
import { describe, expect, it } from 'vitest';
import { readable } from '../speech';
import { clipKey, sayilariYaziyaCevir, sayiyiYaz, splitForVoice } from '../voiceText';
import { makeWordProblem } from '../../problems/word';
import { tricks } from '../../tricks';
import { BANDS } from '../../tricks/types';

const says = (t: string) => splitForVoice(t).flatMap((x) => ('say' in x ? [x.say] : []));

describe('ses parçalama', () => {
  it('sayıyı ve ekini tek parça sayar', () => {
    expect(says("20'nin yarısı 10")).toEqual(["20'nin", 'yarısı', '10']);
  });

  it('işlemi öbek öbek böler: sayı + peşindeki işlem kelimesi', () => {
    // Asıl mesele bu: "7" "artı" "5" diye tek tek seslendirilirse her biri ayrı cümle
    // tonlamasıyla okunur ve birleşince kopuk duyulur.
    expect(says('7 artı 5 eşittir kaç')).toEqual(['7 artı', '5 eşittir kaç']);
    expect(says('Önce iki katını al: 4 artı 4 eşittir kaç')).toEqual([
      'Önce iki katını al:',
      '4 artı',
      '4 eşittir kaç',
    ]);
    expect(says('80 bölü 2 eşittir kaç')).toEqual(['80 bölü', '2 eşittir kaç']);
  });

  it('cümle sonundaki "kaç" bir sonraki işleme yapışmaz', () => {
    expect(says('Kaç kaldı kaç 9 artı 1 eşittir kaç')).toEqual([
      'Kaç kaldı kaç',
      '9 artı',
      '1 eşittir kaç',
    ]);
  });

  it('noktalamayı okumaz, yerine duraklama koyar', () => {
    expect(splitForVoice('5 , 6')).toEqual([{ say: '5' }, { pause: 230 }, { say: '6' }]);
    expect(says('3 → 4')).toEqual(['3', '4']);
  });

  it('sayısız cümleyi tek parça bırakır', () => {
    expect(says('Hadi başlayalım!')).toEqual(['Hadi başlayalım!']);
  });

  it('eksi sayıları bölmez', () => {
    expect(says('−5 artı 3')).toEqual(['−5 artı', '3']);
  });

  it('aynı metin hep aynı dosya adını verir, farklı metinler farklı', () => {
    expect(clipKey('artı')).toBe(clipKey('artı'));
    expect(clipKey('artı')).not.toBe(clipKey('eksi'));
    expect(clipKey('10')).not.toBe(clipKey("10'a"));
  });

  it('hiçbir harf ya da rakam kaybolmaz', () => {
    const önemli = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '');
    const dene = (s: string) => expect(says(s).map(önemli).join('')).toBe(önemli(s));

    for (const tr of tricks) {
      dene(readable(tr.idea));
      for (let lvl = 1; lvl <= 3; lvl++)
        for (let i = 0; i < 60; i++) {
          const p = tr.make(lvl);
          if (p.ask) dene(readable(p.ask));
          for (const st of p.steps) dene(readable(`${st.say} ${st.eq}`));
        }
    }
    for (const b of BANDS)
      for (let i = 0; i < 300; i++) {
        const wp = makeWordProblem(b.id);
        dene(readable(wp.text));
        for (const st of wp.steps) dene(readable(`${st.say} ${st.eq}`));
      }
  });

  it('her parça boş değil ve baştan sona boşluksuz', () => {
    for (const tr of tricks)
      for (let i = 0; i < 100; i++)
        for (const st of tr.make(2).steps)
          for (const part of says(readable(`${st.say} ${st.eq}`))) {
            expect(part).not.toBe('');
            expect(part).toBe(part.trim());
          }
  });
});

describe('sayıları yazıya çevirme', () => {
  it('temel sayılar', () => {
    expect(sayiyiYaz(0)).toBe('sıfır');
    expect(sayiyiYaz(7)).toBe('yedi');
    expect(sayiyiYaz(12)).toBe('on iki');
    expect(sayiyiYaz(60)).toBe('altmış');
    expect(sayiyiYaz(100)).toBe('yüz');
    expect(sayiyiYaz(148)).toBe('yüz kırk sekiz');
    expect(sayiyiYaz(1000)).toBe('bin');
    expect(sayiyiYaz(2024)).toBe('iki bin yirmi dört');
    expect(sayiyiYaz(-5)).toBe('eksi beş');
  });

  it('Türkçe ekleri korur', () => {
    expect(sayilariYaziyaCevir("20'nin")).toBe('yirminin');
    expect(sayilariYaziyaCevir("10'a")).toBe('ona');
    expect(sayilariYaziyaCevir("6'yı")).toBe('altıyı');
    expect(sayilariYaziyaCevir("13'ten")).toBe('on üçten');
  });

  it('ünsüz yumuşamasını uygular: dört → dörd-', () => {
    expect(sayilariYaziyaCevir("4'e")).toBe('dörde');
    expect(sayilariYaziyaCevir("4'ü")).toBe('dördü');
    // sessiz harfle başlayan ekte yumuşama olmaz
    expect(sayilariYaziyaCevir("4'ten")).toBe('dörtten');
  });

  it('cümle içindeki bütün sayıları çevirir', () => {
    expect(sayilariYaziyaCevir('7 artı')).toBe('yedi artı');
    expect(sayilariYaziyaCevir('60 eksi 6 eşittir kaç')).toBe('altmış eksi altı eşittir kaç');
  });
});
