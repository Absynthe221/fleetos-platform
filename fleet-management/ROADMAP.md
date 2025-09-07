# Roadmap

## Next (2–4 weeks)
- Driver–Security workflow end-to-end (pre/post trip, lock state, audit)
- Yard summary API + interactive yard map v2 (spot types/capacity rules)
- Admin audit trail views and reports
- Telematics device registration + ingestion pipeline (normalize signals)
- Real-time updates (SSE/WebSocket) for yard/dashboards
- Basic alerts center (documents, inspections fail, maintenance due)

## Later (quarter)
- Driver mobile app (PWA): scan, inspections, assignments
- Predictive maintenance + rules engine
- Inventory/parts linkage and work orders
- Multi-depot clustering and capacity planning
- White-labeling (themes, branding packs)
- S3/R2 attachments + CDN; Redis caching/queues; observability (OTel)

## Cross-cutting
- RBAC hardening, audit “who/what/when”
- Data quality: VIN/plate uniqueness, spot capacity vs truck dimensions
- Performance: pagination, indexes, background jobs

## Acceptance (per feature)
- API routes documented, role-tested, error-handled
- UI flows demoable with seed data
- KPIs visible on dashboard; exports downloadable
- Audit trail filters by truck, user, action, date
