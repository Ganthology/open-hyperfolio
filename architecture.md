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

### Entities

- Interfaces for API, request and payload interfaces, each enums and value types are considered an entity
- Usually each entity will be in each own file, and named with proper prefixes that gives the most relevant context
- Prefer interface over type, use type if union is needed

## View layer

View layer contains screens (the pages), components, entities for view, view models

### ViewModel

- ViewModel are state holders, glue between view layer and data layer, preparing data and functions (usually single responsibility) for screen or component to consume.
- ViewModels are usually 1-1 mapping, and cannot be shared.
- ViewModels are a subset of react hooks, but not made to ease the sharing or repetitive data or function. But rather to abstract away details and business logics that a screen or component does not need to know, for example which Repository to call.
- ViewModels provide single responsibility function calls like fetchBalance, refetchBalance, addAddress (instead of callbacks like onPress, onAdd which should be handled in screen/component)
- navigations, toasts are not suppose to happen in ViewModel

### View components (screens, components)

- navigations, toasts happen here
- callback are created here, by composing the functions provided from viewModel
