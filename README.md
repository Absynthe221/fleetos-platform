## FleetOS — Fleet Management System

Modern fleet operations: trucks, yard, inspections, HOS, maintenance, alerts, RBAC.

### Stack
- API: NestJS, Prisma (SQLite), JWT RBAC, SSE
- Web: Next.js (App Router), Tailwind, react-hot-toast

### Quickstart
1) Install
```
cd api && npm i
cd ../web && npm i
```

2) Env setup
- Copy examples and fill values as needed
```
cp api/.env.example api/.env
cp web/.env.example web/.env
```

3) Prisma migrate (SQLite)
```
cd api
npx prisma migrate deploy
```

4) Run
```
# API
cd api && npm run start:dev

# Web
cd ../web && npm run dev
```

5) Seed demo users
```
cd api
node scripts/seed-admin.js admin@example.com admin123
node scripts/seed-driver.js driver@example.com driver123 "Demo Driver" "+15555550123"
```

6) Login
- Admin: `admin@example.com` / `admin123`
- Driver: `driver@example.com` / `driver123`

### Environment variables
See `api/.env.example` and `web/.env.example`.

Notes:
- Dev tokens: disabled by default. Enable by setting `NEXT_PUBLIC_ENABLE_DEV_TOKEN=true` for local-only use.
- Driver-only mode: set `NEXT_PUBLIC_DRIVER_ONLY=true` to restrict UI to driver workflows.

### Features
- Trucks CRUD + barcode/QR; lookup by plate/VIN/barcode
- Yard with live updates (SSE), auto-assign inbound, free on outbound
- Security console: lock/unlock, inbound/outbound, driver assign
- Driver inspections (pre/post), start/end KM; HOS with nudges/violations; offline queue
- Maintenance logs, oil-change tracking (10,000km), schedules; CSV/PDF exports
- Alerts center: expiring documents, failing inspections, upcoming services, oil change due/soon, recent gate events
- Admin users: create, assign depot, activate/deactivate; RBAC enforced

### Production tips
- Provide strong `JWT_SECRET` in API `.env`
- Disable dev-token in Web `.env`
- Configure Twilio vars for SMS (optional)

### License
Add a LICENSE file appropriate for your use.


