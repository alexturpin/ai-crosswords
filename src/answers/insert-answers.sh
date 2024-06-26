#!/bin/sh

mkdir -p src/answers/tmp

# Split the SQL file into chunks of 1000 lines each
split -l 1000 src/answers/answers.sql src/answers/tmp/chunk_

# Get the total number of chunks
total_chunks=$(ls src/answers/tmp/chunk_* | wc -l | xargs)

# Initialize a counter for progress reporting
counter=0

# Process each chunk with wrangler d1 execute
for file in src/answers/tmp/chunk_*; do
  counter=$((counter + 1))
  echo "Processing chunk $counter of $total_chunks: $file"
  wrangler d1 execute dcc --local --file "$file"
done

# Clean up the chunk files after processing
rm -rf src/answers/tmp