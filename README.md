# Auto Release Workflow

A language-agnostic GitHub Actions workflow for automated releases with semantic versioning based on PR labels and organized changelog generation.

## Features

- 🏷️ **Label-based version bumping**: Use `major`, `minor`, or `patch` labels on PRs
- 📝 **Automatic changelog generation**: Creates organized changelogs with PR details and commits
- 🔄 **Language agnostic**: Works with any project that has a JSON file with a `version` property
- ⚡ **No external dependencies**: Pure GitHub Actions and shell scripts
- 📦 **Flexible configuration**: Supports custom version files beyond `package.json`
- 🎯 **Conventional Commits friendly**: Works well with conventional commit messages

## Quick Start

### 1. Copy the workflow file

Copy `.github/workflows/auto-release.yml` to your repository's `.github/workflows/` directory.

### 2. Ensure you have a version file

The workflow expects a JSON file with a `version` property. Examples:

**package.json** (Node.js projects):
```json
{
  "name": "my-project",
  "version": "1.0.0",
  "description": "My awesome project"
}
```

**version.json** (Generic projects):
```json
{
  "version": "1.0.0",
  "name": "my-project"
}
```

### 3. Configure version file (optional)

By default, the workflow uses `package.json`. To use a different file, set the `VERSION_FILE` environment variable in your workflow:

```yaml
env:
  VERSION_FILE: version.json
```

### 4. Set up PR labels

Create these labels in your GitHub repository:
- `major` - For breaking changes (1.0.0 → 2.0.0)
- `minor` - For new features (1.0.0 → 1.1.0)  
- `patch` - For bug fixes (1.0.0 → 1.0.1)

### 5. Create your first release

1. Create a PR with your changes
2. Add a version label (`major`, `minor`, or `patch`)
3. Merge the PR to `main` or `master`
4. The workflow will automatically:
   - Bump the version in your version file
   - Update the changelog
   - Create a GitHub release
   - Commit the changes back to main

## How It Works

### Trigger
The workflow triggers when a PR is merged to the main branch (`main` or `master`).

### Version Bumping
The workflow reads the PR labels to determine the version bump:
- `major` label → major version bump (breaking changes)
- `minor` label → minor version bump (new features)
- `patch` label → patch version bump (bug fixes)
- No label → defaults to patch bump

### Changelog Generation
The workflow generates a structured changelog entry including:
- Version and date
- PR title, number, and author
- All commits from the squashed/merged PR
- Link to the original PR

### Release Creation
A GitHub release is created with:
- Tag in format `vX.Y.Z`
- Release title `Release vX.Y.Z`
- Release notes from the changelog entry

## Workflow Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VERSION_FILE` | `package.json` | Path to the JSON file containing the version |

### Required Permissions

The workflow needs these permissions:
```yaml
permissions:
  contents: write       # To push version updates and create releases
  pull-requests: read   # To read PR information
  issues: read         # To read PR labels
```

### Secrets

The workflow uses the default `GITHUB_TOKEN` which is automatically provided by GitHub Actions.

## Advanced Usage

### Custom Version File

To use a custom version file, set the environment variable:

```yaml
env:
  VERSION_FILE: config/version.json
```

### Multiple Projects (Monorepo)

For monorepos, you can create separate workflows for different packages:

```yaml
name: Auto Release - Package A
on:
  pull_request:
    types: [closed]
    branches: [main]
    paths: ['packages/package-a/**']

env:
  VERSION_FILE: packages/package-a/package.json
```

### Custom Changelog Location

Set a custom changelog file location:

```yaml
env:
  CHANGELOG_FILE: docs/CHANGELOG.md
```

## Manual Scripts

The repository includes utility scripts for manual version management:

### Version Management

```bash
# Get current version
./.git/scripts/version.sh get

# Bump version
./.git/scripts/version.sh bump patch
./.git/scripts/version.sh bump minor  
./.git/scripts/version.sh bump major

# Set specific version
./.git/scripts/version.sh set 2.1.0

# Use custom version file
./.git/scripts/version.sh get version.json
```

### Changelog Generation

```bash
# Generate changelog entry
./.git/scripts/changelog.sh "1.2.3" "42" "Add new feature" "username" "https://github.com/user/repo/pull/42"
```

## Examples

See the `.git/examples/` directory for:
- `package.json` - Node.js project example
- `version.json` - Generic project example  
- `CHANGELOG.md` - Example changelog format

## Best Practices

### PR Labels
- Always add a version label to your PRs
- Use `major` sparingly for breaking changes
- Use `minor` for new features
- Use `patch` for bug fixes and minor improvements

### Commit Messages
- Use conventional commit format for better changelog readability
- Write clear, descriptive commit messages
- Squash commits when merging PRs for cleaner changelog

### Release Notes
- The workflow automatically includes PR title and commits
- Write descriptive PR titles as they appear in the changelog
- Consider adding PR descriptions for more context

## Troubleshooting

### Common Issues

**Workflow doesn't trigger:**
- Ensure the workflow file is in `.github/workflows/`
- Check that the PR was merged (not just closed)
- Verify the target branch is `main` or `master`

**Version file not found:**
- Check the `VERSION_FILE` environment variable
- Ensure the file exists and contains a `version` property
- Verify the file is valid JSON

**Permission errors:**
- Check that the workflow has the required permissions
- Ensure `GITHUB_TOKEN` has write access to the repository

**No version label found:**
- The workflow defaults to `patch` if no label is found
- Add the appropriate label (`major`, `minor`, `patch`) to your PR

### Debug Mode

To enable debug output, add this to your workflow:

```yaml
env:
  ACTIONS_STEP_DEBUG: true
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add appropriate labels to your PR
4. Follow conventional commit messages
5. Update documentation as needed

## License

MIT License - see LICENSE file for details.
