flowchart LR

    CLIENT[Frontend / Postman]

    subgraph Docker Compose

        UI[UI - Vite Preview]
        GATEWAY[API Gateway - Express]

        subgraph Backend Services

            PS[Portfolio Service]
            NS[Notification Service]

        end

        subgraph Infrastructure

            RMQ[RabbitMQ]
            PSQL1[(Portfolio PostgreSQL)]
            PSQL2[(Notification PostgreSQL)]
            REDIS[(Redis - Optional)]

        end

    end

    CLIENT --> UI
    CLIENT --> GATEWAY
    UI --> GATEWAY

    GATEWAY --> PS
    GATEWAY --> NS

    PS --> PSQL1

    PS --> RMQ

    RMQ --> NS

    NS --> PSQL2
    NS --> REDIS
