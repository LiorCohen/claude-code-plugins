# Tutorial: Build a Restaurant Management System

This tutorial walks you through building a complete restaurant management system using the SDD plugin. By the end, you'll have a working application with menu management, order processing, and a customer-facing interface.

---

## What You'll Build

A restaurant management system with:
- **Menu Management**: Create, update, and organize menu items by category
- **Order Processing**: Take orders, track status, calculate totals
- **Customer Interface**: Browse menu, place orders, view order status

**Tech Stack** (automatically configured by SDD):
- Backend: Node.js with Express (CMDO architecture)
- Frontend: React with TanStack Query (MVVM architecture)
- Database: PostgreSQL
- API: OpenAPI 3.0 with generated TypeScript types
- Infrastructure: Kubernetes via Helm, GitHub Actions CI/CD

---

## Prerequisites

1. **Claude Code CLI** installed and authenticated
2. **SDD Plugin** installed:
   ```bash
   claude mcp add-plugin "https://raw.githubusercontent.com/LiorCohen/sdd/main/.claude-plugin/marketplace.json"
   ```
3. **Node.js 20+** and **npm**
4. **Git** configured with your identity

---

## Part 1: Initialize the Project

### Step 1.1: Create Project Directory

```bash
mkdir restaurant-app
cd restaurant-app
claude
```

### Step 1.2: Run SDD Init

In Claude Code, run:

```
/sdd-init --name restaurant-app
```

SDD will guide you through product discovery. Here's how to answer for our restaurant app:

**Product Discovery Questions:**

| Question | Your Answer |
|----------|-------------|
| What does your product do? | A restaurant management system for viewing menus and placing orders |
| Who are the users? | Restaurant staff and customers |
| What's the primary domain? | Restaurant Operations |
| What type of application? | Fullstack (backend + frontend) |

**Component Recommendation:**

SDD will recommend components based on your answers. Accept the default recommendation, which typically includes:
- config (mandatory)
- contract (API specification)
- server (backend)
- webapp (frontend)
- database (PostgreSQL)
- helm (Kubernetes deployment)
- testing (E2E tests)
- cicd (GitHub Actions)

**Approval:**

Review the configuration summary and type `yes` to approve.

SDD will now scaffold ~50+ files. This takes a few minutes.

### Step 1.3: Explore the Generated Structure

After scaffolding completes, you'll have:

```
restaurant-app/
├── changes/                    # Where feature specs live
├── specs/
│   ├── domain/
│   │   └── glossary.md        # Business terminology
│   └── architecture/
│       └── overview.md        # System architecture
├── components/
│   ├── config/                # Centralized configuration
│   ├── contract/              # OpenAPI specification
│   ├── server/                # Node.js backend
│   ├── webapp/                # React frontend
│   ├── database/              # PostgreSQL migrations
│   ├── helm/                  # Kubernetes charts
│   ├── testing/               # E2E tests
│   └── cicd/                  # CI/CD workflows
├── sdd-settings.yaml          # Project configuration
└── package.json               # Monorepo workspace
```

### Step 1.4: Install Dependencies

```bash
npm install
```

---

## Part 2: Create the Menu Feature

Now let's build the first feature: menu management.

### Step 2.1: Create a Feature Branch

```bash
git checkout -b feature/menu-management
```

### Step 2.2: Create the Feature Spec

```
/sdd-new-change --type feature --name menu-management
```

SDD will ask questions to create the specification:

| Question | Your Answer |
|----------|-------------|
| Describe this feature | Manage restaurant menu items including categories, prices, and availability |
| What domain does this belong to? | Menu |
| GitHub issue reference? | (leave blank or enter issue number) |

SDD's `change-creation` skill generates two files:

**`changes/2026/01/31/menu-management/SPEC.md`** - Complete technical specification including:
- User stories
- API endpoints (CRUD for menu items and categories)
- Data model (MenuItem, Category tables)
- Acceptance criteria
- Testing strategy

**`changes/2026/01/31/menu-management/PLAN.md`** - Implementation phases:
- Phase 1: API Contract
- Phase 2: Backend Implementation
- Phase 3: Frontend Implementation
- Phase 4: Integration & E2E Testing
- Phase 5: Review

### Step 2.3: Review and Refine the Spec

Open `SPEC.md` and review the generated content. The spec should include:

**User Stories:**
```markdown
- As a restaurant manager, I want to add menu items so customers can order them
- As a restaurant manager, I want to organize items by category for easy browsing
- As a customer, I want to view the menu with prices and descriptions
```

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/categories | List all categories |
| POST | /api/v1/categories | Create category |
| GET | /api/v1/menu-items | List menu items (filterable by category) |
| POST | /api/v1/menu-items | Create menu item |
| PUT | /api/v1/menu-items/:id | Update menu item |
| DELETE | /api/v1/menu-items/:id | Delete menu item |

**Data Model:**
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Acceptance Criteria:**
```markdown
- [ ] AC1: Given no categories exist, when manager creates a category, then it appears in the list
- [ ] AC2: Given categories exist, when manager adds a menu item, then it's associated with a category
- [ ] AC3: Given menu items exist, when customer views menu, then items are grouped by category
- [ ] AC4: Given a menu item exists, when manager marks it unavailable, then it shows as unavailable to customers
```

If you need changes, edit the SPEC.md directly. The spec is the source of truth.

### Step 2.4: Commit the Spec

After reviewing, commit using the SDD commit workflow:

```
/commit
```

---

## Part 3: Implement the Menu Feature

### Step 3.1: Run Implementation

```
/sdd-implement-change changes/2026/01/31/menu-management
```

SDD reads SPEC.md and PLAN.md, then executes each phase with specialized agents.

### Phase 1: API Contract (api-designer agent)

The `api-designer` agent updates `components/contract/src/openapi.yaml`:

```yaml
paths:
  /api/v1/categories:
    get:
      summary: List all categories
      operationId: listCategories
      responses:
        '200':
          description: List of categories
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Category'
    post:
      summary: Create a category
      operationId: createCategory
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCategoryRequest'
      responses:
        '201':
          description: Category created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Category'

  /api/v1/menu-items:
    get:
      summary: List menu items
      operationId: listMenuItems
      parameters:
        - name: categoryId
          in: query
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: List of menu items
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/MenuItem'
    # ... POST, PUT, DELETE endpoints

components:
  schemas:
    Category:
      type: object
      required: [id, name, displayOrder]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        displayOrder:
          type: integer

    MenuItem:
      type: object
      required: [id, name, price, isAvailable]
      properties:
        id:
          type: string
          format: uuid
        categoryId:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        price:
          type: number
        isAvailable:
          type: boolean
        imageUrl:
          type: string
```

TypeScript types are generated in `components/contract/generated/types.ts`.

### Phase 2: Backend Implementation (backend-dev agent)

The `backend-dev` agent implements the server using CMDO architecture:

**Controller** (`components/server/src/controllers/menu.controller.ts`):
```typescript
import { type Request, type Response } from 'express'
import { MenuItemModel } from '@/models/menu-item.model'
import { CategoryModel } from '@/models/category.model'

export const MenuController = {
  listCategories: async (_req: Request, res: Response) => {
    const categories = await CategoryModel.findAll()
    res.json(categories)
  },

  createCategory: async (req: Request, res: Response) => {
    const category = await CategoryModel.create(req.body)
    res.status(201).json(category)
  },

  listMenuItems: async (req: Request, res: Response) => {
    const { categoryId } = req.query
    const items = await MenuItemModel.findAll({ categoryId: categoryId as string })
    res.json(items)
  },

  createMenuItem: async (req: Request, res: Response) => {
    const item = await MenuItemModel.create(req.body)
    res.status(201).json(item)
  },

  updateMenuItem: async (req: Request, res: Response) => {
    const item = await MenuItemModel.update(req.params.id, req.body)
    res.json(item)
  },

  deleteMenuItem: async (req: Request, res: Response) => {
    await MenuItemModel.delete(req.params.id)
    res.status(204).send()
  },
}
```

**Model** (`components/server/src/models/menu-item.model.ts`):
```typescript
import { MenuItemDAL } from '@/dal/menu-item.dal'
import type { MenuItem, CreateMenuItemRequest } from 'contract'

export const MenuItemModel = {
  findAll: async (filters: { categoryId?: string }): Promise<readonly MenuItem[]> => {
    return MenuItemDAL.findAll(filters)
  },

  create: async (data: CreateMenuItemRequest): Promise<MenuItem> => {
    // Business logic: validate price is positive
    if (data.price <= 0) {
      throw new Error('Price must be positive')
    }
    return MenuItemDAL.create(data)
  },

  update: async (id: string, data: Partial<CreateMenuItemRequest>): Promise<MenuItem> => {
    if (data.price !== undefined && data.price <= 0) {
      throw new Error('Price must be positive')
    }
    return MenuItemDAL.update(id, data)
  },

  delete: async (id: string): Promise<void> => {
    return MenuItemDAL.delete(id)
  },
}
```

**DAL** (`components/server/src/dal/menu-item.dal.ts`):
```typescript
import { db } from '@/lib/database'
import type { MenuItem, CreateMenuItemRequest } from 'contract'

export const MenuItemDAL = {
  findAll: async (filters: { categoryId?: string }): Promise<readonly MenuItem[]> => {
    const query = filters.categoryId
      ? 'SELECT * FROM menu_items WHERE category_id = $1 ORDER BY name'
      : 'SELECT * FROM menu_items ORDER BY name'
    const params = filters.categoryId ? [filters.categoryId] : []
    const result = await db.query(query, params)
    return result.rows.map(mapToMenuItem)
  },

  create: async (data: CreateMenuItemRequest): Promise<MenuItem> => {
    const result = await db.query(
      `INSERT INTO menu_items (category_id, name, description, price, is_available, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.categoryId, data.name, data.description, data.price, data.isAvailable ?? true, data.imageUrl]
    )
    return mapToMenuItem(result.rows[0])
  },

  // ... update, delete implementations
}

const mapToMenuItem = (row: Record<string, unknown>): MenuItem => ({
  id: row.id as string,
  categoryId: row.category_id as string,
  name: row.name as string,
  description: row.description as string | undefined,
  price: Number(row.price),
  isAvailable: row.is_available as boolean,
  imageUrl: row.image_url as string | undefined,
})
```

**Unit Tests** (written during implementation via TDD):
```typescript
// components/server/tests/models/menu-item.model.test.ts
import { describe, it, expect, vi } from 'vitest'
import { MenuItemModel } from '@/models/menu-item.model'
import { MenuItemDAL } from '@/dal/menu-item.dal'

vi.mock('@/dal/menu-item.dal')

describe('MenuItemModel', () => {
  describe('create', () => {
    it('creates a menu item with valid data', async () => {
      const input = { name: 'Burger', price: 12.99, categoryId: 'cat-1' }
      const expected = { id: 'item-1', ...input, isAvailable: true }
      vi.mocked(MenuItemDAL.create).mockResolvedValue(expected)

      const result = await MenuItemModel.create(input)

      expect(result).toEqual(expected)
      expect(MenuItemDAL.create).toHaveBeenCalledWith(input)
    })

    it('rejects negative prices', async () => {
      const input = { name: 'Burger', price: -5, categoryId: 'cat-1' }

      await expect(MenuItemModel.create(input)).rejects.toThrow('Price must be positive')
    })
  })
})
```

### Phase 3: Frontend Implementation (frontend-dev agent)

The `frontend-dev` agent builds React components using MVVM:

**Hook (ViewModel)** (`components/webapp/src/hooks/useMenu.ts`):
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { menuApi } from '@/services/menu-api'
import type { MenuItem, Category } from 'contract'

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: menuApi.listCategories,
  })
}

export const useMenuItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['menu-items', categoryId],
    queryFn: () => menuApi.listMenuItems(categoryId),
  })
}

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: menuApi.createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
    },
  })
}

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
      menuApi.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
    },
  })
}
```

**Component (View)** (`components/webapp/src/components/MenuList.tsx`):
```typescript
import { useCategories, useMenuItems } from '@/hooks/useMenu'
import { MenuItemCard } from './MenuItemCard'

export const MenuList = () => {
  const { data: categories, isLoading: categoriesLoading } = useCategories()
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems()

  if (categoriesLoading || itemsLoading) {
    return <div className="loading">Loading menu...</div>
  }

  const itemsByCategory = menuItems?.reduce((acc, item) => {
    const categoryId = item.categoryId ?? 'uncategorized'
    return {
      ...acc,
      [categoryId]: [...(acc[categoryId] ?? []), item],
    }
  }, {} as Record<string, typeof menuItems>)

  return (
    <div className="menu-list">
      {categories?.map((category) => (
        <section key={category.id} className="menu-category">
          <h2>{category.name}</h2>
          <div className="menu-items">
            {itemsByCategory?.[category.id]?.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
```

**Component Tests**:
```typescript
// components/webapp/tests/components/MenuList.test.tsx
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MenuList } from '@/components/MenuList'
import { vi } from 'vitest'

vi.mock('@/hooks/useMenu', () => ({
  useCategories: () => ({
    data: [{ id: 'cat-1', name: 'Appetizers', displayOrder: 0 }],
    isLoading: false,
  }),
  useMenuItems: () => ({
    data: [
      { id: 'item-1', categoryId: 'cat-1', name: 'Nachos', price: 8.99, isAvailable: true },
    ],
    isLoading: false,
  }),
}))

describe('MenuList', () => {
  it('renders categories with their items', () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MenuList />
      </QueryClientProvider>
    )

    expect(screen.getByText('Appetizers')).toBeInTheDocument()
    expect(screen.getByText('Nachos')).toBeInTheDocument()
    expect(screen.getByText('$8.99')).toBeInTheDocument()
  })
})
```

### Phase 4: Integration & E2E Testing (tester agent)

The `tester` agent creates comprehensive tests:

**Integration Tests** (`components/testing/tests/integration/menu.test.ts`):
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from 'server'
import { db } from 'server/lib/database'

describe('Menu API', () => {
  beforeAll(async () => {
    await db.query('DELETE FROM menu_items')
    await db.query('DELETE FROM categories')
  })

  afterAll(async () => {
    await db.end()
  })

  describe('POST /api/v1/categories', () => {
    it('creates a category', async () => {
      const response = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Appetizers', displayOrder: 0 })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'Appetizers',
        displayOrder: 0,
      })
      expect(response.body.id).toBeDefined()
    })
  })

  describe('POST /api/v1/menu-items', () => {
    it('creates a menu item', async () => {
      // First create a category
      const categoryRes = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Main Courses', displayOrder: 1 })

      const response = await request(app)
        .post('/api/v1/menu-items')
        .send({
          categoryId: categoryRes.body.id,
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon with herbs',
          price: 24.99,
        })
        .expect(201)

      expect(response.body).toMatchObject({
        name: 'Grilled Salmon',
        price: 24.99,
        isAvailable: true,
      })
    })
  })

  describe('GET /api/v1/menu-items', () => {
    it('filters by category', async () => {
      const response = await request(app)
        .get('/api/v1/menu-items')
        .query({ categoryId: 'existing-category-id' })
        .expect(200)

      expect(Array.isArray(response.body)).toBe(true)
    })
  })
})
```

**E2E Tests** (`components/testing/tests/e2e/menu.spec.ts`):
```typescript
import { test, expect } from '@playwright/test'

test.describe('Menu Management', () => {
  test('manager can add a menu item', async ({ page }) => {
    // Navigate to admin menu page
    await page.goto('/admin/menu')

    // Click add item button
    await page.click('[data-testid="add-menu-item"]')

    // Fill form
    await page.fill('[name="name"]', 'New Dish')
    await page.fill('[name="price"]', '15.99')
    await page.fill('[name="description"]', 'A delicious new dish')
    await page.selectOption('[name="categoryId"]', { label: 'Main Courses' })

    // Submit
    await page.click('[type="submit"]')

    // Verify item appears in list
    await expect(page.locator('text=New Dish')).toBeVisible()
    await expect(page.locator('text=$15.99')).toBeVisible()
  })

  test('customer can view menu grouped by category', async ({ page }) => {
    await page.goto('/menu')

    // Verify categories are displayed
    await expect(page.locator('h2:text("Appetizers")')).toBeVisible()
    await expect(page.locator('h2:text("Main Courses")')).toBeVisible()

    // Verify items under categories
    const appetizersSection = page.locator('section:has(h2:text("Appetizers"))')
    await expect(appetizersSection.locator('.menu-item')).toHaveCount.greaterThan(0)
  })
})
```

### Phase 5: Review (reviewer agent)

The `reviewer` agent checks:
- All acceptance criteria are met
- Code follows CMDO/MVVM patterns
- Tests cover all requirements
- No security issues

If database changes exist, `db-advisor` reviews:
- Index recommendations
- Query performance
- Schema design

### Step 3.2: Commit Implementation

After all phases complete:

```
/commit
```

---

## Part 4: Add Order Management Feature

Let's add the second feature: order processing.

### Step 4.1: Create Order Feature Spec

```
/sdd-new-change --type feature --name order-management
```

**Answers:**
| Question | Your Answer |
|----------|-------------|
| Description | Process customer orders with status tracking and total calculation |
| Domain | Orders |

The generated spec includes:

**User Stories:**
- As a customer, I want to add items to my order
- As a customer, I want to see my order total
- As a staff member, I want to see incoming orders
- As a staff member, I want to update order status

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/orders | Create new order |
| GET | /api/v1/orders/:id | Get order details |
| GET | /api/v1/orders | List orders (staff) |
| PATCH | /api/v1/orders/:id/status | Update order status |

**Data Model:**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(200) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Step 4.2: Implement Orders

```
/sdd-implement-change changes/2026/01/31/order-management
```

SDD executes phases, creating:

**Backend:**
- `OrderController` - HTTP handlers
- `OrderModel` - Business logic (calculate totals, validate items)
- `OrderDAL` - Database operations

**Frontend:**
- `useOrder` hook - Order state management
- `OrderForm` component - Customer order placement
- `OrderList` component - Staff order management
- `OrderStatus` component - Status display and updates

**Tests:**
- Unit tests for total calculation
- Integration tests for order creation
- E2E tests for full order flow

---

## Part 5: Verify the Implementation

### Step 5.1: Verify Menu Feature

```
/sdd-verify-change changes/2026/01/31/menu-management
```

**Verification Report:**
```
Acceptance Criteria Coverage:
- AC1: Category creation ✓ (Integration test)
- AC2: Menu item creation ✓ (Integration test)
- AC3: Menu grouped by category ✓ (E2E test)
- AC4: Availability toggle ✓ (Unit + E2E test)

Test Results:
- Unit Tests: 18/18 passing
- Integration Tests: 6/6 passing
- E2E Tests: 4/4 passing

✅ All requirements verified
```

### Step 5.2: Verify Order Feature

```
/sdd-verify-change changes/2026/01/31/order-management
```

---

## Part 6: Run the Application

### Step 6.1: Start Database

Using the SDD CLI:

```
/sdd-run database setup restaurant-db
```

Or manually with Docker:
```bash
docker run -d --name restaurant-db \
  -e POSTGRES_DB=restaurant \
  -e POSTGRES_USER=restaurant \
  -e POSTGRES_PASSWORD=local_dev \
  -p 5432:5432 \
  postgres:15
```

### Step 6.2: Run Migrations

```
/sdd-run database migrate restaurant-db
```

### Step 6.3: Generate Configuration

```
/sdd-config generate --env local --component server
```

This merges `envs/default/config.yaml` with `envs/local/config.yaml` and outputs the final configuration.

### Step 6.4: Start the Backend

```bash
cd components/server
npm run dev
```

The server starts at `http://localhost:3000`.

### Step 6.5: Start the Frontend

```bash
cd components/webapp
npm run dev
```

The webapp starts at `http://localhost:5173`.

### Step 6.6: Test the Application

1. Open `http://localhost:5173` in your browser
2. Browse the menu (empty initially)
3. Go to `/admin/menu` to add categories and items
4. Place a test order
5. Check the order in the staff view

---

## Part 7: Deploy to Kubernetes

### Step 7.1: Build Container Images

```bash
docker build -t restaurant-server:latest ./components/server
docker build -t restaurant-webapp:latest ./components/webapp
```

### Step 7.2: Deploy with Helm

```bash
helm upgrade --install restaurant ./components/helm \
  --set image.server=restaurant-server:latest \
  --set image.webapp=restaurant-webapp:latest \
  --values ./components/helm/values-production.yaml
```

### Step 7.3: Verify Deployment

```bash
kubectl get pods -l app=restaurant
kubectl get services -l app=restaurant
```

---

## Summary

You've built a complete restaurant management system using SDD:

| What You Did | SDD Command |
|--------------|-------------|
| Initialized project | `/sdd-init --name restaurant-app` |
| Created menu spec | `/sdd-new-change --type feature --name menu-management` |
| Implemented menu | `/sdd-implement-change changes/.../menu-management` |
| Created order spec | `/sdd-new-change --type feature --name order-management` |
| Implemented orders | `/sdd-implement-change changes/.../order-management` |
| Verified features | `/sdd-verify-change changes/.../...` |
| Managed config | `/sdd-config generate --env local` |
| Ran database | `/sdd-run database setup restaurant-db` |

**Key Takeaways:**

1. **Spec First**: Every feature starts with a specification. The spec is the source of truth.

2. **Specialized Agents**: Different agents handle different concerns:
   - `api-designer` for contracts
   - `backend-dev` for server logic
   - `frontend-dev` for UI
   - `tester` for quality assurance
   - `reviewer` for compliance

3. **TDD Built-In**: Tests are written during implementation, not after.

4. **Consistent Architecture**: Backend uses CMDO, frontend uses MVVM. Every project follows the same patterns.

5. **Verification Closes the Loop**: `/sdd-verify-change` ensures the implementation matches the spec.

---

## Next Steps

Now that you have a working system, consider:

- **Add authentication**: `/sdd-new-change --type feature --name user-auth`
- **Add payments**: `/sdd-new-change --type feature --name payment-processing`
- **Add reservations**: `/sdd-new-change --type feature --name table-reservations`

Each feature follows the same workflow: spec → implement → verify.

---

## Troubleshooting

### "Command not found: /sdd-init"

The SDD plugin isn't installed. Run:
```bash
claude mcp add-plugin "https://raw.githubusercontent.com/LiorCohen/sdd/main/.claude-plugin/marketplace.json"
```

### "Database connection refused"

Ensure PostgreSQL is running:
```bash
docker ps | grep postgres
```

If not, start it:
```bash
/sdd-run database setup restaurant-db
```

### "Tests failing"

Run tests with verbose output:
```bash
npm test -- --reporter verbose
```

Check that database migrations are up to date:
```bash
/sdd-run database migrate restaurant-db
```

### "Types not generated"

Types are generated automatically during implementation. If types are missing:

1. Ensure the contract component has a valid `openapi.yaml`
2. Re-run the implementation: `/sdd-implement-change <change-dir>`
3. Check the contract build: `npm run build` in `components/contract/`

---

## Further Reading

- [Commands Reference](commands.md) - All SDD commands in detail
- [Agents Reference](agents.md) - Specialized agents and when they're used
- [Configuration Guide](config-guide.md) - Environment and config management
- [Workflows](workflows.md) - Common development workflows
