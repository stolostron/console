#!/usr/bin/env bash
watch="--watchAll=false"
params=""

for arg in "$@" 
do
    if [ $arg = "--watch" ]
    then
        watch="--watchAll=true"
    else
        params="$params $arg"
    fi
done

echo ./node_modules/.bin/react-scripts test $watch $params
./node_modules/.bin/react-scripts test $watch $params
