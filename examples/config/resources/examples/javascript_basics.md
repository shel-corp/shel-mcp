# JavaScript Basics

This resource provides an overview of basic JavaScript concepts and syntax.

## Variables and Data Types

JavaScript has several ways to declare variables:

```javascript
// Using var (function-scoped, older style)
var count = 10;

// Using let (block-scoped, recommended)
let name = "Alice";

// Using const (block-scoped, immutable binding)
const PI = 3.14159;
```

Common data types in JavaScript:

```javascript
// Numbers
let integer = 42;
let float = 3.14;

// Strings
let greeting = "Hello, world!";
let multiline = `This is a
multi-line string`;

// Booleans
let isActive = true;
let isComplete = false;

// Arrays
let fruits = ["apple", "banana", "cherry"];

// Objects
let person = {
  name: "John",
  age: 30,
  isStudent: false
};

// Special values
let empty = null;
let notDefined = undefined;
```

## Functions

Functions can be defined in several ways:

```javascript
// Function declaration
function add(a, b) {
  return a + b;
}

// Function expression
const subtract = function(a, b) {
  return a - b;
};

// Arrow function (ES6+)
const multiply = (a, b) => a * b;

// Function with default parameters
function greet(name = "Guest") {
  return `Hello, ${name}!`;
}
```

## Control Flow

Conditional statements:

```javascript
// If-else statement
if (age >= 18) {
  console.log("Adult");
} else if (age >= 13) {
  console.log("Teenager");
} else {
  console.log("Child");
}

// Switch statement
switch (day) {
  case "Monday":
    console.log("Start of work week");
    break;
  case "Friday":
    console.log("End of work week");
    break;
  default:
    console.log("Another day");
    break;
}

// Ternary operator
let status = age >= 18 ? "Adult" : "Minor";
```

Loops:

```javascript
// For loop
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// While loop
let count = 0;
while (count < 5) {
  console.log(count);
  count++;
}

// For...of loop (iterating over arrays)
const numbers = [1, 2, 3];
for (const num of numbers) {
  console.log(num);
}

// For...in loop (iterating over object properties)
const user = { name: "John", age: 30 };
for (const key in user) {
  console.log(`${key}: ${user[key]}`);
}
```

## Error Handling

Try-catch blocks:

```javascript
try {
  // Code that might throw an error
  const result = riskyFunction();
  console.log(result);
} catch (error) {
  // Handle the error
  console.error("An error occurred:", error.message);
} finally {
  // This runs regardless of whether an error occurred
  console.log("Cleanup code");
}
```

## Common Methods

### Array Methods

```javascript
const arr = [1, 2, 3, 4, 5];

// Adding/removing elements
arr.push(6);           // Adds to the end
arr.pop();             // Removes from the end
arr.unshift(0);        // Adds to the beginning
arr.shift();           // Removes from the beginning
arr.splice(2, 1, 'a'); // Removes 1 element at index 2 and inserts 'a'

// Transformations
const doubled = arr.map(x => x * 2);     // Creates new array with transformed values
const evens = arr.filter(x => x % 2 === 0); // Creates new array with filtered values
const sum = arr.reduce((total, x) => total + x, 0); // Reduces array to a single value

// Searching
const index = arr.indexOf(3);            // Finds index of an item
const hasTwo = arr.includes(2);          // Checks if array includes a value
const found = arr.find(x => x > 3);      // Finds first element matching condition
```

### String Methods

```javascript
const str = "Hello, world!";

// Basic operations
const length = str.length;             // String length
const char = str.charAt(3);            // Character at position
const upper = str.toUpperCase();       // Convert to uppercase
const lower = str.toLowerCase();       // Convert to lowercase

// Searching and extracting
const index = str.indexOf("world");    // Find substring
const includes = str.includes("Hello"); // Check if string contains substring
const start = str.startsWith("Hello"); // Check if string starts with substring
const end = str.endsWith("!");        // Check if string ends with substring
const sub = str.substring(0, 5);      // Extract substring (start, end)

// Manipulation
const replaced = str.replace("world", "JavaScript"); // Replace substring
const split = str.split(", ");        // Split string into array
const trimmed = "   text   ".trim();  // Remove whitespace from start/end
```

## Best Practices

1. **Use strict mode** to catch common coding mistakes:
   ```javascript
   'use strict';
   ```

2. **Use let/const instead of var** for better scoping

3. **Use descriptive variable names** for better readability

4. **Comment your code** for complex logic

5. **Handle errors properly** using try-catch

6. **Avoid global variables** to prevent naming conflicts

7. **Use === instead of ==** to avoid type coercion issues

8. **Prefer arrow functions** for simple function expressions

9. **Use template literals** for string concatenation:
   ```javascript
   const name = "Alice";
   const greeting = `Hello, ${name}!`;
   ```

10. **Use modern array methods** (map, filter, reduce) instead of for loops when appropriate