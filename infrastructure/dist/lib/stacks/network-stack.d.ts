import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export interface NetworkStackProps extends cdk.StackProps {
    appName: string;
    environment: string;
}
export declare class NetworkStack extends cdk.Stack {
    readonly vpc: ec2.IVpc;
    readonly databaseSecurityGroup: ec2.SecurityGroup;
    readonly mediaSecurityGroup: ec2.ISecurityGroup;
    constructor(scope: Construct, id: string, props: NetworkStackProps);
}
