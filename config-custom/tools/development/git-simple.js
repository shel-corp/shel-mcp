/**
 * Simplified Git Helper Tool for MCP Server
 * Provides basic Git workflow automation without external dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'git-simple',
  description: 'Simplified Git workflow automation tool for basic repository operations',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['status', 'branch', 'log', 'diff'],
        description: 'Git action to perform'
      },
      limit: {
        type: 'number',
        description: 'Limit for log entries'
      }
    },
    required: ['action']
  },

  handler: async function({ action = 'status', limit = 10 }) {
    try {
      // Check if we're in a git repository
      try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
      } catch (error) {
        return {
          success: false,
          error: 'Not in a Git repository. Please run this command from within a Git repository.'
        };
      }

      switch (action) {
        case 'status':
          return await this.getStatus();
        case 'branch':
          return await this.getBranches();
        case 'log':
          return await this.getLog(limit);
        case 'diff':
          return await this.getDiff();
        default:
          return {
            success: false,
            error: `Unknown action: ${action}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Git operation failed: ${error.message}`
      };
    }
  },

  async getStatus() {
    try {
      const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      
      // Parse ahead/behind info
      let ahead = 0, behind = 0;
      try {
        const aheadBehind = execSync('git rev-list --left-right --count HEAD...@{upstream}', { encoding: 'utf8' });
        const parts = aheadBehind.trim().split('\t');
        ahead = parseInt(parts[0]) || 0;
        behind = parseInt(parts[1]) || 0;
      } catch (e) {
        // Ignore if no upstream
      }

      const modifiedFiles = [];
      const stagedFiles = [];
      const untrackedFiles = [];

      const lines = statusOutput.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const statusCode = line.substring(0, 2);
        const filename = line.substring(3);
        
        if (statusCode.includes('M')) {
          modifiedFiles.push(filename);
        } else if (statusCode.includes('A') || statusCode.includes('D') || statusCode.includes('R')) {
          stagedFiles.push(filename);
        } else if (statusCode === '??') {
          untrackedFiles.push(filename);
        }
      });

      return {
        success: true,
        result: {
          current_branch: currentBranch,
          ahead: ahead,
          behind: behind,
          modified_files: modifiedFiles,
          staged_files: stagedFiles,
          untracked_files: untrackedFiles,
          clean: modifiedFiles.length === 0 && stagedFiles.length === 0 && untrackedFiles.length === 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get git status: ${error.message}`
      };
    }
  },

  async getBranches() {
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const localBranches = execSync('git branch --format="%(refname:short)"', { encoding: 'utf8' })
        .split('\n')
        .filter(branch => branch.trim())
        .map(branch => branch.trim());

      let remoteBranches = [];
      try {
        remoteBranches = execSync('git branch -r --format="%(refname:short)"', { encoding: 'utf8' })
          .split('\n')
          .filter(branch => branch.trim())
          .map(branch => branch.replace('origin/', '').trim());
      } catch (e) {
        // Ignore if no remotes
      }

      return {
        success: true,
        result: {
          current_branch: currentBranch,
          local_branches: localBranches,
          remote_branches: remoteBranches,
          suggested_actions: [
            'To create new branch: git checkout -b <branch-name>',
            'To switch branch: git checkout <branch-name>',
            'To merge branch: git merge <branch-name>',
            'To delete branch: git branch -d <branch-name>'
          ]
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get branch information: ${error.message}`
      };
    }
  },

  async getLog(limit) {
    try {
      const logOutput = execSync(`git log --oneline -n ${limit} --pretty=format:"%H|%h|%an|%ad|%s" --date=iso`, { encoding: 'utf8' });
      const totalCommits = parseInt(execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim());
      
      const commits = logOutput.split('\n').filter(line => line.trim()).map(line => {
        const parts = line.split('|');
        return {
          hash: parts[0],
          short_hash: parts[1],
          author: parts[2],
          date: parts[3],
          message: parts[4]
        };
      });

      // Get unique contributors
      const contributors = execSync('git log --format="%an"', { encoding: 'utf8' })
        .split('\n')
        .filter(author => author.trim())
        .filter((author, index, arr) => arr.indexOf(author) === index)
        .length;

      return {
        success: true,
        result: {
          recent_commits: commits,
          total_commits: totalCommits,
          unique_contributors: contributors
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get git log: ${error.message}`
      };
    }
  },

  async getDiff() {
    try {
      const diffStats = execSync('git diff --stat', { encoding: 'utf8' });
      const diffNameOnly = execSync('git diff --name-only', { encoding: 'utf8' });
      
      const filesChanged = diffNameOnly.split('\n').filter(file => file.trim()).length;
      
      // Parse insertions and deletions from numstat
      let insertions = 0;
      let deletions = 0;
      try {
        const numstat = execSync('git diff --numstat', { encoding: 'utf8' });
        numstat.split('\n').forEach(line => {
          const parts = line.split('\t');
          if (parts.length >= 2) {
            insertions += parseInt(parts[0]) || 0;
            deletions += parseInt(parts[1]) || 0;
          }
        });
      } catch (e) {
        // Ignore parsing errors
      }

      return {
        success: true,
        result: {
          files_changed: filesChanged,
          insertions: insertions,
          deletions: deletions,
          diff_summary: diffStats || 'No changes'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get git diff: ${error.message}`
      };
    }
  }
};