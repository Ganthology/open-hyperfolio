# Architecture

Simple version of clean architecture

## Data layer

### Repository

- Contract for external consumer to retrieve data
- RepositoryImpl, are implementor of the contract, calling the services, making sure returning the same format as the contract
- Repository example, HyperliquidRepository.ts
- RepositoryImpl example, HyperliquidRepositoryImpl.ts

### Source

- Data sources, including remote like API calls, SDK calls, local like local storage
- remote data sources are categorised under Service, e.g. HyperliquidService.ts
