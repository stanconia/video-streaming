import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface BackendStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  vpc: ec2.IVpc;
  database: rds.IDatabaseInstance;
  cache: elasticache.CfnCacheCluster;
  userPool: cognito.IUserPool;
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly cluster: ecs.ICluster;
  public readonly service: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { appName, environment, vpc, database, cache, userPool } = props;

    // Create security group for backend services within this stack
    const backendSecurityGroup = new ec2.SecurityGroup(this, 'BackendSecurityGroup', {
      vpc,
      securityGroupName: `${appName}-${environment}-backend-service-sg`,
      description: 'Security group for backend ECS services',
      allowAllOutbound: true,
    });

    // Allow HTTP/HTTPS traffic
    backendSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    backendSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );
    backendSecurityGroup.addIngressRule(
      backendSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow internal traffic on app port'
    );
    backendSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udpRange(10000, 10100),
      'Allow WebRTC media UDP traffic'
    );

    // ECR Repository for Backend API (reference existing repository)
    const apiRepository = ecr.Repository.fromRepositoryName(
      this,
      'ApiRepository',
      `${appName.toLowerCase()}-${environment}-api`
    );

    // S3 Bucket for uploads (profile images, session materials, etc.)
    const uploadsBucket = new s3.Bucket(this, 'UploadsBucket', {
      bucketName: `${appName.toLowerCase()}-${environment}-uploads-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `${appName}-${environment}-cluster`,
      vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // CloudWatch Log Group for Backend
    const logGroup = new logs.LogGroup(this, 'BackendLogGroup', {
      logGroupName: `/ecs/${appName}-${environment}/backend`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Execution Role
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: `${appName}-${environment}-ecs-execution-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Task Role (for the application)
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `${appName}-${environment}-ecs-task-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant permissions
    uploadsBucket.grantReadWrite(taskRole);

    // Grant SES permissions for sending emails
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ses:SendEmail',
        'ses:SendRawEmail',
      ],
      resources: ['*'],
    }));

    // Grant S3 ListBuckets (needed by S3Service health check)
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListAllMyBuckets'],
      resources: ['*'],
    }));

    // Grant access to Secrets Manager
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret',
      ],
      resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:${appName}/*`],
    }));

    // Grant access to Cognito
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminCreateUser',
        'cognito-idp:AdminDeleteUser',
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:AdminAddUserToGroup',
        'cognito-idp:AdminRemoveUserFromGroup',
        'cognito-idp:ListUsers',
      ],
      resources: [userPool.userPoolArn],
    }));

    // Grant access to IVS (will be created in media stack)
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ivs:CreateChannel',
        'ivs:DeleteChannel',
        'ivs:GetChannel',
        'ivs:ListChannels',
        'ivs:CreateStreamKey',
        'ivs:DeleteStreamKey',
        'ivs:GetStreamKey',
        'ivs:ListStreamKeys',
        'ivs:GetStream',
        'ivs:ListStreams',
        'ivs:StopStream',
      ],
      resources: ['*'],
    }));

    // Fargate Service with ALB
    const desiredCount = environment === 'prod' ? 2 : 1;
    const cpu = environment === 'prod' ? 4096 : 4096;
    const memoryLimitMiB = environment === 'prod' ? 16384 : 12288;

    this.service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'BackendService', {
      cluster: this.cluster,
      serviceName: `${appName}-${environment}-backend`,
      desiredCount,
      cpu,
      memoryLimitMiB,
      taskImageOptions: {
        // Real Spring Boot backend from ECR
        image: ecs.ContainerImage.fromRegistry('214102106723.dkr.ecr.us-east-1.amazonaws.com/edulive-dev-api:latest'),
        containerName: 'backend',
        containerPort: 8080,
        executionRole,
        taskRole,
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: 'backend',
          logGroup,
        }),
        environment: {
          // Spring Boot configuration
          SPRING_PROFILES_ACTIVE: 'aws',
          PORT: '8080',
          AWS_REGION: this.region,
          COGNITO_USER_POOL_ID: userPool.userPoolId,
          UPLOADS_BUCKET: uploadsBucket.bucketName,
          // Database configuration for PostgreSQL
          DB_URL: `jdbc:postgresql://${database.instanceEndpoint.hostname}:${database.instanceEndpoint.port}/edulive?stringtype=unspecified`,
          DB_DRIVER: 'org.postgresql.Driver',
          DB_USERNAME: 'edulive_admin',
          HIBERNATE_DIALECT: 'org.hibernate.dialect.PostgreSQLDialect',
          JPA_DDL_AUTO: 'update',
          JPA_SHOW_SQL: 'false',
          H2_CONSOLE_ENABLED: 'false',
          // Redis configuration
          REDIS_HOST: cache.attrRedisEndpointAddress,
          REDIS_PORT: cache.attrRedisEndpointPort,
          // Media server (sidecar on localhost)
          MEDIA_SERVER_URL: 'http://localhost:3000',
          // Ollama AI (sidecar on localhost)
          OLLAMA_URL: 'http://localhost:11434',
          OLLAMA_MODEL: 'llama3.1:8b-instruct-q4_0',
          // CORS - allow CloudFront origin
          CORS_ALLOWED_ORIGINS: '*',
          // Stripe
          STRIPE_SECRET_KEY: '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',
          STRIPE_PUBLISHABLE_KEY: 'pk_live_51T3KEGQwkJfNUP75oyn2lQ2lKPYFUGtgeEwFD5tS6fSb41tA5nE6WWPmL5zeM2Xue6SyKwvBG8AHxurh5TtUYVrw00Lot9t2Ij',
          STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
          // JWT
          JWT_SECRET: 'prodSecretKeyThatIsAtLeast256BitsLongForHS256AlgorithmDeployment!',
          // SQL init (runs schema-postgresql.sql to fix constraints)
          SQL_INIT_MODE: 'always',
          SQL_INIT_PLATFORM: 'postgresql',
          DEFER_DS_INIT: 'true',
          // Google OAuth
          GOOGLE_CLIENT_ID: '991479117309-7896ulfi3hl2318ia17lq3007c3e85oj.apps.googleusercontent.com',
          GOOGLE_CLIENT_SECRET: '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',
          // Frontend URL for email links
          APP_FRONTEND_URL: 'https://d2mv0p0scx4qgr.cloudfront.net',
          // SES
          SES_SENDER_EMAIL: 'stanley.opara6@gmail.com',
          // Logging
          LOG_LEVEL: environment === 'prod' ? 'INFO' : 'DEBUG',
        },
        secrets: {
          DB_PASSWORD: ecs.Secret.fromSecretsManager(
            cdk.aws_secretsmanager.Secret.fromSecretNameV2(
              this,
              'DbSecret',
              `${appName}/${environment}/database/credentials`
            ),
            'password'
          ),
        },
      },
      healthCheckGracePeriod: cdk.Duration.seconds(120),
      publicLoadBalancer: true,
      assignPublicIp: true,
      securityGroups: [backendSecurityGroup],
      taskSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      circuitBreaker: {
        rollback: true,
      },
      enableExecuteCommand: true,
    });

    // Increase ephemeral storage for Ollama model (~5GB)
    const cfnTaskDef = this.service.taskDefinition.node.defaultChild as cdk.aws_ecs.CfnTaskDefinition;
    cfnTaskDef.addPropertyOverride('EphemeralStorage', { SizeInGiB: 30 });

    // Add media server sidecar container
    const mediaServerContainer = this.service.taskDefinition.addContainer('media-server', {
      image: ecs.ContainerImage.fromRegistry(
        `214102106723.dkr.ecr.${this.region}.amazonaws.com/edulive-dev-media-server:latest`
      ),
      containerName: 'media-server',
      memoryLimitMiB: 512,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'media-server',
        logGroup,
      }),
      environment: {
        PORT: '3000',
        NODE_ENV: environment,
        ANNOUNCED_IP: 'auto',
      },
      healthCheck: {
        command: ['CMD-SHELL', 'node -e "require(\'http\').get(\'http://localhost:3000/health\', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 3,
        startPeriod: cdk.Duration.seconds(30),
      },
    });
    mediaServerContainer.addPortMappings({ containerPort: 3000 });

    // Add Ollama AI sidecar container
    const ollamaContainer = this.service.taskDefinition.addContainer('ollama', {
      image: ecs.ContainerImage.fromRegistry(
        `214102106723.dkr.ecr.${this.region}.amazonaws.com/edulive-dev-ollama:latest`
      ),
      containerName: 'ollama',
      memoryLimitMiB: 8192,
      cpu: 2048,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ollama',
        logGroup,
      }),
      environment: {
        OLLAMA_HOST: '0.0.0.0:11434',
      },
      healthCheck: {
        command: ['CMD', '/bin/ollama', 'list'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(120),
      },
    });
    ollamaContainer.addPortMappings({ containerPort: 11434 });

    // Configure health check
    this.service.targetGroup.configureHealthCheck({
      path: '/health',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
      timeout: cdk.Duration.seconds(10),
      interval: cdk.Duration.seconds(30),
    });

    // Auto Scaling
    const scaling = this.service.service.autoScaleTaskCount({
      minCapacity: desiredCount,
      maxCapacity: environment === 'prod' ? 10 : 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    // API Gateway for REST API
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${appName}-${environment}-api`,
      description: 'EduLive API Gateway',
      deployOptions: {
        stageName: environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 1000,
        throttlingRateLimit: 500,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      authorizerName: `${appName}-${environment}-cognito-authorizer`,
      cognitoUserPools: [userPool],
    });

    // Proxy integration to ALB for authenticated routes
    const albProxyIntegration = new apigateway.HttpIntegration(
      `http://${this.service.loadBalancer.loadBalancerDnsName}/{proxy}`,
      {
        httpMethod: 'ANY',
        proxy: true,
        options: {
          requestParameters: {
            'integration.request.path.proxy': 'method.request.path.proxy',
          },
        },
      }
    );

    // Simple integration to ALB for public routes (no path parameter needed)
    const albPublicIntegration = new apigateway.HttpIntegration(
      `http://${this.service.loadBalancer.loadBalancerDnsName}/public`,
      {
        httpMethod: 'ANY',
        proxy: true,
      }
    );

    // API Resources - proxy route with auth
    api.root.addProxy({
      defaultIntegration: albProxyIntegration,
      anyMethod: true,
      defaultMethodOptions: {
        authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        requestParameters: {
          'method.request.path.proxy': true,
        },
      },
    });

    // Public endpoints (no auth required)
    const publicApi = api.root.addResource('public');
    publicApi.addMethod('ANY', albPublicIntegration);

    this.apiUrl = api.url;

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint',
      exportName: `${appName}-${environment}-api-url`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: this.service.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: `214102106723.dkr.ecr.${this.region}.amazonaws.com/${appName.toLowerCase()}-${environment}-api`,
      description: 'ECR Repository URI',
      exportName: `${appName}-${environment}-ecr-uri`,
    });

    new cdk.CfnOutput(this, 'UploadsBucketName', {
      value: uploadsBucket.bucketName,
      description: 'Uploads S3 Bucket',
      exportName: `${appName}-${environment}-uploads-bucket`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.service.serviceName,
      description: 'ECS Service Name',
    });
  }
}
