#!/bin/bash

# Function to add dynamic export to a file
add_dynamic_export() {
  local file=$1
  
  # Check if file exists
  if [ ! -f "$file" ]; then
    echo "File not found: $file"
    return
  fi
  
  # Check if file already has dynamic export
  if grep -q "export const dynamic = 'force-dynamic'" "$file"; then
    echo "File already has dynamic export: $file"
    return
  fi
  
  # Add dynamic export at the beginning of the file
  echo "Adding dynamic export to: $file"
  sed -i.bak '1s/^/export const dynamic = '"'"'force-dynamic'"'"';\n\n/' "$file"
  rm -f "${file}.bak"
}

# Paths that had dynamic server usage errors
declare -a paths=(
  "src/app/routes/dashboard/rentals/page.tsx"
  "src/app/routes/admin/payments/page.tsx"
  "src/app/routes/admin/page.tsx"
  "src/app/routes/admin/reports/page.tsx"
  "src/app/routes/equipment/new/page.tsx"
  "src/app/api/stripe/create-connect-account/route.js"
)

# Fix each file
for path in "${paths[@]}"; do
  add_dynamic_export "$path"
done

echo "Dynamic server usage fix completed!" 