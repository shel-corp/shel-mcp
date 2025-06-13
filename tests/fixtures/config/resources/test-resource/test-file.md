# Markdown Test File

This is a test Markdown file for testing the resource loader.

## Features to Test

The resource loader should correctly identify this file as a Markdown file
and set its content type to text/markdown.

### Code Blocks

```javascript
function testFunction() {
  console.log("This is a code block inside a Markdown file");
  return true;
}
```

### Lists

- Item 1
- Item 2
- Item 3

### Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |

This file should be properly loaded as a Markdown resource and made available
through the MCP server's resource system.