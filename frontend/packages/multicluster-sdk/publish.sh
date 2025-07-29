#!/bin/bash

# Manual publish script for @stolostron/multicluster-sdk
# This script handles version bumping, building, and publishing to npm

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q "@stolostron/multicluster-sdk" package.json; then
    print_error "This script must be run from the multicluster-sdk package directory"
    exit 1
fi

# Check if git is clean
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Git working directory is not clean. Please commit or stash your changes."
    git status --short
    echo
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_info "Current version: $CURRENT_VERSION"

echo
echo "Version increment options:"
echo "1) patch (bug fixes)"
echo "2) minor (new features)"
echo "3) major (breaking changes)"
echo "4) custom version"

read -p "Select version increment (1-4): " -n 1 -r CHOICE
echo

VERSION_TYPE=""
CUSTOM_VERSION=""

case $CHOICE in
    1)
        VERSION_TYPE="patch"
        ;;
    2)
        VERSION_TYPE="minor"
        ;;
    3)
        VERSION_TYPE="major"
        ;;
    4)
        read -p "Enter custom version (e.g., 1.2.3): " CUSTOM_VERSION
        if [[ ! $CUSTOM_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            print_error "Invalid version format. Please use semantic versioning (x.y.z)"
            exit 1
        fi
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

# Update version
print_info "Updating package version..."
if [ -n "$VERSION_TYPE" ]; then
    NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
else
    npm version $CUSTOM_VERSION --no-git-tag-version
    NEW_VERSION="v$CUSTOM_VERSION"
fi

print_success "Version updated to: $NEW_VERSION"

# Run tests
print_info "Running tests..."
npm run test

# Run linting
print_info "Running linter..."
npm run lint

# Build the package
print_info "Building package..."
npm run build

# Dry run first
print_info "Running npm publish dry run..."
npm publish --dry-run

echo
print_warning "This will publish $NEW_VERSION to npm registry"
read -p "Continue with actual publish? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Publish cancelled. Reverting version change..."
    git checkout package.json
    exit 1
fi

# Actual publish
print_info "Publishing to npm..."
npm publish

print_success "Successfully published $NEW_VERSION to npm!"

# Create git tag and commit
print_info "Creating git tag and commit..."
git add package.json
git commit -m "Release multicluster-sdk $NEW_VERSION [skip ci]"
git tag "multicluster-sdk-$NEW_VERSION"

print_success "Git tag multicluster-sdk-$NEW_VERSION created"

echo
print_info "Don't forget to push the changes and tags:"
print_info "  git push origin main"
print_info "  git push origin multicluster-sdk-$NEW_VERSION"

print_success "Publish complete! 🎉"