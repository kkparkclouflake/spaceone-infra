import * as cdk from '@aws-cdk/core';

export interface SecretProps extends cdk.StackProps {
    secretId: string,
    secretPassword: string
}