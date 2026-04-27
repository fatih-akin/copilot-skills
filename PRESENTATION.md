# Copilot Chart Skills — Şirket Sunumu

## GitHub Copilot ile Konuşarak Veri Görselleştirme

---

## 1. Proje Özeti

Bu proje, GitHub Copilot üzerine inşa edilmiş **tek birleşik skill** içerir. Kullanıcıların herhangi bir CSV dosyasını doğal dil ile sorarak saniyeler içinde interaktif grafiklere dönüştürmesini sağlar.

Kodlama bilgisi gerekmez. Veri analizi deneyimi gerekmez. Sadece sorun — grafik gelsin.

---

## 2. Geliştirilen Birleşik Skill

### 2.1 `data-charting` — Uçtan Uca Tek Skill

> *"Bu veriden bana ülke bazlı organizasyon sayılarını gösteren bir grafik çiz."*

Kullanıcının tek bir cümleyle tam veri görselleştirme iş akışını başlatmasını sağlar.

**İş Akışı:**
```
CSV Dosyası → Şema Çıkarımı → Seçenek Önerisi → Kullanıcı Seçimi → Grafik Üretimi → HTML/PNG Artifact
```

**Özellikler:**
- Tek skill içinde analiz + öneri + build + render akışı
- 10.000+ satırlık büyük veri setlerini otomatik algılama (Large Dataset Mode)
- Gereksiz yüklemeleri önlemek için PNG base64'ü yalnızca istek üzerine üretme
- Sütun isimlerini icat etmeyen, yalnızca gerçek veriye dayalı kararlar
- Dönüşüm gerektiren grafik türlerinde kontrollü agregasyon

**Klasör Yapısı (Skill):**
- `.github/skills/data-charting/SKILL.md`
- `.github/skills/data-charting/references/ref1.md`
- `.github/skills/data-charting/scripts/*`
- `.github/skills/data-charting/scripts/built/dist/*` (paylaşım için build alınmış hali)

---

## 3. Teknik Altyapı

| Bileşen | Teknoloji |
|---|---|
| Dil | TypeScript (ESM) |
| Grafik Motoru | Vega-Lite v5 |
| Interaktif HTML | vega-embed CDN |
| Sunucu Tarafı Render | vega (Node.js) |
| Şema Çıkarımı | Özel `inferSchema` motoru |
| Grafik Öneri | Kural tabanlı `suggestChartOptions` |

### Desteklenen Grafik Türleri

| Tür | Kullanım Alanı |
|---|---|
| **Bar** | Kategorik karşılaştırma, sıralama |
| **Scatter** | İki sayısal alan arasındaki ilişki |
| **Histogram** | Sayısal dağılım analizi |
| **Boxplot** | Grup bazlı medyan/aykırı değer analizi |
| **Pie** | Oran/pay görselleştirme (Top-N filtresi ile) |
| **Heatmap** | İki kategorik alan × yoğunluk |
| **Timeline** | Gantt / zaman bazlı planlama |

---

## 4. Çözülen Gerçek Problemler

Bu oturumda üretilen artifact'lar gerçek iş senaryolarını yansıtır:

### 4.1 Organizasyon Verisi (`organizations-10000.csv` — 10.000 satır)

| Soru | Grafik | Artifact |
|---|---|---|
| Ülke bazlı kaç org var? | Bar (243 ülke) | `org-bar-country-count.html` |
| En çok olan 5 ülke hangi sektörlerde? | Stacked Bar | `org-bar-top5-country-industry.html` |
| Türkiye ve Uruguay'ın sektör dağılımı? | Heatmap | `org-heatmap-tr-uy-industry.html` |

**Elde edilen insight:** Congo (90 org), Korea (84), Argentina (58) en yoğun ülkeler. Türkiye'de 41, Uruguay'da 38 organizasyon.

### 4.2 Ürün Verisi (`products-1000.csv` — 1.000 satır)

| Soru | Grafik | Artifact |
|---|---|---|
| Fiyat dağılımı nasıl? | Scatter (Index × Price) | `products-1000-scatter-index-price.html` |
| Direkt bar görünümü | Bar | `products-1000-direct-bar.html` |

### 4.3 Uçak Bakım Verisi (`aircraft-maintenance-findings.csv`)

5 farklı grafik seçeneğinin tamamı üretildi: Line, Stacked Bar, Bar, Pie, Heatmap.

---

## 5. Değer Önerisi

### Zaman Tasarrufu

| Geleneksel Yöntem | Bu Skill ile |
|---|---|
| Python/Pandas öğren (günler) | 0 öğrenme eğrisi |
| Grafik kütüphanesi kur ve yönet | Hazır altyapı |
| Her analiz için kod yaz (saatler) | Doğal dil + saniyeler |
| HTML/CSS ile görsel hazırla | Otomatik üretim |

### Kapsadığı Kullanıcı Profilleri

- **Veri analistler** — Keşif analizini hızlandırır
- **Ürün yöneticileri** — Kod yazmadan veriyi görselleştirir
- **Satış/pazarlama ekipleri** — Müşteri verilerini sunum kalitesinde gösterir
- **Yöneticiler** — Karar destek grafikleri dakikalar içinde

### Ölçeklenebilirlik

- 10 satır ÷ 10.000 satır — aynı komut, otomatik uyarlama
- Yeni CSV → anında analiz, sıfır konfigürasyon
- Tarayıcı sınırları, canvas overflow, PNG kalitesi — tüm edge case'ler çözülü

---

## 6. Üretilen Çıktı Örnekleri

### Interaktif HTML
- Tooltip: her veri noktasına hover ile detay
- Zoom/Pan: büyük grafiklerde navigasyon
- Actions menüsü: PNG, SVG export; editör açma

### PNG (Raporlar İçin)
- Yüksek kalite, maksimum 3.000px genişlik
- Sunumlara, e-postalara, PDF raporlara direkt yapıştırılabilir

---

## 7. Mimari

```
Kullanıcı Sorusu (Doğal Dil)
        │
        ▼
   data-charting (tek skill)
        │
        ├─ loadTabularFile
        ├─ inferSchema
        ├─ suggestChartOptions
        ├─ generateVegaSpec
        │    ├─ buildGenericSpec
        │    ├─ buildHeatmapSpec
        │    ├─ buildHistogramSpec
        │    ├─ buildPieSpec
        │    └─ buildTimelineSpec
        └─ renderChartPreview
             ├─ HTML artifact
             └─ PNG artifact
```

---

## 8. Sonraki Adımlar (Öneriler)

1. **Yeni veri kaynakları** — Excel (.xlsx), JSON, API yanıtları için destek
2. **Çok dosya karşılaştırma** — İki CSV'yi aynı grafikte birleştirme
3. **Otomatik rapor üretimi** — Bir veri setinden tüm anlamlı grafikleri tek seferde üret
4. **Renk teması desteği** — Marka renklerine göre grafik paleti
5. **Paylaşım entegrasyonu** — Confluence, Notion, Slack'e direkt gönderim

---

## 9. MVP Kapsamı ve Genişleme Yol Haritası

### Mevcut MVP: CSV

Bu ilk sürüm (MVP) yalnızca **CSV dosyaları** üzerinde çalışmaktadır. Tüm temel iş akışı, şema çıkarımı, grafik öneri motoru ve render altyapısı bu format üzerinde test edilmiş ve kararlı hale getirilmiştir.

---

### Planlanan Veri Kaynakları

Aynı skill mimarisi, `loadTabularFile` aracının genişletilmesiyle aşağıdaki kaynaklardan da veri okuyabilir hale gelebilir — **grafik üretim zincirinin geri kalanı değişmeden çalışır.**

#### 📄 Excel (.xlsx / .xls)
- `xlsx` veya `exceljs` kütüphanesi ile sayfa okuma
- Çok sayfalı dosyalarda hangi sayfanın kullanılacağını sorma
- Hücre formatları (tarih, para birimi) şema çıkarımına dahil edilebilir

#### 🗂️ JSON
- Düz dizi (`[{...}, {...}]`) ve iç içe nesne desteği
- Alan düzleştirme (flatten) ile karmaşık yapılar normalize edilebilir
- REST API yanıtları doğrudan beslenebilir

#### 📋 XML
- `fast-xml-parser` ile tekrar eden eleman setlerinin satır dizisine dönüştürülmesi
- SOAP/XML tabanlı kurumsal sistemlerle entegrasyon

#### 🔌 MCP Database (Model Context Protocol)
- MCP sunucusu üzerinden SQL sorgusu çalıştırma (`mcp_azure_mcp_sql`, `mcp_azure_mcp_postgres`, `mcp_azure_mcp_cosmos` vb.)
- Kullanıcı doğal dil sorusu → SQL → grafik zinciri
- **Örnek:** *"Son 6 aydaki ülke bazlı satışları göster"* → MCP SQL query → bar chart
- Şema çıkarımı sorgu sonucu üzerinden otomatik yapılır — önceden tablo bilgisi gerekmez

---

### Mimari Karşılaştırması

```
MVP (Şimdi)                        Genişletilmiş (Sonraki)
──────────────────────────────     ────────────────────────────────────
CSV dosyası                        CSV │ Excel │ JSON │ XML │ MCP DB
       │                                          │
loadTabularFile ──────────────────── Adaptör katmanı (kaynak bazlı)
       │                                          │
inferSchema ──────────────────────────────────────┘
       │
suggestChartOptions → generateVegaSpec → renderChartPreview
       │
  HTML + PNG artifact  (değişmez)
```

Temel grafik üretim zinciri **tüm kaynak türleri için ortaktır** — yalnızca veri yükleme katmanı genişler.

---

*Bu sunum, [copilot-skills](.) projesinde geliştirilen skill'lerin Nisan 2026 itibarıyla mevcut durumunu yansıtmaktadır.*
