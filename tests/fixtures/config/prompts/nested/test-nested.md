---
parameters:
  topic:
    type: string
    description: The topic to summarize
  length:
    type: number
    description: The desired summary length in words
    required: false
description: A nested test prompt for summarization
author: Test Author
---
# Summarization Request

Please provide a summary of the following topic: {{topic}}

{{#if length}}
Your summary should be approximately {{length}} words long.
{{else}}
Please provide a concise summary of appropriate length.
{{/if}}

Focus on the key points and ensure the summary is accurate and informative.