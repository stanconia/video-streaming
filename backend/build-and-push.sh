#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="214102106723"
ECR_REPO_NAME="edulive-dev-api"
IMAGE_TAG="${1:-latest}"

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"

echo "=== EduLive Backend Docker Build and Push ==="
echo "ECR Repository: ${ECR_URI}"
echo "Image Tag: ${IMAGE_TAG}"
echo "Platform: linux/amd64"
echo ""

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build the Docker image for linux/amd64 platform
echo "Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t ${ECR_REPO_NAME}:${IMAGE_TAG} .

# Tag for ECR
echo "Tagging image for ECR..."
docker tag ${ECR_REPO_NAME}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}

# Push to ECR
echo "Pushing image to ECR..."
docker push ${ECR_URI}:${IMAGE_TAG}

echo ""
echo "=== Build and Push Complete ==="
echo "Image URI: ${ECR_URI}:${IMAGE_TAG}"
echo ""
echo "Now run: cd ../infrastructure && npm run deploy"
