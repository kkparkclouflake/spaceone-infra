import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';

import * as fs from 'fs';

// import { DomainProps } from '../props/domain-props';

export class AwsUser extends cdk.Construct {
    public readonly secretId: string;
    public readonly secretKey: string;

    constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
        super(scope, id);

        // SpaceONE 에서 사용할 Secret Service 접근용 Aws User 생성
        let secretServiceUser = new iam.User(scope, 'spaceone-user', {
            userName: 'spaceone.secret-service',
            path: '/',
        })

        // Load IAM Policy from file
        let iamPolicyFile = fs.readFileSync('./res/iam/policies/spaceone-secret-service-user-iam-policy.json').toString();

        // Replace strings
        iamPolicyFile = iamPolicyFile.replace(new RegExp('\\${var.region}', 'gi'), props.env?.region!);
        iamPolicyFile = iamPolicyFile.replace(new RegExp('\\${data.aws_caller_identity.current.account_id}', 'gi'), props.env?.account!);
        
        // Parse Policy
        let iamPolicyDocument = JSON.parse(iamPolicyFile);
        
        // Create IAM Policy
        const iamPolicy = new iam.Policy(scope, 'spaceone.secret-service', {
            policyName: 'spaceone.secret-service',
            document: iam.PolicyDocument.fromJson(iamPolicyDocument),
        });

        // Attach IAM role
        secretServiceUser.attachInlinePolicy(iamPolicy);

        let accessKey = new iam.CfnAccessKey(scope, 'spaceone-user-access-key', {
            userName: secretServiceUser.userName
        })
        
        // 해당 값을 Output 으로 설정 (사용자에게 표시되도록)
        const accessKeyId = new cdk.CfnOutput(this, "AccessKeyId", {
            value: accessKey.ref,
        });

        const accessKeySecret = new cdk.CfnOutput(this, "AccessKeySecret", {
            value: accessKey.attrSecretAccessKey,
        });

        this.secretId = accessKey.ref;
        this.secretKey = accessKey.attrSecretAccessKey;
    }
}