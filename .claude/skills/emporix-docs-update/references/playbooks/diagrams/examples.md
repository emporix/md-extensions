# Examples

## Example 1: Flowchart from process text

Input:
"Create a flowchart for quote approval with customer, employee, and quote states. Use our brand style."

Output pattern:

```mermaid
---
config:
  layout: fixed
  theme: base
  look: classic
  themeVariables:
    background: transparent
    lineColor: "#9CBBE3"
    arrowheadColor: "#9CBBE3"
    edgeLabelBackground: "#FFC128"
    edgeLabelTextColor: "#4C5359"
---
flowchart TD
    CUSTOMER(CUSTOMER) -->|Requests quote| QUOTE_REQUEST(QUOTE: AWAITING)
    EMPLOYEE(EMPLOYEE) -->|Creates quote| OPEN(QUOTE: OPEN)
    QUOTE_REQUEST -->|Notifies| EMPLOYEE
    OPEN -->|Sent to customer| CUSTOMER
    style CUSTOMER fill:#A1BDDC,stroke:#4C5359
    style EMPLOYEE fill:#99ACBC,stroke:#4C5359
    style QUOTE_REQUEST fill:#F2F6FA,stroke:#4C5359
    style OPEN fill:#F2F6FA,stroke:#4C5359
```

## Example 2: Sequence diagram from API interaction steps

Input:
"Create a sequence diagram for login request, token validation, and response."

Output pattern:

```mermaid
---
config:
  layout: fixed
  theme: base
  themeVariables:
    primaryColor: "#DDE6EE"
    primaryBorderColor: "#4C5359"
    actorBkg: "#DDE6EE"
    actorBorder: "#4C5359"
    actorLineColor: "#4C5359"
    signalColor: "#E86C07"
    signalTextColor: "#7B8B99"
    background: transparent
---
sequenceDiagram
    participant U as User
    participant A as API
    participant I as Identity Service
    U->>A: POST /login
    A->>I: Validate credentials
    I-->>A: Token issued
    A-->>U: 200 OK + token
```

## Example 3: Class diagram with branded boxes

Input:
"Model Order, Customer, and Payment relationships as class diagram."

Output pattern:

```mermaid
---
config:
  layout: fixed
  theme: base
  look: classic
  themeVariables:
    background: transparent
    lineColor: "#9CBBE3"
    arrowheadColor: "#9CBBE3"
---
classDiagram
    class Order {
        id : String
        total : Number
    }
    class Customer {
        id : String
        email : String
    }
    class Payment {
        id : String
        method : String
    }
    Order --> Customer : belongsTo
    Order --> Payment : uses
    style Order fill:#F2F6FA,stroke:#4C5359
    style Customer fill:#F2F6FA,stroke:#4C5359
    style Payment fill:#F2F6FA,stroke:#4C5359
```
