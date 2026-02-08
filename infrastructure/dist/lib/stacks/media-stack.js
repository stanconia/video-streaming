"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const iam = require("aws-cdk-lib/aws-iam");
const ivs = require("aws-cdk-lib/aws-ivs");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
class MediaStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.MediaStack = MediaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWEtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvc3RhY2tzL21lZGlhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyx5Q0FBeUM7QUFDekMsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQyx5REFBeUQ7QUFDekQsOERBQThEO0FBQzlELGlEQUFpRDtBQUNqRCxxREFBcUQ7QUFDckQsaURBQWlEO0FBQ2pELDBEQUEwRDtBQVUxRCxNQUFhLFVBQVcsU0FBUSxHQUFHLENBQUMsS0FBSztJQUl2QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRXZDLCtCQUErQjtRQUMvQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUM5RCxVQUFVLEVBQUUsR0FBRyxPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksV0FBVyxlQUFlLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEYsVUFBVSxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVO1lBQzFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELFNBQVMsRUFBRSxLQUFLO1lBQ2hCLGFBQWEsRUFBRSxXQUFXLEtBQUssTUFBTTtnQkFDbkMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtnQkFDMUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztZQUM3QixpQkFBaUIsRUFBRSxXQUFXLEtBQUssTUFBTTtZQUN6QyxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsRUFBRSxFQUFFLGdCQUFnQjtv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LFNBQVMsQ0FBQyxJQUFJLEVBQUUsK0JBQStCLEVBQUU7WUFDdkQsS0FBSyxFQUFFLGVBQWUsQ0FBQyxrQkFBa0I7WUFDekMsV0FBVyxFQUFFLGtDQUFrQztTQUNoRCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxlQUFlLENBQUMsV0FBVztZQUNsQyxXQUFXLEVBQUUsOEJBQThCO1NBQzVDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDeEMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxXQUFXO1lBQzlCLFdBQVcsRUFBRSx5QkFBeUI7U0FDdkMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBeFdELGdDQXdXQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgaXZzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pdnMnO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udCc7XG5pbXBvcnQgKiBhcyBvcmlnaW5zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGV2ZW50cyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZXZlbnRzJztcbmltcG9ydCAqIGFzIHRhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1lZGlhU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgYXBwTmFtZTogc3RyaW5nO1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICB2cGM6IGVjMi5JVnBjO1xuICBzZWN1cml0eUdyb3VwOiBlYzIuSVNlY3VyaXR5R3JvdXA7XG59XG5cbmV4cG9ydCBjbGFzcyBNZWRpYVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHJlY29yZGluZ3NCdWNrZXQ6IHMzLklCdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBjaGFubmVsc1RhYmxlOiBkeW5hbW9kYi5UYWJsZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTWVkaWFTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB7IGFwcE5hbWUsIGVudmlyb25tZW50IH0gPSBwcm9wcztcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgVk9EIHJlY29yZGluZ3NcbiAgICB0aGlzLnJlY29yZGluZ3NCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdSZWNvcmRpbmdzQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYCR7YXBwTmFtZS50b0xvd2VyQ2FzZSgpfS0ke2Vudmlyb25tZW50fS1yZWNvcmRpbmdzLSR7dGhpcy5hY2NvdW50fWAsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgdmVyc2lvbmVkOiBmYWxzZSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGVudmlyb25tZW50ID09PSAncHJvZCdcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU5cbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IGVudmlyb25tZW50ICE9PSAncHJvZCcsXG4gICAgICBsaWZlY3ljbGVSdWxlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6ICdUcmFuc2l0aW9uVG9JQScsXG4gICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuSU5GUkVRVUVOVF9BQ0NFU1MsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuR0xBQ0lFUixcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cyg5MCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ0RlbGV0ZU9sZFJlY29yZGluZ3MnLFxuICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDM2NSksXG4gICAgICAgICAgZW5hYmxlZDogZW52aXJvbm1lbnQgIT09ICdwcm9kJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBEeW5hbW9EQiB0YWJsZSB0byBzdG9yZSBjaGFubmVsIGluZm9ybWF0aW9uXG4gICAgdGhpcy5jaGFubmVsc1RhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdDaGFubmVsc1RhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1jaGFubmVsc2AsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ2NoYW5uZWxJZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIHNvcnRLZXk6IHtcbiAgICAgICAgbmFtZTogJ3Nlc3Npb25JZCcsXG4gICAgICAgIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HLFxuICAgICAgfSxcbiAgICAgIGJpbGxpbmdNb2RlOiBkeW5hbW9kYi5CaWxsaW5nTW9kZS5QQVlfUEVSX1JFUVVFU1QsXG4gICAgICBwb2ludEluVGltZVJlY292ZXJ5OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnLFxuICAgICAgcmVtb3ZhbFBvbGljeTogZW52aXJvbm1lbnQgPT09ICdwcm9kJ1xuICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTlxuICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBzdHJlYW06IGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlLk5FV19BTkRfT0xEX0lNQUdFUyxcbiAgICB9KTtcblxuICAgIC8vIEdTSSBmb3IgcXVlcnlpbmcgYnkgdGVhY2hlclxuICAgIHRoaXMuY2hhbm5lbHNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICd0ZWFjaGVySWQtaW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICd0ZWFjaGVySWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdjcmVhdGVkQXQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHU0kgZm9yIHF1ZXJ5aW5nIGFjdGl2ZSBzZXNzaW9uc1xuICAgIHRoaXMuY2hhbm5lbHNUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdzdGF0dXMtaW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdzdGF0dXMnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICdzdGFydFRpbWUnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBJVlMgUmVjb3JkaW5nIENvbmZpZ3VyYXRpb25cbiAgICBjb25zdCByZWNvcmRpbmdDb25maWcgPSBuZXcgaXZzLkNmblJlY29yZGluZ0NvbmZpZ3VyYXRpb24odGhpcywgJ1JlY29yZGluZ0NvbmZpZ3VyYXRpb24nLCB7XG4gICAgICBuYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1yZWNvcmRpbmctY29uZmlnYCxcbiAgICAgIGRlc3RpbmF0aW9uQ29uZmlndXJhdGlvbjoge1xuICAgICAgICBzMzoge1xuICAgICAgICAgIGJ1Y2tldE5hbWU6IHRoaXMucmVjb3JkaW5nc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHRodW1ibmFpbENvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgcmVjb3JkaW5nTW9kZTogJ0lOVEVSVkFMJyxcbiAgICAgICAgdGFyZ2V0SW50ZXJ2YWxTZWNvbmRzOiA2MCxcbiAgICAgICAgc3RvcmFnZTogWydTRVFVRU5USUFMJ10sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gU2FtcGxlIElWUyBDaGFubmVsICh0ZW1wbGF0ZSAtIGNoYW5uZWxzIHdpbGwgYmUgY3JlYXRlZCBkeW5hbWljYWxseSBieSB0aGUgYmFja2VuZClcbiAgICBjb25zdCB0ZW1wbGF0ZUNoYW5uZWwgPSBuZXcgaXZzLkNmbkNoYW5uZWwodGhpcywgJ1RlbXBsYXRlQ2hhbm5lbCcsIHtcbiAgICAgIG5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LXRlbXBsYXRlLWNoYW5uZWxgLFxuICAgICAgdHlwZTogJ1NUQU5EQVJEJyxcbiAgICAgIGxhdGVuY3lNb2RlOiAnTE9XJyxcbiAgICAgIGF1dGhvcml6ZWQ6IGZhbHNlLFxuICAgICAgcmVjb3JkaW5nQ29uZmlndXJhdGlvbkFybjogcmVjb3JkaW5nQ29uZmlnLmF0dHJBcm4sXG4gICAgfSk7XG5cbiAgICAvLyBJQU0gUm9sZSBmb3IgSVZTIHRvIHdyaXRlIHRvIFMzXG4gICAgY29uc3QgaXZzUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnSXZzUzNSb2xlJywge1xuICAgICAgcm9sZU5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LWl2cy1zMy1yb2xlYCxcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdpdnMuYW1hem9uYXdzLmNvbScpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5yZWNvcmRpbmdzQnVja2V0LmdyYW50UmVhZFdyaXRlKGl2c1JvbGUpO1xuXG4gICAgLy8gTGFtYmRhIGZvciBJVlMgZXZlbnQgaGFuZGxpbmdcbiAgICBjb25zdCBpdnNFdmVudEhhbmRsZXIgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdJdnNFdmVudEhhbmRsZXInLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LWl2cy1ldmVudC1oYW5kbGVyYCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXG5jb25zdCB7IER5bmFtb0RCQ2xpZW50LCBVcGRhdGVJdGVtQ29tbWFuZCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJyk7XG5cbmNvbnN0IGNsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5cbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xuICBjb25zb2xlLmxvZygnSVZTIEV2ZW50OicsIEpTT04uc3RyaW5naWZ5KGV2ZW50LCBudWxsLCAyKSk7XG5cbiAgY29uc3QgZGV0YWlsID0gZXZlbnQuZGV0YWlsO1xuICBjb25zdCBldmVudE5hbWUgPSBkZXRhaWwuZXZlbnRfbmFtZTtcbiAgY29uc3QgY2hhbm5lbEFybiA9IGRldGFpbC5jaGFubmVsX2FybjtcblxuICAvLyBFeHRyYWN0IGNoYW5uZWwgSUQgZnJvbSBBUk5cbiAgY29uc3QgY2hhbm5lbElkID0gY2hhbm5lbEFybi5zcGxpdCgnLycpLnBvcCgpO1xuXG4gIGxldCBzdGF0dXM7XG4gIHN3aXRjaCAoZXZlbnROYW1lKSB7XG4gICAgY2FzZSAnU3RyZWFtIFN0YXJ0JzpcbiAgICAgIHN0YXR1cyA9ICdMSVZFJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ1N0cmVhbSBFbmQnOlxuICAgICAgc3RhdHVzID0gJ0VOREVEJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ1JlY29yZGluZyBTdGFydCc6XG4gICAgICBzdGF0dXMgPSAnUkVDT1JESU5HJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ1JlY29yZGluZyBFbmQnOlxuICAgICAgc3RhdHVzID0gJ1JFQ09SREVEJztcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zb2xlLmxvZygnVW5oYW5kbGVkIGV2ZW50OicsIGV2ZW50TmFtZSk7XG4gICAgICByZXR1cm4geyBzdGF0dXNDb2RlOiAyMDAgfTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgLy8gVXBkYXRlIGNoYW5uZWwgc3RhdHVzIGluIER5bmFtb0RCXG4gICAgLy8gTm90ZTogVGhpcyBpcyBhIHNpbXBsaWZpZWQgZXhhbXBsZS4gSW4gcHJvZHVjdGlvbiwgeW91J2QgbmVlZCB0b1xuICAgIC8vIHF1ZXJ5IGZvciB0aGUgc2Vzc2lvbiBmaXJzdCBhbmQgdGhlbiB1cGRhdGUuXG4gICAgY29uc29sZS5sb2coJ1dvdWxkIHVwZGF0ZSBjaGFubmVsJywgY2hhbm5lbElkLCAndG8gc3RhdHVzJywgc3RhdHVzKTtcblxuICAgIHJldHVybiB7IHN0YXR1c0NvZGU6IDIwMCwgYm9keTogJ0V2ZW50IHByb2Nlc3NlZCcgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIGV2ZW50OicsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcbiAgICAgIGApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQ0hBTk5FTFNfVEFCTEU6IHRoaXMuY2hhbm5lbHNUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgIFJFQ09SRElOR1NfQlVDS0VUOiB0aGlzLnJlY29yZGluZ3NCdWNrZXQuYnVja2V0TmFtZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygzMCksXG4gICAgfSk7XG5cbiAgICB0aGlzLmNoYW5uZWxzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGl2c0V2ZW50SGFuZGxlcik7XG5cbiAgICAvLyBFdmVudEJyaWRnZSBydWxlIGZvciBJVlMgZXZlbnRzXG4gICAgY29uc3QgaXZzRXZlbnRSdWxlID0gbmV3IGV2ZW50cy5SdWxlKHRoaXMsICdJdnNFdmVudFJ1bGUnLCB7XG4gICAgICBydWxlTmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0taXZzLWV2ZW50c2AsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NhcHR1cmUgSVZTIHN0cmVhbSBldmVudHMnLFxuICAgICAgZXZlbnRQYXR0ZXJuOiB7XG4gICAgICAgIHNvdXJjZTogWydhd3MuaXZzJ10sXG4gICAgICAgIGRldGFpbFR5cGU6IFsnSVZTIFN0cmVhbSBTdGF0ZSBDaGFuZ2UnLCAnSVZTIFJlY29yZGluZyBTdGF0ZSBDaGFuZ2UnXSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBpdnNFdmVudFJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGl2c0V2ZW50SGFuZGxlcikpO1xuXG4gICAgLy8gQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gZm9yIHJlY29yZGluZ3MgcGxheWJhY2tcbiAgICBjb25zdCByZWNvcmRpbmdzRGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdSZWNvcmRpbmdzRGlzdHJpYnV0aW9uJywge1xuICAgICAgZGVmYXVsdEJlaGF2aW9yOiB7XG4gICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuUzNPcmlnaW4odGhpcy5yZWNvcmRpbmdzQnVja2V0KSxcbiAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgIGFsbG93ZWRNZXRob2RzOiBjbG91ZGZyb250LkFsbG93ZWRNZXRob2RzLkFMTE9XX0dFVF9IRUFELFxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgIH0sXG4gICAgICBwcmljZUNsYXNzOiBjbG91ZGZyb250LlByaWNlQ2xhc3MuUFJJQ0VfQ0xBU1NfMTAwLFxuICAgICAgY29tbWVudDogYCR7YXBwTmFtZX0gJHtlbnZpcm9ubWVudH0gLSBSZWNvcmRpbmdzIENETmAsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgZm9yIGdlbmVyYXRpbmcgc2lnbmVkIFVSTHMgZm9yIHJlY29yZGluZ3NcbiAgICBjb25zdCBzaWduZWRVcmxHZW5lcmF0b3IgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdTaWduZWRVcmxHZW5lcmF0b3InLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LXNpZ25lZC11cmwtZ2VuZXJhdG9yYCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXG5jb25zdCB7IGdldFNpZ25lZFVybCB9ID0gcmVxdWlyZSgnQGF3cy1zZGsvczMtcmVxdWVzdC1wcmVzaWduZXInKTtcbmNvbnN0IHsgUzNDbGllbnQsIEdldE9iamVjdENvbW1hbmQgfSA9IHJlcXVpcmUoJ0Bhd3Mtc2RrL2NsaWVudC1zMycpO1xuXG5jb25zdCBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCh7fSk7XG5cbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCkgPT4ge1xuICBjb25zdCB7IGtleSwgZXhwaXJlc0luID0gMzYwMCB9ID0gSlNPTi5wYXJzZShldmVudC5ib2R5IHx8ICd7fScpO1xuXG4gIGlmICgha2V5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDQwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIGtleSBwYXJhbWV0ZXInIH0pLFxuICAgIH07XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0T2JqZWN0Q29tbWFuZCh7XG4gICAgICBCdWNrZXQ6IHByb2Nlc3MuZW52LkJVQ0tFVF9OQU1FLFxuICAgICAgS2V5OiBrZXksXG4gICAgfSk7XG5cbiAgICBjb25zdCB1cmwgPSBhd2FpdCBnZXRTaWduZWRVcmwoczNDbGllbnQsIGNvbW1hbmQsIHsgZXhwaXJlc0luIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHVybCB9KSxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdlbmVyYXRpbmcgc2lnbmVkIFVSTDonLCBlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdGYWlsZWQgdG8gZ2VuZXJhdGUgc2lnbmVkIFVSTCcgfSksXG4gICAgfTtcbiAgfVxufTtcbiAgICAgIGApLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgQlVDS0VUX05BTUU6IHRoaXMucmVjb3JkaW5nc0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgfSxcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICB9KTtcblxuICAgIHRoaXMucmVjb3JkaW5nc0J1Y2tldC5ncmFudFJlYWQoc2lnbmVkVXJsR2VuZXJhdG9yKTtcblxuICAgIC8vIENoYXQgY29uZmlndXJhdGlvbiBmb3IgSVZTICh1c2luZyBjdXN0b20gTGFtYmRhIGZvciBjaGF0IEFQSSlcbiAgICBjb25zdCBjaGF0SGFuZGxlciA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NoYXRIYW5kbGVyJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1jaGF0LWhhbmRsZXJgLFxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzIwX1gsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbi8vIENoYXQgaGFuZGxlciBwbGFjZWhvbGRlclxuLy8gSW4gcHJvZHVjdGlvbiwgaW50ZWdyYXRlIHdpdGggSVZTIENoYXQgb3IgdXNlIFdlYlNvY2tldCBBUEkgR2F0ZXdheVxuXG5leHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgY29uc29sZS5sb2coJ0NoYXQgZXZlbnQ6JywgSlNPTi5zdHJpbmdpZnkoZXZlbnQsIG51bGwsIDIpKTtcblxuICBjb25zdCB7IGFjdGlvbiwgcm9vbUlkLCBtZXNzYWdlLCB1c2VySWQgfSA9IEpTT04ucGFyc2UoZXZlbnQuYm9keSB8fCAne30nKTtcblxuICBzd2l0Y2ggKGFjdGlvbikge1xuICAgIGNhc2UgJ3NlbmRNZXNzYWdlJzpcbiAgICAgIC8vIEJyb2FkY2FzdCBtZXNzYWdlIHRvIHJvb20gcGFydGljaXBhbnRzXG4gICAgICBjb25zb2xlLmxvZygnU2VuZGluZyBtZXNzYWdlIHRvIHJvb20nLCByb29tSWQsICc6JywgbWVzc2FnZSk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZUlkOiBEYXRlLm5vdygpLnRvU3RyaW5nKCkgfSksXG4gICAgICB9O1xuXG4gICAgY2FzZSAnam9pblJvb20nOlxuICAgICAgY29uc29sZS5sb2coJ1VzZXInLCB1c2VySWQsICdqb2luaW5nIHJvb20nLCByb29tSWQpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUgfSksXG4gICAgICB9O1xuXG4gICAgY2FzZSAnbGVhdmVSb29tJzpcbiAgICAgIGNvbnNvbGUubG9nKCdVc2VyJywgdXNlcklkLCAnbGVhdmluZyByb29tJywgcm9vbUlkKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1c0NvZGU6IDIwMCxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlIH0pLFxuICAgICAgfTtcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiA0MDAsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdVbmtub3duIGFjdGlvbicgfSksXG4gICAgICB9O1xuICB9XG59O1xuICAgICAgYCksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBDSEFOTkVMU19UQUJMRTogdGhpcy5jaGFubmVsc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIH0sXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24uc2Vjb25kcygxMCksXG4gICAgfSk7XG5cbiAgICB0aGlzLmNoYW5uZWxzVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNoYXRIYW5kbGVyKTtcblxuICAgIC8vIE91dHB1dHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUmVjb3JkaW5nc0J1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5yZWNvcmRpbmdzQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEJ1Y2tldCBmb3IgVk9EIHJlY29yZGluZ3MnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tcmVjb3JkaW5ncy1idWNrZXRgLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1JlY29yZGluZ3NEaXN0cmlidXRpb25Eb21haW4nLCB7XG4gICAgICB2YWx1ZTogcmVjb3JkaW5nc0Rpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IGRvbWFpbiBmb3IgcmVjb3JkaW5ncycsXG4gICAgICBleHBvcnROYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1yZWNvcmRpbmdzLWNkbmAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnQ2hhbm5lbHNUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5jaGFubmVsc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRHluYW1vREIgdGFibGUgZm9yIGNoYW5uZWxzJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LWNoYW5uZWxzLXRhYmxlYCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdSZWNvcmRpbmdDb25maWdBcm4nLCB7XG4gICAgICB2YWx1ZTogcmVjb3JkaW5nQ29uZmlnLmF0dHJBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0lWUyBSZWNvcmRpbmcgQ29uZmlndXJhdGlvbiBBUk4nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tcmVjb3JkaW5nLWNvbmZpZy1hcm5gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1RlbXBsYXRlQ2hhbm5lbEFybicsIHtcbiAgICAgIHZhbHVlOiB0ZW1wbGF0ZUNoYW5uZWwuYXR0ckFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGVtcGxhdGUgSVZTIENoYW5uZWwgQVJOJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdUZW1wbGF0ZUNoYW5uZWxQbGF5YmFja1VybCcsIHtcbiAgICAgIHZhbHVlOiB0ZW1wbGF0ZUNoYW5uZWwuYXR0clBsYXliYWNrVXJsLFxuICAgICAgZGVzY3JpcHRpb246ICdUZW1wbGF0ZSBDaGFubmVsIFBsYXliYWNrIFVSTCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVGVtcGxhdGVDaGFubmVsSW5nZXN0RW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogdGVtcGxhdGVDaGFubmVsLmF0dHJJbmdlc3RFbmRwb2ludCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVGVtcGxhdGUgQ2hhbm5lbCBJbmdlc3QgRW5kcG9pbnQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0l2c0V2ZW50SGFuZGxlckFybicsIHtcbiAgICAgIHZhbHVlOiBpdnNFdmVudEhhbmRsZXIuZnVuY3Rpb25Bcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0lWUyBFdmVudCBIYW5kbGVyIExhbWJkYSBBUk4nLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0NoYXRIYW5kbGVyQXJuJywge1xuICAgICAgdmFsdWU6IGNoYXRIYW5kbGVyLmZ1bmN0aW9uQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdDaGF0IEhhbmRsZXIgTGFtYmRhIEFSTicsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==