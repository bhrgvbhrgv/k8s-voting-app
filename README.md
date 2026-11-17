# Cloud-Native Voting Application (Kubernetes & Docker)

A lightweight cloud-native voting application built with **React**, **Node.js (Express)**, and **PostgreSQL**, ready to run with **Docker Compose** or on a local **Kubernetes (Kind)** cluster.

---

## Architecture

- **Vote (`vote/`)**: React 18 SPA + Node.js/Express API (port 5000 / NodePort 31002).
- **Result (`result/`)**: React 18 SPA + Node.js/Express + Socket.io for live updates (port 5001 / NodePort 31001).
- **Database (`db`)**: PostgreSQL 15 for data persistence (port 5432).

---

## Running with Docker Compose (Fastest)

To run the entire app locally without Kubernetes:

```bash
docker compose up --build -d
```

- **Vote UI**: http://localhost:5000
- **Live Results UI**: http://localhost:5001

To stop:
```bash
docker compose down -v
```

---

## Running on Kubernetes (Kind)

### 1. Create the Kind Cluster
If you haven't created the cluster yet:
```bash
kind create cluster --config=kind-cluster/config.yml
```

### 2. Build and Load Images
Build the container images locally and load them into the Kind nodes:
```bash
# Build images
docker build -t votingapp_vote:v2 ./vote
docker build -t votingapp_result:v2 ./result

# Load into Kind
kind load docker-image votingapp_vote:v2 --name kind
kind load docker-image votingapp_result:v2 --name kind
```

### 3. Deploy Kubernetes Manifests
```bash
kubectl apply -f k8s-specifications/
```

Verify all pods are running:
```bash
kubectl get pods
```

### 4. Access the Application
Forward ports to access the services from your browser:
```bash
# Terminal 1: Vote App (http://localhost:5000)
kubectl port-forward service/vote 5000:5000 --address=0.0.0.0

# Terminal 2: Result App (http://localhost:5001)
kubectl port-forward service/result 5001:5001 --address=0.0.0.0
```

---

## Cleanup Kind Cluster
```bash
kind delete cluster --name=kind
```
