#!/bin/bash

# MCP Tool: datetime
# Description: A tool for various date and time operations

# Function to display help/metadata
show_metadata() {
  cat << EOF
{
  "name": "datetime",
  "description": "Performs date and time operations",
  "parameters": {
    "operation": {
      "type": "string",
      "enum": ["now", "format", "add", "diff", "timezone"],
      "description": "The date/time operation to perform"
    },
    "format": {
      "type": "string",
      "description": "Date format string (e.g., '%Y-%m-%d', '%H:%M:%S')",
      "required": false
    },
    "date": {
      "type": "string",
      "description": "Date string (for operations that require a date)",
      "required": false
    },
    "units": {
      "type": "string",
      "enum": ["seconds", "minutes", "hours", "days", "weeks", "months", "years"],
      "description": "Time units for add/diff operations",
      "required": false
    },
    "value": {
      "type": "number",
      "description": "Numeric value for add operations",
      "required": false
    },
    "timezone": {
      "type": "string",
      "description": "Timezone name (e.g., 'UTC', 'America/New_York')",
      "required": false
    }
  }
}
EOF
  exit 0
}

# Function to display error
show_error() {
  echo "{\"error\": \"$1\"}"
  exit 1
}

# Parse command line arguments
if [[ "$1" == "--mcp-metadata" ]]; then
  show_metadata
elif [[ "$1" == "--mcp-execute" ]]; then
  if [[ -z "$2" ]]; then
    show_error "No parameters provided"
  fi
  
  # Parse JSON argument
  PARAMS="$2"
  
  # Extract operation
  OPERATION=$(echo "$PARAMS" | grep -o '"operation":"[^"]*"' | cut -d'"' -f4)
  
  if [[ -z "$OPERATION" ]]; then
    show_error "Operation parameter is required"
  fi
  
  case "$OPERATION" in
    "now")
      # Get current date/time
      FORMAT=$(echo "$PARAMS" | grep -o '"format":"[^"]*"' | cut -d'"' -f4)
      if [[ -z "$FORMAT" ]]; then
        FORMAT="%Y-%m-%d %H:%M:%S"
      fi
      
      RESULT=$(date +"$FORMAT")
      echo "{\"result\": \"$RESULT\"}"
      ;;
      
    "format")
      # Format a date string
      DATE=$(echo "$PARAMS" | grep -o '"date":"[^"]*"' | cut -d'"' -f4)
      FORMAT=$(echo "$PARAMS" | grep -o '"format":"[^"]*"' | cut -d'"' -f4)
      
      if [[ -z "$DATE" ]]; then
        show_error "Date parameter is required for format operation"
      fi
      
      if [[ -z "$FORMAT" ]]; then
        FORMAT="%Y-%m-%d %H:%M:%S"
      fi
      
      RESULT=$(date -d "$DATE" +"$FORMAT" 2>/dev/null)
      
      if [[ $? -ne 0 ]]; then
        show_error "Invalid date format"
      fi
      
      echo "{\"result\": \"$RESULT\"}"
      ;;
      
    "timezone")
      # Show time in specified timezone
      TIMEZONE=$(echo "$PARAMS" | grep -o '"timezone":"[^"]*"' | cut -d'"' -f4)
      FORMAT=$(echo "$PARAMS" | grep -o '"format":"[^"]*"' | cut -d'"' -f4)
      
      if [[ -z "$TIMEZONE" ]]; then
        show_error "Timezone parameter is required for timezone operation"
      fi
      
      if [[ -z "$FORMAT" ]]; then
        FORMAT="%Y-%m-%d %H:%M:%S"
      fi
      
      RESULT=$(TZ="$TIMEZONE" date +"$FORMAT" 2>/dev/null)
      
      if [[ $? -ne 0 ]]; then
        show_error "Invalid timezone"
      fi
      
      echo "{\"timezone\": \"$TIMEZONE\", \"time\": \"$RESULT\"}"
      ;;
      
    "add")
      # Add time to a date
      DATE=$(echo "$PARAMS" | grep -o '"date":"[^"]*"' | cut -d'"' -f4)
      UNITS=$(echo "$PARAMS" | grep -o '"units":"[^"]*"' | cut -d'"' -f4)
      VALUE=$(echo "$PARAMS" | grep -o '"value":[0-9]*' | cut -d':' -f2)
      FORMAT=$(echo "$PARAMS" | grep -o '"format":"[^"]*"' | cut -d'"' -f4)
      
      if [[ -z "$DATE" ]]; then
        DATE="now"
      fi
      
      if [[ -z "$UNITS" || -z "$VALUE" ]]; then
        show_error "Units and value parameters are required for add operation"
      fi
      
      if [[ -z "$FORMAT" ]]; then
        FORMAT="%Y-%m-%d %H:%M:%S"
      fi
      
      # Convert units to date command format
      case "$UNITS" in
        "seconds")
          DATE_ARG="$DATE + $VALUE seconds"
          ;;
        "minutes")
          DATE_ARG="$DATE + $VALUE minutes"
          ;;
        "hours")
          DATE_ARG="$DATE + $VALUE hours"
          ;;
        "days")
          DATE_ARG="$DATE + $VALUE days"
          ;;
        "weeks")
          DATE_ARG="$DATE + $VALUE weeks"
          ;;
        "months")
          DATE_ARG="$DATE + $VALUE months"
          ;;
        "years")
          DATE_ARG="$DATE + $VALUE years"
          ;;
        *)
          show_error "Invalid units: $UNITS"
          ;;
      esac
      
      RESULT=$(date -d "$DATE_ARG" +"$FORMAT" 2>/dev/null)
      
      if [[ $? -ne 0 ]]; then
        show_error "Invalid date format or calculation"
      fi
      
      echo "{\"original\": \"$DATE\", \"operation\": \"add $VALUE $UNITS\", \"result\": \"$RESULT\"}"
      ;;
      
    "diff")
      # Calculate difference between two dates
      DATE=$(echo "$PARAMS" | grep -o '"date":"[^"]*"' | cut -d'"' -f4)
      END_DATE=$(date +"%Y-%m-%d %H:%M:%S")
      UNITS=$(echo "$PARAMS" | grep -o '"units":"[^"]*"' | cut -d'"' -f4)
      
      if [[ -z "$DATE" ]]; then
        show_error "Date parameter is required for diff operation"
      fi
      
      if [[ -z "$UNITS" ]]; then
        UNITS="seconds"
      fi
      
      # Convert to seconds since epoch
      DATE_EPOCH=$(date -d "$DATE" +%s 2>/dev/null)
      
      if [[ $? -ne 0 ]]; then
        show_error "Invalid date format"
      fi
      
      END_EPOCH=$(date +%s)
      
      # Calculate difference in seconds
      DIFF_SECONDS=$((END_EPOCH - DATE_EPOCH))
      
      # Convert to requested units
      case "$UNITS" in
        "seconds")
          DIFF=$DIFF_SECONDS
          ;;
        "minutes")
          DIFF=$((DIFF_SECONDS / 60))
          ;;
        "hours")
          DIFF=$((DIFF_SECONDS / 3600))
          ;;
        "days")
          DIFF=$((DIFF_SECONDS / 86400))
          ;;
        "weeks")
          DIFF=$((DIFF_SECONDS / 604800))
          ;;
        *)
          show_error "Invalid units for diff: $UNITS (use seconds, minutes, hours, days, or weeks)"
          ;;
      esac
      
      echo "{\"from\": \"$DATE\", \"to\": \"$END_DATE\", \"difference\": $DIFF, \"units\": \"$UNITS\"}"
      ;;
      
    *)
      show_error "Unsupported operation: $OPERATION"
      ;;
  esac
else
  echo "This is an MCP tool script. Run with --mcp-metadata for information."
  exit 1
fi