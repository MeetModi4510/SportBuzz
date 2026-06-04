
import os

filepath = r'd:\GATE MEET\SportBuzz\SportBuzz\src\components\admin\TournamentManager.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = 1217
end = 2260
content = "".join(lines[start-1:end])

paren_count = 0
brace_count = 0
for char in content:
    if char == '(': paren_count += 1
    elif char == ')': paren_count -= 1
    elif char == '{': brace_count += 1
    elif char == '}': brace_count -= 1

print(f"Paren count (1217-2260): {paren_count}")
print(f"Brace count (1217-2260): {brace_count}")
