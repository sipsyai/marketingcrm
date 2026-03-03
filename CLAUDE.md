# Marketing CRM - AI-Powered Customer Relationship Management

> Modern, scalable CRM solution built with Next.js 15, React 19, and dynamic custom field architecture

## 📋 İçindekiler

- [Proje Özeti](#-proje-özeti)
- [Teknoloji Stack](#-teknoloji-stack)
- [Kimlik Bilgileri](#-kimlik-bilgileri)
- [Kurulum](#-kurulum)
- [Database Yapısı](#-database-yapısı)
- [Klasör Yapısı](#-klasör-yapısı)
- [Özellikler](#-özellikler)
- [UI Components](#-ui-components)
- [API Routes](#-api-routes)

---

## 🎯 Proje Özeti

Marketing CRM, modern işletmelerin müşteri ilişkilerini yönetmesi için geliştirilmiş, tamamen özelleştirilebilir bir CRM platformudur.

### Ana Özellikler
- ✅ **Dynamic Custom Fields:** Lead ve Investor için sınırsız özel alan oluşturma
- ✅ **Form Layout Configurator:** Drag & drop ile form düzenleme
- ✅ **Real-time Filtering:** Gelişmiş filtreleme ve arama
- ✅ **Responsive Design:** Tüm cihazlarda mükemmel görünüm
- ✅ **Type-Safe:** TypeScript ile güvenli geliştirme

---

## 🛠 Teknoloji Stack

### Frontend
| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| **Next.js** | 15.5.4 | App Router, Server Components, API Routes |
| **React** | 19.1.0 | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **Tailwind CSS** | 4.x | Styling Framework |
| **shadcn/ui** | Latest | UI Component Library (New York Style) |

### Backend & Database
| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| **Prisma ORM** | 6.16.3 | Database ORM |
| **MySQL** | 8.0 | Database |
| **NextAuth** | 5.0.0-beta.29 | Authentication |
| **Zod** | 4.1.11 | Schema Validation |

### UI & Form Libraries
| Teknoloji | Kullanım |
|-----------|----------|
| **Radix UI** | Headless UI Components |
| **Lucide React** | Icon Library |
| **Framer Motion** | Animations |
| **React Hook Form** | Form Management |
| **@dnd-kit** | Drag & Drop |
| **Recharts** | Charts & Analytics |
| **Sonner** | Toast Notifications |

---

## 🔐 Kimlik Bilgileri

### Application Login
```
Email: admin@example.com
Password: password
URL: http://localhost:3000/login
```

### Database Credentials (Docker)
```yaml
Container Name: crm_mysql
Database: crm_single
Port: 3308 (host) → 3306 (container)

Users:
  - Root: root / root
  - App User: crm_user / secret
```

### Environment Variables
```env
DATABASE_URL="mysql://crm_user:secret@localhost:3308/crm_single"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"
```

### Production Server (Deploy)
```yaml
Server IP: 192.168.1.23
User: ali
Project Path: /home/ali/marketingcrm
Port: 5007
Process Manager: PM2 (name: marketingcrm)
Public URL: https://crm.sipsy.ai
```

**Deploy Komutu (SSH ile):**
```bash
# Python paramiko ile bağlan (192.168.1.23, ali)
cd /home/ali/marketingcrm && git pull origin main
cd /home/ali/marketingcrm && npm run build
# PM2 restart - PORT env değişkeni gerekli
cd /home/ali/marketingcrm && pm2 restart marketingcrm --update-env
# Eğer pm2 process yoksa veya errored ise:
# pm2 delete marketingcrm; cd /home/ali/marketingcrm && PORT=5007 pm2 start npm --name marketingcrm -- start
```

**Önemli Notlar:**
- Port 3000 başka uygulama (Gardenhaus) tarafından kullanılıyor, CRM port **5007**'de çalışır
- PM2 restart yaparken eski process port'u tutabilir, `pm2 delete` + yeniden başlatma gerekebilir
- Sunucudaki `.env` dosyasında `NEXTAUTH_URL="https://crm.sipsy.ai"` ayarlı

---

## 🚀 Kurulum

### 1. Gereksinimler
- Node.js 20+
- Docker & Docker Compose
- npm veya yarn

### 2. Kurulum Adımları

```bash
# 1. Repository'yi klonlayın
git clone <repo-url>
cd marketingcrm

# 2. Bağımlılıkları yükleyin
npm install

# 3. Docker ile MySQL'i başlatın
docker-compose up -d

# 4. Environment dosyasını oluşturun
cp .env.example .env
# .env dosyasını düzenleyin

# 5. Prisma migration'ı çalıştırın
npx prisma generate
npx prisma db push

# 6. Seed data'yı yükleyin (opsiyonel)
npx tsx scripts/seed-lead-form-sections.ts
npx tsx scripts/seed-investor-form-sections.ts
npx tsx scripts/seed-investor-system-fields.ts

# 7. Development server'ı başlatın
npm run dev
```

### 3. Erişim
- **Application:** http://localhost:3000
- **Database:** localhost:3308
- **MySQL Container:** `docker exec -it crm_mysql mysql -u crm_user -psecret crm_single`

---

## 🗄 Database Yapısı

### Ana Tablolar

#### 1. **users**
Sistem kullanıcıları - Dual kullanım:
- **Login & Authentication:** CRM çalışanları sisteme giriş yapar
- **Assignment:** Lead, Investor ve Activity'lere atanabilir
```
- id, name, email, password
- phone, tc_no, address
- status, created_at, updated_at

İlişkiler:
- activitiesCreated[] - Oluşturduğu aktiviteler (user_id)
- activitiesAssigned[] - Atanan aktiviteler (assigned_to)
- branchesManaged[] - Yönettiği şubeler (manager_id)
- notesCreated[] - Oluşturduğu notlar
```

#### 2. **leads**
Potansiyel müşteriler
```
- id, full_name, email, phone, phone_country
- source, status, priority
- notes_text
- created_at, updated_at
```

#### 3. **investors**
Yatırımcılar
```
- id, first_name, last_name, email
- phone (UNIQUE), company, position
- source, status, priority
- budget, timeline, notes
- created_at, updated_at
```

#### 4. **activities**
Lead ve Investor aktiviteleri
```
- id, type, subject, description
- status (pending, completed, cancelled)
- lead_id, investor_id (foreign keys)
- user_id - Aktiviteyi oluşturan user (creator)
- assigned_to - Aktiviteye atanan user (assignee)
- activity_type_id, activity_date
- scheduled_at, completed_at
- created_at, updated_at

Not: user_id ve assigned_to aynı kişi olabilir veya farklı olabilir
- Ali (user) bir aktivite oluşturur (user_id = Ali)
- Aktivite Mehmet'e atanır (assigned_to = Mehmet)
```

### Dynamic Field System

#### Lead Fields
```sql
lead_fields
- id, name, label, type
- is_required, is_active, is_system_field
- sort_order, section_key
- placeholder, help_text, default_value
- validation_rules, options

lead_field_options
- id, lead_field_id, value, label
- sort_order, is_active

lead_field_values
- id, lead_id, lead_field_id, value

lead_form_sections
- id, section_key, name
- is_visible, is_default_open
- sort_order, icon, gradient
```

#### Investor Fields
```sql
investor_fields
- id, name, label, type
- is_required, is_active, is_system_field
- sort_order, section_key
- placeholder, help_text, default_value

investor_field_options
- id, investor_field_id, value, label
- sort_order, is_active

investor_field_values
- id, investor_id, investor_field_id, value

investor_form_sections
- id, section_key, name
- is_visible, is_default_open
- sort_order, icon, gradient
```

### Field Types
- `text` - Tek satır metin
- `textarea` - Çok satırlı metin
- `email` - Email
- `phone` - Telefon
- `url` - URL
- `number` - Sayı
- `date` - Tarih
- `select` - Dropdown seçim
- `multiselect` - Çoklu seçim (checkbox)
- `multiselect_dropdown` - Çoklu seçim (dropdown)

---

## 📁 Klasör Yapısı

```
marketingcrm/
├── app/
│   ├── (dashboard)/          # Dashboard layout group
│   │   ├── dashboard/        # Ana dashboard
│   │   ├── leads/            # Lead yönetimi
│   │   │   ├── page.tsx      # Lead listesi
│   │   │   ├── new/          # Yeni lead
│   │   │   └── [id]/         # Lead detay/edit
│   │   ├── investors/        # Investor yönetimi
│   │   │   ├── page.tsx      # Investor listesi
│   │   │   ├── new/          # Yeni investor
│   │   │   └── [id]/         # Investor detay
│   │   ├── tasks/            # Görevler
│   │   ├── activities/       # Aktiviteler
│   │   ├── reports/          # Raporlar
│   │   └── settings/         # Ayarlar
│   │       ├── lead-fields/  # Lead field yönetimi
│   │       └── investor-fields/ # Investor field yönetimi
│   ├── api/                  # API Routes
│   │   ├── auth/             # NextAuth
│   │   ├── leads/            # Lead API
│   │   ├── investors/        # Investor API
│   │   └── settings/         # Settings API
│   ├── login/                # Login sayfası
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
│
├── components/
│   ├── ui/                   # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── table.tsx
│   │   └── ...
│   ├── dashboard/            # Dashboard components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── stats.tsx
│   ├── leads/                # Lead components
│   │   ├── lead-form-client.tsx
│   │   ├── leads-table-with-filters.tsx
│   │   ├── add-lead-button.tsx
│   │   └── ...
│   ├── investors/            # Investor components
│   │   ├── investor-form-client.tsx
│   │   ├── investors-table-with-filters.tsx
│   │   ├── add-investor-button.tsx
│   │   └── ...
│   ├── settings/             # Settings components
│   │   ├── lead-fields-client.tsx
│   │   ├── investor-fields-client.tsx
│   │   ├── field-form-dialog.tsx
│   │   └── form-view-configurator.tsx
│   └── fields/               # Dynamic field components
│       └── dynamic-field.tsx
│
├── lib/
│   ├── prisma.ts             # Prisma client
│   ├── auth-config.ts        # NextAuth config
│   └── utils.ts              # Utility functions
│
├── prisma/
│   └── schema.prisma         # Database schema
│
├── scripts/                  # Seed scripts
│   ├── seed-lead-form-sections.ts
│   ├── seed-investor-form-sections.ts
│   └── seed-investor-system-fields.ts
│
├── docker-compose.yml        # Docker setup
├── components.json           # shadcn/ui config
└── package.json
```

---

## ✨ Özellikler

### 1. Dynamic Custom Fields

#### Lead Fields Management
- **Lokasyon:** `/settings/lead-fields`
- **Özellikler:**
  - Form Layout Configurator: Drag & drop ile section düzenleme
  - Properties Management: Field CRUD işlemleri
  - Field Types: 10+ farklı field tipi
  - Field Options: Select/multiselect için option yönetimi
  - Validation Rules: Custom validation

#### Investor Fields Management
- **Lokasyon:** `/settings/investor-fields`
- **Özellikler:**
  - Lead fields ile aynı özellikler
  - Investor-specific fields (Source, Status, Priority)
  - Investment Amount tracking

### 2. Lead Management

#### Lead List (`/leads`)
- Gelişmiş filtreleme (Source, Status, Priority)
- **Assigned To filtreleme** - Kullanıcıya atanmış lead'ler
- Custom field filtreleri
- Arama (name, email, phone)
- **User Assignment** - Lead'leri kullanıcılara atama
- Pagination
- Quick actions

#### Create Lead (`/leads/new`)
- **Contact Information (Statik):**
  - Full Name (required)
  - Email (required, unique)
  - Phone (required, unique)

- **Lead Details (Dinamik):**
  - lead_fields tablosundan gelen tüm alanlar
  - Form completion tracking
  - Auto-save draft (opsiyonel)

**Note:** Separate edit page route does not exist. Editing is done via API calls from client components.

#### Lead Detail (`/leads/[id]`) - Modern UI ✨
**Lokasyon:** `/leads/[id]/page.tsx` + `components/leads/lead-detail-view.tsx`

**Modern Hero Header:**
- Gradient background (blue-indigo-purple)
- Large avatar with initials
- Status, Priority, Source badges prominent
- Contact info (email, phone, created date) in header
- Modern action buttons (Edit/Delete)

**Quick Stats Cards (4 adet):**
- Total Activities (mavi icon)
- Custom Fields (mor icon) - dinamik sayım
- Days Active (yeşil icon)
- Conversion Rate (turuncu icon)
- Hover effects ile shadow artışı

**Tabbed Interface:**
- **Tab 1: Lead Information** (Birleştirilmiş Overview + Details)
  - Contact Information Card (statik: full_name, email, phone, source)
  - Dynamic Sections from `lead_form_sections`:
    - Her section kendi gradient'ı ile
    - Section bazlı field grouping
    - `section_key` ile otomatik gruplama
  - Lead Status Summary Card

- **Tab 2: Activity Timeline**
  - Modern vertical timeline design
  - Activity cards with icons
  - Empty state handling
  - CTA button for first activity

**Section-Based Dynamic Fields:**
```typescript
// lead_form_sections entegrasyonu
const formSections = await prisma.lead_form_sections.findMany({
  where: { is_visible: true },
  orderBy: { sort_order: "asc" },
})

// Section bazlı field rendering
sectionFields = allFields.filter(
  field => field.section_key === section.section_key
)
```

**Multiselect Badge Display:**
- Multiselect field'lar badge component ile
- Her değer ayrı kutu (mavi badge)
- `bg-blue-100 text-blue-700` renk teması
- Hover effects
- Wrap layout (responsive)

**Sidebar Components:**
- Quick Actions Card (gradient button, hover effects)
- Lead Information Card (status/priority badges, relative dates)
- Lead Score Card (SVG circular progress bar)

**Technical Details:**
- `lead_form_sections` tablosu entegrasyonu
- Icon mapping: `user`, `briefcase`, `document`, `layout`
- Gradient mapping: DB'den gelen gradient class'ları
- BigInt serialization (Prisma)
- TypeScript interfaces tam tip güvenliği

### 3. Investor Management

#### Investor List (`/investors`)
- Lead list ile benzer özellikler
- Investor-specific filtreleme
- Budget/Timeline tracking

#### Create Investor (`/investors/new`)
- **Contact Information (Statik):**
  - Full Name → first_name + last_name
  - Email (required)
  - Phone (required, unique)

- **Investor Details (Dinamik):**
  - Source, Status, Priority (investor_fields'dan)
  - Investment Amount
  - Tüm custom fields

### 4. Activity Management

#### Activity Hub (`/activities`)
- **Lokasyon:** `/activities/page.tsx` + `components/activities/activities-client.tsx`
- **Modern Hero Header:** Gradient background (indigo-purple-pink)
- **Stats Cards:**
  - Total Activities
  - Most Active Type
  - Completed Count
  - Pending Count
- **Filters:**
  - Activity Type (call, email, meeting, etc.)
  - Status (pending, completed, cancelled)
  - Source (lead/investor)
  - Created By (user filter)
  - Search (subject, description, lead/investor name)
- **View Modes:** Grid & Timeline
- **Activity Cards:**
  - Activity type icon with color
  - Subject & description
  - Status badge
  - Source (Lead/Investor) with link
  - **Created By:** Kim oluşturdu (users.name)
  - **Assigned To:** Kime atandı (assignedUser.name)

**Veri Yapısı:**
```typescript
activity {
  user_id: 1,          // Ali (oluşturan)
  assigned_to: 2,      // Mehmet (atanan)
  users: { name: "Ali" },
  assignedUser: { name: "Mehmet" }
}
```

### 5. Form Layout Configurator

#### Özellikler:
- **Section Management:**
  - Drag & drop ile sıralama
  - Visibility toggle
  - Default open/closed state
  - Icon & gradient özelleştirme

- **Field Assignment:**
  - Field'ları section'lara atama
  - Section bazlı görünürlük

#### Kullanım:
```typescript
// Form sections yapısı
{
  section_key: 'contact_information',
  name: 'Contact Information',
  is_visible: true,
  is_default_open: true,
  sort_order: 1,
  icon: 'user',
  gradient: 'bg-gradient-to-br from-blue-600 to-indigo-500'
}
```

### 6. Authentication

- **Provider:** NextAuth v5
- **Strategy:** Credentials
- **Session:** JWT
- **Protection:** Middleware-based route protection

### 7. User Management

**Users Tablosu Kullanım Alanları:**
1. **Login & Authentication:**
   - Email/Password ile giriş
   - Session yönetimi
   - Role-based permissions

2. **Assignment System:**
   - Lead Assignment: Lead'leri kullanıcılara atama
   - Investor Assignment: Investor'ları kullanıcılara atama
   - Activity Assignment: Aktiviteleri kullanıcılara atama
   - Branch Manager: Şube yöneticisi ataması

3. **Activity Tracking:**
   - Created By: Kullanıcının oluşturduğu aktiviteler
   - Assigned To: Kullanıcıya atanan aktiviteler
   - Notes: Kullanıcının oluşturduğu notlar

**Not:** Eski "representatives" tablosu kaldırıldı, tüm atama işlemleri artık "users" tablosu üzerinden yapılıyor.

---

## 🎨 UI Components

### shadcn/ui Components

#### Form Components
- `<Button>` - Multiple variants (default, outline, ghost, etc.)
- `<Input>` - Text input with validation
- `<Textarea>` - Multi-line text
- `<Select>` - Dropdown select
- `<Checkbox>` - Checkbox input
- `<Switch>` - Toggle switch
- `<PhoneInput>` - International phone input with country code

#### Layout Components
- `<Card>` - Container with header/content/footer
- `<Tabs>` - Tab navigation
- `<Dialog>` - Modal dialogs
- `<Sheet>` - Slide-over panels
- `<Popover>` - Floating content
- `<Tooltip>` - Tooltips

#### Data Display
- `<Table>` - Data tables
- `<Badge>` - Status badges
- `<Avatar>` - User avatars
- `<Separator>` - Dividers
- `<ScrollArea>` - Scrollable areas

#### Feedback
- `<AlertDialog>` - Confirmation dialogs
- `<Toast>` (Sonner) - Notifications
- `<Skeleton>` - Loading states

### Custom Components

#### Dashboard
- `<Sidebar>` - Navigation sidebar
- `<Header>` - Top header with search
- `<Stats>` - Dashboard statistics
- `<RecentLeads>` - Recent activity feed

#### Dynamic Fields
```tsx
<DynamicField
  field={{
    id: 1,
    name: 'investment_amount',
    label: 'Investment Amount',
    type: 'text',
    is_required: false,
    placeholder: 'Enter amount...',
    help_text: 'Total investment amount'
  }}
  value={value}
  onChange={(newValue) => handleChange(newValue)}
/>
```

#### Field Form Dialog
```tsx
<FieldFormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  field={editingField}
  fieldType="investor" // 'lead' | 'investor'
  onSuccess={() => refresh()}
/>
```

---

## 🔌 API Routes

### Authentication
- `POST /api/auth/callback/credentials` - Login
- `GET /api/auth/session` - Get session

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/[id]` - Get lead
- `PUT /api/leads/[id]` - Update lead
- `PATCH /api/leads/[id]` - Assign/unassign user to lead
- `DELETE /api/leads/[id]` - Delete lead

### Investors
- `GET /api/investors` - List investors
- `POST /api/investors` - Create investor
- `GET /api/investors/[id]` - Get investor
- `PUT /api/investors/[id]` - Update investor
- `DELETE /api/investors/[id]` - Delete investor

### Activities
- `GET /api/activities` - List activities (with filters: lead_id, investor_id, type, status, user_id, source, search)
- `POST /api/activities` - Create activity
- Response includes: assignedUser (assigned_to user), users (creator user)

### Settings - Lead Fields
- `GET /api/settings/lead-fields` - List fields
- `POST /api/settings/lead-fields` - Create field
- `GET /api/settings/lead-fields/[id]` - Get field
- `PUT /api/settings/lead-fields/[id]` - Update field
- `DELETE /api/settings/lead-fields/[id]` - Delete field
- `POST /api/settings/lead-fields/reorder` - Reorder fields

### Settings - Investor Fields
- `GET /api/settings/investor-fields` - List fields
- `POST /api/settings/investor-fields` - Create field
- `GET /api/settings/investor-fields/[id]` - Get field
- `PUT /api/settings/investor-fields/[id]` - Update field
- `DELETE /api/settings/investor-fields/[id]` - Delete field
- `POST /api/settings/investor-fields/reorder` - Reorder fields

### Form Sections
- `GET /api/settings/lead-form-sections` - List sections
- `POST /api/settings/lead-form-sections` - Update sections
- `GET /api/settings/investor-form-sections` - List sections
- `POST /api/settings/investor-form-sections` - Update sections

---

## 🎨 Tema & Styling

### Tailwind CSS Configuration
- **Version:** 4.x
- **Base Color:** Neutral
- **CSS Variables:** Enabled
- **Prefix:** None

### shadcn/ui Configuration
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

### Color Palette
- **Primary:** Blue/Indigo gradients
- **Secondary:** Emerald/Teal gradients
- **Accent:** Purple gradients
- **Neutral:** Gray scale

### Gradient Examples
```css
/* Lead sections */
bg-gradient-to-br from-blue-600 to-indigo-500
bg-gradient-to-br from-purple-600 to-pink-500

/* Investor sections */
bg-gradient-to-br from-emerald-600 to-teal-500
bg-gradient-to-r from-green-600 to-emerald-600
```

---

## 📝 Notlar

### BigInt Serialization
Prisma BigInt değerleri JSON'a serialize edilemediği için Number'a dönüştürülmesi gerekir:

```typescript
const serialized = investors.map(investor => ({
  ...investor,
  id: Number(investor.id),
  lead_id: investor.lead_id ? Number(investor.lead_id) : null,
}))
```

### Phone Uniqueness
Investor tablosunda phone alanı unique constraint'e sahiptir:

```prisma
phone String? @unique(map: "investors_phone_unique")
```

### Dynamic Field Values
Multiselect field'lar JSON olarak saklanır:

```typescript
// Saving
value: typeof value === "object" ? JSON.stringify(value) : String(value)

// Reading
if (fieldType === 'multiselect') {
  parsedValue = JSON.parse(value)
}
```

---

## 🚧 Geliştirme Notları

### Yapılabilecek İyileştirmeler
- [ ] File upload field type
- [ ] Rich text editor field type
- [ ] Field dependencies (show/hide based on other fields)
- [ ] Bulk operations
- [ ] Export/Import functionality
- [ ] Advanced reporting
- [ ] Email integration
- [ ] Calendar integration
- [ ] Activity timeline
- [ ] Kanban board view

### Bilinen Sorunlar
- First name/Last name görünümü bazı durumlarda eksik olabilir (cache sorunu)
- Form completion percentage bazı custom field'ları saymaabilir

---

## 📚 Kaynaklar

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [NextAuth Documentation](https://next-auth.js.org)

---

## 👥 Katkıda Bulunanlar

Bu proje, modern CRM ihtiyaçlarını karşılamak için geliştirilmiş, tamamen özelleştirilebilir bir çözümdür.

**Version:** 0.1.0
**Last Updated:** 2025-10-03

---

## 📄 Lisans

Bu proje özel kullanım içindir.
