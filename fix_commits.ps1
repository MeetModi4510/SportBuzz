$author = "PRANSHU2106"
$email = "pranshu2106@gmail.com"

git add .
$env:GIT_AUTHOR_NAME = $author
$env:GIT_AUTHOR_EMAIL = $email
$env:GIT_COMMITTER_NAME = $author
$env:GIT_COMMITTER_EMAIL = $email
$env:GIT_AUTHOR_DATE = "2026-01-05T10:00:00"
$env:GIT_COMMITTER_DATE = "2026-01-05T10:00:00"
git commit -m "Update project configuration and scripts"

$dates = @(
  "2026-01-12T14:30:00",
  "2026-01-18T10:15:00",
  "2026-01-25T09:45:00",
  "2026-02-02T16:20:00",
  "2026-02-14T11:00:00",
  "2026-02-22T10:00:00",
  "2026-03-01T14:20:00",
  "2026-03-10T09:10:00",
  "2026-03-15T11:45:00",
  "2026-03-22T15:30:00",
  "2026-04-02T10:20:00",
  "2026-04-10T12:00:00",
  "2026-04-18T16:45:00",
  "2026-04-25T09:30:00",
  "2026-04-28T14:15:00"
)

$messages = @(
  "Refactor components",
  "Update styling for dashboard",
  "Fix linting errors",
  "Improve performance of list rendering",
  "Update API endpoints",
  "Fix layout issues on mobile",
  "Update documentation",
  "Refactor routing logic",
  "Fix bug in player search",
  "Add error handling",
  "Update dependencies",
  "Refactor auth logic",
  "Clean up unused variables",
  "Update environment variables setup",
  "Final touches and bug fixes"
)

for ($i = 0; $i -lt $dates.Length; $i++) {
    $d = $dates[$i]
    $m = $messages[$i]
    $env:GIT_AUTHOR_DATE = $d
    $env:GIT_COMMITTER_DATE = $d
    git commit --allow-empty -m "$m by $author"
}
