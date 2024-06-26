BEGIN { FS = "\t" }
NR > 1 {
  gsub(/'/, "''", $2)
  printf "INSERT INTO answers (\"answer\", \"example\", \"rating\") VALUES ('%s', '%s', %d);\n", $1, $2, $3
}
