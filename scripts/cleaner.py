import csv
import re

input_file = "output_table.csv"
output_file = "hero_stats.csv"

# Pattern to find any percentage number (e.g., 0.46% or 54%)
pct_pattern = r"\d+(?:\.\d+)?%"

cleaned_data = []

try:
    with open(input_file, mode="r", encoding="utf-8") as infile:
        for line in infile:
            line = line.strip().strip('"')

            # 1. Enforce your condition: must have exactly 3 percent symbols
            if line.count("%") == 3:
                # Find all percentages in the line sequentially
                percentages = re.findall(pct_pattern, line)

                if len(percentages) >= 2:
                    pick_rate = percentages[0]
                    win_rate = percentages[1]

                    # 2. Split the line at the first percentage (pick rate)
                    # everything to the left is text before the pick rate
                    left_side = line.split(pick_rate)[0].strip()

                    # 3. The string immediately before it is the last word block
                    words_before = left_side.split()
                    if words_before:
                        hero_name = words_before[-1]

                        # Clean up any residual punctuation clinging to the name (like dots or commas)
                        hero_name = re.sub(r"[^\w\s-]", "", hero_name)

                        cleaned_data.append([hero_name, pick_rate, win_rate])

    # Save to CSV
    with open(output_file, mode="w", newline="", encoding="utf-8") as outfile:
        writer = csv.writer(outfile)
        writer.writerow(["hero", "pick rate", "winrate"])
        writer.writerows(cleaned_data)

    print(
        f"Success! Safely processed {len(cleaned_data)} heroes into '{output_file}'"
    )

except FileNotFoundError:
    print(f"Error: Could not find '{input_file}'.")