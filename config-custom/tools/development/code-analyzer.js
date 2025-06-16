/**
 * Code Analysis Tool for MCP Server
 * Analyzes code for various metrics including complexity, maintainability, and potential issues
 */

const fs = require('fs');
const path = require('path');

// Helper functions defined separately to avoid context issues
function countFunctions(code, language) {
  const patterns = {
    javascript: /function\s+\w+|const\s+\w+\s*=\s*\(|let\s+\w+\s*=\s*\(|var\s+\w+\s*=\s*\(/g,
    typescript: /function\s+\w+|const\s+\w+\s*=\s*\(|let\s+\w+\s*=\s*\(|private\s+\w+\(|public\s+\w+\(/g,
    python: /def\s+\w+/g,
    java: /(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/g,
    csharp: /(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/g
  };
  
  const pattern = patterns[language] || patterns.javascript;
  const matches = code.match(pattern);
  return matches ? matches.length : 0;
}

function countClasses(code, language) {
  const patterns = {
    javascript: /class\s+\w+/g,
    typescript: /class\s+\w+|interface\s+\w+/g,
    python: /class\s+\w+/g,
    java: /(public|private)?\s*class\s+\w+/g,
    csharp: /(public|private|internal)?\s*class\s+\w+/g
  };
  
  const pattern = patterns[language] || patterns.javascript;
  const matches = code.match(pattern);
  return matches ? matches.length : 0;
}

function calculateComplexity(code, language) {
  let complexity = 1; // Base complexity
  
  // Count decision points
  const decisionPatterns = [
    /if\s*\(/g,
    /else\s+if/g,
    /switch\s*\(/g,
    /case\s+/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /catch\s*\(/g,
    /\?\s*:/g, // Ternary operator
    /&&/g,
    /\|\|/g
  ];

  decisionPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
}

function analyzeComplexity(code, language) {
  const issues = [];
  const complexity = calculateComplexity(code, language);
  
  if (complexity > 20) {
    issues.push({
      type: 'complexity',
      severity: 'major',
      message: `High cyclomatic complexity (${complexity}). Consider breaking down into smaller functions.`,
      line: null
    });
  }

  // Check for long functions
  const functions = code.split(/function\s+\w+|def\s+\w+/);
  functions.forEach((func, index) => {
    const lines = func.split('\n').length;
    if (lines > 50) {
      issues.push({
        type: 'complexity',
        severity: 'minor',
        message: `Function is too long (${lines} lines). Consider refactoring.`,
        line: null
      });
    }
  });

  return issues;
}

function analyzeSecurity(code, language) {
  const issues = [];
  
  // Common security patterns to check
  const securityPatterns = [
    { pattern: /eval\s*\(/g, message: 'Use of eval() can be dangerous', severity: 'critical' },
    { pattern: /innerHTML\s*=/g, message: 'Direct innerHTML assignment may lead to XSS', severity: 'major' },
    { pattern: /document\.write/g, message: 'document.write can be unsafe', severity: 'major' },
    { pattern: /password\s*=\s*["'][^"']+["']/gi, message: 'Hardcoded password detected', severity: 'critical' },
    { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi, message: 'Hardcoded API key detected', severity: 'critical' },
    { pattern: /console\.log/g, message: 'Console.log statements should be removed in production', severity: 'minor' }
  ];

  securityPatterns.forEach(({ pattern, message, severity }) => {
    const matches = code.match(pattern);
    if (matches) {
      issues.push({
        type: 'security',
        severity: severity,
        message: message,
        occurrences: matches.length,
        line: null
      });
    }
  });

  return issues;
}

function analyzePerformance(code, language) {
  const issues = [];
  
  // Performance anti-patterns
  const performancePatterns = [
    { pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\(/g, message: 'Nested loops detected - O(n²) complexity', severity: 'major' },
    { pattern: /querySelector(?:All)?\s*\([^)]*\)\s*\.style/g, message: 'DOM manipulation in loop may cause performance issues', severity: 'minor' },
    { pattern: /setTimeout\s*\(\s*function|\setInterval\s*\(\s*function/g, message: 'Consider using requestAnimationFrame for animations', severity: 'minor' }
  ];

  performancePatterns.forEach(({ pattern, message, severity }) => {
    const matches = code.match(pattern);
    if (matches) {
      issues.push({
        type: 'performance',
        severity: severity,
        message: message,
        occurrences: matches.length,
        line: null
      });
    }
  });

  return issues;
}

function analyzeMaintainability(code, language) {
  const issues = [];
  
  // Check for magic numbers
  const magicNumbers = code.match(/\b\d{2,}\b/g);
  if (magicNumbers && magicNumbers.length > 5) {
    issues.push({
      type: 'maintainability',
      severity: 'minor',
      message: 'Consider extracting magic numbers into named constants',
      line: null
    });
  }

  // Check for long parameter lists
  const longParams = code.match(/\([^)]{50,}\)/g);
  if (longParams) {
    issues.push({
      type: 'maintainability',
      severity: 'minor',
      message: 'Long parameter lists detected. Consider using objects or builder pattern.',
      occurrences: longParams.length,
      line: null
    });
  }

  // Check for TODO/FIXME comments
  const todos = code.match(/\/\/\s*(TODO|FIXME|HACK)/gi);
  if (todos) {
    issues.push({
      type: 'maintainability',
      severity: 'minor',
      message: `${todos.length} TODO/FIXME comments found`,
      occurrences: todos.length,
      line: null
    });
  }

  return issues;
}

function calculateOverallScore(metrics, issues) {
  let score = 100;
  
  // Deduct points for issues
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical':
        score -= 20;
        break;
      case 'major':
        score -= 10;
        break;
      case 'minor':
        score -= 3;
        break;
    }
  });

  // Adjust for complexity
  if (metrics.complexity_score > 20) {
    score -= 15;
  } else if (metrics.complexity_score > 10) {
    score -= 5;
  }

  // Bonus for good comment ratio
  const commentRatio = parseFloat(metrics.comment_ratio);
  if (commentRatio > 20) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

function getQualityRating(score) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Fair';
  if (score >= 60) return 'Poor';
  return 'Critical';
}

function generateSuggestions(metrics, issues, language, code) {
  const suggestions = [];
  
  // Comment ratio suggestions
  const commentRatio = parseFloat(metrics.comment_ratio);
  if (commentRatio < 10) {
    suggestions.push({
      category: 'documentation',
      suggestion: 'Add more comments to improve code documentation',
      impact: 'medium'
    });
  }

  // Complexity suggestions
  if (metrics.complexity_score > 15) {
    suggestions.push({
      category: 'complexity',
      suggestion: 'Break down complex functions using the Single Responsibility Principle',
      impact: 'high'
    });
  }

  // Security suggestions based on issues
  const securityIssues = issues.filter(i => i.type === 'security');
  if (securityIssues.length > 0) {
    suggestions.push({
      category: 'security',
      suggestion: 'Review and address security vulnerabilities, especially hardcoded secrets',
      impact: 'critical'
    });
  }

  // Performance suggestions
  const performanceIssues = issues.filter(i => i.type === 'performance');
  if (performanceIssues.length > 0) {
    suggestions.push({
      category: 'performance',
      suggestion: 'Optimize nested loops and DOM operations for better performance',
      impact: 'medium'
    });
  }

  // Language-specific suggestions
  if (language === 'javascript' || language === 'typescript') {
    if (code && code.includes('var ')) {
      suggestions.push({
        category: 'best-practices',
        suggestion: 'Replace var declarations with let/const for better scoping',
        impact: 'low'
      });
    }
  }

  return suggestions;
}

module.exports = {
  name: 'code-analyzer',
  description: 'Analyzes code for complexity, maintainability, security issues, and best practices',
  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The source code to analyze'
      },
      language: {
        type: 'string',
        description: 'Programming language of the code (js, ts, py, java, etc.)'
      },
      analysis_type: {
        type: 'string',
        enum: ['complexity', 'security', 'performance', 'maintainability', 'comprehensive'],
        description: 'Type of analysis to perform'
      },
      include_suggestions: {
        type: 'boolean',
        description: 'Whether to include improvement suggestions'
      }
    },
    required: ['code']
  },

  handler: async function({ code, language = 'javascript', analysis_type = 'comprehensive', include_suggestions = true }) {
    try {
      const analysis = {
        summary: {},
        metrics: {},
        issues: [],
        suggestions: [],
        score: 0
      };

      // Basic code metrics
      const lines = code.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);
      const commentLines = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('//') || trimmed.startsWith('#') || 
               trimmed.startsWith('/*') || trimmed.startsWith('*') ||
               trimmed.startsWith('"""') || trimmed.startsWith("'''");
      });

      analysis.metrics = {
        total_lines: lines.length,
        code_lines: nonEmptyLines.length,
        comment_lines: commentLines.length,
        comment_ratio: (commentLines.length / nonEmptyLines.length * 100).toFixed(2) + '%',
        average_line_length: (code.length / lines.length).toFixed(2),
        functions_count: countFunctions(code, language),
        classes_count: countClasses(code, language),
        complexity_score: calculateComplexity(code, language)
      };

      // Perform specific analysis based on type
      if (analysis_type === 'comprehensive' || analysis_type === 'complexity') {
        analysis.issues.push(...analyzeComplexity(code, language));
      }

      if (analysis_type === 'comprehensive' || analysis_type === 'security') {
        analysis.issues.push(...analyzeSecurity(code, language));
      }

      if (analysis_type === 'comprehensive' || analysis_type === 'performance') {
        analysis.issues.push(...analyzePerformance(code, language));
      }

      if (analysis_type === 'comprehensive' || analysis_type === 'maintainability') {
        analysis.issues.push(...analyzeMaintainability(code, language));
      }

      // Calculate overall score
      analysis.score = calculateOverallScore(analysis.metrics, analysis.issues);

      // Generate suggestions if requested
      if (include_suggestions) {
        analysis.suggestions = generateSuggestions(analysis.metrics, analysis.issues, language, code);
      }

      // Create summary
      analysis.summary = {
        quality_rating: getQualityRating(analysis.score),
        total_issues: analysis.issues.length,
        critical_issues: analysis.issues.filter(i => i.severity === 'critical').length,
        major_issues: analysis.issues.filter(i => i.severity === 'major').length,
        minor_issues: analysis.issues.filter(i => i.severity === 'minor').length,
        maintainability: analysis.metrics.complexity_score < 10 ? 'Good' : 
                        analysis.metrics.complexity_score < 20 ? 'Fair' : 'Poor'
      };

      return {
        success: true,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: `Code analysis failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }
};