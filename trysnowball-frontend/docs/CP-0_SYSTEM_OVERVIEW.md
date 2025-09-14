# CP-0: System Overview

**Status**: 🛠️ Active  
**Last Updated**: 2024-09-11  
**Affects**: All system components

## Purpose

High-level architectural overview of the TrySnowball debt payoff simulation platform.

## Core Components

### Frontend (React)
- Single-page application for debt management
- Demo mode for anonymous users
- User authentication and data persistence

### Backend (Cloudflare Workers)
- RESTful API for authenticated users
- Secure debt storage with encryption
- Stripe integration for premium features

### Simulation Engine
- Debt payoff calculations and projections
- Multiple payment strategies (snowball, avalanche, custom)
- Timeline generation and progress tracking

## Data Flow

1. User enters debt information (amount, APR, minimum payment)
2. System validates and stores debt data
3. Simulation engine calculates payoff scenarios
4. Frontend renders charts, timelines, and recommendations
5. User can track progress and update balances

## Key Principles

- **Data Integrity**: Single source of truth for debt calculations
- **Security**: All user data encrypted at rest
- **Performance**: Calculations performed client-side when possible
- **Privacy**: Demo mode for anonymous exploration

## System Boundaries

### What This System Handles
- Debt entry and validation
- Payment strategy simulation
- Progress tracking and visualization
- Basic financial education content

### What This System Does NOT Handle
- Actual payment processing
- Bank account integration
- Credit score monitoring
- Investment advice

## Related Documentation
- CP-1: Clean Debt Model
- CP-3: Bucket System (Multi-APR)
- CP-4: Forecast Engine V2