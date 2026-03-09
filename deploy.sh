#!/bin/bash
set -e

# Configuration
AWS_ACCOUNT_ID="214102106723"
AWS_REGION="us-east-1"
APP_NAME="edulive"
ENVIRONMENT="dev"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
BACKEND_IMAGE="${ECR_REGISTRY}/${APP_NAME}-${ENVIRONMENT}-api:latest"
MEDIA_SERVER_IMAGE="${ECR_REGISTRY}/${APP_NAME}-${ENVIRONMENT}-media-server:latest"
ECS_CLUSTER="EduLive-${ENVIRONMENT}-cluster"
ECS_SERVICE="EduLive-${ENVIRONMENT}-backend"
S3_BUCKET="${APP_NAME}-${ENVIRONMENT}-frontend-${AWS_ACCOUNT_ID}"
CLOUDFRONT_DISTRIBUTION_ID="E3KO6H4L3WCITY"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Parse arguments
SKIP_INFRA=false
SKIP_BACKEND=false
SKIP_FRONTEND=false
SKIP_MEDIA=false

for arg in "$@"; do
  case $arg in
    --skip-infra)    SKIP_INFRA=true ;;
    --skip-backend)  SKIP_BACKEND=true ;;
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-media)    SKIP_MEDIA=true ;;
    --help)
      echo "Usage: ./deploy.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-infra      Skip CDK infrastructure deployment"
      echo "  --skip-backend    Skip backend Docker build and push"
      echo "  --skip-frontend   Skip frontend build and S3 upload"
      echo "  --skip-media      Skip media server Docker build and push"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *) error "Unknown option: $arg. Use --help for usage." ;;
  esac
done

# Prerequisites check
log "Checking prerequisites..."
command -v aws >/dev/null 2>&1    || error "AWS CLI not installed"
command -v docker >/dev/null 2>&1 || error "Docker not installed"
command -v node >/dev/null 2>&1   || error "Node.js not installed"
docker info >/dev/null 2>&1       || error "Docker daemon not running"
aws sts get-caller-identity >/dev/null 2>&1 || error "AWS credentials not configured"
log "Prerequisites OK"

# Step 1: Authenticate Docker to ECR
log "Authenticating Docker to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}" \
  || error "ECR login failed"

# Step 2: Build and push backend image
if [ "$SKIP_BACKEND" = false ]; then
  log "Building backend Docker image..."
  docker build --platform linux/amd64 \
    -t "${BACKEND_IMAGE}" \
    "${PROJECT_DIR}/backend"
  log "Pushing backend image to ECR..."
  docker push "${BACKEND_IMAGE}"
  log "Backend image pushed"
else
  warn "Skipping backend build"
fi

# Step 3: Build and push media server image
if [ "$SKIP_MEDIA" = false ]; then
  log "Building media server Docker image..."
  docker build --platform linux/amd64 \
    -t "${MEDIA_SERVER_IMAGE}" \
    "${PROJECT_DIR}/media-server"
  log "Pushing media server image to ECR..."
  docker push "${MEDIA_SERVER_IMAGE}"
  log "Media server image pushed"
else
  warn "Skipping media server build"
fi

# Step 4: Build frontend
if [ "$SKIP_FRONTEND" = false ]; then
  log "Building frontend..."
  cd "${PROJECT_DIR}/frontend"
  npm run build
  cd "${PROJECT_DIR}"
  log "Frontend build complete"
else
  warn "Skipping frontend build"
fi

# Step 5: Deploy CDK stacks
if [ "$SKIP_INFRA" = false ]; then
  log "Deploying CDK stacks..."
  cd "${PROJECT_DIR}/infrastructure"
  npx cdk deploy --all --require-approval never
  cd "${PROJECT_DIR}"
  log "CDK deployment complete"
else
  warn "Skipping infrastructure deployment"
fi

# Step 6: Upload frontend to S3
if [ "$SKIP_FRONTEND" = false ]; then
  log "Uploading frontend to S3..."
  aws s3 sync "${PROJECT_DIR}/frontend/build" "s3://${S3_BUCKET}" --delete
  log "Frontend uploaded"

  log "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "/*" > /dev/null
  log "CloudFront invalidation started"
fi

# Step 7: Force ECS redeployment
if [ "$SKIP_BACKEND" = false ] || [ "$SKIP_MEDIA" = false ]; then
  log "Forcing ECS service redeployment..."
  aws ecs update-service \
    --cluster "${ECS_CLUSTER}" \
    --service "${ECS_SERVICE}" \
    --force-new-deployment \
    --region "${AWS_REGION}" > /dev/null
  log "ECS redeployment triggered"
fi

echo ""
log "Deployment complete!"
echo ""
echo "  Frontend:    https://d2mv0p0scx4qgr.cloudfront.net"
echo "  API Gateway: https://f4g42xym3i.execute-api.us-east-1.amazonaws.com/dev/"
echo "  ALB:         http://EduLiv-Backe-TmYqrx0oOOdb-1671434199.us-east-1.elb.amazonaws.com"
echo ""
