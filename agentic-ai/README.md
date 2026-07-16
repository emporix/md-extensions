# Agentic AI - Emporix Extension

## 🚀 Introduction

Agentic AI is a sophisticated React application for managing AI agents within the Emporix platform. It provides a comprehensive interface for creating, configuring, and managing custom AI agents with advanced LLM configuration capabilities.

## ✨ Features

### **🤖 AI Agent Management**
- **Custom Agent Creation**: Create AI agents from predefined templates
- **Advanced Configuration**: Configure LLM settings, MCP servers, and triggers
- **Agent Templates**: Pre-built templates for common use cases
- **Real-time Status**: Monitor agent status and performance

### **🔧 Advanced Configuration**
- **LLM Provider Support**: OpenAI, Google, Anthropic, and Emporix OpenAI
- **MCP Server Integration**: Order, Customer, Product, Frotend and Extensibility servers
- **Trigger Management**: Endpoint, time, and commerce event triggers
- **Memory & Recursion**: Configure agent memory and recursion limits

### **🎨 Modern UI/UX**
- **PrimeReact Components**: Professional UI with Emporix theme compatibility
- **Responsive Design**: Works seamlessly across all devices
- **Internationalization**: Full i18n support (English & German)
- **Icon Selection**: Visual icon picker for agent customization

### **🏗️ Enterprise Architecture**
- **Custom Hooks**: Extracted business logic for reusability
- **Component Composition**: Modular, focused components
- **Context Pattern**: Global state management
- **Error Boundaries**: Graceful error handling
- **Performance Optimization**: Memoization and optimized re-renders

## 🛠️ Technology Stack

- **React 18**: Modern React with TypeScript
- **Vite**: Fast build tool with module federation
- **PrimeReact**: UI component library
- **i18next**: Internationalization
- **FontAwesome**: Icon library
- **TypeScript**: Full type safety

## 📁 Architecture

```
src/
├── components/
│   ├── agent-config/          # Agent configuration components
│   ├── add-agent/             # Add agent dialog components
│   ├── common/                # Reusable components
│   └── index.ts               # Component exports
├── contexts/
│   └── AgentContext.tsx       # Global state management
├── hooks/
│   ├── useAgents.ts           # Agent data management
│   ├── useAgentConfig.ts      # Agent configuration logic
│   ├── usePanelAnimation.ts   # Panel animation logic
│   └── useAddAgentDialog.ts   # Add agent dialog logic
├── services/
│   └── agentService.ts        # API service layer
├── types/
│   ├── Agent.ts               # TypeScript interfaces
│   └── common.ts              # Common types
├── utils/
│   ├── agentHelpers.ts        # Utility functions
│   └── constants.ts           # Application constants
└── translations/              # Internationalization
```

## 🚀 Development

### Prerequisites
```bash
npm install
```

### Local Development
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Build for Development
```bash
npm run build:dev
```

## 🔧 Configuration

### Environment Variables
- `VITE_API_URL`: Base URL for the API endpoints

### Agent Configuration
- **LLM Providers**: Configure OpenAI, Google, Anthropic, or Emporix OpenAI
- **MCP Servers**: Enable Order, Customer, Product, Frontend and Extensibility servers
- **Triggers**: Set up endpoint, time, or commerce event triggers
- **Memory Settings**: Configure agent memory and recursion limits

## 📊 Performance Features

- **React.memo**: Prevents unnecessary re-renders
- **useCallback**: Optimized event handlers
- **Custom Hooks**: Extracted business logic
- **Error Boundaries**: Graceful error handling
- **Type Safety**: Full TypeScript coverage

## 🎯 Code Quality

- **DRY Principle**: Zero duplicate code
- **Single Responsibility**: Each component has one purpose
- **Type Safety**: 100% TypeScript coverage
- **Error Handling**: Comprehensive error management
- **Constants Organization**: Centralized configuration

## 🔌 Integration

### Emporix Management Dashboard
1. Build the extension: `npm run build:dev`
2. Start preview server: `npm run preview`
3. Add to Management Dashboard:
   - Go to `Administration/Extensions`
   - Click `ADD NEW EXTENSION`
   - Provide extension name and URL
   - Enable the extension

### API Integration
The application integrates with the Emporix AI Service API:
- **Agent Templates**: Fetch predefined agent templates
- **Custom Agents**: Create and manage custom agents
- **Agent Configuration**: Update agent settings and configurations

## 🧪 Testing

The codebase is designed for easy testing:
- **Component Isolation**: Self-contained components
- **Hook Testing**: Extracted business logic is testable
- **Error Scenarios**: Comprehensive error handling
- **Type Safety**: Compile-time error detection

## 📈 Future Enhancements

- **Agent Analytics**: Performance monitoring and metrics
- **Advanced Triggers**: More trigger types and configurations
- **Template Marketplace**: Community-driven agent templates
- **Real-time Updates**: WebSocket integration for live updates

## 🤝 Contributing

1. Follow the established architecture patterns
2. Use TypeScript for all new code
3. Implement proper error handling
4. Add comprehensive documentation
5. Ensure all tests pass

## 📄 License

This project is part of the Emporix platform and follows Emporix licensing terms.

---

**Built with ❤️ for the Emporix platform**