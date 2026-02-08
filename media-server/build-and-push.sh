#!/bin/bash
set -e

AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="214102106723"
ECR_REPO_NAME="edulive-dev-media-server"
IMAGE_TAG="${1:-latest}"
ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "=== EduLive Media Server Docker Build and Push ==="

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

echo "Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t ${ECR_REPO_NAME}:${IMAGE_TAG} .

docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}

echo "Pushing image to ECR..."
docker push ${ECR_URI}:${IMAGE_TAG}

echo "=== Done: ${ECR_URI}:${IMAGE_TAG} ==="
