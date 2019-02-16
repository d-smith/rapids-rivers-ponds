# rapids-rivers-streams

Example implementation of Fred George style microservices architecture

## Background

Notes from Fred George's [Implementing Micro Service Architecture talk](https://vimeo.com/79866979)

Microservices are:

* Tiny
* Loosely coupled (including flow)
* Multiple versions simultaneously running ok
* Self-execution monitoring of seach service
* Publish interesting stuff
* "Application" is the wrong concept; think in terms of service and systems

Rapids, Rivers, and Ponds

* Rapids - Every event, implemented as a bus
* Rivers - themed events, services hook in
* Static databases - data warehoses, reporting - ponds

High-Performance Bus

* App events
* Logs
* Service events

Tech components

* Kafka for the bus
* Rapids - Zero MQ, themed queues, can chain them

Services

* Listen to rivers
* Publish to the rapids

Async Services

* Service - expresses a need to the bus
* Other services - willing to respond to that need
* Multiple responses might be available, service expressing need selects solution

This architecture supports experimentation

* Enable experimentation without changing existing code

Design
* Events, not Entities
* History, not Current

Cloud of Signals

* What are the patterns
* Producers, consumers

Observations

* Services become disposable
* Loosely coupled via READful JSON packets or DB
* Self monitoring services replaces unit tests
* Business monitoring replaces acceptance tests
* Services language agnostic

Living Software System

* Long-lived systems, short-lived services (human body, cells)
* Extremely dynamic with continuous deployments
* Accept it is complex (especially for testing)
    * Acceptance test on business outcomes
* Radical impacts to dev processes
* There will be a learning curve