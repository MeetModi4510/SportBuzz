$author = "PRANSHU2106"
$email = "pranshu2106@gmail.com"
$dates = @(
  "2026-04-10T14:30:00",
  "2026-03-25T10:15:00",
  "2026-04-05T09:45:00",
  "2026-03-12T16:20:00",
  "2026-02-28T11:00:00",
  "2026-01-15T10:00:00",
  "2026-02-05T14:20:00"
)

foreach ($d in $dates) {
    $env:GIT_AUTHOR_NAME = $author
    $env:GIT_AUTHOR_EMAIL = $email
    $env:GIT_COMMITTER_NAME = $author
    $env:GIT_COMMITTER_EMAIL = $email
    $env:GIT_AUTHOR_DATE = $d
    $env:GIT_COMMITTER_DATE = $d
    
    git commit --allow-empty -m "Refactor UI components by $author"
}
