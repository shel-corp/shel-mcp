---
parameters:
  name:
    type: string
    description: Name to greet
  style:
    type: string
    description: Greeting style
    enum: ['formal', 'casual', 'friendly']
    required: false
description: A test prompt for greeting a user
author: Test Author
---
# Greeting

{{#if style == 'formal'}}
Dear {{name}},

I hope this message finds you well. It is a pleasure to make your acquaintance.

Sincerely,
AI Assistant
{{else if style == 'casual'}}
Hey {{name}}!

What's up? Good to meet you!

Cheers,
AI Assistant
{{else}}
Hello {{name}}!

It's great to meet you. I hope you're having a wonderful day.

Best regards,
AI Assistant
{{/if}}