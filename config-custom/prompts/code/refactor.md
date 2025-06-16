---
parameters:
  code:
    type: string
    description: The code to refactor
  language:
    type: string
    description: Programming language of the code
    required: false
  refactor_goals:
    type: array
    description: Specific refactoring goals (e.g., performance, readability, maintainability)
    required: false
  preserve_behavior:
    type: boolean
    description: Whether to strictly preserve existing behavior
    required: false
  style_guide:
    type: string
    description: Coding style guide to follow
    required: false
  max_changes:
    type: string
    description: Scope of changes to make
    enum: ['minimal', 'moderate', 'comprehensive']
    required: false
description: Intelligent code refactoring with customizable goals and constraints
author: Shelton Tolbert
---
# Code Refactoring Request

Please help me refactor the following {{#if language}}{{language}} {{/if}}code:

```{{#if language}}{{language}}{{/if}}
{{code}}
```

## Refactoring Parameters

{{#if refactor_goals}}
**Primary Goals**:
{{#each refactor_goals}}
- {{this}}
{{/each}}
{{else}}
**Primary Goals**:
- Improve code readability and clarity
- Enhance maintainability
- Optimize performance where possible
- Follow best practices and design patterns
- Reduce code complexity and duplication
{{/if}}

{{#if preserve_behavior}}
**Behavior Preservation**: Strictly maintain existing functionality and behavior
{{else}}
**Behavior Preservation**: Maintain core functionality while allowing improvements
{{/if}}

{{#if style_guide}}
**Style Guide**: Follow {{style_guide}} conventions
{{else}}
**Style Guide**: Apply language-standard best practices
{{/if}}

{{#if max_changes}}
**Change Scope**: {{max_changes}} refactoring approach
{{else}}
**Change Scope**: Balanced approach with meaningful improvements
{{/if}}

## Refactoring Areas to Consider

Please evaluate and improve the following aspects:

### 1. Code Structure
- Function/method organization
- Class design and responsibilities
- Module/package structure
- Separation of concerns

### 2. Naming and Clarity
- Variable and function naming
- Code readability
- Comment quality and necessity
- Self-documenting code principles

### 3. Performance Optimization
- Algorithm efficiency
- Memory usage optimization
- Database query optimization
- Caching opportunities

### 4. Error Handling
- Exception handling patterns
- Input validation
- Edge case handling
- Graceful failure mechanisms

### 5. Design Patterns
- Appropriate pattern application
- Code reusability
- Dependency injection
- Interface segregation

### 6. Testing Considerations
- Testability improvements
- Mock-friendly design
- Test coverage enablement
- Unit test isolation

### 7. Security Enhancements
- Input sanitization
- Authentication/authorization
- Data validation
- Secure coding practices

### 8. Code Duplication
- Identify repeated code
- Extract common functionality
- Create reusable components
- DRY principle application

## Expected Output

Please provide:

### 1. Refactored Code
- Complete refactored version
- Clear formatting and structure
- Proper comments where needed

### 2. Summary of Changes
- List of major modifications made
- Rationale for each significant change
- Benefits achieved through refactoring

### 3. Before/After Comparison
- Key differences highlighted
- Metrics comparison (complexity, lines of code, etc.)
- Performance implications

### 4. Migration Notes
- Breaking changes (if any)
- Steps needed to implement changes
- Testing recommendations

### 5. Further Recommendations
- Additional improvements for future consideration
- Architectural suggestions
- Long-term maintenance advice

## Quality Criteria

Ensure the refactored code:
- Maintains or improves functionality
- Follows SOLID principles
- Uses appropriate design patterns
- Has clear, meaningful names
- Includes proper error handling
- Is well-structured and organized
- Follows language conventions
- Is more maintainable than the original
- Has improved test coverage potential
- Addresses security considerations

Please explain your refactoring decisions and highlight the most impactful improvements.