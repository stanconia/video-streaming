"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendStack = void 0;
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const ecs = require("aws-cdk-lib/aws-ecs");
const ecsPatterns = require("aws-cdk-lib/aws-ecs-patterns");
const ecr = require("aws-cdk-lib/aws-ecr");
const iam = require("aws-cdk-lib/aws-iam");
const logs = require("aws-cdk-lib/aws-logs");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const s3 = require("aws-cdk-lib/aws-s3");
class BackendStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        backendSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
        backendSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');
        backendSecurityGroup.addIngressRule(backendSecurityGroup, ec2.Port.tcp(8080), 'Allow internal traffic on app port');
        backendSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.udpRange(10000, 10100), 'Allow WebRTC media UDP traffic');
        // ECR Repository for Backend API (reference existing repository)
        const apiRepository = ecr.Repository.fromRepositoryName(this, 'ApiRepository', `${appName.toLowerCase()}-${environment}-api`);
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
        const cpu = environment === 'prod' ? 1024 : 512;
        const memoryLimitMiB = environment === 'prod' ? 2048 : 1024;
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
                    PORT: '8080',
                    AWS_REGION: this.region,
                    COGNITO_USER_POOL_ID: userPool.userPoolId,
                    UPLOADS_BUCKET: uploadsBucket.bucketName,
                    // Database configuration for PostgreSQL
                    DB_URL: `jdbc:postgresql://${database.instanceEndpoint.hostname}:${database.instanceEndpoint.port}/edulive`,
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
                    // CORS - allow CloudFront origin
                    CORS_ALLOWED_ORIGINS: '*',
                    // Logging
                    LOG_LEVEL: environment === 'prod' ? 'INFO' : 'DEBUG',
                },
                secrets: {
                    DB_PASSWORD: ecs.Secret.fromSecretsManager(cdk.aws_secretsmanager.Secret.fromSecretNameV2(this, 'DbSecret', `${appName}/${environment}/database/credentials`), 'password'),
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
        // Add media server sidecar container
        const mediaServerContainer = this.service.taskDefinition.addContainer('media-server', {
            image: ecs.ContainerImage.fromRegistry(`214102106723.dkr.ecr.${this.region}.amazonaws.com/edulive-dev-media-server:latest`),
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
        const albProxyIntegration = new apigateway.HttpIntegration(`http://${this.service.loadBalancer.loadBalancerDnsName}/{proxy}`, {
            httpMethod: 'ANY',
            proxy: true,
            options: {
                requestParameters: {
                    'integration.request.path.proxy': 'method.request.path.proxy',
                },
            },
        });
        // Simple integration to ALB for public routes (no path parameter needed)
        const albPublicIntegration = new apigateway.HttpIntegration(`http://${this.service.loadBalancer.loadBalancerDnsName}/public`, {
            httpMethod: 'ANY',
            proxy: true,
        });
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
exports.BackendStack = BackendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9zdGFja3MvYmFja2VuZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyw0REFBNEQ7QUFDNUQsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyw2Q0FBNkM7QUFJN0MseURBQXlEO0FBRXpELHlDQUF5QztBQVl6QyxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUt6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUV2RSwrREFBK0Q7UUFDL0QsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQy9FLEdBQUc7WUFDSCxpQkFBaUIsRUFBRSxHQUFHLE9BQU8sSUFBSSxXQUFXLHFCQUFxQjtZQUNqRSxXQUFXLEVBQUUseUNBQXlDO1lBQ3RELGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsMkJBQTJCO1FBQzNCLG9CQUFvQixDQUFDLGNBQWMsQ0FDakMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQ2hCLG9CQUFvQixDQUNyQixDQUFDO1FBQ0Ysb0JBQW9CLENBQUMsY0FBYyxDQUNqQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUNsQixHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxH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QUFXLEVBQUUsbUJBQW1CO1NBQ2pDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDMUMsS0FBSyxFQUFFLHdCQUF3QixJQUFJLENBQUMsTUFBTSxrQkFBa0IsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLFdBQVcsTUFBTTtZQUN0RyxXQUFXLEVBQUUsb0JBQW9CO1lBQ2pDLFVBQVUsRUFBRSxHQUFHLE9BQU8sSUFBSSxXQUFXLFVBQVU7U0FDaEQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsYUFBYSxDQUFDLFVBQVU7WUFDL0IsV0FBVyxFQUFFLG1CQUFtQjtZQUNoQyxVQUFVLEVBQUUsR0FBRyxPQUFPLElBQUksV0FBVyxpQkFBaUI7U0FDdkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVztZQUMvQixXQUFXLEVBQUUsa0JBQWtCO1NBQ2hDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ3JDLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXO1lBQ3ZDLFdBQVcsRUFBRSxrQkFBa0I7U0FDaEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaFlELG9DQWdZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlY3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcyc7XG5pbXBvcnQgKiBhcyBlY3NQYXR0ZXJucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNzLXBhdHRlcm5zJztcbmltcG9ydCAqIGFzIGVjciBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWNyJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgcmRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yZHMnO1xuaW1wb3J0ICogYXMgZWxhc3RpY2FjaGUgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNhY2hlJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXBpZ2F0ZXdheSc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmFja2VuZFN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGFwcE5hbWU6IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgdnBjOiBlYzIuSVZwYztcbiAgZGF0YWJhc2U6IHJkcy5JRGF0YWJhc2VJbnN0YW5jZTtcbiAgY2FjaGU6IGVsYXN0aWNhY2hlLkNmbkNhY2hlQ2x1c3RlcjtcbiAgdXNlclBvb2w6IGNvZ25pdG8uSVVzZXJQb29sO1xufVxuXG5leHBvcnQgY2xhc3MgQmFja2VuZFN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGFwaVVybDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1c3RlcjogZWNzLklDbHVzdGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgc2VydmljZTogZWNzUGF0dGVybnMuQXBwbGljYXRpb25Mb2FkQmFsYW5jZWRGYXJnYXRlU2VydmljZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQmFja2VuZFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHsgYXBwTmFtZSwgZW52aXJvbm1lbnQsIHZwYywgZGF0YWJhc2UsIGNhY2hlLCB1c2VyUG9vbCB9ID0gcHJvcHM7XG5cbiAgICAvLyBDcmVhdGUgc2VjdXJpdHkgZ3JvdXAgZm9yIGJhY2tlbmQgc2VydmljZXMgd2l0aGluIHRoaXMgc3RhY2tcbiAgICBjb25zdCBiYWNrZW5kU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnQmFja2VuZFNlY3VyaXR5R3JvdXAnLCB7XG4gICAgICB2cGMsXG4gICAgICBzZWN1cml0eUdyb3VwTmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tYmFja2VuZC1zZXJ2aWNlLXNnYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIGJhY2tlbmQgRUNTIHNlcnZpY2VzJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBBbGxvdyBIVFRQL0hUVFBTIHRyYWZmaWNcbiAgICBiYWNrZW5kU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg4MCksXG4gICAgICAnQWxsb3cgSFRUUCB0cmFmZmljJ1xuICAgICk7XG4gICAgYmFja2VuZFNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC50Y3AoNDQzKSxcbiAgICAgICdBbGxvdyBIVFRQUyB0cmFmZmljJ1xuICAgICk7XG4gICAgYmFja2VuZFNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBiYWNrZW5kU2VjdXJpdHlHcm91cCxcbiAgICAgIGVjMi5Qb3J0LnRjcCg4MDgwKSxcbiAgICAgICdBbGxvdyBpbnRlcm5hbCB0cmFmZmljIG9uIGFwcCBwb3J0J1xuICAgICk7XG4gICAgYmFja2VuZFNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC51ZHBSYW5nZSgxMDAwMCwgMTAxMDApLFxuICAgICAgJ0FsbG93IFdlYlJUQyBtZWRpYSBVRFAgdHJhZmZpYydcbiAgICApO1xuXG4gICAgLy8gRUNSIFJlcG9zaXRvcnkgZm9yIEJhY2tlbmQgQVBJIChyZWZlcmVuY2UgZXhpc3RpbmcgcmVwb3NpdG9yeSlcbiAgICBjb25zdCBhcGlSZXBvc2l0b3J5ID0gZWNyLlJlcG9zaXRvcnkuZnJvbVJlcG9zaXRvcnlOYW1lKFxuICAgICAgdGhpcyxcbiAgICAgICdBcGlSZXBvc2l0b3J5JyxcbiAgICAgIGAke2FwcE5hbWUudG9Mb3dlckNhc2UoKX0tJHtlbnZpcm9ubWVudH0tYXBpYFxuICAgICk7XG5cbiAgICAvLyBTMyBCdWNrZXQgZm9yIHVwbG9hZHMgKHByb2ZpbGUgaW1hZ2VzLCBzZXNzaW9uIG1hdGVyaWFscywgZXRjLilcbiAgICBjb25zdCB1cGxvYWRzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnVXBsb2Fkc0J1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGAke2FwcE5hbWUudG9Mb3dlckNhc2UoKX0tJHtlbnZpcm9ubWVudH0tdXBsb2Fkcy0ke3RoaXMuYWNjb3VudH1gLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHZlcnNpb25lZDogdHJ1ZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGVudmlyb25tZW50ID09PSAncHJvZCdcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU5cbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IGVudmlyb25tZW50ICE9PSAncHJvZCcsXG4gICAgICBjb3JzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogW1xuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuR0VULFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuUFVULFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuUE9TVCxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJyonXSxcbiAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXG4gICAgICAgICAgbWF4QWdlOiAzMDAwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ0RlbGV0ZU9sZFZlcnNpb25zJyxcbiAgICAgICAgICBub25jdXJyZW50VmVyc2lvbkV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBFQ1MgQ2x1c3RlclxuICAgIHRoaXMuY2x1c3RlciA9IG5ldyBlY3MuQ2x1c3Rlcih0aGlzLCAnQ2x1c3RlcicsIHtcbiAgICAgIGNsdXN0ZXJOYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1jbHVzdGVyYCxcbiAgICAgIHZwYyxcbiAgICAgIGNvbnRhaW5lckluc2lnaHRzOiB0cnVlLFxuICAgICAgZW5hYmxlRmFyZ2F0ZUNhcGFjaXR5UHJvdmlkZXJzOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2cgR3JvdXAgZm9yIEJhY2tlbmRcbiAgICBjb25zdCBsb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdCYWNrZW5kTG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvZWNzLyR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0vYmFja2VuZGAsXG4gICAgICByZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfTU9OVEgsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgLy8gVGFzayBFeGVjdXRpb24gUm9sZVxuICAgIGNvbnN0IGV4ZWN1dGlvblJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ0V4ZWN1dGlvblJvbGUnLCB7XG4gICAgICByb2xlTmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tZWNzLWV4ZWN1dGlvbi1yb2xlYCxcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlY3MtdGFza3MuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FtYXpvbkVDU1Rhc2tFeGVjdXRpb25Sb2xlUG9saWN5JyksXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gVGFzayBSb2xlIChmb3IgdGhlIGFwcGxpY2F0aW9uKVxuICAgIGNvbnN0IHRhc2tSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdUYXNrUm9sZScsIHtcbiAgICAgIHJvbGVOYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1lY3MtdGFzay1yb2xlYCxcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlY3MtdGFza3MuYW1hem9uYXdzLmNvbScpLFxuICAgIH0pO1xuXG4gICAgLy8gR3JhbnQgcGVybWlzc2lvbnNcbiAgICB1cGxvYWRzQnVja2V0LmdyYW50UmVhZFdyaXRlKHRhc2tSb2xlKTtcblxuICAgIC8vIEdyYW50IGFjY2VzcyB0byBTZWNyZXRzIE1hbmFnZXJcbiAgICB0YXNrUm9sZS5hZGRUb1BvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdzZWNyZXRzbWFuYWdlcjpHZXRTZWNyZXRWYWx1ZScsXG4gICAgICAgICdzZWNyZXRzbWFuYWdlcjpEZXNjcmliZVNlY3JldCcsXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbYGFybjphd3M6c2VjcmV0c21hbmFnZXI6JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OnNlY3JldDoke2FwcE5hbWV9LypgXSxcbiAgICB9KSk7XG5cbiAgICAvLyBHcmFudCBhY2Nlc3MgdG8gQ29nbml0b1xuICAgIHRhc2tSb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2NvZ25pdG8taWRwOkFkbWluQ3JlYXRlVXNlcicsXG4gICAgICAgICdjb2duaXRvLWlkcDpBZG1pbkRlbGV0ZVVzZXInLFxuICAgICAgICAnY29nbml0by1pZHA6QWRtaW5HZXRVc2VyJyxcbiAgICAgICAgJ2NvZ25pdG8taWRwOkFkbWluVXBkYXRlVXNlckF0dHJpYnV0ZXMnLFxuICAgICAgICAnY29nbml0by1pZHA6QWRtaW5BZGRVc2VyVG9Hcm91cCcsXG4gICAgICAgICdjb2duaXRvLWlkcDpBZG1pblJlbW92ZVVzZXJGcm9tR3JvdXAnLFxuICAgICAgICAnY29nbml0by1pZHA6TGlzdFVzZXJzJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFt1c2VyUG9vbC51c2VyUG9vbEFybl0sXG4gICAgfSkpO1xuXG4gICAgLy8gR3JhbnQgYWNjZXNzIHRvIElWUyAod2lsbCBiZSBjcmVhdGVkIGluIG1lZGlhIHN0YWNrKVxuICAgIHRhc2tSb2xlLmFkZFRvUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgJ2l2czpDcmVhdGVDaGFubmVsJyxcbiAgICAgICAgJ2l2czpEZWxldGVDaGFubmVsJyxcbiAgICAgICAgJ2l2czpHZXRDaGFubmVsJyxcbiAgICAgICAgJ2l2czpMaXN0Q2hhbm5lbHMnLFxuICAgICAgICAnaXZzOkNyZWF0ZVN0cmVhbUtleScsXG4gICAgICAgICdpdnM6RGVsZXRlU3RyZWFtS2V5JyxcbiAgICAgICAgJ2l2czpHZXRTdHJlYW1LZXknLFxuICAgICAgICAnaXZzOkxpc3RTdHJlYW1LZXlzJyxcbiAgICAgICAgJ2l2czpHZXRTdHJlYW0nLFxuICAgICAgICAnaXZzOkxpc3RTdHJlYW1zJyxcbiAgICAgICAgJ2l2czpTdG9wU3RyZWFtJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgIH0pKTtcblxuICAgIC8vIEZhcmdhdGUgU2VydmljZSB3aXRoIEFMQlxuICAgIGNvbnN0IGRlc2lyZWRDb3VudCA9IGVudmlyb25tZW50ID09PSAncHJvZCcgPyAyIDogMTtcbiAgICBjb25zdCBjcHUgPSBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gMTAyNCA6IDUxMjtcbiAgICBjb25zdCBtZW1vcnlMaW1pdE1pQiA9IGVudmlyb25tZW50ID09PSAncHJvZCcgPyAyMDQ4IDogMTAyNDtcblxuICAgIHRoaXMuc2VydmljZSA9IG5ldyBlY3NQYXR0ZXJucy5BcHBsaWNhdGlvbkxvYWRCYWxhbmNlZEZhcmdhdGVTZXJ2aWNlKHRoaXMsICdCYWNrZW5kU2VydmljZScsIHtcbiAgICAgIGNsdXN0ZXI6IHRoaXMuY2x1c3RlcixcbiAgICAgIHNlcnZpY2VOYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1iYWNrZW5kYCxcbiAgICAgIGRlc2lyZWRDb3VudCxcbiAgICAgIGNwdSxcbiAgICAgIG1lbW9yeUxpbWl0TWlCLFxuICAgICAgdGFza0ltYWdlT3B0aW9uczoge1xuICAgICAgICAvLyBSZWFsIFNwcmluZyBCb290IGJhY2tlbmQgZnJvbSBFQ1JcbiAgICAgICAgaW1hZ2U6IGVjcy5Db250YWluZXJJbWFnZS5mcm9tUmVnaXN0cnkoJzIxNDEwMjEwNjcyMy5ka3IuZWNyLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tL2VkdWxpdmUtZGV2LWFwaTpsYXRlc3QnKSxcbiAgICAgICAgY29udGFpbmVyTmFtZTogJ2JhY2tlbmQnLFxuICAgICAgICBjb250YWluZXJQb3J0OiA4MDgwLFxuICAgICAgICBleGVjdXRpb25Sb2xlLFxuICAgICAgICB0YXNrUm9sZSxcbiAgICAgICAgbG9nRHJpdmVyOiBlY3MuTG9nRHJpdmVycy5hd3NMb2dzKHtcbiAgICAgICAgICBzdHJlYW1QcmVmaXg6ICdiYWNrZW5kJyxcbiAgICAgICAgICBsb2dHcm91cCxcbiAgICAgICAgfSksXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgLy8gU3ByaW5nIEJvb3QgY29uZmlndXJhdGlvblxuICAgICAgICAgIFBPUlQ6ICc4MDgwJyxcbiAgICAgICAgICBBV1NfUkVHSU9OOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICBDT0dOSVRPX1VTRVJfUE9PTF9JRDogdXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgICAgICBVUExPQURTX0JVQ0tFVDogdXBsb2Fkc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICAgIC8vIERhdGFiYXNlIGNvbmZpZ3VyYXRpb24gZm9yIFBvc3RncmVTUUxcbiAgICAgICAgICBEQl9VUkw6IGBqZGJjOnBvc3RncmVzcWw6Ly8ke2RhdGFiYXNlLmluc3RhbmNlRW5kcG9pbnQuaG9zdG5hbWV9OiR7ZGF0YWJhc2UuaW5zdGFuY2VFbmRwb2ludC5wb3J0fS9lZHVsaXZlYCxcbiAgICAgICAgICBEQl9EUklWRVI6ICdvcmcucG9zdGdyZXNxbC5Ecml2ZXInLFxuICAgICAgICAgIERCX1VTRVJOQU1FOiAnZWR1bGl2ZV9hZG1pbicsXG4gICAgICAgICAgSElCRVJOQVRFX0RJQUxFQ1Q6ICdvcmcuaGliZXJuYXRlLmRpYWxlY3QuUG9zdGdyZVNRTERpYWxlY3QnLFxuICAgICAgICAgIEpQQV9ERExfQVVUTzogJ3VwZGF0ZScsXG4gICAgICAgICAgSlBBX1NIT1dfU1FMOiAnZmFsc2UnLFxuICAgICAgICAgIEgyX0NPTlNPTEVfRU5BQkxFRDogJ2ZhbHNlJyxcbiAgICAgICAgICAvLyBSZWRpcyBjb25maWd1cmF0aW9uXG4gICAgICAgICAgUkVESVNfSE9TVDogY2FjaGUuYXR0clJlZGlzRW5kcG9pbnRBZGRyZXNzLFxuICAgICAgICAgIFJFRElTX1BPUlQ6IGNhY2hlLmF0dHJSZWRpc0VuZHBvaW50UG9ydCxcbiAgICAgICAgICAvLyBNZWRpYSBzZXJ2ZXIgKHNpZGVjYXIgb24gbG9jYWxob3N0KVxuICAgICAgICAgIE1FRElBX1NFUlZFUl9VUkw6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLFxuICAgICAgICAgIC8vIENPUlMgLSBhbGxvdyBDbG91ZEZyb250IG9yaWdpblxuICAgICAgICAgIENPUlNfQUxMT1dFRF9PUklHSU5TOiAnKicsXG4gICAgICAgICAgLy8gTG9nZ2luZ1xuICAgICAgICAgIExPR19MRVZFTDogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/ICdJTkZPJyA6ICdERUJVRycsXG4gICAgICAgIH0sXG4gICAgICAgIHNlY3JldHM6IHtcbiAgICAgICAgICBEQl9QQVNTV09SRDogZWNzLlNlY3JldC5mcm9tU2VjcmV0c01hbmFnZXIoXG4gICAgICAgICAgICBjZGsuYXdzX3NlY3JldHNtYW5hZ2VyLlNlY3JldC5mcm9tU2VjcmV0TmFtZVYyKFxuICAgICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgICAnRGJTZWNyZXQnLFxuICAgICAgICAgICAgICBgJHthcHBOYW1lfS8ke2Vudmlyb25tZW50fS9kYXRhYmFzZS9jcmVkZW50aWFsc2BcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICAncGFzc3dvcmQnXG4gICAgICAgICAgKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBoZWFsdGhDaGVja0dyYWNlUGVyaW9kOiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMjApLFxuICAgICAgcHVibGljTG9hZEJhbGFuY2VyOiB0cnVlLFxuICAgICAgYXNzaWduUHVibGljSXA6IHRydWUsXG4gICAgICBzZWN1cml0eUdyb3VwczogW2JhY2tlbmRTZWN1cml0eUdyb3VwXSxcbiAgICAgIHRhc2tTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgIH0sXG4gICAgICBjaXJjdWl0QnJlYWtlcjoge1xuICAgICAgICByb2xsYmFjazogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBlbmFibGVFeGVjdXRlQ29tbWFuZDogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBtZWRpYSBzZXJ2ZXIgc2lkZWNhciBjb250YWluZXJcbiAgICBjb25zdCBtZWRpYVNlcnZlckNvbnRhaW5lciA9IHRoaXMuc2VydmljZS50YXNrRGVmaW5pdGlvbi5hZGRDb250YWluZXIoJ21lZGlhLXNlcnZlcicsIHtcbiAgICAgIGltYWdlOiBlY3MuQ29udGFpbmVySW1hZ2UuZnJvbVJlZ2lzdHJ5KFxuICAgICAgICBgMjE0MTAyMTA2NzIzLmRrci5lY3IuJHt0aGlzLnJlZ2lvbn0uYW1hem9uYXdzLmNvbS9lZHVsaXZlLWRldi1tZWRpYS1zZXJ2ZXI6bGF0ZXN0YFxuICAgICAgKSxcbiAgICAgIGNvbnRhaW5lck5hbWU6ICdtZWRpYS1zZXJ2ZXInLFxuICAgICAgbWVtb3J5TGltaXRNaUI6IDUxMixcbiAgICAgIGxvZ2dpbmc6IGVjcy5Mb2dEcml2ZXJzLmF3c0xvZ3Moe1xuICAgICAgICBzdHJlYW1QcmVmaXg6ICdtZWRpYS1zZXJ2ZXInLFxuICAgICAgICBsb2dHcm91cCxcbiAgICAgIH0pLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUE9SVDogJzMwMDAnLFxuICAgICAgICBOT0RFX0VOVjogZW52aXJvbm1lbnQsXG4gICAgICAgIEFOTk9VTkNFRF9JUDogJ2F1dG8nLFxuICAgICAgfSxcbiAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgIGNvbW1hbmQ6IFsnQ01ELVNIRUxMJywgJ25vZGUgLWUgXCJyZXF1aXJlKFxcJ2h0dHBcXCcpLmdldChcXCdodHRwOi8vbG9jYWxob3N0OjMwMDAvaGVhbHRoXFwnLCAocikgPT4geyBwcm9jZXNzLmV4aXQoci5zdGF0dXNDb2RlID09PSAyMDAgPyAwIDogMSkgfSlcIiddLFxuICAgICAgICBpbnRlcnZhbDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgICAgIHJldHJpZXM6IDMsXG4gICAgICAgIHN0YXJ0UGVyaW9kOiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgICB9LFxuICAgIH0pO1xuICAgIG1lZGlhU2VydmVyQ29udGFpbmVyLmFkZFBvcnRNYXBwaW5ncyh7IGNvbnRhaW5lclBvcnQ6IDMwMDAgfSk7XG5cbiAgICAvLyBDb25maWd1cmUgaGVhbHRoIGNoZWNrXG4gICAgdGhpcy5zZXJ2aWNlLnRhcmdldEdyb3VwLmNvbmZpZ3VyZUhlYWx0aENoZWNrKHtcbiAgICAgIHBhdGg6ICcvaGVhbHRoJyxcbiAgICAgIGhlYWx0aHlUaHJlc2hvbGRDb3VudDogMixcbiAgICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiAzLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTApLFxuICAgICAgaW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDMwKSxcbiAgICB9KTtcblxuICAgIC8vIEF1dG8gU2NhbGluZ1xuICAgIGNvbnN0IHNjYWxpbmcgPSB0aGlzLnNlcnZpY2Uuc2VydmljZS5hdXRvU2NhbGVUYXNrQ291bnQoe1xuICAgICAgbWluQ2FwYWNpdHk6IGRlc2lyZWRDb3VudCxcbiAgICAgIG1heENhcGFjaXR5OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gMTAgOiA0LFxuICAgIH0pO1xuXG4gICAgc2NhbGluZy5zY2FsZU9uQ3B1VXRpbGl6YXRpb24oJ0NwdVNjYWxpbmcnLCB7XG4gICAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IDcwLFxuICAgICAgc2NhbGVJbkNvb2xkb3duOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIHNjYWxlT3V0Q29vbGRvd246IGNkay5EdXJhdGlvbi5taW51dGVzKDIpLFxuICAgIH0pO1xuXG4gICAgc2NhbGluZy5zY2FsZU9uTWVtb3J5VXRpbGl6YXRpb24oJ01lbW9yeVNjYWxpbmcnLCB7XG4gICAgICB0YXJnZXRVdGlsaXphdGlvblBlcmNlbnQ6IDgwLFxuICAgICAgc2NhbGVJbkNvb2xkb3duOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgIHNjYWxlT3V0Q29vbGRvd246IGNkay5EdXJhdGlvbi5taW51dGVzKDIpLFxuICAgIH0pO1xuXG4gICAgLy8gQVBJIEdhdGV3YXkgZm9yIFJFU1QgQVBJXG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnQXBpJywge1xuICAgICAgcmVzdEFwaU5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LWFwaWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0VkdUxpdmUgQVBJIEdhdGV3YXknLFxuICAgICAgZGVwbG95T3B0aW9uczoge1xuICAgICAgICBzdGFnZU5hbWU6IGVudmlyb25tZW50LFxuICAgICAgICBsb2dnaW5nTGV2ZWw6IGFwaWdhdGV3YXkuTWV0aG9kTG9nZ2luZ0xldmVsLklORk8sXG4gICAgICAgIGRhdGFUcmFjZUVuYWJsZWQ6IHRydWUsXG4gICAgICAgIG1ldHJpY3NFbmFibGVkOiB0cnVlLFxuICAgICAgICB0aHJvdHRsaW5nQnVyc3RMaW1pdDogMTAwMCxcbiAgICAgICAgdGhyb3R0bGluZ1JhdGVMaW1pdDogNTAwLFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICAgIGFsbG93SGVhZGVyczogW1xuICAgICAgICAgICdDb250ZW50LVR5cGUnLFxuICAgICAgICAgICdBdXRob3JpemF0aW9uJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ1gtQXBpLUtleScsXG4gICAgICAgICAgJ1gtQW16LVNlY3VyaXR5LVRva2VuJyxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDb2duaXRvIEF1dGhvcml6ZXJcbiAgICBjb25zdCBhdXRob3JpemVyID0gbmV3IGFwaWdhdGV3YXkuQ29nbml0b1VzZXJQb29sc0F1dGhvcml6ZXIodGhpcywgJ0FwaUF1dGhvcml6ZXInLCB7XG4gICAgICBhdXRob3JpemVyTmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tY29nbml0by1hdXRob3JpemVyYCxcbiAgICAgIGNvZ25pdG9Vc2VyUG9vbHM6IFt1c2VyUG9vbF0sXG4gICAgfSk7XG5cbiAgICAvLyBQcm94eSBpbnRlZ3JhdGlvbiB0byBBTEIgZm9yIGF1dGhlbnRpY2F0ZWQgcm91dGVzXG4gICAgY29uc3QgYWxiUHJveHlJbnRlZ3JhdGlvbiA9IG5ldyBhcGlnYXRld2F5Lkh0dHBJbnRlZ3JhdGlvbihcbiAgICAgIGBodHRwOi8vJHt0aGlzLnNlcnZpY2UubG9hZEJhbGFuY2VyLmxvYWRCYWxhbmNlckRuc05hbWV9L3twcm94eX1gLFxuICAgICAge1xuICAgICAgICBodHRwTWV0aG9kOiAnQU5ZJyxcbiAgICAgICAgcHJveHk6IHRydWUsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAgICAgJ2ludGVncmF0aW9uLnJlcXVlc3QucGF0aC5wcm94eSc6ICdtZXRob2QucmVxdWVzdC5wYXRoLnByb3h5JyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBTaW1wbGUgaW50ZWdyYXRpb24gdG8gQUxCIGZvciBwdWJsaWMgcm91dGVzIChubyBwYXRoIHBhcmFtZXRlciBuZWVkZWQpXG4gICAgY29uc3QgYWxiUHVibGljSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5IdHRwSW50ZWdyYXRpb24oXG4gICAgICBgaHR0cDovLyR7dGhpcy5zZXJ2aWNlLmxvYWRCYWxhbmNlci5sb2FkQmFsYW5jZXJEbnNOYW1lfS9wdWJsaWNgLFxuICAgICAge1xuICAgICAgICBodHRwTWV0aG9kOiAnQU5ZJyxcbiAgICAgICAgcHJveHk6IHRydWUsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEFQSSBSZXNvdXJjZXMgLSBwcm94eSByb3V0ZSB3aXRoIGF1dGhcbiAgICBhcGkucm9vdC5hZGRQcm94eSh7XG4gICAgICBkZWZhdWx0SW50ZWdyYXRpb246IGFsYlByb3h5SW50ZWdyYXRpb24sXG4gICAgICBhbnlNZXRob2Q6IHRydWUsXG4gICAgICBkZWZhdWx0TWV0aG9kT3B0aW9uczoge1xuICAgICAgICBhdXRob3JpemVyLFxuICAgICAgICBhdXRob3JpemF0aW9uVHlwZTogYXBpZ2F0ZXdheS5BdXRob3JpemF0aW9uVHlwZS5DT0dOSVRPLFxuICAgICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAgICdtZXRob2QucmVxdWVzdC5wYXRoLnByb3h5JzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBQdWJsaWMgZW5kcG9pbnRzIChubyBhdXRoIHJlcXVpcmVkKVxuICAgIGNvbnN0IHB1YmxpY0FwaSA9IGFwaS5yb290LmFkZFJlc291cmNlKCdwdWJsaWMnKTtcbiAgICBwdWJsaWNBcGkuYWRkTWV0aG9kKCdBTlknLCBhbGJQdWJsaWNJbnRlZ3JhdGlvbik7XG5cbiAgICB0aGlzLmFwaVVybCA9IGFwaS51cmw7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FwaUVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IGFwaS51cmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IEVuZHBvaW50JyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LWFwaS11cmxgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0xvYWRCYWxhbmNlckRucycsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnNlcnZpY2UubG9hZEJhbGFuY2VyLmxvYWRCYWxhbmNlckRuc05hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0xvYWQgQmFsYW5jZXIgRE5TJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdFY3JSZXBvc2l0b3J5VXJpJywge1xuICAgICAgdmFsdWU6IGAyMTQxMDIxMDY3MjMuZGtyLmVjci4ke3RoaXMucmVnaW9ufS5hbWF6b25hd3MuY29tLyR7YXBwTmFtZS50b0xvd2VyQ2FzZSgpfS0ke2Vudmlyb25tZW50fS1hcGlgLFxuICAgICAgZGVzY3JpcHRpb246ICdFQ1IgUmVwb3NpdG9yeSBVUkknLFxuICAgICAgZXhwb3J0TmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tZWNyLXVyaWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXBsb2Fkc0J1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdXBsb2Fkc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdVcGxvYWRzIFMzIEJ1Y2tldCcsXG4gICAgICBleHBvcnROYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS11cGxvYWRzLWJ1Y2tldGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2x1c3Rlck5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5jbHVzdGVyLmNsdXN0ZXJOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdFQ1MgQ2x1c3RlciBOYW1lJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdTZXJ2aWNlTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnNlcnZpY2Uuc2VydmljZS5zZXJ2aWNlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRUNTIFNlcnZpY2UgTmFtZScsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==