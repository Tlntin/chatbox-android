#!/bin/bash

# Specify the path to your .icns file
icns_file="../Square1024x1024Logo.png"

echo for Uubuntu, "sudo apt-get install imagemagick"


# Loop through all PNG files in the current directory and its subdirectories
find . -name "*.png" -type f | while read png_file; do

  # Get the pixel size of the PNG file
  pixels=$(identify -format "%w" "$png_file")
  echo "pixels is: ${pixels}"

  # Convert the PNG file to the same pixel size and overwrite the original file
  echo convert "$icns_file" -resize "$pixels" "$png_file"
  convert "$icns_file" -resize "$pixels" "$png_file"

done
