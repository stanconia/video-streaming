"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseStack = void 0;
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const rds = require("aws-cdk-lib/aws-rds");
const elasticache = require("aws-cdk-lib/aws-elasticache");
const secretsmanager = require("aws-cdk-lib/aws-secretsmanager");
class DatabaseStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.DatabaseStack = DatabaseStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvc3RhY2tzL2RhdGFiYXNlLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQywyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLDJEQUEyRDtBQUMzRCxpRUFBaUU7QUFVakUsTUFBYSxhQUFjLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFLMUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF5QjtRQUNqRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsYUFBYSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTNELGlEQUFpRDtRQUNqRCxNQUFNLG1CQUFtQixHQUFHLElBQUksY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDakYsVUFBVSxFQUFFLEdBQUcsT0FBTyxJQUFJLFdBQVcsdUJBQXVCO1lBQzVELFdBQVcsRUFBRSxrQ0FBa0M7WUFDL0Msb0JBQW9CLEVBQUU7Z0JBQ3BCLG9CQUFvQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsZUFBZSxFQUFFLENBQUM7Z0JBQ25FLGlCQUFpQixFQUFFLFVBQVU7Z0JBQzdCLGtCQUFrQixFQUFFLElBQUk7Z0JBQ3hCLGNBQWMsRUFBRSxFQUFFO2FBQ25CO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLGNBQWMsR0FBRyxtQkFBbUIsQ0FBQztRQUUxQyxtQkFBbUI7UUFDbkIsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUNyRSxHQUFHO1lBQ0gsV0FBVyxFQUFFLG1DQUFtQztZQUNoRCxlQUFlLEVBQUUsR0FBRyxPQUFPLElBQUksV0FBVyxrQkFBa0I7WUFDNUQsVUFBVSxFQUFFO2dCQUNWLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQjthQUM1QztTQUNGLENBQUMsQ0FBQztRQUVILDBCQUEwQjtRQUMxQixNQUFNLFlBQVksR0FBRyxXQUFXLEtBQUssTUFBTTtZQUN6QyxDQUFDLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUM7WUFDcEUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFdkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQ3pELE1BQU0sRUFBRSxHQUFHLENBQUMsc0JBQXNCLENBQUMsUUFBUSxDQUFDO2dCQUMxQyxPQUFPLEVBQUUsR0FBRyxDQUFDLHFCQUFxQixDQUFDLE1BQU07YUFDMUMsQ0FBQztZQUNGLFlBQVk7WUFDWixHQUFHO1lBQ0gsVUFBVSxFQUFFO2dCQUNWLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQjthQUM1QztZQUNELFdBQVcsRUFBRSxhQUFhO1lBQzFCLGNBQWMsRUFBRSxDQUFDLGFBQWEsQ0FBQztZQUMvQixZQUFZLEVBQUUsU0FBUztZQUN2QixXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CLENBQUM7WUFDNUQsa0JBQWtCLEVBQUUsR0FBRyxPQUFPLElBQUksV0FBVyxXQUFXO1lBQ3hELGdCQUFnQixFQUFFLFdBQVcsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNuRCxtQkFBbUIsRUFBRSxXQUFXLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDdkQsV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRztZQUNoQyxnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLE9BQU8sRUFBRSxXQUFXLEtBQUssTUFBTTtZQUMvQix1QkFBdUIsRUFBRSxJQUFJO1lBQzdCLGVBQWUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRSxxQkFBcUIsRUFBRSxhQUFhO1lBQ3BDLDBCQUEwQixFQUFFLHFCQUFxQjtZQUNqRCxrQkFBa0IsRUFBRSxXQUFXLEtBQUssTUFBTTtZQUMxQyxhQUFhLEVBQUUsV0FBVyxLQUFLLE1BQU07Z0JBQ25DLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07Z0JBQzFCLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDN0IseUJBQXlCLEVBQUUsV0FBVyxLQUFLLE1BQU07WUFDakQsMkJBQTJCLEVBQUUsV0FBVyxLQUFLLE1BQU07Z0JBQ2pELENBQUMsQ0FBQyxHQUFHLENBQUMsMkJBQTJCLENBQUMsUUFBUTtnQkFDMUMsQ0FBQyxDQUFDLFNBQVM7WUFDYixxQkFBcUIsRUFBRSxDQUFDLFlBQVksRUFBRSxTQUFTLENBQUM7WUFDaEQsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQzVDLGNBQWMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLHdCQUF3QixFQUFFO2dCQUNyRSxNQUFNLEVBQUUsR0FBRyxDQUFDLHNCQUFzQixDQUFDLFFBQVEsQ0FBQztvQkFDMUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNO2lCQUMxQyxDQUFDO2dCQUNGLFdBQVcsRUFBRSxzQ0FBc0M7Z0JBQ25ELFVBQVUsRUFBRTtvQkFDVixlQUFlLEVBQUUsS0FBSztvQkFDdEIsNEJBQTRCLEVBQUUsTUFBTSxFQUFFLHdDQUF3QztvQkFDOUUsMEJBQTBCLEVBQUUsb0JBQW9CO2lCQUNqRDthQUNGLENBQUM7U0FDSCxDQUFDLENBQUM7UUFFSCwyQkFBMkI7UUFDM0IsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLFdBQVcsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQ2hGLG9CQUFvQixFQUFFLEdBQUcsT0FBTyxJQUFJLFdBQVcscUJBQXFCO1lBQ3BFLFdBQVcsRUFBRSxnQ0FBZ0M7WUFDN0MsU0FBUyxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUM7Z0JBQzNCLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQjthQUM1QyxDQUFDLENBQUMsU0FBUztTQUNiLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixNQUFNLGFBQWEsR0FBRyxXQUFXLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUM7UUFFckYsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLFdBQVcsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUNqRSxXQUFXLEVBQUUsR0FBRyxPQUFPLElBQUksV0FBVyxRQUFRO1lBQzlDLE1BQU0sRUFBRSxPQUFPO1lBQ2YsYUFBYSxFQUFFLEtBQUs7WUFDcEIsYUFBYTtZQUNiLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLG9CQUFvQjtZQUMzRCxtQkFBbUIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUM7WUFDcEQsSUFBSSxFQUFFLElBQUk7WUFDViwwQkFBMEIsRUFBRSxxQkFBcUI7WUFDakQsc0JBQXNCLEVBQUUsV0FBVyxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RELGNBQWMsRUFBRSxhQUFhO1lBQzdCLHVCQUF1QixFQUFFLElBQUk7U0FDOUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUUzQyxVQUFVO1FBQ1YsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRO1lBQzlDLFdBQVcsRUFBRSx1QkFBdUI7WUFDcEMsVUFBVSxFQUFFLEdBQUcsT0FBTyxJQUFJLFdBQVcsY0FBYztTQUNwRCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3JELFdBQVcsRUFBRSxtQkFBbUI7U0FDakMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUMzQyxLQUFLLEVBQUUsbUJBQW1CLENBQUMsU0FBUztZQUNwQyxXQUFXLEVBQUUsaUNBQWlDO1lBQzlDLFVBQVUsRUFBRSxHQUFHLE9BQU8sSUFBSSxXQUFXLGdCQUFnQjtTQUN0RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyx3QkFBd0I7WUFDMUMsV0FBVyxFQUFFLDRCQUE0QjtZQUN6QyxVQUFVLEVBQUUsR0FBRyxPQUFPLElBQUksV0FBVyxpQkFBaUI7U0FDdkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDbkMsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCO1lBQ3ZDLFdBQVcsRUFBRSx3QkFBd0I7U0FDdEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBL0lELHNDQStJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyByZHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJkcyc7XG5pbXBvcnQgKiBhcyBlbGFzdGljYWNoZSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2FjaGUnO1xuaW1wb3J0ICogYXMgc2VjcmV0c21hbmFnZXIgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNlY3JldHNtYW5hZ2VyJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgYXBwTmFtZTogc3RyaW5nO1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICB2cGM6IGVjMi5JVnBjO1xuICBzZWN1cml0eUdyb3VwOiBlYzIuSVNlY3VyaXR5R3JvdXA7XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFiYXNlOiByZHMuSURhdGFiYXNlSW5zdGFuY2U7XG4gIHB1YmxpYyByZWFkb25seSBjYWNoZTogZWxhc3RpY2FjaGUuQ2ZuQ2FjaGVDbHVzdGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YWJhc2VTZWNyZXQ6IHNlY3JldHNtYW5hZ2VyLklTZWNyZXQ7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IERhdGFiYXNlU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgeyBhcHBOYW1lLCBlbnZpcm9ubWVudCwgdnBjLCBzZWN1cml0eUdyb3VwIH0gPSBwcm9wcztcblxuICAgIC8vIERhdGFiYXNlIGNyZWRlbnRpYWxzIHN0b3JlZCBpbiBTZWNyZXRzIE1hbmFnZXJcbiAgICBjb25zdCBkYXRhYmFzZUNyZWRlbnRpYWxzID0gbmV3IHNlY3JldHNtYW5hZ2VyLlNlY3JldCh0aGlzLCAnRGF0YWJhc2VDcmVkZW50aWFscycsIHtcbiAgICAgIHNlY3JldE5hbWU6IGAke2FwcE5hbWV9LyR7ZW52aXJvbm1lbnR9L2RhdGFiYXNlL2NyZWRlbnRpYWxzYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGF0YWJhc2UgY3JlZGVudGlhbHMgZm9yIEVkdUxpdmUnLFxuICAgICAgZ2VuZXJhdGVTZWNyZXRTdHJpbmc6IHtcbiAgICAgICAgc2VjcmV0U3RyaW5nVGVtcGxhdGU6IEpTT04uc3RyaW5naWZ5KHsgdXNlcm5hbWU6ICdlZHVsaXZlX2FkbWluJyB9KSxcbiAgICAgICAgZ2VuZXJhdGVTdHJpbmdLZXk6ICdwYXNzd29yZCcsXG4gICAgICAgIGV4Y2x1ZGVQdW5jdHVhdGlvbjogdHJ1ZSxcbiAgICAgICAgcGFzc3dvcmRMZW5ndGg6IDMyLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMuZGF0YWJhc2VTZWNyZXQgPSBkYXRhYmFzZUNyZWRlbnRpYWxzO1xuXG4gICAgLy8gUkRTIFN1Ym5ldCBHcm91cFxuICAgIGNvbnN0IGRiU3VibmV0R3JvdXAgPSBuZXcgcmRzLlN1Ym5ldEdyb3VwKHRoaXMsICdEYXRhYmFzZVN1Ym5ldEdyb3VwJywge1xuICAgICAgdnBjLFxuICAgICAgZGVzY3JpcHRpb246ICdTdWJuZXQgZ3JvdXAgZm9yIEVkdUxpdmUgZGF0YWJhc2UnLFxuICAgICAgc3VibmV0R3JvdXBOYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1kYi1zdWJuZXQtZ3JvdXBgLFxuICAgICAgdnBjU3VibmV0czoge1xuICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVELFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFJEUyBQb3N0Z3JlU1FMIEluc3RhbmNlXG4gICAgY29uc3QgaW5zdGFuY2VUeXBlID0gZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xuICAgICAgPyBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLlI2RywgZWMyLkluc3RhbmNlU2l6ZS5MQVJHRSlcbiAgICAgIDogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UNEcsIGVjMi5JbnN0YW5jZVNpemUuTUlDUk8pO1xuXG4gICAgdGhpcy5kYXRhYmFzZSA9IG5ldyByZHMuRGF0YWJhc2VJbnN0YW5jZSh0aGlzLCAnRGF0YWJhc2UnLCB7XG4gICAgICBlbmdpbmU6IHJkcy5EYXRhYmFzZUluc3RhbmNlRW5naW5lLnBvc3RncmVzKHtcbiAgICAgICAgdmVyc2lvbjogcmRzLlBvc3RncmVzRW5naW5lVmVyc2lvbi5WRVJfMTUsXG4gICAgICB9KSxcbiAgICAgIGluc3RhbmNlVHlwZSxcbiAgICAgIHZwYyxcbiAgICAgIHZwY1N1Ym5ldHM6IHtcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRCxcbiAgICAgIH0sXG4gICAgICBzdWJuZXRHcm91cDogZGJTdWJuZXRHcm91cCxcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbc2VjdXJpdHlHcm91cF0sXG4gICAgICBkYXRhYmFzZU5hbWU6ICdlZHVsaXZlJyxcbiAgICAgIGNyZWRlbnRpYWxzOiByZHMuQ3JlZGVudGlhbHMuZnJvbVNlY3JldChkYXRhYmFzZUNyZWRlbnRpYWxzKSxcbiAgICAgIGluc3RhbmNlSWRlbnRpZmllcjogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tcG9zdGdyZXNgLFxuICAgICAgYWxsb2NhdGVkU3RvcmFnZTogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDEwMCA6IDIwLFxuICAgICAgbWF4QWxsb2NhdGVkU3RvcmFnZTogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDUwMCA6IDEwMCxcbiAgICAgIHN0b3JhZ2VUeXBlOiByZHMuU3RvcmFnZVR5cGUuR1AzLFxuICAgICAgc3RvcmFnZUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgIG11bHRpQXo6IGVudmlyb25tZW50ID09PSAncHJvZCcsXG4gICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogdHJ1ZSxcbiAgICAgIGJhY2t1cFJldGVudGlvbjogY2RrLkR1cmF0aW9uLmRheXMoZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDMwIDogNyksXG4gICAgICBwcmVmZXJyZWRCYWNrdXBXaW5kb3c6ICcwMzowMC0wNDowMCcsXG4gICAgICBwcmVmZXJyZWRNYWludGVuYW5jZVdpbmRvdzogJ1N1bjowNDowMC1TdW46MDU6MDAnLFxuICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnLFxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xuICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTlxuICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBlbmFibGVQZXJmb3JtYW5jZUluc2lnaHRzOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnLFxuICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0UmV0ZW50aW9uOiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnXG4gICAgICAgID8gcmRzLlBlcmZvcm1hbmNlSW5zaWdodFJldGVudGlvbi5NT05USFNfMVxuICAgICAgICA6IHVuZGVmaW5lZCxcbiAgICAgIGNsb3Vkd2F0Y2hMb2dzRXhwb3J0czogWydwb3N0Z3Jlc3FsJywgJ3VwZ3JhZGUnXSxcbiAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgICAgcGFyYW1ldGVyR3JvdXA6IG5ldyByZHMuUGFyYW1ldGVyR3JvdXAodGhpcywgJ0RhdGFiYXNlUGFyYW1ldGVyR3JvdXAnLCB7XG4gICAgICAgIGVuZ2luZTogcmRzLkRhdGFiYXNlSW5zdGFuY2VFbmdpbmUucG9zdGdyZXMoe1xuICAgICAgICAgIHZlcnNpb246IHJkcy5Qb3N0Z3Jlc0VuZ2luZVZlcnNpb24uVkVSXzE1LFxuICAgICAgICB9KSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdQYXJhbWV0ZXIgZ3JvdXAgZm9yIEVkdUxpdmUgZGF0YWJhc2UnLFxuICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgJ2xvZ19zdGF0ZW1lbnQnOiAnYWxsJyxcbiAgICAgICAgICAnbG9nX21pbl9kdXJhdGlvbl9zdGF0ZW1lbnQnOiAnMTAwMCcsIC8vIExvZyBxdWVyaWVzIHRha2luZyBtb3JlIHRoYW4gMSBzZWNvbmRcbiAgICAgICAgICAnc2hhcmVkX3ByZWxvYWRfbGlicmFyaWVzJzogJ3BnX3N0YXRfc3RhdGVtZW50cycsXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIC8vIEVsYXN0aUNhY2hlIFN1Ym5ldCBHcm91cFxuICAgIGNvbnN0IGNhY2hlU3VibmV0R3JvdXAgPSBuZXcgZWxhc3RpY2FjaGUuQ2ZuU3VibmV0R3JvdXAodGhpcywgJ0NhY2hlU3VibmV0R3JvdXAnLCB7XG4gICAgICBjYWNoZVN1Ym5ldEdyb3VwTmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tY2FjaGUtc3VibmV0LWdyb3VwYCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3VibmV0IGdyb3VwIGZvciBFZHVMaXZlIGNhY2hlJyxcbiAgICAgIHN1Ym5ldElkczogdnBjLnNlbGVjdFN1Ym5ldHMoe1xuICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVELFxuICAgICAgfSkuc3VibmV0SWRzLFxuICAgIH0pO1xuXG4gICAgLy8gRWxhc3RpQ2FjaGUgUmVkaXMgQ2x1c3RlclxuICAgIGNvbnN0IGNhY2hlTm9kZVR5cGUgPSBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gJ2NhY2hlLnI2Zy5sYXJnZScgOiAnY2FjaGUudDRnLm1pY3JvJztcblxuICAgIHRoaXMuY2FjaGUgPSBuZXcgZWxhc3RpY2FjaGUuQ2ZuQ2FjaGVDbHVzdGVyKHRoaXMsICdDYWNoZUNsdXN0ZXInLCB7XG4gICAgICBjbHVzdGVyTmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tcmVkaXNgLFxuICAgICAgZW5naW5lOiAncmVkaXMnLFxuICAgICAgZW5naW5lVmVyc2lvbjogJzcuMCcsXG4gICAgICBjYWNoZU5vZGVUeXBlLFxuICAgICAgbnVtQ2FjaGVOb2RlczogMSxcbiAgICAgIGNhY2hlU3VibmV0R3JvdXBOYW1lOiBjYWNoZVN1Ym5ldEdyb3VwLmNhY2hlU3VibmV0R3JvdXBOYW1lLFxuICAgICAgdnBjU2VjdXJpdHlHcm91cElkczogW3NlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkXSxcbiAgICAgIHBvcnQ6IDYzNzksXG4gICAgICBwcmVmZXJyZWRNYWludGVuYW5jZVdpbmRvdzogJ1N1bjowNTowMC1TdW46MDY6MDAnLFxuICAgICAgc25hcHNob3RSZXRlbnRpb25MaW1pdDogZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDcgOiAxLFxuICAgICAgc25hcHNob3RXaW5kb3c6ICcwNDowMC0wNTowMCcsXG4gICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogdHJ1ZSxcbiAgICB9KTtcblxuICAgIHRoaXMuY2FjaGUuYWRkRGVwZW5kZW5jeShjYWNoZVN1Ym5ldEdyb3VwKTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YWJhc2VFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRhdGFiYXNlLmluc3RhbmNlRW5kcG9pbnQuaG9zdG5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1JEUyBEYXRhYmFzZSBFbmRwb2ludCcsXG4gICAgICBleHBvcnROYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1kYi1lbmRwb2ludGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YWJhc2VQb3J0Jywge1xuICAgICAgdmFsdWU6IHRoaXMuZGF0YWJhc2UuaW5zdGFuY2VFbmRwb2ludC5wb3J0LnRvU3RyaW5nKCksXG4gICAgICBkZXNjcmlwdGlvbjogJ1JEUyBEYXRhYmFzZSBQb3J0JyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhYmFzZVNlY3JldEFybicsIHtcbiAgICAgIHZhbHVlOiBkYXRhYmFzZUNyZWRlbnRpYWxzLnNlY3JldEFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnRGF0YWJhc2UgQ3JlZGVudGlhbHMgU2VjcmV0IEFSTicsXG4gICAgICBleHBvcnROYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1kYi1zZWNyZXQtYXJuYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdDYWNoZUVuZHBvaW50Jywge1xuICAgICAgdmFsdWU6IHRoaXMuY2FjaGUuYXR0clJlZGlzRW5kcG9pbnRBZGRyZXNzLFxuICAgICAgZGVzY3JpcHRpb246ICdFbGFzdGlDYWNoZSBSZWRpcyBFbmRwb2ludCcsXG4gICAgICBleHBvcnROYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1jYWNoZS1lbmRwb2ludGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2FjaGVQb3J0Jywge1xuICAgICAgdmFsdWU6IHRoaXMuY2FjaGUuYXR0clJlZGlzRW5kcG9pbnRQb3J0LFxuICAgICAgZGVzY3JpcHRpb246ICdFbGFzdGlDYWNoZSBSZWRpcyBQb3J0JyxcbiAgICB9KTtcbiAgfVxufVxuIl19