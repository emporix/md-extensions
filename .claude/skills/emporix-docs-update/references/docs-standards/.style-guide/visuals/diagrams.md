---
description: Diagrams are created using Mermaid.
icon: diagram-project
---

# Diagrams

* Use Mermaid code format.
* Add general configuration to adapt to the specific style.
* Every diagram must use the Emporix branding: the configuration, the transparent background, and the color palette described on this page. Do not publish a diagram with the default Mermaid theme or with colors outside the palette.
* Create and validate diagrams with the `emporix-docs-diagrams` skill from [emporix-ai-sdlc-skills](https://github.com/emporix/emporix-ai-sdlc-skills) (it applies the configuration below and validates the code with Mermaid-MCP). Do not write Mermaid styling by hand.
* Keep labels short and use the same name for the same element across the page.
* Add a figure caption that follows [Images & Icons](images-and-icons.md#placing-pictures-in-docs) when the diagram needs one.

## Flowchart

* Config (`theme: base` is required for the brand colors and the transparent background, see "Transparent background" below):

```
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
```

* Subgraphs styling options

```
classDef Class_01 stroke-width:1px, stroke-dasharray: 0, stroke:#A1BDDC, fill:#A1BDDC
classDef Class_02 stroke-width:1px, stroke-dasharray: 0, stroke:#DDE6EE, fill:#DDE6EE
classDef Class_03 stroke-width:1px, stroke-dasharray: 0, stroke:#3B73BB, fill:#3B73BB
```

* Font color change:

```
style subGraph0 color:#FFFFFF
style subGraph1 color:#FFFFFF
```

*   Diagram elements

    * Shape

    ```
    A@{ shape: rounded}
    ```

    * Colors

    ```
    classDef Class_04 fill:#F2F6FA, stroke:#E86C07
    ```

    * Transparent background

    To achieve transparent background that works both for light and dark browser mode, you need to use `theme: base` as this is the only one that can be customized.

    ```
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
    ```

## Sequence

* It’s possible to change the basic config for the styling with themeVariables. The list of possible variables for changing the theme is on the website - Mermaid.
* Participants are actors in the config.
* Config:

```
---
config:
  layout: fixed
  theme: base
  themeVariables:
    primaryColor: '#DDE6EE'
    primaryBorderColor: '#4C5359'
    actorBkg: '#DDE6EE'
    actorBorder: '#4C5359'
    actorLineColor: '#4C5359'
    signalColor: '#E86C07'
    signalTextColor: '#7B8B99'
    background: transparent 
---
```

## Class

The styling can be customized up to a point - couldn’t find the way to change the yellow for approval, it’s only possible to change the style for class boxes

```
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
    class Approval {
        id : String
        approver : Customer
        requestor : Customer
        resource : ResourceCart
    }

    class Customer {
        id : String
        firstName : String
        lastName : String
    }

    class ResourceCart {
        id : String
        totalPrice : Price
        subTotalPrice : Price
        subtotalAggregate : SubtotalAggregate
        siteCode : String
        deliveryWindow : DeliveryWindow
        items : Item[]
    }
    Approval --> Customer : approver
    Approval --> Customer : requestor
    Approval --> ResourceCart : resource

    class Approval
    class Customer
    class ResourceCart
    style Approval fill:#F2F6FA, stroke:#4C5359
    style Customer fill:#F2F6FA, stroke:#4C5359
    style ResourceCart fill:#F2F6FA, stroke:#4C5359
```

## Graph

{% hint style="success" %}
In a graph diagram, the brackets decide on the shape of the block \[] - square, () - rounded, for example: CART\[CART] or CART(CART).
{% endhint %}

* Config

````
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
graph TD
    CUSTOMER1(CUSTOMER)
    PRODUCTS(PRODUCTS)
    
    CUSTOMER1 -->|Browses for products| PRODUCTS
    
    PRODUCTS -->|Adds to cart| CART(CART)    
    PRODUCTS -->|Contacts employee| EMPLOYEE1(EMPLOYEE)
    
    EMPLOYEE1 -->|Creates quote| CREATING(QUOTE: CREATING)
    CART -->|Requests quote| QUOTE_REQUEST(QUOTE: AWAITING)
    
    QUOTE_REQUEST -->|Notifies| EMPLOYEE2(EMPLOYEE)
    
    CREATING -->|Quote created| OPEN(QUOTE: OPEN)
    
    IN_PROGRESS -->|Approves| OPEN   
    EMPLOYEE2 -->|Declines| DECLINED_MERCHANT(QUOTE: DEC_BY_MERCHANT) 
    EMPLOYEE2 -->|Approves| OPEN
    
    DECLINED_MERCHANT -->|Notifies| CUSTOMER3(CUSTOMER)

    CUSTOMER2 -->|Validity expired| EXPIRED(QUOTE: EXPIRED)
    
    OPEN -->|Sent to customer| CUSTOMER2(CUSTOMER)
    
    CUSTOMER2 -->|Approves| ACCEPTED(QUOTE: ACCEPTED)
    CUSTOMER2 -->|Rejects| DECLINED(QUOTE: DECLINED)
    CUSTOMER2 -->|Requests changes| EMPLOYEE3(EMPLOYEE)
    EMPLOYEE3 -->|Changes| IN_PROGRESS(QUOTE: IN PROGRESS)
    
    ACCEPTED -->|Triggers| ORDER(Order Created)
    
    style CREATING fill:#F2FAFE, stroke:#4C5359
    style OPEN fill:#F2FAFE, stroke:#4C5359
    style IN_PROGRESS fill:#F2FAFE, stroke:#4C5359
    style ACCEPTED fill:#F2FAFE, stroke:#4C5359
    style DECLINED fill:#F2FAFE, stroke:#4C5359
    style DECLINED_MERCHANT fill:#F2FAFE, stroke:#4C5359
    style EXPIRED fill:#F2FAFE, stroke:#4C5359

    style CUSTOMER1 fill:#A1BDDC, stroke:#4C5359
    style CUSTOMER2 fill:#A1BDDC, stroke:#4C5359
    style CUSTOMER3 fill:#A1BDDC, stroke:#4C5359
    style EMPLOYEE1 fill:#99ACBC, stroke:#4C5359
    style EMPLOYEE2 fill:#99ACBC, stroke:#4C5359
    style EMPLOYEE3 fill:#99ACBC, stroke:#4C5359
    style CART fill:#DDE6EE, stroke:#4C5359
    style PRODUCTS fill:#DDE6EE, stroke:#4C5359
    style QUOTE_REQUEST fill:#F2FAFE, stroke:#4C5359
    style ORDER fill:#DDE6EE, stroke:#4C5359
````

## Color palette

* \#9CBBE3
* \#FFC128
* \#4C5359 - Texts, borders
* \#DDE6EE
* \#A1BDDC
* \#F2F6FA
* \#3B73BB - Block background
* \#E86C07 - Signals in sequence, Borders on darker background
* \#99ACBC - Muted accent for node fills
* \#7B8B99 - Signal text in sequence diagrams
* \#F2FAFE - Light node fill
* \#FFFFFF - Text on dark blocks
