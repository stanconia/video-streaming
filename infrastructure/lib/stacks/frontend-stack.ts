import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
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

export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.IBucket;
  public readonly distribution: cloudfront.IDistribution;
  public readonly websiteUrl: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const {
      appName,
      environment,
      domainName,
      backendUrl,
      backendDnsName,
      userPoolId,
      userPoolClientId,
    } = props;

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
    const distributionProps: cloudfront.DistributionProps = {
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
      // SPA routing handled by CloudFront Function (spaRoutingFunction) — no errorResponses
      // needed. Error responses would mask backend 403/404 for /api/* routes.
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
      (distributionProps as any).certificate = certificate;
      (distributionProps as any).domainNames = [domainName, `www.${domainName}`];
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
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(this.distribution)
        ),
      });

      // A record for www subdomain
      new route53.ARecord(this, 'WwwARecord', {
        zone: hostedZone,
        recordName: `www.${domainName}`,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(this.distribution)
        ),
      });

      this.websiteUrl = `https://${domainName}`;
    } else {
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
