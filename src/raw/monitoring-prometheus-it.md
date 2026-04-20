---
title: Monitoring con Prometheus e Grafana
date: 2026-04-10
tags: [monitoring, prometheus, grafana, observability]
lang: it
---

## Monitoraggio Enterprise con Prometheus

Prometheus e Grafana formano la coppia ideale per il monitoring moderno.

### Prometheus

- Time-series database
- Pull-based metrics
- PromQL per queries
- Service discovery

### Grafana

- Visualizzazioni avanzate
- Dashboards personalizzati
- Alerting integrato
- Multi-source data

### Setup Base

```bash
# Docker compose per iniziare
prometheus:
  image: prom/prometheus
grafana:
  image: grafana/grafana
```

### Best Practices

- Metriche custom per applicazioni
- SLO/SLA monitoring
- Alert su percentili (P95, P99)