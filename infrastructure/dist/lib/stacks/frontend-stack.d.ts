import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
export interface FrontendStackProps extends cdk.StackProps {
    appName: string;
    environment: string;
    domainName?: string;
    backendUrl: string;
    backendDnsName: string;
    userPoolId: string;
    userPoolClientId: string;
}
export declare class FrontendStack extends cdk.Stack {
    readonly bucket: s3.IBucket;
    readonly distribution: cloudfront.IDistribution;
    readonly websiteUrl: string;
    constructor(scope: Construct, id: string, props: FrontendStackProps);
}
