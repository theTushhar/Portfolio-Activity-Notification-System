sequenceDiagram

    participant Client
    participant APIGateway
    participant PortfolioService
    participant PortfolioDB
    participant RabbitMQ
    participant NotificationService
    participant PreferenceStore
    participant NotificationDB

    Client->>APIGateway: POST /api/portfolio/transactions

    APIGateway->>PortfolioService: Forward Request

    PortfolioService->>PortfolioDB: Save Transaction

    PortfolioService->>RabbitMQ: Publish TransactionCreatedEvent

    PortfolioService-->>APIGateway: Success Response

    APIGateway-->>Client: 200 OK

    RabbitMQ->>NotificationService: Consume Event

    NotificationService->>PreferenceStore: Read User Preferences (DB/Redis)

    NotificationService->>NotificationDB: Save Notification

    NotificationService-->>RabbitMQ: ACK / Retry / DLQ on failure
