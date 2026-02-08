import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
export interface AuthStackProps extends cdk.StackProps {
    appName: string;
    environment: string;
}
export declare class AuthStack extends cdk.Stack {
    readonly userPool: cognito.IUserPool;
    readonly userPoolClient: cognito.IUserPoolClient;
    readonly identityPool: cognito.CfnIdentityPool;
    constructor(scope: Construct, id: string, props: AuthStackProps);
}
