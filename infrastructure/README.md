# EduLive Infrastructure

AWS CDK Infrastructure for EduLive - Educational Live Streaming Platform

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    AWS Cloud                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                              FRONTEND LAYER                                   │  │
│  │  ┌─────────────┐      ┌─────────────────┐      ┌─────────────────────────┐  │  │
│  │  │   Route53   │ ───▶ │   CloudFront    │ ───▶ │    S3 (Static Assets)   │  │  │
│  │  │   (DNS)     │      │   (CDN)         │      │    - HTML/CSS/JS        │  │  │
│  │  └─────────────┘      └─────────────────┘      │    - Images             │  │  │
│  │                                                 └─────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                           │
│                                         ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                              AUTH LAYER                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         Cognito User Pool                                │ │  │
│  │  │   - User Authentication (Username/Password)                              │ │  │
│  │  │   - User Groups (Students, Teachers, Admins)                            │ │  │
│  │  │   - Custom Attributes (gradeLevel, subjects, userType)                  │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                           │
│                                         ▼                                           │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                              API LAYER                                        │  │
│  │  ┌─────────────────┐      ┌─────────────────────────────────────────────┐   │  │
│  │  │   API Gateway   │ ───▶ │    Application Load Balancer                │   │  │
│  │  │   (REST API)    │      │                                             │   │  │
│  │  │   + Cognito     │      └─────────────────────────────────────────────┘   │  │
│  │  │     Authorizer  │                        │                                │  │
│  │  └─────────────────┘                        ▼                                │  │
│  │                           ┌─────────────────────────────────────────────┐   │  │
│  │                           │         ECS Fargate Cluster                 │   │  │
│  │                           │  ┌─────────────┐  ┌─────────────┐          │   │  │
│  │                           │  │  Backend    │  │  Backend    │          │   │  │
│  │                           │  │  Service    │  │  Service    │  ...     │   │  │
│  │                           │  │  (Node.js)  │  │  (Node.js)  │          │   │  │
│  │                           │  └─────────────┘  └─────────────┘          │   │  │
│  │                           └─────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                           │
│                    ┌────────────────────┼────────────────────┐                     │
│                    ▼                    ▼                    ▼                     │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐        │
│  │    DATA LAYER       │  │    MEDIA LAYER      │  │   STORAGE LAYER     │        │
│  │                     │  │                     │  │                     │        │
│  │  ┌───────────────┐  │  │  ┌───────────────┐  │  │  ┌───────────────┐  │        │
│  │  │  RDS          │  │  │  │  Amazon IVS   │  │  │  │  S3 Uploads   │  │        │
│  │  │  PostgreSQL   │  │  │  │  (Live Video) │  │  │  │  Bucket       │  │        │
│  │  │               │  │  │  └───────────────┘  │  │  └───────────────┘  │        │
│  │  └───────────────┘  │  │                     │  │                     │        │
│  │                     │  │  ┌───────────────┐  │  │  ┌───────────────┐  │        │
│  │  ┌───────────────┐  │  │  │  S3 + CDN     │  │  │  │  ECR          │  │        │
│  │  │  ElastiCache  │  │  │  │  (Recordings) │  │  │  │  (Container   │  │        │
│  │  │  Redis        │  │  │  └───────────────┘  │  │  │   Images)     │  │        │
│  │  └───────────────┘  │  │                     │  │  └───────────────┘  │        │
│  │                     │  │  ┌───────────────┐  │  │                     │        │
│  │  ┌───────────────┐  │  │  │  DynamoDB     │  │  └─────────────────────┘        │
│  │  │  DynamoDB     │  │  │  │  (Channels)   │  │                                 │
│  │  │  (Sessions)   │  │  │  └───────────────┘  │                                 │
│  │  └───────────────┘  │  │                     │                                 │
│  └─────────────────────┘  └─────────────────────┘                                 │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                              VPC (Network Layer)                              │  │
│  │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │  │
│  │   │ Public Subnet  │  │ Private Subnet │  │ Isolated Subnet│                 │  │
│  │   │ (ALB, NAT GW)  │  │ (ECS Tasks)    │  │ (RDS, Redis)   │                 │  │
│  │   └────────────────┘  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Stacks

| Stack | Description | Resources |
|-------|-------------|-----------|
| **NetworkStack** | VPC and networking | VPC, Subnets, Security Groups, VPC Endpoints |
| **AuthStack** | Authentication | Cognito User Pool, Identity Pool |
| **DatabaseStack** | Data persistence | RDS PostgreSQL, ElastiCache Redis |
| **BackendStack** | API services | ECS Fargate, ALB, API Gateway, ECR |
| **MediaStack** | Live streaming | Amazon IVS, S3 Recordings, CloudFront, DynamoDB |
| **FrontendStack** | Web hosting | S3, CloudFront CDN, Route53 |

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

## Setup

1. **Install dependencies:**
   ```bash
   cd infrastructure
   npm install
   ```

2. **Bootstrap CDK (first time only):**
   ```bash
   npm run bootstrap
   ```

3. **Configure environment:**
   ```bash
   export AWS_ACCOUNT_ID=your-account-id
   export AWS_REGION=us-east-1
   ```

## Deployment

### Deploy all stacks:
```bash
npm run deploy
```

### Deploy individual stacks:
```bash
npm run deploy:network
npm run deploy:database
npm run deploy:backend
npm run deploy:media
npm run deploy:frontend
```

### Deploy to specific environment:
```bash
cdk deploy --all --context environment=prod
```

### Deploy with custom domain:
```bash
cdk deploy --all --context environment=prod --context domainName=edulive.example.com
```

## Stack Outputs

After deployment, the following outputs are available:

### Frontend
- `WebsiteUrl` - URL to access the frontend application
- `DistributionId` - CloudFront distribution ID for cache invalidation
- `WebsiteBucketName` - S3 bucket for frontend deployments

### Backend
- `ApiEndpoint` - API Gateway endpoint URL
- `LoadBalancerDns` - ALB DNS name
- `EcrRepositoryUri` - ECR repository for container images
- `ClusterName` - ECS cluster name

### Media
- `RecordingsBucketName` - S3 bucket for session recordings
- `RecordingsDistributionDomain` - CloudFront CDN for recordings
- `RecordingConfigArn` - IVS recording configuration ARN

### Database
- `DatabaseEndpoint` - RDS PostgreSQL endpoint
- `CacheEndpoint` - ElastiCache Redis endpoint
- `DatabaseSecretArn` - Secrets Manager ARN for DB credentials

### Auth
- `UserPoolId` - Cognito User Pool ID
- `UserPoolClientId` - Cognito User Pool Client ID
- `IdentityPoolId` - Cognito Identity Pool ID

## Deploying Your Application

### Frontend Deployment

After building your frontend application:

```bash
# Build your frontend (e.g., React, Next.js)
npm run build

# Deploy to S3
aws s3 sync ./build s3://edulive-dev-frontend-ACCOUNT_ID --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

### Backend Deployment

Build and push your Docker image:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t edulive-api .

# Tag image
docker tag edulive-api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/edulive-dev-api:latest

# Push image
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/edulive-dev-api:latest

# Update ECS service
aws ecs update-service --cluster EduLive-dev-cluster --service EduLive-dev-backend --force-new-deployment
```

## Environment Variables

The backend service has access to these environment variables:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment (dev/staging/prod) |
| `PORT` | Application port (3000) |
| `AWS_REGION` | AWS region |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `UPLOADS_BUCKET` | S3 bucket for uploads |
| `DB_HOST` | RDS database hostname |
| `DB_PORT` | RDS database port |
| `DB_NAME` | Database name (edulive) |
| `DB_SECRET_ARN` | Secrets Manager ARN for DB credentials |
| `REDIS_HOST` | ElastiCache Redis hostname |
| `REDIS_PORT` | ElastiCache Redis port |

## Security Features

- **VPC Isolation**: Database and cache in isolated subnets
- **Security Groups**: Strict ingress/egress rules
- **Encryption**: S3 SSE, RDS encryption at rest
- **Secrets Management**: Database credentials in AWS Secrets Manager
- **WAF Ready**: API Gateway can be protected with AWS WAF
- **CloudFront Security Headers**: XSS, frame protection, HSTS

## Monitoring

- **CloudWatch Logs**: All services log to CloudWatch
- **Container Insights**: ECS cluster monitoring enabled
- **RDS Performance Insights**: Database performance monitoring (prod)
- **CloudFront Logging**: Access logs for CDN

## Costs Considerations

### Development Environment
- NAT Gateway: 1 instance
- RDS: t4g.micro (free tier eligible)
- ElastiCache: cache.t4g.micro
- ECS: 256 CPU, 512 MB memory

### Production Environment
- NAT Gateway: 2 instances (HA)
- RDS: r6g.large, Multi-AZ
- ElastiCache: cache.r6g.large
- ECS: 1024 CPU, 2048 MB memory, auto-scaling

## Clean Up

```bash
# Destroy all stacks
npm run destroy

# Or destroy specific stack
cdk destroy EduLiveFrontendStack
```

**Warning**: Some resources like S3 buckets with data and RDS instances in production are protected from deletion.

## Troubleshooting

### ECS Service Not Starting
1. Check CloudWatch logs: `/ecs/EduLive-dev/backend`
2. Verify security group allows traffic
3. Check ECR image exists

### Database Connection Issues
1. Verify security group allows PostgreSQL (5432)
2. Check credentials in Secrets Manager
3. Ensure service is in correct subnet

### IVS Stream Not Working
1. Check IVS channel status in console
2. Verify RTMP ingest endpoint
3. Check recording configuration ARN
