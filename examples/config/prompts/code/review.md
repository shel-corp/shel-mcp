---
parameters:
  code:
    type: string
    description: The code to review
  language:
    type: string
    description: The programming language
    required: false
  context:
    type: string
    description: Additional context about the code
    required: false
description: A prompt for reviewing code with detailed feedback
author: Shel MCP Team
---
# Code Review Request

Please review the following code:

```{{language}}
{{code}}
```

{{#if context}}
## Context
{{context}}
{{/if}}

Please provide your review with:
1. General assessment of the code quality
2. Specific issues or bugs you notice
3. Suggestions for improvements
4. Code style and best practices feedback
5. Security considerations (if applicable)

Format your response with clear sections and use code examples for suggested changes.