# AGENTS.md — Backend Node.js + Express + TypeScript

> Tài liệu này mô tả kiến trúc, quy ước code, và hướng dẫn cho AI agents (Copilot, Claude, Cursor, v.v.) khi làm việc với codebase này.

---

## 1. Tổng quan dự án

Hệ thống quản lý lô hàng (Shipment Management) cho công ty logistics.  
Backend REST API xây dựng bằng **Node.js + Express + TypeScript**, kết nối **Supabase (PostgreSQL)**.

### Modules chính

| Module             | Mô tả                                      |
|--------------------|--------------------------------------------|
| `shipments`        | Quản lý lô hàng, thông tin KH & NCC        |
| `sales`            | Báo giá (Sales Items)                      |
| `purchasing`       | Thu mua (Purchasing Items)                 |
| `contracts`        | Hợp đồng                                   |
| `finance`          | Tổng hợp tài chính (view)                  |
| `payment-requests` | Đề nghị thanh toán                         |
| `debit-notes`      | Debit Note (hóa đơn + chi hộ)              |
| `customers`        | Danh mục khách hàng                        |
| `suppliers`        | Danh mục nhà cung cấp                      |
| `employees`        | Danh mục nhân viên / PIC                   |

---

## 2. Cấu trúc thư mục

```
src/
├── config/
│   ├── env.ts                  # Load & validate biến môi trường
│   └── supabase.ts             # Khởi tạo Supabase client
│
├── modules/
│   ├── customers/
│   │   ├── customer.controller.ts
│   │   ├── customer.service.ts
│   │   ├── customer.routes.ts
│   │   └── customer.types.ts
│   ├── suppliers/
│   ├── employees/
│   ├── shipments/
│   ├── sales/
│   ├── purchasing/
│   ├── contracts/
│   ├── finance/
│   ├── payment-requests/
│   └── debit-notes/
│
├── middlewares/
│   ├── auth.middleware.ts       # Xác thực JWT từ Supabase
│   ├── validate.middleware.ts   # Validate request body với Zod
│   └── error.middleware.ts      # Global error handler
│
├── utils/
│   ├── response.ts              # Chuẩn hoá response format
│   ├── pagination.ts            # Helper phân trang
│   └── logger.ts                # Winston logger
│
├── types/
│   └── express.d.ts             # Mở rộng Express Request type
│
├── app.ts                       # Khởi tạo Express app
└── server.ts                    # Entry point
```

---

## 3. Quy ước đặt tên

| Đối tượng          | Convention           | Ví dụ                              |
|--------------------|----------------------|------------------------------------|
| File               | `kebab-case`         | `shipment.service.ts`              |
| Class              | `PascalCase`         | `ShipmentService`                  |
| Function/Variable  | `camelCase`          | `getShipmentById`                  |
| Type / Interface   | `PascalCase`         | `CreateShipmentDto`                |
| Constant           | `UPPER_SNAKE_CASE`   | `MAX_PAGE_SIZE`                    |
| Route path         | `kebab-case` plural  | `/api/v1/shipments`                |
| DB table           | `snake_case` plural  | `shipments`, `sales_items`         |

---

## 4. Cấu trúc mỗi module

Mỗi module gồm 4 file theo pattern sau:

### `*.types.ts` — Định nghĩa kiểu dữ liệu

```typescript
// modules/shipments/shipment.types.ts

export interface Shipment {
  id: string;
  customer_id: string;
  supplier_id: string;
  commodity: string;
  hs_code?: string;
  quantity: number;
  packing?: string;
  vessel_voyage?: string;
  term?: string;
  transport_air: boolean;
  transport_sea: boolean;
  load_fcl: boolean;
  load_lcl: boolean;
  pol?: string;
  pod?: string;
  etd?: string;   // ISO date string
  eta?: string;
  created_at: string;
}

export interface CreateShipmentDto {
  customer_id: string;
  supplier_id: string;
  commodity: string;
  quantity: number;
  // ... các trường bắt buộc
}

export interface UpdateShipmentDto extends Partial<CreateShipmentDto> {}
```

### `*.service.ts` — Business logic + DB calls

```typescript
// modules/shipments/shipment.service.ts
import { supabase } from '@/config/supabase';
import type { CreateShipmentDto, Shipment } from './shipment.types';

export class ShipmentService {
  async findAll(page = 1, limit = 20): Promise<{ data: Shipment[]; count: number }> {
    const from = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('shipments')
      .select('*, customers(*), suppliers(*)', { count: 'exact' })
      .range(from, from + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data ?? [], count: count ?? 0 };
  }

  async findById(id: string): Promise<Shipment | null> {
    const { data, error } = await supabase
      .from('shipments')
      .select('*, customers(*), suppliers(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(dto: CreateShipmentDto): Promise<Shipment> {
    const { data, error } = await supabase
      .from('shipments')
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, dto: Partial<CreateShipmentDto>): Promise<Shipment> {
    const { data, error } = await supabase
      .from('shipments')
      .update(dto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
```

### `*.controller.ts` — Xử lý HTTP request/response

```typescript
// modules/shipments/shipment.controller.ts
import type { Request, Response, NextFunction } from 'express';
import { ShipmentService } from './shipment.service';
import { successResponse, paginatedResponse } from '@/utils/response';

const service = new ShipmentService();

export const ShipmentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await service.findAll(page, limit);
      res.json(paginatedResponse(result.data, result.count, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Not found' });
      res.json(successResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.create(req.body);
      res.status(201).json(successResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await service.update(req.params.id, req.body);
      res.json(successResponse(item));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
```

### `*.routes.ts` — Khai báo routes

```typescript
// modules/shipments/shipment.routes.ts
import { Router } from 'express';
import { ShipmentController } from './shipment.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { createShipmentSchema } from './shipment.schema';  // Zod schema

const router = Router();

router.use(authMiddleware);

router.get('/',        ShipmentController.list);
router.get('/:id',     ShipmentController.getById);
router.post('/',       validate(createShipmentSchema), ShipmentController.create);
router.patch('/:id',   ShipmentController.update);
router.delete('/:id',  ShipmentController.remove);

export default router;
```

---

## 5. Cấu trúc Response chuẩn

Tất cả API phải trả về đúng format sau:

```typescript
// utils/response.ts

/** Single item hoặc object */
export function successResponse<T>(data: T, message = 'Success') {
  return { success: true, message, data };
}

/** Danh sách có phân trang */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** Lỗi */
export function errorResponse(message: string, code?: string) {
  return { success: false, message, code };
}
```

**Ví dụ response thực tế:**

```json
// GET /api/v1/shipments
{
  "success": true,
  "data": [...],
  "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}

// POST /api/v1/shipments
{
  "success": true,
  "message": "Success",
  "data": { "id": "uuid-...", ... }
}

// Lỗi
{
  "success": false,
  "message": "Shipment not found",
  "code": "NOT_FOUND"
}
```

---

## 6. API Routes tổng hợp

```
Base URL: /api/v1

# Customers
GET    /customers
GET    /customers/:id
POST   /customers
PATCH  /customers/:id
DELETE /customers/:id

# Suppliers
GET    /suppliers
GET    /suppliers/:id
POST   /suppliers
PATCH  /suppliers/:id
DELETE /suppliers/:id

# Shipments
GET    /shipments                          # list, filter by customer/supplier
GET    /shipments/:id                      # include nested customer, supplier
POST   /shipments
PATCH  /shipments/:id
DELETE /shipments/:id

# Sales Items
GET    /shipments/:id/sales
POST   /shipments/:id/sales
PATCH  /sales/:itemId
DELETE /sales/:itemId

# Purchasing Items
GET    /shipments/:id/purchasing
POST   /shipments/:id/purchasing
PATCH  /purchasing/:itemId
DELETE /purchasing/:itemId

# Contracts
GET    /contracts
GET    /contracts/:id
POST   /contracts
PATCH  /contracts/:id
DELETE /contracts/:id

# Finance (read-only view)
GET    /finance                            # finance_summary view

# Payment Requests
GET    /shipments/:id/payment-requests
POST   /shipments/:id/payment-requests
GET    /payment-requests/:id              # include invoices
PATCH  /payment-requests/:id
DELETE /payment-requests/:id

# Payment Request Invoices (sub-resource)
POST   /payment-requests/:id/invoices
PATCH  /payment-requests/:id/invoices/:invoiceId
DELETE /payment-requests/:id/invoices/:invoiceId

# Debit Notes
GET    /shipments/:id/debit-notes
POST   /shipments/:id/debit-notes
GET    /debit-notes/:id                   # include invoice & chi-ho lines
PATCH  /debit-notes/:id
DELETE /debit-notes/:id

# Debit Note Lines
POST   /debit-notes/:id/invoice-items
PATCH  /debit-notes/:id/invoice-items/:lineId
DELETE /debit-notes/:id/invoice-items/:lineId
POST   /debit-notes/:id/chi-ho-items
PATCH  /debit-notes/:id/chi-ho-items/:lineId
DELETE /debit-notes/:id/chi-ho-items/:lineId
```

---

## 7. Validation — Zod Schemas

Mỗi module có file `*.schema.ts` riêng:

```typescript
// modules/shipments/shipment.schema.ts
import { z } from 'zod';

export const createShipmentSchema = z.object({
  customer_id:   z.string().uuid(),
  supplier_id:   z.string().length(3),
  commodity:     z.string().min(1),
  quantity:      z.number().positive(),
  packing:       z.string().optional(),
  vessel_voyage: z.string().optional(),
  term:          z.string().optional(),
  transport_air: z.boolean().default(false),
  transport_sea: z.boolean().default(false),
  load_fcl:      z.boolean().default(false),
  load_lcl:      z.boolean().default(false),
  pol:           z.string().optional(),
  pod:           z.string().optional(),
  etd:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  eta:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateShipmentDto = z.infer<typeof createShipmentSchema>;
```

---

## 8. Middleware

### Auth Middleware (Supabase JWT)

```typescript
// middlewares/auth.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { supabase } from '@/config/supabase';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ success: false, message: 'Invalid token' });

  req.user = data.user;
  next();
}
```

### Validate Middleware (Zod)

```typescript
// middlewares/validate.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}
```

### Error Middleware (Global)

```typescript
// middlewares/error.middleware.ts
import type { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = err.status ?? 500;
  const message = err.message ?? 'Internal Server Error';
  res.status(status).json({ success: false, message });
}
```

---

## 9. Config & Environment

```typescript
// config/env.ts
import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT:                    z.string().default('3000'),
  SUPABASE_URL:            z.string().url(),
  SUPABASE_SERVICE_ROLE:   z.string().min(1),
  NODE_ENV:                z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

```typescript
// config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
```

**File `.env.example`:**

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGci...
```

---

## 10. app.ts và server.ts

```typescript
// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorMiddleware } from '@/middlewares/error.middleware';

// Routes
import customerRoutes      from '@/modules/customers/customer.routes';
import supplierRoutes      from '@/modules/suppliers/supplier.routes';
import shipmentRoutes      from '@/modules/shipments/shipment.routes';
import salesRoutes         from '@/modules/sales/sales.routes';
import purchasingRoutes    from '@/modules/purchasing/purchasing.routes';
import contractRoutes      from '@/modules/contracts/contract.routes';
import financeRoutes       from '@/modules/finance/finance.routes';
import paymentRequestRoutes from '@/modules/payment-requests/payment-request.routes';
import debitNoteRoutes     from '@/modules/debit-notes/debit-note.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const v1 = '/api/v1';
app.use(`${v1}/customers`,        customerRoutes);
app.use(`${v1}/suppliers`,        supplierRoutes);
app.use(`${v1}/shipments`,        shipmentRoutes);
app.use(`${v1}/sales`,            salesRoutes);
app.use(`${v1}/purchasing`,       purchasingRoutes);
app.use(`${v1}/contracts`,        contractRoutes);
app.use(`${v1}/finance`,          financeRoutes);
app.use(`${v1}/payment-requests`, paymentRequestRoutes);
app.use(`${v1}/debit-notes`,      debitNoteRoutes);

app.use(errorMiddleware);

export default app;
```

```typescript
// server.ts
import app from './app';
import { env } from './config/env';

app.listen(Number(env.PORT), () => {
  console.log(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
});
```

---

## 11. Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "cors": "^2",
    "dotenv": "^16",
    "express": "^4",
    "helmet": "^7",
    "zod": "^3"
  },
  "devDependencies": {
    "@types/cors": "^2",
    "@types/express": "^4",
    "@types/node": "^20",
    "tsx": "^4",
    "typescript": "^5"
  }
}
```

**`tsconfig.json` (tối thiểu):**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "baseUrl": "src",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["src"]
}
```

---

## 12. Quy tắc cho AI Agent

Khi sinh code cho dự án này, hãy tuân thủ:

1. **Luôn dùng TypeScript strict** — không dùng `any`, không bỏ qua lỗi type
2. **Mỗi module độc lập** — không import chéo giữa các module (chỉ import từ `@/config`, `@/utils`, `@/middlewares`)
3. **Service không biết về HTTP** — không dùng `req`, `res` trong service; chỉ nhận DTO thuần, trả về data hoặc throw Error
4. **Controller không chứa business logic** — chỉ gọi service, format response
5. **Validate input tại route** — dùng `validate(schema)` middleware trước controller
6. **Tất cả DB call qua Supabase client** — không raw SQL trừ khi cần stored procedure
7. **Tất cả route đều cần `authMiddleware`** — trừ health check endpoint
8. **Generated columns không được gửi lên** — `tax_value`, `total`, `amount`, `no_doc` do DB tính
9. **Currency chỉ nhận `'USD'` hoặc `'VND'`** — validate tại Zod schema
10. **Date format gửi lên là `YYYY-MM-DD`** — frontend cần convert từ `DD/MM/YYYY` trước khi gọi API

---

## 13. Ví dụ thêm mới module

Để thêm module mới (ví dụ: `reports`), thực hiện đúng thứ tự:

```
1. Tạo src/modules/reports/report.types.ts
2. Tạo src/modules/reports/report.schema.ts     (Zod)
3. Tạo src/modules/reports/report.service.ts
4. Tạo src/modules/reports/report.controller.ts
5. Tạo src/modules/reports/report.routes.ts
6. Import và đăng ký route trong src/app.ts
```

Không bước qua thứ tự trên. Không đặt logic trong `routes.ts`.