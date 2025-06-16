#!/usr/bin/env node

/**
 * MCP Tool Structure Verification Script
 * 
 * This script verifies that tools and prompts follow the MCP specification format
 * and helps debug why descriptions might not be showing up in mcphub.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// MCP specification requirements
const MCP_TOOL_REQUIRED_FIELDS = ['name', 'description', 'inputSchema'];
const MCP_PROMPT_REQUIRED_FIELDS = ['name', 'description'];

/**
 * Verify a single tool follows MCP specification
 */
function verifyTool(toolPath, toolConfig) {
  const issues = [];
  
  console.log(`\n🔧 Verifying tool: ${toolConfig.name || 'UNNAMED'}`);
  
  // Check required fields
  MCP_TOOL_REQUIRED_FIELDS.forEach(field => {
    if (!toolConfig[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  });
  
  // Check inputSchema structure
  if (toolConfig.inputSchema) {
    if (toolConfig.inputSchema.type !== 'object') {
      issues.push('inputSchema.type must be "object"');
    }
    
    if (!toolConfig.inputSchema.properties) {
      issues.push('inputSchema must have "properties" field');
    }
    
    // Check if old 'parameters' field exists (common mistake)
    if (toolConfig.parameters) {
      issues.push('Found old "parameters" field - should be "inputSchema"');
    }
  }
  
  // Report results
  if (issues.length === 0) {
    console.log('  ✅ Tool format is correct');
    console.log(`  📝 Description: ${toolConfig.description}`);
    console.log(`  🔧 Parameters: ${Object.keys(toolConfig.inputSchema?.properties || {}).join(', ')}`);
  } else {
    console.log('  ❌ Issues found:');
    issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  return issues;
}

/**
 * Verify a single prompt follows MCP specification
 */
function verifyPrompt(promptPath, promptConfig) {
  const issues = [];
  
  console.log(`\n📝 Verifying prompt: ${promptConfig.name || path.basename(promptPath, '.md')}`);
  
  // Check required fields
  MCP_PROMPT_REQUIRED_FIELDS.forEach(field => {
    if (!promptConfig[field]) {
      issues.push(`Missing required field: ${field}`);
    }
  });
  
  // Check arguments structure if present
  if (promptConfig.arguments) {
    if (!Array.isArray(promptConfig.arguments)) {
      issues.push('arguments must be an array');
    } else {
      promptConfig.arguments.forEach((arg, index) => {
        if (!arg.name) {
          issues.push(`Argument ${index} missing "name" field`);
        }
        if (!arg.description) {
          issues.push(`Argument ${index} missing "description" field`);
        }
      });
    }
  }
  
  // Report results
  if (issues.length === 0) {
    console.log('  ✅ Prompt format is correct');
    console.log(`  📝 Description: ${promptConfig.description}`);
    console.log(`  🔧 Arguments: ${promptConfig.arguments?.map(a => a.name).join(', ') || 'none'}`);
  } else {
    console.log('  ❌ Issues found:');
    issues.forEach(issue => console.log(`     - ${issue}`));
  }
  
  return issues;
}

/**
 * Parse YAML frontmatter from markdown file
 */
function parseMarkdownWithFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
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
    console.error(`Error parsing YAML frontmatter in ${filePath}:`, error.message);
    return { frontmatter: {}, content: content };
  }
}

/**
 * Scan directory for tools and prompts
 */
function scanDirectory(dir, type) {
  const items = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return items;
  }
  
  function scanRecursive(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        scanRecursive(fullPath);
      } else if (type === 'tools' && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        items.push(fullPath);
      } else if (type === 'prompts' && entry.name.endsWith('.md')) {
        items.push(fullPath);
      }
    });
  }
  
  scanRecursive(dir);
  return items;
}

/**
 * Main verification function
 */
function main() {
  console.log('🔍 MCP Tool & Prompt Structure Verification');
  console.log('==========================================');
  
  const configDir = path.join(__dirname, 'config-custom');
  const toolsDir = path.join(configDir, 'tools');
  const promptsDir = path.join(configDir, 'prompts');
  
  let totalIssues = 0;
  
  // Verify tools
  console.log('\n🔧 SCANNING TOOLS');
  console.log('=================');
  
  const toolFiles = scanDirectory(toolsDir, 'tools');
  
  if (toolFiles.length === 0) {
    console.log('No tool files found');
  } else {
    toolFiles.forEach(toolFile => {
      try {
        // Clear require cache to get fresh copy
        delete require.cache[require.resolve(toolFile)];
        const toolConfig = require(toolFile);
        const issues = verifyTool(toolFile, toolConfig);
        totalIssues += issues.length;
      } catch (error) {
        console.log(`\n❌ Error loading tool ${toolFile}:`);
        console.log(`   ${error.message}`);
        totalIssues++;
      }
    });
  }
  
  // Verify prompts
  console.log('\n\n📝 SCANNING PROMPTS');
  console.log('==================');
  
  const promptFiles = scanDirectory(promptsDir, 'prompts');
  
  if (promptFiles.length === 0) {
    console.log('No prompt files found');
  } else {
    promptFiles.forEach(promptFile => {
      try {
        const { frontmatter } = parseMarkdownWithFrontmatter(promptFile);
        const promptConfig = {
          name: frontmatter.name || path.basename(promptFile, '.md'),
          description: frontmatter.description,
          arguments: frontmatter.parameters ? Object.entries(frontmatter.parameters).map(([name, config]) => ({
            name,
            description: config.description,
            required: config.required !== false
          })) : undefined
        };
        
        const issues = verifyPrompt(promptFile, promptConfig);
        totalIssues += issues.length;
      } catch (error) {
        console.log(`\n❌ Error loading prompt ${promptFile}:`);
        console.log(`   ${error.message}`);
        totalIssues++;
      }
    });
  }
  
  // Summary
  console.log('\n\n📊 VERIFICATION SUMMARY');
  console.log('======================');
  
  if (totalIssues === 0) {
    console.log('✅ All tools and prompts follow MCP specification!');
    console.log('\nIf descriptions still don\'t show up in mcphub, the issue is likely in:');
    console.log('  - Server tool/prompt registration code');
    console.log('  - MCP server capability declarations');
    console.log('  - Tool/prompt loading and parsing logic');
  } else {
    console.log(`❌ Found ${totalIssues} issues that need to be fixed`);
    console.log('\nPlease fix the issues above and run this script again.');
  }
  
  console.log('\n🔍 Next steps:');
  console.log('  1. Fix any issues shown above');
  console.log('  2. Rebuild the MCP server: npm run build');
  console.log('  3. Restart the MCP server');
  console.log('  4. Test with mcphub again');
}

// Run the verification
if (require.main === module) {
  main();
}

module.exports = { verifyTool, verifyPrompt, parseMarkdownWithFrontmatter };