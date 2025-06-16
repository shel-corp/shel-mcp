---
parameters:
  code:
    type: string
    description: The code to review
  language:
    type: string
    description: Programming language of the code
    required: false
  focus_areas:
    type: array
    description: Specific areas to focus on during review (e.g., security, performance, maintainability)
    required: false
  severity_level:
    type: string
    description: Level of scrutiny for the review
    enum: ['basic', 'thorough', 'comprehensive']
    required: false
description: Comprehensive code review prompt with customizable focus areas
author: Shelton Tolbert
---
# Code Review Request

Please conduct a thorough code review of the following {{#if language}}{{language}} {{/if}}code:

```{{#if language}}{{language}}{{/if}}
{{code}}
```

## Review Focus

{{#if focus_areas}}
Please pay special attention to the following areas:
{{#each focus_areas}}
- {{this}}
{{/each}}
{{else}}
Please evaluate the code across all standard review criteria:
- Code quality and readability
- Performance and efficiency
- Security vulnerabilities
- Error handling and edge cases
- Design patterns and architecture
- Testing considerations
- Documentation and comments
- Maintainability and scalability
{{/if}}

## Review Level
{{#if severity_level}}
Conduct a **{{severity_level}}** review with appropriate depth and detail.
{{else}}
Conduct a thorough review with detailed feedback.
{{/if}}

## Expected Output

Please provide:

1. **Overall Assessment**: Brief summary of code quality
2. **Strengths**: What the code does well
3. **Issues Found**: Categorized by severity (Critical, Major, Minor)
4. **Recommendations**: Specific improvements with examples
5. **Security Considerations**: Any security-related concerns
6. **Performance Notes**: Potential optimizations
7. **Best Practices**: Alignment with coding standards
8. **Testing Suggestions**: Recommended test cases

For each issue, please provide:
- Clear description of the problem
- Why it's problematic
- Suggested solution with code example if applicable
- Priority level (High/Medium/Low)

Format your response clearly with appropriate headings and code examples.