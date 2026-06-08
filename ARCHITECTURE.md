# ShadowEval Architecture

## Current Architecture

### Present State Diagram

```mermaid
graph TB
    Client["Client Applications"]
    
    subgraph "API Layer"
        ChatAPI["Chat API<br/>POST /chat"]
        MetricsAPI["Metrics API<br/>GET /metrics"]
    end
    
    subgraph "Core Services"
        ShadowEval["Shadow Evaluation<br/>Service"]
        Evaluation["Evaluation<br/>Service"]
        Metrics["Metrics<br/>Service"]
    end
    
    subgraph "Client Layer"
        Primary["Primary Client"]
        Candidate["Candidate Client"]
    end
    
    subgraph "Queue Management"
        EvalQueue["Evaluation<br/>Queue"]
    end
    
    subgraph "Utilities"
        JsonExt["JSON Extractor"]
        RespComp["Response Comparator"]
    end
    
    Client -->|POST| ChatAPI
    Client -->|GET| MetricsAPI
    
    ChatAPI --> ShadowEval
    MetricsAPI --> Metrics
    
    ShadowEval --> Evaluation
    ShadowEval --> Primary
    ShadowEval --> Candidate
    
    Evaluation --> EvalQueue
    Evaluation --> JsonExt
    Evaluation --> RespComp
    
    Metrics -->|Reads| EvalQueue
    
    Primary -->|HTTP| PrimaryAPI["Primary API<br/>Port 3000"]
    Candidate -->|HTTP| CandidateAPI["Candidate API<br/>Port 4000"]
    
    style ChatAPI fill:#4A90E2
    style MetricsAPI fill:#4A90E2
    style ShadowEval fill:#7ED321
    style Evaluation fill:#7ED321
    style Metrics fill:#7ED321
```

### Current Data Flow

```mermaid
sequenceDiagram
    participant Client
    participant ShadowAPI as Shadow API
    participant ShadowService as Shadow Service
    participant Primary as Primary Client
    participant Candidate as Candidate Client
    participant Queue as Eval Queue
    participant Metrics as Metrics Service

    Client->>ShadowAPI: POST /chat (prompt)
    ShadowAPI->>ShadowService: Forward request
    
    par Parallel Evaluation
        ShadowService->>Primary: Send prompt
        ShadowService->>Candidate: Send prompt
    end
    
    Primary-->>ShadowService: Response
    Candidate-->>ShadowService: Response
    
    ShadowService->>ShadowService: Compare responses
    ShadowService->>Queue: Store result
    
    Client->>MetricsAPI: GET /metrics
    MetricsAPI->>Metrics: Fetch stats
    Metrics->>Queue: Read data
    Queue-->>Metrics: Return data
    Metrics-->>MetricsAPI: Return metrics
    MetricsAPI-->>Client: Return response
```

---

## Future Architecture

### Scalable State with Data Pipeline

```mermaid
graph TB
    Client["Client Applications"]
    
    subgraph "API Gateway Layer"
        ChatAPI["Chat API<br/>POST /chat"]
        MetricsAPI["Metrics API<br/>GET /metrics"]
        HealthCheck["Health Check<br/>GET /health"]
    end
    
    subgraph "Core Services"
        ShadowEval["Shadow Evaluation<br/>Service"]
        Evaluation["Evaluation<br/>Service"]
        Metrics["Metrics<br/>Service"]
        Cache["Cache Service<br/>Redis"]
    end
    
    subgraph "Client Layer"
        Primary["Primary Client"]
        Candidate["Candidate Client"]
    end
    
    subgraph "Message Queue Layer"
        Kafka["Apache Kafka<br/>Multi-Topic"]
        Topic1["evaluation.requests"]
        Topic2["evaluation.responses"]
        Topic3["evaluation.metrics"]
        Topic4["evaluation.errors"]
    end
    
    subgraph "Job Queue Layer"
        Bull["Bull Queue<br/>Job Processor"]
        BullWorker1["Worker 1"]
        BullWorker2["Worker 2"]
        BullWorkerN["Worker N"]
    end
    
    subgraph "Data Storage Layer"
        PostgreSQL["PostgreSQL<br/>Operational DB"]
        ClickHouse["ClickHouse<br/>Analytics DB"]
        Redis["Redis<br/>Cache & Sessions"]
    end
    
    subgraph "Utilities"
        JsonExt["JSON Extractor"]
        RespComp["Response Comparator"]
        Transformer["Data Transformer"]
    end
    
    Client -->|POST| ChatAPI
    Client -->|GET| MetricsAPI
    Client -->|GET| HealthCheck
    
    ChatAPI --> Cache
    ChatAPI -->|Cache Miss| ShadowEval
    
    ShadowEval --> Evaluation
    ShadowEval --> Primary
    ShadowEval --> Candidate
    
    Evaluation --> Topic1
    
    Primary -->|HTTP| PrimaryAPI["Primary API<br/>Port 3000"]
    Candidate -->|HTTP| CandidateAPI["Candidate API<br/>Port 4000"]
    
    PrimaryAPI -->|Response| Topic2
    CandidateAPI -->|Response| Topic2
    
    Topic1 --> Kafka
    Topic2 --> Kafka
    
    Kafka --> Bull
    Bull --> BullWorker1
    Bull --> BullWorker2
    Bull --> BullWorkerN
    
    BullWorker1 --> JsonExt
    BullWorker2 --> RespComp
    BullWorkerN --> Transformer
    
    Transformer --> PostgreSQL
    Transformer --> Topic3
    Transformer --> Topic4
    
    Topic3 --> Kafka
    Topic4 --> Kafka
    
    Kafka --> ClickHouse
    Kafka --> Redis
    
    Metrics -->|Read| PostgreSQL
    Metrics -->|Cache| Redis
    Metrics -->|Analytics| ClickHouse
    
    Cache -->|Fallback| PostgreSQL
    
    style ChatAPI fill:#4A90E2
    style MetricsAPI fill:#4A90E2
    style HealthCheck fill:#4A90E2
    style ShadowEval fill:#7ED321
    style Evaluation fill:#7ED321
    style Metrics fill:#7ED321
    style Kafka fill:#FF6B6B
    style Bull fill:#FFB84D
    style PostgreSQL fill:#50C878
    style ClickHouse fill:#FFD700
    style Redis fill:#DC143C
    style Cache fill:#DC143C
```

### Future Data Flow with Kafka & Bull

```mermaid
sequenceDiagram
    participant Client
    participant Cache as Cache<br/>Redis
    participant ShadowAPI as Shadow API
    participant ShadowService as Shadow Service
    participant Primary as Primary Client
    participant Candidate as Candidate Client
    participant Kafka as Apache Kafka
    participant Bull as Bull Queue
    participant Worker as Job Worker
    participant PG as PostgreSQL
    participant CH as ClickHouse
    participant Metrics as Metrics Service

    Client->>Cache: Check cache
    alt Cache Hit
        Cache-->>Client: Return cached result
    else Cache Miss
        Client->>ShadowAPI: POST /chat (prompt)
        ShadowAPI->>ShadowService: Forward request
        
        par Parallel Evaluation
            ShadowService->>Primary: Send prompt
            ShadowService->>Candidate: Send prompt
        end
        
        Primary-->>ShadowService: Response
        Candidate-->>ShadowService: Response
        
        ShadowService->>Kafka: Publish to evaluation.requests<br/>(Topic 1)
        
        par Parallel Processing
            ShadowService->>Kafka: Publish to evaluation.responses<br/>(Topic 2)
            Kafka->>Bull: Pick up from topics
        end
        
        Bull->>Worker: Assign job to available worker
        
        par Worker Processing
            Worker->>Worker: Extract JSON
            Worker->>Worker: Compare responses
            Worker->>Worker: Transform data
        end
        
        Worker->>Kafka: Publish to evaluation.metrics<br/>(Topic 3)
        Worker->>PG: Store operational data
        
        Kafka->>ClickHouse: Stream metrics data
        Kafka->>Cache: Update cache entry
        
        PG-->>ShadowAPI: Confirmation
        ShadowAPI-->>Client: Return response
    end
    
    Client->>ShadowAPI: GET /metrics
    ShadowAPI->>Metrics: Fetch aggregated metrics
    
    par Metrics Gathering
        Metrics->>Cache: Check cached metrics
        Metrics->>PG: Query recent data
        Metrics->>ClickHouse: Query analytics
    end
    
    Metrics-->>ShadowAPI: Return metrics
    ShadowAPI-->>Client: Return response
```

---

## Component Details

### Kafka Topics Architecture

| Topic | Purpose | Consumers | Data |
|-------|---------|-----------|------|
| `evaluation.requests` | Incoming evaluation requests | Bull Queue, Logger | Prompt, request ID, timestamp |
| `evaluation.responses` | Response data from both clients | Bull Queue, Transformer | Primary response, Candidate response, timestamps |
| `evaluation.metrics` | Computed metrics and comparisons | ClickHouse, Cache, Metrics Service | Similarity, latency, differences |
| `evaluation.errors` | Error tracking and logging | ClickHouse, Alert System | Error type, stack trace, context |

### Database Schema Overview

**PostgreSQL (Operational)**
```
- evaluation_requests (id, prompt, created_at)
- evaluation_responses (id, request_id, source, response, timestamp)
- evaluation_results (id, request_id, similarity, latency, status)
- user_sessions (id, user_id, created_at, last_activity)
```

**ClickHouse (Analytics)**
```
- evaluation_metrics (request_id, timestamp, similarity, latency, error_count)
- performance_analytics (timestamp, source, avg_latency, throughput)
- anomaly_detection (timestamp, metric_type, value, is_anomaly)
```

**Redis (Cache)**
```
- evaluation:{request_id} → cached result (TTL: 1 hour)
- metrics:{period} → aggregated metrics (TTL: 5 minutes)
- sessions:{session_id} → session data (TTL: 24 hours)
```

### Bull Job Processing

**Job Types:**
1. `ProcessEvaluation` - Extract and compare responses
2. `AggregateMetrics` - Compute analytics
3. `TransformData` - Normalize and enrich data
4. `PublishMetrics` - Push to ClickHouse

**Concurrency:** Multiple workers processing jobs in parallel

---

## Migration Path

### Phase 1: Add Kafka
- Introduce Kafka topics for event streaming
- Implement producers in shadow service
- Begin event-driven architecture

### Phase 2: Add Bull Queue
- Integrate Bull with Kafka consumers
- Move async processing to job workers
- Implement job retries and error handling

### Phase 3: Add PostgreSQL
- Migrate from in-memory storage
- Implement transactional consistency
- Set up backup and replication

### Phase 4: Add ClickHouse
- Stream metrics from Kafka to ClickHouse
- Build analytics dashboards
- Implement time-series queries

### Phase 5: Add Redis
- Implement caching layer
- Add session management
- Optimize frequently accessed data

---

## Scaling Considerations

### Horizontal Scaling
- **Kafka**: Add broker nodes for increased throughput
- **Bull**: Add worker processes/nodes
- **PostgreSQL**: Read replicas for query scaling
- **ClickHouse**: Distributed cluster setup
- **Redis**: Redis Cluster for high availability

### Vertical Scaling
- Increase resources (CPU, RAM) for each component
- Optimize database indexes
- Tune JVM/Node.js heap sizes

### Load Balancing
```
Client → Load Balancer → Multiple API instances
           ↓
        API Gateway (handles /chat, /metrics, /health)
           ↓
        Service mesh (Kafka, Bull, Cache lookup)
```

---

## Monitoring & Observability

```mermaid
graph TB
    Services["Services<br/>Chat API<br/>Evaluation<br/>Metrics"]
    
    subgraph "Monitoring Stack"
        Prometheus["Prometheus<br/>Metrics Collector"]
        Grafana["Grafana<br/>Dashboards"]
        ELK["ELK Stack<br/>Logs & Traces"]
    end
    
    subgraph "Alerts"
        AlertMgr["Alert Manager"]
        Slack["Slack Notifications"]
        PagerDuty["PagerDuty"]
    end
    
    Services -->|Export metrics| Prometheus
    Prometheus --> Grafana
    Services -->|Send logs| ELK
    Prometheus -->|Alert rules| AlertMgr
    AlertMgr -->|Critical| PagerDuty
    AlertMgr -->|Warnings| Slack
```

---

## Future Enhancements

- **Machine Learning**: Anomaly detection on metrics
- **Real-time Dashboards**: WebSocket-based live metrics
- **Auto-scaling**: Kubernetes-based orchestration
- **Multi-region**: Geographic distribution for latency optimization
- **Data Warehouse**: Advanced analytics and reporting
