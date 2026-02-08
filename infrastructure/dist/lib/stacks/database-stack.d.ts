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
export declare class DatabaseStack extends cdk.Stack {
    readonly database: rds.IDatabaseInstance;
    readonly cache: elasticache.CfnCacheCluster;
    readonly databaseSecret: secretsmanager.ISecret;
    constructor(scope: Construct, id: string, props: DatabaseStackProps);
}
