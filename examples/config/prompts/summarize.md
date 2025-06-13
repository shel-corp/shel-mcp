---
parameters:
  text:
    type: string
    description: The text to summarize
  length:
    type: string
    description: The desired length of the summary
    enum: ['short', 'medium', 'long']
    required: false
  focus:
    type: string
    description: Specific aspect to focus on in the summary
    required: false
description: A prompt for summarizing text with customizable length and focus
author: Shel MCP Team
---
# Text Summarization Request

I need a summary of the following text:

{{text}}

{{#if length}}
Please provide a {{length}} summary.
{{else}}
Please provide a concise summary.
{{/if}}

{{#if focus}}
Focus particularly on aspects related to: {{focus}}
{{/if}}

The summary should:
1. Capture the main points and key information
2. Maintain accuracy without adding information not in the original text
3. Be well-structured and coherent
4. Highlight the most important concepts