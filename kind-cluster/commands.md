# Kind Cluster Operations & Guide

This document contains step-by-step instructions for running the multi-tier voting application locally on a Kubernetes cluster powered by **Kind** (Kubernetes in Docker).

---

## 1. Prerequisites

- **Docker**: Engine running and accessible.
- **Kind**: CLI installed (`kind`).
- **kubectl**: Kubernetes CLI tool (`kubectl`).

---

## 2. Cluster Creation

Create a 3-node Kubernetes cluster (1 control-plane, 2 worker nodes):

```bash
kind create cluster --config=config.yml
```

Verify that all nodes are ready:

```bash
kubectl get nodes -o wide
```

---

## 3. Building and Loading Docker Images

Build the service images locally:

```bash
# Vote service (React + Express)
docker build -t votingapp_vote:v2 ./vote

# Result service (React + Express + Socket.io)
docker build -t votingapp_result:v2 ./result
```

Load the local images directly into the Kind cluster nodes:

```bash
kind load docker-image votingapp_vote:v2 --name kind
kind load docker-image votingapp_result:v2 --name kind
```

---

## 4. Deploying to Kubernetes

Apply the manifests:

```bash
kubectl apply -f ../k8s-specifications/
```

Check the status of all pods and services:

```bash
kubectl get pods,svc -o wide
```

Wait until all pods report `Running` status:

```bash
kubectl wait --for=condition=Ready pods --all --timeout=120s
```

---

## 5. Accessing the Application

Use `kubectl port-forward` to access both frontends:

```bash
# Vote App (React frontend) -> http://localhost:5000
kubectl port-forward service/vote 5000:5000 --address=0.0.0.0

# Result App (React live results) -> http://localhost:5001
kubectl port-forward service/result 5001:5001 --address=0.0.0.0
```

---

## 6. Teardown Cluster

To delete the cluster:

```bash
kind delete cluster --name=kind
```
