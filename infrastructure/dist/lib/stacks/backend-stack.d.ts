import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
export interface BackendStackProps extends cdk.StackProps {
    appName: string;
    environment: string;
    vpc: ec2.IVpc;
    database: rds.IDatabaseInstance;
    cache: elasticache.CfnCacheCluster;
    userPool: cognito.IUserPool;
}
export declare class BackendStack extends cdk.Stack {
    readonly apiUrl: string;
    readonly cluster: ecs.ICluster;
    readonly service: ecsPatterns.ApplicationLoadBalancedFargateService;
    constructor(scope: Construct, id: string, props: BackendStackProps);
}
