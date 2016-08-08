#!/bin/bash

changelog='CHANGELOG.md'

if [ ! -z $1 ] || [ ! -z $2 ]
then
  currenttag=$2
  lasttag=$1
else
  currenttag=$(git describe --tags --abbrev=0)
  lasttag=$(git describe --tags --abbrev=0 ${currenttag}^)
fi

changes=$(git log --no-walk ${lasttag}...${currenttag} --pretty=format:"* %s ([%an](http://github.com/%an))" | awk '!(/Bump/ || /Merge/ || /Build/ || /Release/ || /#nochangelog/)')

echo "----> Appending changes since ${lasttag} to the changelog."

echo -e "###${currenttag}\n___\n\n${changes}\n\n$(cat ${changelog})" > ${changelog}

echo "----> Done."
