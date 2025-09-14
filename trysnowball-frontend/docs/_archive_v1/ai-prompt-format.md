# AI Developer Prompt Format - TrySnowball Route System

## 🤖 Claude/GPT Integration Guide

This document provides standardized prompts for AI-assisted development using TrySnowball's canonical route system.

### 📋 Route-Based Development Prompts

#### 🔧 Generate API Handler

```
Context: TrySnowball uses canonical RouteRegistry for all API endpoints.

Task: Generate a Cloudflare Worker handler for route "${routeKey}"

Route Details:
- Route Key: ${routeKey}
- URL Pattern: ${RouteHelpers.getRoute(routeKey)}
- HTTP Method: ${method}
- Domain: ${domain}

Requirements:
1. Use D1 database for persistence
2. Include JWT authentication validation
3. Follow existing error handling patterns
4. Add PostHog telemetry tracking
5. Return JSON responses with proper HTTP status codes

Database Schema:
${schemaInfo}

Authentication:
- JWT token in Authorization header
- Validate using auth-magic.js patterns

Response Format:
${responseFormat}

Please generate the complete handler function.
```

#### 🧪 Generate Route Tests

```
Context: TrySnowball uses RouteRegistry for canonical endpoint management.

Task: Generate Jest tests for route "${routeKey}"

Route Details:
- Route Key: ${routeKey}
- URL Pattern: ${RouteHelpers.getRoute(routeKey)}
- Gateway Function: ${gatewayFunction}

Test Requirements:
1. Test successful API calls
2. Test error handling (401, 404, 500)
3. Test request/response validation
4. Test PostHog analytics tracking
5. Mock external dependencies

Mock Pattern:
```typescript
jest.mock('../utils/routeAnalytics', () => ({
  RouteAnalytics: {
    apiCallStarted: jest.fn(),
    apiCallSuccess: jest.fn(),
    apiCallError: jest.fn()
  }
}));
```

Please generate comprehensive test cases.
```

#### 🚀 Generate Gateway Integration

```
Context: TrySnowball uses unifiedDebtsGateway.ts as the single source for API calls.

Task: Add new endpoint to unified gateway

Route Details:
- Route Key: ${routeKey}
- Operation: ${operation}
- Parameters: ${parameters}

Integration Requirements:
1. Use RouteHelpers.getRoute() for URL generation
2. Include PostHog analytics tracking
3. Follow existing error handling patterns
4. Add TypeScript types for request/response
5. Include JSDoc documentation

Existing Pattern:
```typescript
export async function ${functionName}(${parameters}): Promise<${returnType}> {
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UNIFIED_GATEWAY] ${operation}:', ${identifier});
  
  const response = await fetchWithAuth(RouteHelpers.getRoute('${routeKey}'), {
    method: '${method}',
    body: JSON.stringify(${payload})
  });

  const data = await response.json();
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UNIFIED_GATEWAY] ✅ ${operation} complete');
  
  // Track operation
  RouteAnalytics.${trackingMethod}('${operationType}', ${trackingParams});
  
  return data.${responseKey};
}
```

Please generate the complete gateway function.
```

### 📊 Analytics Integration Prompts

#### 📈 Generate Analytics Events

```
Context: TrySnowball tracks all API operations through PostHog with standardized schemas.

Task: Add analytics tracking for user action "${actionName}"

Route Context:
- Related Route: ${routeKey}
- User Action: ${actionName}
- Event Data: ${eventData}

Analytics Requirements:
1. Use RouteAnalytics.userAction() for user interactions
2. Use RouteAnalytics.debtOperation() for debt CRUD operations
3. Include relevant metadata (debt_id, operation, etc.)
4. Follow event naming conventions

Example Implementation:
```typescript
// Track user action
RouteAnalytics.userAction('${actionName}', '${routeKey}', {
  ${metadataFields}
});

// Or for debt operations
RouteAnalytics.debtOperation('${operation}', debtId);
```

Please generate the analytics tracking code.
```

### 🗺️ Route Discovery Prompts

#### 🔍 Explore Available Routes

```
Context: TrySnowball RouteRegistry contains all canonical API endpoints.

Task: List all available routes for domain "${domain}"

Available Domains:
- debts: Debt management operations
- auth: Authentication and user management
- billing: Stripe integration and subscriptions
- settings: User preferences and configuration
- health: System health checks

For route exploration, use:
```typescript
// Get all routes
const allRoutes = RouteHelpers.getAllRoutes();

// Get routes by domain
const debtRoutes = Object.keys(RouteRegistry.debts);

// Get specific route
const route = RouteHelpers.getRoute('debts.create');
```

Please provide available routes and their purposes.
```

### 🛠️ Debugging Prompts

#### 🐛 Debug Route Issues

```
Context: TrySnowball uses RouteRegistry to prevent endpoint chaos and route forks.

Issue: ${issueDescription}

Debugging Information:
- Route Key: ${routeKey}
- Expected URL: ${expectedUrl}
- Actual URL: ${actualUrl}
- HTTP Status: ${httpStatus}
- Error Message: ${errorMessage}

Common Issues:
1. Route not found in RouteRegistry
2. Worker handler missing for route
3. Parameter mismatch in URL generation
4. Authentication token issues

Debug Steps:
1. Check RouteRegistry has the route
2. Verify worker-routes.json includes handler
3. Test route generation with RouteHelpers.getRoute()
4. Check JWT token validity
5. Review PostHog analytics for error patterns

Please analyze the issue and suggest fixes.
```

### 📝 OpenAPI Documentation Prompts

#### 📚 Generate API Documentation

```
Context: TrySnowball exports OpenAPI 3.0 specification from RouteRegistry.

Task: Update OpenAPI metadata for route "${routeKey}"

Current Route:
- Route Key: ${routeKey}
- URL Pattern: ${urlPattern}
- HTTP Method: ${method}

Documentation Requirements:
1. Add detailed operation summary and description
2. Define request/response schemas
3. Include authentication requirements
4. Add example requests and responses
5. Document error responses

Schema Location: scripts/export-openapi.ts -> ROUTE_METADATA

Please generate the OpenAPI metadata object.
```

### 🎯 Quick Reference

#### Common Route Patterns

```typescript
// Gateway function generation
export async function ${operationName}(${params}): Promise<${returnType}> {
  const response = await fetchWithAuth(RouteHelpers.getRoute('${routeKey}'), {
    method: '${method}',
    body: JSON.stringify(${payload})
  });
  
  RouteAnalytics.${trackingMethod}('${operation}', ${trackingParams});
  return response.json();
}

// Test generation  
describe('${routeKey}', () => {
  test('should ${operationDescription}', async () => {
    const result = await ${gatewayFunction}(${testParams});
    expect(result).toEqual(${expectedResult});
    expect(RouteAnalytics.${trackingMethod}).toHaveBeenCalledWith(${trackingCall});
  });
});

// Analytics tracking
RouteAnalytics.userAction('${actionName}', '${routeKey}', { ${metadata} });
RouteAnalytics.debtOperation('${operation}', debtId);
RouteAnalytics.apiCallStarted('${routeKey}', '${method}');
```

### 🚀 Deployment Checklist Prompt

```
Context: TrySnowball uses RouteRegistry to ensure frontend-backend synchronization.

Task: Pre-deployment validation for route "${routeKey}"

Validation Checklist:
□ Route exists in RouteRegistry
□ Worker handler implemented and tested
□ Added to worker-routes.json
□ Gateway function created in unifiedDebtsGateway.ts
□ PostHog analytics integrated
□ OpenAPI documentation updated
□ Jest tests written and passing
□ Route inversion tests pass

Validation Commands:
```bash
npm run test:routes           # Validate route registry
npm run export:openapi        # Generate API docs
npm run lint                  # Code quality
npm run test -- --testPathPattern=routes  # Route tests
```

Please verify all items are completed before deployment.
```

---

## 🎯 Usage Examples

### For Route Creation:
1. Use "Generate API Handler" prompt with route details
2. Use "Generate Gateway Integration" to add to unified gateway  
3. Use "Generate Route Tests" for test coverage
4. Use "Generate Analytics Events" for tracking

### For Debugging:
1. Use "Debug Route Issues" prompt with error details
2. Use "Explore Available Routes" to understand system
3. Use validation checklist to ensure completeness

### For Documentation:
1. Use "Generate API Documentation" for OpenAPI updates
2. Export documentation with `npm run export:openapi`
3. Share with partners or import into Postman/Swagger UI

This standardized format ensures consistent AI-generated code that follows TrySnowball's architectural patterns and maintains the canonical route system.