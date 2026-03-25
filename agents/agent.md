# F-Solution Web Application — Agent Guidelines

## Tổng Quan Dự Án

Ứng dụng quản lý logistics / freight forwarding (CRM) gồm:

- **Frontend** (`/client`) — React + TypeScript + Tailwind CSS
- **Backend** (`/server`) — Node.js + Express + TypeScript
- **Database** — Supabase (PostgreSQL)

---

## Tech Stack

| Layer    | Công nghệ                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------- |
| Language | **TypeScript** (toàn bộ dự án)                                                                   |
| Frontend | React 19, Vite 7, Tailwind CSS v4, React Router v7, Framer Motion, Recharts, Lucide React, Luxon |
| Backend  | Node.js, Express, TypeScript                                                                      |
| Database | Supabase PostgreSQL (sử dụng `@supabase/supabase-js`)                                            |
| Hosting  | Frontend deploy Vercel (`vercel.json` có sẵn)                                                    |

---

## Cấu Trúc Thư Mục

```
job-anle/
├── client/                          # Frontend React application
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/              # Layout: MainLayout, Sidebar, Topbar, MobileBottomNav
│   │   │   └── ui/                  # Reusable UI: ActionCard, ModuleCard, SearchableSelect, 
│   │   │                            #   Popover, Command (cmdk)
│   │   ├── context/                 # React Context (ThemeContext, ...)
│   │   ├── data/                    # Static data & type constants (moduleData, sidebarMenu)
│   │   ├── lib/                     # Utility functions (utils.ts — cn(), ...)
│   │   ├── pages/                   # Page components
│   │   │   ├── candidates/          # Sub-module: Candidates (data, dialogs, types)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CandidatesPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   ├── ModulePage.tsx
│   │   │   ├── AIPage.tsx
│   │   │   └── CopyrightPage.tsx
│   │   ├── App.tsx                  # Router configuration
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles + Tailwind imports
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── eslint.config.js
│   ├── vercel.json
│   └── package.json
│
├── server/                          # Backend Node.js application
│   ├── src/
│   │   ├── routes/                  # Express route handlers (theo resource)
│   │   ├── controllers/             # Business logic controllers
│   │   ├── services/                # Service layer (Supabase queries)
│   │   ├── middlewares/             # Express middlewares (auth, error, validation)
│   │   ├── types/                   # Shared TypeScript types & interfaces
│   │   ├── utils/                   # Helper functions
│   │   ├── config/                  # Environment & Supabase config
│   │   └── index.ts                 # Server entry point
│   ├── sql/
│   │   └── migrations/             # ⚠️ Database migration files (xem mục Migration bên dưới)
│   ├── db/
│   │   └── schema.sql              # Full database schema reference
│   ├── tsconfig.json
│   └── package.json
│
└── agent.md                         # (File này) Hướng dẫn cho AI agent
```

> **Lưu ý:** Cấu trúc `server/src/` ở trên là cấu trúc **recommended**. Khi server chưa có đầy đủ, hãy tạo theo đúng cấu trúc này.

---

## Quy Tắc Chung

### TypeScript

- **Luôn sử dụng TypeScript** cho cả frontend lẫn backend. Không dùng `.js` / `.jsx`.
- Sử dụng `interface` cho object shapes, `type` cho union/intersection types.
- Bật `strict` mode trong `tsconfig.json`.
- Tránh sử dụng `any`. Dùng `unknown` nếu cần generic, sau đó narrow type.
- Export types/interfaces từ file riêng trong thư mục `types/`.

### Naming Conventions

| Mục                   | Quy tắc           | Ví dụ                              |
| ---------------------- | ------------------ | ----------------------------------- |
| File component         | PascalCase `.tsx`  | `CandidatesPage.tsx`               |
| File utility / service | camelCase `.ts`    | `shipmentService.ts`               |
| File type definitions  | camelCase `.ts`    | `shipmentTypes.ts`                 |
| React component        | PascalCase         | `SearchableSelect`                 |
| Function / variable    | camelCase          | `getShipmentById`                  |
| Constant               | UPPER_SNAKE_CASE   | `MAX_PAGE_SIZE`                    |
| Interface / Type       | PascalCase         | `ShipmentDetail`, `CreateShipmentDTO` |
| Database column        | snake_case         | `company_name`, `created_at`       |
| API endpoint           | kebab-case         | `/api/payment-requests`            |
| Migration file         | timestamp prefix   | `20260325_add_status_to_shipments.sql` |

---

## Frontend — Quy Tắc Chi Tiết

### Stack & Tooling

- **React 19** + **Vite 7** với `@vitejs/plugin-react`.
- **Tailwind CSS v4** (import via `@tailwindcss/vite` plugin, **không** dùng `tailwind.config.js` vì v4 dùng CSS-first config).
- Routing: **React Router v7** (`react-router-dom`).
- Animation: **Framer Motion**.
- Icons: **Lucide React**.
- Date: **Luxon** (dùng `DateTime` thay `Date`).
- Charts: **Recharts**.

### Component Guidelines

1. **Functional components only** — không dùng class components.
2. **Mỗi component 1 file** — đặt đúng thư mục `components/ui/` hoặc `components/layout/`.
3. Nếu page phức tạp, tạo sub-folder trong `pages/` (giống `pages/candidates/`).
4. Sử dụng **`cn()` helper** (from `lib/utils.ts`) để merge Tailwind classes — tận dụng `clsx` + `tailwind-merge`.
5. Props phải được type rõ ràng bằng `interface`.

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### State Management

- Ưu tiên **React Context** cho global state (đã có `ThemeContext`).
- Dùng **`useState`** / **`useReducer`** cho local component state.
- Nếu cần state phức tạp hơn, cân nhắc Zustand (nhưng phải thêm dependency).

### API Calls (Frontend → Backend)

- Tạo file service riêng trong `lib/` hoặc `services/`, ví dụ `lib/api.ts`.
- Sử dụng **`fetch`** hoặc tạo wrapper axios. Không gọi trực tiếp Supabase client ở frontend (trừ trường hợp auth).
- Xử lý loading / error states cho mọi API call.

### Ngôn Ngữ UI

- **Toàn bộ giao diện (UI) viết bằng tiếng Anh**: labels, buttons, placeholders, headings, messages, tooltips, table headers, error/success messages, v.v.
- Không dùng tiếng Việt trong UI. Comment trong code có thể dùng tiếng Việt hoặc tiếng Anh.

### Styling

- **Dùng Tailwind CSS utility classes** là chính.
- Responsive: mobile-first (`sm:`, `md:`, `lg:`).
- Dark mode: sử dụng ThemeContext đã có, class-based (`dark:` prefix).
- Không viết CSS inline hoặc CSS modules trừ trường hợp đặc biệt.

---

## Backend — Quy Tắc Chi Tiết

### Stack & Architecture

- **Node.js + Express + TypeScript**.
- Architecture: **Layered** (Routes → Controllers → Services).
- Mỗi resource (entity) có file riêng theo layer.

### Folder Pattern

```
server/src/
├── routes/
│   ├── index.ts              # Import & mount tất cả routes
│   ├── shipmentRoutes.ts
│   ├── customerRoutes.ts
│   └── ...
├── controllers/
│   ├── shipmentController.ts
│   └── ...
├── services/
│   ├── shipmentService.ts    # Chứa Supabase queries
│   └── ...
├── middlewares/
│   ├── authMiddleware.ts
│   ├── errorHandler.ts
│   └── validateRequest.ts
├── types/
│   ├── shipment.ts
│   └── ...
├── utils/
│   └── response.ts           # Standard API response helper
├── config/
│   ├── env.ts                # dotenv + env validation
│   └── supabase.ts           # Supabase client init
└── index.ts                  # Express app setup + listen
```

### API Design

- RESTful endpoints: `GET`, `POST`, `PUT/PATCH`, `DELETE`.
- Base path: `/api/v1/`.
- Route ví dụ:
  - `GET    /api/v1/shipments`         — List (hỗ trợ pagination & search)
  - `GET    /api/v1/shipments/:id`     — Detail
  - `POST   /api/v1/shipments`         — Create
  - `PATCH  /api/v1/shipments/:id`     — Update
  - `DELETE /api/v1/shipments/:id`     — Delete

### Response Format

Tất cả API trả về JSON chuẩn:

```ts
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "total": 150 }  // nếu có pagination
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'company_name' is required"
  }
}
```

### Error Handling

- Sử dụng middleware `errorHandler` tập trung.
- Throw custom Error classes (`AppError`, `NotFoundError`, `ValidationError`).
- Không để unhandled promise rejections.

### Environment Variables

- Sử dụng **`.env`** file (gitignored).
- Validate env vars khi start server (dùng `zod` hoặc manual check).
- Các biến bắt buộc:

```env
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
NODE_ENV=development
```

---

## Database — Quy Tắc Chi Tiết

### Supabase PostgreSQL

- Schema chính lưu tại `server/db/schema.sql` (tham chiếu).
- Sử dụng **`@supabase/supabase-js`** ở backend với **Service Role Key** (bypass RLS cho server-side).
- Frontend chỉ dùng Supabase client cho **Authentication** (nếu cần).

### Bảng Hiện Có

| Bảng                         | Mô tả                        |
| ---------------------------- | ----------------------------- |
| `customers`                  | Khách hàng                    |
| `suppliers`                  | Nhà cung cấp                  |
| `employees`                  | Nhân viên (PIC)               |
| `shipments`                  | Lô hàng vận chuyển            |
| `sales_items`                | Báo giá (quotation)           |
| `purchasing_items`           | Mua hàng                      |
| `contracts`                  | Hợp đồng                      |
| `payment_requests`           | Đề nghị thanh toán             |
| `payment_request_invoices`   | Hoá đơn trong DNTT            |
| `debit_notes`                | Debit notes                   |
| `debit_note_invoice_items`   | Dòng invoice trong debit note |
| `debit_note_chi_ho_items`    | Dòng chi hộ trong debit note  |

### Views

- `payment_requests_totals` — Tổng tiền cho payment request.
- `finance_summary` — Tổng hợp tài chính (sales vs purchasing).

### Row Level Security (RLS)

- RLS **đã bật** cho tất cả bảng chính.
- Khi tạo bảng mới, **luôn bật RLS** và tạo policy phù hợp.

---

## ⚠️ Database Migration Workflow

> **QUAN TRỌNG:** Khi cần thay đổi schema database (thêm bảng, sửa cột, thêm index, ...), phải tạo file migration.

### Quy trình:

1. **Tạo file migration** trong `server/sql/migrations/`.
2. **Đặt tên file** theo format: `YYYYMMDD_mô_tả_ngắn.sql`.
   - Ví dụ: `20260325_add_status_to_shipments.sql`
   - Ví dụ: `20260325_create_candidates_table.sql`
3. **Nội dung file** phải:
   - Có comment mô tả mục đích migration.
   - Sử dụng `IF NOT EXISTS` / `IF EXISTS` khi phù hợp.
   - Bao gồm cả lệnh **UP** (apply) — và nếu có thể, **DOWN** (rollback) trong comment.
   - Bật RLS + tạo policy nếu tạo bảng mới.
4. **Cập nhật** `server/db/schema.sql` để phản ánh trạng thái mới nhất.

### Migration File Template

```sql
-- Migration: 20260325_add_status_to_shipments
-- Description: Thêm cột status vào bảng shipments
-- Author: [tên]
-- Date: 2026-03-25

-- ============================================================
-- UP
-- ============================================================
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
  CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled'));

-- ============================================================
-- DOWN (rollback) — chạy thủ công nếu cần
-- ============================================================
-- ALTER TABLE shipments DROP COLUMN IF EXISTS status;
```

---

## Quy Tắc Khi Viết Code

### Chung

- Không commit code có **TypeScript errors**.
- Không sử dụng **`console.log`** trong production code — dùng logger service.
- **Comment** bằng tiếng Việt hoặc tiếng Anh đều được, nhưng **nhất quán** trong file.
- Prefer **named exports** over default exports (trừ page components).
- Không dùng `var` — chỉ `const` và `let`.
- **Antigravity AI**: Không được tự ý mở subagent browser để test giao diện hoặc functionality trừ khi được yêu cầu.

### Git

- Branch naming: `feature/tên-tính-năng`, `bugfix/mô-tả`, `hotfix/mô-tả`.
- Commit message ngắn gọn, rõ ràng (có thể dùng tiếng Việt).

### Security

- **Không hardcode** API keys, secrets trong source code.
- Luôn validate input ở backend trước khi query database.
- Sử dụng parameterized queries (Supabase client tự xử lý).
- Sanitize user input trước khi hiển thị (chống XSS).

---

## Scripts & Commands

### Frontend (`/client`)

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Build production
npm run lint         # ESLint check
npm run preview      # Preview production build
```

### Backend (`/server`)

```bash
npm run dev          # Start dev server (ts-node / nodemon)
npm run build        # Compile TypeScript
npm start            # Run compiled JS
```

---

## Checklist Khi Tạo Feature Mới

1. [ ] Xác định cần thay đổi database schema không?
   - Nếu có → tạo migration file trong `server/sql/migrations/`
   - Cập nhật `server/db/schema.sql`
2. [ ] Tạo / cập nhật types trong `server/src/types/` và `client/src/` (nếu dùng shared types).
3. [ ] Backend: Route → Controller → Service.
4. [ ] Frontend: Page / Component → API service call → UI.
5. [ ] Test API bằng Postman / Thunder Client.
6. [ ] Kiểm tra TypeScript không có lỗi (`tsc --noEmit`).
7. [ ] Kiểm tra responsive trên mobile.
