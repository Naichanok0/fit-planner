import re

# Read the file
with open('/components/ExerciseLibrary.tsx', 'r') as f:
    content = f.read()

# Replace all occurrences of difficulty: 'beginner', 'intermediate', 'advanced' with 'standard'
content = re.sub(r"difficulty: 'beginner'", "difficulty: 'standard'", content)
content = re.sub(r"difficulty: 'intermediate'", "difficulty: 'standard'", content)
content = re.sub(r"difficulty: 'advanced'", "difficulty: 'standard'", content)

# Write back to file
with open('/components/ExerciseLibrary.tsx', 'w') as f:
    f.write(content)

print("All difficulty values updated to 'standard'")