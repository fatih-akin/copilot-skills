# Copilot Chart Skills — Şirket Sunumu

## GitHub Copilot ile Konuşarak Veri Görselleştirme

---

## 1. Problem & Fırsat

Bugün bir ekip üyesi veriyi görmek istediğinde şu yolu izliyor:

1. Excel aç → pivot table kur → grafik sihirbazıyla boğuş
2. Ya da: Python/Pandas öğren → kütüphane kur → kod yaz → hata düzelt

Her iki yol da zaman alır, teknik engel koyar ve tekrar edilemez.

**Bu proje bu engeli kaldırıyor.**

> *"Bu CSV'den ülke bazlı organizasyon sayısını gösteren bir bar grafik çiz."*

Copilot bu cümleyi alıyor, veriyi analiz ediyor, en uygun grafik türünü öneriyor ve saniyeler içinde interaktif bir HTML artifact üretiyor. Kod yok. Ayar yok. Öğrenme eğrisi yok.

---

## 2. Çözüm: `data-charting` Skill

### Tek Skill, Uçtan Uca Akış

```
Kullanıcı Sorusu (Doğal Dil)
        │
        ▼
   data-charting
        │
        ├─ loadTabularFile      ← CSV'yi yükle ve ayrıştır
        ├─ inferSchema          ← Sütun tiplerini otomatik tespit et
        ├─ suggestChartOptions  ← Veriye uygun grafik seçenekleri sun
        ├─ generateVegaSpec     ← Vega-Lite spec üret
        │    ├─ buildGenericSpec    (bar, scatter, line, boxplot)
        │    ├─ buildHeatmapSpec
        │    ├─ buildHistogramSpec
        │    ├─ buildPieSpec
        │    └─ buildTimelineSpec
        └─ renderChartPreview   ← Çıktı üret
             ├─ HTML artifact   (interaktif, tarayıcıda açılır)
             └─ PNG artifact    (sunum, rapor, e-posta için)
```

Kullanıcı sadece bir cümle yazar — skill geri kalan her şeyi halleder.

---

## 3. Mevcut Özellikler (MVP — Nisan 2026)

### 3.1 Desteklenen Veri Kaynağı

| Kaynak | Durum |
|---|---|
| CSV | ✅ Destekleniyor |
| Excel (.xlsx) | Yol haritasında |
| JSON / REST API | Yol haritasında |
| MCP Database (SQL) | Yol haritasında |

### 3.2 Desteklenen Grafik Türleri

| Tür | Kullanım Alanı | Özel Özellik |
|---|---|---|
| **Bar** | Kategorik karşılaştırma, sıralama | Aggregated / Stacked mod |
| **Scatter** | İki sayısal alan arasındaki ilişki | |
| **Histogram** | Sayısal dağılım analizi | Otomatik bin hesabı |
| **Boxplot** | Grup bazlı medyan/aykırı değer | |
| **Pie** | Oran/pay görselleştirme | Top-N filtresi ile |
| **Heatmap** | İki kategori × yoğunluk | |
| **Timeline** | Gantt / zaman bazlı planlama | Başlangıç-bitiş alanları |

### 3.3 Akıllı Davranışlar

- **Large Dataset Mode:** 10.000+ satırlık dosyalar otomatik algılanır, agregasyon önerileri öne çıkar
- **Hallüsinasyon koruması:** Skill yalnızca CSV'de gerçekte var olan sütunları kullanır, sütun ismi uydurmaz
- **Verimli render:** PNG base64 yalnızca istek üzerine eklenir — büyük veri setlerinde context overflow önlenir
- **Kural tabanlı öneri motoru:** Sütun tipleri (sayısal, kategorik, tarih) analiz edilerek anlamlı grafik seçenekleri sıralanır

### 3.4 Çıktı Kalitesi

**İnteraktif HTML**
- Her veri noktasına hover ile tooltip
- Büyük grafiklerde zoom / pan
- Actions menüsü: PNG export, SVG export, editörde aç

**PNG (Raporlar İçin)**
- Yüksek çözünürlük, maksimum 3.000px genişlik
- Sunumlara, PDF raporlara, e-postalara direkt yapıştırılabilir

---

## 4. Teknik Altyapı

| Bileşen | Teknoloji |
|---|---|
| Dil | TypeScript (ESM) |
| Çalışma Zamanı | Node.js (MCP stdio sunucu) |
| Grafik Motoru | Vega-Lite v5 |
| İnteraktif HTML | vega-embed CDN |
| Sunucu Tarafı Render | vega (Node.js canvas) |
| Şema Çıkarımı | Özel `inferSchema` motoru |
| Grafik Öneri | Kural tabanlı `suggestChartOptions` |
| Entegrasyon | GitHub Copilot Skill (`.github/skills/`) |

Build çıktısı `.github/skills/data-charting/scripts/build/dist/` altına yazılır ve repository ile birlikte paylaşılır — kurulum gerekmez.

---

## 5. Gerçek Kullanım Örnekleri

### Organizasyon Verisi (10.000 satır)

| Kullanıcı Sorusu | Üretilen Grafik |
|---|---|
| *"Ülke bazlı organizasyon sayısını göster"* | Bar — 243 ülke |
| *"En kalabalık 5 ülkenin sektör dağılımı?"* | Stacked Bar |
| *"Türkiye ve Uruguay'ı sektör bazlı karşılaştır"* | Heatmap |

**Insight:** Congo (90), Korea (84), Argentina (58) en yoğun ülkeler. Türkiye'de 41, Uruguay'da 38 organizasyon.

### Ürün Verisi (1.000 satır)

| Kullanıcı Sorusu | Üretilen Grafik |
|---|---|
| *"Fiyat dağılımı nasıl görünüyor?"* | Scatter (Index × Price) |
| *"Kategori bazlı ürün sayısı?"* | Bar |

### Uçak Bakım Verisi

Tek istekle 5 farklı grafik seçeneği (Line, Stacked Bar, Bar, Pie, Heatmap) aynı anda sunuldu — kullanıcı seçti, artifact üretildi.

---

## 6. Değer Önerisi

### Zaman Tasarrufu

| Geleneksel Yöntem | Bu Skill ile |
|---|---|
| Python/Pandas öğren → saatler | 0 öğrenme eğrisi |
| Grafik kütüphanesi kur ve yönet | Hazır altyapı, sıfır konfigürasyon |
| Her analiz için kod yaz → saatler | Doğal dil → saniyeler |
| HTML/CSS ile görsel tasarla | Otomatik, sunum kalitesinde çıktı |

### Kapsadığı Kullanıcı Profilleri

- **Veri analistler** — Keşif analizini dramatik biçimde hızlandırır
- **Ürün yöneticileri** — Kod yazmadan metrik görselleştirir
- **Satış & pazarlama ekipleri** — Müşteri verilerini dakikalar içinde sunum haline getirir
- **Yöneticiler** — Karar destek grafikleri toplantıya girerken hazır

### Ölçeklenebilirlik

- 10 satır ile 10.000 satır arasında aynı komut, otomatik uyarlama
- Yeni CSV → anında analiz, sıfır konfigürasyon
- Edge case'ler çözülü: büyük veri setleri, canvas overflow, PNG boyut sınırları

---

## 7. Vizyon & Yol Haritası

Bu MVP, daha büyük bir hedefin ilk adımıdır:

> **Hedef:** Şirket içindeki her veriye, her kanaldan, doğal dille erişmek ve onu görselleştirmek.

### Faz 1 — Mevcut (CSV, Nisan 2026) ✅

Tüm temel altyapı: şema çıkarımı, grafik öneri motoru, 7 grafik türü, HTML/PNG artifact üretimi. Kararlı ve test edilmiş.

---

### Faz 2 — Veri Kaynaklarını Genişlet

Aynı grafik üretim zinciri değişmez — yalnızca `loadTabularFile` adaptörü genişler.

#### Excel (.xlsx / .xls)
- `exceljs` ile çok sayfalı dosya desteği
- Tarih ve para birimi formatları şema çıkarımına dahil
- Hangi sayfanın kullanılacağını kullanıcıya sorar

#### JSON / REST API
- Düz dizi ve iç içe nesne desteği, otomatik düzleştirme
- REST API yanıtları doğrudan beslenir

#### XML
- `fast-xml-parser` ile tekrar eden eleman setlerini satır dizisine dönüştürme
- Kurumsal SOAP/XML sistemleriyle entegrasyon

---

### Faz 3 — Veritabanına Doğal Dil ile Bağlan (MCP)

En büyük sıçrama: dosya yüklemek yerine doğrudan veritabanına konuş.

```
"Son 6 aydaki ülke bazlı satışları göster"
        │
        ▼
  MCP SQL sorgusu  (Postgres / Azure SQL / Cosmos DB)
        │
        ▼
  inferSchema → generateVegaSpec → renderChartPreview
        │
        ▼
  Bar chart artifact
```

- `mcp_azure_mcp_sql`, `mcp_azure_mcp_postgres`, `mcp_azure_mcp_cosmos` entegrasyonu
- Kullanıcı tablo şemasını bilmek zorunda değil — şema çıkarımı sorgu sonucundan otomatik yapılır
- Doğal dil → SQL → grafik zinciri tek bir Copilot konuşmasında tamamlanır

---

### Faz 4 — Kurumsal Özellikler

| Özellik | Açıklama |
|---|---|
| **Otomatik rapor üretimi** | Bir veri setinden tüm anlamlı grafikleri tek seferde üret |
| **Çok dosya karşılaştırma** | İki CSV'yi ya da iki dönem verisini aynı grafikte birleştir |
| **Marka teması** | Şirket renklerine göre grafik paleti desteği |
| **Paylaşım entegrasyonu** | Confluence, Notion, Slack'e artifact direkt gönderimi |
| **Kayıtlı sorgular** | Sık kullanılan grafikleri isimlendir ve tek komutla yeniden üret |

---

## 8. Mimari Evrimi

```
Faz 1 — MVP (Şimdi)
─────────────────────────────────────────────
CSV → loadTabularFile → inferSchema
   → suggestChartOptions → generateVegaSpec → renderChartPreview
   → HTML + PNG artifact


Faz 2+3 — Genişletilmiş
─────────────────────────────────────────────
CSV │ Excel │ JSON │ XML │ MCP DB (SQL)
         │
   Adaptör katmanı  (kaynak bazlı)
         │
   inferSchema  (değişmez)
         │
   suggestChartOptions → generateVegaSpec → renderChartPreview  (değişmez)
         │
   HTML + PNG artifact  (değişmez)
```

**Temel prensip:** Grafik üretim zincirinin tamamı kaynak türünden bağımsızdır. Her yeni veri kaynağı yalnızca bir adaptör eklemek demektir.

---

*Bu sunum, [copilot-skills](.) projesinde geliştirilen `data-charting` skill'inin Nisan 2026 itibarıyla mevcut durumunu ve ileriye dönük vizyonunu yansıtmaktadır.*
