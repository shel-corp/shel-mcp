---
parameters:
  code:
    type: string
    description: The code to generate tests for
  language:
    type: string
    description: Programming language of the code
    required: false
  test_framework:
    type: string
    description: Testing framework to use (e.g., Jest, PyTest, JUnit)
    required: false
  test_types:
    type: array
    description: Types of tests to generate (unit, integration, e2e)
    required: false
  coverage_level:
    type: string
    description: Level of test coverage desired
    enum: ['basic', 'comprehensive', 'exhaustive']
    required: false
  include_mocks:
    type: boolean
    description: Whether to include mock examples
    required: false
  edge_cases:
    type: boolean
    description: Whether to include edge case testing
    required: false
description: Generate comprehensive test suites with customizable framework and coverage
author: Shelton Tolbert
---
# Test Generation Request

Please generate comprehensive tests for the following {{#if language}}{{language}} {{/if}}code:

```{{#if language}}{{language}}{{/if}}
{{code}}
```

## Test Configuration

{{#if test_framework}}
**Testing Framework**: {{test_framework}}
{{else}}
**Testing Framework**: Use the most appropriate framework for the language
{{/if}}

{{#if test_types}}
**Test Types**:
{{#each test_types}}
- {{this}}
{{/each}}
{{else}}
**Test Types**:
- Unit tests (primary focus)
- Integration tests (where applicable)
- Edge case tests
{{/if}}

{{#if coverage_level}}
**Coverage Level**: {{coverage_level}}
{{else}}
**Coverage Level**: Comprehensive coverage of main functionality
{{/if}}

{{#if include_mocks}}
**Include Mocks**: Yes, provide mocking examples for dependencies
{{else}}
**Include Mocks**: Include mocks where necessary
{{/if}}

{{#if edge_cases}}
**Edge Cases**: Yes, include comprehensive edge case testing
{{else}}
**Edge Cases**: Include common edge cases
{{/if}}

## Test Requirements

Please generate tests that cover:

### 1. Happy Path Testing
- Normal operation scenarios
- Expected input/output pairs
- Standard use cases
- Typical workflow validation

### 2. Edge Case Testing
- Boundary conditions
- Empty/null inputs
- Maximum/minimum values
- Unusual but valid inputs

### 3. Error Handling
- Invalid input testing
- Exception scenarios
- Error message validation
- Graceful failure testing

### 4. Integration Points
- External dependency interactions
- API calls and responses
- Database operations
- File system operations

### 5. Performance Testing (if applicable)
- Response time validation
- Memory usage testing
- Scalability considerations
- Load testing scenarios

### 6. Security Testing (if applicable)
- Input sanitization
- Authentication/authorization
- Data validation
- Injection attack prevention

## Test Structure

For each test, please provide:

### Test Organization
- Clear test file structure
- Logical grouping of related tests
- Descriptive test names
- Setup and teardown procedures

### Test Cases
- **Arrange**: Test data setup
- **Act**: Function/method execution
- **Assert**: Result verification

### Documentation
- Test purpose and scope
- Expected behaviors being tested
- Any special requirements or assumptions

## Expected Output

Please provide:

### 1. Complete Test Suite
- Full test file(s) with proper imports
- All necessary test cases
- Setup and configuration code
- Mock implementations where needed

### 2. Test Data
- Sample input data
- Expected output data
- Edge case scenarios
- Error condition examples

### 3. Mock Examples
- External dependency mocks
- API response mocks
- Database query mocks
- File system operation mocks

### 4. Test Running Instructions
- How to execute the tests
- Required dependencies
- Configuration requirements
- Expected test output

### 5. Coverage Analysis
- What functionality is covered
- Areas that may need additional testing
- Recommendations for improvement

## Quality Criteria

Ensure the tests:
- Are independent and isolated
- Have clear, descriptive names
- Test one thing at a time
- Are repeatable and deterministic
- Provide meaningful error messages
- Follow testing best practices
- Are maintainable and readable
- Cover both positive and negative cases
- Include appropriate assertions
- Handle async operations correctly (if applicable)

## Additional Considerations

- Include setup/teardown for test isolation
- Provide examples of test doubles (mocks, stubs, fakes)
- Consider parameterized tests for similar scenarios
- Include integration test examples if relevant
- Add performance benchmarks if appropriate
- Suggest continuous integration configurations

Please organize the tests logically and explain the testing strategy used.