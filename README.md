# mastra-permission-tools

A TypeScript/JavaScript library that provides a robust permission control system for Mastra agent tools. This package enables developers to implement secure, fine-grained permission controls for tool execution in Mastra agents.

## Features

- 🔐 **Security Levels**: Configurable security levels (none, low, medium, high, critical) for tools
- 🎯 **Fine-grained Control**: Parameter-based permission rules for precise access control
- 🔄 **Tool Proxy Pattern**: Transparent proxy wrapper for seamless permission integration
- ⏰ **Permission Expiration**: Time-based permission grants with configurable expiration
- 🎨 **UI Components**: Ready-to-use React components for permission dialogs
- 📝 **Audit Trail**: Built-in logging and tracking of permission requests and grants
- 🔧 **Extensible**: Easy to customize for specific use cases and requirements

## Installation

```bash
npm install mastra-permission-tools
# or
yarn add mastra-permission-tools
# or
pnpm add mastra-permission-tools
```

## Quick Start

```typescript
import { 
  createToolExecutionProxy,
  createPermissionHooks, 
  createPermissionTools,
  MemoryPermissionStore 
} from 'mastra-permission-tools';
import { Agent } from '@mastra/core/agent';

// Define your security policy
const securityPolicy = {
  tools: {
    "Send Email": {
      securityLevel: "high",
      permissionMessage: "This tool will send emails on your behalf"
    }
  },
  defaults: {
    high: { requirePermission: true, expiry: "session" }
  }
};

// Create a permission store
const permissionStore = new MemoryPermissionStore();

// Create permission hooks
const permissionHooks = createPermissionHooks(securityPolicy, {
  store: permissionStore
});

// Wrap your tools with the permission proxy
const proxiedTools = createToolExecutionProxy(originalTools, permissionHooks);

// Create permission response tools
const permissionTools = createPermissionTools(securityPolicy, {
  store: permissionStore
});

// Configure your agent
const agent = new Agent({
  name: "SecureAgent",
  tools: {
    ...proxiedTools,
    ...permissionTools 
  }
});
```

## Usage

### 1. Define Security Policy

Configure security levels and permissions for your tools:

```typescript
const securityPolicy = {
  tools: {
    "Database Query": {
      securityLevel: "medium",
      category: "data",
      permissionMessage: "This tool will query your database"
    },
    "Send SMS": {
      securityLevel: "high",
      category: "communication"
    }
  },
  categories: {
    "data": { securityLevel: "medium" },
    "communication": { securityLevel: "high" }
  },
  defaults: {
    none: { requirePermission: false },
    low: { requirePermission: true, expiry: "24h" },
    medium: { requirePermission: true, expiry: "1h" },
    high: { requirePermission: true, expiry: "session" },
    critical: { requirePermission: true, expiry: "once" }
  }
};
```

### 2. Parameter-based Rules

Define dynamic permission rules based on parameter values:

```typescript
const parameterRules = {
  "Process Payment": [
    {
      param: "amount",
      condition: "greaterThan",
      value: 1000,
      securityLevel: "critical",
      message: "Large transactions require additional authorization"
    }
  ]
};
```

### 3. Set Up Permission Response Tools

```typescript
// Create permission tools
const permissionTools = createPermissionTools(securityPolicy, {
  store: permissionStore
});

// Add to your agent
const agent = new Agent({
  name: "SecureAgent",
  tools: {
    ...proxiedTools,
    ...permissionTools
  }
});
```

### 4. React Integration

Use the provided React components for permission dialogs:

```typescript
import { usePermissionDialog } from 'mastra-permission-tools/react';

function ChatComponent() {
  const { PermissionDialogComponent, requestPermission } = usePermissionDialog();
  
  // Handle tool execution with permission checks
  const handleToolCall = async (toolCall) => {
    if (toolCall.requiresPermission) {
      const approved = await requestPermission(
        toolCall.toolName,
        toolCall.reason,
        toolCall.securityLevel
      );
      
      if (!approved) return null;
    }
    
    // Execute approved tool
    return await executeToolCall(toolCall);
  };
  
  return (
    <div>
      {/* Your chat UI */}
      {PermissionDialogComponent}
    </div>
  );
}
```

## Advanced Features

### Custom Permission Store

Implement your own permission storage:

```typescript
import { PermissionStore } from 'mastra-permission-tools';

class RedisPermissionStore extends PermissionStore {
  async getPermission(key: string): Promise<boolean | null> {
    // Your Redis implementation
  }
  
  async setPermission(key: string, granted: boolean, expiresIn?: string): Promise<void> {
    // Your Redis implementation
  }
}
```

### Audit Logging

Track all permission requests and decisions:

```typescript
const hooks = createPermissionHooks(securityPolicy, {
  onPermissionRequest: (toolName, params, context) => {
    // Log permission request
  },
  onPermissionGranted: (toolName, context) => {
    // Log permission grant
  },
  onPermissionDenied: (toolName, context) => {
    // Log permission denial
  }
});
```

## API Reference

### Core Functions

#### `createToolExecutionProxy(tools, hooks)`
Creates a proxy wrapper for tools with permission checks.

#### `createPermissionHooks(securityPolicy, options?)`
Creates hook functions for permission control based on the security policy.

#### `createPermissionTools(securityPolicy, options?)`
Creates a set of tools for handling permission responses. Returns:
- `respondToPermission`: Tool to process user permission responses
- `checkPermissionStatus`: Tool to check the current permission status for a tool
- `clearPermission`: Tool to clear permission for a specific tool

### React Components

#### `PermissionDialog`
A customizable dialog component for permission requests.

#### `SecurityBadge`
A visual indicator for security levels.

### React Hooks

#### `usePermissionDialog()`
A hook for managing permission dialogs.

#### `usePermissionState()`
A hook for managing and tracking permission states.

### Types

#### `SecurityLevel`
Enum defining security levels: NONE, LOW, MEDIUM, HIGH, CRITICAL.

#### `SecurityPolicy`
Interface for configuring tool security policies.

#### `ParameterRule`
Interface for defining parameter-based rules.

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic Usage](./examples/basic-usage)
- [React Integration](./examples/with-react)
- [Custom Policy](./examples/custom-policy)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Relationship to Mastra

This is an independent project designed to work with [Mastra](https://github.com/mastra-ai/mastra) (licensed under ELv2). This package provides additional permission control functionality and does not contain any Mastra source code. It is not officially affiliated with or endorsed by the Mastra project.

## License

MIT © 2025 toruSakari