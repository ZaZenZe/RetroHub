# Branching Strategy

## Branch roles
- **prod**: Production-ready. Only fast-forward or squash merges from `dev` via reviewed PRs.
- **dev**: Integration branch. All feature work merges here after review.
- **feature/***: Short-lived branches for new work. Branch off `dev`; merge back to `dev` via PR.

## Commands
### Create a feature branch
```bash
git checkout dev
git pull
git checkout -b feature/<feature-name>
```

### Update feature with latest dev
```bash
git checkout feature/<feature-name>
git pull --rebase origin dev
```

### Merge feature into dev
```bash
git checkout dev
git pull
git merge --no-ff feature/<feature-name>
git push origin dev
```

### Promote dev to prod (release)
```bash
git checkout prod
git pull
git merge --no-ff dev
git push origin prod
```

## Notes
- Prefer small, single-purpose feature branches.
- Rebase locally to keep feature branches current; avoid rebasing shared branches.
- Delete merged feature branches in the remote to keep the repo tidy.
