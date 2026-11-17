#!/usr/bin/env bash
set -euo pipefail

echo "=== Deploying Prometheus & Grafana to Kubernetes ==="

# Apply monitoring manifests
kubectl apply -f monitoring/00-namespace.yaml
kubectl apply -f monitoring/01-prometheus-rbac.yaml
kubectl apply -f monitoring/02-prometheus-configmap.yaml
kubectl apply -f monitoring/03-prometheus-deployment.yaml
kubectl apply -f monitoring/04-grafana-config.yaml
kubectl apply -f monitoring/05-grafana-dashboard-cm.yaml
kubectl apply -f monitoring/06-grafana-deployment.yaml

echo "Waiting for Prometheus and Grafana pods to be ready..."
kubectl rollout status deployment/prometheus -n monitoring --timeout=120s
kubectl rollout status deployment/grafana -n monitoring --timeout=120s

echo "Monitoring stack deployed successfully!"
echo "Access Prometheus: kubectl port-forward -n monitoring service/prometheus 9090:9090"
echo "Access Grafana:    kubectl port-forward -n monitoring service/grafana 3000:3000 (User: admin / admin)"
