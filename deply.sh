#!/bin/bash
# Create the bare repo and hook on push to main
while read oldrev newrev ref
do
    if [ "$ref" = "refs/heads/main" ]; then
	echo "Push to main detected. Deploying..."
	cd $HOME/repos/hugo-flow
        git pull origin main
        docker compose up -d --build
	docker ps -a
    else
	echo "Push to $ref, not deploying."
    fi
done   
