---
parameters:
  code:
    type: string
    description: The code to document
  language:
    type: string
    description: Programming language of the code
    required: false
  doc_type:
    type: string
    description: Type of documentation to generate
    enum: ['api', 'inline', 'readme', 'guide', 'reference']
    required: false
  include_examples:
    type: boolean
    description: Whether to include usage examples
    required: false
  audience:
    type: string
    description: Target audience for the documentation
    enum: ['developers', 'end-users', 'maintainers', 'beginners']
    required: false
description: Generate comprehensive documentation for code with customizable format and audience
author: Shelton Tolbert
---
# Code Documentation Request

Please generate comprehensive documentation for the following {{#if language}}{{language}} {{/if}}code:

```{{#if language}}{{language}}{{/if}}
{{code}}
```

## Documentation Requirements

{{#if doc_type}}
**Documentation Type**: {{doc_type}}
{{else}}
**Documentation Type**: Complete documentation package
{{/if}}

{{#if audience}}
**Target Audience**: {{audience}}
{{else}}
**Target Audience**: Software developers
{{/if}}

{{#if include_examples}}
**Include Examples**: Yes, provide practical usage examples
{{else}}
**Include Examples**: Include examples where helpful
{{/if}}

## Documentation Structure

Please provide the following documentation elements as appropriate:

### 1. Overview
- Brief description of what the code does
- Main purpose and functionality
- Key features and capabilities

### 2. API Documentation (if applicable)
- Function/method signatures
- Parameter descriptions with types
- Return value descriptions
- Possible exceptions/errors

### 3. Usage Examples
- Basic usage scenarios
- Common use cases
- Code snippets with explanations
- Input/output examples

### 4. Implementation Details
- How the code works internally
- Important algorithms or logic
- Dependencies and requirements
- Performance characteristics

### 5. Configuration (if applicable)
- Available options and settings
- Default values
- Environment variables
- Configuration examples

### 6. Error Handling
- Common error scenarios
- Error codes and messages
- Troubleshooting guide
- Best practices for error handling

### 7. Best Practices
- Recommended usage patterns
- Common pitfalls to avoid
- Performance considerations
- Security considerations

### 8. Related Information
- Dependencies and prerequisites
- Related functions/modules
- Further reading or references
- Migration notes (if applicable)

## Output Format

Please format the documentation using:
- Clear headings and structure
- Code blocks for examples
- Inline code formatting for parameters/variables
- Tables for structured information where helpful
- Bullet points for lists
- Proper markdown formatting

Make the documentation clear, comprehensive, and easy to understand for the target audience.
