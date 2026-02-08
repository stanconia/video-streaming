import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ivs from 'aws-cdk-lib/aws-ivs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export interface MediaStackProps extends cdk.StackProps {
  appName: string;
  environment: string;
  vpc: ec2.IVpc;
  securityGroup: ec2.ISecurityGroup;
}

export class MediaStack extends cdk.Stack {
  public readonly recordingsBucket: s3.IBucket;
  public readonly channelsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: MediaStackProps) {
    super(scope, id, props);

    const { appName, environment } = props;

    // S3 Bucket for VOD recordings
    this.recordingsBucket = new s3.Bucket(this, 'RecordingsBucket', {
      bucketName: `${appName.toLowerCase()}-${environment}-recordings-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'DeleteOldRecordings',
          expiration: cdk.Duration.days(365),
          enabled: environment !== 'prod',
        },
      ],
    });

    // DynamoDB table to store channel information
    this.channelsTable = new dynamodb.Table(this, 'ChannelsTable', {
      tableName: `${appName}-${environment}-channels`,
      partitionKey: {
        name: 'channelId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: environment === 'prod',
      removalPolicy: environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // GSI for querying by teacher
    this.channelsTable.addGlobalSecondaryIndex({
      indexName: 'teacherId-index',
      partitionKey: {
        name: 'teacherId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // GSI for querying active sessions
    this.channelsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'startTime',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // IVS Recording Configuration
    const recordingConfig = new ivs.CfnRecordingConfiguration(this, 'RecordingConfiguration', {
      name: `${appName}-${environment}-recording-config`,
      destinationConfiguration: {
        s3: {
          bucketName: this.recordingsBucket.bucketName,
        },
      },
      thumbnailConfiguration: {
        recordingMode: 'INTERVAL',
        targetIntervalSeconds: 60,
        storage: ['SEQUENTIAL'],
      },
    });

    // Sample IVS Channel (template - channels will be created dynamically by the backend)
    const templateChannel = new ivs.CfnChannel(this, 'TemplateChannel', {
      name: `${appName}-${environment}-template-channel`,
      type: 'STANDARD',
      latencyMode: 'LOW',
      authorized: false,
      recordingConfigurationArn: recordingConfig.attrArn,
    });

    // IAM Role for IVS to write to S3
    const ivsRole = new iam.Role(this, 'IvsS3Role', {
      roleName: `${appName}-${environment}-ivs-s3-role`,
      assumedBy: new iam.ServicePrincipal('ivs.amazonaws.com'),
    });

    this.recordingsBucket.grantReadWrite(ivsRole);

    // Lambda for IVS event handling
    const ivsEventHandler = new lambda.Function(this, 'IvsEventHandler', {
      functionName: `${appName}-${environment}-ivs-event-handler`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log('IVS Event:', JSON.stringify(event, null, 2));

  const detail = event.detail;
  const eventName = detail.event_name;
  const channelArn = detail.channel_arn;

  // Extract channel ID from ARN
  const channelId = channelArn.split('/').pop();

  let status;
  switch (eventName) {
    case 'Stream Start':
      status = 'LIVE';
      break;
    case 'Stream End':
      status = 'ENDED';
      break;
    case 'Recording Start':
      status = 'RECORDING';
      break;
    case 'Recording End':
      status = 'RECORDED';
      break;
    default:
      console.log('Unhandled event:', eventName);
      return { statusCode: 200 };
  }

  try {
    // Update channel status in DynamoDB
    // Note: This is a simplified example. In production, you'd need to
    // query for the session first and then update.
    console.log('Would update channel', channelId, 'to status', status);

    return { statusCode: 200, body: 'Event processed' };
  } catch (error) {
    console.error('Error processing event:', error);
    throw error;
  }
};
      `),
      environment: {
        CHANNELS_TABLE: this.channelsTable.tableName,
        RECORDINGS_BUCKET: this.recordingsBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    this.channelsTable.grantReadWriteData(ivsEventHandler);

    // EventBridge rule for IVS events
    const ivsEventRule = new events.Rule(this, 'IvsEventRule', {
      ruleName: `${appName}-${environment}-ivs-events`,
      description: 'Capture IVS stream events',
      eventPattern: {
        source: ['aws.ivs'],
        detailType: ['IVS Stream State Change', 'IVS Recording State Change'],
      },
    });

    ivsEventRule.addTarget(new targets.LambdaFunction(ivsEventHandler));

    // CloudFront Distribution for recordings playback
    const recordingsDistribution = new cloudfront.Distribution(this, 'RecordingsDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.recordingsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      comment: `${appName} ${environment} - Recordings CDN`,
    });

    // Lambda for generating signed URLs for recordings
    const signedUrlGenerator = new lambda.Function(this, 'SignedUrlGenerator', {
      functionName: `${appName}-${environment}-signed-url-generator`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({});

exports.handler = async (event) => {
  const { key, expiresIn = 3600 } = JSON.parse(event.body || '{}');

  if (!key) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing key parameter' }),
    };
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ url }),
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate signed URL' }),
    };
  }
};
      `),
      environment: {
        BUCKET_NAME: this.recordingsBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    this.recordingsBucket.grantRead(signedUrlGenerator);

    // Chat configuration for IVS (using custom Lambda for chat API)
    const chatHandler = new lambda.Function(this, 'ChatHandler', {
      functionName: `${appName}-${environment}-chat-handler`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
// Chat handler placeholder
// In production, integrate with IVS Chat or use WebSocket API Gateway

exports.handler = async (event) => {
  console.log('Chat event:', JSON.stringify(event, null, 2));

  const { action, roomId, message, userId } = JSON.parse(event.body || '{}');

  switch (action) {
    case 'sendMessage':
      // Broadcast message to room participants
      console.log('Sending message to room', roomId, ':', message);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, messageId: Date.now().toString() }),
      };

    case 'joinRoom':
      console.log('User', userId, 'joining room', roomId);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };

    case 'leaveRoom':
      console.log('User', userId, 'leaving room', roomId);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
      };

    default:
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unknown action' }),
      };
  }
};
      `),
      environment: {
        CHANNELS_TABLE: this.channelsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    this.channelsTable.grantReadWriteData(chatHandler);

    // Outputs
    new cdk.CfnOutput(this, 'RecordingsBucketName', {
      value: this.recordingsBucket.bucketName,
      description: 'S3 Bucket for VOD recordings',
      exportName: `${appName}-${environment}-recordings-bucket`,
    });

    new cdk.CfnOutput(this, 'RecordingsDistributionDomain', {
      value: recordingsDistribution.distributionDomainName,
      description: 'CloudFront domain for recordings',
      exportName: `${appName}-${environment}-recordings-cdn`,
    });

    new cdk.CfnOutput(this, 'ChannelsTableName', {
      value: this.channelsTable.tableName,
      description: 'DynamoDB table for channels',
      exportName: `${appName}-${environment}-channels-table`,
    });

    new cdk.CfnOutput(this, 'RecordingConfigArn', {
      value: recordingConfig.attrArn,
      description: 'IVS Recording Configuration ARN',
      exportName: `${appName}-${environment}-recording-config-arn`,
    });

    new cdk.CfnOutput(this, 'TemplateChannelArn', {
      value: templateChannel.attrArn,
      description: 'Template IVS Channel ARN',
    });

    new cdk.CfnOutput(this, 'TemplateChannelPlaybackUrl', {
      value: templateChannel.attrPlaybackUrl,
      description: 'Template Channel Playback URL',
    });

    new cdk.CfnOutput(this, 'TemplateChannelIngestEndpoint', {
      value: templateChannel.attrIngestEndpoint,
      description: 'Template Channel Ingest Endpoint',
    });

    new cdk.CfnOutput(this, 'IvsEventHandlerArn', {
      value: ivsEventHandler.functionArn,
      description: 'IVS Event Handler Lambda ARN',
    });

    new cdk.CfnOutput(this, 'ChatHandlerArn', {
      value: chatHandler.functionArn,
      description: 'Chat Handler Lambda ARN',
    });
  }
}
