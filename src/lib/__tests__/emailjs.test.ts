import { describe, it, expect, vi, beforeEach } from 'vitest';

// EmailJS mock
vi.mock('@emailjs/browser', () => ({
  default: {
    send: vi.fn().mockResolvedValue({ status: 200, text: 'OK' }),
  },
}));

import emailjs from '@emailjs/browser';
import {
  sendFirmaBasvuruEmail,
  sendTalepEmail,
  sendTeklifEmail,
  sendTeklifKabulEmail,
  sendFirmaOnayEmail,
} from '../emailjs';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendFirmaBasvuruEmail', () => {
  it('doğru parametrelerle EmailJS.send çağrılır', async () => {
    await sendFirmaBasvuruEmail({
      firmaAdi: 'Test Firma',
      eposta: 'test@firma.com',
      telefon: '555-123',
      sehir: 'İstanbul',
      kategoriler: 'Prefabrik, Konteyner',
    });

    expect(emailjs.send).toHaveBeenCalledTimes(1);
    const [serviceId, templateId, params] = (emailjs.send as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(serviceId).toBe('service_3hiixen');
    expect(templateId).toBe('template_sdz7ml6');
    expect(params.name).toBe('Test Firma');
    expect(params.email).toBe('test@firma.com');
    expect(params.sehir).toBe('İstanbul');
  });
});

describe('sendTalepEmail', () => {
  it('talep bilgileriyle çağrılır', async () => {
    await sendTalepEmail({
      kategori: 'Prefabrik',
      sehir: 'Ankara',
      butce: '100k_250k',
      aciklama: 'Test talep',
      ad: 'Ali',
      telefon: '555-456',
      email: 'ali@test.com',
    });

    expect(emailjs.send).toHaveBeenCalledTimes(1);
    const params = (emailjs.send as ReturnType<typeof vi.fn>).mock.calls[0][2];
    expect(params.kategori).toBe('Prefabrik');
    expect(params.ad).toBe('Ali');
    expect(params.musteri_email).toBe('ali@test.com');
  });
});

describe('sendTeklifEmail', () => {
  it('teklif detaylarıyla çağrılır', async () => {
    await sendTeklifEmail({
      firmaAdi: 'Firma A',
      fiyat: 150000,
      teslimSuresi: '30 gün',
      aciklama: 'Teklif açıklaması',
      musteriAd: 'Ayşe',
      musteriEmail: 'ayse@test.com',
      talepId: 'talep123',
    });

    expect(emailjs.send).toHaveBeenCalledTimes(1);
    const params = (emailjs.send as ReturnType<typeof vi.fn>).mock.calls[0][2];
    expect(params.name).toBe('Firma A');
    expect(params.musteri_email).toBe('ayse@test.com');
    expect(params.aciklama).toContain('150.000');
    expect(params.aciklama).toContain('30 gün');
  });
});

describe('sendTeklifKabulEmail', () => {
  it('kabul bilgileriyle firmaya mail gönderir', async () => {
    await sendTeklifKabulEmail({
      firmaEmail: 'firma@test.com',
      firmaAdi: 'Firma B',
      musteriAd: 'Mehmet',
      musteriTel: '555-789',
      musteriEmail: 'mehmet@test.com',
      fiyat: 200000,
    });

    expect(emailjs.send).toHaveBeenCalledTimes(1);
    const params = (emailjs.send as ReturnType<typeof vi.fn>).mock.calls[0][2];
    expect(params.email).toBe('firma@test.com');
    expect(params.aciklama).toContain('kabul etti');
    expect(params.aciklama).toContain('200.000');
  });
});

describe('sendFirmaOnayEmail', () => {
  it('onay sonrası firmaya doğru e-posta gönderir', async () => {
    await sendFirmaOnayEmail({
      firmaEmail: 'firma@test.com',
      firmaAdi: 'Onaylanan Firma',
    });

    expect(emailjs.send).toHaveBeenCalledTimes(1);
    const [serviceId, templateId, params, publicKey] = (emailjs.send as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(serviceId).toBe('service_3hiixen');
    expect(templateId).toBe('template_sdz7ml6');
    expect(publicKey).toBe('4egUQ3U8O6eFOn0aY');
    expect(params.email).toBe('firma@test.com');
    expect(params.musteri_email).toBe('firma@test.com');
    expect(params.name).toBe('Onaylanan Firma');
    expect(params.aciklama).toContain('onaylandı');
    expect(params.aciklama).toContain('firma-paneli');
    expect(params.kategori).toBe('Firma Onayı');
  });

  it('EmailJS hata fırlatırsa reject eder', async () => {
    (emailjs.send as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    await expect(
      sendFirmaOnayEmail({ firmaEmail: 'x@x.com', firmaAdi: 'X' }),
    ).rejects.toThrow('Network error');
  });
});
