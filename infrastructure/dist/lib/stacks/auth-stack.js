"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthStack = void 0;
const cdk = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
class AuthStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { appName, environment } = props;
        // Cognito User Pool
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: `${appName}-${environment}-user-pool`,
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
                username: true,
            },
            autoVerify: {
                email: true,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: true,
                },
                givenName: {
                    required: true,
                    mutable: true,
                },
                familyName: {
                    required: true,
                    mutable: true,
                },
            },
            customAttributes: {
                userType: new cognito.StringAttribute({
                    mutable: true,
                }), // 'student' or 'teacher'
                gradeLevel: new cognito.StringAttribute({
                    mutable: true,
                }), // For students: K-12
                subjects: new cognito.StringAttribute({
                    mutable: true,
                }), // Comma-separated subject list
                bio: new cognito.StringAttribute({
                    mutable: true,
                }),
            },
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
                tempPasswordValidity: cdk.Duration.days(7),
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: environment === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
            mfa: cognito.Mfa.OPTIONAL,
            mfaSecondFactor: {
                sms: true,
                otp: true,
            },
            email: cognito.UserPoolEmail.withCognito(`noreply@${appName.toLowerCase()}.com`),
            userVerification: {
                emailSubject: `Welcome to ${appName}! Verify your email`,
                emailBody: `Hello {username},\n\nThank you for signing up for ${appName}! Your verification code is {####}.\n\nHappy Learning!\nThe ${appName} Team`,
                emailStyle: cognito.VerificationEmailStyle.CODE,
            },
            userInvitation: {
                emailSubject: `You're invited to join ${appName}!`,
                emailBody: `Hello {username},\n\nYou have been invited to join ${appName}. Your temporary password is {####}.\n\nPlease sign in and change your password.\n\nThe ${appName} Team`,
            },
        });
        this.userPool = userPool;
        // User Pool Groups
        new cognito.CfnUserPoolGroup(this, 'StudentsGroup', {
            userPoolId: userPool.userPoolId,
            groupName: 'Students',
            description: 'Group for student users',
        });
        new cognito.CfnUserPoolGroup(this, 'TeachersGroup', {
            userPoolId: userPool.userPoolId,
            groupName: 'Teachers',
            description: 'Group for teacher users',
        });
        new cognito.CfnUserPoolGroup(this, 'AdminsGroup', {
            userPoolId: userPool.userPoolId,
            groupName: 'Admins',
            description: 'Group for admin users',
        });
        // User Pool Domain
        userPool.addDomain('CognitoDomain', {
            cognitoDomain: {
                domainPrefix: `${appName.toLowerCase()}-${environment}-${this.account}`,
            },
        });
        // User Pool Client (for frontend app)
        const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool,
            userPoolClientName: `${appName}-${environment}-web-client`,
            authFlows: {
                userPassword: true,
                userSrp: true,
                custom: true,
            },
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: true,
                },
                scopes: [
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.PROFILE,
                ],
                callbackUrls: [
                    'http://localhost:3000/callback',
                    'http://localhost:3000',
                ],
                logoutUrls: [
                    'http://localhost:3000/logout',
                    'http://localhost:3000',
                ],
            },
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO,
            ],
            accessTokenValidity: cdk.Duration.hours(1),
            idTokenValidity: cdk.Duration.hours(1),
            refreshTokenValidity: cdk.Duration.days(30),
            preventUserExistenceErrors: true,
            generateSecret: false,
        });
        this.userPoolClient = userPoolClient;
        // Identity Pool for AWS credentials
        this.identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
            identityPoolName: `${appName}_${environment}_identity_pool`,
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [
                {
                    clientId: userPoolClient.userPoolClientId,
                    providerName: userPool.userPoolProviderName,
                },
            ],
        });
        // Outputs
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: `${appName}-${environment}-user-pool-id`,
        });
        new cdk.CfnOutput(this, 'UserPoolClientId', {
            value: userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID',
            exportName: `${appName}-${environment}-user-pool-client-id`,
        });
        new cdk.CfnOutput(this, 'IdentityPoolId', {
            value: this.identityPool.ref,
            description: 'Cognito Identity Pool ID',
            exportName: `${appName}-${environment}-identity-pool-id`,
        });
        new cdk.CfnOutput(this, 'UserPoolArn', {
            value: userPool.userPoolArn,
            description: 'Cognito User Pool ARN',
        });
    }
}
exports.AuthStack = AuthStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9zdGFja3MvYXV0aC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMsbURBQW1EO0FBUW5ELE1BQWEsU0FBVSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBS3RDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBcUI7UUFDN0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFdkMsb0JBQW9CO1FBQ3BCLE1BQU0sUUFBUSxHQUFHLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQ3RELFlBQVksRUFBRSxHQUFHLE9BQU8sSUFBSSxXQUFXLFlBQVk7WUFDbkQsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixhQUFhLEVBQUU7Z0JBQ2IsS0FBSyxFQUFFLElBQUk7Z0JBQ1gsUUFBUSxFQUFFLElBQUk7YUFDZjtZQUNELFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsSUFBSTthQUNaO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ2xCLEtBQUssRUFBRTtvQkFDTCxRQUFRLEVBQUUsSUFBSTtvQkFDZCxPQUFPLEVBQUUsSUFBSTtpQkFDZDtnQkFDRCxTQUFTLEVBQUU7b0JBQ1QsUUFBUSxFQUFFLElBQUk7b0JBQ2QsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7Z0JBQ0QsVUFBVSxFQUFFO29CQUNWLFFBQVEsRUFBRSxJQUFJO29CQUNkLE9BQU8sRUFBRSxJQUFJO2lCQUNkO2FBQ0Y7WUFDRCxnQkFBZ0IsRUFBRTtnQkFDaEIsUUFBUSxFQUFFLElBQUksT0FBTyxDQUFDLGVBQWUsQ0FBQztvQkFDcEMsT0FBTyxFQUFFLElBQUk7aUJBQ2QsQ0FBQyxFQUFFLHlCQUF5QjtnQkFDN0Is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QkFDeEI7b0JBQ0UsUUFBUSxFQUFFLGNBQWMsQ0FBQyxnQkFBZ0I7b0JBQ3pDLFlBQVksRUFBRSxRQUFRLENBQUMsb0JBQW9CO2lCQUM1QzthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsVUFBVTtRQUNWLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BDLEtBQUssRUFBRSxRQUFRLENBQUMsVUFBVTtZQUMxQixXQUFXLEVBQUUsc0JBQXNCO1lBQ25DLFVBQVUsRUFBRSxHQUFHLE9BQU8sSUFBSSxXQUFXLGVBQWU7U0FDckQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUMxQyxLQUFLLEVBQUUsY0FBYyxDQUFDLGdCQUFnQjtZQUN0QyxXQUFXLEVBQUUsNkJBQTZCO1lBQzFDLFVBQVUsRUFBRSxHQUFHLE9BQU8sSUFBSSxXQUFXLHNCQUFzQjtTQUM1RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3hDLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUc7WUFDNUIsV0FBVyxFQUFFLDBCQUEwQjtZQUN2QyxVQUFVLEVBQUUsR0FBRyxPQUFPLElBQUksV0FBVyxtQkFBbUI7U0FDekQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7WUFDckMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxXQUFXO1lBQzNCLFdBQVcsRUFBRSx1QkFBdUI7U0FDckMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdExELDhCQXNMQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEF1dGhTdGFja1Byb3BzIGV4dGVuZHMgY2RrLlN0YWNrUHJvcHMge1xuICBhcHBOYW1lOiBzdHJpbmc7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBdXRoU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2w6IGNvZ25pdG8uSVVzZXJQb29sO1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2xDbGllbnQ6IGNvZ25pdG8uSVVzZXJQb29sQ2xpZW50O1xuICBwdWJsaWMgcmVhZG9ubHkgaWRlbnRpdHlQb29sOiBjb2duaXRvLkNmbklkZW50aXR5UG9vbDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQXV0aFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHsgYXBwTmFtZSwgZW52aXJvbm1lbnQgfSA9IHByb3BzO1xuXG4gICAgLy8gQ29nbml0byBVc2VyIFBvb2xcbiAgICBjb25zdCB1c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tdXNlci1wb29sYCxcbiAgICAgIHNlbGZTaWduVXBFbmFibGVkOiB0cnVlLFxuICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgdXNlcm5hbWU6IHRydWUsXG4gICAgICB9LFxuICAgICAgYXV0b1ZlcmlmeToge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBzdGFuZGFyZEF0dHJpYnV0ZXM6IHtcbiAgICAgICAgZW1haWw6IHtcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBnaXZlbk5hbWU6IHtcbiAgICAgICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBmYW1pbHlOYW1lOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBjdXN0b21BdHRyaWJ1dGVzOiB7XG4gICAgICAgIHVzZXJUeXBlOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoe1xuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0pLCAvLyAnc3R1ZGVudCcgb3IgJ3RlYWNoZXInXG4gICAgICAgIGdyYWRlTGV2ZWw6IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7XG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcbiAgICAgICAgfSksIC8vIEZvciBzdHVkZW50czogSy0xMlxuICAgICAgICBzdWJqZWN0czogbmV3IGNvZ25pdG8uU3RyaW5nQXR0cmlidXRlKHtcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9KSwgLy8gQ29tbWEtc2VwYXJhdGVkIHN1YmplY3QgbGlzdFxuICAgICAgICBiaW86IG5ldyBjb2duaXRvLlN0cmluZ0F0dHJpYnV0ZSh7XG4gICAgICAgICAgbXV0YWJsZTogdHJ1ZSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiA4LFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogZmFsc2UsXG4gICAgICAgIHRlbXBQYXNzd29yZFZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cyg3KSxcbiAgICAgIH0sXG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX09OTFksXG4gICAgICByZW1vdmFsUG9saWN5OiBlbnZpcm9ubWVudCA9PT0gJ3Byb2QnXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOXG4gICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIG1mYTogY29nbml0by5NZmEuT1BUSU9OQUwsXG4gICAgICBtZmFTZWNvbmRGYWN0b3I6IHtcbiAgICAgICAgc21zOiB0cnVlLFxuICAgICAgICBvdHA6IHRydWUsXG4gICAgICB9LFxuICAgICAgZW1haWw6IGNvZ25pdG8uVXNlclBvb2xFbWFpbC53aXRoQ29nbml0byhgbm9yZXBseUAke2FwcE5hbWUudG9Mb3dlckNhc2UoKX0uY29tYCksXG4gICAgICB1c2VyVmVyaWZpY2F0aW9uOiB7XG4gICAgICAgIGVtYWlsU3ViamVjdDogYFdlbGNvbWUgdG8gJHthcHBOYW1lfSEgVmVyaWZ5IHlvdXIgZW1haWxgLFxuICAgICAgICBlbWFpbEJvZHk6IGBIZWxsbyB7dXNlcm5hbWV9LFxcblxcblRoYW5rIHlvdSBmb3Igc2lnbmluZyB1cCBmb3IgJHthcHBOYW1lfSEgWW91ciB2ZXJpZmljYXRpb24gY29kZSBpcyB7IyMjI30uXFxuXFxuSGFwcHkgTGVhcm5pbmchXFxuVGhlICR7YXBwTmFtZX0gVGVhbWAsXG4gICAgICAgIGVtYWlsU3R5bGU6IGNvZ25pdG8uVmVyaWZpY2F0aW9uRW1haWxTdHlsZS5DT0RFLFxuICAgICAgfSxcbiAgICAgIHVzZXJJbnZpdGF0aW9uOiB7XG4gICAgICAgIGVtYWlsU3ViamVjdDogYFlvdSdyZSBpbnZpdGVkIHRvIGpvaW4gJHthcHBOYW1lfSFgLFxuICAgICAgICBlbWFpbEJvZHk6IGBIZWxsbyB7dXNlcm5hbWV9LFxcblxcbllvdSBoYXZlIGJlZW4gaW52aXRlZCB0byBqb2luICR7YXBwTmFtZX0uIFlvdXIgdGVtcG9yYXJ5IHBhc3N3b3JkIGlzIHsjIyMjfS5cXG5cXG5QbGVhc2Ugc2lnbiBpbiBhbmQgY2hhbmdlIHlvdXIgcGFzc3dvcmQuXFxuXFxuVGhlICR7YXBwTmFtZX0gVGVhbWAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy51c2VyUG9vbCA9IHVzZXJQb29sO1xuXG4gICAgLy8gVXNlciBQb29sIEdyb3Vwc1xuICAgIG5ldyBjb2duaXRvLkNmblVzZXJQb29sR3JvdXAodGhpcywgJ1N0dWRlbnRzR3JvdXAnLCB7XG4gICAgICB1c2VyUG9vbElkOiB1c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZ3JvdXBOYW1lOiAnU3R1ZGVudHMnLFxuICAgICAgZGVzY3JpcHRpb246ICdHcm91cCBmb3Igc3R1ZGVudCB1c2VycycsXG4gICAgfSk7XG5cbiAgICBuZXcgY29nbml0by5DZm5Vc2VyUG9vbEdyb3VwKHRoaXMsICdUZWFjaGVyc0dyb3VwJywge1xuICAgICAgdXNlclBvb2xJZDogdXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGdyb3VwTmFtZTogJ1RlYWNoZXJzJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR3JvdXAgZm9yIHRlYWNoZXIgdXNlcnMnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNvZ25pdG8uQ2ZuVXNlclBvb2xHcm91cCh0aGlzLCAnQWRtaW5zR3JvdXAnLCB7XG4gICAgICB1c2VyUG9vbElkOiB1c2VyUG9vbC51c2VyUG9vbElkLFxuICAgICAgZ3JvdXBOYW1lOiAnQWRtaW5zJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnR3JvdXAgZm9yIGFkbWluIHVzZXJzJyxcbiAgICB9KTtcblxuICAgIC8vIFVzZXIgUG9vbCBEb21haW5cbiAgICB1c2VyUG9vbC5hZGREb21haW4oJ0NvZ25pdG9Eb21haW4nLCB7XG4gICAgICBjb2duaXRvRG9tYWluOiB7XG4gICAgICAgIGRvbWFpblByZWZpeDogYCR7YXBwTmFtZS50b0xvd2VyQ2FzZSgpfS0ke2Vudmlyb25tZW50fS0ke3RoaXMuYWNjb3VudH1gLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFVzZXIgUG9vbCBDbGllbnQgKGZvciBmcm9udGVuZCBhcHApXG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSBuZXcgY29nbml0by5Vc2VyUG9vbENsaWVudCh0aGlzLCAnVXNlclBvb2xDbGllbnQnLCB7XG4gICAgICB1c2VyUG9vbCxcbiAgICAgIHVzZXJQb29sQ2xpZW50TmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0td2ViLWNsaWVudGAsXG4gICAgICBhdXRoRmxvd3M6IHtcbiAgICAgICAgdXNlclBhc3N3b3JkOiB0cnVlLFxuICAgICAgICB1c2VyU3JwOiB0cnVlLFxuICAgICAgICBjdXN0b206IHRydWUsXG4gICAgICB9LFxuICAgICAgb0F1dGg6IHtcbiAgICAgICAgZmxvd3M6IHtcbiAgICAgICAgICBhdXRob3JpemF0aW9uQ29kZUdyYW50OiB0cnVlLFxuICAgICAgICAgIGltcGxpY2l0Q29kZUdyYW50OiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBzY29wZXM6IFtcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuRU1BSUwsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRCxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRSxcbiAgICAgICAgXSxcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbXG4gICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9jYWxsYmFjaycsXG4gICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXG4gICAgICAgIF0sXG4gICAgICAgIGxvZ291dFVybHM6IFtcbiAgICAgICAgICAnaHR0cDovL2xvY2FsaG9zdDozMDAwL2xvZ291dCcsXG4gICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgc3VwcG9ydGVkSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAgY29nbml0by5Vc2VyUG9vbENsaWVudElkZW50aXR5UHJvdmlkZXIuQ09HTklUTyxcbiAgICAgIF0sXG4gICAgICBhY2Nlc3NUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICBpZFRva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgIHJlZnJlc2hUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cygzMCksXG4gICAgICBwcmV2ZW50VXNlckV4aXN0ZW5jZUVycm9yczogdHJ1ZSxcbiAgICAgIGdlbmVyYXRlU2VjcmV0OiBmYWxzZSxcbiAgICB9KTtcblxuICAgIHRoaXMudXNlclBvb2xDbGllbnQgPSB1c2VyUG9vbENsaWVudDtcblxuICAgIC8vIElkZW50aXR5IFBvb2wgZm9yIEFXUyBjcmVkZW50aWFsc1xuICAgIHRoaXMuaWRlbnRpdHlQb29sID0gbmV3IGNvZ25pdG8uQ2ZuSWRlbnRpdHlQb29sKHRoaXMsICdJZGVudGl0eVBvb2wnLCB7XG4gICAgICBpZGVudGl0eVBvb2xOYW1lOiBgJHthcHBOYW1lfV8ke2Vudmlyb25tZW50fV9pZGVudGl0eV9wb29sYCxcbiAgICAgIGFsbG93VW5hdXRoZW50aWNhdGVkSWRlbnRpdGllczogZmFsc2UsXG4gICAgICBjb2duaXRvSWRlbnRpdHlQcm92aWRlcnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGNsaWVudElkOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgICAgIHByb3ZpZGVyTmFtZTogdXNlclBvb2wudXNlclBvb2xQcm92aWRlck5hbWUsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIElEJyxcbiAgICAgIGV4cG9ydE5hbWU6IGAke2FwcE5hbWV9LSR7ZW52aXJvbm1lbnR9LXVzZXItcG9vbC1pZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xDbGllbnRJZCcsIHtcbiAgICAgIHZhbHVlOiB1c2VyUG9vbENsaWVudC51c2VyUG9vbENsaWVudElkLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIFVzZXIgUG9vbCBDbGllbnQgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0tdXNlci1wb29sLWNsaWVudC1pZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSWRlbnRpdHlQb29sSWQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5pZGVudGl0eVBvb2wucmVmLFxuICAgICAgZGVzY3JpcHRpb246ICdDb2duaXRvIElkZW50aXR5IFBvb2wgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogYCR7YXBwTmFtZX0tJHtlbnZpcm9ubWVudH0taWRlbnRpdHktcG9vbC1pZGAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVXNlclBvb2xBcm4nLCB7XG4gICAgICB2YWx1ZTogdXNlclBvb2wudXNlclBvb2xBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIEFSTicsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==