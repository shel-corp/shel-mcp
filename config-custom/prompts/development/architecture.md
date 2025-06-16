---
parameters:
  project_description:
    type: string
    description: Description of the project or system to analyze
    required: false
  codebase:
    type: string
    description: Code or project structure to analyze
    required: false
  architecture_type:
    type: string
    description: Type of architecture analysis needed
    enum: ['current-state', 'design-new', 'migration-plan', 'optimization']
    required: false
  technology_stack:
    type: array
    description: Technologies used or being considered
    required: false
  scale_requirements:
    type: string
    description: Expected scale (users, data, transactions)
    required: false
  constraints:
    type: array
    description: Technical, business, or resource constraints
    required: false
  focus_areas:
    type: array
    description: Specific architectural concerns (performance, security, maintainability)
    required: false
description: Comprehensive project architecture analysis and design recommendations
author: Shelton Tolbert
---
# Project Architecture Analysis Request

{{#if project_description}}
## Project Overview
{{project_description}}
{{/if}}

{{#if codebase}}
## Current Codebase/Structure
```
{{codebase}}
```
{{/if}}

## Analysis Requirements

{{#if architecture_type}}
**Analysis Type**: {{architecture_type}}
{{else}}
**Analysis Type**: Comprehensive architecture review and recommendations
{{/if}}

{{#if technology_stack}}
**Technology Stack**:
{{#each technology_stack}}
- {{this}}
{{/each}}
{{/if}}

{{#if scale_requirements}}
**Scale Requirements**: {{scale_requirements}}
{{/if}}

{{#if constraints}}
**Constraints**:
{{#each constraints}}
- {{this}}
{{/each}}
{{/if}}

{{#if focus_areas}}
**Focus Areas**:
{{#each focus_areas}}
- {{this}}
{{/each}}
{{else}}
**Focus Areas**:
- Scalability and performance
- Maintainability and modularity
- Security and reliability
- Development efficiency
- Deployment and operations
{{/if}}

## Architecture Analysis Framework

Please provide a comprehensive architectural analysis covering:

### 1. Current State Assessment (if applicable)
- **System Overview**: High-level architecture description
- **Component Analysis**: Individual system components and their responsibilities
- **Data Flow**: How data moves through the system
- **Integration Points**: External dependencies and APIs
- **Technology Assessment**: Current tech stack evaluation
- **Strengths**: What works well in the current architecture
- **Pain Points**: Identified problems and bottlenecks

### 2. Architectural Patterns and Principles
- **Design Patterns**: Recommended architectural patterns (MVC, microservices, event-driven, etc.)
- **SOLID Principles**: Application of software design principles
- **Separation of Concerns**: How to organize code and responsibilities
- **Dependency Management**: Dependency injection and inversion of control
- **Modularity**: Component boundaries and interfaces

### 3. System Design Recommendations
- **High-Level Architecture**: Overall system structure and organization
- **Component Design**: Individual component specifications
- **Data Architecture**: Database design, data modeling, and storage strategy
- **API Design**: Service interfaces and communication protocols
- **Security Architecture**: Authentication, authorization, and data protection
- **Performance Architecture**: Caching, load balancing, and optimization strategies

### 4. Scalability and Performance
- **Horizontal vs Vertical Scaling**: Scaling strategies and trade-offs
- **Performance Bottlenecks**: Identification and mitigation strategies
- **Caching Strategy**: Multi-level caching approach
- **Database Optimization**: Query optimization and database scaling
- **Load Distribution**: Load balancing and traffic management
- **Monitoring and Metrics**: Performance monitoring and alerting

### 5. Technology Stack Recommendations
- **Frontend Technologies**: UI/UX framework recommendations
- **Backend Technologies**: Server-side technology choices
- **Database Technologies**: Data storage solutions
- **Infrastructure**: Cloud services, containers, orchestration
- **DevOps Tools**: CI/CD, monitoring, and deployment tools
- **Third-party Services**: External service integrations

### 6. Security Considerations
- **Authentication and Authorization**: User management and access control
- **Data Protection**: Encryption, data privacy, and compliance
- **API Security**: Secure communication and API protection
- **Infrastructure Security**: Network security and system hardening
- **Security Monitoring**: Threat detection and incident response
- **Compliance Requirements**: Regulatory and industry standards

### 7. Development and Deployment
- **Development Workflow**: Team collaboration and development processes
- **Code Organization**: Project structure and coding standards
- **Testing Strategy**: Unit, integration, and end-to-end testing
- **CI/CD Pipeline**: Automated build, test, and deployment
- **Environment Management**: Development, staging, and production environments
- **Documentation**: Architecture documentation and team knowledge sharing

### 8. Migration and Implementation Plan
- **Phase Planning**: Step-by-step implementation approach
- **Risk Assessment**: Potential risks and mitigation strategies
- **Resource Requirements**: Team skills, time, and budget considerations
- **Timeline Estimation**: Realistic project timeline and milestones
- **Success Metrics**: How to measure architecture success
- **Rollback Strategy**: Contingency plans and risk management

## Expected Deliverables

Please provide:

### 📋 Executive Summary
- Key findings and recommendations
- Critical decisions and rationale
- Resource and timeline estimates

### 🏗️ Architecture Diagrams
- System architecture overview
- Component relationships
- Data flow diagrams
- Deployment architecture

### 📖 Detailed Specifications
- Component specifications
- API contracts
- Database schema
- Security requirements

### 🗺️ Implementation Roadmap
- Priority-ordered implementation phases
- Dependencies and prerequisites
- Risk mitigation strategies
- Success criteria for each phase

### 📚 Documentation Templates
- Architecture decision records (ADRs)
- API documentation structure
- Deployment guides
- Troubleshooting runbooks

## Quality Criteria

Ensure the architecture:
- **Scalable**: Can grow with business needs
- **Maintainable**: Easy to modify and extend
- **Reliable**: High availability and fault tolerance
- **Secure**: Comprehensive security measures
- **Performant**: Meets performance requirements
- **Cost-effective**: Optimized resource utilization
- **Future-proof**: Adaptable to changing requirements
- **Developer-friendly**: Supports efficient development

## Additional Considerations

Please also address:
- **Disaster Recovery**: Backup and recovery strategies
- **Observability**: Logging, monitoring, and debugging
- **Compliance**: Industry-specific requirements
- **Team Skills**: Required expertise and training needs
- **Vendor Lock-in**: Technology independence considerations
- **Technical Debt**: Legacy system integration and modernization

Provide practical, actionable recommendations with clear justifications for architectural decisions.