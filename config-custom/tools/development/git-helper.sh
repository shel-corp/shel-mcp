#!/bin/bash

# Git Helper Tool for MCP Server
# Provides Git workflow automation and repository analysis

# Check for required dependencies
check_dependencies() {
  if ! command -v jq &> /dev/null; then
    echo '{"success": false, "error": "jq is required but not installed. Please install jq to use this tool."}'
    exit 1
  fi
  
  if ! command -v git &> /dev/null; then
    echo '{"success": false, "error": "git is required but not installed."}'
    exit 1
  fi
}

# Check if this is a metadata request
if [[ "$1" == "--mcp-metadata" ]]; then
  cat << 'EOF'
{
  "name": "git-helper",
  "description": "Git workflow automation tool for common repository operations and analysis",
  "parameters": {
    "action": {
      "type": "string",
      "enum": ["status", "commit", "branch", "log", "diff", "stats", "cleanup", "interactive-rebase", "conflict-check"],
      "description": "Git action to perform"
    },
    "message": {
      "type": "string",
      "description": "Commit message (for commit action)",
      "required": false
    },
    "branch_name": {
      "type": "string",
      "description": "Branch name (for branch operations)",
      "required": false
    },
    "file_pattern": {
      "type": "string",
      "description": "File pattern for git operations",
      "required": false
    },
    "limit": {
      "type": "number",
      "description": "Limit for log entries or stats",
      "required": false
    },
    "target_branch": {
      "type": "string",
      "description": "Target branch for comparisons or merges",
      "required": false
    }
  }
}
EOF
  exit 0
fi

# Execute tool
if [[ "$1" == "--mcp-execute" ]]; then
  # Check dependencies first
  check_dependencies
  
  PARAMS="$2"
  
  # Validate JSON parameters
  if [[ -z "$PARAMS" ]]; then
    echo '{"success": false, "error": "No parameters provided"}'
    exit 1
  fi
  
  # Parse JSON parameters with error handling
  ACTION=$(echo "$PARAMS" | jq -r '.action // "status"' 2>/dev/null)
  if [[ $? -ne 0 ]]; then
    echo '{"success": false, "error": "Invalid JSON parameters"}'
    exit 1
  fi
  
  MESSAGE=$(echo "$PARAMS" | jq -r '.message // ""' 2>/dev/null)
  BRANCH_NAME=$(echo "$PARAMS" | jq -r '.branch_name // ""' 2>/dev/null)
  FILE_PATTERN=$(echo "$PARAMS" | jq -r '.file_pattern // ""' 2>/dev/null)
  LIMIT=$(echo "$PARAMS" | jq -r '.limit // 10' 2>/dev/null)
  TARGET_BRANCH=$(echo "$PARAMS" | jq -r '.target_branch // "main"' 2>/dev/null)
  
  # Check if we're in a git repository
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo '{"success": false, "error": "Not in a Git repository. Please run this command from within a Git repository."}'
    exit 1
  fi
  
  case "$ACTION" in
    "status")
      perform_status
      ;;
    "commit")
      perform_commit "$MESSAGE" "$FILE_PATTERN"
      ;;
    "branch")
      perform_branch_operations "$BRANCH_NAME"
      ;;
    "log")
      perform_log_analysis "$LIMIT" "$TARGET_BRANCH"
      ;;
    "diff")
      perform_diff_analysis "$TARGET_BRANCH" "$FILE_PATTERN"
      ;;
    "stats")
      perform_repository_stats "$LIMIT"
      ;;
    "cleanup")
      perform_repository_cleanup
      ;;
    "interactive-rebase")
      perform_interactive_rebase "$TARGET_BRANCH"
      ;;
    "conflict-check")
      perform_conflict_check "$TARGET_BRANCH"
      ;;
    *)
      echo '{"success": false, "error": "Unknown action: '"$ACTION"'"}'
      exit 1
      ;;
  esac
  
  exit 0
fi

# Function implementations
perform_status() {
  local status_output=$(git status --porcelain)
  local branch_name=$(git branch --show-current)
  local ahead_behind=$(git rev-list --left-right --count HEAD...@{upstream} 2>/dev/null || echo "0	0")
  local ahead=$(echo "$ahead_behind" | cut -f1)
  local behind=$(echo "$ahead_behind" | cut -f2)
  
  local modified_files=()
  local staged_files=()
  local untracked_files=()
  
  while IFS= read -r line; do
    if [[ -n "$line" ]]; then
      local status_code="${line:0:2}"
      local filename="${line:3}"
      
      case "$status_code" in
        "M "*|" M")
          modified_files+=("$filename")
          ;;
        "A "*|" A")
          staged_files+=("$filename")
          ;;
        "??")
          untracked_files+=("$filename")
          ;;
        *)
          staged_files+=("$filename")
          ;;
      esac
    fi
  done <<< "$status_output"
  
  # Convert arrays to JSON with error handling
  if [[ ${#modified_files[@]} -eq 0 ]]; then
    modified_json="[]"
  else
    modified_json=$(printf '%s\n' "${modified_files[@]}" | jq -R . | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then modified_json="[]"; fi
  fi
  
  if [[ ${#staged_files[@]} -eq 0 ]]; then
    staged_json="[]"
  else
    staged_json=$(printf '%s\n' "${staged_files[@]}" | jq -R . | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then staged_json="[]"; fi
  fi
  
  if [[ ${#untracked_files[@]} -eq 0 ]]; then
    untracked_json="[]"
  else
    untracked_json=$(printf '%s\n' "${untracked_files[@]}" | jq -R . | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then untracked_json="[]"; fi
  fi
  
  cat << EOF
{
  "success": true,
  "result": {
    "current_branch": "$branch_name",
    "ahead": $ahead,
    "behind": $behind,
    "modified_files": $modified_json,
    "staged_files": $staged_json,
    "untracked_files": $untracked_json,
    "clean": $([ ${#modified_files[@]} -eq 0 ] && [ ${#staged_files[@]} -eq 0 ] && [ ${#untracked_files[@]} -eq 0 ] && echo "true" || echo "false")
  }
}
EOF
}

perform_commit() {
  local message="$1"
  local file_pattern="$2"
  
  if [[ -z "$message" ]]; then
    echo '{"success": false, "error": "Commit message is required"}'
    return 1
  fi
  
  # Add files
  if [[ -n "$file_pattern" ]]; then
    git add "$file_pattern" 2>/dev/null
  else
    git add . 2>/dev/null
  fi
  
  # Check if there are staged changes
  if git diff --cached --quiet; then
    echo '{"success": false, "error": "No changes staged for commit"}'
    return 1
  fi
  
  # Perform commit
  local commit_hash
  if commit_hash=$(git commit -m "$message" 2>&1); then
    local hash=$(git rev-parse HEAD)
    echo "{\"success\": true, \"result\": {\"commit_hash\": \"$hash\", \"message\": \"$message\"}}"
  else
    echo "{\"success\": false, \"error\": \"Commit failed: $commit_hash\"}"
    return 1
  fi
}

perform_branch_operations() {
  local branch_name="$1"
  local current_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
  
  # Get all local branches
  local all_branches_raw=$(git branch --format='%(refname:short)' 2>/dev/null)
  if [[ -n "$all_branches_raw" ]]; then
    local all_branches=$(echo "$all_branches_raw" | jq -R . | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then all_branches="[]"; fi
  else
    local all_branches="[]"
  fi
  
  # Get remote branches
  local remote_branches_raw=$(git branch -r --format='%(refname:short)' 2>/dev/null | sed 's/origin\///')
  if [[ -n "$remote_branches_raw" ]]; then
    local remote_branches=$(echo "$remote_branches_raw" | jq -R . | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then remote_branches="[]"; fi
  else
    local remote_branches="[]"
  fi
  
  cat << EOF
{
  "success": true,
  "result": {
    "current_branch": "$current_branch",
    "local_branches": $all_branches,
    "remote_branches": $remote_branches,
    "suggested_actions": [
      "To create new branch: git checkout -b <branch-name>",
      "To switch branch: git checkout <branch-name>",
      "To merge branch: git merge <branch-name>",
      "To delete branch: git branch -d <branch-name>"
    ]
  }
}
EOF
}

perform_log_analysis() {
  local limit="$1"
  local target_branch="$2"
  
  # Get commits with error handling
  local commits_raw=$(git log --oneline -n "$limit" --format='{"hash": "%H", "short_hash": "%h", "author": "%an", "date": "%ad", "message": "%s"}' --date=iso 2>/dev/null)
  if [[ -n "$commits_raw" ]]; then
    local commits_json=$(echo "$commits_raw" | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then commits_json="[]"; fi
  else
    local commits_json="[]"
  fi
  
  local total_commits=$(git rev-list --count HEAD 2>/dev/null || echo "0")
  local contributors=$(git log --format='%an' 2>/dev/null | sort | uniq | wc -l || echo "0")
  
  cat << EOF
{
  "success": true,
  "result": {
    "recent_commits": $commits_json,
    "total_commits": $total_commits,
    "unique_contributors": $contributors,
    "branch_comparison": "$(git rev-list --left-right --count HEAD...$target_branch 2>/dev/null || echo "N/A")"
  }
}
EOF
}

perform_diff_analysis() {
  local target_branch="$1"
  local file_pattern="$2"
  
  local diff_stats
  if [[ -n "$file_pattern" ]]; then
    diff_stats=$(git diff --stat "$file_pattern" 2>/dev/null || echo "No changes")
  else
    diff_stats=$(git diff --stat 2>/dev/null || echo "No changes")
  fi
  
  local files_changed=$(git diff --name-only | wc -l)
  local insertions=$(git diff --numstat | awk '{sum += $1} END {print sum+0}')
  local deletions=$(git diff --numstat | awk '{sum += $2} END {print sum+0}')
  
  cat << EOF
{
  "success": true,
  "result": {
    "files_changed": $files_changed,
    "insertions": $insertions,
    "deletions": $deletions,
    "diff_summary": "$diff_stats"
  }
}
EOF
}

perform_repository_stats() {
  local limit="$1"
  
  local total_commits=$(git rev-list --count HEAD)
  local total_contributors=$(git log --format='%an' | sort | uniq | wc -l)
  local first_commit_date=$(git log --reverse --format='%ad' --date=short | head -n1)
  local last_commit_date=$(git log -1 --format='%ad' --date=short)
  local total_files=$(git ls-files | wc -l)
  local repo_size=$(du -sh .git 2>/dev/null | cut -f1 || echo "Unknown")
  
  # Top contributors with error handling
  local contributors_raw=$(git log --format='%an' 2>/dev/null | sort | uniq -c | sort -nr | head -n "$limit")
  if [[ -n "$contributors_raw" ]]; then
    local top_contributors=$(echo "$contributors_raw" | while read count name; do
      echo "{\"name\": \"$name\", \"commits\": $count}"
    done | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then top_contributors="[]"; fi
  else
    local top_contributors="[]"
  fi
  
  # File type distribution with error handling
  local file_types_raw=$(git ls-files 2>/dev/null | sed 's/.*\.//' | sort | uniq -c | sort -nr | head -n "$limit")
  if [[ -n "$file_types_raw" ]]; then
    local file_types=$(echo "$file_types_raw" | while read count ext; do
      echo "{\"extension\": \"$ext\", \"count\": $count}"
    done | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then file_types="[]"; fi
  else
    local file_types="[]"
  fi
  
  cat << EOF
{
  "success": true,
  "result": {
    "total_commits": $total_commits,
    "total_contributors": $total_contributors,
    "first_commit": "$first_commit_date",
    "last_commit": "$last_commit_date",
    "total_files": $total_files,
    "repository_size": "$repo_size",
    "top_contributors": $top_contributors,
    "file_types": $file_types
  }
}
EOF
}

perform_repository_cleanup() {
  local cleaned_items=[]
  
  # Clean up merged branches (except main/master/develop)
  local merged_branches=$(git branch --merged | grep -v -E "(main|master|develop|\*)" | tr -d ' ')
  if [[ -n "$merged_branches" ]]; then
    cleaned_items=$(echo "$cleaned_items" | jq '. + ["Identified merged branches for cleanup"]')
  fi
  
  # Check for stale remote branches
  git remote prune origin >/dev/null 2>&1
  cleaned_items=$(echo "$cleaned_items" | jq '. + ["Pruned stale remote references"]')
  
  # Git garbage collection
  git gc --quiet >/dev/null 2>&1
  cleaned_items=$(echo "$cleaned_items" | jq '. + ["Performed garbage collection"]')
  
  cat << EOF
{
  "success": true,
  "result": {
    "cleanup_actions": $cleaned_items,
    "suggestions": [
      "Review merged branches before deletion",
      "Consider squashing feature branch commits",
      "Archive old branches instead of deleting",
      "Use git reflog to recover if needed"
    ]
  }
}
EOF
}

perform_interactive_rebase() {
  local target_branch="$1"
  
  # Get commits that would be affected
  local commits_to_rebase=$(git log --oneline HEAD..."$target_branch" --format='{"hash": "%h", "message": "%s"}' | jq -s .)
  local commit_count=$(git rev-list --count HEAD..."$target_branch")
  
  cat << EOF
{
  "success": true,
  "result": {
    "target_branch": "$target_branch",
    "commits_to_rebase": $commits_to_rebase,
    "commit_count": $commit_count,
    "rebase_command": "git rebase -i $target_branch",
    "rebase_options": [
      "pick - use the commit as-is",
      "reword - change the commit message",
      "edit - stop for amending",
      "squash - combine with previous commit",
      "fixup - like squash but discard message",
      "drop - remove the commit"
    ]
  }
}
EOF
}

perform_conflict_check() {
  local target_branch="$1"
  
  # Check for potential conflicts without actually merging
  local merge_base=$(git merge-base HEAD "$target_branch")
  local conflicting_files=()
  
  # Get files changed in both branches since merge base
  local our_files=$(git diff --name-only "$merge_base"..HEAD)
  local their_files=$(git diff --name-only "$merge_base".."$target_branch")
  
  # Find common files (potential conflicts)
  while IFS= read -r file; do
    if echo "$their_files" | grep -q "^$file$"; then
      conflicting_files+=("$file")
    fi
  done <<< "$our_files"
  
  # Convert to JSON with error handling
  if [[ ${#conflicting_files[@]} -eq 0 ]]; then
    local conflicts_json="[]"
  else
    local conflicts_json=$(printf '%s\n' "${conflicting_files[@]}" | jq -R . | jq -s . 2>/dev/null)
    if [[ $? -ne 0 ]]; then conflicts_json="[]"; fi
  fi
  
  cat << EOF
{
  "success": true,
  "result": {
    "target_branch": "$target_branch",
    "merge_base": "$merge_base",
    "potential_conflicts": $conflicts_json,
    "conflict_probability": "$([ ${#conflicting_files[@]} -gt 0 ] && echo "high" || echo "low")",
    "recommendations": [
      "Review conflicting files before merge",
      "Consider rebasing feature branch",
      "Test merge in separate branch first",
      "Coordinate with other developers"
    ]
  }
}
EOF
}

# Default help message
echo '{"success": false, "error": "Git Helper Tool - Use with MCP server parameters. Available actions: status, commit, branch, log, diff, stats, cleanup, interactive-rebase, conflict-check"}'
exit 1