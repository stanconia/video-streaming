import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface MediaStackProps extends cdk.StackProps {
    appName: string;
    environment: string;
    vpc: ec2.IVpc;
    securityGroup: ec2.ISecurityGroup;
}
export declare class MediaStack extends cdk.Stack {
    readonly recordingsBucket: s3.IBucket;
    readonly channelsTable: dynamodb.Table;
    constructor(scope: Construct, id: string, props: MediaStackProps);
}
