import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly mediaSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { appName, environment } = props;

    // VPC with public and private subnets across 2 AZs
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${appName}-${environment}-vpc`,
      maxAzs: 2,
      natGateways: environment === 'prod' ? 2 : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for Database
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${appName}-${environment}-database-sg`,
      description: 'Security group for database',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL from within VPC (private subnets)
    this.databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Allow Redis from within VPC (private subnets)
    this.databaseSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis from VPC'
    );

    // Security Group for Media Server
    this.mediaSecurityGroup = new ec2.SecurityGroup(this, 'MediaSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${appName}-${environment}-media-sg`,
      description: 'Security group for media services',
      allowAllOutbound: true,
    });

    // Allow RTMP ingest (for live streaming)
    this.mediaSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(1935),
      'Allow RTMP ingest'
    );

    // Allow WebRTC (UDP range)
    this.mediaSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udpRange(10000, 20000),
      'Allow WebRTC UDP'
    );

    // Allow HTTPS for HLS/DASH streaming
    this.mediaSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS streaming'
    );

    // VPC Endpoints for AWS services (reduces NAT costs)
    // S3 Gateway Endpoint
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // DynamoDB Gateway Endpoint
    this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Security Group for VPC Endpoints
    const endpointSecurityGroup = new ec2.SecurityGroup(this, 'EndpointSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${appName}-${environment}-endpoint-sg`,
      description: 'Security group for VPC endpoints',
      allowAllOutbound: true,
    });

    // Allow HTTPS from within VPC for interface endpoints
    endpointSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // ECR Interface Endpoints (for pulling container images)
    this.vpc.addInterfaceEndpoint('EcrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      securityGroups: [endpointSecurityGroup],
    });

    this.vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      securityGroups: [endpointSecurityGroup],
    });

    // CloudWatch Logs Endpoint
    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      securityGroups: [endpointSecurityGroup],
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${appName}-${environment}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
    });
  }
}
