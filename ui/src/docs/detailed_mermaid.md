flowchart TD

    %% =========================
    %% CLIENT
    %% =========================
    CLIENT[Client / Frontend App]

    %% =========================
    %% API GATEWAY
    %% =========================
    GATEWAY[API Gateway<br/>Node.js + Express + http-proxy-middleware]

    CLIENT -->|HTTP REST Request| GATEWAY

    %% =========================
    %% PORTFOLIO SERVICE
    %% =========================
    subgraph PS[Portfolio Service]

        P_CONTROLLER[REST Controller]
        P_SERVICE[Portfolio Business Logic]
        P_REPOSITORY[Portfolio Repository]
        P_DB[(Portfolio DB)]

        P_EVENT[TransactionCreatedEvent]

        P_LOG[Structured Logger]

        P_CONTROLLER --> P_SERVICE
        P_SERVICE --> P_REPOSITORY
        P_REPOSITORY --> P_DB

        P_SERVICE --> P_LOG
        P_SERVICE --> P_EVENT

    end

    %% =========================
    %% MESSAGE BROKER
    %% =========================
    subgraph MQ[Message Broker - RabbitMQ]

        EXCHANGE[Exchange]
        QUEUE[Notification Queue]
        DLQ[Dead Letter Queue]

        EXCHANGE --> QUEUE
        QUEUE --> DLQ

    end

    %% =========================
    %% NOTIFICATION SERVICE
    %% =========================
    subgraph NS[Notification Service]

        N_CONSUMER[Event Consumer]
        N_RULES[Notification Rules Engine]
        N_PREFS[User Preferences Check]
        N_CACHE[(Redis Cache - Optional)]

        N_SERVICE[Notification Service Logic]
        N_EMAIL[Email Service]

        N_REPOSITORY[Notification Repository]
        N_DB[(Notification DB)]
        N_PREF_DB[(User Preferences DB)]

        N_LOG[Structured Logger]
        N_RETRY[Retry With Backoff]

        N_CONSUMER --> N_RULES
        N_RULES --> N_PREFS
        N_PREFS --> N_CACHE
        N_PREFS --> N_PREF_DB
        N_PREFS --> N_SERVICE

        N_SERVICE --> N_REPOSITORY
        N_REPOSITORY --> N_DB
        N_SERVICE --> N_EMAIL

        N_SERVICE --> N_LOG
        N_SERVICE --> N_RETRY

    end

    %% =========================
    %% REQUEST FLOW
    %% =========================
    GATEWAY -->|Route Request| P_CONTROLLER

    %% =========================
    %% EVENT FLOW
    %% =========================
    P_EVENT -->|Publish Event| EXCHANGE

    QUEUE -->|Consume Event| N_CONSUMER

    %% =========================
    %% RESPONSE FLOW
    %% =========================
    P_CONTROLLER -->|Immediate Success Response| CLIENT

    %% =========================
    %% OPTIONAL FAILURE FLOW
    %% =========================
    N_RETRY -->|Retries Failed| DLQ
