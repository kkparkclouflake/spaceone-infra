import * as cdk from '@aws-cdk/core';
export interface DatabaseProps extends cdk.StackProps {
    endpoint: string,
    username: string,
    password: string
}