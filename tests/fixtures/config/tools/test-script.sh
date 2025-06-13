#!/bin/bash

# Test script tool for MCP server testing
# This is a simple test tool that provides date and time information

# Function to display metadata
if [[ "$1" == "--mcp-metadata" ]]; then
  cat << EOF
{
  "name": "dateinfo",
  "description": "A test tool that provides date and time information",
  "parameters": {
    "format": {
      "type": "string",
      "description": "The date format to use",
      "enum": ["short", "long", "iso", "unix"],
      "required": false
    },
    "timezone": {
      "type": "string",
      "description": "The timezone to use (if supported by the system)",
      "required": false
    }
  }
}
EOF
  exit 0
fi

# Function to execute the tool
if [[ "$1" == "--mcp-execute" ]]; then
  if [[ -z "$2" ]]; then
    echo "{\"error\": \"No parameters provided\"}"
    exit 1
  fi
  
  # Parse JSON argument
  PARAMS="$2"
  
  # Extract format parameter
  FORMAT=$(echo "$PARAMS" | grep -o '"format":"[^"]*"' | cut -d'"' -f4)
  TIMEZONE=$(echo "$PARAMS" | grep -o '"timezone":"[^"]*"' | cut -d'"' -f4)
  
  # Default format
  if [[ -z "$FORMAT" ]]; then
    FORMAT="short"
  fi
  
  # Set timezone if provided
  if [[ ! -z "$TIMEZONE" ]]; then
    export TZ="$TIMEZONE"
  fi
  
  # Get current date/time in requested format
  case "$FORMAT" in
    "short")
      DATE=$(date "+%Y-%m-%d")
      TIME=$(date "+%H:%M:%S")
      echo "{\"date\": \"$DATE\", \"time\": \"$TIME\"}"
      ;;
    "long")
      FULL_DATE=$(date "+%A, %B %d, %Y")
      FULL_TIME=$(date "+%I:%M:%S %p %Z")
      echo "{\"full_date\": \"$FULL_DATE\", \"full_time\": \"$FULL_TIME\"}"
      ;;
    "iso")
      ISO_DATE=$(date -Iseconds)
      echo "{\"iso_date\": \"$ISO_DATE\"}"
      ;;
    "unix")
      UNIX_TIME=$(date +%s)
      echo "{\"unix_timestamp\": $UNIX_TIME}"
      ;;
    *)
      echo "{\"error\": \"Unknown format: $FORMAT\"}"
      exit 1
      ;;
  esac
  
  exit 0
fi

echo "This is an MCP tool script. Run with --mcp-metadata for information."
exit 1