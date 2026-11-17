# Cloud-Native Voting Application on Kubernetes (Kind)

A modern, production-grade cloud-native microservices voting application designed with a full **JavaScript / TypeScript / React / Node.js** stack and deployed to a multi-node **Kubernetes** cluster using **Kind**.

---

## Architecture Overview

```
                      +-----------------------------+
                      |       User Client           |
                      +-----------------------------+
                                     |
               +---------------------+---------------------+
               | (Port 5000)                               | (Port 5001)
               v                                           v
    +----------------------+                    +----------------------+
    |     vote-service     |                    |    result-service    |
    | (React 18 + Express) |                    | (React + Socket.io)  |
    +----------------------+                    +----------------------+
               |                                           ^
               | (Direct Upsert)                           | (Live Query / WS)
               +---------------------+---------------------+
                                     |
                                     v
                        +--------------------------+
                        |  PostgreSQL 15 Database  |
                        |      (Stateful DB)       |
                        +--------------------------+
```

### Components

- **Vote Frontend & API (`vote/`)**:
  - **Frontend**: Single Page Application built with **React 18** and **Vite**, featuring interactive voting buttons, instant toggle feedback, and cookie-based unique voter tracking.
  - **Backend**: **Node.js** and **Express**, providing `/api/config` and `/api/vote` endpoints with direct persistent writes to PostgreSQL.

- **Result Frontend & API (`result/`)**:
  - **Frontend**: Single Page Application built with **React 18** and **Socket.io-client**, showing animated real-time percentages and vote counts.
  - **Backend**: **Node.js**, **Express**, and **Socket.io**, polling PostgreSQL and broadcasting live changes via WebSockets.

- **Database (`db`)**:
  - **PostgreSQL 15 Alpine**: Persistent storage for all cast votes.

- **Kubernetes Infrastructure (`kind-cluster/` & `k8s-specifications/`)**:
  - Multi-node Kubernetes cluster configuration (1 control-plane, 2 worker nodes) running on **Kind**.
  - Declarative Kubernetes deployments and services with NodePort mapping for external ingress.

---

## Project Structure

```
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI for Docker image builds
├── docker-compose.yml           # Docker Compose definition for local orchestration
├── k8s-specifications/          # Kubernetes manifests
│   ├── db-deployment.yaml
│   ├── db-service.yaml
│   ├── result-deployment.yaml
│   ├── result-service.yaml
│   ├── vote-deployment.yaml
│   └── vote-service.yaml
├── kind-cluster/                # Kind cluster configuration and scripts
│   ├── config.yml               # Multi-node Kind cluster spec
│   ├── commands.md              # Cluster operations reference
│   ├── install_kind.sh
│   └── install_kubectl.sh
├── result/                      # Result service (React + Node.js + Socket.io)
│   ├── client/                  # React 18 frontend source (Vite)
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
└── vote/                        # Vote service (React + Node.js + Express)
    ├── client/                  # React 18 frontend source (Vite)
    ├── Dockerfile
    ├── package.json
    └── server.js
```

---

## Quickstart: Local Development with Docker Compose

To test the application locally without Kubernetes:

```bash
docker compose up --build -d
```

- **Vote Application**: http://localhost:5000
- **Live Results Dashboard**: http://localhost:5001

To stop the containers:

```bash
docker compose down -v
```

---

## Kubernetes Deployment (Kind)

### 1. Create Kind Cluster

```bash
cd kind-cluster
kind create cluster --config=config.yml
```

### 2. Build Container Images

```bash
docker build -t votingapp_vote:v2 ./vote
docker build -t votingapp_result:v2 ./result
```

### 3. Load Images to Kind

```bash
kind load docker-image votingapp_vote:v2 --name kind
kind load docker-image votingapp_result:v2 --name kind
```

### 4. Deploy Manifests

```bash
kubectl apply -f k8s-specifications/
```

Verify that all pods are up and healthy:

```bash
kubectl get pods,svc -o wide
```

### 5. Access Services

```bash
# Port-forward Vote service:
kubectl port-forward service/vote 5000:5000 --address=0.0.0.0

# Port-forward Result service:
kubectl port-forward service/result 5001:5001 --address=0.0.0.0
```

---

## Technologies Used

- **Frontend**: React 18, Vite, CSS3, FontAwesome, Socket.io-client
- **Backend**: Node.js, Express.js, Socket.io, `pg` (node-postgres)
- **Database**: PostgreSQL 15
- **Containerization**: Docker multi-stage builds, Docker Compose
- **Orchestration**: Kubernetes, Kind (Kubernetes in Docker)
- **CI/CD**: GitHub Actions

---

## License

This project is licensed under the MIT License.
