---
parameters:
  code:
    type: string
    description: The code that contains the bug or issue
  error_message:
    type: string
    description: Error message or description of the problem
    required: false
  language:
    type: string
    description: Programming language of the code
    required: false
  expected_behavior:
    type: string
    description: What the code should do instead
    required: false
  context:
    type: string
    description: Additional context about when/how the bug occurs
    required: false
  debug_level:
    type: string
    description: Level of debugging assistance needed
    enum: ['quick-fix', 'thorough-analysis', 'root-cause-analysis']
    required: false
  environment_info:
    type: string
    description: Environment details (OS, versions, dependencies)
    required: false
description: Comprehensive bug fixing and debugging assistance with detailed analysis
author: Shelton Tolbert
---
# Bug Fixing and Debugging Request

I need help debugging and fixing an issue in the following {{#if language}}{{language}} {{/if}}code:

```{{#if language}}{{language}}{{/if}}
{{code}}
```

## Problem Description

{{#if error_message}}
**Error Message/Issue**:
```
{{error_message}}
```
{{else}}
**Issue**: The code is not behaving as expected.
{{/if}}

{{#if expected_behavior}}
**Expected Behavior**: {{expected_behavior}}
{{else}}
**Expected Behavior**: Please help identify what the correct behavior should be.
{{/if}}

{{#if context}}
**Additional Context**: {{context}}
{{/if}}

{{#if environment_info}}
**Environment Information**: {{environment_info}}
{{/if}}

## Debug Analysis Level

{{#if debug_level}}
**Analysis Type**: {{debug_level}}
{{else}}
**Analysis Type**: Thorough analysis with step-by-step debugging
{{/if}}

## Debugging Requirements

Please provide a comprehensive debugging analysis that includes:

### 1. Problem Identification
- Root cause analysis of the issue
- Specific line(s) where the problem occurs
- Type of bug (logic error, syntax error, runtime error, etc.)
- Severity assessment (critical, major, minor)

### 2. Error Analysis
- Detailed explanation of why the error occurs
- Trace through the problematic code execution
- Identify contributing factors
- Analysis of error propagation

### 3. Impact Assessment
- What functionality is affected
- Potential side effects or cascading issues
- Data integrity concerns
- Performance implications

### 4. Debugging Strategy
- Step-by-step debugging approach
- Key variables/states to monitor
- Breakpoint recommendations
- Logging suggestions for investigation

### 5. Multiple Solution Options
- **Quick Fix**: Immediate workaround or patch
- **Proper Fix**: Correct long-term solution
- **Robust Fix**: Enhanced solution with error prevention
- Trade-offs between different approaches

### 6. Code Corrections
- Corrected version of the problematic code
- Line-by-line explanation of changes
- Before/after comparison
- Verification that the fix addresses the root cause

### 7. Prevention Strategies
- How to avoid similar issues in the future
- Code review checkpoints
- Testing strategies to catch this type of bug
- Best practices to implement

### 8. Testing Recommendations
- Unit tests to verify the fix
- Integration tests for related functionality
- Edge cases to test
- Regression testing suggestions

## Debugging Checklist

Please verify and address:

### Common Bug Categories
- **Logic Errors**: Incorrect algorithms or conditions
- **Runtime Errors**: Null references, array bounds, type mismatches
- **Concurrency Issues**: Race conditions, deadlocks, thread safety
- **Memory Issues**: Leaks, buffer overflows, improper allocation
- **Integration Problems**: API misuse, dependency conflicts
- **Configuration Issues**: Environment variables, settings, permissions

### Code Quality Issues
- **Input Validation**: Missing or inadequate validation
- **Error Handling**: Insufficient exception handling
- **Resource Management**: Unclosed files, connections, memory
- **Performance Problems**: Inefficient algorithms, unnecessary operations

### Security Vulnerabilities
- **Input Sanitization**: SQL injection, XSS prevention
- **Authentication/Authorization**: Access control issues
- **Data Exposure**: Sensitive information leaks
- **Cryptographic Issues**: Weak encryption, key management

## Output Format

Please structure your response as follows:

### 🔍 Bug Analysis
- Problem summary and root cause
- Affected code sections highlighted
- Error explanation and impact

### 🛠️ Solution Options
1. **Immediate Fix** (if applicable)
2. **Recommended Solution**
3. **Enhanced Solution** (if beneficial)

### 📝 Fixed Code
```{{#if language}}{{language}}{{/if}}
// Corrected code with explanatory comments
```

### ✅ Verification Steps
- How to test the fix
- Expected results after applying the solution
- Additional validation steps

### 🚀 Improvements
- Code quality enhancements
- Performance optimizations
- Error handling improvements
- Documentation updates needed

### 🔒 Prevention
- Best practices to avoid similar issues
- Code review guidelines
- Testing strategies
- Monitoring recommendations

## Additional Analysis (if requested)

If this is a complex issue, please also consider:
- **Performance profiling** suggestions
- **Memory usage** analysis
- **Scalability** implications
- **Maintainability** improvements
- **Security** hardening opportunities

Please provide clear explanations suitable for both debugging the immediate issue and learning to prevent similar problems in the future.