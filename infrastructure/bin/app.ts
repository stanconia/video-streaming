#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { BackendStack } from '../lib/stacks/backend-stack';
import { MediaStack } from '../lib/stacks/media-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { AuthStack } from '../lib/stacks/auth-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
};

// Application configuration
const config = {
  appName: 'EduLive',
  environment: app.node.tryGetContext('environment') || 'dev',
  domainName: app.node.tryGetContext('domainName') || undefined,
};

// Tags applied to all resources
const tags = {
  Application: config.appName,
  Environment: config.environment,
  ManagedBy: 'CDK',
};

// 1. Network Stack - VPC, Subnets, Security Groups
const networkStack = new NetworkStack(app, `${config.appName}NetworkStack`, {
  env,
  appName: config.appName,
  environment: config.environment,
  description: 'EduLive Network Infrastructure - VPC, Subnets, Security Groups',
});

// 2. Auth Stack - Cognito User Pool
const authStack = new AuthStack(app, `${config.appName}AuthStack`, {
  env,
  appName: config.appName,
  environment: config.environment,
  description: 'EduLive Authentication - Cognito User Pool',
});

// 3. Database Stack - RDS, ElastiCache
const databaseStack = new DatabaseStack(app, `${config.appName}DatabaseStack`, {
  env,
  appName: config.appName,
  environment: config.environment,
  vpc: networkStack.vpc,
  securityGroup: networkStack.databaseSecurityGroup,
  description: 'EduLive Database Infrastructure - RDS PostgreSQL, ElastiCache Redis',
});
databaseStack.addDependency(networkStack);

// 4. Backend Stack - ECS Fargate, API Gateway, Lambda
const backendStack = new BackendStack(app, `${config.appName}BackendStack`, {
  env,
  appName: config.appName,
  environment: config.environment,
  vpc: networkStack.vpc,
  database: databaseStack.database,
  cache: databaseStack.cache,
  userPool: authStack.userPool,
  description: 'EduLive Backend Services - ECS Fargate, API Gateway',
});
backendStack.addDependency(networkStack);
backendStack.addDependency(databaseStack);
backendStack.addDependency(authStack);

// 5. Media Stack - IVS, MediaConvert, S3 for recordings
const mediaStack = new MediaStack(app, `${config.appName}MediaStack`, {
  env,
  appName: config.appName,
  environment: config.environment,
  vpc: networkStack.vpc,
  securityGroup: networkStack.mediaSecurityGroup,
  description: 'EduLive Media Services - IVS Live Streaming, MediaConvert',
});
mediaStack.addDependency(networkStack);

// 6. Frontend Stack - S3, CloudFront
const frontendStack = new FrontendStack(app, `${config.appName}FrontendStack`, {
  env,
  appName: config.appName,
  environment: config.environment,
  domainName: config.domainName,
  backendUrl: backendStack.apiUrl,
  backendDnsName: backendStack.service.loadBalancer.loadBalancerDnsName,
  userPoolId: authStack.userPool.userPoolId,
  userPoolClientId: authStack.userPoolClient.userPoolClientId,
  description: 'EduLive Frontend - S3, CloudFront CDN',
});
frontendStack.addDependency(backendStack);
frontendStack.addDependency(authStack);

// Apply tags to all stacks
Object.entries(tags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

app.synth();
