#!/usr/bin/env bash

set -e
set -o pipefail

# https://docs.github.com/en/actions/reference/environment-variables
if [ "$GITHUB_EVENT_NAME" = "schedule" ] ; then # running in scheduled job
  FLAGS=""

  echo "Doing full link check."
  set -x
elif [ "$CI" = "true" ] ; then # running in PR CI build

  CHANGED_FILES=$(git diff --name-only origin/master... | tr '\n' ' ')
  FLAGS="--no-cache -f $CHANGED_FILES"

  echo "Checking files changed in origin/master...: $CHANGED_FILES"
  set -x
else # running locally
  COMMIT_RANGE=master...
  CHANGED_FILES=$(git diff --name-only $COMMIT_RANGE | tr '\n' ' ')
  FLAGS="-f $CHANGED_FILES"

  echo "Checking files changed in $COMMIT_RANGE: $CHANGED_FILES"
fi

exec mdbook-linkcheck $FLAGS -- $TRAVIS_BUILD_DIR
