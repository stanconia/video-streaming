import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.IDatabaseInstance;
  public readonly cache: elasticache.CfnCacheCluster;
  public readonly databaseSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { appName, environment, vpc, securityGroup } = props;

    // Database credentials stored in Secrets Manager
    const databaseCredentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
      secretName: `${appName}/${environment}/database/credentials`,
      description: 'Database credentials for EduLive',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'edulive_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    this.databaseSecret = databaseCredentials;

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for EduLive database',
      subnetGroupName: `${appName}-${environment}-db-subnet-group`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS PostgreSQL Instance
    const instanceType = environment === 'prod'
      ? ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE)
      : ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO);

    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroup: dbSubnetGroup,
      securityGroups: [securityGroup],
      databaseName: 'edulive',
      credentials: rds.Credentials.fromSecret(databaseCredentials),
      instanceIdentifier: `${appName}-${environment}-postgres`,
      allocatedStorage: environment === 'prod' ? 100 : 20,
      maxAllocatedStorage: environment === 'prod' ? 500 : 100,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      multiAz: environment === 'prod',
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(environment === 'prod' ? 30 : 7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'Sun:04:00-Sun:05:00',
      deletionProtection: environment === 'prod',
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      enablePerformanceInsights: environment === 'prod',
      performanceInsightRetention: environment === 'prod'
        ? rds.PerformanceInsightRetention.MONTHS_1
        : undefined,
      cloudwatchLogsExports: ['postgresql', 'upgrade'],
      monitoringInterval: cdk.Duration.seconds(60),
      parameterGroup: new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        description: 'Parameter group for EduLive database',
        parameters: {
          'log_statement': 'all',
          'log_min_duration_statement': '1000', // Log queries taking more than 1 second
          'shared_preload_libraries': 'pg_stat_statements',
        },
      }),
    });

    // ElastiCache Subnet Group
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      cacheSubnetGroupName: `${appName}-${environment}-cache-subnet-group`,
      description: 'Subnet group for EduLive cache',
      subnetIds: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }).subnetIds,
    });

    // ElastiCache Redis Cluster
    const cacheNodeType = environment === 'prod' ? 'cache.r6g.large' : 'cache.t4g.micro';

    this.cache = new elasticache.CfnCacheCluster(this, 'CacheCluster', {
      clusterName: `${appName}-${environment}-redis`,
      engine: 'redis',
      engineVersion: '7.0',
      cacheNodeType,
      numCacheNodes: 1,
      cacheSubnetGroupName: cacheSubnetGroup.cacheSubnetGroupName,
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
      port: 6379,
      preferredMaintenanceWindow: 'Sun:05:00-Sun:06:00',
      snapshotRetentionLimit: environment === 'prod' ? 7 : 1,
      snapshotWindow: '04:00-05:00',
      autoMinorVersionUpgrade: true,
    });

    this.cache.addDependency(cacheSubnetGroup);

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `${appName}-${environment}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.instanceEndpoint.port.toString(),
      description: 'RDS Database Port',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: databaseCredentials.secretArn,
      description: 'Database Credentials Secret ARN',
      exportName: `${appName}-${environment}-db-secret-arn`,
    });

    new cdk.CfnOutput(this, 'CacheEndpoint', {
      value: this.cache.attrRedisEndpointAddress,
      description: 'ElastiCache Redis Endpoint',
      exportName: `${appName}-${environment}-cache-endpoint`,
    });

    new cdk.CfnOutput(this, 'CachePort', {
      value: this.cache.attrRedisEndpointPort,
      description: 'ElastiCache Redis Port',
    });
  }
}
