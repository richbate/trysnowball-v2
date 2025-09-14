#!/usr/bin/env node

/**
 * OpenAPI Export Script - Generate API Documentation
 * 
 * Exports RouteRegistry to OpenAPI 3.0 YAML for:
 * - Partner-facing API documentation
 * - Swagger UI / Redocly integration  
 * - Contract testing and mocking
 * - Postman collection import
 */

import fs from 'fs';
import path from 'path';
import { RouteRegistry, RouteHelpers } from '../src/routes/routeRegistry';

// OpenAPI metadata
const OPENAPI_INFO = {
  openapi: '3.0.3',
  info: {
    title: 'TrySnowball API',
    description: 'Complete API reference for TrySnowball debt management platform',
    version: '2.0.0',
    contact: {
      name: 'TrySnowball Support',
      url: 'https://trysnowball.co.uk',
      email: 'support@trysnowball.co.uk'
    },
    license: {
      name: 'Proprietary',
      url: 'https://trysnowball.co.uk/terms'
    }
  },
  servers: [
    {
      url: 'https://trysnowball.co.uk',
      description: 'Production server'
    },
    {
      url: 'https://staging-trysnowball.pages.dev', 
      description: 'Staging server'
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained via magic link authentication'
      }
    },
    schemas: {
      UKDebt: {
        type: 'object',
        required: ['name', 'amount', 'apr', 'min_payment'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique debt identifier'
          },
          name: {
            type: 'string',
            description: 'Debt name (e.g., "Credit Card", "Personal Loan")',
            example: 'Credit Card'
          },
          amount: {
            type: 'number',
            format: 'float',
            minimum: 0,
            description: 'Current debt balance in pounds',
            example: 1234.56
          },
          apr: {
            type: 'number', 
            format: 'float',
            minimum: 0,
            maximum: 100,
            description: 'Annual percentage rate',
            example: 19.9
          },
          min_payment: {
            type: 'number',
            format: 'float',
            minimum: 0,
            description: 'Minimum monthly payment in pounds',
            example: 45.00
          },
          debt_type: {
            type: 'string',
            enum: ['credit_card', 'personal_loan', 'student_loan', 'other'],
            default: 'credit_card',
            description: 'Type of debt'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp'
          },
          updated_at: {
            type: 'string',
            format: 'date-time', 
            description: 'Last update timestamp'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'User identifier'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          isPro: {
            type: 'boolean',
            description: 'Whether user has Pro subscription'
          },
          plan: {
            type: 'string',
            enum: ['free', 'pro', 'founder'],
            description: 'User subscription plan'
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation date'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Human-readable error message'
          },
          code: {
            type: 'string',
            description: 'Machine-readable error code'
          },
          status: {
            type: 'integer',
            description: 'HTTP status code'
          }
        }
      }
    }
  }
};

/**
 * Route metadata for OpenAPI generation
 */
const ROUTE_METADATA = {
  // Debts API
  'debts.getAll': {
    summary: 'Get all debts',
    description: 'Fetch all debts for the authenticated user',
    tags: ['Debts'],
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'List of user debts',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                debts: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UKDebt' }
                }
              }
            }
          }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },
  'debts.create': {
    summary: 'Create new debt',
    description: 'Add a new debt to the user\'s profile',
    tags: ['Debts'],
    security: [{ BearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UKDebt' }
        }
      }
    },
    responses: {
      201: {
        description: 'Debt created successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                debt: { $ref: '#/components/schemas/UKDebt' }
              }
            }
          }
        }
      },
      400: { $ref: '#/components/responses/BadRequestError' },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },
  'debts.update': {
    summary: 'Update existing debt',
    description: 'Update debt information',
    tags: ['Debts'],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Debt ID'
      }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/UKDebt' }
        }
      }
    },
    responses: {
      200: { description: 'Debt updated successfully' },
      400: { $ref: '#/components/responses/BadRequestError' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' }
    }
  },
  'debts.delete': {
    summary: 'Delete debt',
    description: 'Remove debt from user profile',
    tags: ['Debts'],
    security: [{ BearerAuth: [] }],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Debt ID'
      }
    ],
    responses: {
      200: { description: 'Debt deleted successfully' },
      401: { $ref: '#/components/responses/UnauthorizedError' },
      404: { $ref: '#/components/responses/NotFoundError' }
    }
  },

  // Authentication
  'auth.requestLink': {
    summary: 'Request magic link',
    description: 'Send magic link email for passwordless authentication',
    tags: ['Authentication'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Magic link sent successfully',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                email: { type: 'string', format: 'email' }
              }
            }
          }
        }
      },
      400: { $ref: '#/components/responses/BadRequestError' }
    }
  },
  'auth.me': {
    summary: 'Get current user',
    description: 'Fetch authenticated user information',
    tags: ['Authentication'],
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'Current user information',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' }
              }
            }
          }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },
  'auth.refresh': {
    summary: 'Refresh JWT token',
    description: 'Get a new JWT token using current valid token',
    tags: ['Authentication'],
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: 'New token generated',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                token: { type: 'string', description: 'New JWT token' }
              }
            }
          }
        }
      },
      401: { $ref: '#/components/responses/UnauthorizedError' }
    }
  },
  'auth.logout': {
    summary: 'Logout user',
    description: 'Clear user session and invalidate tokens',
    tags: ['Authentication'],
    security: [{ BearerAuth: [] }],
    responses: {
      200: { description: 'Successfully logged out' }
    }
  },

  // Health
  'health.main': {
    summary: 'Main health check',
    description: 'Check if the main application is running',
    tags: ['Health'],
    responses: {
      200: { description: 'Service is healthy' }
    }
  },
  'health.auth': {
    summary: 'Auth service health',
    description: 'Check authentication service status',
    tags: ['Health'],
    responses: {
      200: {
        description: 'Auth service status',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['ok'] },
                service: { type: 'string', enum: ['auth'] },
                database: { type: 'string', enum: ['D1 connected'] }
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Convert RouteRegistry to OpenAPI paths
 */
function generateOpenAPIPaths(): Record<string, any> {
  const paths: Record<string, any> = {};

  // Add common error responses
  const commonResponses = {
    BadRequestError: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    UnauthorizedError: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    NotFoundError: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    }
  };

  // Process each route in registry
  const routePaths = RouteHelpers.getAllRoutePaths();
  
  routePaths.forEach(routePath => {
    try {
      const route = RouteHelpers.getRoute(routePath, 'example-id');
      const metadata = ROUTE_METADATA[routePath];
      
      if (!metadata) {
        console.warn(`No metadata for route: ${routePath}`);
        return;
      }

      // Determine HTTP method from route and metadata
      const method = getHTTPMethod(routePath);
      
      // Convert route to OpenAPI path format
      const openApiPath = route.replace(/example-id/g, '{id}');
      
      if (!paths[openApiPath]) {
        paths[openApiPath] = {};
      }
      
      paths[openApiPath][method] = {
        operationId: routePath.replace('.', '_'),
        ...metadata
      };
      
    } catch (error) {
      // Skip routes that require parameters we can't provide
      if (routePath.includes('update') || routePath.includes('delete')) {
        const baseRoute = RouteHelpers.getRoute(routePath.split('.')[0] + '.getAll');
        const method = getHTTPMethod(routePath);
        const openApiPath = baseRoute + '/{id}';
        
        if (!paths[openApiPath]) {
          paths[openApiPath] = {};
        }
        
        if (ROUTE_METADATA[routePath]) {
          paths[openApiPath][method] = {
            operationId: routePath.replace('.', '_'),
            ...ROUTE_METADATA[routePath]
          };
        }
      }
    }
  });

  return { paths, components: { ...OPENAPI_INFO.components, responses: commonResponses } };
}

/**
 * Determine HTTP method from route path
 */
function getHTTPMethod(routePath: string): string {
  if (routePath.includes('.create') || routePath.includes('.requestLink')) return 'post';
  if (routePath.includes('.update')) return 'put';
  if (routePath.includes('.delete')) return 'delete';
  return 'get';
}

/**
 * Main export function
 */
function exportOpenAPI() {
  console.log('📄 Exporting OpenAPI specification from RouteRegistry...\n');
  
  const { paths, components } = generateOpenAPIPaths();
  
  const openApiSpec = {
    ...OPENAPI_INFO,
    paths,
    components
  };
  
  // Write YAML file
  const yaml = convertToYAML(openApiSpec);
  const outputPath = path.join(process.cwd(), 'docs', 'openapi.yaml');
  
  // Ensure docs directory exists
  const docsDir = path.dirname(outputPath);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, yaml);
  
  // Write JSON version too
  const jsonPath = path.join(process.cwd(), 'docs', 'openapi.json');
  fs.writeFileSync(jsonPath, JSON.stringify(openApiSpec, null, 2));
  
  console.log('✅ OpenAPI specification exported successfully!');
  console.log(`   YAML: ${outputPath}`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   Routes exported: ${Object.keys(paths).length}`);
  console.log();
  console.log('🚀 Next steps:');
  console.log('   - Import into Swagger UI for interactive docs');
  console.log('   - Share with partners for API integration');
  console.log('   - Import into Postman for testing');
  console.log('   - Use with Redocly for documentation site');
}

/**
 * Simple YAML conversion (basic implementation)
 */
function convertToYAML(obj: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let yaml = '';
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      yaml += `${spaces}${key}: null\n`;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      yaml += convertToYAML(value, indent + 1);
    } else if (Array.isArray(value)) {
      yaml += `${spaces}${key}:\n`;
      value.forEach(item => {
        if (typeof item === 'object') {
          yaml += `${spaces}  -\n`;
          yaml += convertToYAML(item, indent + 2);
        } else {
          yaml += `${spaces}  - ${item}\n`;
        }
      });
    } else {
      const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
      yaml += `${spaces}${key}: ${valueStr}\n`;
    }
  }
  
  return yaml;
}

// Execute if run directly
if (require.main === module) {
  try {
    exportOpenAPI();
  } catch (error) {
    console.error('❌ OpenAPI export failed:', error.message);
    process.exit(1);
  }
}

export { exportOpenAPI };