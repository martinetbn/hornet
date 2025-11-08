# Hornet Documentation

Welcome to the Hornet documentation! This directory contains comprehensive guides for understanding and contributing to Hornet.

## Documentation Index

### 📐 [Architecture](./ARCHITECTURE.md)
Learn about Hornet's layered architecture, design patterns, and technology choices.

**Topics covered:**
- Architecture layers and responsibilities
- Data flow and state management
- Protocol adapter pattern
- Security and performance considerations
- Future enhancements roadmap

**Read this if you:**
- Are new to the project
- Want to understand the big picture
- Need to make architectural decisions

---

### 📁 [Directory Structure](./DIRECTORY_STRUCTURE.md)
Understand how the project is organized and where to find/add code.

**Topics covered:**
- Complete directory tree with explanations
- File naming conventions
- Import conventions and path aliases
- Feature organization patterns
- How to add new features

**Read this if you:**
- Can't find where code belongs
- Are adding a new feature
- Want to understand the codebase organization

---

### 🔄 [State Management](./STATE_MANAGEMENT.md)
Master Jotai for managing application state.

**Topics covered:**
- Jotai fundamentals (atoms, hooks)
- Common state patterns
- Async state handling
- Atom organization and naming
- Testing strategies
- Best practices

**Read this if you:**
- Need to add or modify state
- Want to understand data flow
- Are debugging state issues
- Need to share state between components

---

### 🔌 [Protocol Adapters](./PROTOCOL_ADAPTERS.md)
Learn how to work with HTTP, WebSocket, Socket.IO, and gRPC adapters.

**Topics covered:**
- Adapter pattern and interfaces
- HTTP adapter implementation
- WebSocket adapter implementation
- Socket.IO adapter implementation
- gRPC adapter implementation
- Testing adapters
- Adding new protocols

**Read this if you:**
- Are working with API protocols
- Need to add a new protocol
- Want to modify existing adapters
- Are debugging connection issues

---

### 🛠️ [Development Guide](./DEVELOPMENT_GUIDE.md)
Practical guide for day-to-day development work.

**Topics covered:**
- Development workflow and setup
- Code style and conventions
- Git workflow and commit messages
- Testing strategies
- Debugging techniques
- Common tasks and troubleshooting
- Best practices

**Read this if you:**
- Are starting development
- Need to set up your environment
- Want to follow project conventions
- Are troubleshooting issues

---

## Quick Start

New to Hornet? Follow this path:

1. **[Architecture](./ARCHITECTURE.md)** - Understand the overall design
2. **[Directory Structure](./DIRECTORY_STRUCTURE.md)** - Learn the codebase layout
3. **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Set up and start coding

## Contributing to Documentation

Documentation is code! Please help keep it up-to-date:

### When to Update Docs

- **Architecture changes**: Update `ARCHITECTURE.md`
- **New directories/files**: Update `DIRECTORY_STRUCTURE.md`
- **State patterns**: Update `STATE_MANAGEMENT.md`
- **Protocol changes**: Update `PROTOCOL_ADAPTERS.md`
- **Process changes**: Update `DEVELOPMENT_GUIDE.md`

### Documentation Style

- Use clear, concise language
- Include code examples
- Add visual diagrams where helpful
- Link between related docs
- Keep TOC up-to-date

### Example Documentation PR

```
docs: update state management guide with atom families

- Added section on atomFamily pattern
- Included usage examples
- Updated best practices section
```

## Feedback

Found something unclear or missing? Please:

1. Open an issue describing what's confusing
2. Or better yet, submit a PR with improvements!

Good documentation helps everyone build better software. 🚀
