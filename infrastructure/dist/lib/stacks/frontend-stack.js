"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const iam = require("aws-cdk-lib/aws-iam");
const route53 = require("aws-cdk-lib/aws-route53");
const route53Targets = require("aws-cdk-lib/aws-route53-targets");
const acm = require("aws-cdk-lib/aws-certificatemanager");
class FrontendStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { appName, environment, domainName, backendUrl, backendDnsName, userPoolId, userPoolClientId, } = props;
        // S3 Bucket for frontend assets (served via CloudFront OAI)
        this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
            bucketName: `${appName.toLowerCase()}-${environment}-frontend-${this.account}`,
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            removalPolicy: environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: environment !== 'prod',
            versioned: environment === 'prod',
            cors: [
                {
                    allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
        });
        // Origin Access Identity for CloudFront
        const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
            comment: `OAI for ${appName} ${environment} frontend`,
        });
        // Grant CloudFront access to S3
        this.bucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [this.bucket.arnForObjects('*')],
            principals: [originAccessIdentity.grantPrincipal],
        }));
        // Response Headers Policy for security
        const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeadersPolicy', {
            responseHeadersPolicyName: `${appName}-${environment}-security-headers`,
            securityHeadersBehavior: {
                contentTypeOptions: {
                    override: true,
                },
                frameOptions: {
                    frameOption: cloudfront.HeadersFrameOption.DENY,
                    override: true,
                },
                referrerPolicy: {
                    referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                    override: true,
                },
                strictTransportSecurity: {
                    accessControlMaxAge: cdk.Duration.days(365),
                    includeSubdomains: true,
                    override: true,
                },
                xssProtection: {
                    protection: true,
                    modeBlock: true,
                    override: true,
                },
            },
            customHeadersBehavior: {
                customHeaders: [
                    {
                        header: 'Cache-Control',
                        value: 'no-cache',
                        override: false,
                    },
                ],
            },
        });
        // Cache Policy for static assets
        const staticAssetsCachePolicy = new cloudfront.CachePolicy(this, 'StaticAssetsCachePolicy', {
            cachePolicyName: `${appName}-${environment}-static-assets`,
            comment: 'Cache policy for static assets (JS, CSS, images)',
            defaultTtl: cdk.Duration.days(1),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.hours(1),
            enableAcceptEncodingBrotli: true,
            enableAcceptEncodingGzip: true,
        });
        // CloudFront Function for SPA routing
        const spaRoutingFunction = new cloudfront.Function(this, 'SpaRoutingFunction', {
            functionName: `${appName}-${environment}-spa-routing`,
            code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Check if the URI has a file extension
  if (uri.includes('.')) {
    return request;
  }

  // Rewrite to index.html for SPA routing
  request.uri = '/index.html';
  return request;
}
      `),
        });
        // CloudFront Distribution configuration
        // Use HTTP/1.1 to support WebSocket upgrade through CloudFront
        const distributionProps = {
            httpVersion: cloudfront.HttpVersion.HTTP1_1,
            defaultBehavior: {
                origin: new origins.S3Origin(this.bucket, {
                    originAccessIdentity,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                compress: true,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                responseHeadersPolicy,
                functionAssociations: [
                    {
                        function: spaRoutingFunction,
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                    },
                ],
            },
            additionalBehaviors: {
                '/api/*': {
                    origin: new origins.HttpOrigin(backendDnsName, {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                },
                '/ws/*': {
                    origin: new origins.HttpOrigin(backendDnsName, {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
                },
                '/health': {
                    origin: new origins.HttpOrigin(backendDnsName, {
                        protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                },
                '/static/*': {
                    origin: new origins.S3Origin(this.bucket, {
                        originAccessIdentity,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: staticAssetsCachePolicy,
                    responseHeadersPolicy,
                },
                '/assets/*': {
                    origin: new origins.S3Origin(this.bucket, {
                        originAccessIdentity,
                    }),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cachePolicy: staticAssetsCachePolicy,
                    responseHeadersPolicy,
                },
            },
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            comment: `${appName} ${environment} - Frontend Distribution`,
            defaultRootObject: 'index.html',
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(5),
                },
            ],
            enableLogging: true,
            logBucket: new s3.Bucket(this, 'LogsBucket', {
                bucketName: `${appName.toLowerCase()}-${environment}-cf-logs-${this.account}`,
                encryption: s3.BucketEncryption.S3_MANAGED,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                autoDeleteObjects: true,
                // CloudFront standard logging requires ACL access
                objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
                lifecycleRules: [
                    {
                        expiration: cdk.Duration.days(30),
                    },
                ],
            }),
            logFilePrefix: 'cloudfront/',
        };
        // If custom domain is provided, configure certificate and aliases
        if (domainName) {
            // Look up hosted zone
            const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
                domainName: domainName.split('.').slice(-2).join('.'),
            });
            // Create certificate
            const certificate = new acm.Certificate(this, 'Certificate', {
                domainName,
                subjectAlternativeNames: [`www.${domainName}`],
                validation: acm.CertificateValidation.fromDns(hostedZone),
            });
            // Add certificate and domain to distribution
            distributionProps.certificate = certificate;
            distributionProps.domainNames = [domainName, `www.${domainName}`];
        }
        // Create CloudFront Distribution
        this.distribution = new cloudfront.Distribution(this, 'Distribution', distributionProps);
        // Create Route53 records if custom domain
        if (domainName) {
            const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZoneForRecords', {
                domainName: domainName.split('.').slice(-2).join('.'),
            });
            // A record for apex domain
            new route53.ARecord(this, 'ARecord', {
                zone: hostedZone,
                recordName: domainName,
                target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(this.distribution)),
            });
            // A record for www subdomain
            new route53.ARecord(this, 'WwwARecord', {
                zone: hostedZone,
                recordName: `www.${domainName}`,
                target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(this.distribution)),
            });
            this.websiteUrl = `https://${domainName}`;
        }
        else {
            this.websiteUrl = `https://${this.distribution.distributionDomainName}`;
        }
        // Create config.json with environment variables for the frontend
        const configBucket = new s3.Bucket(this, 'ConfigBucket', {
            bucketName: `${appName.toLowerCase()}-${environment}-config-${this.account}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
        // Deploy config file
        new s3deploy.BucketDeployment(this, 'DeployConfig', {
            sources: [
                s3deploy.Source.jsonData('config.json', {
                    apiUrl: backendUrl,
                    userPoolId,
                    userPoolClientId,
                    region: this.region,
                    environment,
                }),
            ],
            destinationBucket: this.bucket,
            destinationKeyPrefix: '',
            prune: false,
        });
        // Outputs
        new cdk.CfnOutput(this, 'WebsiteBucketName', {
            value: this.bucket.bucketName,
            description: 'S3 Bucket for frontend assets',
            exportName: `${appName}-${environment}-frontend-bucket`,
        });
        new cdk.CfnOutput(this, 'DistributionId', {
            value: this.distribution.distributionId,
            description: 'CloudFront Distribution ID',
            exportName: `${appName}-${environment}-distribution-id`,
        });
        new cdk.CfnOutput(this, 'DistributionDomainName', {
            value: this.distribution.distributionDomainName,
            description: 'CloudFront Distribution Domain',
            exportName: `${appName}-${environment}-distribution-domain`,
        });
        new cdk.CfnOutput(this, 'WebsiteUrl', {
            value: this.websiteUrl,
            description: 'Website URL',
            exportName: `${appName}-${environment}-website-url`,
        });
        // Deployment commands
        new cdk.CfnOutput(this, 'DeployCommand', {
            value: `aws s3 sync ./build s3://${this.bucket.bucketName} --delete`,
            description: 'Command to deploy frontend build',
        });
        new cdk.CfnOutput(this, 'InvalidateCacheCommand', {
            value: `aws cloudfront create-invalidation --distribution-id ${this.distribution.distributionId} --paths "/*"`,
            description: 'Command to invalidate CloudFront cache',
        });
    }
}
exports.FrontendStack = FrontendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvc3RhY2tzL2Zyb250ZW5kLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUNuQyx5Q0FBeUM7QUFDekMsMERBQTBEO0FBQzFELHlEQUF5RDtBQUN6RCw4REFBOEQ7QUFDOUQsMkNBQTJDO0FBQzNDLG1EQUFtRDtBQUNuRCxrRUFBa0U7QUFDbEUsMERBQTBEO0FBYTFELE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBSzFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBeUI7UUFDakUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUNKLE9BQU8sRUFDUCxXQUFXLEVBQ1gsVUFBVSxFQUNWLFVBQVUsRUFDVixjQUFjLEVBQ2QsVUFBVSxFQUNWLGdCQUFnQixHQUNqQixHQUFHLEtBQUssQ0FBQztRQUVWLDREQUE0RDtRQUM1RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ2pELFVBQVUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxXQUFXLGFBQWEsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUM5RSxnQkFBZ0IsRUFBRSxLQUFLO1lBQ3ZCLGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxhQUFhLEVBQUUsV0FBVyxLQUFLLE1BQU07Z0JBQ25DLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07Z0JBQzFCLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87WUFDN0IsaUJBQWlCLEVBQUUsV0FBVyxLQUFLLE1BQU07WUFD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Q0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNwQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDdEIsV0FBVyxFQUFFLGFBQWE7WUFDMUIsVUFBVSxFQUFFLEdBQUcsT0FBTyxJQUFJLFdBQVcsY0FBYztTQUNwRCxDQUFDLENBQUM7UUFFSCxzQkFBc0I7UUFDdEIsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLDRCQUE0QixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsV0FBVztZQUNwRSxXQUFXLEVBQUUsa0NBQWtDO1NBQ2hELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsd0JBQXdCLEVBQUU7WUFDaEQsS0FBSyxFQUFFLHdEQUF3RCxJQUFJLENBQUMsWUFBWSxDQUFDLGNBQWMsZUFBZTtZQUM5RyxXQUFXLEVBQUUsd0NBQXdDO1NBQ3RELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZVRCxzQ0F1VUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50JztcbmltcG9ydCAqIGFzIGNsb3VkZnJvbnQgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnQnO1xuaW1wb3J0ICogYXMgb3JpZ2lucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWRmcm9udC1vcmlnaW5zJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHJvdXRlNTMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMnO1xuaW1wb3J0ICogYXMgcm91dGU1M1RhcmdldHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXJvdXRlNTMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBhY20gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuZXhwb3J0IGludGVyZmFjZSBGcm9udGVuZFN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGFwcE5hbWU6IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgZG9tYWluTmFtZT86IHN0cmluZztcbiAgYmFja2VuZFVybDogc3RyaW5nO1xuICBiYWNrZW5kRG5zTmFtZTogc3RyaW5nO1xuICB1c2VyUG9vbElkOiBzdHJpbmc7XG4gIHVzZXJQb29sQ2xpZW50SWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIEZyb250ZW5kU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0OiBzMy5JQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgZGlzdHJpYnV0aW9uOiBjbG91ZGZyb250LklEaXN0cmlidXRpb247XG4gIHB1YmxpYyByZWFkb25seSB3ZWJzaXRlVXJsOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEZyb250ZW5kU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qge1xuICAgICAgYXBwTmFtZSxcbiAgICAgIGVudmlyb25tZW50LFxuICAgICAgZG9tYWluTmFtZSxcbiAgICAgIGJhY2tlbmRVcmwsXG4gICAgICBiYWNrZW5kRG5zTmFtZSxcbiAgICAgIHVzZXJQb29sSWQsXG4gICAgICB1c2VyUG9vbENsaWVudElkLFxuICAgIH0gPSBwcm9wcztcblxuICAgIC8vIFMzIEJ1Y2tldCBmb3IgZnJvbnRlbmQgYXNzZXRzIChzZXJ2ZWQgdmlhIENsb3VkRnJvbnQgT0FJKVxuICAgIHRoaXMuYnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnV2Vic2l0ZUJ1Y2tldCcsIHtcbiAgICAgIGJ1Y2tldE5hbWU6IGAke2FwcE5hbWUudG9Mb3dlckNhc2UoKX0tJHtlbnZpcm9ubWVudH0tZnJvbnRlbmQtJHt0aGlzLmFjY291bnR9YCxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGVudmlyb25tZW50ID09PSAncHJvZCdcbiAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU5cbiAgICAgICAgOiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IGVudmlyb25tZW50ICE9PSAncHJvZCcsXG4gICAgICB2ZXJzaW9uZWQ6IGVudmlyb25tZW50ID09PSAncHJvZCcsXG4gICAgICBjb3JzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogW3MzLkh0dHBNZXRob2RzLkdFVCwgczMuSHR0cE1ldGhvZHMuSEVBRF0sXG4gICAgICAgICAgYWxsb3dlZE9yaWdpbnM6IFsnKiddLFxuICAgICAgICAgIGFsbG93ZWRIZWFkZXJzOiBbJyonXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBPcmlnaW4gQWNjZXNzIElkZW50aXR5IGZvciBDbG91ZEZyb250XG4gICAgY29uc3Qgb3JpZ2luQWNjZXNzSWRlbnRpdHkgPSBuZXcgY2xvdWRmcm9udC5PcmlnaW5BY2Nlc3NJZGVudGl0eSh0aGlzLCAnT0FJJywge1xuICAgICAgY29tbWVudDogYE9BSSBmb3IgJHthcHBOYW1lfSAke2Vudmlyb25tZW50fSBmcm9udGVuZGAsXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBDbG91ZEZyb250IGFjY2VzcyB0byBTM1xuICAgIHRoaXMuYnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogWydzMzpHZXRPYmplY3QnXSxcbiAgICAgIHJlc291cmNlczogW3RoaXMuYnVja2V0LmFybkZvck9iamVjdHMoJyonKV0sXG4gICAgICBwcmluY2lwYWxzOiBbb3JpZ2luQWNjZXNzSWRlbnRpdHkuZ3JhbnRQcmluY2lwYWxdLFxuICAgIH0pKTtcblxuICAgIC8vIFJlc3BvbnNlIEhlYWRlcnMgUG9saWN5IGZvciBzZWN1cml0eVxuICAgIGNvbnN0IHJlc3BvbnNlSGVhZGVyc1BvbGljeSA9IG5ldyBjbG91ZGZyb250LlJlc3BvbnNlSGVhZGVyc1BvbGljeSh0aGlzLCAnU2VjdXJpdHlIZWFkZXJzUG9saWN5Jywge1xuICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5TmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tc2VjdXJpdHktaGVhZGVyc2AsXG4gICAgICBzZWN1cml0eUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICBjb250ZW50VHlwZU9wdGlvbnM6IHtcbiAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgZnJhbWVPcHRpb25zOiB7XG4gICAgICAgICAgZnJhbWVPcHRpb246IGNsb3VkZnJvbnQuSGVhZGVyc0ZyYW1lT3B0aW9uLkRFTlksXG4gICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHJlZmVycmVyUG9saWN5OiB7XG4gICAgICAgICAgcmVmZXJyZXJQb2xpY3k6IGNsb3VkZnJvbnQuSGVhZGVyc1JlZmVycmVyUG9saWN5LlNUUklDVF9PUklHSU5fV0hFTl9DUk9TU19PUklHSU4sXG4gICAgICAgICAgb3ZlcnJpZGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHN0cmljdFRyYW5zcG9ydFNlY3VyaXR5OiB7XG4gICAgICAgICAgYWNjZXNzQ29udHJvbE1heEFnZTogY2RrLkR1cmF0aW9uLmRheXMoMzY1KSxcbiAgICAgICAgICBpbmNsdWRlU3ViZG9tYWluczogdHJ1ZSxcbiAgICAgICAgICBvdmVycmlkZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgICAgeHNzUHJvdGVjdGlvbjoge1xuICAgICAgICAgIHByb3RlY3Rpb246IHRydWUsXG4gICAgICAgICAgbW9kZUJsb2NrOiB0cnVlLFxuICAgICAgICAgIG92ZXJyaWRlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGN1c3RvbUhlYWRlcnNCZWhhdmlvcjoge1xuICAgICAgICBjdXN0b21IZWFkZXJzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaGVhZGVyOiAnQ2FjaGUtQ29udHJvbCcsXG4gICAgICAgICAgICB2YWx1ZTogJ25vLWNhY2hlJyxcbiAgICAgICAgICAgIG92ZXJyaWRlOiBmYWxzZSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENhY2hlIFBvbGljeSBmb3Igc3RhdGljIGFzc2V0c1xuICAgIGNvbnN0IHN0YXRpY0Fzc2V0c0NhY2hlUG9saWN5ID0gbmV3IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kodGhpcywgJ1N0YXRpY0Fzc2V0c0NhY2hlUG9saWN5Jywge1xuICAgICAgY2FjaGVQb2xpY3lOYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1zdGF0aWMtYXNzZXRzYCxcbiAgICAgIGNvbW1lbnQ6ICdDYWNoZSBwb2xpY3kgZm9yIHN0YXRpYyBhc3NldHMgKEpTLCBDU1MsIGltYWdlcyknLFxuICAgICAgZGVmYXVsdFR0bDogY2RrLkR1cmF0aW9uLmRheXMoMSksXG4gICAgICBtYXhUdGw6IGNkay5EdXJhdGlvbi5kYXlzKDM2NSksXG4gICAgICBtaW5UdGw6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgIGVuYWJsZUFjY2VwdEVuY29kaW5nQnJvdGxpOiB0cnVlLFxuICAgICAgZW5hYmxlQWNjZXB0RW5jb2RpbmdHemlwOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRGcm9udCBGdW5jdGlvbiBmb3IgU1BBIHJvdXRpbmdcbiAgICBjb25zdCBzcGFSb3V0aW5nRnVuY3Rpb24gPSBuZXcgY2xvdWRmcm9udC5GdW5jdGlvbih0aGlzLCAnU3BhUm91dGluZ0Z1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgJHthcHBOYW1lfS0ke2Vudmlyb25tZW50fS1zcGEtcm91dGluZ2AsXG4gICAgICBjb2RlOiBjbG91ZGZyb250LkZ1bmN0aW9uQ29kZS5mcm9tSW5saW5lKGBcbmZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQpIHtcbiAgdmFyIHJlcXVlc3QgPSBldmVudC5yZXF1ZXN0O1xuICB2YXIgdXJpID0gcmVxdWVzdC51cmk7XG5cbiAgLy8gQ2hlY2sgaWYgdGhlIFVSSSBoYXMgYSBmaWxlIGV4dGVuc2lvblxuICBpZiAodXJpLmluY2x1ZGVzKCcuJykpIHtcbiAgICByZXR1cm4gcmVxdWVzdDtcbiAgfVxuXG4gIC8vIFJld3JpdGUgdG8gaW5kZXguaHRtbCBmb3IgU1BBIHJvdXRpbmdcbiAgcmVxdWVzdC51cmkgPSAnL2luZGV4Lmh0bWwnO1xuICByZXR1cm4gcmVxdWVzdDtcbn1cbiAgICAgIGApLFxuICAgIH0pO1xuXG4gICAgLy8gQ2xvdWRGcm9udCBEaXN0cmlidXRpb24gY29uZmlndXJhdGlvblxuICAgIC8vIFVzZSBIVFRQLzEuMSB0byBzdXBwb3J0IFdlYlNvY2tldCB1cGdyYWRlIHRocm91Z2ggQ2xvdWRGcm9udFxuICAgIGNvbnN0IGRpc3RyaWJ1dGlvblByb3BzOiBjbG91ZGZyb250LkRpc3RyaWJ1dGlvblByb3BzID0ge1xuICAgICAgaHR0cFZlcnNpb246IGNsb3VkZnJvbnQuSHR0cFZlcnNpb24uSFRUUDFfMSxcbiAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLlMzT3JpZ2luKHRoaXMuYnVja2V0LCB7XG4gICAgICAgICAgb3JpZ2luQWNjZXNzSWRlbnRpdHksXG4gICAgICAgIH0pLFxuICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgICAgY2FjaGVkTWV0aG9kczogY2xvdWRmcm9udC5DYWNoZWRNZXRob2RzLkNBQ0hFX0dFVF9IRUFEX09QVElPTlMsXG4gICAgICAgIGNvbXByZXNzOiB0cnVlLFxuICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5LFxuICAgICAgICBmdW5jdGlvbkFzc29jaWF0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZ1bmN0aW9uOiBzcGFSb3V0aW5nRnVuY3Rpb24sXG4gICAgICAgICAgICBldmVudFR5cGU6IGNsb3VkZnJvbnQuRnVuY3Rpb25FdmVudFR5cGUuVklFV0VSX1JFUVVFU1QsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBhZGRpdGlvbmFsQmVoYXZpb3JzOiB7XG4gICAgICAgICcvYXBpLyonOiB7XG4gICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKGJhY2tlbmREbnNOYW1lLCB7XG4gICAgICAgICAgICBwcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQX09OTFksXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfQUxMLFxuICAgICAgICAgIGNhY2hlUG9saWN5OiBjbG91ZGZyb250LkNhY2hlUG9saWN5LkNBQ0hJTkdfRElTQUJMRUQsXG4gICAgICAgICAgb3JpZ2luUmVxdWVzdFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5SZXF1ZXN0UG9saWN5LkFMTF9WSUVXRVIsXG4gICAgICAgIH0sXG4gICAgICAgICcvd3MvKic6IHtcbiAgICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLkh0dHBPcmlnaW4oYmFja2VuZERuc05hbWUsIHtcbiAgICAgICAgICAgIHByb3RvY29sUG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblByb3RvY29sUG9saWN5LkhUVFBfT05MWSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogY2xvdWRmcm9udC5BbGxvd2VkTWV0aG9kcy5BTExPV19BTEwsXG4gICAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19ESVNBQkxFRCxcbiAgICAgICAgICBvcmlnaW5SZXF1ZXN0UG9saWN5OiBjbG91ZGZyb250Lk9yaWdpblJlcXVlc3RQb2xpY3kuQUxMX1ZJRVdFUixcbiAgICAgICAgfSxcbiAgICAgICAgJy9oZWFsdGgnOiB7XG4gICAgICAgICAgb3JpZ2luOiBuZXcgb3JpZ2lucy5IdHRwT3JpZ2luKGJhY2tlbmREbnNOYW1lLCB7XG4gICAgICAgICAgICBwcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5PcmlnaW5Qcm90b2NvbFBvbGljeS5IVFRQX09OTFksXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdmlld2VyUHJvdG9jb2xQb2xpY3k6IGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgICAgY2FjaGVQb2xpY3k6IGNsb3VkZnJvbnQuQ2FjaGVQb2xpY3kuQ0FDSElOR19ESVNBQkxFRCxcbiAgICAgICAgfSxcbiAgICAgICAgJy9zdGF0aWMvKic6IHtcbiAgICAgICAgICBvcmlnaW46IG5ldyBvcmlnaW5zLlMzT3JpZ2luKHRoaXMuYnVja2V0LCB7XG4gICAgICAgICAgICBvcmlnaW5BY2Nlc3NJZGVudGl0eSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTogY2xvdWRmcm9udC5WaWV3ZXJQcm90b2NvbFBvbGljeS5SRURJUkVDVF9UT19IVFRQUyxcbiAgICAgICAgICBjYWNoZVBvbGljeTogc3RhdGljQXNzZXRzQ2FjaGVQb2xpY3ksXG4gICAgICAgICAgcmVzcG9uc2VIZWFkZXJzUG9saWN5LFxuICAgICAgICB9LFxuICAgICAgICAnL2Fzc2V0cy8qJzoge1xuICAgICAgICAgIG9yaWdpbjogbmV3IG9yaWdpbnMuUzNPcmlnaW4odGhpcy5idWNrZXQsIHtcbiAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0lkZW50aXR5LFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHZpZXdlclByb3RvY29sUG9saWN5OiBjbG91ZGZyb250LlZpZXdlclByb3RvY29sUG9saWN5LlJFRElSRUNUX1RPX0hUVFBTLFxuICAgICAgICAgIGNhY2hlUG9saWN5OiBzdGF0aWNBc3NldHNDYWNoZVBvbGljeSxcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnNQb2xpY3ksXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcHJpY2VDbGFzczogY2xvdWRmcm9udC5QcmljZUNsYXNzLlBSSUNFX0NMQVNTXzEwMCxcbiAgICAgIGNvbW1lbnQ6IGAke2FwcE5hbWV9ICR7ZW52aXJvbm1lbnR9IC0gRnJvbnRlbmQgRGlzdHJpYnV0aW9uYCxcbiAgICAgIGRlZmF1bHRSb290T2JqZWN0OiAnaW5kZXguaHRtbCcsXG4gICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICB7XG4gICAgICAgICAgaHR0cFN0YXR1czogNDAzLFxuICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6ICcvaW5kZXguaHRtbCcsXG4gICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICByZXNwb25zZVBhZ2VQYXRoOiAnL2luZGV4Lmh0bWwnLFxuICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgZW5hYmxlTG9nZ2luZzogdHJ1ZSxcbiAgICAgIGxvZ0J1Y2tldDogbmV3IHMzLkJ1Y2tldCh0aGlzLCAnTG9nc0J1Y2tldCcsIHtcbiAgICAgICAgYnVja2V0TmFtZTogYCR7YXBwTmFtZS50b0xvd2VyQ2FzZSgpfS0ke2Vudmlyb25tZW50fS1jZi1sb2dzLSR7dGhpcy5hY2NvdW50fWAsXG4gICAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsXG4gICAgICAgIC8vIENsb3VkRnJvbnQgc3RhbmRhcmQgbG9nZ2luZyByZXF1aXJlcyBBQ0wgYWNjZXNzXG4gICAgICAgIG9iamVjdE93bmVyc2hpcDogczMuT2JqZWN0T3duZXJzaGlwLk9CSkVDVF9XUklURVIsXG4gICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICAgIGxvZ0ZpbGVQcmVmaXg6ICdjbG91ZGZyb250LycsXG4gICAgfTtcblxuICAgIC8vIElmIGN1c3RvbSBkb21haW4gaXMgcHJvdmlkZWQsIGNvbmZpZ3VyZSBjZXJ0aWZpY2F0ZSBhbmQgYWxpYXNlc1xuICAgIGlmIChkb21haW5OYW1lKSB7XG4gICAgICAvLyBMb29rIHVwIGhvc3RlZCB6b25lXG4gICAgICBjb25zdCBob3N0ZWRab25lID0gcm91dGU1My5Ib3N0ZWRab25lLmZyb21Mb29rdXAodGhpcywgJ0hvc3RlZFpvbmUnLCB7XG4gICAgICAgIGRvbWFpbk5hbWU6IGRvbWFpbk5hbWUuc3BsaXQoJy4nKS5zbGljZSgtMikuam9pbignLicpLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIENyZWF0ZSBjZXJ0aWZpY2F0ZVxuICAgICAgY29uc3QgY2VydGlmaWNhdGUgPSBuZXcgYWNtLkNlcnRpZmljYXRlKHRoaXMsICdDZXJ0aWZpY2F0ZScsIHtcbiAgICAgICAgZG9tYWluTmFtZSxcbiAgICAgICAgc3ViamVjdEFsdGVybmF0aXZlTmFtZXM6IFtgd3d3LiR7ZG9tYWluTmFtZX1gXSxcbiAgICAgICAgdmFsaWRhdGlvbjogYWNtLkNlcnRpZmljYXRlVmFsaWRhdGlvbi5mcm9tRG5zKGhvc3RlZFpvbmUpLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEFkZCBjZXJ0aWZpY2F0ZSBhbmQgZG9tYWluIHRvIGRpc3RyaWJ1dGlvblxuICAgICAgKGRpc3RyaWJ1dGlvblByb3BzIGFzIGFueSkuY2VydGlmaWNhdGUgPSBjZXJ0aWZpY2F0ZTtcbiAgICAgIChkaXN0cmlidXRpb25Qcm9wcyBhcyBhbnkpLmRvbWFpbk5hbWVzID0gW2RvbWFpbk5hbWUsIGB3d3cuJHtkb21haW5OYW1lfWBdO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBDbG91ZEZyb250IERpc3RyaWJ1dGlvblxuICAgIHRoaXMuZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKHRoaXMsICdEaXN0cmlidXRpb24nLCBkaXN0cmlidXRpb25Qcm9wcyk7XG5cbiAgICAvLyBDcmVhdGUgUm91dGU1MyByZWNvcmRzIGlmIGN1c3RvbSBkb21haW5cbiAgICBpZiAoZG9tYWluTmFtZSkge1xuICAgICAgY29uc3QgaG9zdGVkWm9uZSA9IHJvdXRlNTMuSG9zdGVkWm9uZS5mcm9tTG9va3VwKHRoaXMsICdIb3N0ZWRab25lRm9yUmVjb3JkcycsIHtcbiAgICAgICAgZG9tYWluTmFtZTogZG9tYWluTmFtZS5zcGxpdCgnLicpLnNsaWNlKC0yKS5qb2luKCcuJyksXG4gICAgICB9KTtcblxuICAgICAgLy8gQSByZWNvcmQgZm9yIGFwZXggZG9tYWluXG4gICAgICBuZXcgcm91dGU1My5BUmVjb3JkKHRoaXMsICdBUmVjb3JkJywge1xuICAgICAgICB6b25lOiBob3N0ZWRab25lLFxuICAgICAgICByZWNvcmROYW1lOiBkb21haW5OYW1lLFxuICAgICAgICB0YXJnZXQ6IHJvdXRlNTMuUmVjb3JkVGFyZ2V0LmZyb21BbGlhcyhcbiAgICAgICAgICBuZXcgcm91dGU1M1RhcmdldHMuQ2xvdWRGcm9udFRhcmdldCh0aGlzLmRpc3RyaWJ1dGlvbilcbiAgICAgICAgKSxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBIHJlY29yZCBmb3Igd3d3IHN1YmRvbWFpblxuICAgICAgbmV3IHJvdXRlNTMuQVJlY29yZCh0aGlzLCAnV3d3QVJlY29yZCcsIHtcbiAgICAgICAgem9uZTogaG9zdGVkWm9uZSxcbiAgICAgICAgcmVjb3JkTmFtZTogYHd3dy4ke2RvbWFpbk5hbWV9YCxcbiAgICAgICAgdGFyZ2V0OiByb3V0ZTUzLlJlY29yZFRhcmdldC5mcm9tQWxpYXMoXG4gICAgICAgICAgbmV3IHJvdXRlNTNUYXJnZXRzLkNsb3VkRnJvbnRUYXJnZXQodGhpcy5kaXN0cmlidXRpb24pXG4gICAgICAgICksXG4gICAgICB9KTtcblxuICAgICAgdGhpcy53ZWJzaXRlVXJsID0gYGh0dHBzOi8vJHtkb21haW5OYW1lfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMud2Vic2l0ZVVybCA9IGBodHRwczovLyR7dGhpcy5kaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZX1gO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBjb25maWcuanNvbiB3aXRoIGVudmlyb25tZW50IHZhcmlhYmxlcyBmb3IgdGhlIGZyb250ZW5kXG4gICAgY29uc3QgY29uZmlnQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCAnQ29uZmlnQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYCR7YXBwTmFtZS50b0xvd2VyQ2FzZSgpfS0ke2Vudmlyb25tZW50fS1jb25maWctJHt0aGlzLmFjY291bnR9YCxcbiAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uUzNfTUFOQUdFRCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBhdXRvRGVsZXRlT2JqZWN0czogdHJ1ZSxcbiAgICB9KTtcblxuICAgIC8vIERlcGxveSBjb25maWcgZmlsZVxuICAgIG5ldyBzM2RlcGxveS5CdWNrZXREZXBsb3ltZW50KHRoaXMsICdEZXBsb3lDb25maWcnLCB7XG4gICAgICBzb3VyY2VzOiBbXG4gICAgICAgIHMzZGVwbG95LlNvdXJjZS5qc29uRGF0YSgnY29uZmlnLmpzb24nLCB7XG4gICAgICAgICAgYXBpVXJsOiBiYWNrZW5kVXJsLFxuICAgICAgICAgIHVzZXJQb29sSWQsXG4gICAgICAgICAgdXNlclBvb2xDbGllbnRJZCxcbiAgICAgICAgICByZWdpb246IHRoaXMucmVnaW9uLFxuICAgICAgICAgIGVudmlyb25tZW50LFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgICBkZXN0aW5hdGlvbkJ1Y2tldDogdGhpcy5idWNrZXQsXG4gICAgICBkZXN0aW5hdGlvbktleVByZWZpeDogJycsXG4gICAgICBwcnVuZTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXRzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1dlYnNpdGVCdWNrZXROYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuYnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ1MzIEJ1Y2tldCBmb3IgZnJvbnRlbmQgYXNzZXRzJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LWZyb250ZW5kLWJ1Y2tldGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGlzdHJpYnV0aW9uSWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5kaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Nsb3VkRnJvbnQgRGlzdHJpYnV0aW9uIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LWRpc3RyaWJ1dGlvbi1pZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGlzdHJpYnV0aW9uRG9tYWluTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBEb21haW4nLFxuICAgICAgZXhwb3J0TmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tZGlzdHJpYnV0aW9uLWRvbWFpbmAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnV2Vic2l0ZVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLndlYnNpdGVVcmwsXG4gICAgICBkZXNjcmlwdGlvbjogJ1dlYnNpdGUgVVJMJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LXdlYnNpdGUtdXJsYCxcbiAgICB9KTtcblxuICAgIC8vIERlcGxveW1lbnQgY29tbWFuZHNcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGVwbG95Q29tbWFuZCcsIHtcbiAgICAgIHZhbHVlOiBgYXdzIHMzIHN5bmMgLi9idWlsZCBzMzovLyR7dGhpcy5idWNrZXQuYnVja2V0TmFtZX0gLS1kZWxldGVgLFxuICAgICAgZGVzY3JpcHRpb246ICdDb21tYW5kIHRvIGRlcGxveSBmcm9udGVuZCBidWlsZCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSW52YWxpZGF0ZUNhY2hlQ29tbWFuZCcsIHtcbiAgICAgIHZhbHVlOiBgYXdzIGNsb3VkZnJvbnQgY3JlYXRlLWludmFsaWRhdGlvbiAtLWRpc3RyaWJ1dGlvbi1pZCAke3RoaXMuZGlzdHJpYnV0aW9uLmRpc3RyaWJ1dGlvbklkfSAtLXBhdGhzIFwiLypcImAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hbmQgdG8gaW52YWxpZGF0ZSBDbG91ZEZyb250IGNhY2hlJyxcbiAgICB9KTtcbiAgfVxufVxuIl19