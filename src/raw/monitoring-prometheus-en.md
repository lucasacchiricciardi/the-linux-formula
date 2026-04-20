---
title: Monitoring with Prometheus and Grafana
date: 2026-04-10
tags: [monitoring, prometheus, grafana, observability]
lang: en
---

## Enterprise Monitoring with Prometheus

Prometheus and Grafana form the ideal pair for modern monitoring.

### Prometheus

- Time-series database
- Pull-based metrics
- PromQL for queries
- Service discovery

### Grafana

- Advanced visualizations
- Custom dashboards
- Integrated alerting
- Multi-source data

### Basic Setup

```bash
# Docker compose to get started
prometheus:
  image: prom/prometheus
grafana:
  image: grafana/grafana
```

### Best Practices

- Custom metrics for applications
- SLO/SLA monitoring
- Alert on percentiles (P95, P99)