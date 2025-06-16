#!/usr/bin/env node

/**
 * MCP Configuration Validation Script
 * 
 * This script validates the custom MCP configuration to ensure:
 * - Tools follow MCP specification format
 * - Prompts have proper metadata structure
 * - Configuration files are valid
 * - Descriptions are properly defined
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration paths
const CONFIG_DIR = path.join(__dirname, '..', 'config-custom');
const TOOLS_DIR = path.join(CONFIG_DIR, 'tools');
const PROMPTS_DIR = path.join(CONFIG_DIR, 'prompts');

// Validation results
let validationResults = {
  tools: [],
  prompts: [],
  config: [],
  errors: [],
  warnings: [],
  summary: {
    totalIssues: 0,
    criticalIssues: 0,
    toolsValid: 0,
    promptsValid: 0,
    configValid: true
  }
};

/**
 * Add validation issue
 */
function addIssue(type, severity, component, message, details = null) {
  const issue = {
    type,
    severity,
    component,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  if (severity === 'error') {
    validationResults.errors.push(issue);
    validationResults.summary.criticalIssues++;
  } else {
    validationResults.warnings.push(issue);
  }
  
  validationResults.summary.totalIssues++;
  
  // Console output
  const icon = severity === 'error' ? '❌' : '⚠️';
  console.log(`${icon} [${type}] ${component}: ${message}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
}

/**
 * Validate MCP tool format
 */
function validateTool(toolPath) {
  const toolName = path.basename(toolPath, path.extname(toolPath));
  console.log(`\n🔧 Validating tool: ${toolName}`);
  
  try {
    // Clear require cache
    delete require.cache[require.resolve(toolPath)];
    const tool = require(toolPath);
    
    const result = {
      name: toolName,
      path: toolPath,
      valid: true,
      issues: []
    };
    
    // Check required fields
    if (!tool.name) {
      addIssue('tool', 'error', toolName, 'Missing required field: name');
      result.valid = false;
      result.issues.push('missing-name');
    }
    
    if (!tool.description) {
      addIssue('tool', 'error', toolName, 'Missing required field: description');
      result.valid = false;
      result.issues.push('missing-description');
    }
    
    if (!tool.inputSchema) {
      addIssue('tool', 'error', toolName, 'Missing required field: inputSchema (should not use "parameters")');
      result.valid = false;
      result.issues.push('missing-inputSchema');
    }
    
    // Check for deprecated 'parameters' field
    if (tool.parameters) {
      addIssue('tool', 'error', toolName, 'Found deprecated "parameters" field - use "inputSchema" instead');
      result.valid = false;
      result.issues.push('deprecated-parameters');
    }
    
    // Validate inputSchema structure
    if (tool.inputSchema) {
      if (tool.inputSchema.type !== 'object') {
        addIssue('tool', 'error', toolName, 'inputSchema.type must be "object"');
        result.valid = false;
        result.issues.push('invalid-schema-type');
      }
      
      if (!tool.inputSchema.properties) {
        addIssue('tool', 'error', toolName, 'inputSchema must have "properties" field');
        result.valid = false;
        result.issues.push('missing-properties');
      }
      
      // Validate properties structure
      if (tool.inputSchema.properties) {
        Object.entries(tool.inputSchema.properties).forEach(([propName, propDef]) => {
          if (!propDef.type) {
            addIssue('tool', 'warning', toolName, `Property "${propName}" missing type definition`);
            result.issues.push(`property-${propName}-missing-type`);
          }
          
          if (!propDef.description) {
            addIssue('tool', 'warning', toolName, `Property "${propName}" missing description`);
            result.issues.push(`property-${propName}-missing-description`);
          }
        });
      }
    }
    
    // Check handler function
    if (!tool.handler || typeof tool.handler !== 'function') {
      addIssue('tool', 'error', toolName, 'Missing or invalid handler function');
      result.valid = false;
      result.issues.push('missing-handler');
    }
    
    // Success message
    if (result.valid) {
      console.log(`   ✅ Tool format is MCP compliant`);
      console.log(`   📝 Description: ${tool.description}`);
      console.log(`   🔧 Properties: ${Object.keys(tool.inputSchema?.properties || {}).join(', ')}`);
      console.log(`   📋 Required: ${tool.inputSchema?.required?.join(', ') || 'none'}`);
      validationResults.summary.toolsValid++;
    }
    
    validationResults.tools.push(result);
    return result;
    
  } catch (error) {
    addIssue('tool', 'error', toolName, `Failed to load tool: ${error.message}`);
    validationResults.tools.push({
      name: toolName,
      path: toolPath,
      valid: false,
      issues: ['load-error'],
      error: error.message
    });
    return null;
  }
}

/**
 * Parse markdown frontmatter
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, content: content };
  }
  
  try {
    const frontmatter = yaml.load(match[1]);
    const remainingContent = content.substring(match[0].length);
    return { frontmatter, content: remainingContent };
  } catch (error) {
    throw new Error(`Invalid YAML frontmatter: ${error.message}`);
  }
}

/**
 * Validate MCP prompt format
 */
function validatePrompt(promptPath) {
  const promptName = path.basename(promptPath, path.extname(promptPath));
  console.log(`\n📝 Validating prompt: ${promptName}`);
  
  try {
    const content = fs.readFileSync(promptPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    
    const result = {
      name: promptName,
      path: promptPath,
      valid: true,
      issues: []
    };
    
    // Check description
    if (!frontmatter.description) {
      addIssue('prompt', 'error', promptName, 'Missing description in frontmatter');
      result.valid = false;
      result.issues.push('missing-description');
    }
    
    // Validate parameters structure
    if (frontmatter.parameters) {
      const mcpArguments = [];
      
      Object.entries(frontmatter.parameters).forEach(([paramName, paramDef]) => {
        if (!paramDef.description) {
          addIssue('prompt', 'warning', promptName, `Parameter "${paramName}" missing description`);
          result.issues.push(`param-${paramName}-missing-description`);
        }
        
        if (!paramDef.type) {
          addIssue('prompt', 'warning', promptName, `Parameter "${paramName}" missing type`);
          result.issues.push(`param-${paramName}-missing-type`);
        }
        
        // Convert to MCP format
        mcpArguments.push({
          name: paramName,
          description: paramDef.description,
          required: paramDef.required !== false
        });
      });
      
      result.mcpArguments = mcpArguments;
    }
    
    // Check author
    if (!frontmatter.author) {
      addIssue('prompt', 'info', promptName, 'Consider adding author field');
    }
    
    // Success message
    if (result.valid) {
      console.log(`   ✅ Prompt format is valid`);
      console.log(`   📝 Description: ${frontmatter.description}`);
      console.log(`   👤 Author: ${frontmatter.author || 'Not specified'}`);
      console.log(`   🔧 Parameters: ${Object.keys(frontmatter.parameters || {}).join(', ')}`);
      validationResults.summary.promptsValid++;
    }
    
    validationResults.prompts.push(result);
    return result;
    
  } catch (error) {
    addIssue('prompt', 'error', promptName, `Failed to load prompt: ${error.message}`);
    validationResults.prompts.push({
      name: promptName,
      path: promptPath,
      valid: false,
      issues: ['load-error'],
      error: error.message
    });
    return null;
  }
}

/**
 * Validate configuration files
 */
function validateConfigFiles() {
  console.log(`\n⚙️ Validating configuration files`);
  
  const configFiles = [
    'mcp-config.yaml',
    'server.yaml',
    'tools.yaml',
    'prompts.yaml'
  ];
  
  configFiles.forEach(filename => {
    const configPath = path.join(CONFIG_DIR, filename);
    
    if (!fs.existsSync(configPath)) {
      addIssue('config', 'warning', filename, 'Configuration file not found');
      return;
    }
    
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const config = yaml.load(content);
      
      console.log(`   ✅ ${filename} - Valid YAML`);
      
      // Specific validations per file type
      if (filename === 'mcp-config.yaml') {
        if (!config.name) {
          addIssue('config', 'error', filename, 'Missing server name');
        }
        if (!config.description) {
          addIssue('config', 'error', filename, 'Missing server description');
        }
        if (!config.capabilities) {
          addIssue('config', 'warning', filename, 'No capabilities declared');
        }
      }
      
      validationResults.config.push({
        name: filename,
        valid: true,
        config: config
      });
      
    } catch (error) {
      addIssue('config', 'error', filename, `Invalid YAML: ${error.message}`);
      validationResults.config.push({
        name: filename,
        valid: false,
        error: error.message
      });
      validationResults.summary.configValid = false;
    }
  });
}

/**
 * Scan directory recursively for files
 */
function scanDirectory(dir, extensions) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  function scanRecursive(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scanRecursive(fullPath);
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  }
  
  scanRecursive(dir);
  return files;
}

/**
 * Generate validation report
 */
function generateReport() {
  console.log('\n\n📊 VALIDATION REPORT');
  console.log('===================');
  
  const { summary } = validationResults;
  
  // Summary statistics
  console.log(`\n📈 Summary:`);
  console.log(`   Tools validated: ${validationResults.tools.length}`);
  console.log(`   Tools valid: ${summary.toolsValid}`);
  console.log(`   Prompts validated: ${validationResults.prompts.length}`);
  console.log(`   Prompts valid: ${summary.promptsValid}`);
  console.log(`   Config files valid: ${summary.configValid ? 'Yes' : 'No'}`);
  console.log(`   Total issues: ${summary.totalIssues}`);
  console.log(`   Critical issues: ${summary.criticalIssues}`);
  
  // Overall status
  console.log(`\n🎯 Overall Status:`);
  if (summary.criticalIssues === 0) {
    console.log('   ✅ Configuration is MCP compliant!');
    console.log('   🚀 Ready for deployment');
  } else {
    console.log('   ❌ Configuration has critical issues');
    console.log('   🔧 Fix critical issues before deployment');
  }
  
  // Next steps
  console.log(`\n🔄 Next Steps:`);
  if (summary.criticalIssues > 0) {
    console.log('   1. Fix all critical errors shown above');
    console.log('   2. Re-run this validation script');
    console.log('   3. Test with mcphub once validation passes');
  } else {
    console.log('   1. Build the server: npm run build');
    console.log('   2. Restart the MCP server');
    console.log('   3. Test with: mcphub list-tools shel-mcp-custom');
    console.log('   4. Verify descriptions appear in mcphub output');
  }
  
  return summary.criticalIssues === 0;
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 MCP Configuration Validation');
  console.log('===============================');
  console.log(`Configuration directory: ${CONFIG_DIR}`);
  console.log(`Tools directory: ${TOOLS_DIR}`);
  console.log(`Prompts directory: ${PROMPTS_DIR}`);
  
  // Validate configuration files
  validateConfigFiles();
  
  // Validate tools
  console.log('\n🔧 VALIDATING TOOLS');
  console.log('===================');
  
  const toolFiles = scanDirectory(TOOLS_DIR, ['.js', '.ts']);
  
  if (toolFiles.length === 0) {
    addIssue('tool', 'warning', 'discovery', 'No tool files found');
  } else {
    toolFiles.forEach(validateTool);
  }
  
  // Validate prompts
  console.log('\n📝 VALIDATING PROMPTS');
  console.log('=====================');
  
  const promptFiles = scanDirectory(PROMPTS_DIR, ['.md']);
  
  if (promptFiles.length === 0) {
    addIssue('prompt', 'warning', 'discovery', 'No prompt files found');
  } else {
    promptFiles.forEach(validatePrompt);
  }
  
  // Generate report
  const isValid = generateReport();
  
  // Save validation results
  const resultsPath = path.join(CONFIG_DIR, 'validation-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(validationResults, null, 2));
  console.log(`\n💾 Validation results saved to: ${resultsPath}`);
  
  // Exit with appropriate code
  process.exit(isValid ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run validation
if (require.main === module) {
  main();
}

module.exports = {
  validateTool,
  validatePrompt,
  validateConfigFiles,
  generateReport
};